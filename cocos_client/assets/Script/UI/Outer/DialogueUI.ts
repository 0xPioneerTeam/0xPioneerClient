import { _decorator, Button, Component, EventHandler, instantiate, Label, Layout, Node, UITransform, v3 } from "cc";
import { NPCNameLangType } from "../../Const/ConstDefine";
import { LanMgr, UserInfoMgr } from "../../Utils/Global";
import ViewController from "../../BasicView/ViewController";
import { UIName } from "../../Const/ConstUIDefine";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import { ItemGettedUI } from "../ItemGettedUI";
import { TalkConfigData } from "../../Const/Talk";
import UIPanelManger from "../../Basic/UIPanelMgr";
import { DataMgr } from "../../Data/DataMgr";
import { NetworkMgr } from "../../Net/NetworkMgr";
import { s2c_user } from "../../Net/msg/WebsocketMsg";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import { RookieStep } from "../../Const/RookieDefine";
import TaskConfig from "../../Config/TaskConfig";
const { ccclass, property } = _decorator;

@ccclass("DialogueUI")
export class DialogueUI extends ViewController {
    public dialogShow(talk: TalkConfigData, talkOverCallback: () => void = null) {
        if (talk.messsages == null || talk.messsages.length <= 0) {
            UIPanelManger.inst.popPanel(this.node);
            return;
        }
        this._talk = talk;
        this._talkOverCallback = talkOverCallback;
        this._dialogStep = 0;
        this._refreshUI();
    }

    private _talk: TalkConfigData = null;
    private _talkOverCallback: () => void;
    private _dialogStep: number = 0;
    private _roleNames: string[] = ["artisan", "doomsdayGangBigTeam", "doomsdayGangSpy", "doomsdayGangTeam", "hunter", "prophetess", "rebels", "secretGuard"];
    private _roleViewNameMap: Map<NPCNameLangType, string> = new Map();
    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._roleViewNameMap.set(NPCNameLangType.Artisan, "artisan");
        this._roleViewNameMap.set(NPCNameLangType.DoomsdayGangBigTeam, "doomsdayGangBigTeam");
        this._roleViewNameMap.set(NPCNameLangType.DoomsdayGangSpy, "doomsdayGangSpy");
        this._roleViewNameMap.set(NPCNameLangType.Hunter, "hunter");
        this._roleViewNameMap.set(NPCNameLangType.Prophetess, "prophetess");
        this._roleViewNameMap.set(NPCNameLangType.SecretGuard, "secretGuard");

        NetworkMgr.websocket.on("player_talk_select_res", this._on_player_talk_select_res);

        NotificationMgr.addListener(NotificationName.CHANGE_LANG, this._refreshUI, this);

        NotificationMgr.addListener(NotificationName.ROOKIE_GUIDE_TAP_DIALOGUE, this._onRookieTapThis, this);
    }

    protected viewDidStart(): void {}

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NetworkMgr.websocket.off("player_talk_select_res", this._on_player_talk_select_res);

        NotificationMgr.removeListener(NotificationName.CHANGE_LANG, this._refreshUI, this);

        NotificationMgr.removeListener(NotificationName.ROOKIE_GUIDE_TAP_DIALOGUE, this._onRookieTapThis, this);
    }

    private async _refreshUI() {
        if (this._talk == null || this._dialogStep > this._talk.messsages.length - 1) {
            return;
        }

        // useLanMgr
        // this.node.getChildByPath("Dialog/NextButton/Label").getComponent(Label).string = LanMgr.getLanById("107549");

        const dialogView = this.node.getChildByName("Dialog");
        const selectView = this.node.getChildByName("SelectView");

        dialogView.getChildByName("NextButton").active = true;
        dialogView.getChildByName("dialog_bg").getComponent(Button).interactable = true;

        const currentMesssage = this._talk.messsages[this._dialogStep];
        if (currentMesssage.type == null || currentMesssage.type == "0") {
            dialogView.active = true;
            selectView.active = false;
            dialogView.getChildByName("name_bg").active = false;
            dialogView.getChildByName("player_name").active = false;
            if (currentMesssage.name == NPCNameLangType.DefaultPlayer) {
                dialogView.getChildByName("player_name").active = true;
                dialogView.getChildByPath("player_name/Label").getComponent(Label).string = DataMgr.s.userInfo.data.name;
            } else if (LanMgr.getLanById(currentMesssage.name).indexOf("LanguageErr") == -1) {
                dialogView.getChildByName("name_bg").active = true;
                dialogView.getChildByPath("name_bg/Label").getComponent(Label).string = LanMgr.getLanById(currentMesssage.name);
            }

            dialogView.getChildByPath("dialog_bg/Label").getComponent(Label).string = LanMgr.getLanById(currentMesssage.text);

            let isRoleShow: boolean = false;
            for (const roleName of this._roleNames) {
                if (this._roleViewNameMap) {
                    dialogView.getChildByName(roleName).active = roleName == this._roleViewNameMap.get(currentMesssage.name);
                    if (dialogView.getChildByName(roleName).active) {
                        isRoleShow = true;
                    }
                }
            }
            if (dialogView.getChildByName("name_bg").active) {
                dialogView.getChildByName("name_bg").position = isRoleShow
                    ? v3(-302, dialogView.getChildByName("name_bg").position.y)
                    : v3(-651, dialogView.getChildByName("name_bg").position.y);
            }
        } else if (currentMesssage.type == "1") {
            if (currentMesssage.text != undefined) {
                dialogView.active = true;
                dialogView.getChildByName("name_bg").active = false;
                dialogView.getChildByName("player_name").active = false;

                dialogView.getChildByPath("dialog_bg/Label").getComponent(Label).string = LanMgr.getLanById(currentMesssage.text);

                for (const roleName of this._roleNames) {
                    dialogView.getChildByName(roleName).active = false;
                }
            } else {
                dialogView.active = false;
            }
            selectView.active = true;
            dialogView.getChildByName("NextButton").active = false;
            dialogView.getChildByName("dialog_bg").getComponent(Button).interactable = false;

            for (let i = 0; i < 3; i++) {
                const button = selectView.getChildByName("Button_" + i);
                if (i < currentMesssage.select.length) {
                    button.active = true;

                    button.getChildByName("Label").getComponent(Label).string = LanMgr.getLanById(currentMesssage.select[i]);

                    button.getComponent(Button).clickEvents[0].customEventData = i.toString();
                } else {
                    button.active = false;
                }
            }
        }

        let view: Node = null;
        const rookieStep: RookieStep = DataMgr.s.userInfo.data.rookieStep;
        if (rookieStep != RookieStep.FINISH) {
            if (currentMesssage.select != null && currentMesssage.select.length > 0) {
                view = selectView.getChildByName("Button_0");
            } else {
                view = dialogView.getChildByName("dialog_bg");
            }
        }
        if (view != null) {
            // -1: next  >=0: action
            let tapIndex: string = "-1";
            if (currentMesssage.select != null && currentMesssage.select.length > 0) {
                tapIndex = view.getComponent(Button).clickEvents[0].customEventData;
            }
            NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_NEED_MASK_SHOW, { tag: "dialogue", view: view, tapIndex: tapIndex });
        }
    }

    private _talkOver() {
        //talk over
        const talkId = this._talk.id;
        if (UserInfoMgr.afterTalkItemGetData.has(talkId)) {
            setTimeout(async () => {
                if (UIPanelManger.inst.panelIsShow(UIName.CivilizationLevelUpUI) || UIPanelManger.inst.panelIsShow(UIName.SecretGuardGettedUI)) {
                    UserInfoMgr.afterCivilizationClosedShowItemDatas.push(...UserInfoMgr.afterTalkItemGetData.get(talkId));
                } else {
                    const result = await UIPanelManger.inst.pushPanel(UIName.ItemGettedUI);
                    if (result.success) {
                        result.node.getComponent(ItemGettedUI).showItem(UserInfoMgr.afterTalkItemGetData.get(talkId));
                    }
                }
                UserInfoMgr.afterTalkItemGetData.delete(talkId);
            });
        }
        // talk used
        if (this._talkOverCallback != null) {
            this._talkOverCallback();
        }

        NotificationMgr.triggerEvent(NotificationName.TALK_FINISH, { talkId: talkId });
    }

    private _checkLastestStepRejectGetTask(selectIndex: number): boolean {
        if (DataMgr.s.userInfo.data.rookieStep != RookieStep.FINISH) {
            return false;
        }
        if (this._talk == null) {
            return false;
        }
        if (this._dialogStep + 1 >= this._talk.messsages.length) {
            const allTaskConfigs = TaskConfig.getAll();
            for (const key in allTaskConfigs) {
                if (Object.prototype.hasOwnProperty.call(allTaskConfigs, key)) {
                    const element = allTaskConfigs[key];
                    const condition = element.take_con[1];
                    if (condition[0] == 1 && condition[1] == this._talk.id && condition[2] != selectIndex) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    //------------------------------------------------ action
    private onTapNext() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._talk == null) {
            return;
        }
        if (this._checkLastestStepRejectGetTask(-1)) {
            UIPanelManger.inst.popPanel(this.node);
            return;
        }
        NetworkMgr.websocketMsg.player_talk_select({
            talkId: this._talk.id,
            selectIndex: -1,
            currStep: this._dialogStep + 1,
        });
    }

    private onTapAction(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._talk == null) {
            return;
        }
        const selectIndex = parseInt(customEventData);
        if (this._checkLastestStepRejectGetTask(selectIndex)) {
            UIPanelManger.inst.popPanel(this.node);
            return;
        }
        NetworkMgr.websocketMsg.player_talk_select({
            talkId: this._talk.id,
            selectIndex: selectIndex,
            currStep: this._dialogStep + 1,
        });
    }

    //------------------------------------------------ notificaiton
    private _onRookieTapThis(data: { tapIndex: string }) {
        if (data.tapIndex == "-1") {
            this.onTapNext();
        } else {
            this.onTapAction(null, data.tapIndex);
        }
    }
    //------------------------------------------------ socket notification
    private _on_player_talk_select_res = (e: any) => {
        const p: s2c_user.Iplayer_talk_select_res = e.data;
        if (p.res !== 1) {
            return;
        }
        if (this._talk == null) {
            return;
        }
        const talkId = p.talkId;
        const selectIndex = p.selectIndex;

        if (this._talk.id != talkId) {
            return;
        }

        if (selectIndex == -1) {
            this._dialogStep += 1;
            if (this._dialogStep > this._talk.messsages.length - 1) {
                UIPanelManger.inst.popPanel(this.node);
                this._talkOver();
            } else {
                this._refreshUI();
            }
        } else {
            //send socket
            this._dialogStep += 1;
            if (this._dialogStep > this._talk.messsages.length - 1) {
                UIPanelManger.inst.popPanel(this.node);
                this._talkOver();
            } else {
                this._refreshUI();
            }
        }
    };
}
