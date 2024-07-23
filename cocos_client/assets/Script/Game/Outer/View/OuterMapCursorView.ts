import { _decorator, Color, Component, instantiate, Node, size, Sprite, SpriteFrame, UITransform, v2, v3, Vec2, Vec3 } from 'cc';
import { TileHexDirection, TilePos } from '../../TiledMap/TileTool';
import GameMainHelper from '../../Helper/GameMainHelper';
const { ccclass, property } = _decorator;

@ccclass('OuterMapCursorView')
export class OuterMapCursorView extends Component {
    public initData(hexViewRadius: number, parentScale: number) {
        this._hexViewRadius = hexViewRadius;
        this._parentScale = parentScale;
    }
    public show(tiledPositions: Vec2[], tiledColor: Color, visionPostions: Vec2[] = null, visionColor: Color = null) {
        if (this._hexViewRadius == null ||
            this._parentScale == null) {
            return;
        }
        let index = 0;
        const tiledUsed = this._prepareBorderPos(tiledPositions);
        for (; index < tiledUsed.length; index++) {
            let line: Node = null;
            if (index < this._cursorBorderPool.length) {
                line = this._cursorBorderPool[index];
            } else {
                line = instantiate(this._cursorBorderNode);
                line.setParent(this.node);
                this._cursorBorderPool.push(line);
            }
            line.getComponent(UITransform).setContentSize(size(tiledUsed[index].lineWidth, 6));
            line.active = true;
            line.getComponent(Sprite).color = tiledColor;
            line.setWorldPosition(tiledUsed[index].centerPos);
            line.angle = tiledUsed[index].borderAngle;
        }

        if (visionPostions != null && visionColor != null) {
            const visionUsed = this._prepareBorderPos(visionPostions);
            for (; index < visionUsed.length + tiledUsed.length; index++) {
                let line: Node = null;
                if (index < this._cursorBorderPool.length) {
                    line = this._cursorBorderPool[index];
                } else {
                    line = instantiate(this._cursorBorderNode);
                    line.setParent(this.node);
                    this._cursorBorderPool.push(line);
                }
                const usedIndex: number = index - tiledUsed.length;
                line.getComponent(UITransform).setContentSize(size(visionUsed[usedIndex].lineWidth, 6));
                line.active = true;
                line.getComponent(Sprite).color = visionColor;
                // line.setPosition(this.node.getComponent(UITransform).convertToNodeSpaceAR(visionUsed[usedIndex].centerPos));
                line.setWorldPosition(tiledUsed[index].centerPos);
                line.angle = visionUsed[usedIndex].borderAngle;
            }
        }

        for (; index < this._cursorBorderPool.length; index++) {
            this._cursorBorderPool[index].destroy();
            this._cursorBorderPool.splice(index, 1);
            index -= 1;
        }
    }
    public hide() {
        for (const node of this._cursorBorderPool) {
            node.active = false;
        }
        this.node.position = v3(0, 0, 0);
    }
    public move(sub: Vec2) {
        this.node.position = v3(
            this.node.position.x + sub.x,
            this.node.position.y + sub.y,
            this.node.position.z
        );
    }

    @property(SpriteFrame)
    private cursorBorderImage: SpriteFrame = null;

    private _hexViewRadius: number = 0;
    private _parentScale: number = 0;

    private _cursorBorderNode: Node = null;
    private _cursorBorderPool: Node[] = null;
    protected onLoad(): void {
        this._cursorBorderNode = new Node();
        this._cursorBorderNode.active = false;
        this._cursorBorderNode.addComponent(UITransform);
        const sprite = this._cursorBorderNode.addComponent(Sprite);
        sprite.spriteFrame = this.cursorBorderImage;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        this._cursorBorderNode.layer = this.node.layer;
        this._cursorBorderPool = [];
    }

    start() {
    }

    update(deltaTime: number) {

    }

    private _prepareBorderPos(tiledPositions: Vec2[]): {
        centerPos: Vec3;
        borderAngle: number;
        lineWidth: number;
    }[] {
        const worldPositons: { centerPos: Vec3, borderAngle: number, lineWidth: number }[] = [];
        const sinValue = Math.sin(30 * Math.PI / 180);
        for (let i = 0; i < tiledPositions.length; i++) {
            const tiledPos = tiledPositions[i];
            const centerWorldPos = GameMainHelper.instance.tiledMapGetPosWorld(tiledPos.x, tiledPos.y);
            // left top
            const leftTop = GameMainHelper.instance.tiledMapGetAroundByDirection(v2(tiledPos.x, tiledPos.y), TileHexDirection.LeftTop);
            if (leftTop == null ||
                !tiledPositions.some(pos => pos.x === leftTop.x && pos.y === leftTop.y)) {
                worldPositons.push({
                    centerPos: v3(
                        -this._hexViewRadius / 2 + centerWorldPos.x,
                        sinValue * this._hexViewRadius + (this._hexViewRadius - sinValue * this._hexViewRadius) / 2 + centerWorldPos.y,
                        0
                    ),
                    borderAngle: 30,
                    lineWidth: this._hexViewRadius / this._parentScale / Math.cos(30 * Math.PI / 180)
                });
            }
            // left 
            const left = GameMainHelper.instance.tiledMapGetAroundByDirection(v2(tiledPos.x, tiledPos.y), TileHexDirection.Left);
            if (left == null ||
                !tiledPositions.some(pos => pos.x === left.x && pos.y === left.y)) {
                worldPositons.push({
                    centerPos: v3(
                        -this._hexViewRadius + centerWorldPos.x,
                        0 + centerWorldPos.y,
                        0
                    ),
                    borderAngle: 90,
                    lineWidth: this._hexViewRadius / this._parentScale
                });
            }
            // left bottom
            const leftBottom = GameMainHelper.instance.tiledMapGetAroundByDirection(v2(tiledPos.x, tiledPos.y), TileHexDirection.LeftBottom);
            if (leftBottom == null ||
                !tiledPositions.some(pos => pos.x === leftBottom.x && pos.y === leftBottom.y)) {
                worldPositons.push({
                    centerPos: v3(
                        -this._hexViewRadius / 2 + centerWorldPos.x,
                        -sinValue * this._hexViewRadius - Math.abs(-this._hexViewRadius + sinValue * this._hexViewRadius) / 2 + centerWorldPos.y,
                        0
                    ),
                    borderAngle: -30,
                    lineWidth: this._hexViewRadius / this._parentScale / Math.cos(30 * Math.PI / 180)
                });
            }
            // right bottom
            const rightBottom = GameMainHelper.instance.tiledMapGetAroundByDirection(v2(tiledPos.x, tiledPos.y), TileHexDirection.RightBottom);
            if (rightBottom == null ||
                !tiledPositions.some(pos => pos.x === rightBottom.x && pos.y === rightBottom.y)) {
                worldPositons.push({
                    centerPos: v3(
                        this._hexViewRadius / 2 + centerWorldPos.x,
                        -sinValue * this._hexViewRadius - Math.abs(-this._hexViewRadius + sinValue * this._hexViewRadius) / 2 + centerWorldPos.y,
                        0
                    ),
                    borderAngle: 30,
                    lineWidth: this._hexViewRadius / this._parentScale / Math.cos(30 * Math.PI / 180)
                });
            }
            // right
            const right = GameMainHelper.instance.tiledMapGetAroundByDirection(v2(tiledPos.x, tiledPos.y), TileHexDirection.Right);
            if (right == null ||
                !tiledPositions.some(pos => pos.x === right.x && pos.y === right.y)) {
                worldPositons.push({
                    centerPos: v3(
                        this._hexViewRadius + centerWorldPos.x,
                        0 + centerWorldPos.y,
                        0
                    ),
                    borderAngle: 90,
                    lineWidth: this._hexViewRadius / this._parentScale
                });
            }
            // right top
            GameMainHelper.instance.tiledMapGetAroundByDirection
            const rightTop = GameMainHelper.instance.tiledMapGetAroundByDirection(v2(tiledPos.x, tiledPos.y), TileHexDirection.RightTop);
            if (rightTop == null ||
                !tiledPositions.some(pos => pos.x === rightTop.x && pos.y === rightTop.y)) {
                worldPositons.push({
                    centerPos: v3(
                        this._hexViewRadius / 2 + centerWorldPos.x,
                        sinValue * this._hexViewRadius + (this._hexViewRadius - sinValue * this._hexViewRadius) / 2 + centerWorldPos.y,
                        0
                    ),
                    borderAngle: -30,
                    lineWidth: this._hexViewRadius / this._parentScale / Math.cos(30 * Math.PI / 180)
                });
            }
        }
        return worldPositons;
    }
}


