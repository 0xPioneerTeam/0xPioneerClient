import { _decorator, Node, instantiate, Layout, NodeEventType, EventTouch, UITransform, v3, Vec3, rect, Rect, Label, Button, Sprite } from "cc";
import ArtifactData from "../Model/ArtifactData";
import ViewController from "../BasicView/ViewController";
import { UIName } from "../Const/ConstUIDefine";
import { ArtifactInfoUI } from "./ArtifactInfoUI";
import UIPanelManger from "../Basic/UIPanelMgr";
import { ArtifactItem } from "./ArtifactItem";
import { DataMgr } from "../Data/DataMgr";
import { NetworkMgr } from "../Net/NetworkMgr";
import { ArtifactMgr, GameMgr, LanMgr } from "../Utils/Global";
import ArtifactConfig from "../Config/ArtifactConfig";
import { GameExtraEffectType } from "../Const/ConstDefine";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import LongPressButton from "../BasicView/LongPressButton";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("RelicTowerSelectUI")
export class RelicTowerSelectUI extends ViewController {
    private _index: number = -1;

    private _originalSelectedItem: ArtifactData = null;
    private _selectedItem: ArtifactData = null;
    private _itemDatas: ArtifactData[] = null;

    private _itemContent: Node = null;
    private _itemView: Node = null;

    public configuration(index: number) {
        this._index = index;

        this._originalSelectedItem = DataMgr.s.artifact.getObj_by_effectIndex(this._index);
        this._selectedItem = this._originalSelectedItem;
        this._refreshUI();
    }

    protected viewDidLoad(): void {
        super.viewDidLoad();

        // this.node.getChildByPath("__ViewContent/Info/NoOccupied/Label").getComponent(Label).string = LanMgr.getLanById("lanreplace200018");
        // this.node.getChildByPath("__ViewContent/ConfirmButton/item").getComponent(Label).string = LanMgr.getLanById("lanreplace200020");

        this._itemContent = this.node.getChildByPath("__ViewContent/Artifacts/ScrollView/View/Content");
        this._itemView = this._itemContent.getChildByPath("Item");
        // this._itemView.getChildByPath("Effect/Working").getComponent(Label).string = LanMgr.getLanById("lanreplace200019");
        this._itemView.removeFromParent();
    }
    protected viewDidStart(): void {
        super.viewDidStart();
    }
    protected viewDidDestroy(): void {
        super.viewDidDestroy();
    }
    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByName("__ViewContent");
    }

    private async _refreshUI() {
        const infoContentView = this.node.getChildByPath("__ViewContent/Info");
        const emptyView = infoContentView.getChildByPath("NoOccupied");
        const selectedView = infoContentView.getChildByPath("SelectOccupied");

        if (this._selectedItem == undefined) {
            emptyView.active = true;
            selectedView.active = false;
        } else {
            const config = ArtifactConfig.getById(this._selectedItem.artifactConfigId);
            emptyView.active = false;
            selectedView.active = true;
            if (config != null) {
                selectedView.getChildByPath("Shadow/Item/Prop/Icon").getComponent(Sprite).spriteFrame = await ArtifactMgr.getItemIcon(config.icon);
                selectedView.getChildByPath("Name/Name").getComponent(Label).string = LanMgr.getLanById(config.name);
            }
            const effectData = DataMgr.s.artifact.getEffectDataByUniqueId(this._selectedItem.uniqueId, DataMgr.s.userInfo.data.level);
            let effectString: string = "Effect:";
            effectData.forEach((value: number, key: GameExtraEffectType) => {
                effectString += "\n" + GameMgr.getEffectShowText(key, value);
            });
            selectedView.getChildByPath("Desc/Effect").getComponent(Label).string = effectString;
        }

        this._itemDatas = DataMgr.s.artifact.getObj();
        this._itemDatas.sort((a, b) => {
            if (a.effectIndex >= 0 && b.effectIndex < 0) return 1;
            if (a.effectIndex < 0 && b.effectIndex >= 0) return -1;
        });

        this._itemContent.destroyAllChildren();
        for (let i = 0; i < this._itemDatas.length; i++) {
            const config = ArtifactConfig.getById(this._itemDatas[i].artifactConfigId);
            if (config == null) {
                continue;
            }
            const itemView = instantiate(this._itemView);
            itemView.setParent(this._itemContent);
            for (let j = 1; j <= 5; j++) {
                itemView.getChildByPath("Prop/Level" + j).active = j == config.rank;
            }
            itemView.getChildByPath("Prop/Icon").getComponent(Sprite).spriteFrame = await ArtifactMgr.getItemIcon(config.icon);

            itemView.getChildByPath("Selected").active = this._itemDatas[i] == this._selectedItem;
            itemView.getChildByPath("Effect").active = this._itemDatas[i].effectIndex >= 0;
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
        this._selectedItem = null;
        this._refreshUI();
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
        this._selectedItem = this._itemDatas[index];
        this._refreshUI();
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
    private async onTapConfirm() {
        if (this._selectedItem == null) {
            if (this._originalSelectedItem != null) {
                NetworkMgr.websocketMsg.player_artifact_change({
                    artifactId: this._originalSelectedItem.uniqueId,
                    artifactEffectIndex: -1,
                });
            }
        } else {
            NetworkMgr.websocketMsg.player_artifact_change({
                artifactId: this._selectedItem.uniqueId,
                artifactEffectIndex: this._index,
            });
        }
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }
}
