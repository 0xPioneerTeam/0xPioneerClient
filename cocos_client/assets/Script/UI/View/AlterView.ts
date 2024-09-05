import { _decorator, Component, Label, Node, tween, v3 } from "cc";
import ViewController from "../../BasicView/ViewController";
import UIPanelManger, { UIPanelLayerType } from "../../Basic/UIPanelMgr";
import { LanMgr } from "../../Utils/Global";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import { RookieStep } from "../../Const/RookieDefine";
import { DataMgr } from "../../Data/DataMgr";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";

const { ccclass, property } = _decorator;

@ccclass("AlterView")
export class AlterView extends ViewController {
    public showTip(tip: string, confirmCallback: () => void = null, cancelCallback: () => void = null) {
        this.node.getChildByPath("Content/Tip").getComponent(Label).string = tip;
        this._confirmCallback = confirmCallback;
        this._cancelCallback = cancelCallback;
    }

    private _confirmCallback: () => void = null;
    private _cancelCallback: () => void = null;
    protected viewDidLoad(): void {
        super.viewDidLoad();

        // this.node.getChildByPath("Content/Title").getComponent(Label).string = LanMgr.getLanById("lanreplace200002");
        // this.node.getChildByPath("Content/ConfrimButton/name").getComponent(Label).string = LanMgr.getLanById("lanreplace200003");
        // this.node.getChildByPath("Content/CancelButton/name").getComponent(Label).string = LanMgr.getLanById("lanreplace200004");

        NotificationMgr.addListener(NotificationName.ROOKIE_GUIDE_TAP_ALTER_CONFRIM, this._onRookieTapThis, this);
    }

    protected viewDidAppear(): void {
        super.viewDidAppear();

        const rookieStep: RookieStep = DataMgr.s.userInfo.data.rookieStep;
        if (rookieStep != RookieStep.FINISH) {
            NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_NEED_MASK_SHOW, {
                tag: "alterConfrim",
                view: this.node.getChildByPath("Content/ConfrimButton"),
                tapIndex: "-1",
            });
        }
    }

    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByPath("Content");
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.ROOKIE_GUIDE_TAP_ALTER_CONFRIM, this._onRookieTapThis, this);
    }

    //-------------------------------- action
    private async onTapConfrim() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node, UIPanelLayerType.HUD);
        if (this._confirmCallback != null) {
            this._confirmCallback();
        }
    }

    private async onTapCancel() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node, UIPanelLayerType.HUD);
        if (this._cancelCallback != null) {
            this._cancelCallback();
        }
    }

    //----------------------------- notification
    private _onRookieTapThis(data: { tapIndex: string }) {
        if (data.tapIndex == "-1") {
            this.onTapConfrim();
        }
    }
}
