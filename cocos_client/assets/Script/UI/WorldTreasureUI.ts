import { _decorator, Node, instantiate, Label, Layout, UITransform, Button, ScrollView, v2, Color, Sprite, ProgressBar } from "cc";
import UIPanelManger from "../Basic/UIPanelMgr";
import { DataMgr } from "../Data/DataMgr";
import ViewController from "../BasicView/ViewController";
import ItemData from "../Const/Item";
import { WorldBoxConfigData } from "../Const/WorldBoxDefine";
import WorldBoxConfig from "../Config/WorldBoxConfig";
import CommonTools from "../Tool/CommonTools";
import ConfigConfig from "../Config/ConfigConfig";
import {
    ConfigType,
    PSYCToHeatCoefficientParam,
    WorldBoxThresholdParam,
    WorldTreasureChanceLimitHeatValueCoefficientParam,
    WorldTreasureChancePerBoxExploreProgressParam,
} from "../Const/Config";
import { GameRankColor, GetPropRankColor } from "../Const/ConstDefine";
import { BackpackItem } from "./BackpackItem";
import { NetworkMgr } from "../Net/NetworkMgr";
import { LanMgr } from "../Utils/Global";
const { ccclass, property } = _decorator;

@ccclass("WorldTreasureUI")
export class WorldTreasureUI extends ViewController {
    //----------------------------------------- data
    private _boxDatas: WorldBoxConfigData[] = [];
    private _boxRank: number = 0;
    private _canClaimBoxIndex: number = -1;
    private _boxNames: string[] = [];
    private _todayEightTimestamp: number = 0;
    private _nextDayEightTimestamp: number = 0;
    //----------------------------------------- view
    private _currentBoxTitleLabel: Label = null;
    private _currentBoxRewardItemItem: Node = null;
    private _currentBoxRewardItem: Node = null;
    private _currentBoxRewardContent: Node = null;

    private _claimButton: Button = null;
    private _claimCountDownLabel: Label = null;

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._boxRank = ConfigConfig.getWorldTreasureRarityByCLv(DataMgr.s.userInfo.data.level);
        this._boxRank = 5;
        // useLanMgr
        this._boxNames = [
            LanMgr.getLanById("105101") + ":",
            LanMgr.getLanById("105102") + ":",
            LanMgr.getLanById("105103") + ":",
            LanMgr.getLanById("105104") + ":",
            LanMgr.getLanById("105105") + ":",
        ];
        this._todayEightTimestamp = CommonTools.getDayAMTimestamp(8);
        this._nextDayEightTimestamp = CommonTools.getNextDayAMTimestamp(8);

        this._currentBoxTitleLabel = this.node.getChildByPath("__ViewContent/RightContent/Title").getComponent(Label);
        this._currentBoxRewardContent = this.node.getChildByPath("__ViewContent/RightContent/ScrollView/View/Content");
        this._currentBoxRewardItem = this._currentBoxRewardContent.getChildByPath("Item");
        this._currentBoxRewardItem.removeFromParent();
        this._currentBoxRewardItemItem = this._currentBoxRewardItem.getChildByPath("RewardContent/BackpackItem");
        this._currentBoxRewardItemItem.removeFromParent();

        this._claimButton = this.node.getChildByPath("__ViewContent/LeftContent/TimeProgressView/ClaimButton").getComponent(Button);
        this._claimCountDownLabel = this.node.getChildByPath("__ViewContent/CountdonwContent/Value").getComponent(Label);

        // useLanMgr
        // this.node.getChildByPath("__ViewContent/Title").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("__ViewContent/LeftContent/CurrentBoxView/Title").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("__ViewContent/LeftContent/TimeView/MaxTimes/Title").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("__ViewContent/LeftContent/TimeView/NextTimeNeedPSYCTitle").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("__ViewContent/LeftContent/TimeView/PSYCProgress/Title").getComponent(Label).string = LanMgr.getLanById("107549") + " ";
        // this.node.getChildByPath("__ViewContent/LeftContent/TimeProgressView/Times/Title").getComponent(Label).string = LanMgr.getLanById("107549") + " ";
        // this.node.getChildByPath("__ViewContent/LeftContent/TimeProgressView/ClaimButton/name").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("__ViewContent/CountdonwContent/Title").getComponent(Label).string = LanMgr.getLanById("107549");
    }
    protected viewDidStart(): void {
        super.viewDidStart();

        this._refreshUI();
        // next day eight hour timestamp
        this._refreshCountDownTime();
        this.schedule(this._refreshCountDownTime, 1);
    }
    protected viewDidDestroy(): void {
        super.viewDidDestroy();
    }
    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByPath("__ViewContent");
    }

    private _refreshUI() {
        const perTimeNeedProgress: number = (
            ConfigConfig.getConfig(ConfigType.WorldTreasureChancePerBoxExploreProgress) as WorldTreasureChancePerBoxExploreProgressParam
        ).progress;
        const perGetTimeNeedHeatValue: number =
            1 /
            (ConfigConfig.getConfig(ConfigType.WorldTreasureChanceLimitHeatValueCoefficient) as WorldTreasureChanceLimitHeatValueCoefficientParam).coefficient;
        const psycToHeatCoefficient: number = (ConfigConfig.getConfig(ConfigType.PSYCToHeatCoefficient) as PSYCToHeatCoefficientParam).coefficient;
        const progress: number = DataMgr.s.userInfo.data.exploreProgress;
        const heatValue: number = 200;
        const limitTimes: number = Math.floor(heatValue / perGetTimeNeedHeatValue);
        const canGeTimes: number = Math.min(limitTimes, Math.floor(progress / perTimeNeedProgress));
        const didGetTimes: number = DataMgr.s.userInfo.data.worldTreasureTodayDidGetTimes;
        const canGet: boolean = canGeTimes < didGetTimes;

        const currentIndex: number = Math.max(0, Math.min(this._boxRank - 1, 4));

        const rankColor = GameRankColor[currentIndex];
        const leftView = this.node.getChildByPath("__ViewContent/LeftContent");
        //------------------- current box
        const boxView = leftView.getChildByPath("CurrentBoxView");
        // Bg
        const boxBgView = boxView.getChildByPath("ItemBg");
        boxBgView.getComponent(Sprite).color = rankColor;
        boxBgView.getChildByPath("Title").getComponent(Label).string = this._boxNames[currentIndex];
        boxBgView.getChildByPath("Title").getComponent(Label).color = rankColor;
        for (let i = 1; i <= 5; i++) {
            const tempBox = boxBgView.getChildByPath("Treasure/Treasure_box_" + i);
            tempBox.active = i == this._boxRank;
            if (tempBox.active) {
                tempBox.getChildByPath("Common").active = !canGet;
                tempBox.getChildByPath("Light").active = canGet;
            }
        }

        //------------------- max chance
        leftView.getChildByPath("TimeView/MaxTimes/Value").getComponent(Label).string = limitTimes.toString();
        leftView.getChildByPath("TimeView/PSYCProgress/Value").getComponent(Label).string = (
            (heatValue - perGetTimeNeedHeatValue * limitTimes) /
            psycToHeatCoefficient
        ).toString();
        leftView.getChildByPath("TimeView/PSYCProgress/Total").getComponent(Label).string = (perGetTimeNeedHeatValue / psycToHeatCoefficient).toString();

        const currentProgress: number = progress - perTimeNeedProgress * canGeTimes;
        const totalProgress: number = perTimeNeedProgress;

        leftView.getChildByPath("TimeProgressView/Times/Value").getComponent(Label).string = Math.max(0, canGeTimes - didGetTimes).toString();
        leftView.getChildByPath("TimeProgressView/ProgressBar").getComponent(ProgressBar).progress = Math.min(1, currentProgress / totalProgress);
        leftView.getChildByPath("TimeProgressView/ProgressBar/Progress/Value").getComponent(Label).string = currentProgress.toString();
        leftView.getChildByPath("TimeProgressView/ProgressBar/Progress/Total").getComponent(Label).string = totalProgress.toString();

        this._claimButton.getComponent(Button).interactable = canGet;
        this._claimButton.getComponent(Sprite).grayscale = !canGet;

        //------------------- reward
        this._currentBoxTitleLabel.string = this._boxNames[currentIndex];
        this._currentBoxTitleLabel.color = GameRankColor[currentIndex];

        this._currentBoxRewardContent.destroyAllChildren();

        let rewardDataDay: number = CommonTools.getDayOfWeek() - 1;
        if (rewardDataDay == 0) {
            rewardDataDay = 7;
        }
        this._boxDatas = WorldBoxConfig.getByDayAndRank(rewardDataDay, this._boxRank);
        const rewardNames: string[] = [
            "Third Rewards:", //LanMgr.getLanById("105101") + ":",
            "Second Rewards:", //LanMgr.getLanById("105101") + ":",
            "First Rewards:", //LanMgr.getLanById("105101") + ":",
        ];
        const rewardItemMap: Map<number, Node> = new Map();
        for (const data of this._boxDatas) {
            let itemView = null;
            if (!rewardItemMap.has(data.level)) {
                itemView = instantiate(this._currentBoxRewardItem);
                itemView.setParent(this._currentBoxRewardContent);
                itemView.getChildByPath("Title").getComponent(Label).string = rewardNames[data.level - 1];
                rewardItemMap.set(data.level, itemView);
            } else {
                itemView = rewardItemMap.get(data.level);
            }
            for (const itemData of data.reward) {
                const rewardItemItem = instantiate(this._currentBoxRewardItemItem);
                itemView.getChildByPath("RewardContent").addChild(rewardItemItem);
                rewardItemItem.getComponent(BackpackItem).refreshUI(new ItemData(itemData[0], itemData[1]));
                rewardItemItem.getChildByPath("Prop/img_IconNumBg/Count").getComponent(Label).string = itemData[1].toString();
                rewardItemItem.getChildByPath("LimitNum").getComponent(Label).string = "totalTime";
            }
        }
    }

    private _refreshCountDownTime() {
        const currentTimeStamp = new Date().getTime();
        let endTime: number = null;
        if (currentTimeStamp < this._todayEightTimestamp) {
            endTime = this._todayEightTimestamp;
        } else {
            endTime = this._nextDayEightTimestamp;
        }
        if (endTime == null) {
            this._claimCountDownLabel.node.active = false;
        } else {
            this._claimCountDownLabel.node.active = true;
            const gapTime: number = Math.max(0, endTime - currentTimeStamp);
            this._claimCountDownLabel.string = CommonTools.formatSeconds(gapTime / 1000, "HHh MMm");
        }
    }
    //------------------------------------------ action
    private onTapClaim() {
        NetworkMgr.websocketMsg.player_world_treasure_lottery({});
    }
    private async onTapClose() {
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel();
    }

    //----------------------------------------- notification
}
