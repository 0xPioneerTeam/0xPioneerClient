import { CurveRange, Vec2 } from "cc";
import CommonTools from "../Tool/CommonTools";
import { AttrChangeType, GameExtraEffectType, MapMemberFactionType, MapMemberTargetType, ResourceCorrespondingItem } from "../Const/ConstDefine";
import { GameMgr, ItemMgr, LanMgr } from "../Utils/Global";
import { UIHUDController } from "../UI/UIHUDController";
import NotificationMgr from "../Basic/NotificationMgr";
import { MapBuildingType } from "../Const/BuildingDefine";
import { EventConfigData } from "../Const/Event";
import EventConfig from "../Config/EventConfig";
import { NotificationName } from "../Const/Notification";
import GameMainHelper from "../Game/Helper/GameMainHelper";

import {
    MapPioneerType,
    MapPioneerActionType,
    MapPioneerEventStatus,
    MapPioneerLogicType,
    MapPioneerObject,
    MapPioneerLogicObject,
    MapPlayerPioneerObject,
    MapPioneerAttributesChangeModel,
    MapPioneerEventAttributesChangeType,
} from "../Const/PioneerDefine";
import { DataMgr } from "../Data/DataMgr";
import { MapBuildingMainCityObject, MapBuildingObject, MapBuildingTavernObject } from "../Const/MapBuilding";
import ItemConfigDropTool from "../Tool/ItemConfigDropTool";
import { PioneersDataMgr } from "../Data/Save/PioneersDataMgr";
import { NetworkMgr } from "../Net/NetworkMgr";
import UIPanelManger from "../Basic/UIPanelMgr";
import { UIName } from "../Const/ConstUIDefine";
import { TavernUI } from "../UI/Outer/TavernUI";

export default class PioneerMgr {
    public initData() {
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_MOVE_MEETTED, this._onPioneerMoveMeeted, this);
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_LOGIC_MOVE, this._onPioneerLogicMove, this);
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_REBIRTH_BEGIN, this._onPioneerRebirthBegin, this);
    }
    public pioneerHealHpToMax(pioneerId: string) {
        const costTroops: number = DataMgr.s.pioneer.gainHp(pioneerId, DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Troop));
        if (costTroops > 0) {
            DataMgr.s.item.subObj_item(ResourceCorrespondingItem.Troop, costTroops);
        }
    }
    public pioneerChangeHpMax(pioneerId: string, num: number) {
        DataMgr.s.pioneer.changeHpMax(pioneerId, num);
    }
    public pioneerChangeAttack(pioneerId: string, num: number) {
        DataMgr.s.pioneer.changeAttack(pioneerId, num);
    }
    public pioneerChangeAllPlayerHpMax(num: number) {
        for (const pioneer of DataMgr.s.pioneer.getAllPlayers()) {
            DataMgr.s.pioneer.changeHpMax(pioneer.id, num);
        }
    }
    public pioneerChangeAllPlayerAttack(num: number) {
        for (const pioneer of DataMgr.s.pioneer.getAllPlayers()) {
            DataMgr.s.pioneer.changeAttack(pioneer.id, num);
        }
    }
    public pioneerDidMoveOneStep(pioneerId: string) {
        const findPioneer = DataMgr.s.pioneer.getById(pioneerId);
        if (findPioneer != undefined) {
            const allBuildings = DataMgr.s.mapBuilding.getObj_building();
            for (const building of allBuildings) {
                if (building.show && building.faction != MapMemberFactionType.neutral && building.defendPioneerIds.indexOf(pioneerId) != -1) {
                    DataMgr.s.mapBuilding.removeDefendPioneer(building.id, pioneerId);
                    break;
                }
            }
            DataMgr.s.pioneer.didMoveStep(pioneerId);
        }
    }
    public showPioneer(pioneerId: string) {
        if (DataMgr.s.pioneer.changeShow(pioneerId, true)) {
            const pioneer = DataMgr.s.pioneer.getById(pioneerId);
            if (pioneer.type == MapPioneerType.player) {
                DataMgr.s.settlement.addObj({
                    level: DataMgr.s.userInfo.data.level,
                    newPioneerIds: [pioneerId],
                    killEnemies: 0,
                    gainResources: 0,
                    consumeResources: 0,
                    gainTroops: 0,
                    consumeTroops: 0,
                    gainEnergy: 0,
                    consumeEnergy: 0,
                    exploredEvents: 0,
                });
            }
        }
    }
    // public linkNFTToPioneer(pioneerId: string, NFTId: string) {
    //     const findPioneer = this.getPioneerById(pioneerId);
    //     if (findPioneer != null) {
    //         findPioneer.NFTId = NFTId;
    //         this._savePioneerData();
    //     }
    // }
    public pioneerToIdle(pioneerId: string) {
        DataMgr.s.pioneer.changeActionType(pioneerId, MapPioneerActionType.idle);
        DataMgr.s.pioneer.changeEventStatus(pioneerId, MapPioneerEventStatus.None);
        // check defend to idle
        for (const building of DataMgr.s.mapBuilding.getStrongholdBuildings()) {
            if (building.defendPioneerIds.indexOf(pioneerId) != -1) {
                DataMgr.s.mapBuilding.removeDefendPioneer(building.id, pioneerId);
                break;
            }
        }
        // check wormhold to idle
        for (const building of DataMgr.s.mapBuilding.getWormholeBuildings()) {
            if (building.defendPioneerIds.indexOf(pioneerId) != -1) {
                DataMgr.s.mapBuilding.removeDefendPioneer(building.id, pioneerId);
                break;
            }
        }
    }
    public pioneerEventStatusToNone(pioneerId: string) {
        DataMgr.s.pioneer.changeEventStatus(pioneerId, MapPioneerEventStatus.None);
    }
    public pioneerDealWithEvent(pioneerId: string, buildingId: string, currentEvent: EventConfigData) {
        const pioneer = DataMgr.s.pioneer.getById(pioneerId);
        if (pioneer == undefined) {
            return;
        }
        if (currentEvent == null) {
            return;
        }
        //send data
        DataMgr.setTempSendData("player_event_select_res", {
            pioneerId: pioneerId,
            buildingId: buildingId,
            eventData: currentEvent,
        });
        NetworkMgr.websocketMsg.player_event_select({ pioneerId: pioneerId, buildingId: buildingId, eventId: currentEvent.id });
    }

    public fight(
        attacker: MapPioneerObject,
        pioneerDefender: MapPioneerObject,
        buildingDefender: MapBuildingObject,
        isEventFight: boolean = false,
        eventCenterPositions: Vec2[] = null,
        temporaryAttributes: Map<string, MapPioneerAttributesChangeModel> = null,
        fightOverCallback: (isSelfWin: boolean) => void = null
    ) {
        const isAttackBuilding: boolean = buildingDefender != null;
        const isSelfAttack: boolean = attacker.type == MapPioneerType.player;
        let canFight: boolean = true;
        if (isEventFight) {
        } else {
            if (attacker.actionType != MapPioneerActionType.moving && attacker.actionType != MapPioneerActionType.idle) {
                canFight = false;
            } else {
                if (!isAttackBuilding) {
                    if (pioneerDefender.actionType != MapPioneerActionType.moving && pioneerDefender.actionType != MapPioneerActionType.idle) {
                        canFight = false;
                    }
                }
            }
        }
        if (attacker.type == MapPioneerType.hred) {
            if (isAttackBuilding) {
                canFight = false;
            } else {
                if (pioneerDefender.type != MapPioneerType.player) {
                    canFight = false;
                }
            }
        }
        if (!canFight) {
            return;
        }

        DataMgr.setTempSendData("player_fight_res", {
            isAttackBuilding: isAttackBuilding,
            isSelfAttack: isSelfAttack,
            attacker: attacker,
            pioneerDefender: pioneerDefender,
            buildingDefender: buildingDefender,
            isEventFight: isEventFight,
            eventCenterPositions: eventCenterPositions,
            temporaryAttributes: temporaryAttributes,
            fightOverCallback: fightOverCallback,
        });
        NetworkMgr.websocketMsg.player_fight({
            isTakeTheInitiative: isSelfAttack,
            isBuildingDefender: isAttackBuilding,
            attackerId: attacker.id,
            defenderId: isAttackBuilding ? buildingDefender.id : pioneerDefender.id,
        });
    }
    public setMovingTarget(pioneerId: string, target: MapMemberTargetType, id: string) {
        if (pioneerId != null && id != null) {
            this._movingTargetDataMap.set(pioneerId, { target: target, id: id });
        }
    }

    private _movingTargetDataMap: Map<string, { target: MapMemberTargetType; id: string }> = new Map();
    public constructor() {}

    private async _moveMeeted(pioneerId: string, isStay: boolean = true) {
        const pioneerDataMgr: PioneersDataMgr = DataMgr.s.pioneer;
        const pioneer: MapPioneerObject = pioneerDataMgr.getById(pioneerId);
        if (pioneer == undefined) {
            return;
        }
        const movingTargetData = this._movingTargetDataMap.get(pioneer.id);
        let stayBuilding: MapBuildingObject = null;
        if (movingTargetData != null && movingTargetData.target == MapMemberTargetType.building) {
            const templeBuildings = DataMgr.s.mapBuilding.getShowBuildingsNearMapPos(pioneer.stayPos, 2);
            if (templeBuildings.length > 0) {
                // use first find building
                stayBuilding = templeBuildings[0];
            }
            this._movingTargetDataMap.delete(pioneer.id);
        } else {
            stayBuilding = DataMgr.s.mapBuilding.getShowBuildingByMapPos(pioneer.stayPos);
        }
        const currentTimeStamp = new Date().getTime();
        if (stayBuilding == null) {
            let stayPioneers;
            if (movingTargetData != null && movingTargetData.target == MapMemberTargetType.pioneer) {
                // if target pioneer is moving, than try get it from near position;
                stayPioneers = pioneerDataMgr.getByNearPos(pioneer.stayPos, 2, true);
                this._movingTargetDataMap.delete(pioneer.id);
            } else {
                stayPioneers = pioneerDataMgr.getByStayPos(pioneer.stayPos, true);
            }
            let interactPioneer: MapPioneerObject = null;
            for (const stayPioneer of stayPioneers) {
                if (stayPioneer.id != pioneer.id) {
                    interactPioneer = stayPioneer;
                    break;
                }
            }
            if (interactPioneer != null) {
                if (pioneer.type == MapPioneerType.player || interactPioneer.type == MapPioneerType.player) {
                    DataMgr.s.count.addObj_actionPioneer({
                        actionPid: pioneer.id,
                        interactPid: interactPioneer.id,
                    });
                }
                if (pioneer.faction == MapMemberFactionType.friend && interactPioneer.faction == MapMemberFactionType.friend) {
                    if (interactPioneer.type == MapPioneerType.npc) {
                        // get task
                        DataMgr.setTempSendData("player_explore_res", {
                            pioneerId: pioneerId,
                            isExporeBuilding: false,
                            exploreId: interactPioneer.id,
                            actionType: MapPioneerActionType.exploring,
                        });
                        NetworkMgr.websocketMsg.player_explore({
                            pioneerId: pioneerId,
                            isExporeBuilding: false,
                            exploreId: interactPioneer.id,
                        });
                    } else if (interactPioneer.type == MapPioneerType.gangster) {
                        // get more hp
                        DataMgr.setTempSendData("player_explore_res", {
                            pioneerId: pioneerId,
                            isExporeBuilding: false,
                            exploreId: interactPioneer.id,
                            actionType: MapPioneerActionType.addingtroops,
                        });
                        NetworkMgr.websocketMsg.player_explore({
                            pioneerId: pioneerId,
                            isExporeBuilding: false,
                            exploreId: interactPioneer.id,
                        });
                    } else {
                        pioneerDataMgr.changeActionType(pioneerId, MapPioneerActionType.idle);
                    }
                } else if (pioneer.faction == MapMemberFactionType.enemy && interactPioneer.faction == MapMemberFactionType.enemy) {
                    if (isStay) {
                        pioneerDataMgr.changeActionType(pioneerId, MapPioneerActionType.idle);
                    }
                } else {
                    // nonfriendly, fight
                    this.fight(pioneer, interactPioneer, null);
                }
            } else {
                if (isStay) {
                    pioneerDataMgr.changeActionType(pioneerId, MapPioneerActionType.idle);
                }
            }
        } else {
            // building
            // need changed. use manger to deal with pioneer and building
            if (pioneer.type == MapPioneerType.player) {
                DataMgr.s.count.addObj_actionBuilding({
                    actionPid: pioneer.id,
                    interactBId: stayBuilding.id,
                });
            }
            if (stayBuilding.type == MapBuildingType.city) {
                if (
                    (pioneer.type == MapPioneerType.player &&
                        pioneer.faction == MapMemberFactionType.friend &&
                        stayBuilding.faction == MapMemberFactionType.enemy) ||
                    (pioneer.id == "gangster_3" && pioneer.faction == MapMemberFactionType.enemy && stayBuilding.faction != MapMemberFactionType.enemy)
                ) {
                    const cityBuilding = stayBuilding as MapBuildingMainCityObject;
                    if (cityBuilding.taskObj != null) {
                        pioneerDataMgr.changeActionType(pioneerId, MapPioneerActionType.idle);
                        // wait xx
                        // if (
                        //     cityBuilding.taskObj.entrypoint.talk != null &&
                        //     cityBuilding.taskObj.entrypoint.triggerpioneerId != null &&
                        //     cityBuilding.taskObj.entrypoint.triggerpioneerId == pioneer.id
                        // ) {
                        //     if (pioneer.logics.length > 0) {
                        //         // clear logic
                        //         pioneer.logics = [];
                        //         this._savePioneerData();
                        //     }
                        //     // for (const observer of this._observers) {
                        //     //     observer.showGetTaskDialog(cityBuilding.taskObj);
                        //     // }
                        //     DataMgr.s.mapBuilding.buildingClearTask(cityBuilding.id);
                        // }
                    } else {
                        this.fight(pioneer, null, stayBuilding);
                    }
                } else {
                    if (isStay) {
                        pioneerDataMgr.changeActionType(pioneerId, MapPioneerActionType.idle);
                    }
                }
            } else if (stayBuilding.type == MapBuildingType.explore) {
                if (pioneer.type == MapPioneerType.player && pioneer.faction == MapMemberFactionType.friend) {
                    DataMgr.setTempSendData("player_explore_res", {
                        pioneerId: pioneerId,
                        isExporeBuilding: true,
                        exploreId: stayBuilding.id,
                        actionType: MapPioneerActionType.exploring,
                    });
                    NetworkMgr.websocketMsg.player_explore({
                        pioneerId: pioneerId,
                        isExporeBuilding: true,
                        exploreId: stayBuilding.id,
                    });
                } else {
                    if (pioneer.name == "gangster_3") {
                        DataMgr.s.mapBuilding.hideBuilding(stayBuilding.id, pioneer.id);
                    }
                    if (isStay) {
                        pioneerDataMgr.changeActionType(pioneerId, MapPioneerActionType.idle);
                    }
                }
            } else if (stayBuilding.type == MapBuildingType.stronghold) {
                // 0-idle 1-fight 2-defend
                let tempAction: number = 0;
                if (pioneer.type == MapPioneerType.player && pioneer.faction == MapMemberFactionType.friend) {
                    if (stayBuilding.faction != MapMemberFactionType.enemy) {
                        DataMgr.setTempSendData("player_explore_res", {
                            pioneerId: pioneerId,
                            isExporeBuilding: true,
                            exploreId: stayBuilding.id,
                            actionType: MapPioneerActionType.defend,
                        });
                        NetworkMgr.websocketMsg.player_explore({
                            pioneerId: pioneerId,
                            isExporeBuilding: true,
                            exploreId: stayBuilding.id,
                        });
                        tempAction = 2;
                    } else {
                        tempAction = 1;
                    }
                } else {
                    if (pioneer.id == "gangster_3" && stayBuilding.id == "building_4") {
                        if (stayBuilding.faction != MapMemberFactionType.friend || stayBuilding.defendPioneerIds.length <= 0) {
                            tempAction = 0;
                            DataMgr.s.mapBuilding.hideBuilding(stayBuilding.id, pioneer.id);
                        } else {
                            // wait xx
                            // pioneer.loseHp(Math.floor(pioneer.hp / 2));
                            // pioneer.changeAttack({
                            //     type: AttrChangeType.MUL,
                            //     value: -0.5,
                            // });
                            tempAction = 1;
                        }
                    } else {
                        tempAction = 0;
                    }
                }
                if (tempAction == 0) {
                    if (isStay) {
                        pioneerDataMgr.changeActionType(pioneerId, MapPioneerActionType.idle);
                    }
                } else if (tempAction == 1) {
                    this.fight(pioneer, null, stayBuilding);
                } else if (tempAction == 2) {
                }
            } else if (stayBuilding.type == MapBuildingType.wormhole) {
                if (pioneer.type == MapPioneerType.player) {
                    if (stayBuilding.faction != MapMemberFactionType.enemy) {
                        DataMgr.setTempSendData("player_explore_res", {
                            pioneerId: pioneerId,
                            isExporeBuilding: true,
                            exploreId: stayBuilding.id,
                            actionType: MapPioneerActionType.wormhole,
                        });
                        NetworkMgr.websocketMsg.player_explore({
                            pioneerId: pioneerId,
                            isExporeBuilding: true,
                            exploreId: stayBuilding.id,
                        });
                    } else {
                        pioneerDataMgr.changeActionType(pioneerId, MapPioneerActionType.idle);
                    }
                } else {
                    if (isStay) {
                        pioneerDataMgr.changeActionType(pioneerId, MapPioneerActionType.idle);
                    }
                }
            } else if (stayBuilding.type == MapBuildingType.resource) {
                if (pioneer.type == MapPioneerType.player && pioneer.faction != MapMemberFactionType.enemy) {
                    DataMgr.setTempSendData("player_gather_res", { pioneerId: pioneerId, buildingId: stayBuilding.id });
                    NetworkMgr.websocketMsg.player_gather({ pioneerId: pioneerId, resourceBuildingId: stayBuilding.id });
                } else {
                    if (isStay) {
                        pioneerDataMgr.changeActionType(pioneerId, MapPioneerActionType.idle);
                    }
                }
            } else if (stayBuilding.type == MapBuildingType.event) {
                if (pioneer.type == MapPioneerType.player) {
                    let currentEvent = EventConfig.getById(stayBuilding.eventId);
                    if (currentEvent != null) {
                        this.pioneerDealWithEvent(pioneer.id, stayBuilding.id, currentEvent);
                    }
                } else {
                    if (isStay) {
                        pioneerDataMgr.changeActionType(pioneerId, MapPioneerActionType.idle);
                    }
                }
            } else if (stayBuilding.type == MapBuildingType.tavern) {
                if (pioneer.type == MapPioneerType.player) {
                    const tavern = stayBuilding as MapBuildingTavernObject;
                    if (tavern.tavernCountdownTime <= 0 && tavern.nft == null) {
                        const result = await UIPanelManger.inst.pushPanel(UIName.TavernUI);
                        if (result.success) {
                            result.node.getComponent(TavernUI).configuration(stayBuilding.id);
                        }
                    }
                } else {
                    if (isStay) {
                        pioneerDataMgr.changeActionType(pioneerId, MapPioneerActionType.idle);
                    }
                }
            }
        }
    }

    //------------------------------- notification
    private _onPioneerMoveMeeted(data: { pioneerId: string; isStay: boolean }) {
        this._moveMeeted(data.pioneerId, data.isStay);
    }
    private _onPioneerLogicMove(data: { id: string; logic: MapPioneerLogicObject }) {
        const pioneer = DataMgr.s.pioneer.getById(data.id);
        if (pioneer == undefined) {
            return;
        }
        let targetMapPos: Vec2 = null;
        if (data.logic.type == MapPioneerLogicType.stepmove) {
            // get target pos
            const targetTiledPos = GameMainHelper.instance.tiledMapGetAroundByDirection(pioneer.stayPos, data.logic.stepMove.direction);
            if (targetTiledPos != null) {
                targetMapPos = new Vec2(targetTiledPos.x, targetTiledPos.y);
            }
        } else if (data.logic.type == MapPioneerLogicType.targetmove) {
            targetMapPos = data.logic.targetMove.targetPos;
        } else if (data.logic.type == MapPioneerLogicType.patrol) {
            // randomNextPos
            do {
                const xNegative: boolean = CommonTools.getRandomInt(0, 1) == 0;
                const xChangeNum: number = CommonTools.getRandomInt(0, data.logic.patrol.range);
                const yNegative: boolean = CommonTools.getRandomInt(0, 1) == 0;
                const yChangeNum: number = CommonTools.getRandomInt(0, data.logic.patrol.range);
                let nextPos = data.logic.patrol.originalPos.clone();
                if (xNegative) {
                    nextPos.x -= xChangeNum;
                } else {
                    nextPos.x += xChangeNum;
                }
                if (yNegative) {
                    nextPos.y -= yChangeNum;
                } else {
                    nextPos.y += yChangeNum;
                }
                targetMapPos = nextPos;
                if (GameMainHelper.instance.tiledMapIsBlock(nextPos)) {
                    // isblock
                    targetMapPos = null;
                } else {
                    const pioneers = DataMgr.s.pioneer.getByStayPos(nextPos, true);
                    if (pioneers.length > 0) {
                        for (const temple of pioneers) {
                            if (temple.type != MapPioneerType.player) {
                                targetMapPos = null;
                                break;
                            }
                        }
                    } else {
                        const buildings = DataMgr.s.mapBuilding.getShowBuildingByMapPos(nextPos);
                        if (buildings != null) {
                            targetMapPos = null;
                        }
                    }
                }
            } while (targetMapPos == null);
        }
        if (targetMapPos != null) {
            const moveData = GameMainHelper.instance.tiledMapGetTiledMovePathByTiledPos(pioneer.stayPos, targetMapPos);
            if (moveData.canMove) {
                DataMgr.s.pioneer.beginMove(pioneer.id, moveData.path);
            }
        }
    }
    private _onPioneerRebirthBegin(data: { id: string }) {
        const pioneer = DataMgr.s.pioneer.getById(data.id) as MapPlayerPioneerObject;
        if (!!pioneer) {
            let rebirthMapPos = null;
            const mainCity = DataMgr.s.mapBuilding.getBuildingById("building_1");
            if (mainCity != null && mainCity.faction != MapMemberFactionType.enemy) {
                rebirthMapPos = mainCity.stayMapPositions[1];
            } else {
                if (pioneer.killerId != null && pioneer.killerId.includes("building")) {
                    const killerBuilding = DataMgr.s.mapBuilding.getBuildingById(pioneer.killerId);
                    if (killerBuilding != null) {
                        rebirthMapPos = new Vec2(killerBuilding.stayMapPositions[0].x - 1, killerBuilding.stayMapPositions[0].y);
                    }
                } else {
                    rebirthMapPos = new Vec2(pioneer.stayPos.x - 1, pioneer.stayPos.y);
                }
            }
            let rebirthHp: number = Math.max(1, Math.min(DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Troop), pioneer.hpMax));
            DataMgr.s.item.subObj_item(ResourceCorrespondingItem.Troop, rebirthHp);
            DataMgr.s.pioneer.rebirth(data.id, rebirthHp, rebirthMapPos);
        }
    }
}
