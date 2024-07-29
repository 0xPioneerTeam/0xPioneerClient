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
    RichText,
    randomRangeInt,
    Layout,
    Color,
    pingPong,
} from "cc";
import { GameRankColor, ResourceCorrespondingItem } from "../Const/ConstDefine";
import { ArtifactItem } from "./ArtifactItem";
import { LanMgr } from "../Utils/Global";
import ArtifactData from "../Model/ArtifactData";
import ViewController from "../BasicView/ViewController";
import { HUDName, UIName } from "../Const/ConstUIDefine";
import { UIHUDController } from "./UIHUDController";
import ArtifactConfig from "../Config/ArtifactConfig";
import ArtifactEffectConfig from "../Config/ArtifactEffectConfig";
import ItemData, { ItemConfigType } from "../Const/Item";
import UIPanelManger, { UIPanelLayerType } from "../Basic/UIPanelMgr";
import { DataMgr } from "../Data/DataMgr";
import { share } from "../Net/msg/WebsocketMsg";
import { NetworkMgr } from "../Net/NetworkMgr";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
import ItemConfig from "../Config/ItemConfig";
import ConfigConfig from "../Config/ConfigConfig";
import { ConfigType, SelectFromThreeGetAllCostCoefficientParam } from "../Const/Config";
import { AlterView } from "./View/AlterView";
import { RookieStep } from "../Const/RookieDefine";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import { BackpackItem } from "./BackpackItem";
const { ccclass, property } = _decorator;

@ccclass("ItemSelectFromThreeUI")
export class ItemSelectFromThreeUI extends ViewController {
    private _boxIndex: number;
    private _getAllPiotCostNum: number;

    private _itemView: Node = null;

    public async showItem(boxIndex: number, threes: share.Iartifact_three_conf[]) {
        this.node.getChildByPath("__ViewContent/Title").getComponent(Label).string = LanMgr.getLanById("200004");
        // useLanMgr
        // this.node.getChildByPath("__ViewContent/GetAllBtn/Title").getComponent(Label).string = LanMgr.getLanById("107549");
        if (threes.length != 3) {
            UIPanelManger.inst.popPanel(this.node);
            return;
        }
        this._boxIndex = boxIndex;
        this._getAllPiotCostNum = 0;
        const costCoefficient: number = (ConfigConfig.getConfig(ConfigType.SelectFromThreeGetAllCostCoefficient) as SelectFromThreeGetAllCostCoefficientParam)
            .coefficient;
        const content = this.node.getChildByPath("__ViewContent/ImgTextBg/SelectContent").getComponent(Layout);
        for (let i = 0; i < threes.length; i++) {
            let rank: number = 0;
            let name: string = "";
            let title: string = "";
            let desc: string = "";
            let data: ItemData | ArtifactData = null;
            if (threes[i].type == ItemConfigType.Item) {
                const itemConfig = ItemConfig.getById(threes[i].propId);
                if (itemConfig == null) {
                    continue;
                }
                rank = itemConfig.grade;
                name = "";
                title = LanMgr.getLanById(itemConfig.itemName) + "*" + threes[i].num;
                desc = LanMgr.getLanById(itemConfig.itemDesc);
                data = new ItemData(threes[i].propId, threes[i].num);
            } else if (threes[i].type == ItemConfigType.Artifact) {
                const artifactConfig = ArtifactConfig.getById(threes[i].propId);
                if (artifactConfig == null) {
                    continue;
                }
                rank = artifactConfig.rank;
                name = LanMgr.getLanById(artifactConfig.name);
                if (rank == 1) {
                    title = LanMgr.getLanById("105001");
                } else if (rank == 2) {
                    title = LanMgr.getLanById("105002");
                } else if (rank == 3) {
                    title = LanMgr.getLanById("105003");
                } else if (rank == 4) {
                    title = LanMgr.getLanById("105004");
                } else if (rank == 5) {
                    title = LanMgr.getLanById("105005");
                }
                if (artifactConfig.effect.length > 0) {
                    const firstEffectConfig = ArtifactEffectConfig.getById(artifactConfig.effect[0]);
                    desc = LanMgr.getLanById(firstEffectConfig.des);
                }
                data = new ArtifactData(threes[i].propId, threes[i].num);
            }
            if (rank == 0) {
                continue;
            }

            this._getAllPiotCostNum += rank;

            let useColor: Color = GameRankColor[rank - 1];

            const tempView = instantiate(this._itemView);
            tempView.active = true;

            // bg
            for (let j = 1; j <= 5; j++) {
                const rankBgView = tempView.getChildByPath("Bg/Rank_" + j);
                rankBgView.active = rank == j;
                if (rankBgView.active) {
                    rankBgView.getChildByPath("Anim").active = threes[i].type == ItemConfigType.Artifact;
                }
            }

            // name
            tempView.getChildByName("Name").getComponent(Label).string = name;
            tempView.getChildByName("Name").getComponent(Label).color = useColor;

            // item
            const itemView = tempView.getChildByPath("BackpackItem");
            const artifactView = tempView.getChildByPath("ArtifactItem");
            if (data instanceof ItemData) {
                itemView.active = true;
                artifactView.active = false;
                itemView.getComponent(BackpackItem).refreshUI(data as ItemData);
            } else if (data instanceof ArtifactData) {
                itemView.active = false;
                artifactView.active = true;

                artifactView.getComponent(ArtifactItem).refreshUI(data as ArtifactData);
            }

            // title
            tempView.getChildByName("Title").getComponent(Label).string = title;
            tempView.getChildByName("Title").getComponent(Label).color = useColor;

            // effect
            tempView.getChildByPath("StableEffect/Title").getComponent(Label).string = desc;
            // button
            tempView.getChildByName("GetBtn").getComponent(Button).clickEvents[0].customEventData = i.toString();
            // useLanMgr
            // tempView.getChildByPath("GetBtn/name").getComponent(Label).string = LanMgr.getLanById("107549");

            content.node.addChild(tempView);
        }
        content.updateLayout();

        this._getAllPiotCostNum = Math.max(1, Math.floor(this._getAllPiotCostNum * costCoefficient - 1));

        this.node.getChildByPath("__ViewContent/GetAllBtn/txtEnergyNum").getComponent(Label).string = this._getAllPiotCostNum.toString();
    }

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._itemView = this.node.getChildByPath("__ViewContent/ImgTextBg/SelectContent/Item");
        this._itemView.active = false;

        NotificationMgr.addListener(NotificationName.ROOKIE_GUIDE_TAP_SELECT_ALL, this._onRookieTapThisSelectAll, this);
    }
    protected viewDidAppear(): void {
        super.viewDidAppear();

        const rookieStep = DataMgr.s.userInfo.data.rookieStep;
        if (rookieStep == RookieStep.OPEN_BOX_1 || rookieStep == RookieStep.OPEN_BOX_2 || rookieStep == RookieStep.OPEN_BOX_3) {
            NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_NEED_MASK_SHOW, {
                tag: "selectFromThree",
                view: this.node.getChildByPath("__ViewContent/GetAllBtn"),
                tapIndex: "-1",
            });
        }
    }
    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByPath("__ViewContent");
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();
        NotificationMgr.removeListener(NotificationName.ROOKIE_GUIDE_TAP_SELECT_ALL, this._onRookieTapThisSelectAll, this);
    }

    //---------------------------------------------------- action
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }

    private async onTapGet(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const index: number = parseInt(customEventData);
        NetworkMgr.websocketMsg.player_worldbox_open_select({
            boxIndex: this._boxIndex,
            selectIndex: index,
        });
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }

    private async onTapGetAll() {
        GameMusicPlayMgr.playTapButtonEffect();
        const piotNum: number = DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Gold);
        if (this._getAllPiotCostNum > piotNum) {
            // useLanMgr
            // UIHUDController.showCenterTip(LanMgr.getLanById("201004"));
            UIHUDController.showCenterTip("Insufficient resources for get all");
            return;
        }
        const result = await UIPanelManger.inst.pushPanel(HUDName.Alter, UIPanelLayerType.HUD);
        if (!result.success) {
            return;
        }
        result.node.getComponent(AlterView).showTip(LanMgr.replaceLanById("104005", [this._getAllPiotCostNum]), async () => {
            const rookieStep = DataMgr.s.userInfo.data.rookieStep;
            if (rookieStep == RookieStep.OPEN_BOX_1 || rookieStep == RookieStep.OPEN_BOX_2 || rookieStep == RookieStep.OPEN_BOX_3) {
                NetworkMgr.websocketMsg.player_worldbox_beginner_open_select({
                    boxIndex: this._boxIndex,
                    selectIndex: -1,
                });
            } else {
                NetworkMgr.websocketMsg.player_worldbox_open_select({
                    boxIndex: this._boxIndex,
                    selectIndex: -1,
                });
            }
            await this.playExitAnimation();
            UIPanelManger.inst.popPanel(this.node, UIPanelLayerType.UI);
        });
    }

    //----------------------------- notification
    private _onRookieTapThisSelectAll(data: { tapIndex: string }) {
        if (data.tapIndex == "-1") {
            this.onTapGetAll();
        }
    }
}
