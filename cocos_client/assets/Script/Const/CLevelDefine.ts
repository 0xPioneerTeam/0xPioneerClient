import { GameExtraEffectType, ResourceData } from "./ConstDefine";

export interface CLevelConfigData {
    id: string;
    bigClass: number;
    smallClass: number;
    buffs: CLevelConfigBuffData[];
    rewards: ResourceData[];
    conditions: CLevelConfigConditionData[];
}

export interface CLevelConfigBuffData {
    type: GameExtraEffectType;
    title: string;
    value: number;
}

export interface CLevelConfigConditionData {
    type: number;
    title: string;
    subValue: number;
    value: number;
}
