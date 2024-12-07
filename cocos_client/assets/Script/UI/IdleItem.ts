import { _decorator, Component, Sprite, SpriteFrame, Node } from "cc";
import * as cc from "cc";
import { ItemMgr } from "../Utils/Global";
// import ItemConfig from '../Config/ItemConfig';
import { IdleItemData, IdleType, IdleStatus } from "../Const/IdleItem";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import { RedPointView } from "./View/RedPointView";
import { DataMgr } from "../Data/DataMgr";
const { ccclass, property } = _decorator;
import UIPanelManger from "../Basic/UIPanelMgr";
import { UIName, HUDName } from "../Const/ConstUIDefine";
import { IdleDispatchUI } from "../UI/Dispatch/IdleDispatchUI";
import { NetworkMgr } from "../Net/NetworkMgr";

@ccclass("IdleItem")
export class IdleItem extends Component {
    @property({ type: cc.ProgressBar })
    private progressBar: cc.ProgressBar = null;

    @property({ type: cc.Label })
    private timeCount: cc.Label = null;

    @property({ type: cc.Label })
    private type: cc.Label = null;

    @property({ type: cc.Label })
    private durationLabel: cc.Label = null;

    @property({ type: cc.Label })
    private _current: number = 0;
    private _item: cc.Node = null;
    private _itemData: IdleItemData = null;
    private _showRedPoint: boolean = false;
    private _endTime: number = 0;

    private formatTime(time: number) {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = Math.floor(time % 60);

        const timeString = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        return timeString;
    }

    private formatTimeLimit(time: number) {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = Math.floor(time % 60);
        let timeString = "";
        if (hours > 0) {
            timeString += `${String(hours)}H`;
        }
        if (minutes > 0) {
            timeString += `${String(minutes)}M`;
        }
        if (seconds > 0) {
            timeString += `${String(seconds)}S`;
        }
        return timeString;
    }
    public async refreshUI(item: IdleItemData = null, showRedPoint: boolean = false) {
        this._itemData = item;
        if (this._itemData == null) {
            return;
        }

        const rewardNodes = this.node.getChildByPath("bg/rewords");

        this._itemData.reward.forEach(async (reward) => {
            // const item = ItemMgr.getItem(reward[0]);
            console.log("idle reward item:", item);
            const costIcon = await ItemMgr.getItemIcon("icon_" + reward[0]);
            rewardNodes.children[this._itemData.reward.indexOf(reward)].getChildByName("icon").getComponent(cc.Sprite).spriteFrame = costIcon;
            rewardNodes.children[this._itemData.reward.indexOf(reward)].active = true;
            rewardNodes.children[this._itemData.reward.indexOf(reward)].getChildByName("num").getComponent(cc.Label).string = reward[1].toString();
        });

        const costIcon = await ItemMgr.getItemIcon("icon_" + this._itemData.cost[0]);
        this.node.getChildByPath("bg/cost").getChildByName("icon").getComponent(cc.Sprite).spriteFrame = costIcon;
        this.node.getChildByPath("bg/cost").getChildByName("num").getComponent(cc.Label).string = this._itemData.cost[1].toString();

        console.log("idle duration:", this._itemData.duration);
        this.durationLabel.string = this.formatTimeLimit(this._itemData.duration);
        switch (this._itemData.type) {
            case IdleType.Fight:
                this.node.getChildByPath("bg/Fight").active = true;
                this.node.getChildByPath("bg/Collection").active = false;
                this.node.getChildByPath("bg/Fight/Ani").getComponent(cc.Animation).play();
                this.type.string = "Fight";
                this.node.getChildByPath("bg/IdleType/Fight").active = true;
                this.node.getChildByPath("bg/IdleType/Collection").active = false;
                break;
            case IdleType.Collection:
                this.node.getChildByPath("bg/Fight").active = false;
                this.node.getChildByPath("bg/Collection").active = true;
                this.node.getChildByPath("bg/Collection/Ani").getComponent(cc.Animation).play();
                this.type.string = "Collection";
                this.node.getChildByPath("bg/IdleType/Fight").active = false;
                this.node.getChildByPath("bg/IdleType/Collection").active = true;
                break;
        }
        switch (this._itemData.status) {
            case IdleStatus.Doing:
                break;
            case IdleStatus.Finish:
                this.progressBar.progress = 1;
                this.node.getChildByPath("bg/Fight").active = false;
                this.node.getChildByPath("bg/Collection").active = false;
                this.node.getChildByPath("bg/Wait").active = false;
                this.node.getChildByPath("bg/Fin").active = true;
                this.node.getChildByPath("bg/Fin/Ani").getComponent(cc.Animation).play();
                this._current = 0;
                break;
            case IdleStatus.Wait:
                this.progressBar.progress = 0;
                this.timeCount.string = this.formatTime(this._itemData.duration);
                this.node.getChildByPath("bg/Fight").active = false;
                this.node.getChildByPath("bg/Collection").active = false;
                this.node.getChildByPath("bg/Wait").active = true;
                this.node.getChildByPath("bg/Wait").getComponent(cc.Animation).play();
                this.node.getChildByPath("bg/Fin").active = false;
                this._current = 0;
                break;
        }
        if (this._itemData.startTime) {
            const currentTime = Date.now() / 1000; //milliseconds
            this._endTime = this._itemData.startTime + this._itemData.duration;
            this._current = Math.min(currentTime - this._itemData.startTime, this._itemData.duration);
            this.progressBar.progress = this._current / this._itemData.duration;
            console.log("idle progress:", this.progressBar.progress);

            if (currentTime >= this._endTime) {
                console.log("idle item end", this._endTime);
                this._itemData.status = 1;
                this._current = 0;
            }
        }
    }

    update(dt: number) {
        if (this._itemData.status === IdleStatus.Doing && Date.now / 1000 < this._endTime) {
            this._current += dt;
            if (this._current <= this._itemData.duration) {
                this.progressBar.progress = this._current / this._itemData.duration;

                const remainingTime = this._itemData.duration - (Date.now() / 1000 - this._itemData.startTime);

                // turn left time to string
                // const totalSeconds = remainingTime;
                // const hours = Math.floor(totalSeconds / 3600);
                // const minutes = Math.floor((totalSeconds % 3600) / 60);
                // const seconds = Math.floor(totalSeconds % 60);

                // const timeString = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
                this.timeCount.string = this.formatTime(remainingTime);
            } else if (this._current > this._itemData.duration && this.progressBar.progress < 1) {
                this.progressBar.progress = 1;
                // this.progressBar.node.getComponent(Animation).crossFade("ef_hall_scene_max_progress", 0);
            }
            if (this._current >= this._itemData.duration) {
                this._itemData.status = 1;
                this._current = 0;
            }
        }
    }

    public async onTapStart() {
        if (this._itemData == null) {
            return;
        }
        // select patch pioneer
        let actionType = null;
        // let stayBuilding = null;
        // let stayPioneer = null;
        // let taregtPos = null;
        const result = await UIPanelManger.inst.pushPanel(UIName.IdleDispatchUI);
        if (result.success) {
            result.node.getComponent(IdleDispatchUI).configuration(this._itemData.type, async (confirmed: boolean, actionPioneerUnqueId: string) => {
                console.log("dispatch:", actionPioneerUnqueId);
                if (confirmed) {
                    const currentActionPioneer = DataMgr.s.pioneer.getById(actionPioneerUnqueId);
                    // todo, dispatch after get pioneer unqueid
                    NetworkMgr.websocketMsg.dispatch_pioneer_to_idle_task({
                        taskId: this._itemData.id,
                        pioneerUnqueId: actionPioneerUnqueId,
                    });
                    // this.refreshUI(this._itemData, false);
                    return;
                }
            });
        }

        return;

        // if (result.success) {
        //     result.node
        //         .getComponent(DispatchUI)
        //         .configuration(
        //             actionType,
        //             stayBuilding,
        //             stayPioneer,
        //             taregtPos,
        //             async (confirmed: boolean, actionPioneerUnqueId: string, movePaths: TilePos[], isReturn: boolean) => {
        //                 const currentActionPioneer = DataMgr.s.pioneer.getById(actionPioneerUnqueId);
        //                 if (confirmed && currentActionPioneer != undefined) {
        //                     this._pioneerInteract(currentActionPioneer.uniqueId, actionType, movePaths, isReturn, stayBuilding, stayPioneer);
        //                 }

        //             }
        //         );
        // }
    }

    // todo, get reward button show
    private _onTapGetReward() {
        if (this._itemData == null) {
            return;
        }
        NetworkMgr.websocketMsg.get_idle_task_reward({
            taskId: this._itemData.id,
        });
    }

    protected onLoad(): void {}

    protected start(): void {
        // this.node.getChildByPath("/bg/Fight").active = true;
        // this.node.getChildByPath("/bg/Fight").getComponent(cc.Animation).play(s);
        // NotificationMgr.addListener(NotificationName.BACKPACK_GET_NEW_ITEM, this._refreshRedPoint, this);
        // NotificationMgr.addListener(NotificationName.BACKPACK_READ_NEW_ITEM, this._refreshRedPoint, this);
    }

    protected onDestroy(): void {
        // NotificationMgr.removeListener(NotificationName.BACKPACK_GET_NEW_ITEM, this._refreshRedPoint, this);
        // NotificationMgr.removeListener(NotificationName.BACKPACK_READ_NEW_ITEM, this._refreshRedPoint, this);
    }

    private _refreshRedPoint() {
        this.refreshUI(this._itemData, this._showRedPoint);
    }
}
