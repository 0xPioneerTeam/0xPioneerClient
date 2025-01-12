import { Vec2, v2 } from "cc";
import { TilePos } from "../../Game/TiledMap/TileTool";
import PioneerDefine, { MapPioneerActionType, MapPioneerObject, MapPioneerType, MapPlayerPioneerObject } from "../../Const/PioneerDefine";
import { NotificationName } from "../../Const/Notification";
import NotificationMgr from "../../Basic/NotificationMgr";
import { share } from "../../Net/msg/WebsocketMsg";
import NetGlobalData from "./Data/NetGlobalData";
import { MapMemberFactionType } from "../../Const/ConstDefine";
import PioneerConfig from "../../Config/PioneerConfig";

export class PioneersDataMgr {
    private _pioneers: MapPioneerObject[] = [];
    private _currentActionUniqueId: string = null;
    private _selfPioneerUnqueIds: string[] = [];
    private _interactSelectedUniqueId: string = null;
    public constructor() {}
    //-------------------------------- public
    public loadObj() {
        this._initData();
    }
    //-------------- get
    public getAll(): MapPioneerObject[] {
        return this._pioneers;
    }
    public getAllSelfPlayers(): MapPlayerPioneerObject[] {
        return this._pioneers.filter((p) => p.type == MapPioneerType.player && this._selfPioneerUnqueIds.indexOf(p.uniqueId) != -1) as MapPlayerPioneerObject[];
    }
    public getAllNpcs(forceShow: boolean = false) {
        // wait change
        if (forceShow) {
            return this._pioneers.filter((p) => p.show == true && p.type == MapPioneerType.npc);
        } else {
            return this._pioneers.filter((p) => p.type == MapPioneerType.npc);
        }
    }
    public getById(uniqueId: string, forceShow: boolean = false): MapPioneerObject | undefined {
        if (forceShow) {
            return this._pioneers.find((p) => p.show && p.uniqueId == uniqueId);
        } else {
            return this._pioneers.find((p) => p.uniqueId == uniqueId);
        }
    }
    public getByStayPos(stayPos: Vec2, forceShow: boolean = false): MapPioneerObject[] {
        if (forceShow) {
            return this._pioneers.filter((p) => p.show && p.stayPos.equals(stayPos));
        } else {
            return this._pioneers.filter((p) => p.stayPos.equals(stayPos));
        }
    }
    public getByNearPos(pos: Vec2, range: number, forceShow: boolean): MapPioneerObject[] {
        return this._pioneers.filter((pioneer: MapPioneerObject) => {
            if (Math.abs(pioneer.stayPos.x - pos.x) < range && Math.abs(pioneer.stayPos.y - pos.y) < range) {
                if (forceShow && pioneer.show) {
                    return true;
                } else {
                    return pioneer.show;
                }
            }
            return false;
        });
    }
    public getCurrentPlayer(): MapPlayerPioneerObject | undefined {
        return this._pioneers.find((p) => p.uniqueId === this._currentActionUniqueId && p.type === MapPioneerType.player) as MapPlayerPioneerObject;
    }
    public getInteractSelectUnqueId(): string | null {
        return this._interactSelectedUniqueId;
    }
    //-------------- change
    public createFakeData(uniqueId: string, pos: Vec2) {
        const pioneerId: string = uniqueId.split("|")[1];
        const animType = PioneerConfig.getById(pioneerId)?.animType;
        let obj: MapPlayerPioneerObject = {
            uniqueId: uniqueId,
            id: pioneerId,
            show: true,
            level: 1,
            faction: MapMemberFactionType.friend,
            type: MapPioneerType.player,
            animType: animType == undefined ? "self" : animType,
            name: uniqueId,
            hp: 0,
            hpMax: 0,
            attack: 0,
            defend: 0,
            speed: 0,
            energy: 0,
            energyMax: 0,
            stayPos: pos,
            movePaths: [],
            actionType: MapPioneerActionType.staying,
            actionBeginTimeStamp: 0,
            actionEndTimeStamp: 0,
            actionEndReturn: false,
            logics: [],
            winProgress: 0,
            winExp: 0,
            drop: [],
            rebirthStartTime: 0,
            rebirthEndTime: 0,
            killerId: "",
            NFTId: "",
            rebornTime: 0,
            NFTInitLinkId: null,
            troopId: "0",
        };
        return obj;
    }

    public createNPCData(uniqueId: string, pos: Vec2) {
        const pioneerId: string = uniqueId.split("|")[1];
        const animType = PioneerConfig.getById(pioneerId)?.animType;
        let obj: MapPlayerPioneerObject = {
            uniqueId: uniqueId,
            id: pioneerId,
            show: true,
            level: 1,
            faction: MapMemberFactionType.friend,
            type: MapPioneerType.npc,
            animType: animType == undefined ? "self" : animType,
            name: uniqueId,
            hp: 0,
            hpMax: 0,
            attack: 0,
            defend: 0,
            speed: 0,
            energy: 0,
            energyMax: 0,
            stayPos: pos,
            movePaths: [],
            actionType: MapPioneerActionType.staying,
            actionBeginTimeStamp: 0,
            actionEndTimeStamp: 0,
            actionEndReturn: false,
            logics: [],
            winProgress: 0,
            winExp: 0,
            drop: [],
            rebirthStartTime: 0,
            rebirthEndTime: 0,
            killerId: "",
            NFTId: "",
            rebornTime: 0,
            troopId: "0",

            NFTInitLinkId: null
        };
        return obj;
    }

    public addData(data: share.Ipioneer_data, isSelfPioneer: boolean = false) {
        const isExit = this._pioneers.findIndex((item) => item.uniqueId == data.uniqueId) != -1;
        if (isExit) {
            return;
        }
        const newObj = PioneerDefine.convertNetDataToObject(data);
        if (newObj.actionType == MapPioneerActionType.moving && newObj.movePaths.length > 0) {
            // new pioneer show is moveing, staypos set to move begin pos
            newObj.stayPos = newObj.movePaths[0] as Vec2;
        }
        this._pioneers.push(newObj);
        if (isSelfPioneer) {
            this._selfPioneerUnqueIds.push(data.uniqueId);
        }
    }
    public addObjData(data: MapPioneerObject) {
        const isExit = this._pioneers.findIndex((item) => item.uniqueId == data.uniqueId) != -1;
        if (isExit) {
            return;
        }
        this._pioneers.push(data);
    }
    public removeDataByPlayerId(playerId: number) {
        this._pioneers = this._pioneers.filter((obj) => obj.uniqueId.split("|")[0] != playerId.toString());
    }
    public removeDataByUniqueId(uniqueId: string) {
        for (let i = 0; i < this._pioneers.length; i++) {
            if (this._pioneers[i].uniqueId == uniqueId) {
                this._pioneers.splice(i, 1);
                break;
            }
        }
    }
    public replaceData(index: number, data: share.Ipioneer_data) {
        const newObj = PioneerDefine.convertNetDataToObject(data);
        if (newObj.actionType != MapPioneerActionType.inCity && this._pioneers[index].actionType == MapPioneerActionType.moving) {
            newObj.stayPos = this._pioneers[index].stayPos;
            newObj.movePaths = this._pioneers[index].movePaths;
            newObj.actionBeginTimeStamp = 0;
            newObj.actionEndTimeStamp = 0;
        }
        this._pioneers[index] = newObj;
        return newObj;
    }
    public changeCurrentAction(uniqueId: string) {
        this._currentActionUniqueId = uniqueId;
    }
    public changeInteractSelected(uniqueId: string) {
        this._interactSelectedUniqueId = uniqueId;
        NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_INTERACT_SELECT_CHANGED);
    }
    public clearInteractSelected() {
        this._interactSelectedUniqueId = null;
        NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_INTERACT_SELECT_CHANGED);
    }
    public changeActionType(uniqueId: string, type: MapPioneerActionType) {
        const findPioneer = this.getById(uniqueId);
        if (findPioneer == undefined) return;
        findPioneer.actionType = type;
        NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_ACTIONTYPE_CHANGED, { uniqueId: uniqueId });
        if (findPioneer.actionType === MapPioneerActionType.inCity && findPioneer.uniqueId === this._interactSelectedUniqueId) {
            this.clearInteractSelected();
        }
    }
    // move
    public beginMove(uniqueId: string, movePaths: TilePos[], forceShowMovePath: boolean = false) {
        const findPioneer = this.getById(uniqueId);
        if (findPioneer != undefined) {
            if (movePaths.length > 0) {
                findPioneer.movePaths = movePaths;

                this.changeActionType(uniqueId, MapPioneerActionType.moving);
                let showMovePath: boolean = false;
                if (forceShowMovePath) {
                    showMovePath = true;
                } else {
                    if (findPioneer.type == MapPioneerType.player) {
                        showMovePath = true;
                    }
                }
                NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_BEGIN_MOVE, { uniqueId: uniqueId, showMovePath: showMovePath });
            } else {
                NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_MOVE_MEETTED, { uniqueId: uniqueId, interactDirectly: true });
            }
        }
    }
    public didMoveStep(uniqueId: string) {
        const findPioneer = this.getById(uniqueId);
        if (findPioneer != undefined) {
            if (findPioneer.movePaths.length > 0) {
                findPioneer.movePaths.shift();
                // old logic: enemy step trigger
                // now donn't trigger step meet 5-29
                // if (findPioneer.type != MapPioneerType.player && findPioneer.faction == MapMemberFactionType.enemy) {
                //     NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_MOVE_MEETTED, { pioneerId: findPioneer.id, isStay: false });
                // }
            }
            if (findPioneer.movePaths.length == 0) {
                // move over trigger
                this.changeActionType(uniqueId, MapPioneerActionType.staying);
                NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_MOVE_MEETTED, { uniqueId: uniqueId, interactDirectly: false });
            }
            if (findPioneer.type == MapPioneerType.player) {
                NotificationMgr.triggerEvent(NotificationName.MAP_PLAYER_PIONEER_DID_MOVE_STEP, { uniqueId: uniqueId });
            }
        }
    }

    private _initData() {
        if (NetGlobalData.usermap == null) {
            return;
        }
        this._pioneers = [];
        const netPioneers = NetGlobalData.usermap.pioneer;
        for (const key in netPioneers) {
            const pioneer = PioneerDefine.convertNetDataToObject(netPioneers[key]);
            this._selfPioneerUnqueIds.push(pioneer.uniqueId);
            if (pioneer.id == "pioneer_0") {
                this._currentActionUniqueId = pioneer.uniqueId;
            }
            this._pioneers.push(pioneer);
        }
        for (const key in NetGlobalData.mapBuildings.pioneers) {
            this._pioneers.push(PioneerDefine.convertNetDataToObject(NetGlobalData.mapBuildings.pioneers[key]));
        }

        NotificationMgr.addListener(NotificationName.GAME_INNER_AND_OUTER_CHANGED, this._onGameInnerAndOuterChanged, this);
    }

    //---------------------------- notifiy
    private _onGameInnerAndOuterChanged() {
        this.clearInteractSelected();
    }
}
