import {
    _decorator,
    Label,
    Node,
    Button,
    EventHandler,
    Prefab,
    instantiate,
    Layout,
    Event,
    NodeEventType,
    EventTouch,
    ScrollView,
    UITransform,
    v3,
    Vec3,
    rect,
    Rect,
    Sprite,
    Color,
} from "cc";
import ArtifactData from "../Model/ArtifactData";
import { GameMgr, LanMgr } from "../Utils/Global";
import ViewController from "../BasicView/ViewController";
import { HUDName, UIName } from "../Const/ConstUIDefine";
import { ArtifactInfoUI } from "./ArtifactInfoUI";
import UIPanelManger, { UIPanelLayerType } from "../Basic/UIPanelMgr";
import { ArtifactItem1 } from "./ArtifactItem1";
import { ArtifactItem } from "./ArtifactItem";
import { InnerBuildingType } from "../Const/BuildingDefine";
import InnerBuildingLvlUpConfig from "../Config/InnerBuildingLvlUpConfig";
import { DataMgr } from "../Data/DataMgr";
import { WebsocketMsg, s2c_user } from "../Net/msg/WebsocketMsg";
import { NetworkMgr } from "../Net/NetworkMgr";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import { GameExtraEffectType } from "../Const/ConstDefine";
import ArtifactConfig from "../Config/ArtifactConfig";
import LongPressButton from "../BasicView/LongPressButton";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
import { RelicTowerSelectUI } from "./RelicTowerSelectUI";
import { RedPointView } from "./View/RedPointView";
import { AlterTipView } from "./View/AlterTipView";
const { ccclass, property } = _decorator;

@ccclass("RelicTowerUI")
export class RelicTowerUI extends ViewController {
    public configuration(showIndex: number) {
        this._showIndex = showIndex;
        this._refreshUI();
    }

    private _effectLimit: number = 1;
    private _showIndex: number = 0;

    private _invokeSelectRank: number = 0;
    private _invokeStorageDatas: ArtifactData[] = [];
    private _invokeSelectDatas: ArtifactData[] = [];
    private _newArtifactIds: string[] = [];
    private _compositeData: ArtifactData = null;

    private _onEffectView: Node = null;
    private _effectContent: Node = null;
    private _effectView: Node = null;
    private _currentSlotViews: Node[] = [];

    private _storageView: Node = null;
    private _storageItemContent: Node = null;
    private _storageItem: Node = null;
    private _invokeSlotItems: Node[] = [];
    private _compositeItem: Node = null;

    private _tabButtons: Node[] = [];

    protected viewDidLoad(): void {
        super.viewDidLoad();

        // this.node.getChildByPath("__ViewContent/Bg/title").getComponent(Label).string = LanMgr.getLanById("lanreplace200021");
        // this.node.getChildByPath("__ViewContent/Bg/tabButtons/OnEffectButton/Label").getComponent(Label).string = LanMgr.getLanById("lanreplace200022");
        // this.node.getChildByPath("__ViewContent/Bg/tabButtons/StorageButton/Label").getComponent(Label).string = LanMgr.getLanById("lanreplace200023");
        // this.node.getChildByPath("__ViewContent/Bg/Storage/RightContent/InvokeButton/Label").getComponent(Label).string = LanMgr.getLanById("lanreplace200025");
        // this.node.getChildByPath("__ViewContent/Bg/Storage/RightContent/GetButton/Label").getComponent(Label).string = LanMgr.getLanById("lanreplace200026");


        this._onEffectView = this.node.getChildByPath("__ViewContent/Bg/OnEffect");
        this._storageView = this.node.getChildByPath("__ViewContent/Bg/Storage");

        //------------------------------------------------ on effect init
        const buildingLevel = DataMgr.s.innerBuilding.getInnerBuildingLevel(InnerBuildingType.ArtifactStore);
        this._onEffectView.getChildByPath("LeftContent/LevelTitle").getComponent(Label).string = "Lv " + buildingLevel;

        this._effectContent = this._onEffectView.getChildByPath("LeftContent/ScrollView/View/Content");
        this._effectView = this._effectContent.getChildByPath("Item");
        this._effectView.removeFromParent();

        const onEffectBtn = this.node.getChildByPath("__ViewContent/Bg/tabButtons/OnEffectButton");
        const storageBtn = this.node.getChildByPath("__ViewContent/Bg/tabButtons/StorageButton");
        this._tabButtons = [onEffectBtn, storageBtn];

        const relicMax: number = InnerBuildingLvlUpConfig.getBuildingLevelData(buildingLevel, "relic_max");
        if (relicMax != null) {
            this._effectLimit = relicMax;
        }
        const level1View = this._onEffectView.getChildByPath("RightContent/Level_1");
        const level2View = this._onEffectView.getChildByPath("RightContent/Level_2");
        const level3View = this._onEffectView.getChildByPath("RightContent/Level_3");

        level1View.active = false;
        level2View.active = false;
        level3View.active = false;

        let slotContentView: Node = null;
        if (this._effectLimit <= 5) {
            slotContentView = level1View;
        } else if (this._effectLimit <= 9) {
            slotContentView = level2View;
        } else {
            slotContentView = level3View;
        }

        this._currentSlotViews = [];
        if (slotContentView != null) {
            slotContentView.active = true;
            for (const child of slotContentView.children) {
                this._currentSlotViews.push(child);
            }
        }
        //------------------------------------------------ storage
        this._storageItemContent = this._storageView.getChildByPath("LeftContent/ScrollView/View/Content");
        this._storageItem = this._storageItemContent.getChildByPath("Item");
        // this._storageItem.getChildByPath("EffectTitle").getComponent(Label).string = LanMgr.getLanById("lanreplace200024");
        this._storageItem.removeFromParent();

        this._invokeSlotItems = [];
        for (let i = 0; i < 3; i++) {
            this._invokeSlotItems.push(this._storageView.getChildByPath("RightContent/Item_" + i));
        }
        this._compositeItem = this._storageView.getChildByPath("RightContent/Compose");

        NotificationMgr.addListener(NotificationName.ARTIFACT_EQUIP_DID_CHANGE, this._refreshUI, this);
        NotificationMgr.addListener(NotificationName.ARTIFACTPACK_GET_NEW_ARTIFACT, this._refreshUI, this);
        NotificationMgr.addListener(NotificationName.ARTIFACTPACK_READ_NEW_ARTIFACT, this._refreshUI, this);

        NetworkMgr.websocket.on("player_artifact_combine_res", this._onPlayerArtifactCombine);
    }
    protected viewDidStart(): void {
        super.viewDidStart();
    }
    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.ARTIFACT_EQUIP_DID_CHANGE, this._refreshUI, this);
        NotificationMgr.removeListener(NotificationName.ARTIFACTPACK_GET_NEW_ARTIFACT, this._refreshUI, this);
        NotificationMgr.removeListener(NotificationName.ARTIFACTPACK_READ_NEW_ARTIFACT, this._refreshUI, this);

        NetworkMgr.websocket.off("player_artifact_combine_res", this._onPlayerArtifactCombine);
    }
    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByName("__ViewContent");
    }

    private _refreshUI() {
        for (let i = 0; i < this._tabButtons.length; i++) {
            this._tabButtons[i].getChildByName("BtnPageLight").active = i == this._showIndex;
            this._tabButtons[i].getChildByName("BtnPageDark").active = i != this._showIndex;
            this._tabButtons[i].getChildByName("Label").getComponent(Label).color = i == this._showIndex ? new Color(66, 53, 35) : new Color(122, 114, 111);
        }

        let hasRedPoint: boolean = false;
        for (let i = 0; i < this._currentSlotViews.length; i++) {
            const locked: boolean = !(i < this._effectLimit);
            if (locked) {
                continue;
            }
            if (DataMgr.s.artifact.getOnEffectHasNew(i)) {
                hasRedPoint = true;
                break;
            }
        }
        this._tabButtons[0].getChildByPath("RedPointView").getComponent(RedPointView).refreshUI(hasRedPoint ? 1 : 0, false);
        this._tabButtons[1].getChildByPath("RedPointView").getComponent(RedPointView).refreshUI(DataMgr.s.artifact.getAllNewArtifactCount());

        if (this._showIndex == 0) {
            this._onEffectView.active = true;
            this._storageView.active = false;

            if (this._currentSlotViews.length <= 0) {
                return;
            }

            const effectData = DataMgr.s.artifact.getAllEffectiveEffect(DataMgr.s.userInfo.data.level);
            this._effectContent.destroyAllChildren();
            effectData.forEach((value: number, key: GameExtraEffectType) => {
                const effectItem = instantiate(this._effectView);
                effectItem.setParent(this._effectContent);
                effectItem.getChildByPath("Effect").getComponent(Label).string = GameMgr.getEffectShowText(key, value);
            });
            this._effectContent.getComponent(Layout).updateLayout();

            const artifacts = DataMgr.s.artifact.getObj_artifact_equiped();
            for (let i = 0; i < this._currentSlotViews.length; i++) {
                const locked: boolean = !(i < this._effectLimit);
                let data: ArtifactData = null;
                for (const temp of artifacts) {
                    if (i == temp.effectIndex) {
                        data = temp;
                        break;
                    }
                }
                const itemView = this._currentSlotViews[i];
                //is main
                itemView.getChildByPath("Main").active = i == 0 || i == 5 || i == 9;
                //is locked
                itemView.getChildByPath("Lock").active = locked;

                itemView.getComponent(ArtifactItem1).refreshUI(data);

                itemView.getChildByPath("Prop").setSiblingIndex(98);

                let canRed: boolean = false;
                if (!locked) {
                    canRed = DataMgr.s.artifact.getOnEffectHasNew(i);
                }
                const redPointView = itemView.getChildByPath("RedPointView").getComponent(RedPointView);
                redPointView.refreshUI(canRed ? 1 : 0, false);
                redPointView.node.setSiblingIndex(99);

                itemView.getComponent(LongPressButton).shortClick[0].customEventData = i.toString();
                itemView.getComponent(LongPressButton).shortClickInteractable = !locked;
                itemView.getComponent(LongPressButton).longPress[0].customEventData = data == null ? "" : data.uniqueId;
                itemView.getComponent(LongPressButton).longPressInteractable = data != null;
            }
        } else {
            this._onEffectView.active = false;
            this._storageView.active = true;

            this._storageItemContent.destroyAllChildren();

            this._invokeStorageDatas = [];
            if (this._invokeSelectRank > 0) {
                this._invokeStorageDatas = DataMgr.s.artifact.getByRank(this._invokeSelectRank).slice();
            } else {
                this._invokeStorageDatas = DataMgr.s.artifact.getObj().slice();
            }
            this._invokeStorageDatas.sort((a, b) => {
                if (a.effectIndex === -1 && b.effectIndex !== -1) {
                    return -1;
                } else if (a.effectIndex !== -1 && b.effectIndex === -1) {
                    return 1;
                } else {
                    return 0;
                }
            });
            for (let i = 0; i < this._invokeStorageDatas.length; i++) {
                if (this._compositeData != null && this._invokeStorageDatas[i].uniqueId == this._compositeData.uniqueId) {
                    this._invokeStorageDatas.splice(i, 1);
                    i--;
                    continue;
                }
                let isSelected: boolean = false;
                for (const data of this._invokeSelectDatas) {
                    if (data.uniqueId == this._invokeStorageDatas[i].uniqueId) {
                        isSelected = true;
                        break;
                    }
                }
                if (isSelected) {
                    this._invokeStorageDatas.splice(i, 1);
                    i--;
                }
            }
            for (let i = 0; i < this._invokeStorageDatas.length; i++) {
                const config = ArtifactConfig.getById(this._invokeStorageDatas[i].artifactConfigId);
                if (config == null) {
                    continue;
                }
                const view = instantiate(this._storageItem);
                view.getComponent(ArtifactItem).refreshUI(this._invokeStorageDatas[i], true);
                view.setParent(this._storageItemContent);
                view.getChildByPath("OnEffectBg").active = this._invokeStorageDatas[i].effectIndex >= 0;
                view.getChildByPath("EffectTitle").active = this._invokeStorageDatas[i].effectIndex >= 0;
                // view.getChildByPath("New").active = this._newArtifactIds.indexOf(this._invokeStorageDatas[i].uniqueId) != -1;
                view.getChildByPath("New").active = false;

                view.getComponent(LongPressButton).shortClick[0].customEventData = i.toString();
                view.getComponent(LongPressButton).shortClickInteractable = this._invokeStorageDatas[i].effectIndex < 0 && config.rank < 5;

                view.getComponent(LongPressButton).longPress[0].customEventData = i.toString();
            }

            for (let i = 0; i < this._invokeSlotItems.length; i++) {
                const item = this._invokeSlotItems[i];
                item.getComponent(ArtifactItem).refreshUI(this._invokeSelectDatas[i]);
                item.getComponent(LongPressButton).shortClick[0].customEventData = i.toString();
                item.getComponent(LongPressButton).shortClickInteractable = this._invokeSelectDatas[i] != undefined;

                item.getComponent(LongPressButton).longPress[0].customEventData = i.toString();
                item.getComponent(LongPressButton).longPressInteractable = this._invokeSelectDatas[i] != undefined;
            }

            const invokeButton = this._storageView.getChildByPath("RightContent/InvokeButton");
            const getButton = this._storageView.getChildByPath("RightContent/GetButton");
            const rButton = this._storageView.getChildByPath("RightContent/RButton");

            if (this._compositeData != null) {
                invokeButton.active = false;
                getButton.active = true;
            } else {
                invokeButton.active = true;
                invokeButton.getComponent(Button).interactable = this._invokeSelectDatas.length == 3;
                invokeButton.getComponent(Sprite).grayscale = this._invokeSelectDatas.length < 3;
                getButton.active = false;
            }
            rButton.active = this._invokeSelectDatas.length > 0;

            this._compositeItem.getComponent(ArtifactItem).refreshUI(this._compositeData);
            this._compositeItem.getComponent(LongPressButton).shortClickInteractable = false;
            this._compositeItem.getComponent(LongPressButton).longPressInteractable = this._compositeData != null;
        }
    }

    //------------------------------------------------------------ action
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
        DataMgr.s.artifact.readAllNewArtifact();
    }
    private onTapOnEffectTab() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._showIndex == 0) {
            return;
        }
        this._showIndex = 0;
        this._refreshUI();
    }
    private onTapStorageTab() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._showIndex == 1) {
            return;
        }
        this._showIndex = 1;
        this._refreshUI();
    }
    //------------------------------------------------------------ on effect
    private async onTapSlotItem(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const index = parseInt(customEventData);
        const result = await UIPanelManger.inst.pushPanel(UIName.RelicTowerSelectUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(RelicTowerSelectUI).configuration(index);
    }
    private async onLongTapSlotItem(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const data = DataMgr.s.artifact.getByUnqueId(customEventData);
        if (data == undefined) {
            return;
        }
        const result = await UIPanelManger.inst.pushPanel(UIName.ArtifactInfoUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(ArtifactInfoUI).showItem([data]);
    }
    //------------------------------------------------------------ storage
    private onTapInvokeSelectItem(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._compositeData != null) {
            return;
        }
        if (this._invokeSelectDatas.length >= 3) {
            return;
        }
        const index = parseInt(customEventData);
        if (index < 0 || index > this._invokeStorageDatas.length - 1) {
            return;
        }
        const data = this._invokeStorageDatas[index];
        // red point
        DataMgr.s.artifact.readNewArtifactById(data.uniqueId);

        this._invokeSelectDatas.push(data);
        if (this._invokeSelectDatas.length == 1) {
            // first select, confrim rank
            const config = ArtifactConfig.getById(this._invokeSelectDatas[0].artifactConfigId);
            this._invokeSelectRank = config?.rank;
        }
        this._refreshUI();
    }
    private async onLongTapInvokeSelectItem(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const index = parseInt(customEventData);
        if (index < 0 || index > this._invokeStorageDatas.length - 1) {
            return;
        }
        const data = this._invokeStorageDatas[index];
        //red point
        DataMgr.s.artifact.readNewArtifactById(data.uniqueId);

        const result = await UIPanelManger.inst.pushPanel(UIName.ArtifactInfoUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(ArtifactInfoUI).showItem([data]);
    }
    private onTapSelectedItem(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const index = parseInt(customEventData);
        if (index < 0 || index > this._invokeSelectDatas.length - 1) {
            return;
        }
        this._invokeSelectDatas.splice(index, 1);
        if (this._invokeSelectDatas.length <= 0) {
            this._invokeSelectRank = 0;
        }
        this._refreshUI();
    }
    private async onLongTapSelectedItem(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const index = parseInt(customEventData);
        if (index < 0 || index > this._invokeSelectDatas.length - 1) {
            return;
        }
        const data = this._invokeSelectDatas[index];
        const result = await UIPanelManger.inst.pushPanel(UIName.ArtifactInfoUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(ArtifactInfoUI).showItem([data]);
    }

    private onTapInvoke() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._invokeSelectDatas.length != 3) {
            return;
        }
        const uniqueIds = [];
        for (const data of this._invokeSelectDatas) {
            uniqueIds.push(data.uniqueId);
        }
        NetworkMgr.websocketMsg.player_artifact_combine({
            artifactIds: uniqueIds,
        });
    }
    private onTapR() {
        GameMusicPlayMgr.playTapButtonEffect();
        this._invokeSelectRank = 0;
        this._invokeSelectDatas = [];
        this._refreshUI();
    }
    private onTapGet() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._compositeData == null) {
            return;
        }
        this._newArtifactIds.push(this._compositeData.uniqueId);
        this._compositeData = null;
        this._refreshUI();
    }
    private async onLongTapComposedItem() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._compositeData == null) {
            return;
        }
        const result = await UIPanelManger.inst.pushPanel(UIName.ArtifactInfoUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(ArtifactInfoUI).showItem([this._compositeData]);
    }
    private async onTapQuestion() {
        GameMusicPlayMgr.playTapButtonEffect();
        const result = await UIPanelManger.inst.pushPanel(HUDName.AlterTip, UIPanelLayerType.HUD);
        if (!result.success) {
            return;
        }
        result.node.getComponent(AlterTipView).showTip(LanMgr.getLanById("106021"));
    }
    //-------------------------------------------------------------------------
    private _onPlayerArtifactCombine = (e: any) => {
        const p: s2c_user.Iplayer_artifact_combine_res = e.data;
        if (p.res !== 1) {
            return;
        }
        this._invokeSelectDatas = [];
        this._invokeSelectRank = 0;
        for (const artifact of p.data) {
            if (artifact.count > 0) {
                const change = new ArtifactData(artifact.artifactConfigId, artifact.count);
                change.addTimeStamp = artifact.addTimeStamp;
                change.effectIndex = artifact.effectIndex;
                change.uniqueId = artifact.uniqueId;
                change.effect = artifact.effect;
                this._compositeData = change;
                break;
            }
        }
        this._refreshUI();
    };
}
