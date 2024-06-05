import { _decorator, Label, Node, Button, EventHandler, Prefab, instantiate, Layout } from "cc";
import ArtifactData from "../Model/ArtifactData";
import { ArtifactItem } from "./ArtifactItem";
import { ArtifactMgr, LanMgr } from "../Utils/Global";
import ViewController from "../BasicView/ViewController";
import { UIName } from "../Const/ConstUIDefine";
import { ArtifactInfoUI } from "./ArtifactInfoUI";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import UIPanelManger from "../Basic/UIPanelMgr";
import { DataMgr } from "../Data/DataMgr";
import { BackpackArrangeType } from "../Const/ConstDefine";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("ArtifactUI")
export class ArtifactUI extends ViewController {
    @property(Prefab)
    private itemPrb: Prefab = null;

    private _selectSortMenuShow: boolean = false;
    private _currentArrangeType: BackpackArrangeType = null;
    private _itemDatas: ArtifactData[] = null;

    private _itemContent: Node = null;
    private _allItemViews: Node[] = null;
    private _sortMenu: Node = null;
    private _menuArrow: Node = null;
    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._sortMenu = this.node.getChildByPath("__ViewContent/SortMenu");
        this._sortMenu.active = false;

        this._menuArrow = this.node.getChildByPath("__ViewContent/Bg/SortView/Menu/Arrow");

        this._currentArrangeType = BackpackArrangeType.Recently;

        this._itemContent = this.node.getChildByPath("__ViewContent/Bg/ScrollView/View/Content");

        NotificationMgr.addListener(NotificationName.CHANGE_LANG, this._refreshArtifactUI, this);
        NotificationMgr.addListener(NotificationName.ARTIFACT_CHANGE, this._refreshArtifactUI, this);
    }

    protected viewDidStart(): void {
        super.viewDidStart();

        this._allItemViews = [];
        for (let i = 0; i < DataMgr.s.artifact.getObj_artifact_maxLength(); i++) {
            let itemView = instantiate(this.itemPrb);
            itemView.active = true;

            const button = itemView.addComponent(Button);
            button.transition = Button.Transition.SCALE;
            button.zoomScale = 0.9;
            let evthandler = new EventHandler();
            evthandler._componentName = "ArtifactUI";
            evthandler.target = this.node;
            evthandler.handler = "onTapItem";
            button.clickEvents.push(evthandler);

            itemView.parent = this._itemContent;
            this._allItemViews.push(itemView);
        }
        this._itemContent.getComponent(Layout).updateLayout();

        this._refreshArtifactUI();
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.CHANGE_LANG, this._refreshArtifactUI, this);
        NotificationMgr.removeListener(NotificationName.ARTIFACT_CHANGE, this._refreshArtifactUI, this);
    }

    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByName("__ViewContent");
    }

    private async _refreshArtifactUI() {
        if (this._allItemViews == null) {
            return;
        }
        // useLanMgr
        // this.node.getChildByPath("__ViewContent/Bg/title").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("__ViewContent/Bg/QuantityLabel").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("__ViewContent/Bg/SortView/Title").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("__ViewContent/Bg/SortView/Menu/Sort").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("__ViewContent/Bg/ArrangeButton/Label").getComponent(Label).string = LanMgr.getLanById("107549");
        // this._sortMenu.getChildByPath("Content/Recently").getComponent(Label).string = LanMgr.getLanById("107549");
        // this._sortMenu.getChildByPath("Content/Rarity").getComponent(Label).string = LanMgr.getLanById("107549");

        const items = DataMgr.s.artifact.getObj();
        this._itemDatas = items;

        for (let i = 0; i < this._allItemViews.length; i++) {
            const itemView = this._allItemViews[i];
            itemView.getComponent(ArtifactItem).refreshUI(i < items.length ? items[i] : null);
            itemView.getComponent(Button).clickEvents[0].customEventData = i.toString();
        }
        this.node.getChildByPath("__ViewContent/Bg/QuantityNum").getComponent(Label).string =
            items.length + "/" + DataMgr.s.artifact.getObj_artifact_maxLength();
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
        if (index < this._itemDatas.length) {
            const itemData = this._itemDatas[index];
            const result = await UIPanelManger.inst.pushPanel(UIName.ArtifactInfoUI);
            if (result.success) {
                result.node.getComponent(ArtifactInfoUI).showItem([itemData]);
            }
        }
    }
    private onTapArrange() {
        GameMusicPlayMgr.playTapButtonEffect();
        DataMgr.s.artifact.getObj_artifact_sort(this._currentArrangeType);
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
        this._currentArrangeType = customEventData as BackpackArrangeType;

        switch (this._currentArrangeType) {
            case BackpackArrangeType.Rarity:
                this.node.getChildByPath("__ViewContent/Bg/SortView/Menu/Sort").getComponent(Label).string = this._sortMenu
                    .getChildByPath("Content/Rarity")
                    .getComponent(Label).string;
                break;
            case BackpackArrangeType.Recently:
                this.node.getChildByPath("__ViewContent/Bg/SortView/Menu/Sort").getComponent(Label).string = this._sortMenu
                    .getChildByPath("Content/Recently")
                    .getComponent(Label).string;
                break;
        }

        this._selectSortMenuShow = false;
        this._refreshMenu();
    }
}
