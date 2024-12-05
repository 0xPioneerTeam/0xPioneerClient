import {
    _decorator,
    Component,
    Label,
    Node,
    Sprite,
    SpriteFrame,
    Vec3,
    Button,
    EventHandler,
    v2,
    Vec2,
    Prefab,
    Slider,
    instantiate,
    Layout,
    Burst,
    Color,
} from "cc";
import { BackpackMgr, ItemMgr, LanMgr } from "../Utils/Global";
import ViewController from "../BasicView/ViewController";
import { UIName } from "../Const/ConstUIDefine";
import { ItemInfoUI } from "./ItemInfoUI";
import NotificationMgr from "../Basic/NotificationMgr";
import { IdleItemData } from "../Const/IdleItem";
import { NotificationName } from "../Const/Notification";
import UIPanelManger from "../Basic/UIPanelMgr";
import { DataMgr } from "../Data/DataMgr";
import { BackpackArrangeType, BackpackCategoryType } from "../Const/ConstDefine";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
// import { IdleItem } from "./IdleItem";
import { IdleItem } from "./IdleItem";
const { ccclass, property } = _decorator;

@ccclass("IdleUI")
export class IdleUI extends ViewController {
    @property(Prefab)
    private itemPrb: Prefab = null;

    private _data: IdleItemData[] = [];

    private _idleContent: Node = null;


    protected viewDidLoad(): void {
        super.viewDidLoad();


        this._idleContent = this.node.getChildByPath("__ViewContent/Items/ScrollView/View/Content");


        NotificationMgr.addListener(NotificationName.CHANGE_LANG, this._refreshIdleUI, this);
        // NotificationMgr.addListener(NotificationName.ITEM_CHANGE, this._refreshBackpackUI, this);
    }

    protected viewDidStart(): void {
        super.viewDidStart();

        this._refreshIdleUI();
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.CHANGE_LANG, this._refreshIdleUI, this);
        // NotificationMgr.removeListener(NotificationName.ITEM_CHANGE, this._refreshBackpackUI, this);
    }

    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByPath("__ViewContent");
    }

    public async refreshUI() {
        await this._refreshIdleUI();
    }
    private async _refreshIdleUI() {
        // this._data = [BackpackMgr.getBackpack(this._currentCategoryType, this._currentArrangeType);]
        this._data = [
            { status: 1, startTime: 1733419620, duration: 3600, type: 0 },
            { status: 0, startTime: 1733419410, duration: 5000, type: 1 },
            { status: 2, startTime: 1733419430, duration: 5000, type: 0 },
            { status: 0, startTime: 1733419440, duration: 5000, type: 1 },
        ];
        this._idleContent.removeAllChildren();
        for (let i = 0; i < this._data.length; i++) {
            let itemView = null;
            itemView = instantiate(this.itemPrb);
            this._idleContent.addChild(itemView);
            itemView.getComponent(IdleItem).refreshUI(this._data[i], false);


        }
        this._idleContent.getComponent(Layout).updateLayout();


    }


    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        // this._selectSortMenuShow = false;
        // this._refreshMenu();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
        // DataMgr.s.item.readAllNewItem();
        // DataMgr.s.artifact.readAllNewArtifact();
    }
    private async onTapItem(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const index = parseInt(customEventData);
        if (index < this._data.length) {
            const data = this._data[index];
            if (data instanceof ItemData) {
                const result = await UIPanelManger.inst.pushPanel(UIName.ItemInfoUI);
                if (result.success) {
                    result.node.getComponent(ItemInfoUI).showItem([data]);
                }
                DataMgr.s.item.readNewItemById(data.itemConfigId);
            } else if (data instanceof ArtifactData) {
                const result = await UIPanelManger.inst.pushPanel(UIName.ArtifactInfoUI);
                if (result.success) {
                    result.node.getComponent(ArtifactInfoUI).showItem([data]);
                }
                DataMgr.s.artifact.readNewArtifactById(data.uniqueId);
            }
        }
    }

}
