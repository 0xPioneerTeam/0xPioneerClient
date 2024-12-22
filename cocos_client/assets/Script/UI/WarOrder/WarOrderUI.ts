import { _decorator, Button, Color, instantiate, Label, Layout, Node, ProgressBar, RichText, Sprite, SpriteFrame, UITransform, v3 } from "cc";
import ViewController from "../../BasicView/ViewController";
import { ArtifactMgr, ItemMgr, LanMgr } from "../../Utils/Global";
import { DataMgr } from "../../Data/DataMgr";
import ItemConfig from "../../Config/ItemConfig";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import UIPanelManger from "../../Basic/UIPanelMgr";
import { UIName } from "../../Const/ConstUIDefine";
import { ItemConfigType } from "../../Const/Item";
import ArtifactConfig from "../../Config/ArtifactConfig";
import ConfigConfig from "../../Config/ConfigConfig";
import { ConfigType, WorldBoxThresholdParam, WorldTreasureBoxRarityShowNameParam } from "../../Const/Config";
import { InnerBuildingType } from "../../Const/BuildingDefine";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import { NetworkMgr } from "../../Net/NetworkMgr";
import { WarOrderConfigData } from "../../Const/WarOrderDefine";
import WarOrderConfig from "../../Config/WarOrderConfig";
import { WarOrderItem } from "./WarOrderItem";
const { ccclass, property } = _decorator;

@ccclass("WarOrderUI")
export class WarOrderUI extends ViewController {
    @property(cc.Label)
    private level: Label = null;

    @property(cc.Label)
    private time: Label = null;
    @property(cc.Button)
    private taskBtn: Button = null;
    @property(cc.Button)
    private claimBtn: Button = null;

    @property(cc.Node)
    private rewardContent: Node = null;

    @property(cc.Node)
    private rewardItem: Node = null;
    private _orderList: WarOrderConfigData[] = [];
    protected viewDidLoad(): void {
        super.viewDidLoad();
        this._orderList = WarOrderConfig.getAll();
        this._refreshUI();
    }

    protected viewDidStart(): void {
        super.viewDidStart();

    }

    protected viewPopAnimation(): boolean {
        return true;
    }

    protected contentView(): Node {
        return this.node.getChildByPath("Content");
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();
    }

    private resetUI() {
        this._refreshUI();
    }

    private async _refreshUI() {
        this.rewardContent.removeAllChildren();
        for (let i = 0; i < this._orderList.length; i++) {
            const item = instantiate(this.rewardItem)
            this.rewardContent.addChild(item);
            item.getComponent(WarOrderItem).refreshUI(this._orderList[i]);
        }
    }
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }

    private onTapClaim() {
        GameMusicPlayMgr.playTapButtonEffect();
    }

    private onTapTask() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.pushPanel(UIName.WarOrderTaskUI);
    }
}
