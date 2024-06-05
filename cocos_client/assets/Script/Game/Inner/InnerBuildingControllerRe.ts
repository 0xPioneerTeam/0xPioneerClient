import {
    CCString,
    Color,
    Component,
    EventMouse,
    Layout,
    Node,
    Prefab,
    Rect,
    Sprite,
    SpriteFrame,
    UIOpacity,
    UITransform,
    Vec2,
    Vec3,
    _decorator,
    color,
    instantiate,
    rect,
    tween,
    v2,
    v3,
} from "cc";
import ViewController from "../../BasicView/ViewController";
import { InnerBuildingLatticeShowType, InnerBuildingLatticeStruct, InnerBuildingType, UserInnerBuildInfo } from "../../Const/BuildingDefine";
import { InnerBuildingView } from "./View/InnerBuildingView";
import InnerBuildingConfig from "../../Config/InnerBuildingConfig";
import { ResourcesMgr } from "../../Utils/Global";
import { InnerMainCityBuildingView } from "./View/InnerMainCityBuildingView";
import { InnerBarracksBuildingView } from "./View/InnerBarracksBuildingView";
import { InnerEnergyStationBuildingView } from "./View/InnerEnergyStationBuildingView";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import GameMainHelper from "../Helper/GameMainHelper";
import { DataMgr } from "../../Data/DataMgr";
import CommonTools from "../../Tool/CommonTools";
import { NetworkMgr } from "../../Net/NetworkMgr";
import { s2c_user } from "../../Net/msg/WebsocketMsg";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";

const { ccclass, property } = _decorator;

@ccclass("InnerBuildingControllerRe")
export class InnerBuildingControllerRe extends ViewController {
    private _buildingMap: Map<InnerBuildingType, InnerBuildingView> = new Map();

    private _latticeItem: Node = null;
    private _latticeContents: Node[] = [];
    private _allLatticeItems: InnerBuildingLatticeStruct[] = [];
    private _streetView: Node = null;
    private _allBuildingContentViews: Node[] = [];
    private _buildingContentItem: Node = null;
    private _allPioneerContentViews: Node[] = [];
    private _pioneerContentItem: Node = null;
    private _movePioneer: Node = null;
    private _allMovingPioneers: Node[] = [];

    private _latticeNum: number = 3;
    private _latticeColumIndex: number = 13;
    private _latticeBuildingOriginalStayLaticeItems: InnerBuildingLatticeStruct[] = [];
    private _latticeEditBuildingView: Node = null;
    private _ghostBuildingView: Node = null;

    private _setSucceedLatticeItems: InnerBuildingLatticeStruct[] = null;
    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._latticeItem = this.node.getChildByPath("BuildingLattice/Content/LatticeContent");
        this._latticeItem.active = false;

        this._streetView = this.node.getChildByPath("BuildingLattice/StreetView");
        this._buildingContentItem = this._streetView.getChildByPath("BuildingContent");
        this._buildingContentItem.removeFromParent();
        this._pioneerContentItem = this._streetView.getChildByPath("PioneerContent");
        this._pioneerContentItem.removeFromParent();
    }

    protected async viewDidStart(): Promise<void> {
        super.viewDidStart();

        this._prepareStreet();
        this._prepareLattice();
        this._refreshLattice();
        await this._initBuilding();
        await this._refreshBuilding();
    }

    protected async viewDidAppear(): Promise<void> {
        super.viewDidAppear();
        this._refreshLattice();

        this._generatePioneerMove();

        NotificationMgr.addListener(NotificationName.GAME_INNER_BUILDING_LATTICE_EDIT_CHANGED, this._onInnerBuildingLatticeEditChanged, this);

        NotificationMgr.addListener(NotificationName.GAME_INNER_LATTICE_EDIT_ACTION_MOUSE_DOWN, this._onEditActionMouseDown, this);
        NotificationMgr.addListener(NotificationName.GAME_INNER_LATTICE_EDIT_ACTION_MOUSE_UP, this._onEditActionMouseUp, this);
        NotificationMgr.addListener(NotificationName.GAME_INNER_LATTICE_EDIT_ACTION_MOUSE_MOVE, this._onEditActionMouseMove, this);

        NetworkMgr.websocket.on("player_building_pos_res", this._onBuildingPosChange);
    }

    protected viewDidDisAppear(): void {
        super.viewDidDisAppear();

        this._refreshBuilding();

        NotificationMgr.removeListener(NotificationName.GAME_INNER_BUILDING_LATTICE_EDIT_CHANGED, this._onInnerBuildingLatticeEditChanged, this);

        NotificationMgr.removeListener(NotificationName.GAME_INNER_LATTICE_EDIT_ACTION_MOUSE_DOWN, this._onEditActionMouseDown, this);
        NotificationMgr.removeListener(NotificationName.GAME_INNER_LATTICE_EDIT_ACTION_MOUSE_UP, this._onEditActionMouseUp, this);
        NotificationMgr.removeListener(NotificationName.GAME_INNER_LATTICE_EDIT_ACTION_MOUSE_MOVE, this._onEditActionMouseMove, this);

        NetworkMgr.websocket.off("player_building_pos_res", this._onBuildingPosChange);
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();
    }

    //-------------------------------------- function
    private _prepareStreet() {
        for (let i = 0; i < this._latticeNum; i++) {
            const pioneerView = instantiate(this._pioneerContentItem);
            pioneerView.setParent(this._streetView);
            this._allPioneerContentViews.push(pioneerView);

            const buildingView = instantiate(this._buildingContentItem);
            buildingView.setParent(this._streetView);
            this._allBuildingContentViews.push(buildingView);

            if (i == this._latticeNum - 1) {
                const lastPioneerView = instantiate(this._pioneerContentItem);
                lastPioneerView.setParent(this._streetView);
                this._allPioneerContentViews.push(lastPioneerView);
            }
        }
        this._streetView.getComponent(Layout).updateLayout();
        this._movePioneer = this.node.getChildByPath("MovePioneer");
        this._movePioneer.removeFromParent();
    }
    private _prepareLattice() {
        for (let i = 0; i < this._latticeNum; i++) {
            const item = instantiate(this._latticeItem);
            item.active = true;
            this._latticeItem.parent.addChild(item);
            this._latticeContents.push(item);
            for (const lattice of item.children) {
                this._allLatticeItems.push({
                    routerIndex: i,
                    node: lattice,
                    isEmpty: true,
                    showType: InnerBuildingLatticeShowType.None,
                    stayBuilding: null,
                });
            }
        }
    }
    private async _initBuilding() {
        const innerBuilding = DataMgr.s.innerBuilding.data;
        let index: number = 0;
        const promise = [];
        for (const [key, value] of innerBuilding.entries()) {
            const config = InnerBuildingConfig.getByBuildingType(key);
            if (config != null) {
                const buildingParent = this.node.getChildByPath("BuildingLattice");
                const scale = v3(1 / buildingParent.scale.x, 1 / buildingParent.scale.y, 1 / buildingParent.scale.z);
                const buildingPrb = await ResourcesMgr.LoadABResource("prefab/game/inner/" + config.anim, Prefab);
                promise.push(buildingPrb);
                if (buildingPrb != null) {
                    const view = instantiate(buildingPrb);
                    view.setScale(scale);
                    if (key == InnerBuildingType.MainCity) {
                        this._buildingMap.set(key, view.getComponent(InnerMainCityBuildingView));
                    } else if (key == InnerBuildingType.Barrack) {
                        this._buildingMap.set(key, view.getComponent(InnerBarracksBuildingView));
                    } else if (key == InnerBuildingType.EnergyStation) {
                        this._buildingMap.set(key, view.getComponent(InnerEnergyStationBuildingView));
                    } else {
                        this._buildingMap.set(key, view.getComponent(InnerBuildingView));
                    }
                    const size: number = config.size;
                    if (this._allLatticeItems.length > 0) {
                        const useItems: InnerBuildingLatticeStruct[] = [];
                        for (let i = 0; i < size; i++) {
                            let beginIndex: number = value.pos[1] * this._latticeColumIndex + value.pos[0];
                            if (beginIndex + i < this._allLatticeItems.length) {
                                const templeItem = this._allLatticeItems[beginIndex + i];
                                templeItem.isEmpty = false;
                                templeItem.stayBuilding = view;
                                useItems.push(templeItem);

                                const copyLattice = instantiate(templeItem.node);
                                copyLattice.scale = v3(1 / scale.x, 1 / scale.y, 1 / scale.z);
                                copyLattice.name = "buildingLattice_" + i;
                                const copyWidth = copyLattice.getComponent(UITransform).width * copyLattice.scale.x;
                                copyLattice.position = v3(-(((size - 1) / 2) * copyWidth) + i * copyWidth, copyLattice.position.y, 0);
                                view.addChild(copyLattice);
                            }
                        }
                        this._setBuildingPosByLattles(view, useItems);
                    }
                    index += size;
                }
            }
        }
    }
    private _setBuildingPosByLattles(building: Node, lattices: InnerBuildingLatticeStruct[]) {
        if (lattices.length > 0) {
            const currentParentView: Node = this._allBuildingContentViews[lattices[0].routerIndex];
            if (currentParentView == undefined) {
                return;
            }
            building.setParent(currentParentView);
            let centerX: number = 0;
            let centerY: number = 0;
            if (lattices.length == 1) {
                centerX = lattices[0].node.position.x;
                centerY = lattices[0].node.position.y;
            } else if (lattices.length > 1) {
                for (const item of lattices) {
                    centerX += item.node.position.x;
                    centerY += item.node.position.y;
                }
                centerX = centerX / lattices.length;
                centerY = centerY / lattices.length;
            }
            const pos = building.parent
                .getComponent(UITransform)
                .convertToNodeSpaceAR(lattices[0].node.parent.getComponent(UITransform).convertToWorldSpaceAR(v3(centerX, centerY, 0)));
            building.position = pos;
        }
    }
    private _refreshBuilding() {
        const innerBuilds = DataMgr.s.innerBuilding.data;
        this._buildingMap.forEach(async (value: InnerBuildingView, key: InnerBuildingType) => {
            if (innerBuilds.has(key)) {
                value.node.active = true;
                await value.refreshUI(innerBuilds.get(key), !GameMainHelper.instance.isEditInnerBuildingLattice);
            } else {
                value.node.active = false;
            }
        });
    }
    private _refreshLattice() {
        for (const item of this._allLatticeItems) {
            item.node.active = GameMainHelper.instance.isEditInnerBuildingLattice;

            let useColor = null;
            if (item.showType == InnerBuildingLatticeShowType.None) {
                if (item.isEmpty) {
                    useColor = Color.WHITE;
                } else {
                    useColor = Color.YELLOW;
                }
            } else if (item.showType == InnerBuildingLatticeShowType.Clean) {
                useColor = Color.GREEN;
            } else if (item.showType == InnerBuildingLatticeShowType.Error) {
                useColor = Color.RED;
            }
            item.node.getChildByPath("Mask/SpriteSplash").getComponent(Sprite).color = useColor;
        }
    }
    private _checkEditBuildingCanSetLattice(): { canSet: boolean; useLattices: InnerBuildingLatticeStruct[] } {
        for (const item of this._allLatticeItems) {
            item.showType = InnerBuildingLatticeShowType.None;
        }
        if (this._latticeEditBuildingView == null) {
            return { canSet: false, useLattices: [] };
        }
        let buildingSize: number = 0;
        const editBuildingBoxes: Rect[] = [];
        for (const child of this._latticeEditBuildingView.children) {
            if (child.name.startsWith("buildingLattice_")) {
                editBuildingBoxes.push(child.getComponent(UITransform).getBoundingBoxToWorld());
                buildingSize += 1;
            }
        }
        let currentUseItems: InnerBuildingLatticeStruct[] = [];
        for (let i = 0; i < editBuildingBoxes.length; i++) {
            const standbyLattice: { intersection: Rect; item: InnerBuildingLatticeStruct }[] = [];
            for (const item of this._allLatticeItems) {
                const itemBox = item.node.getComponent(UITransform).getBoundingBoxToWorld();
                const intersection: Rect = rect(0, 0, 0, 0);
                Rect.intersection(intersection, itemBox, editBuildingBoxes[i]);
                if (intersection.width > 0 && intersection.height > 0) {
                    standbyLattice.push({
                        intersection: intersection,
                        item: item,
                    });
                }
            }
            // is intersect
            if (standbyLattice.length > 0) {
                standbyLattice.sort((a, b) => {
                    return b.intersection.width * b.intersection.height - a.intersection.width * a.intersection.height;
                });
                currentUseItems.push(standbyLattice[0].item);
                editBuildingBoxes.splice(i, 1);
                i--;
            }
        }
        // delete the same element
        currentUseItems = currentUseItems.reduce((accumulator: InnerBuildingLatticeStruct[], current: InnerBuildingLatticeStruct) => {
            if (!accumulator.some((temple) => temple == current)) {
                accumulator.push(current);
            }
            return accumulator;
        }, []);
        let isAllIntersectItemClean: boolean = true;
        for (const item of currentUseItems) {
            if (!item.isEmpty) {
                isAllIntersectItemClean = false;
                break;
            }
        }
        const canSet: boolean = isAllIntersectItemClean && editBuildingBoxes.length <= 0 && currentUseItems.length == buildingSize;
        for (const item of currentUseItems) {
            item.showType = canSet ? InnerBuildingLatticeShowType.Clean : InnerBuildingLatticeShowType.Error;
        }
        return { canSet: canSet, useLattices: currentUseItems };
    }

    private _generatePioneerMove() {
        if (this._allPioneerContentViews.length <= 0) {
            return;
        }
        const nodeScale: Vec3 = this.node.scale;
        const movePioneer = instantiate(this._movePioneer);
        const contentWidth: number = this._allBuildingContentViews[0].getComponent(UITransform).width;
        const contentHeight: number = this._allBuildingContentViews[0].getComponent(UITransform).height;
        const leftOriginalX: number = -contentWidth / 2 - movePioneer.getComponent(UITransform).width - 20;
        const rightOriginalX: number = contentWidth / 2 + movePioneer.getComponent(UITransform).width + 20;

        const contentIndex: number = CommonTools.getRandomInt(0, this._allPioneerContentViews.length - 1);
        const isMoveToRight: boolean = CommonTools.getRandomItem([true, false]);
        const originalX: number = isMoveToRight ? leftOriginalX : rightOriginalX;
        const originalY: number = CommonTools.getRandomInt(-contentHeight / 2, contentHeight / 2);

        movePioneer.setParent(this._allPioneerContentViews[contentIndex]);
        movePioneer.setPosition(v3(originalX, originalY, 0));
        movePioneer.setScale(v3((originalX > 0 ? -1 : 1) * nodeScale.x, 1 * nodeScale.y, 1 * nodeScale.z));
        this._allMovingPioneers.push(movePioneer);
        tween()
            .target(movePioneer)
            .to(12, { position: v3(isMoveToRight ? rightOriginalX : leftOriginalX, originalY, 0) })
            .call(() => {
                for (let i = 0; i < this._allMovingPioneers.length; i++) {
                    if (this._allMovingPioneers[i] == movePioneer) {
                        this._allMovingPioneers.splice(i, 1);
                        break;
                    }
                }
                movePioneer.destroy();
            })
            .start();

        const randomDelayNum: number = CommonTools.getRandomInt(1, 20);
        this.scheduleOnce(() => {
            this._generatePioneerMove();
        }, randomDelayNum);
    }

    //----------------------------------------- notificaiton
    private _onInnerBuildingLatticeEditChanged() {
        const edit: boolean = GameMainHelper.instance.isEditInnerBuildingLattice;
        if (edit) {
            GameMainHelper.instance.changeGameCameraPosition(Vec3.ZERO, true);
            GameMainHelper.instance.changeGameCameraZoom(1, true);
        }
        for (const view of this._allMovingPioneers) {
            view.active = !edit;
        }
        this._refreshBuilding();
        this._refreshLattice();
    }

    private _onEditActionMouseDown(data: { worldPos: Vec3 }) {
        // const localPos: Vec3 = this.node.getChildByPath("BuildingLattice").getComponent(UITransform).convertToNodeSpaceAR(data.worldPos);
        this._buildingMap.forEach((value: InnerBuildingView, key: InnerBuildingType) => {
            if (value.node.getComponent(UITransform).getBoundingBoxToWorld().contains(v2(data.worldPos.x, data.worldPos.y))) {
                GameMusicPlayMgr.playTapButtonEffect();
                // ghost show
                if (this._ghostBuildingView == null) {
                    this._ghostBuildingView = instantiate(value.node);
                    this._ghostBuildingView.parent = value.node.parent;
                    this._ghostBuildingView.addComponent(UIOpacity).opacity = 150;
                }
                // moveBuilding
                const moveParentView = this.node.getChildByPath("BuildingLattice");
                const latticeBuildingOriginalPos = moveParentView
                    .getComponent(UITransform)
                    .convertToNodeSpaceAR(value.node.parent.getComponent(UITransform).convertToWorldSpaceAR(value.node.position.clone()));
                this._latticeEditBuildingView = value.node;
                this._latticeEditBuildingView.removeFromParent();
                this._latticeEditBuildingView.setParent(moveParentView);
                this._latticeEditBuildingView.position = latticeBuildingOriginalPos;
                this._latticeEditBuildingView.setSiblingIndex(99999);
                this._latticeBuildingOriginalStayLaticeItems = [];
                for (const item of this._allLatticeItems) {
                    if (!item.isEmpty && item.stayBuilding == this._latticeEditBuildingView) {
                        item.isEmpty = true;
                        item.stayBuilding = null;
                        this._latticeBuildingOriginalStayLaticeItems.push(item);
                    }
                }
                this._checkEditBuildingCanSetLattice();
                this._refreshLattice();
            }
        });
    }
    private _onEditActionMouseUp(data: { worldPos: Vec3 }) {
        if (this._latticeEditBuildingView != null) {
            const canSetData = this._checkEditBuildingCanSetLattice();
            if (canSetData.canSet) {
                this._setSucceedLatticeItems = [];
                let minIndex: number = 9999999;
                for (const item of canSetData.useLattices) {
                    this._setSucceedLatticeItems.push(item);
                    const templeIndex: number = this._allLatticeItems.indexOf(item);
                    if (templeIndex >= 0 && templeIndex < this._allLatticeItems.length) {
                        minIndex = Math.min(minIndex, templeIndex);
                    }
                }
                this._buildingMap.forEach((value: InnerBuildingView, key: InnerBuildingType) => {
                    if (value.node == this._latticeEditBuildingView) {
                        const row: number = Math.floor(minIndex / this._latticeColumIndex);
                        const colunm: number = minIndex - row * this._latticeColumIndex;
                        const pos: [number, number] = [colunm, row];
                        NetworkMgr.websocketMsg.player_building_pos({
                            buildingId: key,
                            pos: pos,
                        });
                    }
                });
                return;
            } else {
                for (const item of this._latticeBuildingOriginalStayLaticeItems) {
                    item.isEmpty = false;
                    item.stayBuilding = this._latticeEditBuildingView;
                }
                this._setBuildingPosByLattles(this._latticeEditBuildingView, this._latticeBuildingOriginalStayLaticeItems);
            }
            for (const item of this._allLatticeItems) {
                item.showType = InnerBuildingLatticeShowType.None;
            }
            this._refreshLattice();
        }
        if (this._ghostBuildingView != null) {
            this._ghostBuildingView.destroy();
        }
        this._latticeEditBuildingView = null;
        this._latticeBuildingOriginalStayLaticeItems = [];
        this._ghostBuildingView = null;
    }
    private _onEditActionMouseMove(data: { movement: Vec2 }) {
        if (this._latticeEditBuildingView != null) {
            const currentPos = v3(this._latticeEditBuildingView.position.x + data.movement.x, this._latticeEditBuildingView.position.y + data.movement.y);

            this._latticeEditBuildingView.position = currentPos;
            this._checkEditBuildingCanSetLattice();
            this._refreshLattice();
        }
    }

    //---------------------------------- socket
    private _onBuildingPosChange = (e: any) => {
        const p: s2c_user.Iplayer_building_pos_res = e.data;
        if (p.res !== 1) {
            if (this._latticeEditBuildingView != null) {
                for (const item of this._latticeBuildingOriginalStayLaticeItems) {
                    item.isEmpty = false;
                    item.stayBuilding = this._latticeEditBuildingView;
                }
                this._setBuildingPosByLattles(this._latticeEditBuildingView, this._latticeBuildingOriginalStayLaticeItems);
            }
        } else {
            if (this._latticeEditBuildingView != null && this._setSucceedLatticeItems != null) {
                for (const item of this._setSucceedLatticeItems) {
                    item.isEmpty = false;
                    item.stayBuilding = this._latticeEditBuildingView;
                }
                this._setBuildingPosByLattles(this._latticeEditBuildingView, this._setSucceedLatticeItems);
            }
            this._setSucceedLatticeItems = null;
        }

        for (const item of this._allLatticeItems) {
            item.showType = InnerBuildingLatticeShowType.None;
        }
        this._refreshLattice();
        if (this._ghostBuildingView != null) {
            this._ghostBuildingView.destroy();
        }
        this._latticeEditBuildingView = null;
        this._latticeBuildingOriginalStayLaticeItems = [];
        this._ghostBuildingView = null;
    };
}
