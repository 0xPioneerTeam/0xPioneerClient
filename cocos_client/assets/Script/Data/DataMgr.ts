import NotificationMgr from "../Basic/NotificationMgr";
import { InnerBuildingType, MapBuildingType } from "../Const/BuildingDefine";
import ItemData, { ItemType } from "../Const/Item";
import { NotificationName } from "../Const/Notification";
import { MapPioneerActionType, MapPioneerType, MapPlayerPioneerObject } from "../Const/PioneerDefine";
import { c2s_user, s2c_user, share, WebsocketMsg } from "../Net/msg/WebsocketMsg";
import CLog from "../Utils/CLog";
import { RunData } from "./RunData";
import { SaveData } from "./SaveData";
import { MapBuildingWormholeObject } from "../Const/MapBuilding";
import { GameMgr, LanMgr, PioneerMgr, UserInfoMgr } from "../Utils/Global";
import NetGlobalData from "./Save/Data/NetGlobalData";
import { NetworkMgr } from "../Net/NetworkMgr";
import ArtifactData from "../Model/ArtifactData";
import UIPanelManger, { UIPanelLayerType } from "../Basic/UIPanelMgr";
import { HUDName, UIName } from "../Const/ConstUIDefine";
import { TreasureGettedUI } from "../UI/TreasureGettedUI";
import CommonTools from "../Tool/CommonTools";
import ItemConfig from "../Config/ItemConfig";
import { ItemGettedUI } from "../UI/ItemGettedUI";
import { TilePos } from "../Game/TiledMap/TileTool";
import GameMainHelper from "../Game/Helper/GameMainHelper";
import TalkConfig from "../Config/TalkConfig";
import { DialogueUI } from "../UI/Outer/DialogueUI";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
import { GAME_VERSION, ResourceCorrespondingItem } from "../Const/ConstDefine";
import { RookieResourceAnim, RookieResourceAnimStruct, RookieStep } from "../Const/RookieDefine";
import { ArtifactInfoUI } from "../UI/ArtifactInfoUI";
import { NewEventUI } from "../UI/Event/NewEventUI";
import { NewEventBattleUI } from "../UI/Event/NewEventBattleUI";
import { native, v2 } from "cc";
import { SecretGuardGettedUI } from "../UI/Outer/SecretGuardGettedUI";

export class DataMgr {
    public static r: RunData;
    public static s: SaveData;

    public static async init(): Promise<boolean> {
        DataMgr.r = new RunData();
        DataMgr.s = new SaveData();
        window["DataMgr"] = DataMgr;
        return true;
    }

    ///////////////// websocket
    public static onmsg = (e: any) => {
        CLog.debug("DataMgr/onmsg: e => " + JSON.stringify(e));

        // check need retry
        const protocol: string = e.data?._data?.c;
        const data: any = e.data?._data?.d;
        if (protocol == undefined || data == undefined) {
            return;
        }
        const result = NetworkMgr.websocketMsg.get_fail_retry_data_by_param(protocol, data);
        if (result.index < 0) {
            return;
        }
        let res: number = data.res;
        if (res == null) {
            res = 1;
        }
        if (res === 1) {
            NetworkMgr.websocketMsg.delete_fail_retry_data(result.index);
            return;
        }

        setTimeout(() => {
            NetworkMgr.websocketMsg.send_packet(result.findData.protocol, result.findData.data);
        }, 500);

        result.findData.retryCount -= 1;
        if (result.findData.retryCount <= 0) {
            NetworkMgr.websocketMsg.delete_fail_retry_data(result.index);
        }
    };

    public static enter_game_res = async (e: any) => {
        let p: s2c_user.Ienter_game_res = e.data;
        if (p.res === 1) {
            if (p.data) {
                // set new global data
                NetGlobalData.userInfo = p.data.info.sinfo;
                NetGlobalData.innerBuildings = p.data.info.buildings;
                NetGlobalData.storehouse = p.data.info.storehouse;
                NetGlobalData.artifacts = p.data.info.artifact;
                NetGlobalData.usermap = p.data.info.usermap;
                NetGlobalData.nfts = p.data.info.nfts;
                NetGlobalData.mapBuildings = p.data.info.mapbuilding;
                NetGlobalData.taskinfo = p.data.info.taskinfo;
                NetGlobalData.shadows = p.data.info.shadows;
                NetGlobalData.detects = p.data.info.detects;
                // load save data
                await DataMgr.s.load(this.r.wallet.addr);

                GameMgr.setSlotIdToTempleConfigData(NetGlobalData.mapBuildings.slotId, {
                    templeConfigId: p.data.info.mapbuilding.templateConfigId,
                    playerId: p.data.info.sinfo.playerid.toString(),
                    pname: p.data.info.sinfo.pname,
                    level: p.data.info.sinfo.level,
                    battlePower: p.data.info.sinfo.battlePower,
                    honor: 0,
                });

                NotificationMgr.triggerEvent(NotificationName.USER_LOGIN_SUCCEED);
            }
            // reconnect
            if (DataMgr.r.reconnects > 0) {
                DataMgr.r.reconnects = 0;
            }
        }
    };
    public static update_name_res = (e: any) => {
        const p: s2c_user.Iupdate_name_res = e.data;
        if (p.res !== 1) {
            return;
        }
        DataMgr.s.userInfo.data.name = p.name;
        NotificationMgr.triggerEvent(NotificationName.USERINFO_DID_CHANGE_NAME);
    };

    public static sinfo_change = (e: any) => {
        const p: s2c_user.Isinfo_change = e.data;
        const localData = DataMgr.s.userInfo.data;
        DataMgr.s.userInfo.replaceData(p.info);
        const newData = DataMgr.s.userInfo.data;
        //rookie step
        if (localData.rookieStep != newData.rookieStep || localData.rookieState != newData.rookieState) {
            NotificationMgr.triggerEvent(NotificationName.USERINFO_ROOKE_STEP_CHANGE);
        }
        // exp
        if (localData.exp != p.info.exp) {
            NotificationMgr.triggerEvent(NotificationName.USERINFO_DID_CHANGE_EXP, { exp: p.info.exp - localData.exp });
            const gap = p.info.exp - localData.exp;
            if (gap > 0) {
                // get exp
                NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, LanMgr.replaceLanById("106013", [gap]));
            }
        }
        // treasure progress
        if (localData.exploreProgress != p.info.treasureProgress) {
            NotificationMgr.triggerEvent(NotificationName.USERINFO_DID_CHANGE_TREASURE_PROGRESS);
            const gap = p.info.treasureProgress - localData.exploreProgress;
            if (gap > 0) {
                // get progress
                NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, LanMgr.replaceLanById("106014", [gap]));
            }
        }
        // heat
        if (localData.heatValue.currentHeatValue != p.info.heatValue.currentHeatValue) {
            // if (DataMgr.s.userInfo.data.rookieStep == RookieStep.PIOT_TO_HEAT) {
            //     NetworkMgr.websocketMsg.player_rookie_update({
            //         rookieStep: RookieStep.NPC_TALK_4,
            //     });
            //     NotificationMgr.triggerEvent(NotificationName.GAME_MAIN_RESOURCE_PLAY_ANIM, {
            //         animType: RookieResourceAnim.GOLD_TO_HEAT,
            //         callback: () => {
            //             NotificationMgr.triggerEvent(NotificationName.USERINFO_DID_CHANGE_HEAT);
            //         },
            //     } as RookieResourceAnimStruct);
            // } else {
            NotificationMgr.triggerEvent(NotificationName.USERINFO_DID_CHANGE_HEAT);
            // }
        }
        // box
        let boxUpdate: boolean = false;
        if (localData.boxes.length != p.info.boxes.length) {
            boxUpdate = true;
        } else {
            for (let i = 0; i < localData.boxes.length; i++) {
                if (localData.boxes[i].id != p.info.boxes[i].id) {
                    boxUpdate = true;
                    break;
                }
                if (localData.boxes[i].opened != p.info.boxes[i].opened) {
                    boxUpdate = true;
                    break;
                }
            }
        }
        if (boxUpdate) {
            NotificationMgr.triggerEvent(NotificationName.USERINFO_BOX_INFO_CHANGE);
        }

        // radial range
        if (localData.cityRadialRange != p.info.cityRadialRange) {
            NotificationMgr.triggerEvent(NotificationName.USERINFO_CITY_RADIAL_RANGE_CHANGE);
        }

        // CLvlCondtion
        if (!CommonTools.arraysAreEqual(localData.CLvlCondtion, newData.CLvlCondtion)) {
            NotificationMgr.triggerEvent(NotificationName.USERINFO_CLVL_CONDTION_CHANGE);
        }
        // CLvlReward
        if (!CommonTools.mapsAreEqual(localData.CLvlRewardGetMap, newData.CLvlRewardGetMap)) {
            NotificationMgr.triggerEvent(NotificationName.USERINFO_CLVL_REWARD_GET_CHANGE);
        }
    };
    public static player_rookie_update_res = (e: any) => {
        const p: s2c_user.Iplayer_rookie_update_res = e.data;
        if (p.res !== 1) {
            return;
        }
        // if (
        //     p.rookieStep == RookieStep.NPC_TALK_3 ||
        //     p.rookieStep == RookieStep.NPC_TALK_4 ||
        //     p.rookieStep == RookieStep.NPC_TALK_5 ||
        //     p.rookieStep == RookieStep.NPC_TALK_7 ||
        //     p.rookieStep == RookieStep.SYSTEM_TALK_21
        // ) {
        //     // play anim to change step
        //     return;
        // } else if (p.rookieStep == RookieStep.OUTER_WORMHOLE) {
        //     p.rookieStep = RookieStep.LOCAL_DEFEND_TAP_CLOSE;
        // }
        DataMgr.s.userInfo.data.rookieStep = p.rookieStep;
        NotificationMgr.triggerEvent(NotificationName.USERINFO_ROOKE_STEP_CHANGE);
    };
    public static GM_GUIDE(step, state) {
        DataMgr.s.userInfo.data.rookieStep = step;
        DataMgr.s.userInfo.data.rookieState = state;
        NotificationMgr.triggerEvent(NotificationName.USERINFO_ROOKE_STEP_CHANGE);
    }
    //------------------------------------- item
    public static storhouse_change = async (e: any) => {
        const p: s2c_user.Istorhouse_change = e.data;
        this._resourceRefresh(p.iteminfo, p.src);
    };

    private static async _resourceRefresh(iteminfo: ItemData[], src: string = null) {
        const nonResourceGettedItems = [];
        for (const item of iteminfo) {
            const change = new ItemData(item.itemConfigId, item.count);
            change.addTimeStamp = item.addTimeStamp;
            DataMgr.s.item.countChanged(change, src);

            if (item.count > 0) {
                const config = ItemConfig.getById(item.itemConfigId);
                if (config != null) {
                    if (config.itemType == ItemType.Resource) {
                        GameMusicPlayMgr.playGetResourceEffect();
                    } else {
                        nonResourceGettedItems.push(item);
                        if (config.grade >= 4) {
                            GameMusicPlayMgr.playGetRateItemEffect();
                        } else {
                            GameMusicPlayMgr.playGetCommonItemEffect();
                        }
                    }
                }
            }
        }
        if (nonResourceGettedItems.length > 0) {
            const result = await UIPanelManger.inst.pushPanel(UIName.ItemGettedUI);
            if (!result.success) {
                return;
            }
            result.node.getComponent(ItemGettedUI).showItem(nonResourceGettedItems);
        }
    }
    //------------------------------------ artifact
    public static artifact_change = async (e: any) => {
        const p: s2c_user.Iartifact_change = e.data;
        const artifacts: ArtifactData[] = [];
        for (const artifact of p.iteminfo) {
            const change = new ArtifactData(artifact.artifactConfigId, artifact.count);
            change.addTimeStamp = artifact.addTimeStamp;
            change.effectIndex = artifact.effectIndex;
            change.uniqueId = artifact.uniqueId;
            change.effect = artifact.effect;
            DataMgr.s.artifact.countChanged(change);

            artifacts.push(change);
        }
        if (artifacts.length > 0) {
            const result = await UIPanelManger.inst.pushPanel(UIName.ArtifactInfoUI);
            if (!result.success) {
                return;
            }
            result.node.getComponent(ArtifactInfoUI).showItem(artifacts);
        }
    };
    public static player_artifact_change_res = (e: any) => {
        const p: s2c_user.Iplayer_artifact_change_res = e.data;
        if (p.res !== 1) {
            return;
        }
        for (const temple of p.data) {
            if (temple.effectIndex >= 0) {
                GameMusicPlayMgr.playEquepArtifactEffect();
            }
            DataMgr.s.artifact.changeObj_artifact_effectIndex(temple.uniqueId, temple.effectIndex);
        }
    };
    public static player_artifact_combine_res = (e: any) => {
        const p: s2c_user.Iplayer_artifact_combine_res = e.data;
        if (p.res !== 1) {
            return;
        }
        for (const artifact of p.data) {
            const change = new ArtifactData(artifact.artifactConfigId, artifact.count);
            change.addTimeStamp = artifact.addTimeStamp;
            change.effectIndex = artifact.effectIndex;
            change.uniqueId = artifact.uniqueId;
            change.effect = artifact.effect;
            DataMgr.s.artifact.countChanged(change, true);
        }
    };
    //------------------------------------- inner building
    public static building_change = (e: any) => {
        const p: s2c_user.Ibuilding_change = e.data;
        for (const netBuilding of p.buildings) {
            const currentData = DataMgr.s.innerBuilding.data.get(netBuilding.id as InnerBuildingType);
            if (currentData == null) {
                continue;
            }
            DataMgr.s.innerBuilding.replaceData(netBuilding);
            NotificationMgr.triggerEvent(NotificationName.INNER_BUILDING_DATA_CHANGE);
            if (currentData.upgrading && !netBuilding.upgradeIng) {
                // upgrade finish
                // if (DataMgr.s.userInfo.data.rookieStep == RookieStep.MAIN_BUILDING_TAP_2) {
                //     NetworkMgr.websocketMsg.player_rookie_update({
                //         rookieStep: RookieStep.SYSTEM_TALK_20,
                //     });
                // } else if (DataMgr.s.userInfo.data.rookieStep == RookieStep.MAIN_BUILDING_TAP_3) {
                //     NetworkMgr.websocketMsg.player_rookie_update({
                //         rookieStep: RookieStep.SYSTEM_TALK_22,
                //     });
                // }
                NotificationMgr.triggerEvent(NotificationName.INNER_BUILDING_UPGRADE_FINISHED, currentData.buildType);
            }

            if (currentData.troopIng && !netBuilding.troopIng) {
                DataMgr.s.userInfo.changeRecruitRedPoint(true);
            }
            if (currentData.tc != null && netBuilding.tc != null && currentData.tc.training != null && netBuilding.tc.training == null) {
                DataMgr.s.userInfo.changeExerciseRedPoint(true);
                // use lan
                NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, "Training completed");
                NotificationMgr.triggerEvent(NotificationName.INNER_BUILDING_TRAIN_FINISHED);
            }
        }
    };
    public static player_building_pos_res = (e: any) => {
        const p: s2c_user.Iplayer_building_pos_res = e.data;
        if (p.res !== 1) {
            return;
        }
        DataMgr.s.innerBuilding.changePos(p.buildingId as InnerBuildingType, p.pos);
    };
    public static player_building_levelup_res = (e: any) => {
        const p: s2c_user.Iplayer_building_levelup_res = e.data;
        if (p.res !== 1) {
            return;
        }
        if (p.data.troopIng) {
            GameMusicPlayMgr.playBeginBuildEffect();
        }
    };
    public static player_generate_troop_start_res = (e: any) => {
        const p = e.data;
        if (p.res !== 1) {
            return;
        }
        GameMusicPlayMgr.playBeginGenerateTroopEffect();
    };
    //------------------------------------- storehouse

    //------------------------------------- map
    public static get_map_info_res = (e: any) => {
        const p: s2c_user.Iget_map_info_res = e.data;
        if (p.res !== 1) {
            return;
        }
        let buildingChanged: boolean = false;
        let pioneerChanged: boolean = false;
        const slotIds: string[] = [];
        for (const info of p.info) {
            for (const key in info.buildings) {
                if (Object.prototype.hasOwnProperty.call(info.buildings, key)) {
                    const element = info.buildings[key];
                    DataMgr.s.mapBuilding.addData(element);
                    buildingChanged = true;
                }
            }
            for (const key in info.pioneers) {
                if (Object.prototype.hasOwnProperty.call(info.pioneers, key)) {
                    const element = info.pioneers[key];
                    DataMgr.s.pioneer.addData(element);
                    pioneerChanged = true;
                }
            }
            slotIds.push(info.slotId);
            DataMgr.s.mapBuilding.setDecorateInfo(info.slotId, info.templateConfigId);
            GameMgr.setSlotIdToTempleConfigData(info.slotId, {
                templeConfigId: info.templateConfigId,
                playerId: info.playerId.toString(),
                pname: info.pname,
                level: info.level,
                battlePower: info.battlePower,
                honor: info.honor,
            });
        }
        for (const key in p.user) {
            if (Object.prototype.hasOwnProperty.call(p.user, key)) {
                const element = p.user[key];
                DataMgr.s.pioneer.addData(element);
            }
            pioneerChanged = true;
        }
        if (buildingChanged) {
            NotificationMgr.triggerEvent(NotificationName.MAP_BUILDING_NEED_REFRESH);
        }
        if (pioneerChanged) {
            NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_NEED_REFRESH);
        }
        GameMainHelper.instance.updateGameViewport();
    };
    public static player_enterzone = (e: any) => {
        const p: s2c_user.Iplayer_enterzone = e.data;
        for (const info of p.infos) {
            const fakePioneer = DataMgr.s.pioneer.createFakeData(info.pioneerId, v2(info.pos.x, info.pos.y));
            DataMgr.s.pioneer.addObjData(fakePioneer);
        }
        NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_NEED_REFRESH);
    };
    public static player_leavezone = (e: any) => {
        const p: s2c_user.Iplayer_leavezone = e.data;

        let needRefresh: boolean = false;
        for (const id of p.playerids) {
            DataMgr.s.pioneer.removeDataByPlayerId(id);
            needRefresh = true;
        }
        if (needRefresh) {
            NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_NEED_REFRESH);
        }
    };
    public static pioneer_leavezone = (e: any) => {
        const p: s2c_user.Ipioneer_leavezone = e.data;

        let needRefresh: boolean = false;
        for (const id of p.pioneerIds) {
            DataMgr.s.pioneer.removeDataByUniqueId(id);
            needRefresh = true;
        }
        if (needRefresh) {
            NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_NEED_REFRESH);
        }
    };

    public static player_get_new_pioneer = (e: any) => {
        const p: s2c_user.Iplayer_get_new_pioneer = e.data;
        for (const data of p.datas) {
            DataMgr.s.pioneer.addData(data, true);
            const pioneer = DataMgr.s.pioneer.getById(data.uniqueId);
            if (pioneer != undefined) {
                if (this["_LAST_NEW_TIME"] == null) {
                    this["_LAST_NEW_TIME"] = new Date().getTime();
                } else {
                    const currentTimeStamp = new Date().getTime();
                    if (currentTimeStamp - this["_LAST_NEW_TIME"] <= 2000) {
                        UserInfoMgr.afterNewPioneerDatas.push(pioneer);
                        return;
                    }
                }
                setTimeout(async () => {
                    if (UIPanelManger.inst.panelIsShow(UIName.CivilizationLevelUpUI)) {
                        UserInfoMgr.afterCivilizationClosedShowPioneerDatas.push(pioneer);
                    } else {
                        const result = await UIPanelManger.inst.pushPanel(UIName.SecretGuardGettedUI);
                        if (result.success) {
                            result.node.getComponent(SecretGuardGettedUI).dialogShow(pioneer.animType);
                        }
                    }
                });
            }
        }
    };
    public static pioneer_change = (e: any) => {
        const p: s2c_user.Ipioneer_change = e.data;
        let newPioneerDatas: share.Ipioneer_data[] = [];
        const localDatas = DataMgr.s.pioneer.getAll();
        for (const temple of p.pioneers) {
            let exsit: boolean = false;
            for (let i = 0; i < localDatas.length; i++) {
                if (temple.uniqueId == localDatas[i].uniqueId) {
                    const oldData = localDatas[i];
                    const newData = DataMgr.s.pioneer.replaceData(i, temple);
                    // show
                    if (oldData.show != newData.show) {
                        NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_SHOW_CHANGED, { uniqueId: newData.uniqueId, show: newData.show });
                    }
                    // faction
                    if (oldData.faction != newData.faction) {
                        NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_FACTION_CHANGED, { uniqueId: newData.uniqueId, show: newData.show });
                    }
                    // action type
                    if (oldData.actionType != newData.actionType || oldData.actionEndTimeStamp != newData.actionEndTimeStamp) {
                        if (
                            newData.type == MapPioneerType.player &&
                            oldData.actionType != MapPioneerActionType.inCity &&
                            newData.actionType == MapPioneerActionType.inCity
                        ) {
                            if (!PioneerMgr.checkWormholeBackPioneer(newData.uniqueId)) {
                                // local play return
                                const targetPos = GameMgr.getMainCityGatePos();
                                const moveData = GameMgr.findTargetLeastMovePath(oldData.stayPos, targetPos, [], []);
                                if (moveData.status !== 1 || moveData.path.length <= 0) {
                                } else {
                                    (newData as MapPlayerPioneerObject).needReturn = true;
                                    newData.stayPos = oldData.stayPos;
                                    DataMgr.s.pioneer.beginMove(newData.uniqueId, moveData.path);
                                }
                            }
                        }
                        if (newData.uniqueId === DataMgr.s.pioneer.getInteractSelectUnqueId() && newData.actionType === MapPioneerActionType.inCity) {
                            DataMgr.s.pioneer.clearInteractSelected();
                        }
                        if (newData.actionType != MapPioneerActionType.mining && oldData.actionType == MapPioneerActionType.mining) {
                            // gather over
                            NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, LanMgr.getLanById("1100207"));
                        }
                        NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_ACTIONTYPE_CHANGED, { uniqueId: newData.uniqueId });
                    }
                    // fight
                    if (oldData.fightData == null && newData.fightData != null) {
                        NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_FIGHT_BEGIN, { uniqueId: newData.uniqueId });
                    }
                    // staypos
                    if (oldData.stayPos.x != newData.stayPos.x || oldData.stayPos.y != newData.stayPos.y) {
                        NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_STAY_POSITION_CHANGE, { uniqueId: newData.uniqueId });
                    }
                    // hp
                    if (oldData.hp != newData.hp || oldData.hpMax != newData.hpMax) {
                        NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_HP_CHANGED, { uniqueId: newData.uniqueId });
                        if (oldData.actionType != MapPioneerActionType.dead && newData.hp > oldData.hp && newData.hpMax == oldData.hpMax) {
                            //re heal
                            NotificationMgr.triggerEvent(
                                NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP,
                                LanMgr.replaceLanById("106012", [LanMgr.getLanById(newData.name)])
                            );
                        }
                    }
                    // energy
                    if (oldData.energy != newData.energy || oldData.energyMax != oldData.energyMax) {
                        NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_ENERGY_CHANGED, { uniqueId: newData.uniqueId });
                    }
                    exsit = true;
                    break;
                }
                if (exsit) {
                    break;
                }
            }
            if (!exsit) {
                newPioneerDatas.push(temple);
            }
        }
        if (newPioneerDatas.length > 0) {
            for (const data of newPioneerDatas) {
                DataMgr.s.pioneer.addData(data);
            }
            NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_NEED_REFRESH);
        }
    };
    public static mappioneer_reborn_change = (e: any) => {
        NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, LanMgr.getLanById("106009"));
    };
    public static mapbuilding_reborn_change = (e: any) => {
        NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, LanMgr.getLanById("106010"));
    };

    public static mapbuilding_change = async (e: any) => {
        const p: s2c_user.Imappbuilding_change = e.data;
        const localDatas = DataMgr.s.mapBuilding.getObj_building();
        for (const temple of p.mapbuildings) {
            for (let i = 0; i < localDatas.length; i++) {
                if (temple.uniqueId == localDatas[i].uniqueId) {
                    const oldData = localDatas[i];
                    const newData = DataMgr.s.mapBuilding.replaceData(i, temple);
                    if (oldData.show != newData.show) {
                        NotificationMgr.triggerEvent(NotificationName.MAP_BUILDING_SHOW_CHANGE, { uniqueId: newData.uniqueId, show: newData.show });
                    }
                    if (oldData.faction != newData.faction) {
                        NotificationMgr.triggerEvent(NotificationName.MAP_BUILDING_FACTION_CHANGE, { uniqueId: newData.uniqueId });
                    }
                    if (oldData.type == MapBuildingType.wormhole && newData.type == MapBuildingType.wormhole) {
                        const oldWorm = oldData as MapBuildingWormholeObject;
                        const newWorm = newData as MapBuildingWormholeObject;
                        if (!CommonTools.mapsAreEqual(oldWorm.attacker, newWorm.attacker)) {
                            NotificationMgr.triggerEvent(NotificationName.MAP_BUILDING_WORMHOLE_ATTACKER_CHANGE);
                            if (NetGlobalData.wormholeAttackBuildingId != null) {
                                NetworkMgr.websocketMsg.player_wormhole_fight_start({
                                    buildingId: NetGlobalData.wormholeAttackBuildingId,
                                });
                                NetGlobalData.wormholeAttackBuildingId = null;
                            }
                        }
                        if (oldWorm.wormholdCountdownTime != newWorm.wormholdCountdownTime) {
                            NotificationMgr.triggerEvent(NotificationName.MAP_BUILDING_WORMHOLE_ATTACK_COUNT_DONW_TIME_CHANGE);
                        }
                    }
                    if (
                        oldData.gatherPioneerIds.length != newData.gatherPioneerIds.length ||
                        oldData.eventPioneerIds.length != newData.eventPioneerIds.length ||
                        oldData.explorePioneerIds.length != newData.explorePioneerIds.length ||
                        oldData.maincityFightPioneerIds.length != newData.maincityFightPioneerIds.length
                    ) {
                        NotificationMgr.triggerEvent(NotificationName.MAP_BUILDING_ACTION_PIONEER_CHANGE);
                    }

                    if (oldData.rebornTime != newData.rebornTime) {
                        NotificationMgr.triggerEvent(NotificationName.MAP_BUILDING_REBON_CHANGE);
                    }
                    if (newData.eventPioneerIds.length > 0) {
                        const actionPioneerIdSpilts: string[] = newData.eventPioneerIds[0].split("|");
                        const playerId: string = actionPioneerIdSpilts[0];
                        if (playerId == DataMgr.s.userInfo.data.id) {
                            if ((oldData.eventSubId != newData.eventSubId && newData.eventSubId != null) || newData.eventIndex > oldData.eventIndex) {
                                const result = await UIPanelManger.inst.pushPanel(UIName.NewEventUI);
                                if (result.success) {
                                    result.node.getComponent(NewEventUI).configuration(newData.eventPioneerIds[0], newData);
                                }
                            }
                            if (oldData.eventWaitFightEnemyId != newData.eventWaitFightEnemyId && newData.eventWaitFightEnemyId != null) {
                                const result = await UIPanelManger.inst.pushPanel(UIName.NewEventBattleUI);
                                if (result.success) {
                                    result.node.getComponent(NewEventBattleUI).configuration(newData.eventPioneerIds[0], newData);
                                }
                            }
                        }
                    }
                    break;
                }
            }
        }
    };
    public static player_explore_npc_start_res = async (e: any) => {
        const p: s2c_user.Iplayer_explore_npc_start_res = e.data;
        if (p.res !== 1) {
            return;
        }
        const idSplit = p.npcId.split("|");
        let npcId: string = null;
        if (idSplit.length == 2) {
            npcId = idSplit[1];
        }
        if (npcId == null) {
            return;
        }
        const canTalkData = DataMgr.s.task.getCanTalkData();
        const talkData = canTalkData[npcId];
        if (talkData == undefined) {
            return;
        }
        const talkConfig = TalkConfig.getById(talkData.talkId);
        if (talkConfig == null) {
            return;
        }
        const result = await UIPanelManger.inst.pushPanel(UIName.DialogueUI);
        if (result.success) {
            result.node.getComponent(DialogueUI).dialogShow(talkConfig, null);
        }
    };
    public static player_move_res = (e: any) => {
        const p: s2c_user.Iplayer_move_res = e.data;
        if (p.res !== 1) {
            return;
        }
        GameMusicPlayMgr.playMoveEffect();
        const movePath: TilePos[] = [];
        for (const temple of p.movePath) {
            movePath.push(GameMainHelper.instance.tiledMapGetTiledPos(temple.x, temple.y));
        }
        DataMgr.s.pioneer.beginMove(p.pioneerId, movePath);
    };
    public static player_gather_start_res = (e: any) => {
        const p: s2c_user.Iplayer_gather_start_res = e.data;
        if (p.res !== 1) {
            return;
        }
        const buildingConfig = GameMgr.getMapBuildingConfigByExistSlotInfo(p.buildingId);
        if (buildingConfig == undefined) {
            return;
        }
        if (buildingConfig.resources[0] == ResourceCorrespondingItem.Stone) {
            GameMusicPlayMgr.playCollectMineEffect();
        } else if (buildingConfig.resources[0] == ResourceCorrespondingItem.Wood) {
            GameMusicPlayMgr.playCollectWoodEffect();
        } else if (buildingConfig.resources[0] == ResourceCorrespondingItem.Food) {
            GameMusicPlayMgr.playCollectFoodEffect();
        }
    };
    public static player_explore_start_res = (e: any) => {
        const p: s2c_user.Iplayer_explore_start_res = e.data;
        if (p.res !== 1) {
            return;
        }
        GameMusicPlayMgr.playExploreEffect();
    };
    public static player_wormhole_set_attacker_res = (e: any) => {
        const p = e.data;
        if (p.res !== 1) {
            return;
        }
        GameMusicPlayMgr.playWormholeSetAttackerEffect();
    };
    public static player_explore_maincity_res = (e: any) => {
        const p: s2c_user.Iplayer_explore_maincity_res = e.data;
        if (p.res !== 1) {
            return;
        }
        const uniqueIdSplit = p.buildingId.split("|");
        if (uniqueIdSplit.length == 2) {
            const slotId = uniqueIdSplit[0];
            const data = GameMgr.getMapSlotData(slotId);
            if (data != undefined) {
                DataMgr.s.userInfo.data.explorePlayerids.push(parseInt(data.playerId));
                data.battlePower = p.battlePower;
                NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, "Detect Succeed");
            }
        }
    };
    public static player_pos_detect_res = (e: any) => {
        const p: s2c_user.Iplayer_pos_detect_res = e.data;
        if (p.res !== 1) {
            return;
        }
        DataMgr.s.eraseShadow.addDetectObj(v2(p.detect.x, p.detect.y));
    };

    public static player_fight_end = (e: any) => {
        const p: s2c_user.Iplayer_fight_end = e.data;
        const uniqueId: string = p.pioneerId;
        const pioneer = DataMgr.s.pioneer.getById(uniqueId);
        if (pioneer == undefined) {
            return;
        }
        NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_FIGHT_END, { uniqueId: uniqueId });
        NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, LanMgr.getLanById("1100207"));
    };

    public static player_wormhole_tp_random_res = (e: any) => {
        const p: s2c_user.Iplayer_wormhole_tp_random_res = e.data;
        if (p.res !== 1) {
            return;
        }
        const animTime: number = 2.8;
        NotificationMgr.triggerEvent(NotificationName.MAP_BUILDING_WORMHOLE_BEGIN_ANIM, { uniqueId: p.buildingId, animTime: animTime });
        setTimeout(() => {
            const worldPos = GameMainHelper.instance.tiledMapGetPosWorld(p.tpPos.x, p.tpPos.y);
            if (worldPos != null) {
                GameMainHelper.instance.changeGameCameraWorldPosition(worldPos, true);
                GameMainHelper.instance.updateGameViewport();
            }
        }, animTime * 1000);
    };

    public static player_wormhole_tp_select_res = (e: any) => {
        const p: s2c_user.Iplayer_wormhole_tp_select_res = e.data;
        if (p.res !== 1) {
            return;
        }
        const animTime: number = 2.8;
        NotificationMgr.triggerEvent(NotificationName.MAP_BUILDING_WORMHOLE_BEGIN_ANIM, { uniqueId: p.buildingId, animTime: animTime });
        setTimeout(() => {
            const worldPos = GameMainHelper.instance.tiledMapGetPosWorld(p.tpPos.x, p.tpPos.y);
            if (worldPos != null) {
                GameMainHelper.instance.changeGameCameraWorldPosition(worldPos, true);
                GameMainHelper.instance.updateGameViewport();
            }
        }, animTime * 1000);
    };

    public static player_wormhole_tp_back_res = (e: any) => {
        const p: s2c_user.Iplayer_wormhole_tp_back_res = e.data;
        if (p.res !== 1) {
            return;
        }
        PioneerMgr.setWormholeBackPioneer(p.pioneerId);
        NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, "Pioneer is back");
    };

    public static player_wormhole_tp_tag_res = (e: any) => {
        const p: s2c_user.Iplayer_wormhole_tp_tag_res = e.data;
        if (p.res !== 1) {
            return;
        }
        NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, "Wormhole is marked");
    };

    //------------------------------------- nft
    public static nft_change = (e: any) => {
        const p: s2c_user.Inft_change = e.data;
        for (const nft of p.nfts) {
            DataMgr.s.nftPioneer.replaceData(nft);
        }
    };
    public static player_nft_lvlup_res = (e: any) => {
        const p: s2c_user.Iplayer_nft_lvlup_res = e.data;
        if (p.res !== 1) {
            return;
        }
        DataMgr.s.nftPioneer.NFTLevelUp(p.nftData);
    };
    public static player_nft_rankup_res = (e: any) => {
        const p: s2c_user.Iplayer_nft_rankup_res = e.data;
        if (p.res !== 1) {
            return;
        }
        DataMgr.s.nftPioneer.NFTRankUp(p.nftData);
    };

    //------------------------------------- wormhole
    public static player_wormhole_fight_res = (e: any) => {
        const p: s2c_user.Iplayer_wormhole_fight_res = e.data;
        if (p.res !== 1) {
            return;
        }
        const building = DataMgr.s.mapBuilding.getBuildingById(p.buildingId);
        if (building == null) {
            return;
        }
        if (p.defenderName == null) {
            p.defenderName = "";
        }
        if (p.attackerName == null) {
            p.attackerName = "";
        }
        const isSelfAttack: boolean = DataMgr.s.userInfo.data.id != p.defenderUid;
        const selfId: string = isSelfAttack ? DataMgr.s.userInfo.data.id : p.defenderUid;
        const selfName: string = isSelfAttack ? p.attackerName : p.defenderName + " " + LanMgr.getLanById("110010");

        const otherId: string = isSelfAttack ? p.defenderUid : DataMgr.s.userInfo.data.id;
        const otherName: string = !isSelfAttack ? p.attackerName : p.defenderName + " " + LanMgr.getLanById("110010");
        const isSelfWin: boolean = isSelfAttack && p.fightResult;
        if (isSelfAttack) {
            GameMusicPlayMgr.playWormholeAttackEffect();
        }
        NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, LanMgr.getLanById("106007"));
    };

    //----------------------------------- psyc
    public static fetch_user_psyc_res = (e: any) => {
        const p: s2c_user.Ifetch_user_psyc_res = e.data;
        if (p.res !== 1) {
            return;
        }
        DataMgr.s.userInfo.data.energyDidGetTimes += 1;
    };

    //--------------------------------------- nft
    public static player_building_delegate_nft_res = (e: any) => {
        // const key: string = "player_building_delegate_nft_res";
        // if (DataMgr.socketSendData.has(key)) {
        //     const data: s2c_user.Iplayer_building_delegate_nft_res = DataMgr.socketSendData.get(key) as s2c_user.Iplayer_building_delegate_nft_res;
        //     DataMgr.s.nftPioneer.NFTChangeWork(data.nftId, data.innerBuildingId as InnerBuildingType);
        // }
    };

    public static player_nft_skill_learn_res = (e: any) => {
        const p: s2c_user.Iplayer_nft_skill_learn_res = e.data;
        if (p.res !== 1) {
            return;
        }
        DataMgr.s.nftPioneer.NFTLearnSkill(p.nftData);
    };
    public static player_nft_skill_forget_res = (e: any) => {
        const p: s2c_user.Iplayer_nft_skill_forget_res = e.data;
        if (p.res !== 1) {
            return;
        }
        DataMgr.s.nftPioneer.NFTForgetSkill(p.nftData);
    };

    public static player_lvlup_change = (e: any) => {
        const p: s2c_user.Iplayer_lvlup_change = e.data;
        DataMgr.s.userInfo.data.level = p.newLv;
        DataMgr.s.userInfo.data.energyGetLimitTimes = p.newPsycLimit;
        if (p.items.length > 0) {
            let items: ItemData[] = [];

            for (let i = 0; i < p.items.length; i++) {
                items.push(new ItemData(p.items[i].itemConfigId, p.items[i].count, p.items[i].addTimeStamp));
            }
            p.items = items;
        }
        NotificationMgr.triggerEvent(NotificationName.USERINFO_DID_CHANGE_LEVEL, p);
    };

    //------------------- box
    public static player_worldbox_beginner_open_res = async (e: any) => {
        const p: s2c_user.Iplayer_worldbox_beginner_open_res = e.data;
        if (p.res !== 1) {
            return;
        }
        let threes: share.Iartifact_three_conf[] = [];
        if (p.threes != null) {
            const keys = Object.keys(p.threes);
            if (keys.length > 0) {
                threes = p.threes[keys[0]].confs;
            }
        }

        if (threes.length <= 0) {
            // select from three cannot to next step
            // const rookieStep = DataMgr.s.userInfo.data.rookieStep;
            // if (rookieStep == RookieStep.OPEN_BOX_1 && p.boxId == "9001") {
            //     NetworkMgr.websocketMsg.player_rookie_update({
            //         rookieStep: RookieStep.NPC_TALK_5,
            //     });
            // } else if (rookieStep == RookieStep.OPEN_BOX_2 && p.boxId == "9002") {
            //     NetworkMgr.websocketMsg.player_rookie_update({
            //         rookieStep: RookieStep.NPC_TALK_7,
            //     });
            // } else if (rookieStep == RookieStep.OPEN_BOX_3 && p.boxId == "9003") {
            //     NetworkMgr.websocketMsg.player_rookie_update({
            //         rookieStep: RookieStep.SYSTEM_TALK_21,
            //     });
            // }
        }

        this._playOpenBoxAnim(p.boxIndex, p.boxId, p.items, p.artifacts, p.threes);
    };
    public static player_worldbox_beginner_open_select_res = (e: any) => {
        const p: s2c_user.Iplayer_worldbox_beginner_open_select_res = e.data;
        if (p.res !== 1) {
            return;
        }
        let nextStep: RookieStep = null;
        // const rookieStep = DataMgr.s.userInfo.data.rookieStep;
        // if (rookieStep == RookieStep.OPEN_BOX_1) {
        //     NetworkMgr.websocketMsg.player_rookie_update({
        //         rookieStep: RookieStep.NPC_TALK_5,
        //     });
        //     nextStep = RookieStep.NPC_TALK_5;
        // } else if (rookieStep == RookieStep.OPEN_BOX_2) {
        //     NetworkMgr.websocketMsg.player_rookie_update({
        //         rookieStep: RookieStep.NPC_TALK_7,
        //     });
        //     nextStep = RookieStep.NPC_TALK_7;
        // } else if (rookieStep == RookieStep.OPEN_BOX_3) {
        //     NetworkMgr.websocketMsg.player_rookie_update({
        //         rookieStep: RookieStep.SYSTEM_TALK_21,
        //     });
        //     nextStep = RookieStep.SYSTEM_TALK_21;
        // }
        if (nextStep != null) {
            DataMgr.s.userInfo.data.rookieStep = nextStep;
            NotificationMgr.triggerEvent(NotificationName.USERINFO_ROOKE_STEP_CHANGE);
        }
    };
    public static player_worldbox_open_res = async (e: any) => {
        const p: s2c_user.Iplayer_worldbox_open_res = e.data;
        if (p.res !== 1) {
            return;
        }
        let boxRank: number = 0;
        if (p.boxId == "90001") {
            boxRank = 1;
        } else if (p.boxId == "90002") {
            boxRank = 2;
        } else if (p.boxId == "90003") {
            boxRank = 3;
        } else if (p.boxId == "90004") {
            boxRank = 4;
        } else if (p.boxId == "90005") {
            boxRank = 5;
        }
        this._playOpenBoxAnim(p.boxIndex, p.boxId, p.items, p.artifacts, p.threes);
    };
    private static async _playOpenBoxAnim(
        boxIndex: number,
        boxId: string,
        itemData: share.Iitem_data[],
        artifactData: share.Iartifact_info_data[],
        threeData: {
            [key: string]: share.Iartifact_three_confs;
        }
    ) {
        let boxRank: number = 1;
        if (boxId == "90001") {
            boxRank = 1;
        } else if (boxId == "90002") {
            boxRank = 2;
        } else if (boxId == "90003") {
            boxRank = 3;
        } else if (boxId == "90004") {
            boxRank = 4;
        } else if (boxId == "90005") {
            boxRank = 5;
        }
        const items: ItemData[] = [];
        const artifacts: ArtifactData[] = [];
        let threes: share.Iartifact_three_conf[] = [];
        if (itemData != null && itemData.length > 0) {
            for (const item of itemData) {
                const data = new ItemData(item.itemConfigId, item.count, item.addTimeStamp);
                data.addTimeStamp = item.addTimeStamp;
                items.push(data);
            }
        }
        if (artifactData != null && artifactData.length > 0) {
            for (const artifact of artifactData) {
                const data = new ArtifactData(artifact.artifactConfigId, artifact.count);
                data.uniqueId = artifact.uniqueId;
                data.addTimeStamp = artifact.addTimeStamp;
                artifacts.push(data);
            }
        }
        if (threeData != null) {
            const keys = Object.keys(threeData);
            if (keys.length > 0) {
                threes = threeData[keys[0]].confs;
            }
        }
        const result = await UIPanelManger.inst.pushPanel(UIName.TreasureGettedUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(TreasureGettedUI).dialogShow(boxIndex, boxRank, items, artifacts, threes);
    }

    /////////////// task
    public static user_task_did_change = (e: any) => {
        let p: s2c_user.Iuser_task_did_change = e.data;
        const runDatas = DataMgr.s.task.getAll();
        for (let i = 0; i < runDatas.length; i++) {
            if (runDatas[i].taskId == p.task.taskId) {
                if (!runDatas[i].isGetted && p.task.isGetted) {
                    NotificationMgr.triggerEvent(NotificationName.TASK_NEW_GETTED);
                }
                if (runDatas[i].stepIndex != p.task.stepIndex || (!runDatas[i].isFinished && p.task.isFinished)) {
                    // finished
                    NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, LanMgr.getLanById("1100207"));
                }
                runDatas[i] = p.task;
                NotificationMgr.triggerEvent(NotificationName.TASK_DID_CHANGE);
                break;
            }
        }
    };
    public static user_task_action_talk = async (e: any) => {
        let p: s2c_user.Iuser_task_action_talk = e.data;
        const talkConfig = TalkConfig.getById(p.talkId);
        if (talkConfig == null) {
            return;
        }
        const result = await UIPanelManger.inst.pushPanel(UIName.DialogueUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(DialogueUI).dialogShow(talkConfig);
    };
    public static user_task_talk_info_change = (e: any) => {
        let p: s2c_user.Iuser_task_talk_info_change = e.data;
        DataMgr.s.task.updateCanTalkData(p.canTalkData);
    };
    public static user_mission_did_change = (e: any) => {
        let p: s2c_user.Iuser_mission_did_change = e.data;
        let getNew: boolean = false;
        let finished: boolean = false;
        const rundata = DataMgr.s.task.getMissionAll();
        for (const newMission of p.missions) {
            let isExit: boolean = false;
            for (const localMission of rundata) {
                if (newMission.missionId == localMission.missionId) {
                    isExit = true;
                    if (!localMission.isComplete && newMission.isComplete) {
                        finished = true;
                    }
                    localMission.missionObjCount = newMission.missionObjCount;
                    localMission.isComplete = newMission.isComplete;
                    break;
                }
            }
            if (!isExit) {
                rundata.push(newMission);
                getNew = true;
            }
        }
        if (getNew) {
            NotificationMgr.triggerEvent(NotificationName.TASK_NEW_GETTED);
        }
        if (finished) {
            NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, LanMgr.getLanById("1100207"));
        }
        NotificationMgr.triggerEvent(NotificationName.TASK_DID_CHANGE);
    };

    //------------------------------------- settlement
    public static get_user_settlement_info_res = (e: any) => {
        const p: s2c_user.Iget_user_settlement_info_res = e.data;
        if (p.res !== 1) {
            return;
        }
        DataMgr.s.settlement.refreshData(p.data);
        NotificationMgr.triggerEvent(NotificationName.SETTLEMENT_DATA_CHANGE);
    };

    //------------------------------------- board cast
    public static borad_cast_msg = (e: any) => {
        const p: s2c_user.Iborad_cast_msg = e.data;
        if (p.msg === "web_update") {
            const boardData: any = p.type.length > 0 ? JSON.parse(p.type) : null;
            if (boardData != null && boardData.target_version != null) {
                const newVersion = boardData.target_version;
                if (newVersion > GAME_VERSION) {
                    UIPanelManger.inst.pushPanel(HUDName.NewVersionView, UIPanelLayerType.HUD);
                }
            }
        }
    };
}
