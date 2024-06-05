import { _decorator, Node, instantiate, Label, Layout, UITransform, Button, ScrollView, v2, Color, Sprite, ProgressBar, SpriteFrame } from "cc";
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
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import { share } from "../Net/msg/WebsocketMsg";
import NetGlobalData from "../Data/Save/Data/NetGlobalData";
import { UIName } from "../Const/ConstUIDefine";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("WorldTreasureUIRe")
export class WorldTreasureUIRe extends ViewController {
    @property([SpriteFrame])
    private progressSprites: SpriteFrame[] = [];

    //----------------------------------------- view
    protected viewDidLoad(): void {
        super.viewDidLoad();
    }
    protected viewDidStart(): void {
        super.viewDidStart();

        this._refreshUI();
        NetworkMgr.websocket.on("player_world_treasure_lottery_res", this._onWorldTreasureLotteryRes);
        NotificationMgr.addListener(NotificationName.USERINFO_DID_CHANGE_TREASURE_PROGRESS, this._refreshUI, this);
        NotificationMgr.addListener(NotificationName.USERINFO_DID_CHANGE_HEAT, this._refreshUI, this);
    }
    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NetworkMgr.websocket.off("player_world_treasure_lottery_res", this._onWorldTreasureLotteryRes);
        NotificationMgr.removeListener(NotificationName.USERINFO_DID_CHANGE_TREASURE_PROGRESS, this._refreshUI, this);
        NotificationMgr.removeListener(NotificationName.USERINFO_DID_CHANGE_HEAT, this._refreshUI, this);
    }

    private _refreshUI() {
        const perTimeNeedProgress: number = (
            ConfigConfig.getConfig(ConfigType.WorldTreasureChancePerBoxExploreProgress) as WorldTreasureChancePerBoxExploreProgressParam
        ).progress;
        
        const progress: number = DataMgr.s.userInfo.data.exploreProgress;
        const heatValue: number = DataMgr.s.userInfo.data.heatValue.currentHeatValue;
        const limitTimes: number = DataMgr.s.userInfo.data.heatValue.lotteryTimesLimit;
        const canGeTimes: number = DataMgr.s.userInfo.data.heatValue.lotteryProcessLimit;
        const didGetTimes: number = DataMgr.s.userInfo.data.heatValue.lotteryTimes;
        const canGet: boolean = didGetTimes < canGeTimes;

        let heatRank: number = 1;
        // left view
        const worldBoxThreshold: number[] = (ConfigConfig.getConfig(ConfigType.WorldBoxThreshold) as WorldBoxThresholdParam).thresholds;
        const leftView = this.node.getChildByPath("__ViewContent/LeftContent");
        const emptyLabel = leftView.getChildByPath("Full");
        const heatValueView = leftView.getChildByPath("HeatValue");
        const pointerView = leftView.getChildByPath("Progress/Pointer");
        const beginPointerValue: number = 113;
        const endPointerValue: number = -113;
        const maxHeatThreshold: number = worldBoxThreshold[worldBoxThreshold.length - 1];
        pointerView.angle = beginPointerValue + (endPointerValue - beginPointerValue) * Math.min(1, heatValue / maxHeatThreshold);
        if (heatValue >= worldBoxThreshold[worldBoxThreshold.length - 1]) {
            emptyLabel.active = true;
            heatValueView.active = false;

            heatRank = 5;
        } else {
            emptyLabel.active = false;
            heatValueView.active = true;
            heatValueView.getChildByPath("Value").getComponent(Label).string = heatValue.toString();

            let totalValue: number = 0;
            for (let i = 0; i < worldBoxThreshold.length; i++) {
                if (heatValue < worldBoxThreshold[i]) {
                    totalValue = worldBoxThreshold[i];
                    heatRank = i + 1;
                    break;
                }
            }
            heatValueView.getChildByPath("Total").getComponent(Label).string = totalValue.toString();
        }
        // right view
        const rigthView = this.node.getChildByPath("__ViewContent/RightContent");
        rigthView.getChildByPath("BoxView/CanGetView").active = canGet;
        rigthView.getChildByPath("BoxView/NonGetView").active = !canGet;
        const claimButton = rigthView.getChildByPath("BoxView/ClaimButton");
        claimButton.getComponent(Button).interactable = canGet;
        claimButton.getChildByPath("Title").getComponent(Label).color = canGet ? Color.BLACK : new Color().fromHEX("#5B5850");

        const currentProgress: number = progress - perTimeNeedProgress * canGeTimes;
        const totalProgress: number = perTimeNeedProgress;
        rigthView.getChildByPath("Progress/Value").getComponent(Label).string = Math.floor(currentProgress / totalProgress * 100) + "%";
        rigthView.getChildByPath("Progress/Value").getComponent(Label).color = GameRankColor[heatRank - 1];
        rigthView.getChildByPath("Progress/ProgressBar").getComponent(ProgressBar).progress = currentProgress / totalProgress;
        rigthView.getChildByPath("Progress/ProgressBar/Bar").getComponent(Sprite).spriteFrame = this.progressSprites[heatRank - 1];

        rigthView.getChildByPath("KeyView/Content/Value").getComponent(Label).string = (canGeTimes - didGetTimes).toString();
        rigthView.getChildByPath("KeyView/Content/Total").getComponent(Label).string = limitTimes.toString();
    }
    //------------------------------------------ action
    private onTapClaim() {
        GameMusicPlayMgr.playTapButtonEffect();
        NetworkMgr.websocketMsg.player_world_treasure_lottery({});
    }
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }
    private onTapDetail() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.pushPanel(UIName.WorldTreasureDetailUI);
    }
    private onTapQuestion() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.pushPanel(UIName.WorldTreasureTipUI);
    }

    //----------------------------------------- notification
    private _onWorldTreasureLotteryRes = (e: any) => {
        this._refreshUI();
    };
}
