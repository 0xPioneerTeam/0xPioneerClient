import { Vec2, v2 } from "cc";
import { TileHexDirection, TilePos } from "../Game/TiledMap/TileTool";
import { AttrChangeType, GetPropData, MapMemberFactionType } from "./ConstDefine";
import { ItemConfigType } from "./Item";
import { share } from "../Net/msg/WebsocketMsg";
import PioneerConfig from "../Config/PioneerConfig";
import CommonTools from "../Tool/CommonTools";

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

    logics: MapPioneerLogicData[];

    winProgress: number;
    winExp: number;
    drop: GetPropData[];

    moveDirection?: MapPioneerMoveDirection;

    actionBuildingId?: string;
    actionEventId?: string;

    fightData?: share.Ifight_res[];
    fightResultWin?: boolean;

    rebornTime: number;
}

export interface MapPlayerPioneerData extends MapPioneerData {
    rebirthStartTime: number;
    rebirthEndTime: number;
    killerId: string;
    NFTId: string;
}

export interface MapNpcPioneerData extends MapPioneerData {
    talkId: string;
}

export interface MapPioneerObject extends MapPioneerData {
    stayPos: Vec2;
    movePaths: TilePos[];
    logics: MapPioneerLogicObject[];
}

export interface MapPlayerPioneerObject extends MapPlayerPioneerData {
    stayPos: Vec2;
    movePaths: TilePos[];
    logics: MapPioneerLogicObject[];
}

export interface MapNpcPioneerObject extends MapNpcPioneerData {
    stayPos: Vec2;
    movePaths: TilePos[];
    logics: MapPioneerLogicObject[];
}

export interface FIGHT_FINISHED_DATA {
    attacker: {
        id: string;
        name: string;
        hp: number;
        hpMax: number;
    };
    defender: {
        id: string;
        name: string;
        hp: number;
        hpMax: number;
    };
    attackerIsSelf: boolean;
    buildingId: string;
    position: Vec2;
    isWin: boolean;
    rewards: [];
    isWormhole: boolean;
}
export interface MINING_FINISHED_DATA {
    buildingId: string;
    pioneerId: string;
    duration: number;
    rewards: any[];
}

export default class PioneerDefine {
    public static convertNetDataToObject(temple: share.Ipioneer_data): MapPioneerObject {
        const config = PioneerConfig.getById(temple.id);
        if (config == null) {
            return null;
        }
        const currentTime = new Date().getTime();
        let obj = {
            id: temple.id,
            show: temple.show,
            level: temple.level,
            faction: temple.faction,
            type: temple.type as MapPioneerType,
            animType: config.animType,
            name: config.name,
            hp: CommonTools.getOneDecimalNum(temple.hp),
            hpMax: CommonTools.getOneDecimalNum(temple.hpMax),
            attack: CommonTools.getOneDecimalNum(temple.attack),
            defend: CommonTools.getOneDecimalNum(temple.defend),
            speed: CommonTools.getOneDecimalNum(temple.speed),
            energy: temple.energy,
            energyMax: temple.energyMax,
            stayPos: v2(temple.stayPos.x, temple.stayPos.y),
            movePaths: [],
            actionType: temple.actionType as MapPioneerActionType,
            actionBeginTimeStamp: currentTime,
            actionEndTimeStamp: currentTime + (temple.actionEndTimeStamp - temple.actionBeginTimeStamp) * 1000,
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
            };
            return playerObj;
        } else if (obj.type == MapPioneerType.npc) {
            let npcObj: MapNpcPioneerObject;
            npcObj = {
                ...obj,
                talkId: temple.talkId,
            };
            return npcObj;
        } else {
            return obj;
        }
    }
}
