import { _decorator, Component, Label, log, Node, Sprite, SpriteFrame, Button, ProgressBar, NodeEventType } from "cc";
import { LanMgr, PioneerMgr } from "../Utils/Global";
import { MapPioneerActionType, MapPlayerPioneerObject } from "../Const/PioneerDefine";
import { DataMgr } from "../Data/DataMgr";
import CommonTools from "../Tool/CommonTools";
import TroopsConfig from "../Config/TroopsConfig";
const { ccclass, property } = _decorator;

@ccclass("PlayerItemUI")
export class PlayerItemUI extends Component {
    refreshUI(model: MapPlayerPioneerObject) {
        this._nameLabel = this.node.getChildByName("name").getComponent(Label);
        this._statusView = this.node.getChildByName("status");
        this._rebirthCountView = this.node.getChildByName("RebirthCount");
        this._selectedView = this.node.getChildByName("Selected");
        this._hpView = this.node.getChildByName("Hp");
        //name
        this._nameLabel.string = LanMgr.getLanById(model.name);
        //role
        let isSelf: boolean = true;
        for (const name of this._roleNames) {
            this.node.getChildByPath("bg/" + name).active = name == model.animType;
            if (this.node.getChildByPath("bg/" + name).active) {
                isSelf = false;
            }
        }
        this.node.getChildByPath("bg/pioneer_default").active = isSelf;
        //status
        const busy = this._statusView.getChildByName("icon_busy");
        const idle = this._statusView.getChildByName("icon_idle");
        const defend = this._statusView.getChildByName("icon_defend");

        busy.active = false;
        idle.active = false;
        defend.active = false;
        if (model.actionType == MapPioneerActionType.inCity || model.actionType == MapPioneerActionType.staying) {
            idle.active = true;
        } else if (model.actionType == MapPioneerActionType.defend) {
            defend.active = true;
        } else {
            busy.active = true;
        }
        //selected
        this._selectedView.active = DataMgr.s.pioneer.getInteractSelectUnqueId() == model.uniqueId;
        //hp
        if (model.troopId != null && model.troopId != "" && model.troopId != "0") {
            this._hpRate = parseInt(TroopsConfig.getById(model.troopId).hp_training);
        }
        this._hpView.getChildByName("progressBar").getComponent(ProgressBar).progress = model.hp / (model.hpMax * this._hpRate);
        this._hpView.getChildByName("Value").getComponent(Label).string = model.hp.toString();

        this._hpView.getChildByName("EProgressBar").getComponent(ProgressBar).progress = model.energy / model.energyMax;

        this._model = model;
    }

    private _roleNames: string[] = ["secretGuard", "doomsdayGangSpy", "rebels"];

    private _model: MapPlayerPioneerObject = null;
    private _hpRate: number = 1;

    private _nameLabel: Label = null;
    private _statusView: Node = null;
    private _rebirthCountView: Node = null;
    private _selectedView: Node = null;
    private _hpView: Node = null;
    protected onLoad(): void {
        this.node.getChildByPath("Hp").on(NodeEventType.MOUSE_ENTER, this.onMouseEnter, this);
        this.node.getChildByPath("Hp").on(NodeEventType.MOUSE_LEAVE, this.onMouseLeave, this);
    }
    start() {}

    protected update(dt: number): void {
        this._rebirthCountView.active = false;
        if (this._model == null) {
            return;
        }
        this.node.getChildByName("EventRemind").active = false;
        const currentTimestamp = new Date().getTime();
        if (this._model.actionType == MapPioneerActionType.dead) {
            if (currentTimestamp < this._model.rebirthEndTime) {
                this._rebirthCountView.active = true;
                this._rebirthCountView.getChildByName("Label").getComponent(Label).string =
                    Math.floor((this._model.rebirthEndTime - currentTimestamp) / 1000) + "s";
            }
        } else if (this._model.actionType == MapPioneerActionType.eventing) {
            this.node.getChildByName("EventRemind").active = currentTimestamp >= this._model.actionEndTimeStamp;
        }
    }

    //--------------------------- action
    private onMouseEnter() {
        if (this._model == null) {
            return;
        }
        const view = this.node.getChildByPath("HpTipView");
        view.active = true;
        view.getChildByPath("HpValue").getComponent(Label).string = "HP" + this._model.hp + "/" + (this._model.hpMax * this._hpRate);
        view.getChildByPath("ApValue").getComponent(Label).string = "STM" + this._model.energy + "/" + this._model.energyMax;
    }
    private onMouseLeave() {
        const view = this.node.getChildByPath("HpTipView");
        view.active = false;
    }
}
