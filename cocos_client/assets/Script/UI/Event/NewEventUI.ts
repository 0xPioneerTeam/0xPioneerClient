import { _decorator, Button, Component, instantiate, Label, Layout, Node, UITransform } from "cc";
import ViewController from "../../BasicView/ViewController";
import { MapNewEventType, NewSubEventConfigData } from "../../Const/NewEventDefine";
import NewSubEventConfig from "../../Config/NewSubEventConfig";
import { GameMgr, LanMgr } from "../../Utils/Global";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import UIPanelManger, { UIPanelLayerType } from "../../Basic/UIPanelMgr";
import { HUDName, UIName } from "../../Const/ConstUIDefine";
import { AlterView } from "../View/AlterView";
import { NetworkMgr } from "../../Net/NetworkMgr";
import { MapBuildingObject } from "../../Const/MapBuilding";
import NewEventConfig from "../../Config/NewEventConfig";
import CommonTools from "../../Tool/CommonTools";
const { ccclass, property } = _decorator;

@ccclass("NewEventUI")
export class NewEventUI extends ViewController {
    private _pioneerId: string = null;
    private _building: MapBuildingObject = null;
    private _subEventConfig: NewSubEventConfigData = null;

    private _selectContent: Node = null;
    private _selectItem: Node = null;

    public configuration(pioneerId: string, building: MapBuildingObject) {
        this._pioneerId = pioneerId;
        this._building = building;
        this._subEventConfig = NewSubEventConfig.getById(building.eventSubId);

        const eventConfig = NewEventConfig.getById(building.eventId);
        if (this._pioneerId == null || this._building == null || this._subEventConfig == null || eventConfig == null) {
            UIPanelManger.inst.popPanel(this.node);
            return;
        }
        this.node.getChildByPath("__ViewContent/Title").getComponent(Label).string = LanMgr.getLanById(this._subEventConfig.name);

        this.node.getChildByPath("__ViewContent/ImgBg").getComponent(UITransform).width = this._subEventConfig.illu_type == 1 ? 374 : 960;
        for (const child of this.node.getChildByPath("__ViewContent/ImgBg/ImageMask").children) {
            child.active = parseInt(child.name) === this._subEventConfig.illu;
        }

        this.node.getChildByPath("__ViewContent/ImgBg/Index").getComponent(Label).string = (building.eventIndex + 1) + "/" + eventConfig.sub_event.length;

        this.node.getChildByPath("__ViewContent/Desc").getComponent(Label).string = LanMgr.getLanById(this._subEventConfig.narrator);

        if (this._subEventConfig.type.length > 0) {
            const type: MapNewEventType = this._subEventConfig.type[0];
            let selectItemCount: number = 1;
            if (
                type == MapNewEventType.Select ||
                type == MapNewEventType.SpiderNest ||
                type == MapNewEventType.Lions ||
                type == MapNewEventType.MigratoryBeast ||
                type == MapNewEventType.BehemothsBattle
            ) {
                selectItemCount = 2;
            }
            for (let i = 0; i < selectItemCount; i++) {
                let topTip = "";
                let bottomTip = "";
                if (i == 0) {
                    topTip = this._subEventConfig.des_a === "" ? "" : LanMgr.getLanById(this._subEventConfig.des_a);
                    bottomTip = this._subEventConfig.detail_a === "" ? "" : LanMgr.getLanById(this._subEventConfig.detail_a);
                } else {
                    topTip = this._subEventConfig.des_b === "" ? "" : LanMgr.getLanById(this._subEventConfig.des_b);
                    bottomTip = this._subEventConfig.detail_b === "" ? "" : LanMgr.getLanById(this._subEventConfig.detail_b);
                }

                const item = instantiate(this._selectItem);
                item.getChildByPath("TopDesc").getComponent(Label).string = topTip;
                item.getChildByPath("BottomDesc").getComponent(Label).string = bottomTip;
                item.getComponent(Button).clickEvents[0].customEventData = type + "|" + i;
                item.setParent(this._selectContent);
            }
            this._selectContent.getComponent(Layout).updateLayout();
        }
    }

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._selectContent = this.node.getChildByPath("__ViewContent/SelectContent");
        this._selectItem = this._selectContent.getChildByPath("Item");
        this._selectItem.removeFromParent();
    }

    protected viewDidStart(): void {
        super.viewDidStart();
    }

    protected viewPopAnimation(): boolean {
        return true;
    }

    protected contentView(): Node | null {
        return this.node.getChildByPath("__ViewContent");
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();
    }

    //-------------------------------
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();

        const result = await UIPanelManger.inst.pushPanel(HUDName.Alter, UIPanelLayerType.HUD);
        if (!result.success) {
            return;
        }
        result.node.getComponent(AlterView).showTip("Are you sure to exit this event?", async () => {
            await this.playExitAnimation();
            UIPanelManger.inst.popPanel(this.node);

            NetworkMgr.websocketMsg.player_event_exit({
                buildingId: this._building.id,
                pioneerId: this._pioneerId,
            });
        });
    }

    private async onTapSelectItem(event: Event, customEventData: string) {
        if (this._subEventConfig == null) {
            return;
        }
        GameMusicPlayMgr.playTapButtonEffect();
        const params = customEventData.split("|");
        if (params.length != 2) {
            return;
        }
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);

        const type = parseInt(params[0]) as MapNewEventType;
        const index = parseInt(params[1]);

        if (
            type == MapNewEventType.Fight ||
            (type == MapNewEventType.SpiderNest && index == 1) ||
            (type == MapNewEventType.Lions && index == 1) ||
            (type == MapNewEventType.MigratoryBeast && index == 1) ||
            type == MapNewEventType.BehemothsBattle
        ) {
            // fight
            NetworkMgr.websocketMsg.player_event_generate_enemy({
                buildingId: this._building.id,
                pioneerId: this._pioneerId,
                selectIdx: index,
            });
            GameMgr.lastEventSelectFightIdx = index;
        } else {
            NetworkMgr.websocketMsg.player_event_select({
                buildingId: this._building.id,
                pioneerId: this._pioneerId,
                selectIdx: index,
            });
        }
    }
}
