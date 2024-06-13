import { _decorator, Label, Node, UITransform, Vec2 } from "cc";
import ViewController from "../BasicView/ViewController";
import UIPanelManger from "../Basic/UIPanelMgr";
import GameMainHelper from "../Game/Helper/GameMainHelper";
import CommonTools from "../Tool/CommonTools";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
import { DataMgr } from "../Data/DataMgr";
import { RookieStep } from "../Const/RookieDefine";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
const { ccclass, property } = _decorator;

@ccclass("MapActionConfrimTipUI")
export class MapActionConfrimTipUI extends ViewController {
    private _targetPos: Vec2 = null;
    private _targetName: string = "";
    private _step: number = 0;
    private _costEnergy: number = null;
    private _moveSpeed: number = 0;
    private _actionCallback: (confirmed: boolean) => void = null;

    public configuration(targetPos: Vec2, targetName: string, step: number, costEnergy, moveSpeed: number, actionCallback: (confirmed: boolean) => void) {
        this._targetPos = targetPos;
        this._targetName = targetName;
        this._step = step;
        this._costEnergy = costEnergy;
        this._moveSpeed = moveSpeed;
        this._actionCallback = actionCallback;
        this._refreshUI();
    }

    protected viewDidLoad(): void {
        super.viewDidLoad();

        // useLanMgr
        // this.node.getChildByPath("Content/Title").getComponent(Label).string = LanMgr.getLanById("106008");
        // this.node.getChildByPath("Content/CostView/Title").getComponent(Label).string = LanMgr.getLanById("106008");
        // this.node.getChildByPath("Content/MoveCountView/Title").getComponent(Label).string = LanMgr.getLanById("106008");
        // this.node.getChildByPath("Content/CostTimeView/Title").getComponent(Label).string = LanMgr.getLanById("106008");
        // this.node.getChildByPath("Content/ArriveTimeView/Title").getComponent(Label).string = LanMgr.getLanById("106008");
        // this.node.getChildByPath("Content/Button/name").getComponent(Label).string = LanMgr.getLanById("106008");
        NotificationMgr.addListener(NotificationName.ROOKIE_GUIDE_TAP_MAP_ACTION_CONFRIM, this._onRookieTapThis, this);
    }
    protected async viewDidAppear(): Promise<void> {
        super.viewDidAppear();

        const buttonView = this.node.getChildByPath("Content/Button");

        const rookieStep: RookieStep = DataMgr.s.userInfo.data.rookieStep;
        if (rookieStep != RookieStep.FINISH) {
            NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_NEED_MASK_SHOW, { tag: "mapActionConfrim", view: buttonView, tapIndex: "-1" });
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

        NotificationMgr.removeListener(NotificationName.ROOKIE_GUIDE_TAP_MAP_ACTION_CONFRIM, this._onRookieTapThis, this);
    }

    private async _refreshUI() {
        if (this._targetPos != null) {
            this.node.getChildByPath("Content/LocationView/Content/Label").getComponent(Label).string = "(" + this._targetPos.x + "," + this._targetPos.y + ")";
        }
        this.node.getChildByPath("Content/LocationView/Content/Title").getComponent(Label).string = this._targetName;

        this.node.getChildByPath("Content/CostView/Content/Value").getComponent(Label).string = this._costEnergy.toString();
        this.node.getChildByPath("Content/MoveCountView/Content/Value").getComponent(Label).string = this._step.toString();

        const perStepTime: number = ((GameMainHelper.instance.tiledMapTilewidth * 0.5) / this._moveSpeed) * (1 / 60) * 1000;
        this.node.getChildByPath("Content/CostTimeView/Value").getComponent(Label).string = CommonTools.formatSeconds(perStepTime * this._step);
        this.node.getChildByPath("Content/ArriveTimeView/Value").getComponent(Label).string = CommonTools.formatDateTime(
            perStepTime * this._step + new Date().getTime()
        );
    }
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._actionCallback != null) {
            this._actionCallback(false);
        }
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }
    private async onTapAction() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._actionCallback != null) {
            this._actionCallback(true);
        }
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }

    //-------------------------------------- notification
    private _onRookieTapThis(data: { tapIndex: string }) {
        this.onTapAction();
    }
}
