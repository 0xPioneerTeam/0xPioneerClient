import { Vec2, dynamicAtlasManager, v2 } from "cc";
import CommonTools from "../Tool/CommonTools";
import { MapInteractType, MapMemberFactionType, MapMemberTargetType } from "../Const/ConstDefine";
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
    MapPlayerPioneerObject,
} from "../Const/PioneerDefine";
import { DataMgr } from "../Data/DataMgr";
import { MapBuildingMainCityObject, MapBuildingObject, MapBuildingTavernObject, MapBuildingWormholeObject } from "../Const/MapBuilding";
import { PioneersDataMgr } from "../Data/Save/PioneersDataMgr";
import { NetworkMgr } from "../Net/NetworkMgr";
import UIPanelManger from "../Basic/UIPanelMgr";
import { UIName } from "../Const/ConstUIDefine";
import { TavernUI } from "../UI/Outer/TavernUI";
import PioneerConfig from "../Config/PioneerConfig";

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

        if (attacker.actionType != MapPioneerActionType.moving && attacker.actionType != MapPioneerActionType.staying) {
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
    public setMovingTarget(uniqueId: string, target: MapMemberTargetType, id: string, interactType: MapInteractType, extra: any) {
        if (uniqueId != null && id != null) {
            this._movingTargetDataMap.set(uniqueId, { target: target, id: id, interactType: interactType, extra: extra });
        }
    }
    public addActionOverReturnPioneer(uniqueId: string) {
        this._actionOverReturnPioneerUniqueId.push(uniqueId);
    }
    public setWormholeBackPioneer(uniqueId: string) {
        this._wormholeBackPioneerUniqueId.push(uniqueId);
    }
    public checkWormholeBackPioneer(uniqueId: string) {
        const index = this._wormholeBackPioneerUniqueId.indexOf(uniqueId);
        if (index != -1) {
            this._wormholeBackPioneerUniqueId.splice(index, 1);
            return true;
        }
        return false;
    }

    private _movingTargetDataMap: Map<string, { target: MapMemberTargetType; id: string; interactType: MapInteractType, extra: any }> = new Map();
    private _actionOverReturnPioneerUniqueId: string[] = [];
    private _wormholeBackPioneerUniqueId: string[] = [];
    public constructor() {}

    private async _moveMeeted(uniqueId: string, interactDirectly: boolean) {
        const pioneerDataMgr: PioneersDataMgr = DataMgr.s.pioneer;
        const pioneer: MapPioneerObject = pioneerDataMgr.getById(uniqueId);
        if (pioneer == undefined) {
            return;
        }
        if (pioneer.type == MapPioneerType.player && (pioneer as MapPlayerPioneerObject).needReturn) {
            (pioneer as MapPlayerPioneerObject).needReturn = false;
            DataMgr.s.pioneer.changeActionType(pioneer.uniqueId, MapPioneerActionType.inCity);
        }
        let interactType = null;
        let interactExtra = null;
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
                interactType = movingTargetData.interactType;
                interactExtra = movingTargetData.extra;
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
                                isReturn: this._checkActionSendParamRetrun(uniqueId),
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
            }
        } else {
            // building
            // need changed. use manger to deal with pioneer and building
            // wait change
            // if (GameMainHelper.instance.currentTrackingInteractData().interactBuildingId == stayBuilding.id) {
            //     GameMainHelper.instance.hideTrackingView();
            // }
            if (stayBuilding.type == MapBuildingType.city) {
                const uniqueIdSplit = stayBuilding.uniqueId.split;
                if (uniqueIdSplit.length == 2) {
                    const slotId = uniqueIdSplit[0];
                    if (slotId != DataMgr.s.mapBuilding.getSelfMainCitySlotId()) {
                        setTimeout(() => {
                            // detect
                            if (interactType == MapInteractType.Detect) {
                                NetworkMgr.websocketMsg.player_explore_maincity({
                                    pioneerId: uniqueId,
                                    buildingId: stayBuilding.uniqueId,
                                    isReturn: this._checkActionSendParamRetrun(uniqueId),
                                });
                            } else if (interactType == MapInteractType.SiegeCity) {
                                NetworkMgr.websocketMsg.player_fight_maincity({
                                    pioneerId: uniqueId,
                                    buildingId: stayBuilding.uniqueId,
                                    isReturn: this._checkActionSendParamRetrun(uniqueId),
                                });
                            }
                        }, interactDelayTime);
                    }
                }
                
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
            } else if (stayBuilding.type == MapBuildingType.wormhole) {
                setTimeout(() => {
                    if (interactType == MapInteractType.WmMatch) {
                        NetworkMgr.websocketMsg.player_wormhole_tp_random({
                            pioneerId: uniqueId,
                            buildingId: stayBuilding.uniqueId
                        });
                    } else if (interactType == MapInteractType.WmTeleport) {
                        if (interactExtra != null) {
                            NetworkMgr.websocketMsg.player_wormhole_tp_select({
                                pioneerId: uniqueId,
                                buildingId: stayBuilding.uniqueId,
                                tpBuildingId: interactExtra.tpBuildingId
                            });
                        }
                    } else if (interactType == MapInteractType.WmMark) {
                        NetworkMgr.websocketMsg.player_wormhole_tp_tag({
                            pioneerId: uniqueId,
                            buildingId: stayBuilding.uniqueId
                        });
                    } else if (interactType == MapInteractType.WmRecall) {
                        NetworkMgr.websocketMsg.player_wormhole_tp_back({
                            pioneerId: uniqueId,
                            buildingId: stayBuilding.uniqueId
                        });
                    }
                }, interactDelayTime);
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
}
