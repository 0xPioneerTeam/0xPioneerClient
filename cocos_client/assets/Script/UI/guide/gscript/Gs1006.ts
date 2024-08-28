import { view, UITransform, Button, find, EventHandler, NodeEventType } from "cc";
import NotificationMgr from "../../../Basic/NotificationMgr";
import { NotificationName } from "../../../Const/Notification";
import GameMainHelper from "../../../Game/Helper/GameMainHelper";
import RookieStepMgr from "../../../Manger/RookieStepMgr";
import { GsBase } from "./GsBase";
import GameMusicPlayMgr from "../../../Manger/GameMusicPlayMgr";
import { InnerBuildingType } from "../../../Const/BuildingDefine";


export class Gs1006 extends GsBase{
    gsStart() {
        super.gsStart();
        this._guide_step = 1;
    }

    protected update(dt: number): void {
        
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
            const HeatProgress = this.mainUI.node.getChildByPath("CommonContent/HeatTreasureUI/__ViewContent/Content/HeatProgress");
            RookieStepMgr.instance().maskView.configuration(false, HeatProgress.worldPosition, HeatProgress.getComponent(UITransform).contentSize, () => {
                RookieStepMgr.instance().maskView.hide();
                GameMusicPlayMgr.playTapButtonEffect();
                let button = HeatProgress.getChildByName("HeatValue").getComponent(Button);
                let event = new Event(NodeEventType.TOUCH_START);
                EventHandler.emitEvents(button.clickEvents,event);
                this._guide_step = 2;
            });
        }
    }


}