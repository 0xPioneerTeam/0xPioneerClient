import { _decorator, Button, Component, instantiate, Label, Layout, Node, ScrollView, Sprite } from "cc";
import ViewController from "../../BasicView/ViewController";
import { rank_data, rank_reward_config, rank_season_type, rank_type } from "../../Const/rank_define";
import { ConfigType, DailyRankingEnabledParam, MonthlyRankingEnabledParam, SeasonRankingDurationParam, SeasonRankingEnabledParam } from "../../Const/Config";
import ConfigConfig from "../../Config/ConfigConfig";
import RankRewardConfig from "../../Config/RankRewardConfig";
import { NetworkMgr } from "../../Net/NetworkMgr";
import { s2c_user, share } from "../../Net/msg/WebsocketMsg";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import UIPanelManger from "../../Basic/UIPanelMgr";
import { DataMgr } from "../../Data/DataMgr";
import CommonTools from "../../Tool/CommonTools";
import { LanMgr } from "../../Utils/Global";
import ItemData from "../../Const/Item";
import { BackpackItem } from "../BackpackItem";
const { ccclass, property } = _decorator;

@ccclass("WorldRankUI")
export class WorldRankUI extends ViewController {
    private _rankConfigData: rank_data[] = [];
    private _seasonType: rank_season_type = rank_season_type.season;
    private _type: rank_type = rank_type.explore;
    private _rankListData: share.Irank_list_data[] = [];
    private _seasonRound: number = -1;

    private _seasonTabButtons: Map<rank_season_type, Node> = new Map();
    private _typeTabButtons: Map<rank_type, Node> = new Map();
    private _rankContent: Node = null;
    private _commonRankContent: Node = null;
    private _commonRankItem: Node = null;
    private _rankEmptyTip: Node = null;
    private _rankNotActivatedTip: Node = null;
    private _rankRoundsTip: Label = null;

    private _lastTimeStamp: number = null;

    private _rewardContent: Node = null;
    private _rewardItem: Node = null;
    private _rewardBackpackItem: Node = null;

    protected viewDidLoad(): void {
        super.viewDidLoad();

        NetworkMgr.websocket.on("get_rank_res", this.get_rank_res);

        const viewContent = this.node.getChildByPath("__ViewContent");

        this._rankConfigData = this._get_rank_config_info();

        for (const data of this._rankConfigData) {
            let tempButton: Node = null;
            if (data.type === rank_season_type.season) {
                tempButton = viewContent.getChildByPath("SeasonTabView/SeasonButton");
            } else if (data.type == rank_season_type.daily) {
                tempButton = viewContent.getChildByPath("SeasonTabView/DailyButton");
            } else if (data.type == rank_season_type.monthly) {
                tempButton = viewContent.getChildByPath("SeasonTabView/MonthlyButton");
            }
            tempButton.active = data.open;
            if (tempButton.active) {
                this._seasonTabButtons.set(data.type, tempButton);
            }
        }
        viewContent.getChildByPath("SeasonTabView").getComponent(Layout).updateLayout();

        if (this._seasonTabButtons.has(rank_season_type.season)) {
            this._seasonType = rank_season_type.season;
        } else if (this._seasonTabButtons.has(rank_season_type.daily)) {
            this._seasonType = rank_season_type.daily;
        } else if (this._seasonTabButtons.has(rank_season_type.monthly)) {
            this._seasonType = rank_season_type.monthly;
        }

        this._typeTabButtons.set(rank_type.explore, viewContent.getChildByPath("TypeTabView/ExploreButton"));
        this._typeTabButtons.set(rank_type.fight, viewContent.getChildByPath("TypeTabView/FightButton"));
        this._typeTabButtons.set(rank_type.psyc, viewContent.getChildByPath("TypeTabView/PSYCButton"));

        this._rankContent = viewContent.getChildByPath("RankView/ContentView");
        this._commonRankContent = this._rankContent.getChildByPath("OtherView/ScrollView/View/Content");
        this._commonRankItem = this._commonRankContent.getChildByPath("Item");
        this._commonRankItem.removeFromParent();

        this._rankEmptyTip = viewContent.getChildByPath("RankView/EmptyTip");
        this._rankNotActivatedTip = viewContent.getChildByPath("RankView/NotActivatedTip");

        this._rankRoundsTip = viewContent.getChildByPath("RankTimeView/SeasonTip").getComponent(Label);

        this._rewardContent = viewContent.getChildByPath("RewardView/ScrollView/View/Content");
        this._rewardItem = this._rewardContent.getChildByPath("Item");
        this._rewardBackpackItem = this._rewardItem.getChildByPath("BackpackContent/BackpackItem");
        this._rewardItem.removeFromParent();
        this._rewardBackpackItem.removeFromParent();

        // bottom tip
        viewContent.getChildByPath("BottomTip").getComponent(Label).string = LanMgr.getLanById("1100208");

        // init request
        this._refreshUI(true);
    }

    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node | null {
        return this.node.getChildByPath("__ViewContent");
    }

    protected viewUpdate(dt: number): void {
        super.viewUpdate(dt);

        const timeStamp = new Date().getTime();
        if (this._lastTimeStamp == null || timeStamp - this._lastTimeStamp >= 1000) {
            this._lastTimeStamp = timeStamp;
            this._refreshTime();
        }
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NetworkMgr.websocket.off("get_rank_res", this.get_rank_res);
    }

    private _refreshUI(request: boolean = false) {
        let curRankConfigData: rank_data = this._rankConfigData.find((item) => {
            return item.type === this._seasonType;
        });
        if (curRankConfigData == undefined) {
            return;
        }
        //---------------------- tabbutton
        this._seasonTabButtons.forEach((value: Node, key: rank_season_type) => {
            value.getComponent(Sprite).grayscale = key != this._seasonType;
        });

        let needInitType: boolean = false;
        this._typeTabButtons.forEach((value: Node, key: rank_type) => {
            let open: boolean = false;
            if (key == rank_type.explore) {
                open = curRankConfigData.explore_open;
            } else if (key == rank_type.fight) {
                open = curRankConfigData.fight_open;
            } else if (key == rank_type.psyc) {
                open = curRankConfigData.psyc_open;
            }
            value.active = open;
            if (!open && key == this._type) {
                needInitType = true;
            }
        });
        if (needInitType) {
            if (this._typeTabButtons.get(rank_type.explore).active) {
                this._type = rank_type.explore;
            } else if (this._typeTabButtons.get(rank_type.fight).active) {
                this._type = rank_type.fight;
            } else if (this._typeTabButtons.get(rank_type.psyc).active) {
                this._type = rank_type.psyc;
            }
        }
        this._typeTabButtons.forEach((value: Node, key: rank_type) => {
            if (value.active) {
                value.getComponent(Sprite).grayscale = key != this._type;
            }
        });

        //---------------------- rank
        let selfRankData: share.Irank_list_data = null;
        const currentTimeStamp = new Date().getTime();
        const rankActivated: boolean = currentTimeStamp >= curRankConfigData.begin_time && currentTimeStamp <= curRankConfigData.end_time;
        if (rankActivated) {
            if (this._rankListData.length > 0) {
                this._rankContent.active = true;
                this._commonRankContent.destroyAllChildren();

                for (let i = 0; i < 3; i++) {
                    this._rankContent.getChildByPath("TopView/Rank_" + (i + 1)).active = i < this._rankListData.length;
                }

                for (let i = 0; i < this._rankListData.length; i++) {
                    const data = this._rankListData[i];
                    let item = null;
                    if (i < 3) {
                        item = this._rankContent.getChildByPath("TopView/Rank_" + (i + 1));
                    } else {
                        item = instantiate(this._commonRankItem);
                        item.setParent(this._commonRankContent);
                    }
                    item.getChildByPath("Name").getComponent(Label).string = data.name;
                    item.getChildByPath("Rank").getComponent(Label).string = data.rank.toString();
                    item.getChildByPath("Score").getComponent(Label).string = data.score.toString();

                    // self rank
                    if (data.id === DataMgr.s.userInfo.data.id) {
                        selfRankData = data;
                    }
                }
                this._commonRankContent.getComponent(Layout).updateLayout();
                const commonScrollView = this._commonRankContent.parent.parent.getComponent(ScrollView);
                commonScrollView.stopAutoScroll();
                commonScrollView.scrollToTop();

                this._rankEmptyTip.active = false;
            } else {
                this._rankContent.active = false;
                this._rankEmptyTip.active = true;
            }
            this._rankNotActivatedTip.active = false;
        } else {
            this._rankContent.active = false;
            this._rankEmptyTip.active = false;

            this._rankNotActivatedTip.active = true;
        }

        // self rank
        let selfName: string = DataMgr.s.userInfo.data.name;
        let selfRank: number = -1;
        let selfScore: number = 0;
        if (selfRankData != null) {
            selfRank = selfRankData.rank;
            selfScore = selfRankData.score;
        }
        const selfRankView = this.node.getChildByPath("__ViewContent/SelfInfoView");
        selfRankView.getChildByPath("Name").getComponent(Label).string = selfName;
        selfRankView.getChildByPath("Rank").getComponent(Label).string = selfRank < 0 ? "Not on the list" : selfRank.toString();
        selfRankView.getChildByPath("Score").getComponent(Label).string = selfScore.toString();

        // time
        this._refreshTime();
        let rankRounds: string = "";
        if (this._seasonType === rank_season_type.daily) {
            rankRounds = CommonTools.getNumberWithSuffix(new Date().getDate());
        } else if (this._seasonType === rank_season_type.monthly) {
            rankRounds = CommonTools.getCurrentMonthAbbreviation();
        } else {
            rankRounds = "S" + (this._seasonRound > 0 ? this._seasonRound : 1);
        }
        this._rankRoundsTip.string = rankRounds;

        // reward
        const allRewardData = RankRewardConfig.getAll();
        const currentRewardData = allRewardData.filter((item) => {
            return item.season_type === this._seasonType && item.ranking_type === this._type;
        });
        this._rewardContent.removeAllChildren();
        for (const data of currentRewardData) {
            const item = instantiate(this._rewardItem);
            item.setParent(this._rewardContent);
            item.getChildByPath("Rank").getComponent(Label).string =
                data.ranking_lower === data.ranking_upper ? data.ranking_lower.toString() : data.ranking_lower + "~" + data.ranking_upper;

            const backpackContent = item.getChildByPath("BackpackContent");
            for (const element of data.reward) {
                const backpackItem = instantiate(this._rewardBackpackItem);
                backpackItem.setParent(backpackContent);
                backpackItem.getComponent(BackpackItem).refreshUI(new ItemData(element[0].toString(), element[1]));
            }
            backpackContent.getComponent(Layout).updateLayout();
        }

        if (request) {
            NetworkMgr.websocketMsg.get_rank({
                seasonType: this._seasonType,
                rankType: this._type,
            });
        }
    }
    private _refreshTime() {
        const timeData = this._getRankingCountdown();

        const timeTitle: Label = this.node.getChildByPath("__ViewContent/RankTimeView/TimeTitle").getComponent(Label);
        const time: Label = timeTitle.node.parent.getChildByPath("Time").getComponent(Label);
        timeTitle.string = timeData.title;
        time.string = timeData.time;
    }

    private _get_rank_config_info(): rank_data[] {
        const data: rank_data[] = [];
        const seasons = [rank_season_type.daily, rank_season_type.monthly, rank_season_type.season];
        for (const type of seasons) {
            const temp: rank_data = {
                type: type,
                open: false,
                begin_time: 0,
                end_time: 0,
                explore_open: false,
                fight_open: false,
                psyc_open: false,
            };
            switch (type) {
                case rank_season_type.daily:
                    {
                        const daily_config = ConfigConfig.getConfig(ConfigType.DailyRankingEnabled) as DailyRankingEnabledParam;
                        if (daily_config != null) {
                            if (daily_config.enabled) {
                                temp.open = true;
                            }
                        }
                    }
                    break;
                case rank_season_type.monthly:
                    {
                        const monthly_config = ConfigConfig.getConfig(ConfigType.MonthlyRankingEnabled) as MonthlyRankingEnabledParam;
                        if (monthly_config != null) {
                            if (monthly_config.enabled) {
                                temp.open = true;
                            }
                        }
                    }
                    break;
                case rank_season_type.season:
                    {
                        const season_config = ConfigConfig.getConfig(ConfigType.SeasonRankingEnabled) as SeasonRankingEnabledParam;
                        if (season_config != null) {
                            if (season_config.enabled) {
                                temp.open = true;
                            }
                        }
                    }
                    break;
            }
            if (temp.open) {
                temp.explore_open = RankRewardConfig.checkRankOpen(temp.type, rank_type.explore);
                temp.fight_open = RankRewardConfig.checkRankOpen(temp.type, rank_type.fight);
                temp.psyc_open = RankRewardConfig.checkRankOpen(temp.type, rank_type.psyc);
                if (!temp.explore_open && !temp.fight_open && !temp.psyc_open) {
                    temp.open = false;
                }
            }
            data.push(temp);
        }
        return data;
    }
    private _getRankingCountdown(): { title: string; time: string } {
        let curRankConfigData: rank_data = this._rankConfigData.find((item) => {
            return item.type === this._seasonType;
        });
        if (curRankConfigData == undefined) {
            return {
                title: "",
                time: "",
            };
        }
        const currentTime = new Date().getTime();
        const timeUntilStart = (curRankConfigData.begin_time - currentTime) / 1000;
        const timeUntilEnd = (curRankConfigData.end_time - currentTime) / 1000;
        const rankActivated: boolean = currentTime >= curRankConfigData.begin_time && currentTime <= curRankConfigData.end_time;

        if (!rankActivated && timeUntilStart > 0) {
            return {
                title: "Time until start",
                time: CommonTools.formatTimeLeft(timeUntilStart),
            };
        } else if (rankActivated && timeUntilEnd > 0) {
            return {
                title: "Time until ranking ends",
                time: CommonTools.formatTimeLeft(timeUntilEnd),
            };
        } else {
            return {
                title: "Ranking has ended",
                time: "",
            };
        }
    }

    //---------------------------------- action
    private onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.popPanel(this.node);
    }
    private onTapSeasonTab(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        this._seasonType = parseInt(customEventData) as rank_season_type;
        this._refreshUI(true);
    }

    private onTapTypeTab(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        this._type = parseInt(customEventData) as rank_type;
        this._refreshUI(true);
    }

    //---------------------------------- socket notify
    private get_rank_res = (e: any) => {
        const p: s2c_user.Iget_rank_res = e.data;
        if (p.res !== 1) {
            return;
        }
        if (p.seasonType != this._seasonType || p.rankType != this._type) {
            return;
        }
        for (const element of this._rankConfigData) {
            if (element.type == p.seasonType) {
                element.begin_time = p.beginTime * 1000;
                element.end_time = p.endTime * 1000;
                break;
            }
        }
        this._rankListData = p.listData;
        this._seasonRound = p.seasonRound;
        this._refreshUI();
    };
}
