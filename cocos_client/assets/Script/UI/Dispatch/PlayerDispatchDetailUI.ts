import { _decorator, Component, Label, Node, ProgressBar, Slider } from "cc";
import ViewController from "../../BasicView/ViewController";
import { MapPlayerPioneerObject } from "../../Const/PioneerDefine";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import UIPanelManger from "../../Basic/UIPanelMgr";
import { UIName } from "../../Const/ConstUIDefine";
import { PlayerInfoItem } from "../View/PlayerInfoItem";
import { DataMgr } from "../../Data/DataMgr";
import { ResourceCorrespondingItem } from "../../Const/ConstDefine";
import { RecruitUI } from "../Inner/RecruitUI";
const { ccclass, property } = _decorator;

@ccclass("PlayerDispatchDetailUI")
export class PlayerDispatchDetailUI extends ViewController {
    private _infos: MapPlayerPioneerObject[] = [];
    private _showIndex: number = 0;
    private _addTroopNum: number = 0;

    private _infoItem: Node = null;
    private _atkLabel: Label = null;
    private _defLabel: Label = null;
    private _hpLabel: Label = null;
    private _speedLabel: Label = null;
    private _intLabel: Label = null;

    private _troopProgress: ProgressBar = null;
    private _troopSlider: Slider = null;
    private _troopLeftLabel: Label = null;
    private _troopAddLabel: Label = null;

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
        this._troopAddLabel = this.node.getChildByPath("ContentView/AddTroopView/Control/Value").getComponent(Label);
    }

    protected viewDidStart(): void {
        super.viewDidStart();
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

        const addTroopView = this.node.getChildByPath("ContentView/AddTroopView");
        const addMaxNum = info.hpMax - info.hp;
        if (addMaxNum - this._addTroopNum <= 0) {
            addTroopView.active = false;
            return;
        }
        addTroopView.active = true;

        this._troopProgress.progress = this._addTroopNum / addMaxNum;
        this._troopSlider.progress = this._addTroopNum / addMaxNum;
        this._troopLeftLabel.string = (addMaxNum - this._addTroopNum).toString();
        this._troopAddLabel.string = this._addTroopNum.toString();
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
        const addMaxNum = info.hpMax - info.hp;
        const currentAddTroop: number = Math.max(
            0,
            Math.min(Math.floor(this._troopSlider.progress * addMaxNum), DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Troop))
        );

        this._troopSlider.progress = currentAddTroop / addMaxNum;

        if (currentAddTroop != this._addTroopNum) {
            this._addTroopNum = currentAddTroop;
            this._refreshUI();
        }
    }
    private onTapMinus() {
        GameMusicPlayMgr.playTapButtonEffect();
    }

    private onTapAdd() {
        GameMusicPlayMgr.playTapButtonEffect();
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
    }
}
