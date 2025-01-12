import { Vec2, v2 } from "cc";
import { TileHexDirection, TilePos } from "../Game/TiledMap/TileTool";
import { AttrChangeType, GetPropData, MapMemberFactionType } from "./ConstDefine";
import { ItemConfigType } from "./Item";
import { share } from "../Net/msg/WebsocketMsg";
import PioneerConfig from "../Config/PioneerConfig";
import CommonTools from "../Tool/CommonTools";
import { Icombat_battle_reprot_item } from "./CombatBattleReportDefine";

export interface PioneerConfigData {
    id: string;
    name: string;
    type: string;
    friendly: number;
    show: number;
    des: string;
    level: number;
    nft_pioneer: string;
    hp: number;
    attack: number;
    def: number;
    winprogress: number;
    exp: number;
    animType: string;
    drop: [ItemConfigType, string, number][];
    pos: { x: number; y: number }[];
    logics: {
        type: number;
        posx: number;
        posy: number;
        step: number;
        cd: number;
        direction: number;
        repeat: number;
        interval: [number, number];
        range: number;
        speed: number;
    }[];
}

export enum MapPioneerActionType {
    dead = "dead",
    wakeup = "wakeup",
    idle = "idle",
    defend = "defend",
    exploring = "exploring",
    eventStarting = "eventStarting",
    addingtroops = "addingtroops",
    wormhole = "wormhole",

    inCity = "inCity",
    moving = "moving",
    mining = "mining",
    fighting = "fighting",
    eventing = "eventing",
    staying = "staying",
    maincityFighting = "maincityFighting",
    idleTasking = "idleTasking",
}

export enum MapPioneerType {
    player = "1",
    npc = "2",
    hred = "4",
    gangster = "3",
}

export enum MapPioneerLogicType {
    stepmove = 2,
    targetmove = 1,
    hide = 3,
    patrol = 4,
}

export enum MapPioneerMoveDirection {
    left = "left",
    right = "right",
    top = "top",
    bottom = "bottom",
}

export enum MapPioneerEventAttributesChangeType {
    HP = 1,
    ATTACK = 2,
}

export interface MapPioneerAttributesChangeModel {
    type: MapPioneerEventAttributesChangeType;
    method: AttrChangeType;
    value: number;
}

export interface MapPioneerLogicStepMoveData {
    step: number;
    cd: number;
    direction: TileHexDirection;
}

export interface MapPioneerLogicStepMoveObject extends MapPioneerLogicStepMoveData {}

export interface MapPioneerLogicPatrolData {
    originalPos: MapPosStruct;
    intervalRange: [number, number];
    range: number;
}

export interface MapPioneerLogicPatrolObject extends MapPioneerLogicPatrolData {
    originalPos: Vec2;
}

export interface MapPioneerLogicTargetMoveData {
    targetPos: MapPosStruct;
}

export interface MapPioneerLogicTargetMoveObject extends MapPioneerLogicTargetMoveData {
    targetPos: Vec2;
}

export interface MapPosStruct {
    x: number;
    y: number;
}

export interface MapPioneerLogicData {
    type: MapPioneerLogicType;
    currentCd: number;
    repeat: number;
    moveSpeed: number;

    stepMove?: MapPioneerLogicStepMoveData;
    patrol?: MapPioneerLogicPatrolData;
    targetMove?: MapPioneerLogicTargetMoveData;
}

export interface MapPioneerLogicObject extends MapPioneerLogicData {
    stepMove?: MapPioneerLogicStepMoveObject;
    patrol?: MapPioneerLogicPatrolObject;
    targetMove?: MapPioneerLogicTargetMoveObject;
}

export interface MapPioneerFightStuct {
    attackerId: string;
    defenderId: string;
    hp: number;
}

export interface MapPioneerData {
    uniqueId: string;
    id: string;
    show: boolean;
    level: number;
    faction: MapMemberFactionType;
    type: MapPioneerType;
    animType: string;
    name: string;
    stayPos: MapPosStruct;

    hpMax: number;
    hp: number;
    attack: number;
    defend: number;
    speed: number;
    energy: number;
    energyMax: number;

    movePaths: MapPosStruct[];

    actionType: MapPioneerActionType;
    actionBeginTimeStamp: number;
    actionEndTimeStamp: number;
    actionEndReturn: boolean;
    actionFightId?: string;

    logics: MapPioneerLogicData[];

    winProgress: number;
    winExp: number;
    drop: GetPropData[];

    moveDirection?: MapPioneerMoveDirection;

    actionBuildingId?: string;
    actionEventId?: string;

    fightData?: Icombat_battle_reprot_item[];
    fightResultWin?: boolean;

    rebornTime: number;
}

export interface MapPlayerPioneerData extends MapPioneerData {
    rebirthStartTime: number;
    rebirthEndTime: number;
    killerId: string;
    NFTId: string;
    troopId: string;
    needReturn?: boolean;
    NFTInitLinkId?: string;
}

export interface MapPioneerObject extends MapPioneerData {
    stayPos: Vec2;
    movePaths: (TilePos | Vec2)[];
    logics: MapPioneerLogicObject[];
}

export interface MapPlayerPioneerObject extends MapPlayerPioneerData {
    stayPos: Vec2;
    movePaths: (TilePos | Vec2)[];
    logics: MapPioneerLogicObject[];
}

export interface MapFightObject {
    uniqueId: string;
    id: string;
    name: string;
    animType: string;
    hp: number;
    hpmax: number;
}

export default class PioneerDefine {
    public static convertNetDataToObject(temple: share.Ipioneer_data): MapPioneerObject {
        const currentTime = new Date().getTime();
        const movePath: Vec2[] = [];
        if (temple.movePath != null) {
            for (const path of temple.movePath) {
                movePath.push(v2(path.x, path.y));
            }
        }
        let obj = {
            uniqueId: temple.uniqueId,
            id: temple.id,
            show: temple.show,
            level: temple.level,
            faction: temple.faction,
            type: temple.type as MapPioneerType,
            animType: temple.animType,
            name: temple.name,
            hp: temple.hp,
            hpMax: temple.hpMax,
            attack: temple.attack,
            defend: temple.defend,
            speed: temple.speed,
            energy: temple.energy,
            energyMax: temple.energyMax,
            stayPos: v2(temple.stayPos.x, temple.stayPos.y),
            movePaths: movePath,
            actionType: temple.actionType as MapPioneerActionType,
            actionBeginTimeStamp: currentTime,
            actionEndTimeStamp: currentTime + (temple.actionEndTimeStamp - temple.actionBeginTimeStamp) * 1000,
            actionEndReturn: temple.actionEndReturn,
            actionFightId: temple.actionFightId,
            logics: [],
            winProgress: temple.winProgress,
            winExp: temple.winExp,
            drop: [],
            fightData: temple.actionFightRes,
            fightResultWin: temple.actionFightWinner == 1,
            actionEventId: temple.actionEventId,
            actionBuildingId: temple.actionBuildingId,
            rebornTime: temple.rebornTime == null ? 0 : temple.rebornTime * 1000,
        };
        if (obj.type == MapPioneerType.player) {
            let playerObj: MapPlayerPioneerObject;
            playerObj = {
                ...obj,
                NFTId: temple.NFTId,
                rebirthStartTime: currentTime,
                rebirthEndTime: currentTime + (temple.rebirthEndTime - temple.rebirthStartTime) * 1000,
                killerId: temple.killerId,
                troopId: temple.troopId,
                NFTInitLinkId: temple.NFTInitLinkId,
            };
            return playerObj;
        } else {
            return obj;
        }
    }
}
