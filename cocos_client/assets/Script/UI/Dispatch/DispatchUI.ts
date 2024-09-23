import { _decorator, Button, Component, instantiate, Label, Layout, Node, PageView, ScrollView, Toggle, UITransform, v2, v3, Vec2, Widget } from "cc";
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
import { MapBuildingType } from "../../Const/BuildingDefine";
import { MapInteractType, ResourceData } from "../../Const/ConstDefine";
import ConfigConfig from "../../Config/ConfigConfig";
import { ConfigType, WormholeMatchConsumeParam, WormholeTeleportConsumeParam } from "../../Const/Config";
import { UIHUDController } from "../UIHUDController";
import { CircularList, CircularListDelegate } from "../../BasicView/CircularList";
const { ccclass, property } = _decorator;

@ccclass("DispatchUI")
export class DispatchUI extends ViewController implements CircularListDelegate {
    private _interactType: MapInteractType;
    private _interactBuilding: MapBuildingObject;
    private _interactPioneer: MapPioneerObject;
    private _targetPos: Vec2;
    private _actionCallback: (confirmed: boolean, actionPioneerUnqueId: string, movePath: TilePos[], isReturn: boolean) => void = null;

    private _isReturn: boolean = true;

    private _returnTitle: Node = null;
    private _returnSwitchButton: Node = null;
    private _playerShowView: CircularList = null;
    private _playerLeftSwitchButton: Node = null;
    private _playerRightSwitchButton: Node = null;
    private _playerItem: Node = null;

    private _playerShowData: MapPlayerPioneerObject[] = [];

    public configuration(
        interactType: MapInteractType,
        interactBuilding: MapBuildingObject,
        interactPioneer: MapPioneerObject,
        targetPos: Vec2,
        actionCallback: (confirmed: boolean, actionPioneerUnqueId: string, movePath: TilePos[], isReturn: boolean) => void
    ) {
        this._interactType = interactType;
        this._interactBuilding = interactBuilding;
        this._interactPioneer = interactPioneer;
        this._targetPos = targetPos;
        this._actionCallback = actionCallback;
        this._refreshUI();
    }

    protected viewDidLoad(): void {
        super.viewDidLoad();

        // this.node.getChildByPath("ContentView/Title").getComponent(Label).string = LanMgr.getLanById("lanreplace200033");
        // this.node.getChildByPath("ContentView/ReturnTitle").getComponent(Label).string = LanMgr.getLanById("lanreplace200035");
        this.node.getChildByPath("ContentView/ListButton/Label").getComponent(Label).string = LanMgr.getLanById("850000");

        const localReturn = localStorage.getItem("__interactReturn");
        this._isReturn = localReturn == "false" ? false : true;

        this._returnTitle = this.node.getChildByPath("ContentView/ReturnTitle");
        this._returnSwitchButton = this.node.getChildByPath("ContentView/ReturnSwitchButton");
        this._playerShowView = this.node.getChildByPath("ContentView/CircularList").getComponent(CircularList);
        this._playerShowView.delegate = this;
        this._playerItem = this._playerShowView.node.getChildByPath("Item");
        // this._playerItem.getChildByPath("CostView/CostTime").getComponent(Label).string = LanMgr.getLanById("lanreplace200034");
        this._playerItem.removeFromParent();

        this._playerLeftSwitchButton = this.node.getChildByPath("ContentView/SwitchToLeftButton");
        this._playerRightSwitchButton = this.node.getChildByPath("ContentView/SwitchToRightButton");
    }

    protected viewDidStart(): void {
        super.viewDidStart();

        this._prepareData();
        this._refreshUI();

        NotificationMgr.addListener(NotificationName.MAP_PIONEER_HP_CHANGED, this._onPioneerHpChange, this);
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_ENERGY_CHANGED, this._onPioneerEnergyChange, this);
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_HP_CHANGED, this._onPioneerHpChange, this);
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_ENERGY_CHANGED, this._onPioneerEnergyChange, this);
    }

    //------------------------------- local function
    private _prepareData() {
        this._playerShowData = [];
        const players = DataMgr.s.pioneer.getAllSelfPlayers();
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            if (player.NFTId == null) {
                continue;
            }
            if (this._interactType == MapInteractType.MainBack && player.actionType != MapPioneerActionType.staying) {
                continue;
            }
            this._playerShowData.push(player);
        }
        if (this._playerShowData.length == 0) {
            UIPanelManger.inst.popPanel(this.node);
            UIHUDController.showCenterTip("All the pioneers are in the city");
            return;
        }
    }

    private _refreshUI() {
        this._playerShowView.reloadUI();

        this._playerLeftSwitchButton.active = this._playerShowView.canCircular();
        this._playerRightSwitchButton.active = this._playerShowView.canCircular();

        // not support return actions
        this._returnSwitchButton.active =
            this._interactType != MapInteractType.WmMark &&
            this._interactType != MapInteractType.WmMatch &&
            this._interactType != MapInteractType.WmRecall &&
            this._interactType != MapInteractType.WmTeleport &&
            this._interactType != MapInteractType.MainBack;
        this._returnSwitchButton.getChildByPath("Selected").active = this._isReturn;
        this._returnTitle.active = this._returnSwitchButton.active;
    }

    //-------------------------- action
    private onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.popPanel(this.node);
        if (this._actionCallback != null) {
            this._actionCallback(false, null, [], false);
        }
    }
    private onTapLeftSwitch(isLongPress: boolean) {
        GameMusicPlayMgr.playTapButtonEffect();
        this._playerShowView.switchToLeft(isLongPress ? 0.1 : 0.3);
    }
    private onTapRightSwitch(isLongPress: boolean) {
        GameMusicPlayMgr.playTapButtonEffect();
        this._playerShowView.swithToRight(isLongPress ? 0.1 : 0.3);
    }
    private onTapList() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.pushPanel(UIName.PlayerDispatchListUI);
    }
    private onReturnCheckToggle() {
        this._isReturn = !this._isReturn;
        localStorage.setItem("__interactReturn", this._isReturn.toString());
        this._returnSwitchButton.getChildByPath("Selected").active = this._isReturn;
    }
    //----------------------------------------------- notification
    private _onPioneerHpChange() {
        this._prepareData();
        this._refreshUI();
    }
    private _onPioneerEnergyChange() {
        this._prepareData();
        this._refreshUI();
    }
    //------------------------------------------------ CircularListDelegate
    public circularListTotalNum(): number {
        return this._playerShowData.length;
    }
    public circularListUpdateNode(node: Node, index: number): void {
        const player = this._playerShowData[index];
        node.getComponent(PlayerInfoItem).refreshUI(player);
        const itemCostView = node.getChildByPath("CostView");
        let beginPos: Vec2 = player.stayPos;
        let sparePositions: Vec2[] = [];
        let targetStayPostions: Vec2[] = [];
        if (this._interactBuilding != null) {
            sparePositions = this._interactBuilding.stayMapPositions.slice();
            targetStayPostions = this._interactBuilding.stayMapPositions.slice();
            if (this._interactBuilding.type == MapBuildingType.city && sparePositions.length == 7) {
                sparePositions.splice(3, 1);
            }
        } else if (this._interactPioneer != null) {
            if (this._interactPioneer.type == MapPioneerType.player || this._interactPioneer.type == MapPioneerType.npc) {
                targetStayPostions = [this._interactPioneer.stayPos];
            }
        }
        let costEnergy: number = 0;
        const moveData = GameMgr.findTargetLeastMovePath(beginPos, this._targetPos, sparePositions, targetStayPostions);
        if (moveData.status === 1) {
            costEnergy =
                this._interactType == MapInteractType.MainBack
                    ? 0
                    : GameMgr.getMapActionCostEnergy(moveData.path.length, this._interactBuilding != null ? this._interactBuilding.uniqueId : null);

            itemCostView.getChildByPath("Content/Value").getComponent(Label).string = costEnergy + "";
            const perStepTime: number = (GameMainHelper.instance.tiledMapTilewidth * 0.5) / player.speed;
            itemCostView.getChildByPath("CostTime/Value").getComponent(Label).string = CommonTools.formatSeconds(
                perStepTime * moveData.path.length * (this._isReturn ? 1 : 1)
            );
        } else {
            itemCostView.getChildByPath("Content/Value").getComponent(Label).string = ">99";
            itemCostView.getChildByPath("CostTime/Value").getComponent(Label).string = "--:--:--";
        }
    }

    public async circularListTapItem(index: number): Promise<void> {
        GameMusicPlayMgr.playTapButtonEffect();
        if (index < 0 || index > this._playerShowData.length - 1) {
            return;
        }
        const player = this._playerShowData[index];
        if (player == undefined) {
            return;
        }
        const result = await GameMgr.checkMapCanInteractAndCalulcateMovePath(player, this._interactType, this._interactBuilding, this._interactPioneer, this._targetPos);
        if (!result.enable) {
            return;
        }
        UIPanelManger.inst.popPanel(this.node);
        if (this._actionCallback != null) {
            this._actionCallback(true, player.uniqueId, result.movePath, this._isReturn);
        }
    }
}
