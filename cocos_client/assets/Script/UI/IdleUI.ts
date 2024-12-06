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
import { NetworkMgr } from "../Net/NetworkMgr";
import { s2c_user, share } from "../Net/msg/WebsocketMsg";
import IdleTaskConfig from "../Config/IdleTaskConfig";
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

        NetworkMgr.websocket.on("get_idle_task_list_res", this.get_idle_task_list_res);
        NetworkMgr.websocket.on("idle_task_change", this.idle_task_change);

        NetworkMgr.websocketMsg.get_idle_task_list();


        // test begin
        this._data = [];
        const p  = {
            tasks: [
                { id: "1", startTime: 0, status: 0 },
                { id: "2", startTime: 0, status: 0 },
                { id: "3", startTime: 0, status: 0 },
                { id: "4", startTime: 0, status: 0 },
                { id: "5", startTime: 0, status: 0 },
                { id: "6", startTime: 0, status: 0 },
            ]
        };

        for (const element of p.tasks) {
            const config = IdleTaskConfig.getById(element.id);
            this._data.push({
                id: element.id,
                type: config.type,
                startTime: element.startTime,
                status: element.status,
                duration: config.duration * 60,
            });
        }
        this._refreshIdleUI();
        // test end
    }

    protected viewDidStart(): void {
        super.viewDidStart();

        this._refreshIdleUI();
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.CHANGE_LANG, this._refreshIdleUI, this);
        // NotificationMgr.removeListener(NotificationName.ITEM_CHANGE, this._refreshBackpackUI, this);
        NetworkMgr.websocket.off("get_idle_task_list_res", this.get_idle_task_list_res);
        NetworkMgr.websocket.off("idle_task_change", this.idle_task_change);
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
        console.log("exce data: ", this._data);
        // this._data = [BackpackMgr.getBackpack(this._currentCategoryType, this._currentArrangeType);]
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

    private get_idle_task_list_res = (e: any) => {
        const p: s2c_user.Iget_idle_task_list_res = e.data;
        if (p.res !== 1) {
            return;
        }
        this._data = [];
        for (const element of p.tasks) {
            const config = IdleTaskConfig.getById(element.id);
            this._data.push({
                id: element.id,
                type: config.type,
                startTime: element.startTime,
                status: element.status,
                duration: config.duration * 60,
            });
        }
        this._refreshIdleUI();
    };

    private idle_task_change = (e: any) => {
        const p: s2c_user.Iidle_task_change = e.data;
        for (const element of this._data) {
            for (const temp of p.tasks) {
                if (element.id == temp.id) {
                    element.startTime = temp.startTime;
                    element.status = temp.status;
                    break;
                }
            }
        }
        this._refreshIdleUI();
    }
}
