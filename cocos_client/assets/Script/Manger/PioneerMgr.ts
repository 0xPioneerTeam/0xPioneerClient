import { Vec2, v2 } from "cc";
import CommonTools from "../Tool/CommonTools";
import { MapMemberFactionType, MapMemberTargetType } from "../Const/ConstDefine";
import NotificationMgr from "../Basic/NotificationMgr";
import { MapBuildingType } from "../Const/BuildingDefine";
import { NotificationName } from "../Const/Notification";
import GameMainHelper from "../Game/Helper/GameMainHelper";

import {
    MapPioneerType,
    MapPioneerActionType,
    MapPioneerLogicType,
    MapPioneerObject,
    MapPioneerLogicObject,
    MapPioneerAttributesChangeModel,
} from "../Const/PioneerDefine";
import { DataMgr } from "../Data/DataMgr";
import { MapBuildingMainCityObject, MapBuildingObject, MapBuildingTavernObject, MapBuildingWormholeObject } from "../Const/MapBuilding";
import { PioneersDataMgr } from "../Data/Save/PioneersDataMgr";
import { NetworkMgr } from "../Net/NetworkMgr";
import UIPanelManger from "../Basic/UIPanelMgr";
import { UIName } from "../Const/ConstUIDefine";
import { TavernUI } from "../UI/Outer/TavernUI";
import PioneerConfig from "../Config/PioneerConfig";
import { GameMgr } from "../Utils/Global";

export default class PioneerMgr {
    public initData() {
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_MOVE_MEETTED, this._onPioneerMoveMeeted, this);
    }
    public pioneerDidMoveOneStep(uniqueId: string) {
        const findPioneer = DataMgr.s.pioneer.getById(uniqueId);
        if (findPioneer != undefined) {
            DataMgr.s.pioneer.didMoveStep(uniqueId);
        }
    }
    public showFakeWormholeFight(attackerPlayerName: string) {
        const wormholePioneer = DataMgr.s.pioneer.getById("wormhole_token");
        const mainCity = DataMgr.s.mapBuilding.getBuildingById("building_1");

        if (wormholePioneer == null || mainCity == null) {
            return;
        }
        const wormholePioneerConfig = PioneerConfig.getById("wormhole_token");
        wormholePioneer.stayPos = wormholePioneerConfig != null ? v2(wormholePioneerConfig.pos[0].x, wormholePioneerConfig.pos[0].y) : v2(28, 17);
        wormholePioneer.name = attackerPlayerName;
        wormholePioneer.show = true;
        NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_SHOW_CHANGED, { uniqueId: wormholePioneer.id, show: wormholePioneer.show });

        const moveData = GameMainHelper.instance.tiledMapGetTiledMovePathByTiledPos(wormholePioneer.stayPos, mainCity.stayMapPositions[0]);
        if (!moveData.canMove) {
            return;
        }
        DataMgr.s.pioneer.beginMove(wormholePioneer.id, moveData.path);
    }

    public fight(attacker: MapPioneerObject, pioneerDefender: MapPioneerObject) {
        const isAttackBuilding: boolean = false;
        let canFight: boolean = true;

        if (attacker.actionType != MapPioneerActionType.moving && attacker.actionType != MapPioneerActionType.idle) {
            canFight = false;
        } else {
            if (!isAttackBuilding) {
                if (pioneerDefender.actionType != MapPioneerActionType.moving && pioneerDefender.actionType != MapPioneerActionType.idle) {
                    canFight = false;
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
        if (attacker.type == MapPioneerType.player) {
            NetworkMgr.websocketMsg.player_fight_start({
                attackerId: attacker.uniqueId,
                defenderId: pioneerDefender.uniqueId,
                isReturn: this._checkActionSendParamRetrun(attacker.uniqueId),
            });
        }
    }
    public setMovingTarget(uniqueId: string, target: MapMemberTargetType, id: string) {
        if (uniqueId != null && id != null) {
            this._movingTargetDataMap.set(uniqueId, { target: target, id: id });
        }
    }
    //----------------------- return action
    public doActionOverRetrun(uniqueId: string) {
        const pioneer = DataMgr.s.pioneer.getById(uniqueId);
        if (pioneer == undefined) {
            return;
        }
        if (pioneer.actionEndReturn) {
            DataMgr.s.pioneer.changeActionType(uniqueId, MapPioneerActionType.inCity);
            DataMgr.s.pioneer.changePos(uniqueId, GameMgr.getMainCityGatePos());
        }
    }

    public addActionOverReturnPioneer(uniqueId: string) {
        this._actionOverReturnPioneerUniqueId.push(uniqueId);
    }

    private _movingTargetDataMap: Map<string, { target: MapMemberTargetType; id: string }> = new Map();
    private _actionOverReturnPioneerUniqueId: string[] = [];
    public constructor() {}

    private async _moveMeeted(uniqueId: string, interactDirectly: boolean) {
        const pioneerDataMgr: PioneersDataMgr = DataMgr.s.pioneer;
        const pioneer: MapPioneerObject = pioneerDataMgr.getById(uniqueId);
        if (pioneer == undefined) {
            return;
        }
        const movingTargetData = this._movingTargetDataMap.get(pioneer.uniqueId);
        const pioneerStayAroundPos = GameMainHelper.instance.tiledMapGetExtAround(pioneer.stayPos, 2);
        let stayBuilding: MapBuildingObject = null;
        if (movingTargetData != null && movingTargetData.target == MapMemberTargetType.building) {
            for (const aroundPos of pioneerStayAroundPos) {
                const building = DataMgr.s.mapBuilding.getShowBuildingByMapPos(v2(aroundPos.x, aroundPos.y));
                if (building == null || building.uniqueId != movingTargetData.id) {
                    continue;
                }
                stayBuilding = building;
                break;
            }
            this._movingTargetDataMap.delete(pioneer.uniqueId);
        } else {
            stayBuilding = DataMgr.s.mapBuilding.getShowBuildingByMapPos(pioneer.stayPos);
        }

        let interactDelayTime: number = 0;
        if (!interactDirectly) {
            interactDelayTime = 250;
        }

        if (stayBuilding == null) {
            if (pioneer.id == "wormhole_token") {
                // wait change
                // fake wormhole enemy cannot meet pioneer
                return;
            }
            let stayPioneers;
            if (movingTargetData != null && movingTargetData.target == MapMemberTargetType.pioneer) {
                // if target pioneer is moving, than try get it from near position;
                stayPioneers = pioneerDataMgr.getByNearPos(pioneer.stayPos, 2, true);
                this._movingTargetDataMap.delete(pioneer.uniqueId);
            } else {
                stayPioneers = pioneerDataMgr.getByStayPos(pioneer.stayPos, true);
            }
            let interactPioneer: MapPioneerObject = null;
            for (const stayPioneer of stayPioneers) {
                if (movingTargetData != null && stayPioneer.uniqueId == movingTargetData.id) {
                    interactPioneer = stayPioneer;
                    break;
                }
            }
            if (interactPioneer != null) {
                // wait change
                // if (GameMainHelper.instance.currentTrackingInteractData().interactPioneerId == interactPioneer.id) {
                //     GameMainHelper.instance.hideTrackingView();
                // }
                // meet pioneer
                if (pioneer.faction == MapMemberFactionType.friend && interactPioneer.faction == MapMemberFactionType.friend) {
                    if (interactPioneer.type == MapPioneerType.npc) {
                        // get task
                        setTimeout(() => {
                            NetworkMgr.websocketMsg.player_explore_npc_start({
                                pioneerId: uniqueId,
                                npcId: interactPioneer.uniqueId,
                            });
                        }, interactDelayTime);
                    } else if (interactPioneer.type == MapPioneerType.gangster) {
                        // old logic: get more hp
                        // wait TODO
                    } else {
                        pioneerDataMgr.changeActionType(uniqueId, MapPioneerActionType.idle);
                    }
                } else if (pioneer.faction == MapMemberFactionType.enemy && interactPioneer.faction == MapMemberFactionType.enemy) {
                } else {
                    // nonfriendly, fight
                    setTimeout(() => {
                        this.fight(pioneer, interactPioneer);
                    }, interactDelayTime);
                }
            } else {
                // move to empty pos
                this.doActionOverRetrun(uniqueId);
            }
        } else {
            // building
            // need changed. use manger to deal with pioneer and building
            // wait change
            // if (GameMainHelper.instance.currentTrackingInteractData().interactBuildingId == stayBuilding.id) {
            //     GameMainHelper.instance.hideTrackingView();
            // }
            if (stayBuilding.type == MapBuildingType.city) {
                // now only deal with fake fight
                if (pioneer.id == "wormhole_token") {
                    pioneer.show = false;
                    NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_SHOW_CHANGED, { uniqueId: uniqueId, show: pioneer.show });
                    NotificationMgr.triggerEvent(NotificationName.MAP_FAKE_FIGHT_SHOW, { stayPositions: stayBuilding.stayMapPositions });
                }
                // TODO
                // if (
                //     (pioneer.type == MapPioneerType.player &&
                //         pioneer.faction == MapMemberFactionType.friend &&
                //         stayBuilding.faction == MapMemberFactionType.enemy) ||
                //     (pioneer.id == "gangster_3" && pioneer.faction == MapMemberFactionType.enemy && stayBuilding.faction != MapMemberFactionType.enemy)
                // ) {
                //     const cityBuilding = stayBuilding as MapBuildingMainCityObject;
                //     if (cityBuilding.taskObj != null) {
                //         pioneerDataMgr.changeActionType(pioneerId, MapPioneerActionType.idle);
                //     } else {
                //         this.fight(pioneer, null, stayBuilding);
                //     }
                // } else {
                //     if (isStay) {
                //         pioneerDataMgr.changeActionType(pioneerId, MapPioneerActionType.idle);
                //     }
                // }
            } else if (stayBuilding.type == MapBuildingType.explore) {
                if (pioneer.type == MapPioneerType.player && pioneer.faction == MapMemberFactionType.friend) {
                    setTimeout(() => {
                        NetworkMgr.websocketMsg.player_explore_start({
                            pioneerId: uniqueId,
                            buildingId: stayBuilding.uniqueId,
                        });
                    }, interactDelayTime);
                } else {
                    if (pioneer.name == "gangster_3") {
                        // old logic: ganster destroy explore building
                        // wait TODO
                    }
                }
            } else if (stayBuilding.type == MapBuildingType.stronghold) {
                // 0-idle 1-fight 2-defend
                // let tempAction: number = 0;
                // if (pioneer.type == MapPioneerType.player && pioneer.faction == MapMemberFactionType.friend) {
                //     if (stayBuilding.faction != MapMemberFactionType.enemy) {
                //         // defend
                //         // wait TODO
                //         tempAction = 2;
                //     } else {
                //         tempAction = 1;
                //     }
                // } else {
                //     if (pioneer.id == "gangster_3" && stayBuilding.id == "building_4") {
                //         if (stayBuilding.faction != MapMemberFactionType.friend || stayBuilding.defendPioneerIds.length <= 0) {
                //             tempAction = 0;
                //             // DataMgr.s.mapBuilding.hideBuilding(stayBuilding.id, pioneer.id);
                //         } else {
                //             // wait TODO
                //             tempAction = 1;
                //         }
                //     } else {
                //         tempAction = 0;
                //     }
                // }
                // if (tempAction == 0) {
                // } else if (tempAction == 1) {
                //     // TODO
                //     // fight stronghold building
                // } else if (tempAction == 2) {
                // }
            } else if (stayBuilding.type == MapBuildingType.wormhole) {
                const wormholeObj = stayBuilding as MapBuildingWormholeObject;
                if (pioneer.type == MapPioneerType.player) {
                    if (stayBuilding.faction != MapMemberFactionType.enemy) {
                        let emptyIndex: number = -1;
                        for (let i = 0; i < 3; i++) {
                            if (!wormholeObj.attacker.has(i)) {
                                emptyIndex = i;
                                break;
                            }
                        }
                        if (emptyIndex >= 0) {
                            setTimeout(() => {
                                NetworkMgr.websocketMsg.player_wormhole_set_attacker({
                                    buildingId: stayBuilding.uniqueId,
                                    pioneerId: uniqueId,
                                    index: emptyIndex,
                                });
                            }, interactDelayTime);
                        }
                    } else {
                        pioneerDataMgr.changeActionType(uniqueId, MapPioneerActionType.idle);
                    }
                } else {
                }
            } else if (stayBuilding.type == MapBuildingType.resource) {
                if (pioneer.type == MapPioneerType.player && pioneer.faction != MapMemberFactionType.enemy) {
                    setTimeout(() => {
                        NetworkMgr.websocketMsg.player_gather_start({
                            pioneerId: uniqueId,
                            resourceBuildingId: stayBuilding.uniqueId,
                            feeTxhash: "",
                            isReturn: this._checkActionSendParamRetrun(uniqueId),
                        });
                    }, interactDelayTime);
                }
            } else if (stayBuilding.type == MapBuildingType.event) {
                if (pioneer.type == MapPioneerType.player && pioneer.faction != MapMemberFactionType.enemy) {
                    setTimeout(() => {
                        NetworkMgr.websocketMsg.player_event_start({
                            pioneerId: uniqueId,
                            buildingId: stayBuilding.uniqueId,
                            isReturn: this._checkActionSendParamRetrun(uniqueId),
                        });
                    }, interactDelayTime);
                }
            } else if (stayBuilding.type == MapBuildingType.tavern) {
                if (pioneer.type == MapPioneerType.player) {
                    const tavern = stayBuilding as MapBuildingTavernObject;
                    if (tavern.tavernCountdownTime <= 0) {
                        const result = await UIPanelManger.inst.pushPanel(UIName.TavernUI);
                        if (result.success) {
                            result.node.getComponent(TavernUI).configuration(stayBuilding.id);
                        }
                    }
                } else {
                }
            }
        }
    }

    //------------------------------- notification
    private _onPioneerMoveMeeted(data: { uniqueId: string; interactDirectly: boolean }) {
        this._moveMeeted(data.uniqueId, data.interactDirectly);
    }

    public _checkActionSendParamRetrun(uniqueId: string) {
        const index = this._actionOverReturnPioneerUniqueId.indexOf(uniqueId);
        if (index != -1) {
            this._actionOverReturnPioneerUniqueId.splice(index, 1);
            return true;
        }
        return false;
    }
    // private _onPioneerLogicMove(data: { id: string; logic: MapPioneerLogicObject }) {
    //     const pioneer = DataMgr.s.pioneer.getById(data.id);
    //     if (pioneer == undefined) {
    //         return;
    //     }
    //     let targetMapPos: Vec2 = null;
    //     if (data.logic.type == MapPioneerLogicType.stepmove) {
    //         // get target pos
    //         const targetTiledPos = GameMainHelper.instance.tiledMapGetAroundByDirection(pioneer.stayPos, data.logic.stepMove.direction);
    //         if (targetTiledPos != null) {
    //             targetMapPos = new Vec2(targetTiledPos.x, targetTiledPos.y);
    //         }
    //     } else if (data.logic.type == MapPioneerLogicType.targetmove) {
    //         targetMapPos = data.logic.targetMove.targetPos;
    //     } else if (data.logic.type == MapPioneerLogicType.patrol) {
    //         // randomNextPos
    //         do {
    //             const xNegative: boolean = CommonTools.getRandomInt(0, 1) == 0;
    //             const xChangeNum: number = CommonTools.getRandomInt(0, data.logic.patrol.range);
    //             const yNegative: boolean = CommonTools.getRandomInt(0, 1) == 0;
    //             const yChangeNum: number = CommonTools.getRandomInt(0, data.logic.patrol.range);
    //             let nextPos = data.logic.patrol.originalPos.clone();
    //             if (xNegative) {
    //                 nextPos.x -= xChangeNum;
    //             } else {
    //                 nextPos.x += xChangeNum;
    //             }
    //             if (yNegative) {
    //                 nextPos.y -= yChangeNum;
    //             } else {
    //                 nextPos.y += yChangeNum;
    //             }
    //             targetMapPos = nextPos;
    //             if (GameMainHelper.instance.tiledMapIsBlock(nextPos)) {
    //                 // isblock
    //                 targetMapPos = null;
    //             } else {
    //                 const pioneers = DataMgr.s.pioneer.getByStayPos(nextPos, true);
    //                 if (pioneers.length > 0) {
    //                     for (const temple of pioneers) {
    //                         if (temple.type != MapPioneerType.player) {
    //                             targetMapPos = null;
    //                             break;
    //                         }
    //                     }
    //                 } else {
    //                     const buildings = DataMgr.s.mapBuilding.getShowBuildingByMapPos(nextPos);
    //                     if (buildings != null) {
    //                         targetMapPos = null;
    //                     }
    //                 }
    //             }
    //         } while (targetMapPos == null);
    //     }
    //     if (targetMapPos != null) {
    //         const moveData = GameMainHelper.instance.tiledMapGetTiledMovePathByTiledPos(pioneer.stayPos, targetMapPos);
    //         if (moveData.canMove) {
    //             DataMgr.s.pioneer.beginMove(pioneer.id, moveData.path);
    //         }
    //     }
    // }
}
