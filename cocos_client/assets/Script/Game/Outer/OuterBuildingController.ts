import { _decorator, Component, instantiate, macro, Node, Prefab, UITransform, v3, Vec2, Vec3 } from "cc";
import { TileHexDirection, TilePos } from "../TiledMap/TileTool";
import { OuterBuildingView } from "./View/OuterBuildingView";
import GameMainHelper from "../Helper/GameMainHelper";
import { OuterTiledMapActionController } from "./OuterTiledMapActionController";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import { DataMgr } from "../../Data/DataMgr";
import { BuildingStayPosType, MapBuildingType } from "../../Const/BuildingDefine";
import { OuterRebonAndDestroyView } from "./View/OuterRebonAndDestroyView";
import { Rect } from "cc";
import { v2 } from "cc";

const { ccclass, property } = _decorator;
const _rect_temp = new Rect();

@ccclass("OuterBuildingController")
export class OuterBuildingController extends Component {
    public getBuildingView(buildingId: string): OuterBuildingView {
        if (this._buildingMap.has(buildingId)) {
            const view = this._buildingMap.get(buildingId).node.getComponent(OuterBuildingView);
            return view;
        }
        return null;
    }

    @property(Prefab)
    private buildingPrefab;

    @property(Prefab)
    private rebonPrefab;

    private _buildingMap: Map<string, { node: Node; stayPositons: Vec2[] }> = new Map();

    protected onLoad() {
        NotificationMgr.addListener(NotificationName.MAP_BUILDING_NEED_REFRESH, this._refreshUI, this);
        NotificationMgr.addListener(NotificationName.MAP_BUILDING_SHOW_CHANGE, this._onBuildingShowChange, this);
        NotificationMgr.addListener(NotificationName.MAP_BUILDING_WORMHOLE_ATTACKER_CHANGE, this._refreshUI, this);
        NotificationMgr.addListener(NotificationName.MAP_BUILDING_WORMHOLE_ATTACK_COUNT_DONW_TIME_CHANGE, this._refreshUI, this);
        NotificationMgr.addListener(NotificationName.MAP_BUILDING_ACTION_PIONEER_CHANGE, this._refreshUI, this);
        NotificationMgr.addListener(NotificationName.MAP_BUILDING_REBON_CHANGE, this._refreshUI, this);

        NotificationMgr.addListener(NotificationName.ROOKIE_GUIDE_TAP_MAP_BUILDING, this._onRookieTapBuilding, this);
        // lan
        NotificationMgr.addListener(NotificationName.CHANGE_LANG, this._refreshUI, this);
    }

    start() {
        // buildingPos
        const allBuildings = DataMgr.s.mapBuilding.getObj_building();

        for (const building of allBuildings) {
            if (building.stayPosType == BuildingStayPosType.One) {
                // no action
            } else if (building.stayMapPositions.length == 1) {
                const newPos = [].concat(building.stayMapPositions);
                const originalPos = newPos[0];
                if (building.stayPosType == BuildingStayPosType.Three) {
                    newPos.push(GameMainHelper.instance.tiledMapGetAroundByDirection(originalPos, TileHexDirection.LeftBottom));
                    newPos.push(GameMainHelper.instance.tiledMapGetAroundByDirection(originalPos, TileHexDirection.RightBottom));
                } else if (building.stayPosType == BuildingStayPosType.Seven) {
                    newPos.splice(0, 0, GameMainHelper.instance.tiledMapGetAroundByDirection(originalPos, TileHexDirection.LeftTop));
                    newPos.splice(0, 0, GameMainHelper.instance.tiledMapGetAroundByDirection(originalPos, TileHexDirection.RightTop));
                    newPos.splice(0, 0, GameMainHelper.instance.tiledMapGetAroundByDirection(originalPos, TileHexDirection.Left));
                    newPos.push(GameMainHelper.instance.tiledMapGetAroundByDirection(originalPos, TileHexDirection.Right));
                    newPos.push(GameMainHelper.instance.tiledMapGetAroundByDirection(originalPos, TileHexDirection.LeftBottom));
                    newPos.push(GameMainHelper.instance.tiledMapGetAroundByDirection(originalPos, TileHexDirection.RightBottom));
                }
                DataMgr.s.mapBuilding.fillBuildingStayPos(building.uniqueId, newPos);
            }
        }

        this._refreshUI();


        this.scheduleOnce(async () => {
            const mainCity = allBuildings.find((item) => {
                return item.type == MapBuildingType.city;
            });
            if (mainCity != undefined && mainCity.stayMapPositions.length == 7) {
                const centerPos = mainCity.stayMapPositions[3];
                const currentWorldPos = GameMainHelper.instance.tiledMapGetPosWorld(centerPos.x, centerPos.y);
                GameMainHelper.instance.changeGameCameraWorldPosition(currentWorldPos);
                // game camera zoom
                const localOuterMapScale = localStorage.getItem("local_outer_map_scale");
                if (localOuterMapScale != null) {
                    GameMainHelper.instance.changeGameCameraZoom(parseFloat(localOuterMapScale));
                }
            }
        });
        // // decorations
        // const decorates = BuildingMgr.getAllDecorate();
        // for (const decorate of decorates) {
        //     if (decorate.posMode == MapDecoratePosMode.World) {
        //         const tiledPositions: Vec2[] = [];
        //         for (const worldPos of decorate.stayMapPositions) {
        //             let tempwp = this.node.getComponent(UITransform).convertToWorldSpaceAR(v3(
        //                 worldPos.x,
        //                 worldPos.y,
        //                 0
        //             ));
        //             ;
        //             const tilePos = GameMainHelper.instance.tiledMapGetTiledPosByWorldPos(tempwp);
        //             tiledPositions.push(v2(
        //                 tilePos.x,
        //                 tilePos.y
        //             ));
        //         }
        //         BuildingMgr.changeDecorateWorldPosToTiledPos(decorate.id, tiledPositions);
        //     }
        // }

        // this._refreshDecorationUI();
    }

    update(deltaTime: number) { }

    protected onDestroy(): void {
        NotificationMgr.removeListener(NotificationName.MAP_BUILDING_NEED_REFRESH, this._refreshUI, this);
        NotificationMgr.removeListener(NotificationName.MAP_BUILDING_SHOW_CHANGE, this._onBuildingShowChange, this);
        NotificationMgr.removeListener(NotificationName.MAP_BUILDING_WORMHOLE_ATTACKER_CHANGE, this._refreshUI, this);
        NotificationMgr.removeListener(NotificationName.MAP_BUILDING_WORMHOLE_ATTACK_COUNT_DONW_TIME_CHANGE, this._refreshUI, this);
        NotificationMgr.removeListener(NotificationName.MAP_BUILDING_ACTION_PIONEER_CHANGE, this._refreshUI, this);
        NotificationMgr.removeListener(NotificationName.MAP_BUILDING_REBON_CHANGE, this._refreshUI, this);

        NotificationMgr.removeListener(NotificationName.ROOKIE_GUIDE_TAP_MAP_BUILDING, this._onRookieTapBuilding, this);
        // lan
        NotificationMgr.removeListener(NotificationName.CHANGE_LANG, this._refreshUI, this);
    }


    refreshUI(rect: Rect, rect2: Rect) {
        _rect_temp.x = rect.x - 100;
        _rect_temp.y = rect.y - 100;
        _rect_temp.width = rect.width + 200;
        _rect_temp.height = rect.height + 200;
        this._buildingMap.forEach((value, key) => {
            const node = value.node;
            if (_rect_temp.contains(v2(node.position.x, node.position.y))) {
                node.active = true;
            } else {
                node.active = false;
            }
        })
    }

    private _refreshUI() {
        const decorationView = this.node.getComponent(OuterTiledMapActionController).mapDecorationView();
        if (decorationView == null) {
            return;
        }
        let changed: boolean = true;
        const allBuildings = DataMgr.s.mapBuilding.getObj_building();
        for (const building of allBuildings) {
            if (building.show) {
                let temple = null;
                if (this._buildingMap.has(building.uniqueId)) {
                    temple = this._buildingMap.get(building.uniqueId).node;
                } else {
                    // new
                    temple = instantiate(this.buildingPrefab);
                    temple.name = "MAP_" + building.uniqueId;
                    temple.setParent(decorationView);
                    this._buildingMap.set(building.uniqueId, { node: temple, stayPositons: building.stayMapPositions });

                    changed = true;
                }
                if (temple != null) {
                    temple.getComponent(OuterBuildingView).refreshUI(building);
                    if (building.stayMapPositions.length > 0) {
                        let pixelPos = null;
                        if (building.stayMapPositions.length == 7) {
                            pixelPos = GameMainHelper.instance.tiledMapGetPosPixel(building.stayMapPositions[3].x, building.stayMapPositions[3].y);
                        } else if (building.stayMapPositions.length == 3) {
                            const beginWorldPos = GameMainHelper.instance.tiledMapGetPosPixel(building.stayMapPositions[0].x, building.stayMapPositions[0].y);
                            const endWorldPos = GameMainHelper.instance.tiledMapGetPosPixel(building.stayMapPositions[1].x, building.stayMapPositions[1].y);
                            pixelPos = v3(beginWorldPos.x, endWorldPos.y + (beginWorldPos.y - endWorldPos.y) / 2, 0);
                        } else {
                            pixelPos = GameMainHelper.instance.tiledMapGetPosPixel(building.stayMapPositions[0].x, building.stayMapPositions[0].y);
                        }
                        temple.setPosition(pixelPos);

                        for (const pos of building.stayMapPositions) {
                            GameMainHelper.instance.tiledMapAddDynamicBlock(pos,building.uniqueId);
                        }
                    }
                }
            } else {
                if (this._buildingMap.has(building.uniqueId)) {
                    const data = this._buildingMap.get(building.uniqueId);
                    data.node.destroy();
                    for (const pos of data.stayPositons) {
                        GameMainHelper.instance.tiledMapRemoveDynamicBlock(pos,building.uniqueId);
                    }
                    this._buildingMap.delete(building.uniqueId);
                }
            }
        }
        // destroy
        this._buildingMap.forEach((value: { node: Node; stayPositons: Vec2[] }, key: string) => {
            let isExsit: boolean = false;
            for (const building of allBuildings) {
                if (building.uniqueId == key) {
                    isExsit = true;
                    break;
                }
            }
            if (!isExsit) {
                value.node.destroy();
                for (const pos of value.stayPositons) {
                    GameMainHelper.instance.tiledMapRemoveDynamicBlock(pos,key);
                }
                this._buildingMap.delete(key);
            }
        });

        if (changed) {
            this.node.getComponent(OuterTiledMapActionController).sortMapItemSiblingIndex();
        }
    }

    //------------------------------------------------- notification
    private _onBuildingShowChange(data: { uniqueId: string; show: boolean }) {
        const { uniqueId, show } = data;
        this._refreshUI();
        const building = DataMgr.s.mapBuilding.getBuildingById(uniqueId);
        if (building == null || (building.type != MapBuildingType.event && building.type != MapBuildingType.resource)) {
            return;
        }
        if (building.stayMapPositions.length > 0) {
            let pixelPos = null;
            if (building.stayMapPositions.length == 7) {
                pixelPos = GameMainHelper.instance.tiledMapGetPosPixel(building.stayMapPositions[3].x, building.stayMapPositions[3].y);
            } else if (building.stayMapPositions.length == 3) {
                const beginWorldPos = GameMainHelper.instance.tiledMapGetPosPixel(building.stayMapPositions[0].x, building.stayMapPositions[0].y);
                const endWorldPos = GameMainHelper.instance.tiledMapGetPosPixel(building.stayMapPositions[1].x, building.stayMapPositions[1].y);
                pixelPos = v3(beginWorldPos.x, endWorldPos.y + (beginWorldPos.y - endWorldPos.y) / 2, 0);
            } else {
                pixelPos = GameMainHelper.instance.tiledMapGetPosPixel(building.stayMapPositions[0].x, building.stayMapPositions[0].y);
            }
            const decorationView = this.node.getComponent(OuterTiledMapActionController).mapDecorationView();

            const rebornView: Node = instantiate(this.rebonPrefab);
            rebornView.setParent(decorationView);
            rebornView.setPosition(pixelPos);
            rebornView.getComponent(OuterRebonAndDestroyView).playAnim(show ? 2 : 0);
        }
    }

    private _onRookieTapBuilding(data: { buildingId: string }) {
        const struct = this._buildingMap.get(data.buildingId);
        if (struct == null) {
            return;
        }
        this.getComponent(OuterTiledMapActionController)._clickOnMap(struct.node.worldPosition);
    }
}
