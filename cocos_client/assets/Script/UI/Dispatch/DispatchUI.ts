import { _decorator, Button, Component, instantiate, Label, Layout, Node, ScrollView, Toggle, UITransform, Vec2, Widget } from "cc";
import ViewController from "../../BasicView/ViewController";
import UIPanelManger from "../../Basic/UIPanelMgr";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import { DataMgr } from "../../Data/DataMgr";
import { PlayerInfoItem } from "../View/PlayerInfoItem";
import { MapPlayerPioneerObject } from "../../Const/PioneerDefine";
import GameMainHelper from "../../Game/Helper/GameMainHelper";
import CommonTools from "../../Tool/CommonTools";
import { UIName } from "../../Const/ConstUIDefine";
const { ccclass, property } = _decorator;

@ccclass("DispatchUI")
export class DispatchUI extends ViewController {
    private _step: number = 0;
    private _costEnergy: number = 0;
    private _moveSpeed: number = 0;
    private _actionCallback: (confirmed: boolean, isReturn: boolean) => void = null;

    private _timeLabel: Label = null;
    private _returnCheck: Toggle = null;
    private _energyLabel: Label = null;
    private _playerScrollView: Node = null;
    private _playerContentView: Node = null;
    private _playerItem: Node = null;

    public configuration(targetPos: Vec2, targetName: string, step: number, costEnergy, moveSpeed: number, actionCallback: (confirmed: boolean, isReturn: boolean) => void) {
        this._step = step;
        this._costEnergy = costEnergy;
        this._moveSpeed = moveSpeed;
        this._actionCallback = actionCallback;
        this._refreshUI();
    }

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._timeLabel = this.node.getChildByPath("ContentView/CostTime").getComponent(Label);
        this._returnCheck = this.node.getChildByPath("ContentView/Toggle").getComponent(Toggle);
        this._energyLabel = this.node.getChildByPath("ContentView/CostView/Content/Value").getComponent(Label);
        this._playerScrollView = this.node.getChildByPath("ContentView/ScrollView");
        this._playerContentView = this._playerScrollView.getChildByPath("View/Content");
        this._playerItem = this._playerContentView.getChildByPath("Item");
        this._playerItem.removeFromParent();

        this._returnCheck.isChecked = false;
    }

    protected viewDidStart(): void {
        super.viewDidStart();
    }

    private _refreshUI() {
        
        this._refreshEnergyAndTime();

        const players = DataMgr.s.pioneer.getAllPlayers();
        let playerCount = 0;
        for (const player of players) {
            if (player.NFTId == null) {
                continue;
            }
            const view = instantiate(this._playerItem);
            view.setParent(this._playerContentView);
            view.getComponent(PlayerInfoItem).refreshUI(player);
            view.getComponent(Button).clickEvents[0].customEventData = player.id;
            playerCount += 1;
        }
        this._playerScrollView.getComponent(UITransform).width =
            this._playerItem.getComponent(UITransform).width * playerCount + (playerCount - 1) * this._playerContentView.getComponent(Layout).spacingX;

        this._playerScrollView.getChildByPath("View").getComponent(Widget).updateAlignment();
        this._playerContentView.getComponent(Widget).updateAlignment();
    }

    private _refreshEnergyAndTime() {
        const perStepTime: number = (GameMainHelper.instance.tiledMapTilewidth * 0.5) / this._moveSpeed;
        this._timeLabel.string = CommonTools.formatSeconds(perStepTime * this._step * (this._returnCheck.isChecked ? 2 : 1));

        this._energyLabel.string = (this._costEnergy * (this._returnCheck.isChecked ? 2 : 1)).toString();
    }

    //-------------------------- action
    private onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.popPanel(this.node);
        if (this._actionCallback != null) {
            this._actionCallback(false, false);
        }
    }
    private onTapList() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.pushPanel(UIName.PlayerDispatchListUI);
    }
    private onReturnCheckToggle() {
        this._refreshEnergyAndTime();
    }
    private onTapItem(event: Event, customEvnetData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const player = DataMgr.s.pioneer.getById(customEvnetData);
        if (player == undefined) {
            return;
        }
        UIPanelManger.inst.popPanel(this.node);
        if (player.energy)
        if (this._actionCallback != null) {
            this._actionCallback(true, this._returnCheck.isChecked);
        }
    }
}
