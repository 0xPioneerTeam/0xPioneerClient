import { InnerBuildingType } from "./BuildingDefine";
import { GameExtraEffectType, GameSingleParamEffectType, GameDoubleParamEffectType } from "./ConstDefine";

export interface NFTPioneerConfigData {
    id: string;
    name: string[][];
    quality: number;
    property: number[][];
    growth: number[][];
    skill: string[];
    skin: string;
}

export interface NFTPioneerNameConfigData {
    id: string;
    name: string;
}

export interface NFTPioneerSkillConfigData {
    id: string;
    name: string;
    describe: string;
    rank: number;
    type:number;
    effect: string[];
    icon: string;
}
export interface NFTPioneerSkillEffectConfigData {
    id: string;
    type: GameExtraEffectType;
    skilltriggertype: number;
    triggercondition: number[]|null;
    eff_target: number;
    para: GameSingleParamEffectType | GameDoubleParamEffectType;
    add: number[];
    imperviousrounds: number|null;
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

export interface NFTHandBookConfigData {
    id: string;
    threshold: number;
    benefit: number;
}

export interface NFTIllustrationItemObject {
    id: string;
    name: string;
    skin: string;
    owned: boolean;
}
export interface NFTIllustrationBuffItemObject {
    needNum: number;
    benefit: number;
    effect: boolean;
}
