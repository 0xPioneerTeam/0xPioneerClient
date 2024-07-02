import ConfigConfig from "../Config/ConfigConfig";
import InnerBuildingConfig from "../Config/InnerBuildingConfig";
import ItemConfig from "../Config/ItemConfig";
import LvlupConfig from "../Config/LvlupConfig";
import { InnerBuildingType } from "../Const/BuildingDefine";
import { ConfigType, WorldTreasureBoxRarityParam, WorldTreasureBoxRarityShowNameParam } from "../Const/Config";
import { GameRankNameLanId, GetPropData } from "../Const/ConstDefine";
import { CLvlCondition, CLvlConditionType, CLvlEffect, CLvlEffectType, CLvlModel } from "../Const/Lvlup";
import { DataMgr } from "../Data/DataMgr";
import { LanMgr } from "../Utils/Global";

export default class CLvlMgr {
    private _data: CLvlModel[] = [];
    public getData(): CLvlModel[] {
        if (this._data.length > 0) {
            return this._data;
        }
        this._data = [];
        const configData = LvlupConfig.getAll();
        for (const data of configData) {
            if (data.age == null || data.level == null) {
                continue;
            }
            const clvl: CLvlModel = {
                id: data.id,
                age: data.age,
                level: data.level,
                name: data.name,
                condition: [],
                effect: [],
                rewards: [],
            };
            // condition
            if (data.condition != null && data.condition.length > 0) {
                const colorBegin: string = "<color=#F3E4B1>";
                const colorEnd: string = "</color>";
                for (let j = 0; j < data.condition.length; j++) {
                    const temp = data.condition[j];
                    const condition: CLvlCondition = {
                        type: temp[0],
                        title: "",
                        value: 0,
                    };
                    if (condition.type == CLvlConditionType.InnerBuildingLevelUpToSpecificLevel) {
                        // condition
                        condition.innerBuildingCLvl = {
                            buildingId: temp[1],
                            level: temp[2],
                        };
                        condition.value = temp[2];
                        // title
                        const buildingName = InnerBuildingConfig.getByBuildingType(condition.innerBuildingCLvl.buildingId as InnerBuildingType).name;
                        condition.title = LanMgr.replaceLanById("810001", [
                            colorBegin + LanMgr.getLanById(buildingName) + colorEnd,
                            colorBegin + condition.value + colorEnd,
                        ]);
                    } else if (condition.type == CLvlConditionType.CollectSpecificLevelResourceToSpecificTimes) {
                        condition.collect = {
                            level: temp[1],
                            times: temp[2],
                        };
                        condition.value = temp[2];
                        condition.title = LanMgr.replaceLanById("810002", [
                            colorBegin + condition.collect.level + colorEnd,
                            colorBegin + condition.value + colorEnd,
                        ]);
                    } else if (condition.type == CLvlConditionType.ExploreSpecificLevelEventToSpecificTimes) {
                        condition.explore = {
                            level: temp[1],
                            times: temp[2],
                        };
                        condition.value = temp[2];
                        condition.title = LanMgr.replaceLanById("810003", [
                            colorBegin + condition.explore.level + colorEnd,
                            colorBegin + condition.value + colorEnd,
                        ]);
                    } else if (condition.type == CLvlConditionType.GetSpecificRankPioneerToSpecificNum) {
                        condition.getRankPioneer = {
                            rank: temp[1],
                            num: temp[2],
                        };
                        condition.value = temp[2];
                        condition.title = LanMgr.replaceLanById("810004", [
                            colorBegin + condition.value + colorEnd,
                            colorBegin + LanMgr.getLanById(GameRankNameLanId[condition.getRankPioneer.rank - 1]) + colorEnd,
                        ]);
                    } else if (condition.type == CLvlConditionType.GetSpecificLevelPioneerToSpecificNum) {
                        condition.getLevelPioneer = {
                            level: temp[1],
                            num: temp[2],
                        };
                        condition.value = temp[2];
                        condition.title = LanMgr.replaceLanById("810005", [
                            colorBegin + condition.value + colorEnd,
                            colorBegin + condition.getLevelPioneer.level + colorEnd,
                        ]);
                    } else if (condition.type == CLvlConditionType.CostSpecificResourceToSpecificNum) {
                        condition.cost = {
                            itemId: temp[1],
                            num: temp[2],
                        };
                        condition.value = temp[2];

                        const itemConfig = ItemConfig.getById(condition.cost.itemId);
                        condition.title = LanMgr.replaceLanById("810006", [
                            colorBegin + condition.value + colorEnd,
                            colorBegin + LanMgr.getLanById(itemConfig?.itemName) + colorEnd,
                        ]);
                    } else if (condition.type == CLvlConditionType.KillSpecificMonsterToSpecificNum) {
                        condition.kill = {
                            level: temp[1],
                            num: temp[2],
                        };
                        condition.value = temp[2];
                        condition.title = LanMgr.replaceLanById("810007", [
                            colorBegin + condition.kill.level + colorEnd,
                            colorBegin + condition.value + colorEnd,
                        ]);
                    } else if (condition.type == CLvlConditionType.HeatToSpecificLevel) {
                        condition.heat = {
                            level: temp[1],
                        };
                        condition.value = temp[1];
                        condition.title = LanMgr.replaceLanById("810008", [colorBegin + condition.value + colorEnd]);
                    } else if (condition.type == CLvlConditionType.WinOtherPlayerToSpecificTimes) {
                        condition.win = {
                            times: temp[1],
                        };
                        condition.value = temp[1];
                        condition.title = LanMgr.replaceLanById("810009", [colorBegin + condition.value + colorEnd]);
                    }

                    clvl.condition.push(condition);
                }
            }

            //effect
            if (data.civil_effect != null && data.civil_effect.length > 0) {
                for (let j = 0; j < data.civil_effect.length; j++) {
                    const temp = data.civil_effect[j];
                    const effect: CLvlEffect = {
                        type: temp[0],
                        value: 0,
                        title: "",
                    };
                    if (effect.type == CLvlEffectType.WORLDBOXRANK) {
                        effect.title = LanMgr.getLanById("820001");
                        effect.value = temp[1];
                    } else if (effect.type == CLvlEffectType.MOVE_SPEED) {
                        effect.title = LanMgr.getLanById("820002");
                        effect.value = (temp[1] - 100) / 100;
                    } else if (effect.type == CLvlEffectType.GATHER_SPEED) {
                        effect.title = LanMgr.getLanById("820003");
                        effect.value = (temp[1] - 100) / 100;
                    } else if (effect.type == CLvlEffectType.CITY_AND_PIONEER_VISION_RANGE) {
                        effect.title = LanMgr.getLanById("820004");
                        effect.value = temp[1];
                    } else if (effect.type == CLvlEffectType.TROOP_GENERATE_SPEED) {
                        effect.title = LanMgr.getLanById("820005");
                        effect.value = (temp[1] - 100) / 100;
                    }
                    clvl.effect.push(effect);
                }
            }

            // reward
            if (data.reward != null && data.reward.length > 0) {
                for (let j = 0; j < data.reward.length; j++) {
                    const temp = data.reward[j];
                    const reward: GetPropData = {
                        type: temp[0],
                        propId: temp[1],
                        num: temp[2],
                    };
                    clvl.rewards.push(reward);
                }
            }
            this._data.push(clvl);
        }

        return this._data;
    }

    public getCurCLvlEffect(): Map<CLvlEffectType, CLvlEffect> {
        const effectMap: Map<CLvlEffectType, CLvlEffect> = new Map();
        for (const data of this._data) {
            if (parseInt(data.id) > DataMgr.s.userInfo.data.level) {
                break;
            }
            for (const effect of data.effect) {
                if (effectMap.has(effect.type)) {
                    const temp = effectMap.get(effect.type);
                    if (effect.type == CLvlEffectType.WORLDBOXRANK) {
                        temp.value = Math.max(temp.value, effect.value);
                    } else {
                        temp.value += effect.value;
                    }
                } else {
                    effectMap.set(effect.type, { type: effect.type, value: effect.value, title: effect.title });
                }
            }
        }
        return effectMap;
    }
}
