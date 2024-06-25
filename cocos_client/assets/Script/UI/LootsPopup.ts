import { _decorator, instantiate, Layout, Node, Prefab } from "cc";
import { BackpackItem } from "./BackpackItem";
import ViewController from "../BasicView/ViewController";
import ItemData from "../Const/Item";
import UIPanelManger from "../Basic/UIPanelMgr";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
import CommonTools from "../Tool/CommonTools";

const { ccclass, property } = _decorator;

@ccclass("LootsPopup")
export class LootsPopup extends ViewController {
    public showItems(items: { id: string; num: number }[]) {
        this._items = items;
        this._refreshUI();
    }

    @property(Prefab)
    BackpackItemPfb: Prefab;

    @property(Node)
    itemsParentNode: Node;

    private _items: { id: string; num: number }[];

    protected viewDidStart(): void {
        super.viewDidStart();

        this._refreshUI();
    }

    private _refreshUI() {
        const items = this._items;

        for (const node of this.itemsParentNode.children) {
            node.destroy();
        }

        for (let i = 0; i < items.length; ++i) {
            // console.log(`show item: ${JSON.stringify(items[i])}`);
            const itemData = new ItemData(items[i].id, items[i].num);

            let itemTile = instantiate(this.BackpackItemPfb).getComponent(BackpackItem);
            CommonTools.changeLayerIteratively(itemTile.node, this.node.layer);
            itemTile.refreshUI(itemData).catch(() => {});
            itemTile.node.parent = this.itemsParentNode;
        }
        this.itemsParentNode.getComponent(Layout).updateLayout();
    }

    private onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.popPanel(this.node);
    }
}
