import { Vec2 } from "cc";
import { BuildingStayPosType, MapBuildingType } from "./BuildingDefine";
import { MapMemberFactionType } from "./ConstDefine";
import { NFTPioneerObject } from "./NFTPioneerDefine";
import { MapPioneerObject } from "./PioneerDefine";

export interface MapBuildingConfigData {
    block: any;
    posmode: any;
    id: string;
    name: string;
    type: MapBuildingType;
    show: number;
    pos_type: number;
    positions: [number, number];
    node: string;
    level: number;
    progress: null;
    resources: [string, number];
    quota: null;
    origialQuota: null;
    exp: null;
    event: string;
    hp: number;
    attack: number;
    winprogress: number;
    faction: number;
    defendPioneerIds: string[];
    des: string;
    cost: number;
}

export interface StayMapPosition {
    x: number;
    y: number;
}

// building
export interface MapBuildingBaseData {
    id: string;
    name: string;
    type: MapBuildingType;
    level: number;
    show: boolean;
    faction: MapMemberFactionType;
    defendPioneerIds: string[];

    stayMapPositions: StayMapPosition[];
    stayPosType: BuildingStayPosType;
    progress: number;
    winprogress: number;

    eventId: string;
    eventIndex: number;
    eventSubId: string;
    eventPioneerIds: string[];
    eventPioneerDatas: Map<string, MapPioneerObject>;

    exp: number;
    animType: string;

    gatherPioneerIds: string[];
    quota: number;

    explorePioneerIds: string[];
    rebornTime: number;
}
export interface MapBuildingMainCityData extends MapBuildingBaseData {
    hpMax: number;
    hp: number;
    attack: number;
    taskObj: any;
}
export interface MapBuildingWormholeData extends MapBuildingBaseData {
    wormholdCountdownTime: number;
    attacker: Map<number, string>;
}
export interface MapBuildingTavernData extends MapBuildingBaseData {
    tavernCountdownTime: number;
    nft: NFTPioneerObject;
}

export type MapBuildingData = MapBuildingMainCityData | MapBuildingWormholeData | MapBuildingTavernData | MapBuildingBaseData;

export interface MapBuildingBaseObject extends MapBuildingBaseData {
    stayMapPositions: Vec2[];
}
export interface MapBuildingMainCityObject extends MapBuildingMainCityData {
    stayMapPositions: Vec2[];
}
export interface MapBuildingWormholeObject extends MapBuildingWormholeData {
    stayMapPositions: Vec2[];
}
export interface MapBuildingTavernObject extends MapBuildingTavernData {
    stayMapPositions: Vec2[];
}

export type MapBuildingObject =
    | MapBuildingMainCityObject
    | MapBuildingWormholeObject
    | MapBuildingTavernObject
    | MapBuildingBaseObject;

// decorate
export enum MapDecoratePosMode {
    Tiled = "tiled",
    World = "world",
}
export interface MapDecorateData {
    id: string;
    name: string;
    show: boolean;
    block: boolean;
    posMode: MapDecoratePosMode;
    stayMapPositions: StayMapPosition[];
}

export interface MapDecorateObject extends MapDecorateData {
    stayMapPositions: Vec2[];
}
