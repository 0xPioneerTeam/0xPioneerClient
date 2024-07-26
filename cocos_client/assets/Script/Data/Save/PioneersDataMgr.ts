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
    private _currentActionPioneerId: string = null;
    public constructor() {}
    //-------------------------------- public
    public loadObj() {
        this._initData();
    }
    //-------------- get
    public getAll(): MapPioneerObject[] {
        return this._pioneers;
    }
    public getAllPlayers(): MapPlayerPioneerObject[] {
        return this._pioneers.filter((p) => p.type == MapPioneerType.player) as MapPlayerPioneerObject[];
    }
    public getAllNpcs(forceShow: boolean = false): MapNpcPioneerObject[] {
        if (forceShow) {
            return this._pioneers.filter((p) => p.show == true && p.type == MapPioneerType.npc) as MapNpcPioneerObject[];
        } else {
            return this._pioneers.filter((p) => p.type == MapPioneerType.npc) as MapNpcPioneerObject[];
        }
    }
    public getById(pioneerId: string, forceShow: boolean = false): MapPioneerObject | undefined {
        if (forceShow) {
            return this._pioneers.find((p) => p.show && p.id == pioneerId);
        } else {
            return this._pioneers.find((p) => p.id == pioneerId);
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
    public getCurrentActionIsBusy(): boolean {
        let busy: boolean = false;
        const findPioneer = this._pioneers.find((pioneer) => pioneer.id === this._currentActionPioneerId);
        if (findPioneer != undefined) {
            busy =
                findPioneer.actionType != MapPioneerActionType.idle &&
                findPioneer.actionType != MapPioneerActionType.eventing &&
                findPioneer.actionType != MapPioneerActionType.wormhole;
        }
        return busy;
    }
    public getCurrentPlayer(): MapPlayerPioneerObject | undefined {
        return this._pioneers.find((p) => p.id === this._currentActionPioneerId && p.type === MapPioneerType.player) as MapPlayerPioneerObject;
    }
    //-------------- change
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
    public changeCurrentAction(pioneerId: string) {
        this._currentActionPioneerId = pioneerId;
    }
    public changeActionType(pioneerId: string, type: MapPioneerActionType) {
        const findPioneer = this.getById(pioneerId);
        if (findPioneer == undefined) return;
        findPioneer.actionType = type;
        NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_ACTIONTYPE_CHANGED, { id: pioneerId });
    }
    public changePos(pioneerId: string, pos: Vec2) {
        const findPioneer = this.getById(pioneerId);
        if (findPioneer == undefined) return;
        findPioneer.stayPos = pos;
    }
    public changeTalk(pioneerId: string, talkId: string) {
        const pioneer = this.getById(pioneerId);
        if (pioneer == undefined) {
            return;
        }
        const npcObj: MapNpcPioneerObject = pioneer as MapNpcPioneerObject;
        if (!!npcObj) {
            if (npcObj.talkId == talkId) {
                return;
            }
            npcObj.talkId = talkId;
            NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_TALK_CHANGED, { id: pioneerId, talkId: npcObj.talkId });
        }
    }

    // move
    public beginMove(pioneerId: string, movePaths: TilePos[], forceShowMovePath: boolean = false) {
        const findPioneer = this.getById(pioneerId);
        if (findPioneer != undefined) {
            if (movePaths.length > 0) {
                findPioneer.movePaths = movePaths;

                this.changeActionType(pioneerId, MapPioneerActionType.moving);
                let showMovePath: boolean = false;
                if (forceShowMovePath) {
                    showMovePath = true;
                } else {
                    if (findPioneer.type == MapPioneerType.player) {
                        showMovePath = true;
                    }
                }
                NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_BEGIN_MOVE, { id: pioneerId, showMovePath: showMovePath });
            } else {
                NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_MOVE_MEETTED, { pioneerId: findPioneer.id, interactDirectly: true });
            }
        }
    }
    public didMoveStep(pioneerId: string) {
        const findPioneer = this.getById(pioneerId);
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
                this.changeActionType(pioneerId, MapPioneerActionType.idle);
                NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_MOVE_MEETTED, { pioneerId: findPioneer.id, interactDirectly: false });
            }
            if (findPioneer.type == MapPioneerType.player) {
                NotificationMgr.triggerEvent(NotificationName.MAP_PLAYER_PIONEER_DID_MOVE_STEP, { id: pioneerId });
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
            this._pioneers.push(PioneerDefine.convertNetDataToObject(netPioneers[key]));
        }
        // default player id is "0"
        this._currentActionPioneerId = "pioneer_0";

        this._initInterval();
        this._addListeners();
    }

    private _initInterval() {
        // wait TODO
        // now donnot have auto move logic 5-29
        // setInterval(() => {
        //     for (const pioneer of this._pioneers) {
        //         if (pioneer.show) {
        //             if (pioneer.actionType == MapPioneerActionType.idle) {
        //                 // xx wait player cannot do logic
        //                 if (pioneer.type != MapPioneerType.player && pioneer.logics.length > 0) {
        //                     const logic = pioneer.logics[0];
        //                     let logicMove: boolean = false;
        //                     if (logic.type == MapPioneerLogicType.stepmove) {
        //                         if (logic.repeat > 0 || logic.repeat == -1) {
        //                             if (logic.currentCd > 0) {
        //                                 //move cd count
        //                                 logic.currentCd -= 1;
        //                             }
        //                             if (logic.currentCd == 0) {
        //                                 logicMove = true;
        //                                 logic.currentCd = logic.stepMove.cd;
        //                                 if (logic.repeat > 0) {
        //                                     logic.repeat -= 1;
        //                                 }
        //                             }
        //                             if (logic.repeat == 0) {
        //                                 pioneer.logics.splice(0, 1);
        //                             }
        //                         }
        //                     } else if (logic.type == MapPioneerLogicType.targetmove) {
        //                         logicMove = true;
        //                         pioneer.logics.splice(0, 1);
        //                     } else if (logic.type == MapPioneerLogicType.patrol) {
        //                         if (logic.repeat > 0 || logic.repeat == -1) {
        //                             if (logic.currentCd > 0) {
        //                                 logic.currentCd -= 1;
        //                             }
        //                             if (logic.currentCd == 0) {
        //                                 logic.currentCd = CommonTools.getRandomInt(logic.patrol.intervalRange[0], logic.patrol.intervalRange[1]);
        //                                 logicMove = true;
        //                                 if (logic.repeat > 0) {
        //                                     logic.repeat -= 1;
        //                                 }
        //                                 if (logic.repeat == 0) {
        //                                     pioneer.logics.splice(0, 1);
        //                                 }
        //                             }
        //                         }
        //                     } else if (logic.type == MapPioneerLogicType.hide) {
        //                         // this.changeShow(pioneer.id, false);
        //                         pioneer.logics.splice(0, 1);
        //                     }
        //                     if (logicMove) {
        //                         NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_LOGIC_MOVE, { id: pioneer.id, logic: logic });
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // }, 1000);
    }
    private _addListeners() {}
}
