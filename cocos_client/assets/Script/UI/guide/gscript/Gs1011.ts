import { view, UITransform, Button, find, EventHandler, NodeEventType } from "cc";
import NotificationMgr from "../../../Basic/NotificationMgr";
import { NotificationName } from "../../../Const/Notification";
import GameMainHelper from "../../../Game/Helper/GameMainHelper";
import RookieStepMgr from "../../../Manger/RookieStepMgr";
import { GsBase } from "./GsBase";
import GameMusicPlayMgr from "../../../Manger/GameMusicPlayMgr";
import { InnerBuildingType } from "../../../Const/BuildingDefine";


export class Gs1011 extends GsBase{
    gsStart() {
        super.gsStart();
    }

    protected update(dt: number): void {
        let NFTInfoUI = find("Main/UI_Canvas/UI_ROOT/NFTInfoUI");
        if(NFTInfoUI){
            this._guide_step = 3;
            return;
        }
        let NFTBackpack = find("Main/UI_Canvas/UI_ROOT/NFTBackpack");
        if(NFTBackpack){
            this._guide_step = 2;
            return;
        }
        this._guide_step = 1;
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
            const nftButton = this.mainUI.node.getChildByPath("CommonContent/NFTButton");
            RookieStepMgr.instance().maskView.configuration(false, nftButton.worldPosition, nftButton.getComponent(UITransform).contentSize, () => {
                RookieStepMgr.instance().maskView.hide();
                GameMusicPlayMgr.playTapButtonEffect();
                let btn = nftButton.getComponent(Button);
                let event = new Event(NodeEventType.TOUCH_START);
                EventHandler.emitEvents(btn.clickEvents,event);
                this._guide_step = 2;
            });
        }
    }


}