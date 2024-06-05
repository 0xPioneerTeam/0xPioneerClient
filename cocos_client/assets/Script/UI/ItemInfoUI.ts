import { _decorator, Component, Label, Node, Sprite, SpriteFrame, Vec3, Button, EventHandler, v2, Vec2, Prefab, Slider, instantiate, RichText, randomRangeInt } from 'cc';
import { BackpackItem } from './BackpackItem';
import { ItemMgr, LanMgr } from '../Utils/Global';
import ViewController from '../BasicView/ViewController';
import ItemConfig from '../Config/ItemConfig';
import ItemData, { ItemType } from '../Const/Item';
import UIPanelManger from '../Basic/UIPanelMgr';
import { DataMgr } from '../Data/DataMgr';
import { NetworkMgr } from '../Net/NetworkMgr';
import GameMusicPlayMgr from '../Manger/GameMusicPlayMgr';
const { ccclass, property } = _decorator;

@ccclass('ItemInfoUI')
export class ItemInfoUI extends ViewController {
    /**
     * 
     * @param items 
     * @param isGet true-get item  false-use item or only show
     * @param closeCallback 
     * @returns 
     */
    public async showItem(items: ItemData[], isGet: boolean = false, closeCallback: () => void = null) {
        this._items = items;
        this._isGet = isGet;
        this._closeCallback = closeCallback;
        // resource not show
        // remove all resource
        for (let i = 0; i < this._items.length; i++) {
            const templeConfig = ItemConfig.getById(this._items[i].itemConfigId);
            if (templeConfig != null && templeConfig.itemType == ItemType.Resource) {
                // resource no show
                this._items.splice(i, 1);
                i--;
            }
        }
        if (this._items.length > 0) {
            let currentItem: ItemData = this._items.splice(0, 1)[0];
            this._canGetItem = currentItem;
            let currentConfig = ItemConfig.getById(currentItem.itemConfigId);
            if (currentConfig != null) {
                const contentView = this.node.getChildByName("__ViewContent");
                // name 
                contentView.getChildByName("Name").getComponent(Label).string = LanMgr.getLanById(currentConfig.itemName);
                // icon
                contentView.getChildByName("BackpackItem").getComponent(BackpackItem).refreshUI(currentItem);
                // desc
                contentView.getChildByName("DescTxt").getComponent(RichText).string = LanMgr.getLanById(currentConfig.itemDesc);
                // actionbutton
                const button = contentView.getChildByName("btnUse");
                button.active = false;
                if (this._isGet) {
                    button.active = true;
                    button.getChildByName("name").getComponent(Label).string = LanMgr.getLanById("205001");

                } else {
                    if (currentConfig.itemType == ItemType.AddProp) {
                        button.active = true;
                        button.getChildByName("name").getComponent(Label).string = LanMgr.getLanById("205002");
                    }
                }
            }
        } else {
            UIPanelManger.inst.popPanel(this.node);
            if (closeCallback != null) {
                closeCallback();
            }
        }
    }


    private _items: ItemData[] = [];
    private _isGet: boolean;
    private _canGetItem: ItemData = null;
    private _closeCallback: () => void;
    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByName("__ViewContent");
    }

    //---------------------------------------------------- action
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._items.length <= 0) {
            await this.playExitAnimation();
            UIPanelManger.inst.popPanel(this.node);
            if (this._closeCallback != null) {
                this._closeCallback();
            }
        } else {
            this.showItem(this._items, this._isGet, this._closeCallback);
        }
    }
    private async onTapUse() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._isGet) {
            
        } else {
            if (this._canGetItem != null) {
                NetworkMgr.websocketMsg.player_item_use({ itemId: this._canGetItem.itemConfigId, num: 1 });
            }
        }
        this.onTapClose();
    }
}
