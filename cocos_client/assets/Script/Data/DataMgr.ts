import NotificationMgr from "../Basic/NotificationMgr";
import { InnerBuildingType, MapBuildingType } from "../Const/BuildingDefine";
import ItemData, { ItemConfigType, ItemType } from "../Const/Item";
import { NotificationName } from "../Const/Notification";
import { MINING_FINISHED_DATA, MapNpcPioneerObject, MapPioneerActionType, MapPioneerEventAttributesChangeType, MapPioneerType, MapPlayerPioneerObject } from "../Const/PioneerDefine";
import { c2s_user, s2c_user } from "../Net/msg/WebsocketMsg";
import CLog from "../Utils/CLog";
import { RunData } from "./RunData";
import { SaveData } from "./SaveData";
import { MapBuildingWormholeObject } from "../Const/MapBuilding";
import { GameMgr, LanMgr, PioneerMgr } from "../Utils/Global";
import NetGlobalData from "./Save/Data/NetGlobalData";
import { NetworkMgr } from "../Net/NetworkMgr";
import ArtifactData from "../Model/ArtifactData";
import { UIHUDController } from "../UI/UIHUDController";
import UIPanelManger from "../Basic/UIPanelMgr";
import { UIName } from "../Const/ConstUIDefine";
import { TreasureGettedUI } from "../UI/TreasureGettedUI";
import CommonTools from "../Tool/CommonTools";
import ItemConfig from "../Config/ItemConfig";
import { ItemGettedUI } from "../UI/ItemGettedUI";
import EventConfig from "../Config/EventConfig";
import { EVENT_STEPEND_DATA } from "../Const/Event";
import { TilePos } from "../Game/TiledMap/TileTool";
import GameMainHelper from "../Game/Helper/GameMainHelper";
import TalkConfig from "../Config/TalkConfig";
import { DialogueUI } from "../UI/Outer/DialogueUI";
import MapBuildingConfig from "../Config/MapBuildingConfig";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
import { ResourceCorrespondingItem } from "../Const/ConstDefine";

export class DataMgr {
    public static r: RunData;
    public static s: SaveData;

    public static async init(): Promise<boolean> {
        DataMgr.r = new RunData();
        DataMgr.s = new SaveData();
        return true;
    }

    public static async save() {
        await this.s.save();
    }
    ///////////////// websocket
    public static onmsg = (e: any) => {
        CLog.debug("DataMgr/onmsg: e => " + JSON.stringify(e));
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
                NetGlobalData.tasks = p.data.info.tasks;
                NetGlobalData.shadows = p.data.info.shadows;
                // load save data
                await DataMgr.s.load(this.r.wallet.addr);

                NotificationMgr.triggerEvent(NotificationName.USER_LOGIN_SUCCEED);
            }
            // reconnect
            if (DataMgr.r.reconnects > 0) {
                DataMgr.r.reconnects = 0;
            }
        }
    };

    public static sinfo_change = (e: any) => {
        const p: s2c_user.Isinfo_change = e.data;
        const localData = DataMgr.s.userInfo.data;
        DataMgr.s.userInfo.replaceData(p.info);
        // exp
        if (localData.exp != p.info.exp) {
            NotificationMgr.triggerEvent(NotificationName.USERINFO_DID_CHANGE_EXP, { exp: p.info.exp - localData.exp });
        }
        // treasure progress
        if (localData.exploreProgress != p.info.treasureProgress) {
            NotificationMgr.triggerEvent(NotificationName.USERINFO_DID_CHANGE_TREASURE_PROGRESS);
        }
        // heat
        if (localData.heatValue.currentHeatValue != p.info.heatValue.currentHeatValue) {
            NotificationMgr.triggerEvent(NotificationName.USERINFO_DID_CHANGE_HEAT);
        }
    };
    //------------------------------------- item
    public static storhouse_change = async (e: any) => {
        const p: s2c_user.Istorhouse_change = e.data;
        const nonResourceGettedItems = [];
        for (const item of p.iteminfo) {
            const change = new ItemData(item.itemConfigId, item.count);
            change.addTimeStamp = item.addTimeStamp;
            DataMgr.s.item.countChanged(change);

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
    };
    //------------------------------------ artifact
    public static artifact_change = (e: any) => {
        const p: s2c_user.Iartifact_change = e.data;
        for (const artifact of p.iteminfo) {
            const change = new ArtifactData(artifact.artifactConfigId, artifact.count);
            change.addTimeStamp = artifact.addTimeStamp;
            change.effectIndex = artifact.effectIndex;
            change.uniqueId = artifact.uniqueId;
            change.effect = artifact.effect;
            DataMgr.s.artifact.countChanged(change);
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
            DataMgr.s.artifact.countChanged(change);
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
            if (currentData.troopIng != netBuilding.troopIng || currentData.upgrading != netBuilding.upgradeIng) {
                NotificationMgr.triggerEvent(NotificationName.INNER_BUILDING_DATA_CHANGE);
            }
            if (currentData.upgrading && !netBuilding.upgradeIng) {
                // upgrade finish
                NotificationMgr.triggerEvent(NotificationName.INNER_BUILDING_UPGRADE_FINISHED, currentData.buildType);
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
    public static pioneer_change = (e: any) => {
        const p: s2c_user.Ipioneer_change = e.data;
        const localDatas = DataMgr.s.pioneer.getAll();
        for (const temple of p.pioneers) {
            for (let i = 0; i < localDatas.length; i++) {
                if (temple.id == localDatas[i].id) {
                    const oldData = localDatas[i];
                    const newData = DataMgr.s.pioneer.replaceData(i, temple);
                    // show
                    if (oldData.show != newData.show) {
                        NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_SHOW_CHANGED, { id: newData.id, show: newData.show });
                    }
                    // faction
                    if (oldData.faction != newData.faction) {
                        NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_FACTION_CHANGED, { id: newData.id, show: newData.show });
                    }
                    // action type
                    if (oldData.actionType != newData.actionType || oldData.actionEndTimeStamp != newData.actionEndTimeStamp) {
                        NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_ACTIONTYPE_CHANGED, { id: newData.id });
                        if (oldData.actionType == MapPioneerActionType.mining && oldData.actionBuildingId != null) {
                            // mining over
                            const resourceData = GameMgr.getResourceBuildingRewardAndQuotaMax(DataMgr.s.mapBuilding.getBuildingById(oldData.actionBuildingId));
                            if (resourceData != null) {
                                NotificationMgr.triggerEvent(NotificationName.MINING_FINISHED, {
                                    buildingId: oldData.actionBuildingId,
                                    pioneerId: oldData.id,
                                    duration: 5000,
                                    rewards: [{ id: resourceData.reward.itemConfigId, num: resourceData.reward.count }],
                                } as MINING_FINISHED_DATA);
                            }
                        }
                        if (oldData.type == newData.type && newData.type == MapPioneerType.player && oldData.actionType == MapPioneerActionType.dead) {
                            // player rebirth
                            GameMusicPlayMgr.playPioneerRebonEffect();
                        }
                    }
                    // event
                    if (oldData.actionEventId != newData.actionEventId) {
                        NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_EVENTID_CHANGE, {
                            triggerPioneerId: newData.id,
                            eventBuildingId: newData.actionBuildingId,
                            eventId: newData.actionEventId,
                        });
                        const stepEndData: EVENT_STEPEND_DATA = {
                            pioneerId: newData.id,
                            buildingId: newData.actionBuildingId,
                            eventId: newData.actionEventId,
                            hasNextStep:
                                newData.actionEventId != "-1" && newData.actionEventId != "-2" && newData.actionEventId != "" && newData.actionEventId != null,
                        };
                        NotificationMgr.triggerEvent(NotificationName.EVENT_STEPEND, stepEndData);
                    }
                    // fight
                    if (oldData.fightData == null && newData.fightData != null) {
                        NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_FIGHT_BEGIN, { id: newData.id });
                    }
                    // staypos
                    if (oldData.stayPos.x != newData.stayPos.x || oldData.stayPos.y != newData.stayPos.y) {
                        NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_STAY_POSITION_CHANGE, { id: newData.id });
                    }
                    // hp
                    if (oldData.hp != newData.hp || oldData.hpMax != newData.hpMax) {
                        NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_HP_CHANGED);
                    }
                    // map reborn
                    if (oldData.rebornTime != newData.rebornTime) {
                        NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_REBON_CHANGE);
                    }
                    break;
                }
            }
        }
    };
    public static mappioneer_reborn_change = (e: any) => {
        NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, LanMgr.getLanById("106009"));
    };
    public static mapbuilding_reborn_change = (e: any) => {
        NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, LanMgr.getLanById("106010"));
    };

    public static mapbuilding_change = (e: any) => {
        const p: s2c_user.Imappbuilding_change = e.data;
        const localDatas = DataMgr.s.mapBuilding.getObj_building();
        for (const temple of p.mapbuildings) {
            for (let i = 0; i < localDatas.length; i++) {
                if (temple.id == localDatas[i].id) {
                    const oldData = localDatas[i];
                    const newData = DataMgr.s.mapBuilding.replaceData(i, temple);
                    if (oldData.show != newData.show) {
                        NotificationMgr.triggerEvent(NotificationName.MAP_BUILDING_SHOW_CHANGE, { id: newData.id });
                    }
                    if (oldData.faction != newData.faction) {
                        NotificationMgr.triggerEvent(NotificationName.MAP_BUILDING_FACTION_CHANGE, { id: newData.id });
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
                        oldData.explorePioneerIds.length != newData.explorePioneerIds.length
                    ) {
                        NotificationMgr.triggerEvent(NotificationName.MAP_BUILDING_ACTION_PIONEER_CHANGE);
                    }

                    if (oldData.rebornTime != newData.rebornTime) {
                        NotificationMgr.triggerEvent(NotificationName.MAP_BUILDING_REBON_CHANGE);
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
        const npcObj = DataMgr.s.pioneer.getById(p.npcId) as MapNpcPioneerObject;
        if (!!npcObj && npcObj.talkId != null) {
            const talkData = TalkConfig.getById(npcObj.talkId);
            if (talkData == null) {
                return;
            }
            const result = await UIPanelManger.inst.pushPanel(UIName.DialogueUI);
            if (result.success) {
                result.node.getComponent(DialogueUI).dialogShow(talkData, null);
            }
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
        const buildingConfig = MapBuildingConfig.getById(p.buildingId);
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
    public static player_event_select_res = (e: any) => {
        const p: s2c_user.Iplayer_event_select_res = e.data;
        if (p.res !== 1) {
            return;
        }
        const eventConfig = EventConfig.getById(p.eventId);
        if (eventConfig.type == 4) {
            // reward change
            if (eventConfig.cost == null) {
                return;
            }
            let showTip: string = "";
            for (const temple of eventConfig.cost) {
                const type: ItemConfigType = temple[0];
                const id: string = temple[1];
                const num: number = temple[2];
                if (type == ItemConfigType.Item) {
                    const itemConf = ItemConfig.getById(id);
                    if (itemConf == null) {
                        continue;
                    }
                    showTip += LanMgr.replaceLanById("207008", [num, LanMgr.getLanById(itemConf.itemName)]) + "\n";
                }
            }
            UIHUDController.showCenterTip(showTip);
        } else if (eventConfig.type == 5) {
            // attributes change
            if (eventConfig.change != null) {
                let showTip: string = "";
                for (const tempChange of eventConfig.change) {
                    const isPlayer: boolean = tempChange[0] == "-1";
                    // 1-hp 2-attack
                    const changedType: MapPioneerEventAttributesChangeType = tempChange[1];
                    if (isPlayer) {
                        if (changedType == 1) {
                            showTip += LanMgr.getLanById("207001") + "\n";
                        } else {
                            showTip += LanMgr.getLanById("207002") + "\n";
                        }
                    } else {
                        const pioneerInfo = DataMgr.s.pioneer.getById(tempChange[0]);
                        if (pioneerInfo == null) {
                            if (changedType == 1) {
                                showTip += LanMgr.getLanById("207003") + "\n";
                            } else {
                                showTip += LanMgr.getLanById("207004") + "\n";
                            }
                        } else {
                            if (changedType == 1) {
                                showTip += LanMgr.replaceLanById("207005", [pioneerInfo.name]) + "\n";
                            } else {
                                showTip += LanMgr.replaceLanById("207006", [pioneerInfo.name]) + "\n";
                            }
                        }
                    }
                }
                UIHUDController.showCenterTip(showTip);
            }
        }
    };
    public static player_wormhole_set_attacker_res = (e: any) => {
        const p = e.data;
        if (p.res !== 1) {
            return;
        }
        GameMusicPlayMgr.playWormholeSetAttackerEffect();
    };

    public static player_fight_end = (e: any) => {
        const p: s2c_user.Iplayer_fight_end = e.data;
        const pioneer = DataMgr.s.pioneer.getById(p.pioneerId);
        if (pioneer == undefined) {
            return;
        }
        NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_FIGHT_END, { id: p.pioneerId });
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
    public static player_wormhole_fight_attacked_res = (e: any) => {
        const p: s2c_user.Iplayer_wormhole_fight_attacked_res = e.data;
        if (p.res !== 1) {
            return;
        }
        if (DataMgr.s.userInfo.data.id != p.defenderUid) {
            return;
        }
        GameMusicPlayMgr.playWormholeAttackEffect();
        PioneerMgr.showFakeWormholeFight(p.attackerName);
    };
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
        const selfName: string = isSelfAttack ? p.attackerName : p.defenderName + " " + LanMgr.getLanById("110010");
        const otherName: string = !isSelfAttack ? p.attackerName : p.defenderName + " " + LanMgr.getLanById("110010");
        const isSelfWin: boolean = isSelfAttack && p.fightResult;
        if (isSelfAttack) {
            GameMusicPlayMgr.playWormholeAttackEffect();
        }

        NotificationMgr.triggerEvent(NotificationName.FIGHT_FINISHED, {
            attacker: {
                name: selfName,
                avatarIcon: "icon_player_avatar",
                hp: isSelfWin ? 100 : 0,
                hpMax: 100,
            },
            defender: {
                name: otherName,
                avatarIcon: "icon_player_avatar",
                hp: isSelfWin ? 0 : 50,
                hpMax: 50,
            },
            attackerIsSelf: true,
            buildingId: null,
            position: null,
            fightResult: isSelfWin ? "win" : "lose",
            rewards: [],
        });
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

    //----------------------------------- world treasure
    public static player_world_treasure_lottery_res = async (e: any) => {
        const p: s2c_user.Iplayer_world_treasure_lottery_res = e.data;
        if (p.res !== 1) {
            return;
        }
        DataMgr.s.userInfo.data.heatValue.lotteryTimes += 1;
        const result = await UIPanelManger.inst.pushPanel(UIName.TreasureGettedUI);
        if (result.success) {
            result.node.getComponent(TreasureGettedUI).dialogShow([new ItemData(p.itemId, p.num)], []);
        }
    };
    public static get_treasure_info_res = (e: any) => {
        const p: s2c_user.Iget_treasure_info_res = e.data;
        if (p.res !== 1) {
            return;
        }
        for (const key in p.data) {
            NetGlobalData.worldTreasureTodayRewards = p.data[key];
            break;
        }
    };
    public static player_world_treasure_pool_change_res = (e: any) => {
        const p: s2c_user.Iplayer_world_treasure_pool_change_res = e.data;
        if (p.res !== 1) {
            return;
        }
        NetworkMgr.websocketMsg.get_treasure_info({});
    };
    public static player_treasure_open_res = (e: any) => {
        // const key: string = "player_treasure_open_res";
        // if (DataMgr.socketSendData.has(key)) {
        //     const data: s2c_user.Iplayer_treasure_open_res = DataMgr.socketSendData.get(key) as s2c_user.Iplayer_treasure_open_res;
        //     DataMgr.s.userInfo.getExplorationReward(data.boxId);
        // }
    };
    public static player_point_treasure_open_res = (e: any) => {
        // const key: string = "player_point_treasure_open_res";
        // if (DataMgr.socketSendData.has(key)) {
        //     const data: s2c_user.Iplayer_point_treasure_open_res = DataMgr.socketSendData.get(key) as s2c_user.Iplayer_point_treasure_open_res;
        //     DataMgr.s.userInfo.getPointExplorationReward(data.boxId);
        // }
    };
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

    public static player_rookie_finish_res = (e: any) => {
        DataMgr.s.userInfo.finishRookie();
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

    /////////////// task
    public static user_task_action_getnewtalk = (e: any) => {
        let p: s2c_user.Iuser_task_action_getnewtalk = e.data;
        DataMgr.s.pioneer.changeTalk(p.npcId, p.talkId);
    };
    public static user_task_did_change = (e: any) => {
        let p: s2c_user.Iuser_task_did_change = e.data;
        const runDatas = DataMgr.s.task.getAll();
        for (let i = 0; i < runDatas.length; i++) {
            if (runDatas[i].taskId == p.task.taskId) {
                if (!runDatas[i].isGetted && p.task.isGetted) {
                    NotificationMgr.triggerEvent(NotificationName.TASK_NEW_GETTED);
                }
                runDatas[i] = p.task;
                NotificationMgr.triggerEvent(NotificationName.TASK_DID_CHANGE);
                break;
            }
        }
    };
    public static get_user_task_info_res = (e: any) => {
        let p: s2c_user.Iget_user_task_info_res = e.data;
        if (p.res == 1) {
            NetGlobalData.tasks = p.tasks;
            DataMgr.s.task.loadObj();
            NotificationMgr.triggerEvent(NotificationName.TASK_LIST);
        }
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
}
