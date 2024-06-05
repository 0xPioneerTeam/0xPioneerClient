import { _decorator, Component, Label, Node, Sprite, SpriteFrame, Vec3, Button, EventHandler, v2, Vec2, Prefab, Slider, instantiate, RichText, randomRangeInt } from 'cc';
import { BackpackItem } from './BackpackItem';
import { LanMgr } from '../Utils/Global';
import ViewController from '../BasicView/ViewController';
import ItemData, { ItemType } from '../Const/Item';
import ItemConfig from '../Config/ItemConfig';
import UIPanelManger from '../Basic/UIPanelMgr';
import GameMusicPlayMgr from '../Manger/GameMusicPlayMgr';
const { ccclass, property } = _decorator;

@ccclass('ItemGettedUI')
export class ItemGettedUI extends ViewController {
    /**
     * 
     * @param items only item type
     * @param closeCallback 
     * @returns 
     */
    public async showItem(items: ItemData[], closeCallback: () => void = null) {
        this._items = items;
        this._closeCallback = closeCallback;
        
        // resource not show
        for (let i = 0; i < this._items.length; i++) {
            const templeConfig = ItemConfig.getById(this._items[i].itemConfigId);
            if (templeConfig != null && templeConfig.itemType == ItemType.Resource) {
                // resource no show
                this._items.splice(i, 1);
                i--;
            }
        }
        if (this._items.length > 0) {
            for (const item of this._items) {
                const itemNode = instantiate(this._showItemNode);
                itemNode.active = true;
                itemNode.setParent(this._showItemNode.getParent());
                itemNode.getComponent(BackpackItem).refreshUI(item);
                itemNode.getChildByPath("Count").getComponent(Label).string = item.count.toString();
            }
        } else {
            UIPanelManger.inst.popPanel(this.node);
            if (closeCallback != null) {
                closeCallback();
            }
        }
        // useLanMgr
        // this.node.getChildByPath("__ViewContent/Title").getComponent(Label).string = LanMgr.getLanById("107549");
    }

    private _items: ItemData[] = [];
    private _closeCallback: () => void;

    private _showItemNode: Node = null;
    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._showItemNode = this.node.getChildByPath("__ViewContent/Content/BackpackItem");
        this._showItemNode.active = false;
    }

    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByName("__ViewContent");
    }

    //---------------------------------------------------- action
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
        if (this._closeCallback != null) {
            this._closeCallback();
        }
    }
}
