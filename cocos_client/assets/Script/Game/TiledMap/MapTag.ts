import { Vec2 } from 'cc';
import { Sprite } from 'cc';
import { _decorator, CCBoolean, Component, Node } from 'cc';
import { DEV } from 'cc/env';
import { ResourcesMgr } from '../../Utils/Global';
import { BundleName } from '../../Basic/ResourcesMgr';
import { SpriteFrame } from 'cc';
import { UITransform } from 'cc';
import { loader } from 'cc';
import { assetManager } from 'cc';
import { Prefab } from 'cc';
import { instantiate } from 'cc';
import { v3 } from 'cc';
const { ccclass, property } = _decorator;



@ccclass('MapTag')
export class MapTag extends Component {
    @property(CCBoolean)
    block: boolean = false;

    @property({ visible() { return this.block }, displayName: '阻挡数据', type: [Vec2] })
    blockData: Vec2[] = [];

    @property({ visible() { return this.block }, type: Prefab })
    blockNodePb: Prefab;

    @property(CCBoolean)
    _blockDraw: boolean;

    @property({ visible() { return this.block }, displayName: '显示阻挡数据', type: CCBoolean })
    set blockDraw(v: boolean) {
        this._blockDraw = v;
        if (DEV) {
            let blockNode = this.node.getChildByName('__BLOCKNODE');
            if (v) {
                if (!blockNode) {
                    blockNode = new Node('__BLOCKNODE');
                    blockNode.addComponent(UITransform);
                    this.node.addChild(blockNode);
                }
                if (!this.blockNodePb) {
                    console.warn('map block show need bind: blockNodePb');
                    return;
                }
                //  to update size 30*30
                let tilewidth = 7744;
                let tileheight = 5792;
                let tileNodeWidth = 128;
                let tileNodeHeight = 128;
                let blockUITrans = blockNode.getComponent(UITransform);
                let nodeTrans = this.node.parent.getComponent(UITransform);
                this.blockData.forEach(async (data, index) => {
                    let node = instantiate(this.blockNodePb);
                    let ui = node.getComponent(UITransform);
                    ui.setContentSize(128 / this.node.scale.x, 128 / this.node.scale.y);
                    var cross = data.y % 2 == 1;
                    var worldx = (data.x + 0.5) * tileNodeWidth - tilewidth / 2;
                    if (cross) worldx += tileNodeWidth * 0.5;
                    var worldy = tileheight / 2 - (data.y * (tileNodeHeight * 0.75) + tileNodeHeight/2);
                    let vv2 = nodeTrans.convertToWorldSpaceAR(v3(worldx, worldy, 0));
                    let vv = blockUITrans.convertToNodeSpaceAR(vv2);
                    node.setPosition(vv);
                    console.log(`block data x${data.x},y${data.y}  convert x${vv.x},y${vv.y}`);
                    blockNode.addChild(node);
                });
            } else {
                if (blockNode) {
                    blockNode.removeFromParent();
                    blockNode.destroy();
                }
            }
        }
    }

    get blockDraw() {
        return this._blockDraw;
    }

    start() {

    }

    update(deltaTime: number) {

    }
}


