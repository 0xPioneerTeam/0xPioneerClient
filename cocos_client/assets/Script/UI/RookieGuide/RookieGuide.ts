import { _decorator, Animation, Button, Component, Label, Node, tween, v3 } from "cc";
import { LanMgr } from "../../Utils/Global";
import ViewController from "../../BasicView/ViewController";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("RookieGuide")
export class RookieGuide extends ViewController {
    private _videoView: Node = null;
    private _guideView: Node = null;

    private _wakeUpTimes: number = 0;
    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._videoView = this.node.getChildByName("VideoContent");
        this._guideView = this.node.getChildByName("GuideContent");

        this._videoView.active = false;
        this._guideView.active = true;
        // useLanMgr
        // this._videoView.getChildByPath("SkipButton/Label").getComponent(Label).string = LanMgr.getLanById("107549");
    }

    //---------------------------------------
    // action
    private onTapSkipVideo() {
        GameMusicPlayMgr.playTapButtonEffect();
        this._videoView.active = false;
        this._guideView.active = true;
    }

    private _animing: boolean = false;
    private onTapWakeUpRole() {
        if (this._wakeUpTimes >= 3) {
            return;
        }
        if (this._animing) {
            return;
        }

        let rate = 1 + 2 * this._wakeUpTimes;
        tween()
            .target(this.node)
            .sequence(
                tween().by(0.05, { position: v3(20 * rate, 20 * rate, 0) }),
                tween().by(0.1, { position: v3(-40 * rate, -40 * rate, 0) }),
                tween().by(0.1, { position: v3(40 * rate, 40 * rate, 0) }),
                tween().by(0.05, { position: v3(-20 * rate, -20 * rate, 0) })
            )
            .start();

        this._wakeUpTimes += 1;
        const wakeUpTipView = this._guideView.getChildByPath("WakeupButton/WakeUpTip");
        wakeUpTipView.getChildByName("Exclamation_" + this._wakeUpTimes).active = true;
        if (this._wakeUpTimes == 1) {
            GameMusicPlayMgr.playTapButtonEffect();

            this._guideView.getChildByName("Wake_Up_01_Group").active = true;
            this._animing = true;
            this.scheduleOnce(() => {
                this._animing = false;
                this._guideView.getChildByName("Wake_Up_01_Group").active = false;
            }, 1);
        } else if (this._wakeUpTimes == 2) {
            GameMusicPlayMgr.playTapButtonEffect();

            this._guideView.getChildByName("Wake_Up_02_Group").active = true;
            this._animing = true;
            this.scheduleOnce(() => {
                this._animing = false;
                this._guideView.getChildByName("Wake_Up_02_Group").active = false;
            }, 1);
        } else if (this._wakeUpTimes == 3) {
            GameMusicPlayMgr.playWakeUpEffect();

            this._guideView.getChildByName("Wake_Up_Text_Group").active = true;
            this.scheduleOnce(() => {
                this._guideView.getChildByName("Wake_Up_Text_Group").active = false;
                const openEyesView = this._guideView.getChildByName("OpenEyes");
                openEyesView.active = true;
                openEyesView.getComponent(Animation).play();
                NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_BEGIN_EYES);
                this.scheduleOnce(() => {
                    NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_THIRD_EYES);
                }, 3);
                openEyesView.getComponent(Animation).on(Animation.EventType.FINISHED, () => {});
                this._guideView.getChildByName("Bg").active = false;
                this._guideView.getChildByName("WakeupButton").active = false;
            }, 3);
        }
    }
}
