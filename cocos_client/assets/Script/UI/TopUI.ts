import { Component, Label, ProgressBar, Node, Sprite, _decorator, v3, instantiate, tween } from "cc";
import { ResourceCorrespondingItem } from "../Const/ConstDefine";
import { UIName } from "../Const/ConstUIDefine";
import { CivilizationLevelUpUI } from "./CivilizationLevelUpUI";
import NotificationMgr from "../Basic/NotificationMgr";
import LvlupConfig from "../Config/LvlupConfig";
import { NotificationName } from "../Const/Notification";
import UIPanelManger from "../Basic/UIPanelMgr";
import { DataMgr } from "../Data/DataMgr";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
import { ClvlMgr, GameMgr } from "../Utils/Global";
import { RedPointView } from "./View/RedPointView";
import { InteractChainUI } from "./InteractChain/InteractChainUI";
const { ccclass, property } = _decorator;

@ccclass("TopUI")
export default class TopUI extends Component {
    @property(Label)
    txtPlayerName: Label = null;

    @property(Label)
    txtPlayerLV: Label = null;

    @property(Label)
    txtLvProgress: Label = null;

    @property(Label)
    txtMoney: Label = null;

    @property(Label)
    txtEnergy: Label = null;

    @property(ProgressBar)
    lvProgress: ProgressBar = null;

    @property(Sprite)
    sprPlayerHead: Sprite = null;

    private _expAnimLabel: Label = null;
    protected onLoad(): void {
        this._expAnimLabel = this.node.getChildByPath("progressLv/AnimLabel").getComponent(Label);
        this._expAnimLabel.node.active = false;

        NotificationMgr.addListener(NotificationName.ITEM_CHANGE, this.refreshTopUI, this);
        NotificationMgr.addListener(NotificationName.USERINFO_DID_CHANGE_NAME, this.refreshTopUI, this);
        NotificationMgr.addListener(NotificationName.USERINFO_DID_CHANGE_EXP, this._onPlayerExpChanged, this);
        NotificationMgr.addListener(NotificationName.USERINFO_DID_CHANGE_LEVEL, this._onPlayerLvlupChanged, this);
        NotificationMgr.addListener(NotificationName.USERINFO_DID_CHANGE_HEAT, this.refreshTopUI, this);
        NotificationMgr.addListener(NotificationName.USERINFO_CLVL_CONDTION_CHANGE, this.refreshTopUI, this);
        NotificationMgr.addListener(NotificationName.INNER_BUILDING_UPGRADE_FINISHED, this.refreshTopUI, this);
        NotificationMgr.addListener(NotificationName.INNER_BUILDING_DATA_CHANGE, this.refreshTopUI, this);
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_HP_CHANGED, this.refreshTopUI, this);
    }

    start() {
        this.refreshTopUI();
    }

    protected onDestroy(): void {
        NotificationMgr.removeListener(NotificationName.ITEM_CHANGE, this.refreshTopUI, this);
        NotificationMgr.removeListener(NotificationName.USERINFO_DID_CHANGE_NAME, this.refreshTopUI, this);
        NotificationMgr.removeListener(NotificationName.USERINFO_DID_CHANGE_EXP, this._onPlayerExpChanged, this);
        NotificationMgr.removeListener(NotificationName.USERINFO_DID_CHANGE_LEVEL, this._onPlayerLvlupChanged, this);
        NotificationMgr.removeListener(NotificationName.USERINFO_DID_CHANGE_HEAT, this.refreshTopUI, this);
        NotificationMgr.removeListener(NotificationName.USERINFO_CLVL_CONDTION_CHANGE, this.refreshTopUI, this);
        NotificationMgr.removeListener(NotificationName.INNER_BUILDING_UPGRADE_FINISHED, this.refreshTopUI, this);
        NotificationMgr.removeListener(NotificationName.INNER_BUILDING_DATA_CHANGE, this.refreshTopUI, this);
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_HP_CHANGED, this.refreshTopUI, this);
    }

    refreshTopUI() {
        const info = DataMgr.s.userInfo.data;
        this.txtPlayerName.string = info.name;
        this.txtPlayerLV.string = "C.LV" + info.level;
        this.txtMoney.string = DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Gold).toString();
        this.txtEnergy.string = DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Energy).toString();

        const levelUpFinishCondition = ClvlMgr.getCurretLevelUpFinishCondition();
        this.txtLvProgress.string = levelUpFinishCondition.value + "/" + levelUpFinishCondition.total;
        this.lvProgress.progress = Math.min(1, levelUpFinishCondition.value / levelUpFinishCondition.total);
        this.node
            .getChildByPath("RedPointView")
            .getComponent(RedPointView)
            .refreshUI(levelUpFinishCondition.value >= levelUpFinishCondition.total ? 1 : 0, false);

        const resourceView = this.node.getChildByName("Resource");
        resourceView.getChildByPath("Food/Label").getComponent(Label).string = DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Food).toString();
        resourceView.getChildByPath("Wood/Label").getComponent(Label).string = DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Wood).toString();
        resourceView.getChildByPath("Stone/Label").getComponent(Label).string = DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Stone).toString();

        resourceView.getChildByPath("Troops/Label").getComponent(Label).string = GameMgr.getAllTroopNum() + "/" + GameMgr.getMaxTroopNum();
    }

    private _playExpGettedAnim(expValue: number, playOver: () => void = null) {
        if (expValue == 0) {
            return;
        }
        const animNode: Node = instantiate(this._expAnimLabel.node);
        animNode.setParent(this._expAnimLabel.node.parent);
        animNode.active = true;
        animNode.getComponent(Label).string = expValue > 0 ? "+" + expValue : expValue.toString();
        animNode.position = v3(animNode.position.x, animNode.position.y - 30, animNode.position.z);
        tween(animNode)
            .to(0.4, { position: v3(animNode.position.x, animNode.position.y + 30, animNode.position.z) })
            .call(() => {
                animNode.destroy();
                if (playOver != null) {
                    playOver();
                }
            })
            .start();
    }

    //------------------------------------------------ action
    private async onTapPlayerInfo() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (UIPanelManger.inst.getPanelByName(UIName.PlayerInfoUI) != null) {
            return;
        }
        await UIPanelManger.inst.pushPanel(UIName.PlayerInfoUI);
    }
    private async onTapConvert(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const result = await UIPanelManger.inst.pushPanel(UIName.InteractChainUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(InteractChainUI).configuration(parseInt(customEventData));
    }
    //----------------------------------------------- notification
    private _onPlayerExpChanged(data: { exp: number }): void {
        // this._playExpGettedAnim(data.exp, () => {
        //     this.refreshTopUI();
        // });
        this.refreshTopUI();
    }
    private async _onPlayerLvlupChanged(): Promise<void> {
        this.refreshTopUI();
        const currentLevel: number = DataMgr.s.userInfo.data.level;
        const levelConfig = LvlupConfig.getById(currentLevel.toString());
        if (levelConfig != null) {
            const result = await UIPanelManger.inst.pushPanel(UIName.CivilizationLevelUpUI);
            if (result.success) {
                result.node.getComponent(CivilizationLevelUpUI).refreshUI(levelConfig);
            }
        }
    }
}
