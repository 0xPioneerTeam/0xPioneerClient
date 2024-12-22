import { _decorator, Component, Sprite, SpriteFrame, Node } from "cc";
import * as cc from "cc";
import { ItemMgr } from "../Utils/Global";
import ItemConfig from "../Config/ItemConfig";
import ItemData from "../Const/Item";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import { RedPointView } from "./View/RedPointView";
import { DataMgr } from "../Data/DataMgr";
const { ccclass, property } = _decorator;

@ccclass("BackpackItem")
export class BackpackItem extends Component {
    private _itemData: ItemData = null;
    private _showRedPoint: boolean = false;

    public async refreshUI(item: ItemData = null, showRedPoint: boolean = false) {
        this._itemData = item;
        this._showRedPoint = showRedPoint;
        const propView = this.node.getChildByPath("Prop");
        if (item == null) {
            propView.active = false;
        } else {
            propView.active = true;
            const config = ItemConfig.getById(item.itemConfigId);
            // levelBg
            for (let i = 1; i <= 5; i++) {
                propView.getChildByPath("Level" + i).active = i == config.grade;
            }
            // icon
            propView.getChildByPath("Icon").getComponent(Sprite).spriteFrame = await ItemMgr.getItemIcon(config.icon);
            // num
            propView.getChildByPath("Count").getComponent(cc.Label).string = "x" + item.count;

            propView.getChildByPath("RedPointView").active = showRedPoint;
            propView.getChildByPath("RedPointView").getComponent(RedPointView).refreshUI(DataMgr.s.item.getNewItemCountById(this._itemData.itemConfigId));
        }
    }

    protected onLoad(): void {}

    protected start(): void {
        NotificationMgr.addListener(NotificationName.BACKPACK_GET_NEW_ITEM, this._refreshRedPoint, this);
        NotificationMgr.addListener(NotificationName.BACKPACK_READ_NEW_ITEM, this._refreshRedPoint, this);
    }

    protected onDestroy(): void {
        NotificationMgr.removeListener(NotificationName.BACKPACK_GET_NEW_ITEM, this._refreshRedPoint, this);
        NotificationMgr.removeListener(NotificationName.BACKPACK_READ_NEW_ITEM, this._refreshRedPoint, this);
    }

    private _refreshRedPoint() {
        this.refreshUI(this._itemData, this._showRedPoint);
    }

    private grayColor() {
        const propView = this.node.getChildByPath("Prop");
        for (let i = 1; i <= 5; i++) {
            propView.getChildByPath("Level" + i).getComponent(cc.Sprite).color = new cc.Color(63, 63, 63,255);
        }
        propView.getChildByPath("Icon").getComponent(cc.Sprite).color = new cc.Color(63, 63, 63,255);
    }

    private normalColor() {
        const propView = this.node.getChildByPath("Prop");
        for (let i = 1; i <= 5; i++) {
            propView.getChildByPath("Level" + i).getComponent(cc.Sprite).color = cc.Color.WHITE;
        }
        propView.getChildByPath("Icon").getComponent(cc.Sprite).color = cc.Color.WHITE;
    }
}
