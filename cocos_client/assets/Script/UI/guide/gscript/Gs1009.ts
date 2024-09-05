import { view, UITransform, Button, find, EventHandler, NodeEventType, ProgressBar, Vec3 } from "cc";
import NotificationMgr from "../../../Basic/NotificationMgr";
import { NotificationName } from "../../../Const/Notification";
import GameMainHelper from "../../../Game/Helper/GameMainHelper";
import RookieStepMgr from "../../../Manger/RookieStepMgr";
import { GsBase } from "./GsBase";
import GameMusicPlayMgr from "../../../Manger/GameMusicPlayMgr";
import { InnerBuildingType } from "../../../Const/BuildingDefine";


export class Gs1009 extends GsBase{
    gsStart() {
        super.gsStart();
    }

    protected update(dt: number): void {
        let isGameShowOuter = GameMainHelper.instance.isGameShowOuter;
        if(isGameShowOuter)
        {
            this._guide_step = 1;
        }else{
            if(!this._innerBuildingController){
                this.initBinding();
                return;
            }
            let TrainingCenter = this._innerBuildingController.getBuildingByKey(InnerBuildingType.TrainingCenter)
            if(TrainingCenter){
                //collecting
                if (TrainingCenter.building && TrainingCenter.building.troopIng) {
                    this._guide_step = -1;
                    return;
                }
            }
            this._guide_step = 2;
            let ExerciseButton = find("Main/UI_Canvas/UI_ROOT/NewBuildingUpgradeUI/__ViewContent/ExerciseButton");
            if(ExerciseButton){
                this._guide_step = 3;
                return;
            }
            let ExerciseUI = find("Main/UI_Canvas/UI_ROOT/ExerciseUI");
            if(ExerciseUI){
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
    
    _onTapGuideTask(){
        this.initBinding();
        if(this._guide_step == 1){
            const innerOuterChangeButton = this.mainUI.node.getChildByPath("CommonContent/InnerOutChangeBtnBg");
            RookieStepMgr.instance().maskView.configuration(false, innerOuterChangeButton.worldPosition, innerOuterChangeButton.getComponent(UITransform).contentSize, () => {
                RookieStepMgr.instance().maskView.hide();
                GameMusicPlayMgr.playTapButtonEffect();
                GameMainHelper.instance.changeInnerAndOuterShow();
                this._guide_step = 2;
            });
        }
        if(this._guide_step == 2){
            const view = this._innerBuildingController.getBuildingByKey(InnerBuildingType.TrainingCenter).node;
            GameMainHelper.instance.changeGameCameraPosition(Vec3.ZERO, true);
            GameMainHelper.instance.changeGameCameraZoom(1, true);
            RookieStepMgr.instance().maskView.configuration(false, view.worldPosition, view.getComponent(UITransform).contentSize, () => {
                RookieStepMgr.instance().maskView.hide();
                let button = view.getChildByName('clickNode').getComponent(Button);
                let event = new Event(NodeEventType.TOUCH_START);
                EventHandler.emitEvents(button.clickEvents,event);
                this._guide_step = 3;
                this.scheduleOnce(()=>{
                    this._onTapGuideTask();
                },0.5);
            });
        }
        if(this._guide_step == 3){
            let ExerciseButton = find("Main/UI_Canvas/UI_ROOT/NewBuildingUpgradeUI/__ViewContent/ExerciseButton");
            RookieStepMgr.instance().maskView.configuration(false, ExerciseButton.worldPosition, ExerciseButton.getComponent(UITransform).contentSize, () => {
                RookieStepMgr.instance().maskView.hide();
                let button = ExerciseButton.getComponent(Button);
                let event = new Event(NodeEventType.TOUCH_START);
                EventHandler.emitEvents(button.clickEvents,event);
                this._guide_step = 4;
            });
        }
        if(this._guide_step == 4){
            let ExercoseItem = find("Main/UI_Canvas/UI_ROOT/ExerciseUI/__ViewContent/ScrollView/View/Content").children[0];
            RookieStepMgr.instance().maskView.configuration(false, ExercoseItem.worldPosition, ExercoseItem.getComponent(UITransform).contentSize, () => {
                RookieStepMgr.instance().maskView.hide();
                this._guide_step = 5;
            });
        }
      
    }


}