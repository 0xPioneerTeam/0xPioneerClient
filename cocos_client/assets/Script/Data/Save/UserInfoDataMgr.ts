import NotificationMgr from "../../Basic/NotificationMgr";
import { GAME_SKIP_ROOKIE } from "../../Const/ConstDefine";
import { CLvlCondition, CLvlConditionType } from "../../Const/Lvlup";
import { NotificationName } from "../../Const/Notification";
import { RookieStep } from "../../Const/RookieDefine";
import { UserInfoObject } from "../../Const/UserInfoDefine";
import { share } from "../../Net/msg/WebsocketMsg";
import NetGlobalData from "./Data/NetGlobalData";

export default class UserInfoDataMgr {
    private _data: UserInfoObject = null;

    private _recruitRedPointKey: string = "__UserInfoDataMgrRecruitRedPoint_";
    private _exerciseRedPointKey: string = "__UserInfoDataMgrExerciseRedPoint_";
    public constructor() {}
    //--------------------------------
    public loadObj(walletAddr: string) {
        this._recruitRedPointKey += walletAddr;
        this._exerciseRedPointKey += walletAddr;
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

    public getRecruitRedPoint(): boolean {
        return localStorage.getItem(this._recruitRedPointKey) == "true" ? true : false;
    }
    public getExerciseRedPoint(): boolean {
        return localStorage.getItem(this._exerciseRedPointKey) == "true" ? true : false;
    }
    
    public changeRecruitRedPoint(show: boolean) {
        localStorage.setItem(this._recruitRedPointKey, show ? "true" : "false");
        NotificationMgr.triggerEvent(NotificationName.INNER_BUILDING_RECRUIT_REDPOINT_CHANGED);
    }
    public changeExerciseRedPoint(show: boolean) {
        localStorage.setItem(this._exerciseRedPointKey, show ? "true" : "false");
        NotificationMgr.triggerEvent(NotificationName.INNER_BUILDING_TRAIN_REDPOINT_CHANGED);
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
            explorePlayerids: netData.explorePlayerids,
            battlePower: netData.battlePower,
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

            //CLvl
            CLvlRewardGetMap: new Map(),
            CLvlCondtion: [],

            buyEnergyLimitTimes: netData.buyEnergyLimitTimes,

            wormholeTags: [],
            wormholeMatchTimes: netData.wormholeMatchTimes,
            wormholeTeleportTimes: netData.wormholeTeleportTimes,
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
        if (netData.lvlRewards != null) {
            for (const key in netData.lvlRewards) {
                newObj.CLvlRewardGetMap.set(parseInt(key), netData.lvlRewards[key]);
            }
        }
        if (netData.lvlupConds != null) {
            for (const key in netData.lvlupConds) {
                let type: CLvlConditionType = null;
                const params = key.split("_");
                if (params.length == 2) {
                    type = parseInt(params[0]);
                } else if (params.length == 1) {
                    type = parseInt(params[0]);
                }
                if (type == null) {
                    continue;
                }
                const temp: CLvlCondition = {
                    type: type,
                    title: "",
                    value: netData.lvlupConds[key],
                };
                if (params.length == 2) {
                    if (temp.type == CLvlConditionType.CollectSpecificLevelResourceToSpecificTimes) {
                        temp.collect = {
                            level: parseInt(params[1]),
                            times: 0
                        };
                    } else if (temp.type == CLvlConditionType.ExploreSpecificLevelEventToSpecificTimes) {
                        temp.explore = {
                            level: parseInt(params[1]),
                            times: 0
                        }
                    } else if (temp.type == CLvlConditionType.GetSpecificRankPioneerToSpecificNum) {
                        temp.getRankPioneer = {
                            rank: parseInt(params[1]),
                            num: 0
                        }
                    } else if (temp.type == CLvlConditionType.GetSpecificLevelPioneerToSpecificNum) {
                        temp.getLevelPioneer = {
                            level: parseInt(params[1]),
                            num: 0
                        }
                    } else if (temp.type == CLvlConditionType.CostSpecificResourceToSpecificNum) {
                        temp.cost = {
                            itemId: params[1],
                            num: 0
                        };
                    } else if (temp.type == CLvlConditionType.KillSpecificMonsterToSpecificNum) {
                        temp.kill = {
                            level: parseInt(params[1]),
                            num: 0,
                        }
                    }
                }
                newObj.CLvlCondtion.push(temp);
            }
        }
        if (netData.wormholeTags != null) {
            for (const key in netData.wormholeTags) {
                const temple = netData.wormholeTags[key];
                newObj.wormholeTags.push({
                    playerId: temple.playerId.toString(),
                    playerName: temple.playerName,
                    tpBuildingId: temple.tpBuildingId
                });
            }
        }
        return newObj;
    }
}
