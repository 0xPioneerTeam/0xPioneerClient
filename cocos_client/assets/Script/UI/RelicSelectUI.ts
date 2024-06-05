import { _decorator, Node, instantiate, Layout, NodeEventType, EventTouch, UITransform, v3, Vec3, rect, Rect, Label, Button } from "cc";
import ArtifactData from "../Model/ArtifactData";
import ViewController from "../BasicView/ViewController";
import { UIName } from "../Const/ConstUIDefine";
import { ArtifactInfoUI } from "./ArtifactInfoUI";
import UIPanelManger from "../Basic/UIPanelMgr";
import { ArtifactItem } from "./ArtifactItem";
import ManualNestedScrollView from "../BasicView/ManualNestedScrollView";
import { DataMgr } from "../Data/DataMgr";
import { NetworkMgr } from "../Net/NetworkMgr";
import { GameMgr, LanMgr } from "../Utils/Global";
import ArtifactConfig from "../Config/ArtifactConfig";
import { GameExtraEffectType } from "../Const/ConstDefine";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import LongPressButton from "../BasicView/LongPressButton";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("RelicSelectUI")
export class RelicSelectUI extends ViewController {
    private _index: number = -1;
    private _isInMainSlot: boolean = false;
    private _selectedItem: ArtifactData = null;
    private _itemDatas: ArtifactData[] = null;

    private _effectContent: Node = null;
    private _effectView: Node = null;

    private _itemContent: Node = null;
    private _itemView: Node = null;

    public configuration(index: number) {
        this._index = index;
        this._isInMainSlot = index == 0 || index == 5 || index == 9;
        this._refreshUI();
    }

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._effectContent = this.node.getChildByPath("__ViewContent/Bg/LeftContent/Selected/ScrollView/View/Content");
        this._effectView = this._effectContent.getChildByPath("Item");
        this._effectView.removeFromParent();

        this._itemContent = this.node.getChildByPath("__ViewContent/Bg/RightContent/ScrollView/View/Content");
        this._itemView = this._itemContent.getChildByPath("Item");
        this._itemView.removeFromParent();

        NotificationMgr.addListener(NotificationName.ARTIFACT_EQUIP_DID_CHANGE, this._refreshUI, this);
    }
    protected viewDidStart(): void {
        super.viewDidStart();
    }
    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.ARTIFACT_EQUIP_DID_CHANGE, this._refreshUI, this);
    }
    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByName("__ViewContent");
    }

    private _refreshUI() {
        this._selectedItem = DataMgr.s.artifact.getObj_by_effectIndex(this._index);

        const leftContentView = this.node.getChildByPath("__ViewContent/Bg/LeftContent");
        const emptyView = leftContentView.getChildByPath("Empty");
        const selectedView = leftContentView.getChildByPath("Selected");

        if (this._selectedItem == undefined) {
            emptyView.active = true;
            selectedView.active = false;
        } else {
            emptyView.active = false;
            selectedView.active = true;
            selectedView.getChildByPath("Item").getComponent(ArtifactItem).refreshUI(this._selectedItem);

            const config = ArtifactConfig.getById(this._selectedItem.artifactConfigId);
            if (config != null) {
                selectedView.getChildByPath("Name").getComponent(Label).string = LanMgr.getLanById(config.name);
            }
            const effectData = DataMgr.s.artifact.getEffectDataByUniqueId(this._selectedItem.uniqueId, DataMgr.s.userInfo.data.level);
            this._effectContent.destroyAllChildren();
            effectData.forEach((value: number, key: GameExtraEffectType) => {
                const effectItem = instantiate(this._effectView);
                effectItem.setParent(this._effectContent);
                effectItem.getChildByPath("Effect").getComponent(Label).string = GameMgr.getEffectShowText(key, value);
            });
            this._effectContent.getComponent(Layout).updateLayout();
        }

        this._itemDatas = DataMgr.s.artifact.getObj();
        this._itemDatas.sort((a, b)=> {
            if (a.effectIndex >= 0 && b.effectIndex < 0) return 1;
            if (a.effectIndex < 0 && b.effectIndex >= 0) return -1;
        });

        this._itemContent.destroyAllChildren();
        for (let i = 0; i < this._itemDatas.length; i++) {
            const itemView = instantiate(this._itemView);
            itemView.setParent(this._itemContent);
            itemView.getComponent(ArtifactItem).refreshUI(this._itemDatas[i]);
            itemView.getChildByPath("EffectTitle").active = this._itemDatas[i].effectIndex >= 0;
            itemView.getComponent(LongPressButton).shortClick[0].customEventData = i.toString();
            itemView.getComponent(LongPressButton).longPress[0].customEventData = i.toString();
        }
    }

    
    //------------------------------------------------------------ action
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }
    private onTapCurrentSelectItem() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._selectedItem == null) {
            return;
        }
        NetworkMgr.websocketMsg.player_artifact_change({
            artifactId: this._selectedItem.uniqueId,
            artifactEffectIndex: -1
        });
    }
    private async onLongTapCurrentSelectItem() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._selectedItem == null) {
            return;
        }
        const result = await UIPanelManger.inst.pushPanel(UIName.ArtifactInfoUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(ArtifactInfoUI).showItem([this._selectedItem]);
    }
    private onTapItem(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const index = parseInt(customEventData);
        if (index < 0 || index > this._itemDatas.length - 1) {
            return;
        }
        const data = this._itemDatas[index];
        NetworkMgr.websocketMsg.player_artifact_change({
            artifactId: data.uniqueId,
            artifactEffectIndex: this._index
        });
    }
    private async onLongTapItem(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const index = parseInt(customEventData);
        if (index < 0 || index > this._itemDatas.length - 1) {
            return;
        }
        const data = this._itemDatas[index];
        const result = await UIPanelManger.inst.pushPanel(UIName.ArtifactInfoUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(ArtifactInfoUI).showItem([data]);
    }
}
