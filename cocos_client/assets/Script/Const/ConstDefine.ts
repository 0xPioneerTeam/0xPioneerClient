import { Color } from "cc";
import { ItemConfigType } from "./Item";

export const GAME_JUMP_SWITCH_IS_OPEN = true;
export const GAME_SKIP_ROOKIE = true;
export const GAME_ENV_IS_DEBUG = true;
export const PioneerGameTest = false;

export const TILEMAP_SIZE = 16;//tileMap layer size 16*16

export enum AttrType {
    HP = 0,
    ATTACK = 1,
}
export enum AttrChangeType {
    ADD = 1,
    MUL = 2,
}

export enum BackpackCategoryType {
    All = 0,
    Rellc = 1,
    Consumable = 2,
    Special = 3,
    Other = 4,
}

export enum BackpackArrangeType {
    Recently = "Recently",
    Rarity = "Rarity",
    Type = "Type"
}

export enum ResourceCorrespondingItem {
    Food = "8001",
    Wood = "8002",
    Stone = "8003",
    Troop = "8004",
    Energy = "8005",
    Gold = "8006",
    NFTExp = "8007",
}

export enum NPCNameLangType {
    Prophetess = "502001",
    DefaultPlayer = "502002",
    DoomsdayGangSpy = "502003",
    Hunter = "502004",
    SecretGuard = "502005",
    DoomsdayGangBigTeam = "502006",
    Artisan = "502007",
}

export enum GameExtraEffectType {
    CITY_ONLY_VISION_RANGE = -1,
    PIONEER_ONLY_VISION_RANGE = -2,
    CITY_AND_PIONEER_VISION_RANGE = -3,

    BUILDING_LVUP_TIME = 1, //
    BUILDING_LVLUP_RESOURCE = 2, //
    MOVE_SPEED = 3, //
    GATHER_TIME = 4, //
    ENERGY_GENERATE = 5, //
    TROOP_GENERATE_TIME = 6, //
    CITY_RADIAL_RANGE = 7,
    TREASURE_PROGRESS = 8,
    VISION_RANGE = 9,
}
export type GameSingleParamEffectType = [number];
export type GameDoubleParamEffectType = [number, number];

export const enum ECursorType {
    Common = 0,
    Action = 1,
    Error = 2,
}

export const enum ECursorStyle {
    url = "url",
    default = "default",
    auto = "auto",
    crosshair = "crosshair",
    pointer = "pointer",
    move = "move",
    e_resize = "e-resize",
    ne_resize = "ne-resize",
    nw_resize = "nw-resize",
    n_resize = "n-resize",
    se_resize = "se-resize",
    sw_resize = "sw-resize",
    s_resize = "s-resize",
    w_resize = "w-resize",
    text = "text",
    wait = "wait",
    help = "help",
}

export interface GetPropData {
    type: ItemConfigType;
    propId: string;
    num: number;
}

export interface ResourceData {
    type: ResourceCorrespondingItem;
    num: number;
}

export enum GetPropRankColor {
    RANK1 = "#40ffa3",
    RANK2 = "#409aff",
    RANK3 = "#dd40ff",
    RANK4 = "#ff9e40",
    RANK5 = "#ff4040",
}

export enum MapMemberFactionType {
    enemy = 0,
    friend = 1,
    neutral = 2,
}

export enum MapMemberTargetType {
    pioneer = 0,
    building = 1,
}

export const GameRankColor = [
    new Color().fromHEX(GetPropRankColor.RANK1),
    new Color().fromHEX(GetPropRankColor.RANK2),
    new Color().fromHEX(GetPropRankColor.RANK3),
    new Color().fromHEX(GetPropRankColor.RANK4),
    new Color().fromHEX(GetPropRankColor.RANK5),
];

export const GameRankNameLanId = ["105001", "105002", "105003", "105004", "105005"];

export enum MapInteractType {
    WmMatch,
    WmTeleport,
    WmMark,
    WmRecall,
    Move,
    Attack,
    Explore,
    Collect,
    Event,
    Camp,
    CampOut,
    Talk,
    Detect,
    SiegeCity
}
