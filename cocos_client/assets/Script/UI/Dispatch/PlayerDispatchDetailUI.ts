import { _decorator, Button, Component, EditBox, EventTouch, instantiate, Label, Layout, Node, ProgressBar, Slider, tween, v3 } from "cc";
import ViewController from "../../BasicView/ViewController";
import { MapPioneerActionType, MapPlayerPioneerObject } from "../../Const/PioneerDefine";
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
import TroopsConfig from "../../Config/TroopsConfig";
import CommonTools from "../../Tool/CommonTools";
import { GameMgr, LanMgr } from "../../Utils/Global";
const { ccclass, property } = _decorator;

@ccclass("PlayerDispatchDetailUI")
export class PlayerDispatchDetailUI extends ViewController {
    private _infos: MapPlayerPioneerObject[] = [];
    private _showIndex: number = 0;
    private _selectTroopId: string = null;
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

    private _troopSelectView: Node = null;
    private _troopSelectItemContentView: Node = null;
    private _troopSelectItem: Node = null;

    public configuration(infos: MapPlayerPioneerObject[], showIndex: number) {
        this._infos = infos;
        this._showIndex = showIndex;

        const info = infos[this._showIndex];
        if (info.hp > 0) {
            this._selectTroopId = info.troopId;
            this._addTroopNum = GameMgr.convertHpToTroopNum(info.hp, info.troopId);
        }
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

        this._troopSelectView = this.node.getChildByPath("TroopSelectContentView");
        this._troopSelectView.active = false;

        this._troopSelectItemContentView = this._troopSelectView.getChildByPath("ScrollView/View/Content");
        this._troopSelectItem = this._troopSelectItemContentView.getChildByPath("Item");
        this._troopSelectItem.removeFromParent();

        this.node.getChildByPath("ContentView/AddTroopView/Control/minus").on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.getChildByPath("ContentView/AddTroopView/Control/minus").on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.getChildByPath("ContentView/AddTroopView/Control/minus").on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        this.node.getChildByPath("ContentView/AddTroopView/Control/plus").on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.getChildByPath("ContentView/AddTroopView/Control/plus").on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.getChildByPath("ContentView/AddTroopView/Control/plus").on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    protected viewDidStart(): void {
        super.viewDidStart();

        // default troop
        this._createSelectItem("0");
        // other troop
        const troopsConfig = TroopsConfig.getAll();
        for (const key in troopsConfig) {
            if (Object.prototype.hasOwnProperty.call(troopsConfig, key)) {
                const element = troopsConfig[key];
                this._createSelectItem(element.id);
            }
        }
        this._troopSelectItemContentView.getComponent(Layout).updateLayout();

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

    private _createSelectItem(troopId: string) {
        const item = instantiate(this._troopSelectItem);
        item.parent = this._troopSelectItemContentView;
        for (const child of item.getChildByPath("Icon").children) {
            if (troopId == "0") {
                child.active = child.name == "troops_0";
            } else {
                child.active = child.name.includes(troopId);
            }
        }
        item.getComponent(Button).clickEvents[0].customEventData = troopId;
    }
    private _refreshUI() {
        if (this._showIndex < 0 || this._showIndex > this._infos.length - 1) {
            return;
        }
        this._addTroopNum = Math.floor(this._addTroopNum);

        const info = this._infos[this._showIndex];
        const nft = DataMgr.s.nftPioneer.getNFTById(info.NFTId);
        if (nft == undefined) {
            return;
        }

        let troopName = "";
        let troopLevel = null;
        let hp = 0;
        let ownedTroopNum = 0;
        if (this._selectTroopId != null) {
            if (this._selectTroopId == "0") {
                hp += this._addTroopNum;
                troopName = "Common";
                troopLevel = 0;
            } else {
                const troopConfig = TroopsConfig.getById(this._selectTroopId);
                hp += this._addTroopNum * parseInt(troopConfig.hp_training);
                troopName = LanMgr.getLanById(troopConfig.name);
                troopLevel = parseInt(troopConfig.id) - 50000 + 1;
            }
            ownedTroopNum = this._getOwnedTroopNum(this._selectTroopId);
        }
        // icon show
        for (const child of this.node.getChildByPath("ContentView/AddTroopView/img_Select/Icon").children) {
            if (this._selectTroopId == null) {
                child.active = false;
            } else if (this._selectTroopId == "0") {
                child.active = child.name == "troops_0";
            } else {
                child.active = child.name.includes(this._selectTroopId);
            }
        }
        if (troopLevel == null) {
            this.node.getChildByPath("ContentView/AddTroopView/img_Grade").active = false;
        } else {
            this.node.getChildByPath("ContentView/AddTroopView/img_Grade").active = true;
            this.node.getChildByPath("ContentView/AddTroopView/img_Grade/lbl_lv").getComponent(Label).string = troopLevel.toString();
        }
        this.node.getChildByPath("ContentView/AddTroopView/lbl_lv").getComponent(Label).string = troopName;

        this._infoItem.getComponent(PlayerInfoItem).refreshUI(info);
        this._atkLabel.string = info.attack.toString();
        this._defLabel.string = info.defend.toString();
        this._hpLabel.string = hp.toString();
        this._speedLabel.string = info.speed.toString();
        this._intLabel.string = nft.iq.toString();

        let addMaxNum = Math.max(0, Math.min(info.hpMax, ownedTroopNum));

        this._troopProgress.progress = this._addTroopNum / addMaxNum;
        this._troopSlider.progress = this._addTroopNum / addMaxNum;
        this._troopLeftLabel.string = (addMaxNum - this._addTroopNum).toString();
        this._troopAddEditBox.string = this._addTroopNum.toString();
    }
    private _getOwnedTroopNum(troopId: string) {
        if (troopId == "0") {
            return DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Troop);
        }
        return DataMgr.s.innerBuilding.getOwnedExecriseTroopNum(this._selectTroopId);
    }
    private _updateAddNum(isMinus: boolean) {
        let changeNum = 1;
        if (this._holdTime > 4) {
            changeNum *= 100;
        } else if (this._holdTime > 2) {
            changeNum *= 10;
        }

        this._holdLimitTrigger = false;

        const resultValue = this._troopChangeVaild(this._addTroopNum + (isMinus ? -changeNum : changeNum));
        if (this._addTroopNum != resultValue) {
            this._addTroopNum = resultValue;
            this._refreshUI();
        }
    }

    private _troopChangeVaild(value: number) {
        if (this._showIndex < 0 || this._showIndex > this._infos.length - 1) {
            return;
        }
        if (this._selectTroopId == null) {
            return 0;
        }
        if (value < 0) {
            return 0;
        }
        const info = this._infos[this._showIndex];
        const ownedNum = this._getOwnedTroopNum(this._selectTroopId);
        const maxNum = Math.min(ownedNum, Math.floor(info.hpMax));
        if (value > maxNum) {
            return maxNum;
        }
        return Math.floor(value);
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
        if (this._selectTroopId == null) {
            return;
        }
        const info = this._infos[this._showIndex];

        const ownedTroopNum = this._getOwnedTroopNum(this._selectTroopId);
        let addMaxNum = Math.max(0, Math.min(info.hpMax, ownedTroopNum));

        const resultValue = this._troopChangeVaild(this._troopSlider.progress * addMaxNum);

        this._troopSlider.progress = resultValue / addMaxNum;
        if (resultValue != this._addTroopNum) {
            this._addTroopNum = resultValue;
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
        // const info = this._infos[this._showIndex];
        // const addMaxNum = Math.floor(info.hpMax - info.hp);
        // const inputAddNum = parseInt(this._troopAddEditBox.string);
        // const currentAddTroop: number = this._getCurrentAddTroopNum(inputAddNum, addMaxNum);
        // if (this._addTroopNum != currentAddTroop) {
        //     this._addTroopNum = currentAddTroop;
        //     this._refreshUI();
        // }
    }

    private onTapShowSelectTroop() {
        GameMusicPlayMgr.playTapButtonEffect();
        this._troopSelectView.active = true;
        this.node.getChildByPath("ContentView/AddTroopView/img_Select").active = false;
    }
    private onTapHideSelectTroop() {
        this._troopSelectView.active = false;
        this.node.getChildByPath("ContentView/AddTroopView/img_Select").active = true;
    }
    private onTapSelectTroop(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        this._troopSelectView.active = false;
        this.node.getChildByPath("ContentView/AddTroopView/img_Select").active = true;
        this._selectTroopId = customEventData;
        this._addTroopNum = 0;
        this._refreshUI();
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
        const info = this._infos[this._showIndex];
        if (info.hp > 0) {
            this._selectTroopId = info.troopId;
            this._addTroopNum = GameMgr.convertHpToTroopNum(info.hp, info.troopId);
        }
        this._refreshUI();
    }
    private onTapRightSwitch() {
        this._showIndex += 1;
        if (this._showIndex > this._infos.length - 1) {
            this._showIndex = 0;
        }
        const info = this._infos[this._showIndex];
        if (info.hp > 0) {
            this._selectTroopId = info.troopId;
            this._addTroopNum = GameMgr.convertHpToTroopNum(info.hp, info.troopId);
        }
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
        if (info.actionType != MapPioneerActionType.inCity) {
            NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, "Not within the city, unable to replenish troops");
            return;
        }
        NetworkMgr.websocketMsg.player_troop_to_hp({
            pioneerId: info.uniqueId,
            troopNum: this._addTroopNum,
            troopId: this._selectTroopId,
        });
    }

    //-------------------------------- notification
    private _onResourceGetted(item: ItemData) {
        if (item.itemConfigId == ResourceCorrespondingItem.Troop) {
            this._refreshUI();
        }
    }

    private _onPioneerHpChange(data: { uniqueId: string }) {
        for (let i = 0; i < this._infos.length; i++) {
            if (this._infos[i].uniqueId == data.uniqueId) {
                this._infos[i] = DataMgr.s.pioneer.getById(data.uniqueId) as MapPlayerPioneerObject;
                this._addTroopNum = 0;
                this._refreshUI();
                break;
            }
        }
    }
}
