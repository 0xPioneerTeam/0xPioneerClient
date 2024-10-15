import { _decorator, Component, Node, Button, Label, tween, Vec3, Mask, Gradient, Graphics, Color, color, UITransform, instantiate, v3, UIOpacity, CCInteger } from "cc";
const { ccclass, property } = _decorator;

export interface CircularListDelegate {
    circularListTotalNum(): number;
    circularListUpdateNode(node: Node, index: number): void;

    circularListTapItem(index: number): void;
}

@ccclass("CircularList")
export class CircularList extends Component {
    public delegate: CircularListDelegate = null;

    public reloadUI(): void {
        if (this.delegate == null) {
            console.error("null delegate");
            return;
        }
        const allItemLength = this.delegate.circularListTotalNum();
        if (allItemLength <= 0) {
            return;
        }
        // contentWidth
        const showNum = Math.min(allItemLength, this.visibleItemCount);
        this.node.getComponent(UITransform).setContentSize(this.itemWidht * showNum + this.itemGap * (showNum - 1), 9999);

        this._canCircular = false;
        let listCount = showNum;
        if (this._allItemNum != allItemLength) {
            this._currentIndex = 0;
        }
        this._allItemNum = allItemLength;

        if (allItemLength > this.visibleItemCount) {
            listCount += 2;
            this._canCircular = true;
        }
        let index = 0;
        for (index; index < listCount; index++) {
            let item = null;
            if (index < this._useItems.length) {
                item = this._useItems[index];
            } else {
                item = instantiate(this.itemNode);
                item.active = true;
                item.parent = this.node;
                // opacity
                if (item.getComponent(UIOpacity) == null) {
                    item.addComponent(UIOpacity);
                }
                // button
                let button = item.getComponent(Button);
                if (button == null) {
                    button = item.addComponent(Button);
                }
                button.transition = Button.Transition.SCALE;
                button.zoomScale = 0.9;
                let evthandler = new CircularList.EventHandler();
                evthandler._componentName = "CircularList";
                evthandler.target = this.node;
                evthandler.handler = "onTapItem";
                button.clickEvents.push(evthandler);
                this._useItems.push(item);
            }
        }
        for (; index < this._useItems.length;) {
            this._useItems[index].destroy();
            this._useItems.splice(index, 1);
        }
        this._updateVisibleItems();
    }
    public switchToLeft(duration: number = 0.3): void {
        this._animateItems(true, duration);
    }
    public swithToRight(duration: number = 0.3): void {
        this._animateItems(false, duration);
    }
    public canCircular(): boolean {
        return this._canCircular;
    }
    public getItemNode(index: number): Node {
        // be like error function, temp use
        if (index < 0 || index > this._useItems.length - 1) {
            return null;
        }
        return this._useItems[index];
    }


    @property(Node)
    private itemNode: Node = null;

    @property(CCInteger)
    private visibleItemCount: number = 3;

    @property(CCInteger)
    private itemWidht: number = 232;

    @property(CCInteger)
    private itemGap: number = 100;

    private _allItemNum: number = 0;
    private _canCircular: boolean = false;
    private _useItems: Node[] = [];
    private _currentIndex: number = 0;
    private _isAnimating: boolean = false;

    onLoad() {
        let mask = this.node.getComponent(Mask);
        let graphics = this.node.getComponent(Graphics);
        if (mask == null) {
            mask = this.node.addComponent(Mask);
        }
        if (graphics == null) {
            graphics = this.node.addComponent(Graphics);
        }
        mask.type = Mask.Type.GRAPHICS_RECT;
        graphics.lineWidth = 1;
        graphics.lineJoin = Graphics.LineJoin.MITER;
        graphics.lineCap = Graphics.LineCap.BUTT;
        graphics.strokeColor = new Color(0, 0, 0, 255);
        graphics.fillColor = new Color(255, 255, 255, 0);
        graphics.miterLimit = 10;

        if (this.itemNode.parent == this.node) {
            this.itemNode.removeFromParent();
        }
    }

    protected start(): void {}

    private _animateItems(toLeft: boolean, duration: number = 0) {
        if (this._isAnimating) {
            return;
        }
        this._isAnimating = true;
        if (duration < 0) {
            duration = 0;
        }
        const t = new Date().getTime();
        let moveOver: boolean = false;
        let showOver: boolean = false;
        let hideOver: boolean = false;

        let showItem: Node = null;
        let hideItem: Node = null;
        this._useItems.forEach((item, index) => {
            const targetX = item.position.x + (toLeft ? this.itemWidht + this.itemGap : -(this.itemWidht + this.itemGap));
            tween(item)
                .to(duration, { position: new Vec3(targetX, item.position.y, item.position.z) })
                .delay(0.2)
                .call(
                    index === this._useItems.length - 1
                        ? () => {
                              moveOver = true;
                              if (moveOver && showOver && hideOver) {
                                  this._animateEnd(toLeft);
                              }
                          }
                        : null
                )
                .start();
            if (toLeft) {
                if (index === 0) {
                    showItem = item;
                } else if (index === this.visibleItemCount) {
                    hideItem = item;
                }
            } else {
                if (index === this._useItems.length - 1) {
                    showItem = item;
                } else if (index === 1) {
                    hideItem = item;
                }
            }
        });
        if (showItem !== null) {
            showItem.getComponent(UIOpacity).opacity = 0;
            showItem.scale = v3(0, 0, 0);
            tween(showItem.getComponent(UIOpacity))
                .to(duration, { opacity: 255 })
                .call(() => {
                    showOver = true;
                    if (moveOver && showOver && hideOver) {
                        this._animateEnd(toLeft);
                    }
                })
                .start();
            tween(showItem)
                .to(duration, { scale: v3(1, 1, 1) })
                .start();
        }
        if (hideItem !== null) {
            hideItem.getComponent(UIOpacity).opacity = 255;
            hideItem.scale = v3(1, 1, 1);
            tween(hideItem.getComponent(UIOpacity))
                .to(duration, { opacity: 0 })
                .call(() => {
                    hideOver = true;
                    if (moveOver && showOver && hideOver) {
                        this._animateEnd(toLeft);
                    }
                })
                .start();
            tween(hideItem)
                .to(duration, { scale: v3(0, 0, 0) })
                .start();
        }
    }
    private _animateEnd(toLeft: boolean) {
        this._isAnimating = false;
        this._currentIndex = toLeft ? this._currentIndex - 1 : this._currentIndex + 1;
        if (this._currentIndex > this._allItemNum - 1) {
            this._currentIndex = 0;
        }
        if (this._currentIndex < 0) {
            this._currentIndex = this._allItemNum - 1;
        }
        this._updateVisibleItems();
    }

    private _updateVisibleItems() {
        if (this.delegate == null) {
            console.error("null deletage");
            return;
        }
        let beginIndex: number = this._canCircular ? this._currentIndex - 1 : this._currentIndex;
        if (beginIndex < 0) {
            beginIndex += this._allItemNum;
        }
        let startX = 0;
        const totalWidth = this.itemWidht + this.itemGap;
        if (this._useItems.length % 2 === 0) {
            startX = -((this._useItems.length / 2 - 1) * totalWidth + totalWidth / 2);
        } else {
            startX = -Math.floor(this._useItems.length / 2) * totalWidth;
        }
        for (let i = 0; i < this._useItems.length; i++) {
            let dataIndex = beginIndex + i;
            if (dataIndex > this._allItemNum - 1) {
                dataIndex -= this._allItemNum;
            }
            const item = this._useItems[i];
            item.name = "item_" + i;
            item.getComponent(UIOpacity).opacity = 255;
            item.scale = v3(1, 1, 1);
            item.getComponent(Button).clickEvents[0].customEventData = dataIndex.toString();
            item.setPosition(v3(startX + totalWidth * i, 0, 0));
            this.delegate.circularListUpdateNode(item, dataIndex);
        }
    }

    //------------------------- event
    private onTapItem(event: Event, customEventData: string) {
        const index = parseInt(customEventData);
        if (this.delegate == null) {
            console.error("null deletage");
            return;
        }
        this.delegate.circularListTapItem(index);
    }
}
