import { InnerBuildingType } from "./BuildingDefine";
import { GameExtraEffectType, GameSingleParamEffectType, GameDoubleParamEffectType } from "./ConstDefine";

export interface NFTPioneerConfigData {
    id: string;
    name: string[][];
    quality: number;
    property: number[][];
    growth: number[][];
    skill: string[];
}

export interface NFTPioneerNameConfigData {
    id: string;
    name: string;
}

export interface NFTPioneerSkillConfigData {
    id: string;
    name: string;
    rank: number;
    effect: string[];
    icon: string;
}
export interface NFTPioneerSkillEffectConfigData {
    id: string;
    type: GameExtraEffectType;
    para: GameSingleParamEffectType | GameDoubleParamEffectType;
    des: string;
}

export interface NFTPioneerSkil {
    id: string;
    isOriginal: boolean;
}

export interface NFTPioneerObject {
    uniqueId: string;
    rarity: number;
    name: string;
    skin: string;

    attack: number;
    defense: number;
    hp: number;
    speed: number;
    iq: number;
    level: number;
    levelLimit: number;
    rank: number;
    rankLimit: number;

    attackGrowValue: number;
    defenseGrowValue: number;
    hpGrowValue: number;
    speedGrowValue: number;
    iqGrowValue: number;
    skills: NFTPioneerSkil[];

    workingBuildingId: InnerBuildingType;

    addTimeStamp: number;
}
