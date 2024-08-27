import { share } from "../Net/msg/WebsocketMsg";
import { InnerBuildingType, UserInnerBuildInfo } from "./BuildingDefine";
import { CLvlCondition, CLvlConditionType } from "./Lvlup";
import { RookieStep, RookieStepState } from "./RookieDefine";

export interface ResourceModel {
    id: string;
    num: number;
}

export interface GenerateTroopInfo {
    countTime: number;
    troopNum: number;
}

export interface HeatValueObject {
    getTimestamp: number;
    currentHeatValue: number;
    // get times
    lotteryTimes: number;
    // can get limit
    lotteryProcessLimit: number;

    // can get limit limit
    lotteryTimesLimit: number;
}

export interface WormholeTagObject {
    playerId: string;
    playerName: string;
    tpBuildingId: string;
}

export interface UserInfoObject {
    id: string;
    name: string;
    battlePower: number;
    explorePlayerids: number[];
    level: number;
    exp: number;
    exploreProgress: number;
    heatValue: HeatValueObject;

    tavernGetPioneerTimestamp: number;
    treasureDidGetRewards: string[];
    pointTreasureDidGetRewards: string[];

    cityRadialRange: number;

    rookieStep: RookieStep;

    rookieState:RookieStepState;

    energyDidGetTimes: number;
    energyGetLimitTimes: number;

    wormholeDefenderIds: Map<number, string>;

    boxes: share.box_data[];

    talkIds: string[];

    boxRefreshTimestamp: number;

    CLvlRewardGetMap: Map<number, boolean>;
    CLvlCondtion: CLvlCondition[];

    buyEnergyLimitTimes: number;

    wormholeTags: WormholeTagObject[];
    wormholeMatchTimes: number;
    wormholeTeleportTimes: number;
}
