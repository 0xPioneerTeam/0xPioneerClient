import {
    Component,
    Label,
    ProgressBar,
    Node,
    Sprite,
    _decorator,
    Tween,
    v3,
    warn,
    EventHandler,
    Button,
    randomRangeInt,
    UIOpacity,
    instantiate,
    tween,
} from "cc";
import { ResourceCorrespondingItem } from "../Const/ConstDefine";
import { UIName } from "../Const/ConstUIDefine";
import { CivilizationLevelUpUI } from "./CivilizationLevelUpUI";
import NotificationMgr from "../Basic/NotificationMgr";
import LvlupConfig from "../Config/LvlupConfig";
import { NotificationName } from "../Const/Notification";
import UIPanelManger from "../Basic/UIPanelMgr";
import { DataMgr } from "../Data/DataMgr";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
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
    }

    start() {
        this.refreshTopUI();
    }

    protected onDestroy(): void {
        NotificationMgr.removeListener(NotificationName.ITEM_CHANGE, this.refreshTopUI, this);
        NotificationMgr.removeListener(NotificationName.USERINFO_DID_CHANGE_NAME, this.refreshTopUI, this);
        NotificationMgr.removeListener(NotificationName.USERINFO_DID_CHANGE_EXP, this._onPlayerExpChanged, this);
        NotificationMgr.removeListener(NotificationName.USERINFO_DID_CHANGE_LEVEL, this._onPlayerLvlupChanged, this);
    }

    refreshTopUI() {
        const info = DataMgr.s.userInfo.data;
        this.txtPlayerName.string = info.name;
        this.txtPlayerLV.string = "C.LV" + info.level;
        this.txtLvProgress.string = `${info.exp}/${1000}`;
        this.txtMoney.string = DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Gold).toString();
        this.txtEnergy.string = DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Energy).toString();

        const lvlupConfig = LvlupConfig.getById(info.level.toString());
        const maxExp = lvlupConfig.exp;
        this.lvProgress.progress = Math.min(1, info.exp / maxExp);
        this.node.getChildByPath("progressLv/txtLvProgress").getComponent(Label).string = info.exp + "/" + maxExp;

        const resourceView = this.node.getChildByName("Resource");
        resourceView.getChildByPath("Food/Label").getComponent(Label).string = DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Food).toString();
        resourceView.getChildByPath("Wood/Label").getComponent(Label).string = DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Wood).toString();
        resourceView.getChildByPath("Stone/Label").getComponent(Label).string = DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Stone).toString();
        resourceView.getChildByPath("Troops/Label").getComponent(Label).string = DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Troop).toString();
    }

    private _playExpGettedAnim(expValue: number, playOver: () => void = null) {
        if (expValue == 0) {
            return;
        }
        const animNode: Node = instantiate(this._expAnimLabel.node);
        animNode.setParent(this._expAnimLabel.node.parent);
        animNode.active = true;
        animNode.getComponent(Label).string = expValue > 0 ? ("+" + expValue) : expValue.toString();
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
        await UIPanelManger.inst.pushPanel(UIName.PlayerInfoUI);
    }
    //----------------------------------------------- notification
    private _onPlayerExpChanged(data: { exp: number }): void {
        this._playExpGettedAnim(data.exp, () => {
            this.refreshTopUI();
        });
    }
    private async _onPlayerLvlupChanged(): Promise<void> {
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
