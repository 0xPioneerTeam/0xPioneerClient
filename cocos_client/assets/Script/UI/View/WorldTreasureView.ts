import { _decorator, Button, Component, Label, Layout, Node, ProgressBar, Sprite, tween, v3 } from "cc";
import { UIName } from "../../Const/ConstUIDefine";
import UIPanelManger from "../../Basic/UIPanelMgr";
import { BoxInfoConfigData } from "../../Const/BoxInfo";
import BoxInfoConfig from "../../Config/BoxInfoConfig";
import { DataMgr } from "../../Data/DataMgr";
import CommonTools from "../../Tool/CommonTools";
import { GameRankColor } from "../../Const/ConstDefine";
import ConfigConfig from "../../Config/ConfigConfig";
import { ConfigType, WorldTreasureChanceLimitHeatValueCoefficientParam, WorldTreasureChancePerBoxExploreProgressParam } from "../../Const/Config";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import { NetworkMgr } from "../../Net/NetworkMgr";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("WorldTreasureView")
export class WorldTreasureView extends Component {
    //----------------------------------------- data
    private _isOpenBox: boolean = true;

    private _todayEigthTimestamp: number = 0;
    private _nextDayEightTimestamp: number = 0;
    //----------------------------------------- view
    private _boxView: Node = null;
    private _treasureBoxView: Node = null;

    private _getTimeLabel: Label = null;
    private _countDownLabel: Label = null;
    private _treasureCanGetIcon: Node = null;

    protected onLoad(): void {
        this._todayEigthTimestamp = CommonTools.getDayAMTimestamp(8);
        this._nextDayEightTimestamp = CommonTools.getNextDayAMTimestamp(8);

        //----------------------------------------- view
        this._boxView = this.node.getChildByPath("BoxContent");
        this._treasureBoxView = this._boxView.getChildByPath("BoxView/Treasure");

        this._getTimeLabel = this.node.getChildByPath("OpenButton/GetTimes").getComponent(Label);
        this._countDownLabel = this.node.getChildByPath("OpenButton/LimitCountdownTime").getComponent(Label);
        this._treasureCanGetIcon = this.node.getChildByPath("OpenButton/CanGetIcon");
        tween()
            .target(this._treasureCanGetIcon)
            .repeatForever(
                tween().sequence(
                    tween().by(0.05, { position: v3(0, 10, 0) }),
                    tween().by(0.1, { position: v3(0, -20, 0) }),
                    tween().by(0.1, { position: v3(0, 20, 0) }),
                    tween().by(0.05, { position: v3(0, -10, 0) }),
                    tween().delay(1)
                )
            )
            .start();
        this._treasureCanGetIcon.active = false;

        // useLanMgr
        // this._boxView.getChildByPath("BoxView/Title").getComponent(Label).string = LanMgr.getLanById("107549");
    }

    start() {
        this._refreshUI();

        this._refreshCountDownTime();
        this.schedule(this._refreshCountDownTime, 1);

        NetworkMgr.websocket.on("player_world_treasure_lottery_res", this._onWorldTreasureLotteryRes.bind(this));
        NotificationMgr.addListener(NotificationName.USERINFO_DID_CHANGE_TREASURE_PROGRESS, this._refreshUI, this);
        NotificationMgr.addListener(NotificationName.USERINFO_DID_CHANGE_HEAT, this._refreshUI, this);
    }

    protected onDestroy(): void {
        NetworkMgr.websocket.off("player_world_treasure_lottery_res", this._onWorldTreasureLotteryRes.bind(this));
        NotificationMgr.removeListener(NotificationName.USERINFO_DID_CHANGE_TREASURE_PROGRESS, this._refreshUI, this);
        NotificationMgr.removeListener(NotificationName.USERINFO_DID_CHANGE_HEAT, this._refreshUI, this);
    }
    update(deltaTime: number) {}

    private _refreshUI() {
        const perTimeNeedProgress: number = (
            ConfigConfig.getConfig(ConfigType.WorldTreasureChancePerBoxExploreProgress) as WorldTreasureChancePerBoxExploreProgressParam
        ).progress;

        const progress: number = DataMgr.s.userInfo.data.exploreProgress;
        const limitTimes: number = DataMgr.s.userInfo.data.heatValue.lotteryTimesLimit;
        const canGeTimes: number = DataMgr.s.userInfo.data.heatValue.lotteryProcessLimit;
        const didGetTimes: number = DataMgr.s.userInfo.data.heatValue.lotteryTimes;
        const canGetBox: boolean = didGetTimes < canGeTimes;
        // get times
        this._getTimeLabel.string = canGeTimes + "/" + limitTimes;
        // box open
        this._boxView.active = this._isOpenBox;
        // box can get tip
        this._treasureCanGetIcon.active = canGetBox;

        if (this._isOpenBox) {
            const currentProgress: number = progress - perTimeNeedProgress * canGeTimes;
            const totalProgress: number = perTimeNeedProgress;
            this._boxView.getChildByPath("BoxView/Progress/Value").getComponent(Label).string = currentProgress.toString();
            this._boxView.getChildByPath("BoxView/Progress/Total").getComponent(Label).string = totalProgress.toString();
            this._boxView.getChildByPath("BoxView/ProgressBar").getComponent(ProgressBar).progress = Math.min(1, currentProgress / totalProgress);

            const currentBoxRank: number = ConfigConfig.getWorldTreasureRarityByCLv(DataMgr.s.userInfo.data.level);
            for (let i = 1; i <= 5; i++) {
                const currentView = this._treasureBoxView.getChildByPath("Treasure_box_" + i);
                currentView.active = i == currentBoxRank;
                if (currentView.active) {
                    currentView.getChildByPath("Common").active = !canGetBox;
                    currentView.getChildByPath("Light").active = canGetBox;
                }
            }
            this._treasureBoxView.getComponent(Button).interactable = canGetBox;
        }
    }
    private _refreshCountDownTime() {
        const currentTimeStamp = new Date().getTime();

        let endTime: number = null;
        if (currentTimeStamp < this._todayEigthTimestamp) {
            endTime = this._todayEigthTimestamp;
        } else {
            endTime = this._nextDayEightTimestamp;
        }
        if (endTime == null) {
            this._countDownLabel.node.active = false;
        } else {
            this._countDownLabel.node.active = true;
            const gapTime: number = Math.max(0, endTime - currentTimeStamp);
            this._countDownLabel.string = CommonTools.formatSeconds(gapTime / 1000, "HHh MMm");
        }
    }
    //----------------------------------------------
    private onTapOpen() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._isOpenBox) {
            return;
        }
        this._isOpenBox = true;
        this._refreshUI();
    }
    private onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (!this._isOpenBox) {
            return;
        }
        this._isOpenBox = false;
        this._refreshUI();
    }
    private async onTapProgress() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.pushPanel(UIName.WorldTreasureUIRe);
    }
    private async onTapTreasure() {
        GameMusicPlayMgr.playTapButtonEffect();
        NetworkMgr.websocketMsg.player_world_treasure_lottery({});
    }

    //---------------------------- socket notification
    private _onWorldTreasureLotteryRes(e: any) {
        this._refreshUI();
    }
}
