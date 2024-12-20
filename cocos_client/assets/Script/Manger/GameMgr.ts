import { find, v2, Vec2 } from "cc";
import NotificationMgr from "../Basic/NotificationMgr";
import InnerBuildingConfig from "../Config/InnerBuildingConfig";
import { InnerBuildingType, MapBuildingType, UserInnerBuildInfo } from "../Const/BuildingDefine";
import { GameExtraEffectType, MapInteractType, MapMemberTargetType, ResourceCorrespondingItem } from "../Const/ConstDefine";
import ItemData from "../Const/Item";
import { MapBuildingObject } from "../Const/MapBuilding";
import { NotificationName } from "../Const/Notification";
import { MapPioneerActionType, MapPioneerObject, MapPioneerType, MapPlayerPioneerObject } from "../Const/PioneerDefine";
import { TaskCondition, TaskConditionType, TaskStepObject } from "../Const/TaskDefine";
import { DataMgr } from "../Data/DataMgr";
import CommonTools from "../Tool/CommonTools";
import GameMainHelper from "../Game/Helper/GameMainHelper";
import { RookieStep } from "../Const/RookieDefine";
import { ClvlMgr, LanMgr } from "../Utils/Global";
import { CLvlEffectType } from "../Const/Lvlup";
import ConfigConfig from "../Config/ConfigConfig";
import { ConfigType, InitMaxTroopNumParam, OneStepCostEnergyParam, WormholeMatchConsumeParam, WormholeTeleportConsumeParam } from "../Const/Config";
import UIPanelManger, { UIPanelLayerType } from "../Basic/UIPanelMgr";
import { HUDName } from "../Const/ConstUIDefine";
import { TileMapHelper, TilePos } from "../Game/TiledMap/TileTool";
import BigMapConfig from "../Config/BigMapConfig";
import { share } from "../Net/msg/WebsocketMsg";
import TroopsConfig from "../Config/TroopsConfig";
import InnerBuildingLvlUpConfig from "../Config/InnerBuildingLvlUpConfig";
import PioneerLvlupConfig from "../Config/PioneerLvlupConfig";
import { ReplenishTroopsView } from "../UI/View/ReplenishTroopsView";
import { OuterShadowController } from "../Game/Outer/OuterShadowController";
import { ReplenishEnergyView } from "../UI/View/ReplenishEnergyView";
import NFTPioneerConfig from "../Config/NFTPioneerConfig";
import NFTHandBookConfig from "../Config/NFTHandBookConfig";

export interface MapCityInfo {
    templeConfigId: string;
    playerId: string;
    pname: string;
    level: number;
    battlePower: number;
    honor: number;
}

export default class GameMgr {
    public rookieTaskExplainIsShow: boolean = false;
    public enterGameSence: boolean = false;
    public lastEventSelectFightIdx: number = -1;

    private _dispatchReplenishTroopAfterEnergyUnqueId: string = null;

    public findInViewBuildingInfo(buildingType: MapBuildingType): MapBuildingObject {
        const outScene = find("Main/Canvas/GameContent/Game/OutScene");
        if (outScene == null) {
            return null;
        }
        const shadowController: OuterShadowController = outScene.getComponent(OuterShadowController);
        if (shadowController == null) {
            return;
        }
        let citySlot = DataMgr.s.mapBuilding.getSelfMainCitySlotId();
        let buildingData = DataMgr.s.mapBuilding.getObj_building();
        let resBds = buildingData.filter((building) => {
            if (building.type != buildingType) {
                return false;
            }
            if (building.uniqueId.split("|")[0] != citySlot) {
                return false;
            }
            if (shadowController.tiledMapIsAllBlackShadow(building.stayMapPositions[0].x, building.stayMapPositions[0].y)) {
                return false;
            }
            return true;
        });
        const mainCity = DataMgr.s.mapBuilding.getSelfMainCityBuilding();
        let cityPos = TileMapHelper.INS.getPos(mainCity.stayMapPositions[0].x, mainCity.stayMapPositions[0].y);
        let findBuilding: MapBuildingObject = null;
        let minLen = 99999;
        resBds.forEach((building) => {
            let buildingPos = TileMapHelper.INS.getPos(building.stayMapPositions[0].x, building.stayMapPositions[0].y);
            let len = TileMapHelper.INS.Path_DistPos(cityPos, buildingPos);
            if (len < minLen) {
                minLen = len;
                findBuilding = building;
            }
        });
        return findBuilding;
    }

    public findInViewPioneerInfo(pioneerType: MapPioneerType): MapPioneerObject {
        const outScene = find("Main/Canvas/GameContent/Game/OutScene");
        if (outScene == null) {
            return null;
        }
        const shadowController: OuterShadowController = outScene.getComponent(OuterShadowController);
        if (shadowController == null) {
            return;
        }
        let citySlot = DataMgr.s.mapBuilding.getSelfMainCitySlotId();
        let pioneers = DataMgr.s.pioneer.getAll();
        let resBds = pioneers.filter((pioneer) => {
            if (pioneer.type != pioneerType) {
                return false;
            }
            if (pioneer.uniqueId.split("|")[0] != citySlot) {
                return false;
            }
            if (shadowController.tiledMapIsAllBlackShadow(pioneer.stayPos.x, pioneer.stayPos.y)) {
                return false;
            }
            return true;
        });
        const mainCity = DataMgr.s.mapBuilding.getSelfMainCityBuilding();
        let cityPos = TileMapHelper.INS.getPos(mainCity.stayMapPositions[0].x, mainCity.stayMapPositions[0].y);
        let findPioneer: MapPioneerObject = null;
        let minLen = 99999;
        resBds.forEach((pioneer) => {
            let buildingPos = TileMapHelper.INS.getPos(pioneer.stayPos.x, pioneer.stayPos.y);
            let len = TileMapHelper.INS.Path_DistPos(cityPos, buildingPos);
            if (len < minLen) {
                minLen = len;
                findPioneer = pioneer;
            }
        });
        return findPioneer;
    }

    public canAddTroopNum(): number {
        return this.getMaxTroopNum() - this.getAllTroopNum();
    }

    public getAllTroopNum(): number {
        let num = 0;
        // user troop
        num += DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Troop);
        // tc
        DataMgr.s.innerBuilding.data.forEach((value: UserInnerBuildInfo, key: InnerBuildingType) => {
            if (key == InnerBuildingType.TrainingCenter) {
                const tc = value.tc;
                if (tc != null) {
                    for (const key in tc.troops) {
                        const element = tc.troops[key];
                        num += element;
                    }
                    if (tc.training != null) {
                        for (const key in tc.training.troops) {
                            const element = tc.training.troops[key];
                            num += element;
                        }
                    }
                }
            }
        });
        // pioneer
        for (const pioneer of DataMgr.s.pioneer.getAllSelfPlayers()) {
            if (pioneer.hp > 0) {
                num += this.convertHpToTroopNum(pioneer.hp, pioneer.troopId);
            }
        }
        return num;
    }
    public getMaxTroopNum(): number {
        let num: number = 0;
        const houseNum = InnerBuildingLvlUpConfig.getBuildingLevelData(DataMgr.s.innerBuilding.getInnerBuildingLevel(InnerBuildingType.House), "max_pop");
        if (houseNum != null) {
            num += houseNum;
        }
        const initNum = (ConfigConfig.getConfig(ConfigType.InitMaxTroopNum) as InitMaxTroopNumParam).num;
        num += initNum;
        return num;
    }

    public convertHpToTroopNum(hp: number, troopId: string) {
        if (troopId == null || troopId == "0") {
            return Math.ceil(hp);
        } else {
            const troop_config = TroopsConfig.getById(troopId);
            return Math.ceil(hp / Number(troop_config.hp_training));
        }
    }

    public getResourceBuildingRewardAndQuotaMax(building: MapBuildingObject): { reward: ItemData; quotaMax: number } {
        const config = this.getMapBuildingConfigByExistSlotInfo(building.uniqueId);
        if (config == null) {
            return null;
        }
        const reward = new ItemData(config.resources[0], config.resources[1]);
        reward.count = Math.floor(reward.count * (1 + (building.level - 1) * 0.2));

        let quotaMax: number = config.quota;
        quotaMax = quotaMax + Math.floor(0.5 * (building.level - 1));

        return { reward: reward, quotaMax: quotaMax };
    }

    public taskTracking(currentTask: share.Itask_info_data | share.Imission_data) {
        if (DataMgr.s.userInfo.data.rookieStep == RookieStep.FINISH) {
            return;
        }
        let currentMapPos: Vec2 = null;
        if (!!(currentTask as share.Itask_info_data)) {
            const templeTask: share.Itask_info_data = currentTask as share.Itask_info_data;
            const currentStepTask: TaskStepObject = DataMgr.s.task.getTaskStep(templeTask.steps[templeTask.stepIndex].id);
            if (currentStepTask == null) {
                return;
            }
            let condition: TaskCondition = null;
            if (currentStepTask.completeCon != null && currentStepTask.completeCon.conditions.length > 0) {
                condition = currentStepTask.completeCon.conditions[0];
            }
            if (condition == null) {
                return;
            }
            let interactBuildingId: string = null;
            let interactPioneerId: string = null;
            if (condition.type == TaskConditionType.Talk) {
                let targetPioneer = null;
                const allNpcs = DataMgr.s.pioneer.getAllNpcs();
                const canTalkData = DataMgr.s.task.getCanTalkData();
                for (const npc of allNpcs) {
                    const talkData = canTalkData[npc.id];
                    if (talkData == undefined) {
                        continue;
                    }
                    if (talkData.talkId == condition.talk.talkId) {
                        targetPioneer = npc;
                        break;
                    }
                }
                if (targetPioneer != null) {
                    interactPioneerId = targetPioneer.id;
                    currentMapPos = targetPioneer.stayPos;
                }
            } else if (condition.type == TaskConditionType.Kill) {
                let targetPioneer: MapPioneerObject = null;
                if (condition.kill.enemyIds.length > 0) {
                    //wait change
                    targetPioneer = DataMgr.s.pioneer.getById(condition.kill.enemyIds[CommonTools.getRandomInt(0, condition.kill.enemyIds.length - 1)]);
                }
                if (targetPioneer != null) {
                    interactPioneerId = targetPioneer.id;
                    currentMapPos = targetPioneer.stayPos;
                }
            } else if (condition.type == TaskConditionType.interact && condition.interact.interactId != null) {
                if (condition.interact.target == MapMemberTargetType.pioneer) {
                    const targetPioneer = DataMgr.s.pioneer.getById(condition.interact.interactId);
                    if (targetPioneer != null) {
                        currentMapPos = targetPioneer.stayPos;
                        interactPioneerId = targetPioneer.id;
                    }
                } else if (condition.interact.target == MapMemberTargetType.building) {
                    const targetBuilding = DataMgr.s.mapBuilding.getBuildingById(condition.interact.interactId);
                    if (targetBuilding != null) {
                        currentMapPos = targetBuilding.stayMapPositions[0];
                        interactBuildingId = targetBuilding.id;
                    }
                }
            }
        }

        if (currentMapPos != null) {
            // if (!GameMainHelper.instance.isGameShowOuter) {
            //     GameMainHelper.instance.changeInnerAndOuterShow();
            // }
            // let triggerTask: boolean = false;
            // const rookieStep = DataMgr.s.userInfo.data.rookieStep;
            // if (rookieStep == RookieStep.TASK_SHOW_TAP_1 || rookieStep == RookieStep.TASK_SHOW_TAP_2 || rookieStep == RookieStep.TASK_SHOW_TAP_3) {
            //     triggerTask = true;
            // }
            // const worldPos = GameMainHelper.instance.tiledMapGetPosWorld(currentMapPos.x, currentMapPos.y);
            // GameMainHelper.instance.changeGameCameraWorldPosition(worldPos, true, triggerTask);
            // GameMainHelper.instance.showTrackingView(worldPos, {
            //     stepId: currentStepTask.id,
            //     interactBuildingId: interactBuildingId,
            //     interactPioneerId: interactPioneerId,
            // });
        }
    }

    //----------------------------------------------------------------- cost energy
    public getMapActionCostEnergy(moveStep: number, interactBuildingId: string = null) {
        let buildingCost: number = 0;
        if (interactBuildingId != null) {
            const buildingConfig = this.getMapBuildingConfigByExistSlotInfo(interactBuildingId);
            if (buildingConfig.cost != null) {
                buildingCost = buildingConfig.cost;
            }
        }
        const perStepCostEnergy = (ConfigConfig.getConfig(ConfigType.OneStepCostEnergy) as OneStepCostEnergyParam).cost;
        return perStepCostEnergy * moveStep + buildingCost;
    }

    public async checkMapCanInteractAndCalulcateMovePath(
        player: MapPlayerPioneerObject,
        interactType: MapInteractType,
        interactBuilding: MapBuildingObject,
        interactPioneer: MapPioneerObject,
        targetPos: Vec2
    ): Promise<{
        enable: boolean;
        movePath: TilePos[];
    }> {
        this._dispatchReplenishTroopAfterEnergyUnqueId = null;

        if (player.actionType != MapPioneerActionType.inCity && player.actionType != MapPioneerActionType.staying) {
            NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, LanMgr.getLanById("203002"));
            return { enable: false, movePath: [] };
        }
        let beginPos: Vec2 = player.stayPos;
        let sparePositions: Vec2[] = [];
        let targetStayPostions: Vec2[] = [];
        if (interactBuilding != null) {
            sparePositions = interactBuilding.stayMapPositions.slice();
            targetStayPostions = interactBuilding.stayMapPositions.slice();
            if (interactBuilding.type == MapBuildingType.city && sparePositions.length == 7) {
                // center pos cannot use to cal move path
                sparePositions.splice(3, 1);
            }
        } else if (interactPioneer != null) {
            if (interactPioneer.type == MapPioneerType.player || interactPioneer.type == MapPioneerType.npc) {
                targetStayPostions = [interactPioneer.stayPos];
            }
        }
        const moveData = this.findTargetLeastMovePath(beginPos, targetPos, sparePositions, targetStayPostions);
        if (moveData.status !== 1) {
            NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, "Insufficient Energy");
            return { enable: false, movePath: [] };
        }
        const trueCostEnergy: number =
            interactType == MapInteractType.MainBack
                ? 0
                : this.getMapActionCostEnergy(moveData.path.length, interactBuilding != null ? interactBuilding.uniqueId : null);

        if (player.energyMax < trueCostEnergy) {
            NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, "Insufficient Energy");
            return { enable: false, movePath: [] };
        }
        if (player.energy < trueCostEnergy && trueCostEnergy <= player.energyMax) {
            // replenish energy
            const result = await UIPanelManger.inst.pushPanel(HUDName.ReplenishEnergyView, UIPanelLayerType.HUD);
            if (result.success) {
                result.node.getComponent(ReplenishEnergyView).configuration(player.uniqueId);
            }

            if (interactType != MapInteractType.Collect && interactType != MapInteractType.MainBack && player.hp <= 0) {
                this._dispatchReplenishTroopAfterEnergyUnqueId = player.uniqueId;
            }

            return { enable: false, movePath: [] };
        }
        if (interactType != MapInteractType.Collect && interactType != MapInteractType.MainBack && player.hp <= 0) {
            const result = await UIPanelManger.inst.pushPanel(HUDName.ReplenishTroopsView, UIPanelLayerType.HUD);
            if (result.success) {
                result.node.getComponent(ReplenishTroopsView).configuration(player.uniqueId);
            }
            return { enable: false, movePath: [] };
        }
        let times: number = 0;
        let consumeConfigs: [number, string, number][] = null;
        if (interactType == MapInteractType.WmMatch) {
            times = DataMgr.s.userInfo.data.wormholeMatchTimes;
            consumeConfigs = (ConfigConfig.getConfig(ConfigType.WormholeMatchConsume) as WormholeMatchConsumeParam).consumes;
        } else if (interactType == MapInteractType.WmTeleport) {
            times = DataMgr.s.userInfo.data.wormholeTeleportTimes;
            consumeConfigs = (ConfigConfig.getConfig(ConfigType.WormholeTeleportConsume) as WormholeTeleportConsumeParam).consumes;
        }
        if (consumeConfigs != null) {
            let consume: [number, string, number] = null;
            for (const element of consumeConfigs) {
                if (element[0] == times + 1) {
                    consume = element;
                    break;
                }
            }
            if (consume == null) {
                consume = consumeConfigs[consumeConfigs.length - 1];
            }
            if (consume != null) {
                let ownedNum: number = DataMgr.s.item.getObj_item_count(consume[1]);
                if (ownedNum < consume[2]) {
                    NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, "Insufficient Resouces");
                    return { enable: false, movePath: [] };
                }
            }
        }
        return { enable: true, movePath: moveData.path };
    }

    //-----------------------------------------------------------------
    // move
    public getMainCityGatePos(): Vec2 {
        const buildings = DataMgr.s.mapBuilding.getObj_building();
        const mainCity = buildings.find((item) => {
            if (item.type != MapBuildingType.city) {
                return;
            }
            const splitUniqueId = item.uniqueId.split("|");
            if (splitUniqueId.length != 2) {
                return false;
            }
            return splitUniqueId[0] == DataMgr.s.mapBuilding.getSelfMainCitySlotId();
        });
        if (mainCity == undefined || mainCity.stayMapPositions.length != 7) {
            return null;
        }
        const centerPos = mainCity.stayMapPositions[3];
        return v2(centerPos.x, centerPos.y + 2);
    }
    /**
     * findTargetLeastMovePath
     * @param beginPos
     * @param targetPos
     * @param sparePositions
     * @param stayPostions
     * @returns status: 1-canMove -1-param error -2-too long
     */
    public findTargetLeastMovePath(beginPos: Vec2, targetPos: Vec2, sparePositions: Vec2[], stayPostions: Vec2[]): { status: number; path: TilePos[] } {
        let movePath: TilePos[] = [];
        if (beginPos == null || targetPos == null) {
            return { status: -1, path: movePath };
        }
        const moveGap = Math.abs(beginPos.x - targetPos.x) + Math.abs(beginPos.y - targetPos.y);
        if (moveGap >= 200) {
            return { status: -2, path: movePath };
        }
        if (sparePositions.length > 0) {
            // building: find least move path
            let minMovePath = null;
            const templePath = GameMainHelper.instance.tiledMapGetTiledMovePathByTiledPos(beginPos, stayPostions[0], stayPostions);
            if (templePath.canMove) {
                if (minMovePath == null) {
                    minMovePath = templePath.path;
                } else {
                    if (minMovePath.length > templePath.path.length) {
                        minMovePath = templePath.path;
                    }
                }
            }
            if (minMovePath != null) {
                movePath = minMovePath;
            }
        } else {
            // pioneer or land
            const toPosMoveData = GameMainHelper.instance.tiledMapGetTiledMovePathByTiledPos(beginPos, targetPos, stayPostions);
            if (toPosMoveData.canMove) {
                movePath = toPosMoveData.path;
            }
        }
        return { status: 1, path: movePath };
    }

    //--------------------------- effect
    public getEffectShowText(type: GameExtraEffectType, value: number): string {
        value = CommonTools.getOneDecimalNum(value);
        switch (type) {
            case GameExtraEffectType.BUILDING_LVUP_TIME:
                return "REDUCE BUILDING LVUP TIME:" + value;

            case GameExtraEffectType.BUILDING_LVLUP_RESOURCE:
                return "REDUCE BUILDING LVLUP RESOURCE:" + value;

            case GameExtraEffectType.MOVE_SPEED:
                return "ADD MOVE SPEED:" + value;

            case GameExtraEffectType.GATHER_TIME:
                return "REDUCE GATHER TIME:" + value;

            case GameExtraEffectType.ENERGY_GENERATE:
                return "ADD ENERGY GENERATE:" + value;

            case GameExtraEffectType.TROOP_GENERATE_TIME:
                return "REDUCE TROOP GENERATE TIME:" + value;

            case GameExtraEffectType.CITY_RADIAL_RANGE:
                return "ADD CITY RADIAL RANGE:" + value;

            case GameExtraEffectType.TREASURE_PROGRESS:
                return "ADD GET PROGRESS:" + value;

            case GameExtraEffectType.CITY_ONLY_VISION_RANGE:
                return "ADD CITY ONLY VISION RANGE:" + value;

            case GameExtraEffectType.PIONEER_ONLY_VISION_RANGE:
                return "ADD PIONEER ONLY VISION RANGE:" + value;

            case GameExtraEffectType.CITY_AND_PIONEER_VISION_RANGE:
                return "ADD CITY AND PIONEER VISION RANGE:" + value;

            default:
                return "";
        }
    }

    public getAfterEffectValueByBuilding(buildingType: InnerBuildingType, type: GameExtraEffectType, originalValue: number): number {
        let resultEffectValue: number = 0;
        const clevel: number = DataMgr.s.userInfo.data.level;
        resultEffectValue += DataMgr.s.artifact.getEffectValueByEffectType(type, clevel);
        if (type == GameExtraEffectType.BUILDING_LVUP_TIME) {
            const nft = DataMgr.s.nftPioneer.getNFTByWorkingBuildingId(buildingType);
            const buildingConfig = InnerBuildingConfig.getByBuildingType(buildingType);
            if (nft != undefined && buildingConfig.staff_effect != null) {
                for (const temple of buildingConfig.staff_effect) {
                    if (temple[0] == "lvlup_time" && temple[1] == 1) {
                        resultEffectValue -= nft.iq * temple[2][0];
                    }
                }
            }
        }
        return this._getEffectResultNum(type, originalValue, resultEffectValue);
    }

    public getAfterEffectValue(type: GameExtraEffectType, originalValue: number): number {
        const clevel: number = DataMgr.s.userInfo.data.level;

        let effectValue: number = 0;

        const artifactEffectValue: number = DataMgr.s.artifact.getEffectValueByEffectType(type, clevel);
        effectValue += artifactEffectValue;

        if (type == GameExtraEffectType.TROOP_GENERATE_TIME) {
            const cLvlEffectValue: number = ClvlMgr.getCurrentCLvlEffectByType(CLvlEffectType.TROOP_GENERATE_SPEED)?.value;
            effectValue += cLvlEffectValue === undefined ? 0 : cLvlEffectValue;
        } else if (type == GameExtraEffectType.CITY_ONLY_VISION_RANGE || type == GameExtraEffectType.PIONEER_ONLY_VISION_RANGE) {
            const cLvlEffectValue: number = ClvlMgr.getCurrentCLvlEffectByType(CLvlEffectType.CITY_AND_PIONEER_VISION_RANGE)?.value;
            effectValue += cLvlEffectValue === undefined ? 0 : cLvlEffectValue;
        }

        return this._getEffectResultNum(type, originalValue, effectValue);
    }

    public getAfterExtraEffectPropertyByPioneer(uniqueId: string, type: GameExtraEffectType, originalValue: number): number {
        // artifact effect
        let artifactChangeRate: number = DataMgr.s.artifact.getObj_artifact_effectiveEffect(
            type,
            DataMgr.s.innerBuilding.getInnerBuildingLevel(InnerBuildingType.ArtifactStore)
        );

        // nft
        let nftChangeRate: number = 0;
        const pioneer = DataMgr.s.pioneer.getById(uniqueId) as MapPlayerPioneerObject;
        if (!!pioneer && pioneer.NFTId != null) {
            nftChangeRate = DataMgr.s.nftPioneer.getNFTEffectById(pioneer.NFTId, type);
        }

        return this._getEffectResultNum(type, originalValue, artifactChangeRate + nftChangeRate);
    }
    public getAfterExtraEffectPropertyByBuilding(buildingType: InnerBuildingType, type: GameExtraEffectType, originalValue: number): number {
        // artifact effect
        let artifactChangeRate: number = DataMgr.s.artifact.getObj_artifact_effectiveEffect(
            type,
            DataMgr.s.innerBuilding.getInnerBuildingLevel(InnerBuildingType.ArtifactStore)
        );

        let resultValue = this._getEffectResultNum(type, originalValue, artifactChangeRate);
        //nft
        if (type == GameExtraEffectType.BUILDING_LVUP_TIME) {
            const nft = DataMgr.s.nftPioneer.getNFTByWorkingBuildingId(buildingType);
            const buildingConfig = InnerBuildingConfig.getByBuildingType(buildingType);
            if (nft != undefined && buildingConfig.staff_effect != null) {
                let nftEffect = 0;
                for (const temple of buildingConfig.staff_effect) {
                    if (temple[0] == "lvlup_time" && temple[1] == DataMgr.s.innerBuilding.getInnerBuildingLevel(buildingType) + 1) {
                        nftEffect += temple[2][0];
                    }
                }
                resultValue = Math.floor(resultValue * (1 + nft.iq * nftEffect));
            }
        }
        resultValue = Math.max(1, resultValue);
        return resultValue;
    }

    private _getEffectResultNum(type: GameExtraEffectType, originalValue: number, effectNum: number): number {
        if (type == GameExtraEffectType.MOVE_SPEED || type == GameExtraEffectType.ENERGY_GENERATE || type == GameExtraEffectType.TREASURE_PROGRESS) {
            originalValue = Math.floor(originalValue * (1 + effectNum));
        } else if (
            type == GameExtraEffectType.BUILDING_LVUP_TIME ||
            type == GameExtraEffectType.BUILDING_LVLUP_RESOURCE ||
            type == GameExtraEffectType.GATHER_TIME ||
            type == GameExtraEffectType.TROOP_GENERATE_TIME
        ) {
            originalValue = Math.max(1, Math.floor(originalValue * (1 - effectNum)));
        } else if (
            type == GameExtraEffectType.PIONEER_ONLY_VISION_RANGE ||
            type == GameExtraEffectType.CITY_AND_PIONEER_VISION_RANGE ||
            type == GameExtraEffectType.CITY_ONLY_VISION_RANGE
        ) {
            originalValue = originalValue + effectNum;
        }
        return originalValue;
    }

    private _slotIdToTempleConfigMap: Map<string, MapCityInfo> = new Map();
    public setSlotIdToTempleConfigData(slotId: string, data: MapCityInfo) {
        if (slotId == null || data == null) {
            return;
        }
        this._slotIdToTempleConfigMap.set(slotId, data);
    }
    public getMapSlotData(slotId: string) {
        return this._slotIdToTempleConfigMap.get(slotId);
    }
    // only use by get slot to templeconfig data
    public getMapBuildingConfigByExistSlotInfo(uniqueId: string) {
        const splits = uniqueId.split("|");
        const slotId = splits[0];
        const buildingId = splits[1];
        if (!this._slotIdToTempleConfigMap.has(slotId)) {
            return;
        }
        const data = this._slotIdToTempleConfigMap.get(slotId);
        if (!BigMapConfig.getBuildingConfigMap().has(data.templeConfigId)) {
            return;
        }
        const allBuildingConfigs = BigMapConfig.getBuildingConfigMap().get(data.templeConfigId);
        return allBuildingConfigs.find((item) => {
            return item.id == buildingId;
        });
    }
    public getMapPioneerConfigByExistSlotInfo(uniqueId: string) {
        const splits = uniqueId.split("|");
        const slotId = splits[0];
        const pioneerId = splits[1];
        if (!this._slotIdToTempleConfigMap.has(slotId)) {
            return;
        }
        const data = this._slotIdToTempleConfigMap.get(slotId);
        if (!BigMapConfig.getPioneerConfigMap().has(data.templeConfigId)) {
            return;
        }
        const allPioneerConfigs = BigMapConfig.getPioneerConfigMap().get(data.templeConfigId);
        return allPioneerConfigs.find((item) => {
            return item.id == pioneerId;
        });
    }

    public getMapBuildingSlotByUnqueId(uniqueId: string): string | null {
        const splits = uniqueId.split("|");
        if (splits.length == 2) {
            return splits[0];
        }
        return null;
    }

    // red point
    private _showRedPoint: boolean = true;
    public get showRedPoint(): boolean {
        return this._showRedPoint;
    }
    public set showRedPoint(value: boolean) {
        this._showRedPoint = value;
        localStorage.setItem("__redPointValue", this._showRedPoint.toString());
        NotificationMgr.triggerEvent(NotificationName.GAME_SETTING_REDPOINT_SHOW_CHANGED, this);
    }

    // NFT
    public checkHasNFTCanRed(): boolean {
        const allNFTs = DataMgr.s.nftPioneer.getAll();
        for (const element of allNFTs) {
            if (this._checkNFTCanLevelUp(element.uniqueId)) {
                return true;
            }
            if (this._checkNFTCanRankUp(element.uniqueId)) {
                return true;
            }
        }
        return false;
    }
    public checkNFTCanRedById(NFTId: string): boolean {
        if (this._checkNFTCanLevelUp(NFTId)) {
            return true;
        }
        if (this._checkNFTCanRankUp(NFTId)) {
            return true;
        }
        return false;
    }
    public checkNFTCanLevelUp(NFTId: string): boolean {
        return this._checkNFTCanLevelUp(NFTId);
    }
    public checkNFTCanRankUp(NFTId: string): boolean {
        return this._checkNFTCanRankUp(NFTId);
    }

    private _checkNFTCanLevelUp(NFTId: string): boolean {
        const NFT = DataMgr.s.nftPioneer.getNFTById(NFTId);
        if (NFT == undefined) {
            return false;
        }
        if (NFT.level >= NFT.levelLimit) {
            return false;
        }
        const nftLevelUpCost = PioneerLvlupConfig.getNFTLevelUpCost(NFT.level, NFT.level + 1);
        if (DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.NFTExp) < nftLevelUpCost) {
            return false;
        }
        return true;
    }
    private _checkNFTCanRankUp(NFTId: string): boolean {
        const NFT = DataMgr.s.nftPioneer.getNFTById(NFTId);
        if (NFT == undefined) {
            return false;
        }
        if (NFT.rank >= NFT.rankLimit) {
            return false;
        }
        const nftRankUpCostItems = PioneerLvlupConfig.getNFTRankUpCost(NFT.rarity, NFT.rank, NFT.rank + 1);
        for (const element of nftRankUpCostItems) {
            if (DataMgr.s.item.getObj_item_count(element.itemConfigId) < element.count) {
                return false;
            }
        }
        return true;
    }

    //#region nftIllustration begin
    public getIllustrationEffectValue(): number {
        const nftConfigs = NFTPioneerConfig.getAll();
        const ownedNft = DataMgr.s.pioneer.getAllSelfPlayers();
        let ownedNum: number = 0;
        for (const key in nftConfigs) {
            if (Object.prototype.hasOwnProperty.call(nftConfigs, key)) {
                const element = nftConfigs[key];
                let owned = false;
                for (const ownedElement of ownedNft) {
                    if (ownedElement.NFTInitLinkId == element.id) {
                        owned = true;
                        break;
                    }
                }
                if (owned) {
                    ownedNum += 1;
                }
            }
        }
        let value: number = 0;
        const handBookConfigs = NFTHandBookConfig.getAll();
        for (const key in handBookConfigs) {
            if (Object.prototype.hasOwnProperty.call(handBookConfigs, key)) {
                const element = handBookConfigs[key];
                if (ownedNum >= element.threshold) {
                    value = element.benefit / 100;
                }
            }
        }
        return value;
    }

    //#region nftIllustration end

    public constructor() {
        this._showRedPoint = true;
        const redPointValue = localStorage.getItem("__redPointValue");
        if (redPointValue != null && redPointValue == "false") {
            this._showRedPoint = false;
        }

        NotificationMgr.addListener(NotificationName.MAP_PIONEER_ENERGY_CHANGED, this._onPioneerEnergyChanged, this);
    }

    //-------------------------- notify
    private async _onPioneerEnergyChanged(data: { uniqueId: string }) {
        if (this._dispatchReplenishTroopAfterEnergyUnqueId != data.uniqueId) {
            return;
        }
        const pioneer = DataMgr.s.pioneer.getById(data.uniqueId);
        if (pioneer == null || pioneer.type != MapPioneerType.player) {
            return;
        }
        if (pioneer.hp > 0) {
            return;
        }
        const result = await UIPanelManger.inst.pushPanel(HUDName.ReplenishTroopsView, UIPanelLayerType.HUD);
        if (!result.success) {
            return;
        }
        result.node.getComponent(ReplenishTroopsView).configuration(data.uniqueId);
    }
}
