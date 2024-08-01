import { Vec2, v2 } from "cc";
import { BuildingStayPosType, MapBuildingType } from "../../Const/BuildingDefine";
import { MapBuildingBaseObject, MapBuildingMainCityObject, MapBuildingObject, MapBuildingWormholeObject } from "../../Const/MapBuilding";
import CLog from "../../Utils/CLog";
import NetGlobalData from "./Data/NetGlobalData";
import { share } from "../../Net/msg/WebsocketMsg";
import GameMainHelper from "../../Game/Helper/GameMainHelper";
import { TileHexDirection } from "../../Game/TiledMap/TileTool";
import PioneerDefine from "../../Const/PioneerDefine";
import CommonTools from "../../Tool/CommonTools";
import { NetworkMgr } from "../../Net/NetworkMgr";
import { director } from "cc";

export class MapBuildingDataMgr {
    private _building_data: MapBuildingObject[];
    private _selfMainCityUniqueId: string = null;
    private _decorateInfoMap: Map<string, string>;
    private _requestHistory: Map<string, number> = new Map();
    public constructor() {}

    public getSelfMainCityUniqueId() {
        return this._selfMainCityUniqueId;
    }
    public getDecorateInfo() {
        return this._decorateInfoMap;
    }
    // ----------------------------------------------
    public replaceData(index: number, data: share.Imapbuilding_info_data) {
        const newObj = this._convertNetDataToObject(data);
        this._building_data[index] = newObj;
        return newObj;
    }
    public addData(data: share.Imapbuilding_info_data) {
        const newObj = this._convertNetDataToObject(data);
        this._building_data.push(newObj);
        return newObj;
    }
    public setDecorateInfo(slotId: string, templateConfigId: string) {
        if (slotId == null || templateConfigId == null) {
            return;
        }
        const mapWorldPos = CommonTools.convertSlotIdToMapWorldPos(slotId);
        const configId = templateConfigId.split("_")[1];
        this._decorateInfoMap.set(mapWorldPos.x + "_" + mapWorldPos.y, "outinfo_" + configId);
    }

    requestMapInfo(slotIds: any[]) {
        if (slotIds.length > 0) {
            let needs = [];
            let total = director.getTotalFrames();
            slotIds.forEach((slotId) => {
                if (this._requestHistory.has(slotId)) {
                    if (total - this._requestHistory.get(slotId) > 30000) {
                        needs.push(slotId);
                    }
                } else {
                    needs.push(slotId);
                    this._requestHistory.set(slotId, total);
                }
            });
            let needlen = needs.length;
            if (needlen > 0) {
                let rslen = Math.ceil(needlen / 3);
                for (let i = 0; i < rslen; i++) {
                    if (i == rslen - 1) {
                        NetworkMgr.websocketMsg.get_map_info({
                            slotIds: needs.slice(i * 3, needlen),
                        });
                    } else {
                        NetworkMgr.websocketMsg.get_map_info({
                            slotIds: needs.slice(i * 3, i * 3 + 3),
                        });
                    }
                }
            }
        }
    }

    public async loadObj() {
        this._building_data = [];
        if (NetGlobalData.mapBuildings == null) {
            return;
        }
        const mapBuilings = NetGlobalData.mapBuildings.buildings;
        for (const key in mapBuilings) {
            const element = this._convertNetDataToObject(mapBuilings[key]);
            if (element.type == MapBuildingType.city) {
                this._selfMainCityUniqueId = element.uniqueId;
            }
            this._building_data.push(element);
        }

        this._decorateInfoMap = new Map();
        this.setDecorateInfo(NetGlobalData.mapBuildings.slotId, NetGlobalData.mapBuildings.templateConfigId);
        this._initInterval();
        CLog.debug("MapBuildingDataMgr: loadObj/building_data, ", this._building_data);
    }

    // get obj
    public getObj_building() {
        return this._building_data;
    }
    public getBuildingById(uniqueId: string): MapBuildingObject | null {
        const findDatas = this._building_data.filter((buiding) => {
            return buiding.uniqueId === uniqueId;
        });
        if (findDatas.length > 0) {
            return findDatas[0];
        }
        return null;
    }
    public fillBuildingStayPos(uniqueId: string, newPosions: Vec2[]) {
        const findBuilding = this.getBuildingById(uniqueId);
        if (findBuilding == null) return;

        findBuilding.stayMapPositions = newPosions;
    }
    public getStrongholdBuildings() {
        return this._building_data.filter((buiding) => {
            return buiding.type === MapBuildingType.stronghold;
        });
    }
    public getWormholeBuildings() {
        return this._building_data.filter((buiding) => {
            return buiding.type === MapBuildingType.wormhole;
        });
    }
    public getShowBuildingByMapPos(mapPos: Vec2): MapBuildingObject | null {
        const findDatas = this._building_data.filter((buiding) => {
            if (buiding.show) {
                for (const pos of buiding.stayMapPositions) {
                    if (pos.x === mapPos.x && pos.y === mapPos.y) {
                        return true;
                    }
                }
            }
            return false;
        });
        if (findDatas.length > 0) {
            return findDatas[0];
        }
        return null;
    }

    private _convertNetDataToObject(element: share.Imapbuilding_info_data): MapBuildingObject {
        const stayPos: Vec2[] = [];
        for (const poskey in element.stayMapPositions) {
            let templePos = element.stayMapPositions[poskey];
            stayPos.push(new Vec2(templePos.x, templePos.y));
        }
        if (stayPos.length == 1) {
            if (GameMainHelper.instance.isTiledMapHelperInited) {
                const originalPos = stayPos[0];
                if (element.stayPosType == BuildingStayPosType.Three) {
                    const leftBottom = GameMainHelper.instance.tiledMapGetAroundByDirection(originalPos, TileHexDirection.LeftBottom);
                    const rightBottom = GameMainHelper.instance.tiledMapGetAroundByDirection(originalPos, TileHexDirection.RightBottom);
                    stayPos.push(v2(leftBottom.x, leftBottom.y));
                    stayPos.push(v2(rightBottom.x, rightBottom.y));
                } else if (element.stayPosType == BuildingStayPosType.Seven) {
                    const leftTop = GameMainHelper.instance.tiledMapGetAroundByDirection(originalPos, TileHexDirection.LeftTop);
                    const rightTop = GameMainHelper.instance.tiledMapGetAroundByDirection(originalPos, TileHexDirection.RightTop);
                    const left = GameMainHelper.instance.tiledMapGetAroundByDirection(originalPos, TileHexDirection.Left);
                    const right = GameMainHelper.instance.tiledMapGetAroundByDirection(originalPos, TileHexDirection.Right);
                    const leftBottom = GameMainHelper.instance.tiledMapGetAroundByDirection(originalPos, TileHexDirection.LeftBottom);
                    const rightBottom = GameMainHelper.instance.tiledMapGetAroundByDirection(originalPos, TileHexDirection.RightBottom);
                    stayPos.splice(0, 0, v2(leftTop.x, leftTop.y));
                    stayPos.splice(0, 0, v2(rightTop.x, rightTop.y));
                    stayPos.splice(0, 0, v2(left.x, left.y));
                    stayPos.push(v2(right.x, right.y));
                    stayPos.push(v2(leftBottom.x, leftBottom.y));
                    stayPos.push(v2(rightBottom.x, rightBottom.y));
                }
            }
        }
        const baseObj: MapBuildingBaseObject = {
            uniqueId: element.uniqueId,
            id: element.id,
            name: element.name,
            type: element.type,
            level: element.level,
            show: element.show,
            faction: element.faction,

            stayPosType: element.stayPosType,
            stayMapPositions: stayPos,
            animType: element.animType,

            defendPioneerIds: element.defendPioneerIds == null ? [] : element.defendPioneerIds,

            gatherPioneerIds: element.gatherPioneerIds == null ? [] : element.gatherPioneerIds,
            quota: element.quota,

            eventId: element.eventId,
            eventIndex: element.eventIndex,
            eventSubId: element.eventSubId,
            eventWaitFightEnemyId: element.eventWaitFightEnemyId,
            eventPioneerIds: element.eventPioneerIds == null ? [] : element.eventPioneerIds,
            eventPioneerDatas: new Map(),

            explorePioneerIds: element.explorePioneerIds == null ? [] : element.explorePioneerIds,

            progress: element.progress,
            exp: element.exp,

            winprogress: element.winprogress,

            rebornTime: element.rebornTime == null ? 0 : element.rebornTime * 1000,
        };
        if (element.eventPioneerDatas != null) {
            for (const key in element.eventPioneerDatas) {
                const temple = element.eventPioneerDatas[key];
                baseObj.eventPioneerDatas.set(key, PioneerDefine.convertNetDataToObject(temple));
            }
        }

        if (baseObj.type == MapBuildingType.city) {
            const cityObj: MapBuildingMainCityObject = {
                ...baseObj,
                hpMax: element.hpMax,
                hp: element.hp,
                attack: element.attack,
                taskObj: null,
            };
            return cityObj;
        } else if (baseObj.type == MapBuildingType.wormhole) {
            const attackerMap: Map<number, string> = new Map();
            for (const key in element.attacker) {
                if (element.attacker[key] == null || element.attacker[key] == "") {
                    continue;
                }
                attackerMap.set(parseInt(key), element.attacker[key]);
            }
            const wormholeObj: MapBuildingWormholeObject = {
                ...baseObj,
                wormholdCountdownTime: element.wormholdCountdownTime * 1000,
                attacker: attackerMap,
            };
            return wormholeObj;
        } else {
            return baseObj;
        }
    }
    private _initInterval() {}
}
