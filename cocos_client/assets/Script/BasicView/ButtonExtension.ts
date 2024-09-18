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
            this.node.off("click", this._onClickWithDelay, this);
            this.node.on("click", this._onClickWithDelay, this);
        };
        Button.prototype.onDisable = function () {
            if (originalOnDisable) {
                originalOnDisable.call(this);
            }
            this.node.off("click", this._onClickWithDelay, this);
        };
        Button.prototype["_onClickWithDelay"] = function (event) {
            console.log("exce b: " + this.interactable);
            if (this.interactable) {
                console.log("exce button delaybegin:", this.node.name);
                this.interactable = false;
                this.__finishInteractable = true;
                if (originalOnClick) {
                    originalOnClick.call(this, event);
                }
                this.__cooldowning = true;
                // use settimeout, because of onDisable schiedule will not action
                this.scheduleOnce(() => {
                    this.__cooldowning = false;
                    this.interactable = this.__finishInteractable;
                    console.log("exce button delayend:", this.node.name + ", en: " + this.__finishInteractable);
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
                    console.log("exce button set:" + value);
                } else {
                    originalDescriptor.set.call(this, value);
                }
            },
            configurable: true,
        });
    }
}
