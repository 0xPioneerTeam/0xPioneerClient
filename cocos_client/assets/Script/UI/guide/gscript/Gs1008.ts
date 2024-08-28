import { UITransform, Button, EventHandler, NodeEventType } from "cc";
import NotificationMgr from "../../../Basic/NotificationMgr";
import { NotificationName } from "../../../Const/Notification";
import GameMainHelper from "../../../Game/Helper/GameMainHelper";
import RookieStepMgr from "../../../Manger/RookieStepMgr";
import { GsBase } from "./GsBase";
import GameMusicPlayMgr from "../../../Manger/GameMusicPlayMgr";
import { InnerBuildingType } from "../../../Const/BuildingDefine";


export class Gs1008 extends GsBase{
    gsStart() {
        super.gsStart();
    }

    protected update(dt: number): void {
        let isGameShowOuter = GameMainHelper.instance.isGameShowOuter;
        if(isGameShowOuter)
        {
            this._guide_step = 1;
        }else{
            this._guide_step = 2;
            let TrainingCenter = this._innerBuildingController.getBuildingByKey(InnerBuildingType.TrainingCenter)
            if(TrainingCenter){
                //collecting
                let upgrading = TrainingCenter.building.upgrading;
                if(upgrading){
                    this._guide_step = -1;
                    return;
                }
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
            const TrainingCenter = this._innerBuildingController.getBuildingByKey(InnerBuildingType.TrainingCenter).node;
            RookieStepMgr.instance().maskView.configuration(false, TrainingCenter.worldPosition, TrainingCenter.getComponent(UITransform).contentSize, () => {
                RookieStepMgr.instance().maskView.hide();
                let button = TrainingCenter.getChildByName('clickNode').getComponent(Button);
                let event = new Event(NodeEventType.TOUCH_START);
                EventHandler.emitEvents(button.clickEvents,event);
                this._guide_step = 3;
            });
        }
    }


}