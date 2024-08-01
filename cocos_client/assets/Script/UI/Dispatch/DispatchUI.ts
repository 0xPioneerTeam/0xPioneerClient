import { _decorator, Button, Component, instantiate, Label, Layout, Node, ScrollView, Toggle, UITransform, Vec2, Widget } from "cc";
import ViewController from "../../BasicView/ViewController";
import UIPanelManger from "../../Basic/UIPanelMgr";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import { DataMgr } from "../../Data/DataMgr";
import { PlayerInfoItem } from "../View/PlayerInfoItem";
import { MapPioneerActionType, MapPioneerObject, MapPioneerType, MapPlayerPioneerObject } from "../../Const/PioneerDefine";
import GameMainHelper from "../../Game/Helper/GameMainHelper";
import CommonTools from "../../Tool/CommonTools";
import { UIName } from "../../Const/ConstUIDefine";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import { GameMgr, LanMgr } from "../../Utils/Global";
import { MapBuildingObject } from "../../Const/MapBuilding";
import { TilePos } from "../../Game/TiledMap/TileTool";
const { ccclass, property } = _decorator;

@ccclass("DispatchUI")
export class DispatchUI extends ViewController {
    private _interactBuilding: MapBuildingObject;
    private _interactPioneer: MapPioneerObject;
    private _targetPos: Vec2;
    private _tempShowCostEnergy: number = 0;
    private _step: number;
    private _moveSpeed: number = 0;
    private _actionCallback: (confirmed: boolean, actionPioneerUnqueId: string, movePath: TilePos[], isReturn: boolean) => void = null;

    private _isReturn: boolean = false;

    private _timeLabel: Label = null;
    private _returnSwitchButton: Node = null;
    private _energyLabel: Label = null;
    private _playerScrollView: Node = null;
    private _playerContentView: Node = null;
    private _playerItem: Node = null;

    public configuration(
        interactBuilding: MapBuildingObject,
        interactPioneer: MapPioneerObject,
        targetPos: Vec2,
        tempShowCostEnergy: number,
        step: number,
        moveSpeed: number,
        actionCallback: (confirmed: boolean, actionPioneerUnqueId: string, movePath: TilePos[], isReturn: boolean) => void
    ) {
        this._interactBuilding = interactBuilding;
        this._interactPioneer = interactPioneer;
        this._targetPos = targetPos;
        this._tempShowCostEnergy = tempShowCostEnergy;
        this._step = step;
        this._moveSpeed = moveSpeed;
        this._actionCallback = actionCallback;
        this._refreshUI();
    }

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._timeLabel = this.node.getChildByPath("ContentView/CostTime/Value").getComponent(Label);
        this._returnSwitchButton = this.node.getChildByPath("ContentView/ReturnSwitchButton");
        this._energyLabel = this.node.getChildByPath("ContentView/CostView/Content/Value").getComponent(Label);
        this._playerScrollView = this.node.getChildByPath("ContentView/ScrollView");
        this._playerContentView = this._playerScrollView.getChildByPath("View/Content");
        this._playerItem = this._playerContentView.getChildByPath("Item");
        this._playerItem.removeFromParent();
    }

    protected viewDidStart(): void {
        super.viewDidStart();

        NotificationMgr.addListener(NotificationName.MAP_PIONEER_HP_CHANGED, this._onPioneerHpChange, this);
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_ENERGY_CHANGED, this._onPioneerEnergyChange, this);
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_HP_CHANGED, this._onPioneerHpChange, this);
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_ENERGY_CHANGED, this._onPioneerEnergyChange, this);
    }

    private _refreshUI() {
        this._refreshEnergyAndTime();

        this._playerContentView.removeAllChildren();

        const players = DataMgr.s.pioneer.getAllSelfPlayers();
        let playerCount = 0;
        for (const player of players) {
            if (player.NFTId == null) {
                continue;
            }
            const view = instantiate(this._playerItem);
            view.setParent(this._playerContentView);
            view.getComponent(PlayerInfoItem).refreshUI(player);
            view.getComponent(Button).clickEvents[0].customEventData = player.uniqueId;
            playerCount += 1;
        }
        this._playerScrollView.getComponent(UITransform).width =
            this._playerItem.getComponent(UITransform).width * playerCount + (playerCount - 1) * this._playerContentView.getComponent(Layout).spacingX;

        this._playerScrollView.getChildByPath("View").getComponent(Widget).updateAlignment();
        this._playerContentView.getComponent(Widget).updateAlignment();
    }

    private _refreshEnergyAndTime() {
        const perStepTime: number = (GameMainHelper.instance.tiledMapTilewidth * 0.5) / this._moveSpeed;
        this._timeLabel.string = CommonTools.formatSeconds(perStepTime * this._step * (this._isReturn ? 1 : 1));

        this._returnSwitchButton.getChildByPath("Return").active = this._isReturn;
        this._returnSwitchButton.getChildByPath("OneWay").active = !this._isReturn;

        this._energyLabel.string = (this._tempShowCostEnergy * (this._isReturn ? 1 : 1)).toString();
        this._energyLabel.node.parent.getComponent(Layout).updateLayout();
    }

    //-------------------------- action
    private onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.popPanel(this.node);
        if (this._actionCallback != null) {
            this._actionCallback(false, null, [], false);
        }
    }
    private onTapList() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.pushPanel(UIName.PlayerDispatchListUI);
    }
    private onReturnCheckToggle() {
        this._isReturn = !this._isReturn;
        this._refreshEnergyAndTime();
    }
    private onTapItem(event: Event, customEvnetData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const player = DataMgr.s.pioneer.getById(customEvnetData);
        if (player == undefined) {
            return;
        }
        if (player.actionType != MapPioneerActionType.inCity && player.actionType != MapPioneerActionType.staying) {
            NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, LanMgr.getLanById("203002"));
            return;
        }
        if (player.hp <= 0) {
            // NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, LanMgr.getLanById("106009"));
            NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, "Insufficient troops");
            return;
        }
        let beginPos: Vec2 = player.stayPos;
        let sparePositions: Vec2[] = [];
        let targetStayPostions: Vec2[] = [];
        if (this._interactBuilding != null) {
            sparePositions = this._interactBuilding.stayMapPositions;
            targetStayPostions = this._interactBuilding.stayMapPositions;
        } else if (this._interactPioneer != null) {
            if (this._interactPioneer.type == MapPioneerType.player || this._interactPioneer.type == MapPioneerType.npc) {
                targetStayPostions = [this._interactPioneer.stayPos];
            }
        }
        const movePath: TilePos[] = GameMgr.findTargetLeastMovePath(beginPos, this._targetPos, sparePositions, targetStayPostions);
        const trueCostEnergy: number = GameMgr.getMapActionCostEnergy(movePath.length, this._interactBuilding != null ? this._interactBuilding.uniqueId : null);
        if (player.energy < trueCostEnergy) {
            GameMgr.showBuyEnergyTip(player.uniqueId);
            return;
        }
        UIPanelManger.inst.popPanel(this.node);
        if (this._actionCallback != null) {
            this._actionCallback(true, player.uniqueId, movePath, this._isReturn);
        }
    }

    //----------------------------------------------- notification
    private _onPioneerHpChange() {
        this._refreshUI();
    }
    private _onPioneerEnergyChange() {
        this._refreshUI();
    }
}
