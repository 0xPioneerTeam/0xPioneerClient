import { _decorator, Component, EditBox, EventTouch, Label, Node, ProgressBar, Slider, tween, v3 } from "cc";
import ViewController from "../../BasicView/ViewController";
import { MapPlayerPioneerObject } from "../../Const/PioneerDefine";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import UIPanelManger from "../../Basic/UIPanelMgr";
import { UIName } from "../../Const/ConstUIDefine";
import { PlayerInfoItem } from "../View/PlayerInfoItem";
import { DataMgr } from "../../Data/DataMgr";
import { ResourceCorrespondingItem } from "../../Const/ConstDefine";
import { RecruitUI } from "../Inner/RecruitUI";
import { NetworkMgr } from "../../Net/NetworkMgr";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import ItemData from "../../Const/Item";
const { ccclass, property } = _decorator;

@ccclass("PlayerDispatchDetailUI")
export class PlayerDispatchDetailUI extends ViewController {
    private _infos: MapPlayerPioneerObject[] = [];
    private _showIndex: number = 0;
    private _addTroopNum: number = 0;
    private _holdTime: number = 0;
    private _holdLimitTrigger: boolean = false;
    private _holdInterval: number = null;

    private _infoItem: Node = null;
    private _atkLabel: Label = null;
    private _defLabel: Label = null;
    private _hpLabel: Label = null;
    private _speedLabel: Label = null;
    private _intLabel: Label = null;

    private _troopProgress: ProgressBar = null;
    private _troopSlider: Slider = null;
    private _troopLeftLabel: Label = null;
    private _troopAddEditBox: EditBox = null;

    public configuration(infos: MapPlayerPioneerObject[], showIndex: number) {
        this._infos = infos;
        this._showIndex = showIndex;
        this._refreshUI();
    }

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._infoItem = this.node.getChildByPath("ContentView/Info");
        this._atkLabel = this.node.getChildByPath("ContentView/PropertyView/ATK/Value").getComponent(Label);
        this._defLabel = this.node.getChildByPath("ContentView/PropertyView/DEF/Value").getComponent(Label);
        this._hpLabel = this.node.getChildByPath("ContentView/PropertyView/HP/Value").getComponent(Label);
        this._speedLabel = this.node.getChildByPath("ContentView/PropertyView/SPD/Value").getComponent(Label);
        this._intLabel = this.node.getChildByPath("ContentView/PropertyView/INT/Value").getComponent(Label);

        this._troopProgress = this.node.getChildByPath("ContentView/AddTroopView/ProgressBar").getComponent(ProgressBar);
        this._troopSlider = this.node.getChildByPath("ContentView/AddTroopView/ProgressBar/Slider").getComponent(Slider);
        this._troopLeftLabel = this.node.getChildByPath("ContentView/AddTroopView/LeftValue").getComponent(Label);
        this._troopAddEditBox = this.node.getChildByPath("ContentView/AddTroopView/Control/Value").getComponent(EditBox);

        this.node.getChildByPath("ContentView/AddTroopView/Control/minus").on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.getChildByPath("ContentView/AddTroopView/Control/minus").on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.getChildByPath("ContentView/AddTroopView/Control/minus").on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        this.node.getChildByPath("ContentView/AddTroopView/Control/plus").on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.getChildByPath("ContentView/AddTroopView/Control/plus").on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.getChildByPath("ContentView/AddTroopView/Control/plus").on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    protected viewDidStart(): void {
        super.viewDidStart();

        NotificationMgr.addListener(NotificationName.RESOURCE_GETTED, this._onResourceGetted, this);
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_HP_CHANGED, this._onPioneerHpChange, this);
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.RESOURCE_GETTED, this._onResourceGetted, this);
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_HP_CHANGED, this._onPioneerHpChange, this);
    }

    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node | null {
        return this.node.getChildByPath("ContentView");
    }

    private _refreshUI() {
        if (this._showIndex < 0 || this._showIndex > this._infos.length - 1) {
            return;
        }
        const info = this._infos[this._showIndex];
        const nft = DataMgr.s.nftPioneer.getNFTById(info.NFTId);
        if (nft == undefined) {
            return;
        }

        this._infoItem.getComponent(PlayerInfoItem).refreshUI(info);
        this._atkLabel.string = info.attack.toString();
        this._defLabel.string = info.defend.toString();
        this._hpLabel.string = info.hpMax.toString();
        this._speedLabel.string = info.speed.toString();
        this._intLabel.string = nft.iq.toString();

        let addMaxNum = Math.floor(info.hpMax - info.hp);

        this._troopProgress.progress = this._addTroopNum / addMaxNum;
        this._troopSlider.progress = this._addTroopNum / addMaxNum;
        this._troopLeftLabel.string = (addMaxNum - this._addTroopNum).toString();
        this._troopAddEditBox.string = this._addTroopNum.toString();
    }
    private _getCurrentAddTroopNum(value: number, max: number) {
        return Math.max(0, Math.min(value, DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Troop), max));
    }
    private _updateAddNum(isMinus: boolean) {
        if (this._showIndex < 0 || this._showIndex > this._infos.length - 1) {
            return;
        }
        const info = this._infos[this._showIndex];
        const addMaxNum = Math.floor(info.hpMax - info.hp);

        let changeNum = 1;
        if (this._holdTime > 4) {
            changeNum *= 100;
        } else if (this._holdTime > 2) {
            changeNum *= 10;
        }

        this._holdLimitTrigger = false;

        const currentAddTroop: number = this._getCurrentAddTroopNum(this._addTroopNum + (isMinus ? -changeNum : changeNum), addMaxNum);
        if (this._addTroopNum != currentAddTroop) {
            this._addTroopNum = currentAddTroop;
            this._refreshUI();
        }
    }
    //------------------------ action
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }

    private onAddSlided(event: Event, customEventData: string) {
        if (this._showIndex < 0 || this._showIndex > this._infos.length - 1) {
            return;
        }
        const info = this._infos[this._showIndex];
        const addMaxNum = Math.floor(info.hpMax - info.hp);
        const currentAddTroop: number = this._getCurrentAddTroopNum(Math.floor(this._troopSlider.progress * addMaxNum), addMaxNum);

        this._troopSlider.progress = currentAddTroop / addMaxNum;

        if (currentAddTroop != this._addTroopNum) {
            this._addTroopNum = currentAddTroop;
            this._refreshUI();
        }
    }

    private onTouchStart(event: EventTouch) {
        const currentButton = event.currentTarget as Node;
        this._holdTime = 0;
        this._holdLimitTrigger = true;
        tween(currentButton)
            .to(0.1, { scale: v3(0.9, 0.9, 0.9) })
            .start();

        this._holdInterval = setInterval(() => {
            this._holdTime += 0.1;
            this._updateAddNum(currentButton.name == "minus");
        }, 100) as unknown as number;
    }
    private onTouchEnd(event: EventTouch) {
        const currentButton = event.currentTarget as Node;
        if (this._holdInterval !== null) {
            clearInterval(this._holdInterval);
            this._holdInterval = null;
        }
        this._holdTime = 0;
        tween(currentButton)
            .to(0.1, { scale: v3(1, 1, 1) })
            .start();

        if (this._holdLimitTrigger) {
            this._updateAddNum(currentButton.name == "minus");
        }
    }

    private onEditEnd() {
        if (this._showIndex < 0 || this._showIndex > this._infos.length - 1) {
            return;
        }
        const info = this._infos[this._showIndex];
        const addMaxNum = Math.floor(info.hpMax - info.hp);
        const inputAddNum = parseInt(this._troopAddEditBox.string);
        const currentAddTroop: number = this._getCurrentAddTroopNum(inputAddNum, addMaxNum);
        if (this._addTroopNum != currentAddTroop) {
            this._addTroopNum = currentAddTroop;
            this._refreshUI();
        }
    }

    private async onTapGenerateTroop() {
        GameMusicPlayMgr.playTapButtonEffect();
        const result = await UIPanelManger.inst.pushPanel(UIName.RecruitUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(RecruitUI).refreshUI(true);
    }

    private onTapLeftSwitch() {
        this._showIndex -= 1;
        if (this._showIndex < 0) {
            this._showIndex = this._infos.length - 1;
        }
        this._addTroopNum = 0;
        this._refreshUI();
    }
    private onTapRightSwitch() {
        this._showIndex += 1;
        if (this._showIndex > this._infos.length - 1) {
            this._showIndex = 0;
        }
        this._addTroopNum = 0;
        this._refreshUI();
    }
    private onTapComplete() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._addTroopNum <= 0) {
            return;
        }
        if (this._showIndex < 0 || this._showIndex > this._infos.length - 1) {
            return;
        }
        const info = this._infos[this._showIndex];
        NetworkMgr.websocketMsg.player_troop_to_hp({
            pioneerId: info.id,
            troopNum: this._addTroopNum,
        });
    }

    //-------------------------------- notification
    private _onResourceGetted(item: ItemData) {
        if (item.itemConfigId == ResourceCorrespondingItem.Troop) {
            this._refreshUI();
        }
    }

    private _onPioneerHpChange(data: { pioneerId: string }) {
        for (let i = 0; i < this._infos.length; i++) {
            if (this._infos[i].id == data.pioneerId) {
                this._infos[i] = DataMgr.s.pioneer.getById(data.pioneerId) as MapPlayerPioneerObject;
                this._addTroopNum = 0;
                this._refreshUI();
                break;
            }
        }
    }
}
