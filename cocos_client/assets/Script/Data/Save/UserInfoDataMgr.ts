import NotificationMgr from "../../Basic/NotificationMgr";
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
    public finishRookie() {
        this._data.didFinishRookie = true;
    }
    public finishRookieStep() {
        if (this._data.rookieStep == RookieStep.FINISH) {
            return;
        }
        this._data.rookieStep += 1;
        NotificationMgr.triggerEvent(NotificationName.USERINFO_ROOKE_STEP_CHANGE);
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
        this._data.rookieStep = RookieStep.WAKE_UP;
        console.log("exce initover");
        this._initInterval();
    }
    private _initInterval() {}
    private _convertNetDataToObject(netData: share.Iplayer_sinfo): UserInfoObject {
        let step = null;
        if (this._data != null) {
            step = this._data.rookieStep;
        } 
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
            didFinishRookie: netData.didFinishRookie,
            rookieStep: step,
            // lost
            tavernGetPioneerTimestamp: 0,
            wormholeDefenderIds: new Map(),
        };
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
