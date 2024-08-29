export default class Config {
    public static canSaveLocalData: boolean = true;
}

export enum ConfigType {
    MapScaleMaxAndMin = "10001",
    LoginWhiteList = "10002",
    OneStepCostEnergy = "10004",
    MainCityEnergyTipThreshold = "10005",

    BuyEnergyLimit = "10010",
    BuyEnergyPrice = "10011",
    BuyEnergyThres = "10012",
    BuyEnergyCoefficient = "10013",

    BattleReportMaxKeepDays = "110000",
    BattleReportMaxKeepRecords = "110002",

    NFTRaritySkillInitNum = "210001",
    NFTRaritySkillLimitNum = "210002",
    NFTLevelInitLimitNum = "210003",
    NFTLevelLimitPerRankAddNum = "210004",
    NFTRankLimitNum = "210005",

    WorldMapOtherExtraRadialRange = "310001",

    WorldBoxThreshold = "410001",
    WorldBoxInitialPoint = "410002",

    WorldTreasureChancePerBoxExploreProgress = "410004",
    WorldTreasureChanceLimitHeatValueCoefficient = "410006",
    WorldTreasureBoxRarity = "410007",
    WorldTreasureBoxRarityShowName = "410011",

    PSYCToHeatCoefficient = "410005",

    BoxNumByHeat = "410008",
    ExploreForOneBox = "410009",

    MapDifficultCoefficient = "40001",

    WormholeMatchConsume = "420004",
    WormholeTeleportConsume = "420005",

    PiotToHeatCoefficient = "430002",

    SelectFromThreeGetAllCostCoefficient = "10008",

    PerNumSelectBox = "10009",

    InitMaxTroopNum = "500002",
}

export interface ConfigData {
    type: ConfigType;
}

export interface MapScaleParam extends ConfigData {
    scaleMax: number;
    scaleMin: number;
}

export interface LoginWhiteListParam extends ConfigData {
    whiteList: string[];
}

export interface OneStepCostEnergyParam extends ConfigData {
    cost: number;
}

export interface EnergyTipThresholdParam extends ConfigData {
    threshold: number;
}

export interface BattleReportMaxKeepDaysParam extends ConfigData {
    maxKeepDays: number;
}

export interface BattleReportMaxKeepRecordsParam extends ConfigData {
    maxKeepRecords: number;
}

export interface NFTRaritySkillInitNumParam extends ConfigData {
    initNumMap: Map<number, number>;
}

export interface NFTRaritySkillLimitNumParam extends ConfigData {
    limitNumMap: Map<number, number>;
}
export interface NFTLevelInitLimitNumParam extends ConfigData {
    limit: number;
}
export interface NFTLevelLimitPerRankAddNumParam extends ConfigData {
    value: number;
}
export interface NFTRankLimitNumParam extends ConfigData {
    limit: number;
}
export interface WorldBoxThresholdParam extends ConfigData {
    thresholds: number[];
}
export interface WorldBoxInitialPointParam extends ConfigData {
    initialPoint: number;
}

export interface WorldMapOtherExtraRadialRangeParam extends ConfigData {
    extraRadialRange: number;
}

export interface WorldTreasureChancePerBoxExploreProgressParam extends ConfigData {
    progress: number;
}

export interface WorldTreasureChanceLimitHeatValueCoefficientParam extends ConfigData {
    coefficient: number;
}

export interface WorldTreasureBoxRarityParam extends ConfigData {
    rarityNeedCLvDatas: number[];
}
export interface WorldTreasureBoxRarityShowNameParam extends ConfigData {
    showNames: string[];
}

export interface PSYCToHeatCoefficientParam extends ConfigData {
    coefficient: number;
}

export interface BoxNumByHeatParam extends ConfigData {
    thresholds: number[];
}
export interface ExploreForOneBoxParam extends ConfigData {
    value: number;
}

export interface MapDifficultCoefficientParam extends ConfigData {
    coefficient: number;
}

export interface PiotToHeatCoefficientParam extends ConfigData {
    coefficient: number;
}

export interface SelectFromThreeGetAllCostCoefficientParam extends ConfigData {
    coefficient: number;
}

export interface PerNumSelectBoxParam extends ConfigData {
    value: number;
}

export interface BuyEnergyLimitParam extends ConfigData {
    limit: number;
}

export interface BuyEnergyPriceParam extends ConfigData {
    prices: number[];
}

export interface BuyEnergyThresParam extends ConfigData {
    thresholds: number;
}

export interface BuyEnergyCoefficientParam extends ConfigData {
    coefficient: number;
}

export interface WormholeMatchConsumeParam extends ConfigData {
    consumes: [number, string, number][];
}
export interface WormholeTeleportConsumeParam extends ConfigData {
    consumes: [number, string, number][];
}
export interface InitMaxTroopNumParam extends ConfigData {
    num: number;
}
