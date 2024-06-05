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
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import { share } from "../Net/msg/WebsocketMsg";
import NetGlobalData from "../Data/Save/Data/NetGlobalData";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("WorldTreasureDetailUI")
export class WorldTreasureDetailUI extends ViewController {
    //----------------------------------------- data
    private _boxRank: number = 0;
    private _boxNames: string[] = [];
    //----------------------------------------- view
    private _currentBoxTitleLabel: Label = null;
    private _currentBoxRewardItemItem: Node = null;
    private _currentBoxRewardItem: Node = null;
    private _currentBoxRewardContent: Node = null;

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._boxRank = ConfigConfig.getWorldTreasureRarityByCLv(DataMgr.s.userInfo.data.level);
        // useLanMgr
        this._boxNames = [
            LanMgr.getLanById("105101") + ":",
            LanMgr.getLanById("105102") + ":",
            LanMgr.getLanById("105103") + ":",
            LanMgr.getLanById("105104") + ":",
            LanMgr.getLanById("105105") + ":",
        ];
        this._currentBoxTitleLabel = this.node.getChildByPath("__ViewContent/RightContent/Title").getComponent(Label);
        this._currentBoxRewardContent = this.node.getChildByPath("__ViewContent/RightContent/ScrollView/View/Content");
        this._currentBoxRewardItem = this._currentBoxRewardContent.getChildByPath("Item");
        this._currentBoxRewardItem.removeFromParent();
        this._currentBoxRewardItemItem = this._currentBoxRewardItem.getChildByPath("RewardContent/BackpackItem");
        this._currentBoxRewardItemItem.removeFromParent();

        NetworkMgr.websocketMsg.get_treasure_info({});
    }
    protected viewDidStart(): void {
        super.viewDidStart();

        this._refreshUI();
       
        NetworkMgr.websocket.on("get_treasure_info_res", this._onWorldTreasureDataChanged);
    }
    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NetworkMgr.websocket.off("get_treasure_info_res", this._onWorldTreasureDataChanged);
    }
    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByPath("__ViewContent");
    }

    private _refreshUI() {
        const currentIndex: number = Math.max(0, Math.min(this._boxRank - 1, 4));
        const rankColor = GameRankColor[currentIndex];
        //------------------- reward
        this._currentBoxTitleLabel.string = this._boxNames[currentIndex];
        this._currentBoxTitleLabel.color = rankColor;

        this._currentBoxRewardContent.destroyAllChildren();
        const todayRewards: share.Itreasure_day_data = NetGlobalData.worldTreasureTodayRewards; 
        if (NetGlobalData.worldTreasureTodayRewards == null) {
            return;
        }
        const currentRankRewards: share.Itreasure_level[] = NetGlobalData.worldTreasureTodayRewards.rankData[this._boxRank.toString()]?.levels;
        if (currentRankRewards == null) {
            return;
        }
        const rewardNames: string[] = [
            "Third Rewards:", //LanMgr.getLanById("105101") + ":",
            "Second Rewards:", //LanMgr.getLanById("105101") + ":",
            "First Rewards:", //LanMgr.getLanById("105101") + ":",
        ];
        currentRankRewards.sort((a, b)=> {
            return a.level - b.level;
        });
        const rewardItemMap: Map<number, Node> = new Map();
        for (const data of currentRankRewards) {
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
                rewardItemItem.getComponent(BackpackItem).refreshUI(new ItemData(itemData.itemId.toString(), itemData.count));
                rewardItemItem.getChildByPath("Prop/img_IconNumBg/Count").getComponent(Label).string = itemData.count.toString();
                rewardItemItem.getChildByPath("LimitNum").getComponent(Label).string = itemData.num.toString();
            }
        }
    }

    //------------------------------------------ action
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }

    //----------------------------------------- notification
    private _onWorldTreasureDataChanged = (e: any) => {
        this._refreshUI();
    }
}
