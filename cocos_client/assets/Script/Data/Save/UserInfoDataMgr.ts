import NotificationMgr from "../../Basic/NotificationMgr";
import { GAME_SKIP_ROOKIE } from "../../Const/ConstDefine";
import { NotificationName } from "../../Const/Notification";
import { RookieStep } from "../../Const/RookieDefine";
import { UserInfoObject } from "../../Const/UserInfoDefine";
import { share } from "../../Net/msg/WebsocketMsg";
import NetGlobalData from "./Data/NetGlobalData";

export default class UserInfoDataMgr {
    private _data: UserInfoObject = null;
    public constructor() {}
    //--------------------------------
    public loadObj() {
        this._initData();
    }
    //--------------------------------
    public get data() {
        return this._data;
    }
    //--------------------------------
    public replaceData(netData: share.Iplayer_sinfo) {
        this._data = this._convertNetDataToObject(netData);
    }
    public getExplorationReward(boxId: string) {
        this._data.treasureDidGetRewards.push(boxId);
    }
    public getPointExplorationReward(boxId: string) {
        this._data.pointTreasureDidGetRewards.push(boxId);
    }
    public changePlayerName(name: string) {
        this._data.name = name;
        NotificationMgr.triggerEvent(NotificationName.USERINFO_DID_CHANGE_NAME);
    }
    //------------------------------------------------------------------------
    private async _initData() {
        if (NetGlobalData.userInfo == null) {
            return;
        }
        const globalData: share.Iplayer_sinfo = NetGlobalData.userInfo;
        this._data = this._convertNetDataToObject(globalData);
        this._initInterval();
    }
    private _initInterval() {}
    private _convertNetDataToObject(netData: share.Iplayer_sinfo): UserInfoObject {
        const newObj: UserInfoObject = {
            id: netData.playerid.toString(),
            name: netData.pname,
            level: netData.level,
            exp: netData.exp,
            exploreProgress: netData.treasureProgress,
            treasureDidGetRewards: netData.treasureDidGetRewards,
            pointTreasureDidGetRewards: netData.pointTreasureDidGetRewards,
            heatValue: {
                getTimestamp: netData.heatValue.getTimestamp,
                currentHeatValue: netData.heatValue.currentHeatValue,
                lotteryTimes: netData.heatValue.lotteryTimes,
                lotteryProcessLimit: netData.heatValue.lotteryProcessLimit,
                lotteryTimesLimit: netData.heatValue.lotteryTimesLimit,
            },
            energyDidGetTimes: netData.currFetchTimes,
            energyGetLimitTimes: netData.limitFetchTimes,
            cityRadialRange: netData.cityRadialRange,
            rookieStep: netData.rookieStep,
            // lost
            tavernGetPioneerTimestamp: 0,
            wormholeDefenderIds: new Map(),
            boxes: netData.boxes,
            talkIds: netData.talkIds,

            boxRefreshTimestamp: netData.boxRefreshTs * 1000,
        };
        if (GAME_SKIP_ROOKIE) {
            newObj.rookieStep = RookieStep.FINISH;
            NotificationMgr.triggerEvent(NotificationName.USERINFO_ROOKE_STEP_CHANGE);
        }
        let step = null;
        if (this._data != null && this._data.rookieStep != null) {
            step = this._data.rookieStep;
        }
        if (step != null) {
            // protect step
            if (
                newObj.rookieStep == RookieStep.NPC_TALK_3 ||
                newObj.rookieStep == RookieStep.NPC_TALK_4 ||
                newObj.rookieStep == RookieStep.NPC_TALK_5 ||
                newObj.rookieStep == RookieStep.NPC_TALK_7 ||
                newObj.rookieStep == RookieStep.SYSTEM_TALK_21 ||
                newObj.rookieStep < step
            ) {
                newObj.rookieStep = step;
            }
        }
        if (netData.defender != null) {
            for (const key in netData.defender) {
                if (netData.defender[key] == null || netData.defender[key] == "") {
                    continue;
                }
                newObj.wormholeDefenderIds.set(parseInt(key), netData.defender[key]);
            }
        }
        return newObj;
    }
}
