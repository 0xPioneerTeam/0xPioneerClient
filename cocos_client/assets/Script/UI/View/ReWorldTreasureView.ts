import { _decorator, Button, Component, Label, Layout, Node, ProgressBar, Sprite, SpriteFrame, tween, v3 } from "cc";
import { UIName } from "../../Const/ConstUIDefine";
import UIPanelManger from "../../Basic/UIPanelMgr";
import { BoxInfoConfigData } from "../../Const/BoxInfo";
import BoxInfoConfig from "../../Config/BoxInfoConfig";
import { DataMgr } from "../../Data/DataMgr";
import CommonTools from "../../Tool/CommonTools";
import { GameRankColor } from "../../Const/ConstDefine";
import ConfigConfig from "../../Config/ConfigConfig";
import { ConfigType, WorldBoxThresholdParam, WorldTreasureChanceLimitHeatValueCoefficientParam, WorldTreasureChancePerBoxExploreProgressParam } from "../../Const/Config";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import { NetworkMgr } from "../../Net/NetworkMgr";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("ReWorldTreasureView")
export class ReWorldTreasureView extends Component {
    @property([SpriteFrame])
    private progressSprites: SpriteFrame[] = [];
    //----------------------------------------- view
    private _getTimeLabel: Label = null;
    private _treasureCanGetIcon: Node = null;

    protected onLoad(): void {
        //----------------------------------------- view
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
    }

    start() {
        this._refreshUI();

        NetworkMgr.websocket.on("player_world_treasure_lottery_res", this._onWorldTreasureLotteryRes);


        NotificationMgr.addListener(NotificationName.USERINFO_DID_CHANGE_TREASURE_PROGRESS, this._refreshUI, this);
        NotificationMgr.addListener(NotificationName.USERINFO_DID_CHANGE_HEAT, this._refreshUI, this);
    }

    protected onDestroy(): void {

        NetworkMgr.websocket.off("player_world_treasure_lottery_res", this._onWorldTreasureLotteryRes);

        NotificationMgr.removeListener(NotificationName.USERINFO_DID_CHANGE_TREASURE_PROGRESS, this._refreshUI, this);
        NotificationMgr.removeListener(NotificationName.USERINFO_DID_CHANGE_HEAT, this._refreshUI, this);
    }
    update(deltaTime: number) {}

    private _refreshUI() {
        const perTimeNeedProgress: number = (
            ConfigConfig.getConfig(ConfigType.WorldTreasureChancePerBoxExploreProgress) as WorldTreasureChancePerBoxExploreProgressParam
        ).progress;

        const heatValue: number = DataMgr.s.userInfo.data.heatValue.currentHeatValue;
        const progress: number = DataMgr.s.userInfo.data.exploreProgress;
        const canGeTimes: number = DataMgr.s.userInfo.data.heatValue.lotteryProcessLimit;
        const didGetTimes: number = DataMgr.s.userInfo.data.heatValue.lotteryTimes;
        const canGetBox: boolean = didGetTimes < canGeTimes;

        let heatRank: number = 1;
        // left view
        const worldBoxThreshold: number[] = (ConfigConfig.getConfig(ConfigType.WorldBoxThreshold) as WorldBoxThresholdParam).thresholds;
        const maxHeatThreshold: number = worldBoxThreshold[worldBoxThreshold.length - 1];
        if (heatValue >= maxHeatThreshold) {
            heatRank = 5;
        } else {
            let totalValue: number = 0;
            for (let i = 0; i < worldBoxThreshold.length; i++) {
                if (heatValue < worldBoxThreshold[i]) {
                    totalValue = worldBoxThreshold[i];
                    heatRank = i + 1;
                    break;
                }
            }
        }


        // box can get tip
        this._treasureCanGetIcon.active = canGetBox;

        const currentProgress: number = progress - perTimeNeedProgress * canGeTimes;
        const totalProgress: number = perTimeNeedProgress;
        this.node.getChildByPath("OpenButton/Bg/Value").getComponent(Label).string = Math.floor(currentProgress / totalProgress * 100) + "%";
        this.node.getChildByPath("OpenButton/Bg/Value").getComponent(Label).color = GameRankColor[heatRank - 1];
        this.node.getChildByPath("OpenButton/Bg/ProgressBar").getComponent(ProgressBar).progress = Math.min(1, currentProgress / totalProgress);
        this.node.getChildByPath("OpenButton/Bg/ProgressBar/Bar").getComponent(Sprite).spriteFrame = this.progressSprites[heatRank - 1];
    }
    //----------------------------------------------
    private async onTapProgress() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.pushPanel(UIName.WorldTreasureUIRe);
    }


    //-------------------------------
    private _onWorldTreasureLotteryRes = (e: any)=> {
        this._refreshUI();
    }
}
