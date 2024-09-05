import { Node } from "cc";
import { MapMemberFactionType, ResourceData } from "./ConstDefine";
import { share } from "../Net/msg/WebsocketMsg";

export enum MapBuildingType {
    resource = 3,
    explore = 1,
    stronghold = 2,
    city = 0,
    event = 4,
    decorate = 5,
    wormhole = 6,
    tavern = 7,
}

export enum BuildingStayPosType {
    One = 0,
    Three = 1,
    Seven = 2,
}

export enum InnerBuildingType {
    MainCity = "30001",
    Barrack = "30002",
    House = "30003",
    EnergyStation = "30004",
    ArtifactStore = "30005",
    TrainingCenter = "30006",
    InformationStation = "30007",
}

export interface UserInnerBuildInfo {
    buildType: InnerBuildingType;
    buildLevel: number;
    upgradeBeginTimestamp: number;
    upgradeEndTimestamp: number;
    upgrading: boolean;

    troopStartTime: number;
    troopEndTime: number;
    troopNum: number;
    troopIng: boolean;
    pos: [number, number];

    tc: share.Ibuilding_tc_data;
}

export type InnerBuildingStaffLevelUpType = string;
export type InnerBuildingStaffLevel = number;
export type InnerBuildingStaffRate = number;
export interface ConfigInnerBuildingData {
    id: InnerBuildingType;
    name: string;
    anim: string;
    unlock: number;
    maxLevel: number;

    lvlup_progress: string;
    lvlup_exp: string;
    lvlup_cost: string;
    lvlup_time: string;
    prefab: string;
    desc: string;
    size: number;
    staff_effect: [InnerBuildingStaffLevelUpType, InnerBuildingStaffLevel, [InnerBuildingStaffRate]];
    staff_des: string;
}

export interface ConfigInnerBuildingLevelUpData {
    id: string;
    progress: number;
    exp: number;
    lvlup_time: number;

    cost_main: [number, number][];
    cost_barr: [number, number][];

    prefab_main: string;
    desc_main: string;

    prefab_barr: string;
    desc_barr: string;
    max_barr: number;
    time_barr: number;
    rec_cost_barr: [number, number][];

    prefab_house: string;
    desc_house: string;

    prefab_energy: string;
    info_y_energy: number;
    desc_energy: string;

    prefab_tower: string;
    desc_babel: string;
    max_lvlBuilding: number;

    prefab_ic: string;

    sight_range: number;

    prefab_barracks: string;
    desc_barracks: string;
    

    psyc_output: number;
    psyc_storage: number;
    psyc_convert: [number, number][];

    relic_max: number;

    troops: string;
    max_troops: number;
    max_pop: number;
}

export interface InnerBuildingPsycData {
    output: number;
    storage: number;
    convert: ResourceData[];
}

export enum InnerBuildingLatticeShowType {
    None,
    Error,
    Clean,
}
export interface InnerBuildingLatticeStruct {
    routerIndex: number;
    node: Node;
    isEmpty: boolean;
    showType: InnerBuildingLatticeShowType;
    stayBuilding: Node;
}
