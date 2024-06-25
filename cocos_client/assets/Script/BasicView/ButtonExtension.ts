// ButtonExtension.ts

import { _decorator, Component, Button, CCFloat } from "cc";

const { ccclass, property } = _decorator;

@ccclass
export default class ButtonExtension extends Component {
    @property({
        type: CCFloat,
    })
    private disableDuration: number = 0.3;

    onLoad() {
        this._extendButton();
    }

    private _extendButton() {
        const self = this;
        const originalOnEnable = Button.prototype.onEnable;
        const originalOnDisable = Button.prototype.onDisable;
        const originalOnClick = Button.prototype["_onTouchEnded"];

        Button.prototype.onEnable = function () {
            if (originalOnEnable) {
                originalOnEnable.call(this);
            }
            this.__cooldowning = false;
            this.__finishInteractable = false;
            this.node.on("click", this._onClickWithDelay, this);
        };
        Button.prototype.onDisable = function () {
            if (originalOnDisable) {
                originalOnDisable.call(this);
            }
            this.node.off("click", this._onClickWithDelay, this);
        };
        Button.prototype["_onClickWithDelay"] = function (event) {
            if (this.interactable) {
                this.interactable = false;
                this.__finishInteractable = true;
                if (originalOnClick) {
                    originalOnClick.call(this, event);
                }
                this.__cooldowning = true;
                this.scheduleOnce(() => {
                    this.interactable = this.__finishInteractable;
                    this.__cooldowning = false;
                }, self.disableDuration);
            }
        };
        // listen interactable change
        const originalDescriptor = Object.getOwnPropertyDescriptor(Button.prototype, "interactable");
        Object.defineProperty(Button.prototype, "interactable", {
            get: function () {
                return originalDescriptor.get.call(this);
            },
            set: function (value) {
                // If interactable is changed during cooldown, save the new value to be restored after the cooldown ends.
                if (this.__cooldowning) {
                    this.__finishInteractable = value;
                }
                originalDescriptor.set.call(this, value);
            },
            configurable: true,
        });
    }
}
