import NotificationMgr from "../../Basic/NotificationMgr";
import ViewController from "../../BasicView/ViewController";
import { _decorator, Button, find, instantiate, Label, Node, Prefab, RichText, tween, UITransform, Vec3 } from "cc";
import { NotificationName } from "../../Const/Notification";
import { DataMgr } from "../../Data/DataMgr";
import GuideConfig from "../../Config/GuideConfig";
import { LanMgr } from "../../Utils/Global";
import { RookieStep } from "../../Const/RookieDefine";
import { NetworkMgr } from "../../Net/NetworkMgr";

const { ccclass, property } = _decorator;

@ccclass("GuideUI")
export class GuideUI extends ViewController {

    private lbl_cur:Label = null;
    private lbl_total:Label = null;
    private lbl_msg:RichText = null;
    private lbl_state:Label = null;

    _lastRookeStep:number = 0;
    _lastRookieState:number = 0;

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this.lbl_cur = this.node.getChildByPath('lbl_cur').getComponent(Label);
        this.lbl_total = this.node.getChildByPath('lbl_total').getComponent(Label);
        this.lbl_state = this.node.getChildByPath('lbl_state').getComponent(Label);
        this.lbl_msg = this.node.getChildByPath('lbl_msg').getComponent(RichText);
        NotificationMgr.addListener(NotificationName.USERINFO_ROOKE_STEP_CHANGE, this._onRookieStepChange, this);
        this._onRookieStepChange();
    }

    protected viewDidDisAppear(): void {
        NotificationMgr.removeListener(NotificationName.USERINFO_ROOKE_STEP_CHANGE, this._onRookieStepChange,this);
    }

    _onRookieStepChange(){
        const rookieStep = DataMgr.s.userInfo.data.rookieStep;
        const rookieState = DataMgr.s.userInfo.data.rookieState;
        if(rookieStep >= RookieStep.FINISH){
            this.node.active = false;
            return;
        }
        if(this._lastRookeStep == rookieStep && this._lastRookieState == rookieState) return;
        this._lastRookeStep = rookieStep;
        this._lastRookieState = rookieState;
        let conf = GuideConfig.getById(rookieStep+'');
        if(!conf){
            return;
        }
        this.lbl_cur.string = conf.guide_stepInfo.split("|")[0];
        this.lbl_total.string = conf.guide_stepInfo.split("|")[1];
        this.lbl_msg.string = LanMgr.getLanById(conf.name);
        this.lbl_state.string = rookieState == 0 ? LanMgr.getLanById('rookie_state_doing') : LanMgr.getLanById('rookie_state_finish');
    }

    onTapGuide() {
        const rookieStep = DataMgr.s.userInfo.data.rookieStep;
        const rookieState = DataMgr.s.userInfo.data.rookieState;
        if(rookieStep >= RookieStep.FINISH){
            return;
        }
        if(rookieState == 0){
            NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_TAP_TASK_PANEL);
        }else{//finsh
            NetworkMgr.websocketMsg.player_get_rookie_award({});
        }
    }

}