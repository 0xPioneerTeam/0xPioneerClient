import { _decorator, Button, Color, Component, EditBox, instantiate, Label, Layout, Node, Prefab, ScrollView, Slider, Sprite, UITransform, v2, Vec3 } from "cc";
import { SettlementView } from "./View/SettlementView";
import { LanMgr } from "../Utils/Global";
import ViewController from "../BasicView/ViewController";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import UIPanelManger from "../Basic/UIPanelMgr";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("NewSettlementUI")
export class NewSettlementUI extends ViewController {
    public refreshUI(beginLevel: number, endLevel: number) {
        this._beginLevel = beginLevel;
        this._endLevel = endLevel;
        // useLanMgr
        // this.node.getChildByPath("SummaryContent/Title").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("SummaryContent/BottomTitle").getComponent(Label).string = LanMgr.getLanById("107549");
        this.node.getChildByPath("SummaryContent/Content").getComponent(SettlementView).refreshUI(beginLevel, endLevel);
    }

    private _beginLevel: number;
    private _endLevel: number;
    protected viewDidLoad(): void {
        super.viewDidLoad();

        NotificationMgr.addListener(NotificationName.CHANGE_LANG, this._onLangChanged, this);
        NotificationMgr.addListener(NotificationName.SETTLEMENT_DATA_CHANGE, this.refreshUI, this);
    }
    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.CHANGE_LANG, this._onLangChanged, this);
        NotificationMgr.removeListener(NotificationName.SETTLEMENT_DATA_CHANGE, this.refreshUI, this);
    }

    private _onLangChanged() {
        if (this._beginLevel != null && this._endLevel != null) {
            this.refreshUI(this._beginLevel, this._endLevel);
        }
    }

    //----------------------------------------------------------------------
    // action
    private onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.popPanel(this.node);
    }
}
