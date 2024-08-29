import { view, UITransform, Button, find, ProgressBar, EventHandler, NodeEventType } from "cc";
import NotificationMgr from "../../../Basic/NotificationMgr";
import { NotificationName } from "../../../Const/Notification";
import GameMainHelper from "../../../Game/Helper/GameMainHelper";
import RookieStepMgr from "../../../Manger/RookieStepMgr";
import { GsBase } from "./GsBase";
import GameMusicPlayMgr from "../../../Manger/GameMusicPlayMgr";
import { InnerBuildingType } from "../../../Const/BuildingDefine";


export class Gs1003 extends GsBase {
    gsStart() {
        super.gsStart();
    }

    protected update(dt: number): void {
        let isGameShowOuter = GameMainHelper.instance.isGameShowOuter;
        if (isGameShowOuter) {
            this._guide_step = 1;
        } else {
            if(!this._innerBuildingController){
                this.initBinding();
                return;
            }
            let Barrack = this._innerBuildingController.getBuildingByKey(InnerBuildingType.Barrack)
            if (Barrack) {
                //collecting
                if (Barrack.building && Barrack.building.upgrading) {
                    this._guide_step = -1;
                    return;
                }
                if (Barrack.building && Barrack.building.troopIng) {
                    this._guide_step = -1;
                    return;
                }
            }
            this._guide_step = 2;
            let RecruitButton = find("Main/UI_Canvas/UI_ROOT/NewBuildingUpgradeUI/__ViewContent/RecruitButton");
            if (RecruitButton) {
                this._guide_step = 3;
                return;
            }
            let RecruitUI = find("Main/UI_Canvas/UI_ROOT/RecruitUI");
            if (RecruitUI) {
                this._guide_step = 4;
                return;
            }
        }
    }

    protected onEnable(): void {
        NotificationMgr.addListener(NotificationName.ROOKIE_GUIDE_TAP_TASK_PANEL, this._onTapGuideTask, this);
    }

    protected onDisable(): void {
        NotificationMgr.removeListener(NotificationName.ROOKIE_GUIDE_TAP_TASK_PANEL, this._onTapGuideTask, this);
    }

    _onTapGuideTask() {
        this.initBinding();
        if (this._guide_step == 1) {
            const innerOuterChangeButton = this.mainUI.node.getChildByPath("CommonContent/InnerOutChangeBtnBg");
            RookieStepMgr.instance().maskView.configuration(false, innerOuterChangeButton.worldPosition, innerOuterChangeButton.getComponent(UITransform).contentSize, () => {
                RookieStepMgr.instance().maskView.hide();
                GameMusicPlayMgr.playTapButtonEffect();
                GameMainHelper.instance.changeInnerAndOuterShow();
                this._guide_step = 2;
            });
        }
        if (this._guide_step == 2) {
            const BarrackNode = this._innerBuildingController.getBuildingByKey(InnerBuildingType.Barrack).node;
            RookieStepMgr.instance().maskView.configuration(false, BarrackNode.worldPosition, BarrackNode.getComponent(UITransform).contentSize, () => {
                RookieStepMgr.instance().maskView.hide();
                let button = BarrackNode.getChildByName('clickNode').getComponent(Button);
                let event = new Event(NodeEventType.TOUCH_START);
                EventHandler.emitEvents(button.clickEvents, event);
                this._guide_step = 3;
                this.scheduleOnce(() => {
                    this._onTapGuideTask();
                }, 0.5);
            });
        }
        if (this._guide_step == 3) {
            let RecruitButton = find("Main/UI_Canvas/UI_ROOT/NewBuildingUpgradeUI/__ViewContent/RecruitButton");
            RookieStepMgr.instance().maskView.configuration(false, RecruitButton.worldPosition, RecruitButton.getComponent(UITransform).contentSize, () => {
                RookieStepMgr.instance().maskView.hide();
                let button = RecruitButton.getComponent(Button);
                let event = new Event(NodeEventType.TOUCH_START);
                EventHandler.emitEvents(button.clickEvents, event);
                this._guide_step = 4;
            });
        }
        if (this._guide_step == 4) {
            let progressBar = find("Main/UI_Canvas/UI_ROOT/RecruitUI/__ViewContent/recruiting/scroll");
            RookieStepMgr.instance().maskView.configuration(false, progressBar.worldPosition, progressBar.getComponent(UITransform).contentSize, () => {
                RookieStepMgr.instance().maskView.hide();
                let pb = progressBar.getComponent(ProgressBar);
                if (pb) pb.progress = 0.2;
                this._guide_step = 5;
            });
        }
    }


}