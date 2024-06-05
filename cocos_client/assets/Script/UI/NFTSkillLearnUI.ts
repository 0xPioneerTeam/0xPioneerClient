import { _decorator, Button, instantiate, Label, Layout, Node, RichText } from "cc";
import { ItemMgr, LanMgr } from "../Utils/Global";
import ViewController from "../BasicView/ViewController";
import UIPanelManger, { UIPanelLayerType } from "../Basic/UIPanelMgr";
import { NFTPioneerObject, NFTPioneerSkillConfigData } from "../Const/NFTPioneerDefine";
import { HUDName, UIName } from "../Const/ConstUIDefine";
import { AlterView } from "./View/AlterView";
import ItemData from "../Const/Item";
import { BackpackItem } from "./BackpackItem";
import ItemConfig from "../Config/ItemConfig";
import { ItemInfoUI } from "./ItemInfoUI";
import { DataMgr } from "../Data/DataMgr";
import { NetworkMgr } from "../Net/NetworkMgr";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("NFTSkillLearnUI")
export class NFTSkillLearnUI extends ViewController {
    public async showItem(data: NFTPioneerObject) {
        if (data == null) {
            return;
        }
        this._data = data;
        this._refreshUI();
    }

    private _data: NFTPioneerObject = null;
    private _skillIndex: number = -1;
    private _skillConfig: NFTPioneerSkillConfigData = null;
    private _skillBooks: ItemData[] = [];

    private _bookItem: Node = null;
    private _bookContent: Node = null;
    private _allBookItems: Node[] = [];
    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._skillBooks = DataMgr.s.item.getObj_item_skillbook();

        this._bookContent = this.node.getChildByPath("__ViewContent/BgTaskListWord/ScrollView/View/Content");
        this._bookItem = this._bookContent.getChildByPath("Item");
        // useLanMgr
        // this._bookItem.getChildByPath("LearnBtn/Label").getComponent(Label).string = LanMgr.getLanById("107549")
        this._bookItem.removeFromParent();

        NotificationMgr.addListener(NotificationName.NFT_LEARN_SKILL, this._refreshUI, this);
    }
    protected viewDidStart(): void {
        super.viewDidStart();
    }
    protected viewDidDestroy(): void {
        super.viewDidDestroy();
        NotificationMgr.removeListener(NotificationName.NFT_LEARN_SKILL, this._refreshUI, this);
    }
    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByName("__ViewContent");
    }

    private _refreshUI() {
        for (const item of this._allBookItems) {
            item.destroy();
        }
        this._allBookItems = [];

        if (this._skillBooks.length == 0) {
            this.node.getChildByPath("__ViewContent/Empty").active = true;
        } else {
            this.node.getChildByPath("__ViewContent/Empty").active = false;
            for (let i = 0; i < this._skillBooks.length; i++) {
                const book = this._skillBooks[i];
                const config = ItemConfig.getById(book.itemConfigId);
                if (config == null) {
                    continue;
                }
                const itemView = instantiate(this._bookItem);
                itemView.active = true;
                itemView.parent = this._bookContent;
                itemView.getChildByPath("BackpackItem").getComponent(Button).clickEvents[0].customEventData = i.toString();
                itemView.getChildByPath("BackpackItem").getComponent(BackpackItem).refreshUI(book);
                itemView.getChildByPath("Name").getComponent(Label).string = LanMgr.getLanById(config.itemName);
                itemView.getChildByPath("Num").getComponent(Label).string = "x" + book.count;
                itemView.getChildByPath("LearnBtn").getComponent(Button).clickEvents[0].customEventData = book.itemConfigId;
                this._allBookItems.push(itemView);
            }
            this._bookContent.getComponent(Layout).updateLayout();
        }
    }
    //---------------------------------------------------- action
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }
    private async onTapBookItem(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const index: number = parseInt(customEventData);
        const result = await UIPanelManger.inst.pushPanel(UIName.ItemInfoUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(ItemInfoUI).showItem([this._skillBooks[index]]);
    }
    private async onTapLearn(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const itemConfigId: string = customEventData;
        const config = ItemConfig.getById(itemConfigId);
        if (config == null) {
            return;
        }
        const result = await UIPanelManger.inst.pushPanel(HUDName.Alter, UIPanelLayerType.HUD);
        if (!result.success) {
            return;
        }
        result.node.getComponent(AlterView).showTip(LanMgr.replaceLanById("106005", [this._data.name, LanMgr.getLanById(config.itemName)]), async () => {
            NetworkMgr.websocketMsg.player_nft_skill_learn({
                nftId: this._data.uniqueId,
                skillItemId: itemConfigId,
            });
            await this.playExitAnimation();
            UIPanelManger.inst.popPanel(this.node);
        });
    }
}
