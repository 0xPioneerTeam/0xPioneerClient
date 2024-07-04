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
import { BackpackItem } from "./BackpackItem";
import { BackpackMgr, ItemMgr, LanMgr } from "../Utils/Global";
import ViewController from "../BasicView/ViewController";
import { UIName } from "../Const/ConstUIDefine";
import { ItemInfoUI } from "./ItemInfoUI";
import NotificationMgr from "../Basic/NotificationMgr";
import ItemData from "../Const/Item";
import { NotificationName } from "../Const/Notification";
import UIPanelManger from "../Basic/UIPanelMgr";
import { DataMgr } from "../Data/DataMgr";
import { BackpackArrangeType, BackpackCategoryType } from "../Const/ConstDefine";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
import ArtifactData from "../Model/ArtifactData";
import { ArtifactItem } from "./ArtifactItem";
import { ArtifactInfoUI } from "./ArtifactInfoUI";
const { ccclass, property } = _decorator;

@ccclass("BackpackUI")
export class BackpackUI extends ViewController {
    @property(Prefab)
    private itemPrb: Prefab = null;

    @property(Prefab)
    private artifactPrb: Prefab = null;

    private _selectSortMenuShow: boolean = false;
    private _currentCategoryType: BackpackCategoryType = null;
    private _currentArrangeType: BackpackArrangeType = null;
    private _currentSelectArrangeType: BackpackArrangeType = null;
    private _data: (ItemData | ArtifactData)[] = [];

    private _backpackContent: Node = null;
    private _categoryButtons: Node[] = [];
    private _sortMenu: Node = null;
    private _menuArrow: Node = null;

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._currentCategoryType = BackpackCategoryType.All;
        this._currentArrangeType = BackpackArrangeType.Recently;

        this._categoryButtons = [
            this.node.getChildByPath("__ViewContent/BottomView/AllButton"),
            this.node.getChildByPath("__ViewContent/BottomView/RellcButton"),
            this.node.getChildByPath("__ViewContent/BottomView/ConsumableButton"),
            this.node.getChildByPath("__ViewContent/BottomView/SpecialButton"),
            this.node.getChildByPath("__ViewContent/BottomView/OtherButton"),
        ];

        this._sortMenu = this.node.getChildByPath("__ViewContent/SortMenu");
        this._sortMenu.active = false;

        this._menuArrow = this.node.getChildByPath("__ViewContent/BottomView/Menu/Arrow");
        this._backpackContent = this.node.getChildByPath("__ViewContent/Items/ScrollView/View/Content");

        // useLanMgr
        // this.node.getChildByPath("__ViewContent/title").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("__ViewContent/BottomView/AllButton/Label").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("__ViewContent/BottomView/RellcButton/Label").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("__ViewContent/BottomView/ConsumableButton/Label").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("__ViewContent/BottomView/SpecialButton/Label").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("__ViewContent/BottomView/OtherButton/Label").getComponent(Label).string = LanMgr.getLanById("107549");
        // this._sortMenu.getChildByPath("Content/Recently").getComponent(Label).string = LanMgr.getLanById("107549");
        // this._sortMenu.getChildByPath("Content/Rarity").getComponent(Label).string = LanMgr.getLanById("107549");

        NotificationMgr.addListener(NotificationName.CHANGE_LANG, this._refreshBackpackUI, this);
        NotificationMgr.addListener(NotificationName.ITEM_CHANGE, this._refreshBackpackUI, this);
    }

    protected viewDidStart(): void {
        super.viewDidStart();

        this._refreshBackpackUI();
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.CHANGE_LANG, this._refreshBackpackUI, this);
        NotificationMgr.removeListener(NotificationName.ITEM_CHANGE, this._refreshBackpackUI, this);
    }

    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByPath("__ViewContent");
    }

    private async _refreshBackpackUI() {
        this._data = BackpackMgr.getBackpack(this._currentCategoryType, this._currentArrangeType);
        this._backpackContent.removeAllChildren();
        for (let i = 0; i < this._data.length; i++) {
            let itemView = null;
            if (this._data[i] instanceof ItemData) {
                itemView = instantiate(this.itemPrb);
                this._backpackContent.addChild(itemView);
                itemView.getComponent(BackpackItem).refreshUI(this._data[i]);
            } else if (this._data[i] instanceof ArtifactData) {
                itemView = instantiate(this.artifactPrb);
                this._backpackContent.addChild(itemView);
                itemView.getComponent(ArtifactItem).refreshUI(this._data[i]);
            }

            const button = itemView.addComponent(Button);
            button.transition = Button.Transition.SCALE;
            button.zoomScale = 0.9;
            let evthandler = new EventHandler();
            evthandler._componentName = "BackpackUI";
            evthandler.target = this.node;
            evthandler.handler = "onTapItem";
            evthandler.customEventData = i.toString();
            button.clickEvents.push(evthandler);
        }
        this._backpackContent.getComponent(Layout).updateLayout();

        for (let i = 0; i < this._categoryButtons.length; i++) {
            this._categoryButtons[i].getChildByName("Common").active = i != this._currentCategoryType;
            this._categoryButtons[i].getChildByName("Select").active = i == this._currentCategoryType;
            this._categoryButtons[i].getChildByName("Label").getComponent(Label).color =
                i == this._currentCategoryType ? new Color().fromHEX("#423524") : new Color().fromHEX("#7B7370");
        }
    }

    private _refreshMenu() {
        this._sortMenu.active = this._selectSortMenuShow;
        this._menuArrow.angle = this._selectSortMenuShow ? 180 : 0;
        this._sortMenu.getChildByPath("Content/Recently/ImgScreenSelect").active = this._currentArrangeType == BackpackArrangeType.Recently;
        this._sortMenu.getChildByPath("Content/Rarity/ImgScreenSelect").active = this._currentArrangeType == BackpackArrangeType.Rarity;
    }
    //------------------------------------------------------------ action
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        this._selectSortMenuShow = false;
        this._refreshMenu();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
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
            } else if (data instanceof ArtifactData) {
                const result = await UIPanelManger.inst.pushPanel(UIName.ArtifactInfoUI);
                if (result.success) {
                    result.node.getComponent(ArtifactInfoUI).showItem([data]);
                }
            }
        }
    }

    private onTapCategory(event: Event, customEventData: string) {
        const categoryType = parseInt(customEventData) as BackpackCategoryType;
        if (categoryType == this._currentCategoryType) {
            return;
        }
        this._currentCategoryType = categoryType;
        this._refreshBackpackUI();
    }

    private onTapArrange() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._currentSelectArrangeType != null && this._currentSelectArrangeType != this._currentArrangeType) {
            this._currentArrangeType = this._currentSelectArrangeType;
            this._refreshBackpackUI();
        }
    }

    private onTapSortMenuAction() {
        GameMusicPlayMgr.playTapButtonEffect();
        this._selectSortMenuShow = !this._selectSortMenuShow;

        this._refreshMenu();
    }
    private onTapSelectSortCondition(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        if (customEventData == this._currentArrangeType) {
            return;
        }
        this._currentSelectArrangeType = customEventData as BackpackArrangeType;

        switch (this._currentSelectArrangeType) {
            case BackpackArrangeType.Rarity:
                this.node.getChildByPath("__ViewContent/BottomView/Menu/Sort").getComponent(Label).string = this._sortMenu
                    .getChildByPath("Content/Rarity")
                    .getComponent(Label).string;
                break;
            case BackpackArrangeType.Recently:
                this.node.getChildByPath("__ViewContent/BottomView/Menu/Sort").getComponent(Label).string = this._sortMenu
                    .getChildByPath("Content/Recently")
                    .getComponent(Label).string;
                break;
        }

        this._selectSortMenuShow = false;
        this._refreshMenu();
    }
}
