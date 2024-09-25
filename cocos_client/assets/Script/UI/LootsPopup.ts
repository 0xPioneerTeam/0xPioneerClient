import { _decorator, instantiate, Layout, Node, Prefab } from "cc";
import { BackpackItem } from "./BackpackItem";
import ViewController from "../BasicView/ViewController";
import ItemData from "../Const/Item";
import UIPanelManger from "../Basic/UIPanelMgr";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
import CommonTools from "../Tool/CommonTools";
import { share } from "../Net/msg/WebsocketMsg";
import ArtifactData from "../Model/ArtifactData";
import { ArtifactItem } from "./ArtifactItem";

const { ccclass, property } = _decorator;

@ccclass("LootsPopup")
export class LootsPopup extends ViewController {
    public showItems(items: (share.Iitem_data | share.Iartifact_info_data)[]) {
        this._items = items;
        this._refreshUI();
    }

    @property(Prefab)
    BackpackItemPfb: Prefab;

    @property(Prefab)
    artifactItemPfb: Prefab;

    @property(Node)
    itemsParentNode: Node;

    private _items: (share.Iitem_data | share.Iartifact_info_data)[];

    protected viewDidStart(): void {
        super.viewDidStart();
    }

    private async _refreshUI() {
        const items = this._items;

        for (const node of this.itemsParentNode.children) {
            node.destroy();
        }

        for (let i = 0; i < items.length; ++i) {
            if ((items[i] as any).itemConfigId != null) {
                const tempItem = items[i] as share.Iitem_data;
                const itemData = new ItemData(tempItem.itemConfigId, tempItem.count);

                const itemTile = instantiate(this.BackpackItemPfb).getComponent(BackpackItem);
                CommonTools.changeLayerIteratively(itemTile.node, this.node.layer);
                await itemTile.refreshUI(itemData);
                itemTile.node.parent = this.itemsParentNode;
            } else {
                const tempArtifact = items[i] as share.Iartifact_info_data;
                const artifactData = new ArtifactData(tempArtifact.artifactConfigId, tempArtifact.count);

                const aritafactTile = instantiate(this.artifactItemPfb).getComponent(ArtifactItem);
                CommonTools.changeLayerIteratively(aritafactTile.node, this.node.layer);
                await aritafactTile.refreshUI(artifactData);
                aritafactTile.node.parent = this.itemsParentNode;
            }
        }
        this.itemsParentNode.getComponent(Layout).updateLayout();
    }

    private onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.popPanel(this.node);
    }
}
