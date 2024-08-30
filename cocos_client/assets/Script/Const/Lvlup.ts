import { GetPropData } from "./ConstDefine";
import { ItemConfigType } from "./Item";

export enum CLvlConditionType {
    InnerBuildingLevelUpToSpecificLevel = 1,
    CollectSpecificLevelResourceToSpecificTimes = 2,
    ExploreSpecificLevelEventToSpecificTimes = 3,
    GetSpecificRankPioneerToSpecificNum = 4,
    GetSpecificLevelPioneerToSpecificNum = 5,
    CostSpecificResourceToSpecificNum = 6,
    KillSpecificMonsterToSpecificNum = 7,
    HeatToSpecificLevel = 8,
    WinOtherPlayerToSpecificTimes = 9,
}

export enum CLvlEffectType {
    WORLDBOXRANK = 1,
    MOVE_SPEED = 2,
    GATHER_SPEED = 3,
    CITY_AND_PIONEER_VISION_RANGE = 4,
    TROOP_GENERATE_SPEED = 5,
}

export interface CLvlCondition {
    type: CLvlConditionType;
    title: string;
    value: number;

    innerBuildingCLvl?: CLvlInnerBuildingCLvlCondition;
    collect?: CLvlCollectCondition;
    explore?: CLvlExploreCondition;
    getRankPioneer?: CLvlGetRankPioneerCondition;
    getLevelPioneer?: CLvlGetLevelPioneerCondition;
    cost?: CLvlCostCondition;
    kill?: CLvlKillCondition;
    heat?: CLvlHeatCondition;
    win?: CLvlWinCondition;
}

export interface CLvlEffect {
    type: CLvlEffectType;
    value: number;
    title: string;
}


export interface CLvlInnerBuildingCLvlCondition {
    buildingId: string;
    level: number;
}
export interface CLvlCollectCondition {
    level: number;
    times: number;
}
export interface CLvlExploreCondition {
    level: number;
    times: number;
}
export interface CLvlGetRankPioneerCondition {
    rank: number;
    num: number;
}
export interface CLvlGetLevelPioneerCondition {
    level: number;
    num: number;
}
export interface CLvlCostCondition {
    itemId: string;
    num: number;
}
export interface CLvlKillCondition {
    level: number;
    num: number;
}
export interface CLvlHeatCondition {
    level: number;
}
export interface CLvlWinCondition {
    times: number;
}



export interface LvlupConfigData {
    id: string;
    age: number;
    level: number;
    name: string;
    exp: number;
    extra_res: number;
    hp_max: number;
    city_vision: number;
    city_feature: number;
    event_building: string[] | null;
    reward: [ItemConfigType, string, number][] | null;
    condition: any[];
    civil_effect: any[];
    psyc_limit: number;
}

export interface CLvlModel {
    id: string;
    age: number;
    level: number;
    name: string;
    condition: CLvlCondition[];
    effect: CLvlEffect[];
    rewards: GetPropData[];
}
