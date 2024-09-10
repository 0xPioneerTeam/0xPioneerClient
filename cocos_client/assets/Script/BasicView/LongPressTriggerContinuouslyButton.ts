import { _decorator, Component, EventHandler, EventTouch, Node, NodeEventType, tween, v3, Vec3 } from "cc";

const { ccclass, property } = _decorator;

@ccclass
export default class LongPressTriggerContinuouslyButton extends Component {

    @property(Number)
    private triggerTime: number = 1;
    
    @property(Number)
    private holdTriggerInterval: number = 0.1;

    @property(EventHandler)
    public triggerEventHandler: EventHandler[] = [];

    private _origianlButtonScale: Vec3 = null;
    private _holdInterval: number = null;
    private _holdTime: number = 0;
    private _holdLimitTrigger: boolean = false;

    protected onLoad(): void {
        this._origianlButtonScale = this.node.scale.clone();

        this.node.on(NodeEventType.TOUCH_START, this._onTouchStart, this);
        this.node.on(NodeEventType.TOUCH_END, this._onTouchEnd, this);
        this.node.on(NodeEventType.TOUCH_CANCEL, this._onTouchEnd, this);
    }

    private _beginInterval() {
        this._holdInterval = setInterval(() => {
            this._holdTime += this.holdTriggerInterval;
            this._holdLimitTrigger = false;
            for (const handler of this.triggerEventHandler) {
                handler.emit([true]);
            }
        }, this.holdTriggerInterval * 1000) as unknown as number;
    }

    private _onTouchStart(event: EventTouch) {
        const currentButton = event.currentTarget as Node;
        this._holdTime = 0;
        this._holdLimitTrigger = true;
        tween(currentButton)
            .to(0.1, { scale: v3(0.9 * this._origianlButtonScale.x, 0.9 * this._origianlButtonScale.y, 0.9 * this._origianlButtonScale.z) })
            .start();
        this.scheduleOnce(this._beginInterval, this.triggerTime);
    }
    private _onTouchEnd(event: EventTouch) {
        const currentButton = event.currentTarget as Node;
        this.unschedule(this._beginInterval);
        if (this._holdInterval !== null) {
            clearInterval(this._holdInterval);
            this._holdInterval = null;
        }
        this._holdTime = 0;
        tween(currentButton)
            .to(0.1, { scale: this._origianlButtonScale })
            .start();
        if (this._holdLimitTrigger) {
            for (const handler of this.triggerEventHandler) {
                handler.emit([false]);
            }
            this._holdLimitTrigger = false;
        }
    }
}