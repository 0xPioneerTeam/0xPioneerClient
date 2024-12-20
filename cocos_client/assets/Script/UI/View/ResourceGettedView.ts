import { _decorator, Component, Details, instantiate, Label, Layout, Node, Tween, tween, UIOpacity, v3 } from "cc";
import ViewController from "../../BasicView/ViewController";
import { ResourceCorrespondingItem } from "../../Const/ConstDefine";
import { GameMgr, ItemMgr, LanMgr } from "../../Utils/Global";
import ItemConfig from "../../Config/ItemConfig";
import ItemData from "../../Const/Item";
import { UserInnerBuildInfo } from "../../Const/BuildingDefine";
import InnerBuildingConfig from "../../Config/InnerBuildingConfig";

const { ccclass, property } = _decorator;

@ccclass("ResourceGettedView")
export class ResourceGettedView extends ViewController {
    //--------------------------------- public
    public showTip(items: (ItemData | string)[], src: string = null) {
        for (const item of items) {
            const itemView = instantiate(this._showItem);
            if (item instanceof ItemData) {
                itemView.getChildByPath("IconTip").active = true;
                itemView.getChildByPath("TextTip").active = false;
                const config = ItemConfig.getById(item.itemConfigId);
                if (config == null) {
                    return;
                }
                itemView.getChildByPath("IconTip/Icon/8001").active = item.itemConfigId == ResourceCorrespondingItem.Food;
                itemView.getChildByPath("IconTip/Icon/8002").active = item.itemConfigId == ResourceCorrespondingItem.Wood;
                itemView.getChildByPath("IconTip/Icon/8003").active = item.itemConfigId == ResourceCorrespondingItem.Stone;
                itemView.getChildByPath("IconTip/Icon/8004").active = item.itemConfigId == ResourceCorrespondingItem.Troop;
                itemView.getChildByPath("IconTip/Icon/8005").active = item.itemConfigId == ResourceCorrespondingItem.Energy;
                itemView.getChildByPath("IconTip/Icon/8006").active = item.itemConfigId == ResourceCorrespondingItem.Gold;
                itemView.getChildByPath("IconTip/Icon/8007").active = item.itemConfigId == ResourceCorrespondingItem.NFTExp;
                itemView.getChildByPath("IconTip/Icon/8008").active = item.itemConfigId == ResourceCorrespondingItem.NFTRankExp;
                itemView.getChildByPath("IconTip/Name").getComponent(Label).string = LanMgr.getLanById(config.itemName);
                itemView.getChildByPath("IconTip/Num").getComponent(Label).string = "+" + item.count;

                if (src == "worldbox_open" || src == "worldbox_open_select") {
                    const rate = GameMgr.getIllustrationEffectValue();
                    if (rate > 0) {
                        itemView.getChildByPath("IconTip/Num").getComponent(Label).string += `(+${rate * 100}%)`;
                    }
                }
            } else if (!!(item as string)) {
                itemView.getChildByPath("IconTip").active = false;
                itemView.getChildByPath("TextTip").active = true;

                itemView.getChildByPath("TextTip/Tip").getComponent(Label).string = item;
            }
            this._allWaitingShowItems.push(itemView);
        }
        this._playShowAnim();
    }

    //--------------------------------- lifeCycle
    private _showItemContent: Node = null;
    private _showItem: Node = null;
    private _allWaitingShowItems: Node[] = [];
    private _showingItems: Node[] = [];

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._showItemContent = this.node.getChildByPath("Content");
        this._showItem = this._showItemContent.getChildByPath("Item");
        this._showItem.removeFromParent();
    }

    //--------------------------------- function
    private _playShowAnim() {
        if (this._allWaitingShowItems.length <= 0 || this._showingItems.length >= 3) {
            return;
        }
        const view = this._allWaitingShowItems.shift();
        view.setParent(this._showItemContent);
        this._showItemContent.getComponent(Layout).updateLayout();
        this._showingItems.push(view);

        tween()
            .target(view.getComponent(UIOpacity))
            .delay(0.3)
            .call(() => {
                this._playShowAnim();
            })
            .delay(1.2)
            .to(0.3, { opacity: 0 })
            .call(() => {
                view.destroy();
                this._showItemContent.getComponent(Layout).updateLayout();
                this._showingItems.splice(this._showingItems.indexOf(view), 1);
                this._playShowAnim();
            })
            .start();
    }

    //--------------------------------- action
    private onTapShowContent() {
        if (this._showingItems.length <= 0) {
            return;
        }
        const view = this._showingItems.shift();
        Tween.stopAllByTarget(view.getComponent(UIOpacity));
        tween()
            .target(view.getComponent(UIOpacity))
            .to(0.3, { opacity: 0 })
            .call(() => {
                view.destroy();
                this._showItemContent.getComponent(Layout).updateLayout();
                this._playShowAnim();
            })
            .start();
    }
}
