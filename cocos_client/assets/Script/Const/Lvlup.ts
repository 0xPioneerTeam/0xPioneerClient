import { ItemConfigType } from "./Item";

export type LvlupConfigItemId = string;
export type LvlupConfigItemCount = number;

export type LvlupConfigConditionParam1 = number;
export type LvlupConfigConditionParam2 = number;

export enum LvlupConditionType {
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

export enum LvlupEffectType {
    WORLDBOXRANK = 1,
    MOVE_SPEED = 2,
    GATHER_SPEED = 3,
    CITY_AND_PIONEER_VISION_RANGE = 4,
    TROOP_GENERATE_SPEED = 5,
}

export interface LvlupConfigData {
    id: string;
    exp: number;
    city_feature: number;
    event_building: string[] | null;
    reward: [ItemConfigType, string, number][] | null;
    condition: [LvlupConditionType, LvlupConfigConditionParam1, LvlupConfigConditionParam2][] | [LvlupConditionType, LvlupConfigConditionParam1][];
    civil_effect: [LvlupEffectType, number];

    psyc_limit: number;
    p_exp: number;
    p_rank_1: [LvlupConfigItemId, LvlupConfigItemCount][];
    p_rank_2: [LvlupConfigItemId, LvlupConfigItemCount][];
    p_rank_3: [LvlupConfigItemId, LvlupConfigItemCount][];
    p_rank_4: [LvlupConfigItemId, LvlupConfigItemCount][];
    p_rank_5: [LvlupConfigItemId, LvlupConfigItemCount][];
}
