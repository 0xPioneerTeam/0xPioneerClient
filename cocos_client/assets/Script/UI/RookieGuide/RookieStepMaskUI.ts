import { _decorator, Camera, Component, Mask, Node, Size, UITransform, v3, Vec3 } from "cc";
import ViewController from "../../BasicView/ViewController";
import UIPanelManger from "../../Basic/UIPanelMgr";
import GameMainHelper from "../../Game/Helper/GameMainHelper";
import { RookieTapPositionType } from "../../Const/RookieDefine";
const { ccclass, property } = _decorator;

@ccclass("RookieStepMaskUI")
export class RookieStepMaskUI extends ViewController {
    private _nextActionCallback: () => void = null;

    private _contentView: Node = null;
    private _maskView: Node = null;
    private _bgView: Node = null;
    private _instructView: Node = null;
    private _actionButton: Node = null;

    public configuration(
        isFromGameView: boolean,
        worldPos: Vec3,
        size: Size,
        nextActionCallback: () => void,
        isDialogUse: boolean = false,
        tapPostionType: RookieTapPositionType = RookieTapPositionType.NORMAL
    ) {
        this.scheduleOnce(() => {
            this._contentView.active = true;
            this.node.active = true;
            const localPos = isFromGameView
                ? GameMainHelper.instance.getGameCameraWposToUI(worldPos, this.node)
                : this.node.getComponent(UITransform).convertToNodeSpaceAR(worldPos);

            this._maskView.position = localPos;
            this._maskView.getComponent(UITransform).setContentSize(size);
            this._maskView.active = !isDialogUse;

            this._bgView.position = v3(-this._maskView.position.x, -this._maskView.position.y, this._bgView.position.z);

            let instructPos = null;
            if (tapPostionType == RookieTapPositionType.BUTTON) {
                instructPos = v3(localPos.x + size.width / 2 - 15, localPos.y - size.height / 2);
            } else if (tapPostionType == RookieTapPositionType.DIALOG) {
                instructPos = v3(localPos.x, localPos.y - 55);
            } else {
                instructPos = v3(localPos.x, localPos.y - 10);
            }
            this._instructView.position = instructPos;

            this._actionButton.position = localPos;
            this._actionButton.getComponent(UITransform).contentSize = size;

            this._nextActionCallback = nextActionCallback;
        });
    }
    public get instructView() {
        return this._instructView;
    }
    public isShow() {
        return this.node.active && this._contentView.active;
    }

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._contentView = this.node.getChildByPath("Content");
        this._maskView = this._contentView.getChildByPath("Mask");
        this._bgView = this._maskView.getChildByPath("Bg");
        this._instructView = this._contentView.getChildByPath("Click_A");
        this._actionButton = this._contentView.getChildByPath("ActionButton");

        this._contentView.active = false;
    }

    protected viewDidStart(): void {
        super.viewDidStart();
    }

    //---------------------------------------- action
    private onTapAction() {
        this._contentView.active = false;
        if (this._nextActionCallback != null) {
            this._nextActionCallback();
        }
    }

    hide() {
        this._contentView.active = false;
        this.node.active = false;
    }
}
