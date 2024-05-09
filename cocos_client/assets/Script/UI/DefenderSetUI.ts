import { _decorator, Node, instantiate, Label, UITransform, Button, v3, NodeEventType, EventTouch, rect, Rect } from "cc";
import { LanMgr } from "../Utils/Global";
import { UIName } from "../Const/ConstUIDefine";
import UIPanelManger from "../Basic/UIPanelMgr";
import { DataMgr } from "../Data/DataMgr";
import ViewController from "../BasicView/ViewController";
import { DefenderSelectUI } from "./DefenderSelectUI";
import { NetworkMgr } from "../Net/NetworkMgr";
const { ccclass, property } = _decorator;

@ccclass("DefenderSetUI")
export class DefenderSetUI extends ViewController {
    //----------------------------------------- data
    private _movingItemIndex: number = -1;
    private _isDragging: boolean = false;
    //----------------------------------------- view
    private _tbdItems: Node[] = [];
    private _defenderContent: Node = null;
    private _defenderItem: Node = null;
    private _allDefenderItemMap: Map<number, Node> = new Map();

    protected viewDidLoad(): void {
        super.viewDidLoad();

        for (let i = 0; i < 3; i++) {
            const item = this.node.getChildByPath("__ViewContent/TBDContent/TBD_" + i);
            this._tbdItems.push(item);
        }

        this._defenderContent = this.node.getChildByPath("__ViewContent/DefenderContent");
        this._defenderItem = this._defenderContent.getChildByPath("DefenderItem");
        this._defenderItem.removeFromParent();
        // useLanMgr
        // this.node.getChildByPath("__ViewContent/Title").getComponent(Label).string = LanMgr.getLanById("107549");

        const contentView = this.node.getChildByPath("__ViewContent");
        contentView.on(NodeEventType.TOUCH_START, this._onTouchStart, this);
        contentView.on(NodeEventType.TOUCH_MOVE, this._onTouchMove, this);
        contentView.on(NodeEventType.TOUCH_END, this._onTouchEnd, this);
        contentView.on(NodeEventType.TOUCH_CANCEL, this._onTouchEnd, this);
    }
    protected viewDidStart(): void {
        super.viewDidStart();

        const datas = DataMgr.s.userInfo.data.wormholeDefenderIds;
        for (let i = 0; i < datas.length; i++) {
            if (datas[i].length > 0) {
                this._addDefender(datas[i], i);
            }
        }
    }
    protected viewDidDestroy(): void {
        super.viewDidDestroy();
    }
    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByPath("__ViewContent");
    }
    private _addDefender(pioneerId: string, index: number) {
        const pioneer = DataMgr.s.pioneer.getById(pioneerId);
        if (pioneer == undefined) {
            return;
        }
        const item = instantiate(this._defenderItem);
        item["defenderId"] = pioneerId;
        item.setParent(this._defenderContent);
        item.getChildByPath("Icon/self").active = pioneer.animType == "self";
        item.getChildByPath("Icon/doomsdayGangSpy").active = pioneer.animType == "doomsdayGangSpy";
        item.getChildByPath("Icon/rebels").active = pioneer.animType == "rebels";
        item.getChildByPath("Icon/secretGuard").active = pioneer.animType == "secretGuard";
        item.getChildByPath("Name").getComponent(Label).string = LanMgr.getLanById(pioneer.name);
        item.getChildByPath("DeleteButton").getComponent(Button).clickEvents[0].customEventData = index.toString();
        item.worldPosition = this._tbdItems[index].worldPosition;
        this._allDefenderItemMap.set(index, item);
    }

    private _sendRequestSetDefender(pioneerId: string, index: number) {
        DataMgr.setTempSendData("player_wormhole_set_defender_res", {
            pioneerId: pioneerId,
            index: index
        });
        NetworkMgr.websocketMsg.player_wormhole_set_defender({
            poineerId: pioneerId,
            index: index
        });
    }

    private async _onTapTBD(index: number) {
        const result = await UIPanelManger.inst.pushPanel(UIName.DefenderSelectUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(DefenderSelectUI).configuration((selectPioneerId: string) => {
            this._addDefender(selectPioneerId, index);
            this._sendRequestSetDefender(selectPioneerId, index);
        });
    }
    //------------------------------------------ action
    private onTapDelete(event: Event, customEventData: string) {
        const index = parseInt(customEventData);
        if (!this._allDefenderItemMap.has(index)) {
            return;
        }
        this._allDefenderItemMap.get(index).destroy();
        this._allDefenderItemMap.delete(index);

        this._sendRequestSetDefender("", index);
    }
    private async onTapClose() {
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel();
    }

    private _onTouchStart(event: EventTouch) {
        this._allDefenderItemMap.forEach((value: Node, key: number) => {
            const worldBox = value.getComponent(UITransform).getBoundingBoxToWorld();
            if (worldBox.contains(event.getUILocation())) {
                this._movingItemIndex = key;
            }
        });
    }
    private _onTouchMove(event: EventTouch) {
        if (this._movingItemIndex < 0) {
            return;
        }
        if (!this._isDragging) {
            const delta = event.getUIDelta();
            if (Math.abs(delta.x) >= 2 || Math.abs(delta.y) >= 2) {
                // begin drag init
                this._isDragging = true;
            }
        }
        if (!this._isDragging) {
            return;
        }
        const movingItem = this._allDefenderItemMap.get(this._movingItemIndex);
        movingItem.setSiblingIndex(99);
        const pos = movingItem.worldPosition.add(v3(event.getUIDelta().x, event.getUIDelta().y, 0));
        movingItem.worldPosition = pos;
    }
    private async _onTouchEnd(event: EventTouch) {
        if (this._movingItemIndex < 0) {
            if (!this._isDragging) {
                for (let i = 0; i < this._tbdItems.length; i++) {
                    const value = this._tbdItems[i];
                    if (value.getComponent(UITransform).getBoundingBoxToWorld().contains(event.getUILocation())) {
                        this._onTapTBD(i);
                        break;
                    }
                }
            }
            this._movingItemIndex = -1;
            this._isDragging = false;
            return;
        }
        if (!this._isDragging) {
            this._movingItemIndex = -1;
            this._isDragging = false;
            return;
        }
        const movingItem = this._allDefenderItemMap.get(this._movingItemIndex);
        const movingWorldBox = movingItem.getComponent(UITransform).getBoundingBoxToWorld();

        let interactableItemIndex: number = -1;
        let interactableItem: Node = null;
        // check if interact with defender item
        this._allDefenderItemMap.forEach((value: Node, key: number) => {
            if (key == this._movingItemIndex) {
            } else {
                const worldBox = value.getComponent(UITransform).getBoundingBoxToWorld();
                const intersection = rect(0, 0, 0, 0);
                Rect.intersection(intersection, movingWorldBox, worldBox);
                if (intersection.width > 0 && intersection.height > 0) {
                    if (interactableItemIndex == -1 && interactableItem == null) {
                        interactableItemIndex = key;
                        interactableItem = value;
                    } else {
                        const intersectionArea = intersection.width * intersection.height;
                        const curIntersectionArea =
                            value.getComponent(UITransform).getBoundingBoxToWorld().width * value.getComponent(UITransform).getBoundingBoxToWorld().height;
                        if (intersectionArea > curIntersectionArea) {
                            interactableItemIndex = key;
                            interactableItem = value;
                        }
                    }
                }
            }
        });
        if (interactableItemIndex >= 0 && interactableItem != null) {
            // interact pioneer exchange their pos
            movingItem.worldPosition = this._tbdItems[interactableItemIndex].worldPosition;
            movingItem.getChildByPath("DeleteButton").getComponent(Button).clickEvents[0].customEventData = interactableItemIndex.toString();

            interactableItem.worldPosition = this._tbdItems[this._movingItemIndex].worldPosition;
            interactableItem.getChildByPath("DeleteButton").getComponent(Button).clickEvents[0].customEventData = this._movingItemIndex.toString();

            this._allDefenderItemMap.set(interactableItemIndex, movingItem);
            this._allDefenderItemMap.set(this._movingItemIndex, interactableItem);

            this._sendRequestSetDefender(movingItem["defenderId"], interactableItemIndex);
            this._sendRequestSetDefender(interactableItem["defenderId"], this._movingItemIndex);

            this._movingItemIndex = -1;
            this._isDragging = false;
            return;
        }

        // check if interact with tbd item
        for (let i = 0; i < this._tbdItems.length; i++) {
            const value = this._tbdItems[i];
            const worldBox = value.getComponent(UITransform).getBoundingBoxToWorld();
            const intersection = rect(0, 0, 0, 0);
            Rect.intersection(intersection, movingWorldBox, worldBox);
            if (intersection.width > 0 && intersection.height > 0) {
                if (interactableItemIndex == -1 && interactableItem == null) {
                    interactableItemIndex = i;
                    interactableItem = value;
                } else {
                    const intersectionArea = intersection.width * intersection.height;
                    const curIntersectionArea =
                        value.getComponent(UITransform).getBoundingBoxToWorld().width * value.getComponent(UITransform).getBoundingBoxToWorld().height;
                    if (intersectionArea > curIntersectionArea) {
                        interactableItemIndex = i;
                        interactableItem = value;
                    }
                }
            }
        }

        if (interactableItemIndex >= 0 && interactableItem != null && interactableItemIndex != this._movingItemIndex) {
            // interact pioneer exchange their pos
            movingItem.worldPosition = this._tbdItems[interactableItemIndex].worldPosition;
            movingItem.getChildByPath("DeleteButton").getComponent(Button).clickEvents[0].customEventData = interactableItemIndex.toString();

            this._allDefenderItemMap.set(interactableItemIndex, movingItem);
            this._allDefenderItemMap.delete(this._movingItemIndex);

            this._sendRequestSetDefender(movingItem["defenderId"], interactableItemIndex);
            this._sendRequestSetDefender("", this._movingItemIndex);

            this._movingItemIndex = -1;
            this._isDragging = false;
            return;
        }

        movingItem.worldPosition = this._tbdItems[this._movingItemIndex].worldPosition;
        this._movingItemIndex = -1;
        this._isDragging = false;
    }
}