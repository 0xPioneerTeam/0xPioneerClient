import { _decorator, Button, Component, instantiate, Label, Layout, Node, Sprite } from "cc";
import ViewController from "../BasicView/ViewController";
import UIPanelManger from "../Basic/UIPanelMgr";
import { NFTPioneerObject } from "../Const/NFTPioneerDefine";
import { ItemMgr, LanMgr } from "../Utils/Global";
import LvlupConfig from "../Config/LvlupConfig";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import ItemData from "../Const/Item";
import ConfigConfig from "../Config/ConfigConfig";
import { ConfigType, NFTLevelLimitPerRankAddNumParam } from "../Const/Config";
import ItemConfig from "../Config/ItemConfig";
import { DataMgr } from "../Data/DataMgr";
import { NetworkMgr } from "../Net/NetworkMgr";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("NTFRankUpUI")
export class NTFRankUpUI extends ViewController {
    public showUI(NFTData: NFTPioneerObject) {
        this._data = NFTData;

        // userlanMgr
        // this.node.getChildByPath("__ViewContent/Title").getComponent(Label).string = LanMgr.getLanById("201003");
        // this.node.getChildByPath("__ViewContent/btnUse/name").getComponent(Label).string = LanMgr.getLanById("201003");

        const resourceLimitMaxNum = LvlupConfig.getMaxNFTRankUpNum(this._data.rarity, this._data.rank, DataMgr.s.item.getObj());
        this._maxRankUpNum = Math.min(resourceLimitMaxNum, this._data.rankLimit - this._data.rank);
        this._refreshUI();
    }

    //------------------------ life cycle
    private _data: NFTPioneerObject = null;
    private _rankUpNum: number = 1;
    private _maxRankUpNum: number = 0;
    private _currentCost: ItemData[] = [];

    private _itemView: Node = null;
    private _allShowItems: Node[] = [];
    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._itemView = this.node.getChildByPath("__ViewContent/material/Item");
        this._itemView.removeFromParent();

        NotificationMgr.addListener(NotificationName.NFT_RANK_UP, this._onNFTDidRankUp, this);
    }
    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.NFT_RANK_UP, this._onNFTDidRankUp, this);
    }
    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByPath("__ViewContent");
    }

    //------------------------ function
    private async _refreshUI() {
        if (this._data == null) {
            return;
        }
        const contentView = this.node.getChildByPath("__ViewContent");
        // level
        const levelView = contentView.getChildByPath("UpgradeLevel");
        levelView.getChildByPath("Current").getComponent(Label).string = "Rank " + this._data.rank;
        levelView.getChildByPath("Next").getComponent(Label).string = "Rank " + (this._data.rank + this._rankUpNum);

        // max level limit
        const growMaxLevelLimit: number =
            this._rankUpNum * (ConfigConfig.getConfig(ConfigType.NFTLevelLimitPerRankAddNum) as NFTLevelLimitPerRankAddNumParam).value;
        const maxLevelLimitView = contentView.getChildByPath("Property/MaxLevel");
        // userlanMgr
        // maxLevelLimitView.getChildByPath("Current").getComponent(Label).string = LanMgr.getLanById("201003"); + " +" + growMaxLevelLimit;
        maxLevelLimitView.getChildByPath("Current").getComponent(Label).string = "Max Level +    " + growMaxLevelLimit;
        maxLevelLimitView.getChildByPath("Next").getComponent(Label).string = (this._data.levelLimit + growMaxLevelLimit).toString();

        // cost item
        for (const view of this._allShowItems) {
            view.destroy();
        }
        let satisfyCost: boolean = true;
        this._allShowItems = [];
        this._currentCost = LvlupConfig.getNFTRankUpCost(this._data.rarity, this._data.rank, this._data.rank + this._rankUpNum);
        for (const templeItem of this._currentCost) {
            const itemConfig = ItemConfig.getById(templeItem.itemConfigId);
            if (itemConfig == null) {
                continue;
            }
            const ownItem: number = DataMgr.s.item.getObj_item_count(templeItem.itemConfigId);
            const needItem: number = templeItem.count;

            const view = instantiate(this._itemView);
            view.active = true;
            view.parent = this.node.getChildByPath("__ViewContent/material");
            view.getChildByPath("Icon/Image").getComponent(Sprite).spriteFrame = await ItemMgr.getItemIcon(itemConfig.icon);
            view.getChildByPath("Num/Limit").getComponent(Label).string = ownItem.toString();
            view.getChildByPath("Num/Use").getComponent(Label).string = needItem.toString();
            this._allShowItems.push(view);

            if (needItem > ownItem) {
                satisfyCost = false;
            }
        }

        // action button
        const canRankUp: boolean = satisfyCost && this._data.level >= this._data.levelLimit && this._rankUpNum <= this._maxRankUpNum;
        contentView.getChildByPath("btnUse").getComponent(Sprite).grayscale = !canRankUp;
        contentView.getChildByPath("btnUse").getComponent(Button).interactable = canRankUp;
    }

    //------------------------ action
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }

    private onTapConfirmRankUp() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._data != null && this._currentCost.length > 0) {
            NetworkMgr.websocketMsg.player_nft_rankup({ nftId: this._data.uniqueId, rankUpNum: this._rankUpNum });
        }
    }

    //------------------------ notification
    private _onNFTDidRankUp(data: { nft: NFTPioneerObject }) {
        this._rankUpNum = 1;
        this._maxRankUpNum = 0;
        this._currentCost = [];
        this.showUI(data.nft);
    }
}
