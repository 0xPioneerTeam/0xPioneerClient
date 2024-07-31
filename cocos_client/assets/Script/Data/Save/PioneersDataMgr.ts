import { Vec2, v2 } from "cc";
import PioneerConfig from "../../Config/PioneerConfig";
import { TileHexDirection, TilePos } from "../../Game/TiledMap/TileTool";
import { GetPropData, MapMemberFactionType, MapMemberTargetType } from "../../Const/ConstDefine";
import PioneerDefine, {
    MapNpcPioneerObject,
    MapPioneerActionType,
    MapPioneerLogicType,
    MapPioneerObject,
    MapPioneerType,
    MapPlayerPioneerObject,
} from "../../Const/PioneerDefine";
import { NotificationName } from "../../Const/Notification";
import NotificationMgr from "../../Basic/NotificationMgr";
import { Ichange_pioneer_type, s2c_user, share } from "../../Net/msg/WebsocketMsg";
import CommonTools from "../../Tool/CommonTools";
import { PioneerFactionAction, TaskFactionAction, TaskNpcGetNewTalkAction, TaskShowHideAction, TaskShowHideStatus } from "../../Const/TaskDefine";
import { NFTPioneerObject } from "../../Const/NFTPioneerDefine";
import NetGlobalData from "./Data/NetGlobalData";

export class PioneersDataMgr {
    private _pioneers: MapPioneerObject[] = [];
    private _currentActionUniqueId: string = null;
    private _selfPioneerUnqueIds: string[] = [];
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
    public getAllNpcs(forceShow: boolean = false): MapNpcPioneerObject[] {
        // wait change
        if (forceShow) {
            return this._pioneers.filter((p) => p.show == true && p.type == MapPioneerType.npc) as MapNpcPioneerObject[];
        } else {
            return this._pioneers.filter((p) => p.type == MapPioneerType.npc) as MapNpcPioneerObject[];
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
    //-------------- change
    public addData(data: share.Ipioneer_data) {
        const newObj = PioneerDefine.convertNetDataToObject(data);
        this._pioneers.push(newObj);
        return newObj;
    }
    public replaceData(index: number, data: share.Ipioneer_data) {
        const newObj = PioneerDefine.convertNetDataToObject(data);
        if (this._pioneers[index].actionType == MapPioneerActionType.moving) {
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
    public changeActionType(uniqueId: string, type: MapPioneerActionType) {
        const findPioneer = this.getById(uniqueId);
        if (findPioneer == undefined) return;
        findPioneer.actionType = type;
        NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_ACTIONTYPE_CHANGED, { uniqueId: uniqueId });
    }
    public changePos(uniqueId: string, pos: Vec2) {
        const findPioneer = this.getById(uniqueId);
        if (findPioneer == undefined) return;
        findPioneer.stayPos = pos;
    }
    public changeTalk(uniqueId: string, talkId: string) {
        const pioneer = this.getById(uniqueId);
        if (pioneer == undefined) {
            return;
        }
        const npcObj: MapNpcPioneerObject = pioneer as MapNpcPioneerObject;
        if (!!npcObj) {
            if (npcObj.talkId == talkId) {
                return;
            }
            npcObj.talkId = talkId;
            NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_TALK_CHANGED, { uniqueId: uniqueId, talkId: npcObj.talkId });
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
                this.changeActionType(uniqueId, MapPioneerActionType.idle);
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

    }
}
