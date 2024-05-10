import { _decorator, Component, Label, log, Node, Sprite, SpriteFrame, Button, ProgressBar } from 'cc';
import { LanMgr, PioneerMgr } from '../Utils/Global';
import { MapPioneerActionType, MapPioneerEventStatus, MapPioneerType, MapPlayerPioneerObject } from '../Const/PioneerDefine';
import { DataMgr } from '../Data/DataMgr';
const { ccclass, property } = _decorator;

@ccclass('PlayerItemUI')
export class PlayerItemUI extends Component {

    refreshUI(model: MapPlayerPioneerObject) {
        //name
        this._nameLabel.string = model.NFT != null ? model.name : LanMgr.getLanById(model.name);
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
        if (model.actionType == MapPioneerActionType.idle) {
            idle.active = true;

        } else if (model.actionType == MapPioneerActionType.defend) {
            defend.active = true;

        } else {
            busy.active = true;
        }
        // eventremind
        this.node.getChildByName("EventRemind").active = model.actionType == MapPioneerActionType.eventing && model.eventStatus == MapPioneerEventStatus.Waited;
        //selected
        this._selectedView.active = DataMgr.s.pioneer.getCurrentPlayer().id == model.id;
        //rebirth
        this._rebirthCountView.active = model.rebirthCountTime > 0;
        this._rebirthCountView.getChildByName("Label").getComponent(Label).string = model.rebirthCountTime + "s";
        //hp
        this._hpView.getChildByName("progressBar").getComponent(ProgressBar).progress = model.hp / model.hpMax;
        this._hpView.getChildByName("Value").getComponent(Label).string = model.hp.toString();
    }

    private _roleNames: string[] = [
        "secretGuard",
        "doomsdayGangSpy",
        "rebels",
    ];

    private _nameLabel: Label = null;
    private _statusView: Node = null;
    private _rebirthCountView: Node = null;
    private _selectedView: Node = null;
    private _hpView: Node = null;
    protected onLoad(): void {
        this._nameLabel = this.node.getChildByName("name").getComponent(Label);
        this._statusView = this.node.getChildByName("status");
        this._rebirthCountView = this.node.getChildByName("RebirthCount");
        this._selectedView = this.node.getChildByName("Selected");
        this._hpView = this.node.getChildByName("Hp");
    }
    start() {

    }
}


