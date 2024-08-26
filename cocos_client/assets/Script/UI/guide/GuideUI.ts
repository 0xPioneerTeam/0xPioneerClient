import NotificationMgr from "../../Basic/NotificationMgr";
import ViewController from "../../BasicView/ViewController";
import { _decorator, Button, find, instantiate, Label, Node, Prefab, RichText, tween, UITransform, Vec3 } from "cc";
import { NotificationName } from "../../Const/Notification";
import { DataMgr } from "../../Data/DataMgr";
import GuideConfig from "../../Config/GuideConfig";
import { LanMgr } from "../../Utils/Global";
import { RookieStep } from "../../Const/RookieDefine";

const { ccclass, property } = _decorator;

@ccclass("GuideUI")
export class GuideUI extends ViewController {

    private lbl_cur:Label = null;
    private lbl_total:Label = null;
    private lbl_msg:RichText = null;
    private lbl_state:Label = null;

    _lastRookeStep:number = 0;
    _lastRookiestate:number = 0;

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
        const rookiestate = DataMgr.s.userInfo.data.rookiestate;
        if(rookieStep >= RookieStep.FINISH){
            this.node.active = false;
            return;
        }
        if(this._lastRookeStep == rookieStep && this._lastRookiestate == rookiestate) return;
        this._lastRookeStep = rookieStep;
        this._lastRookiestate = rookiestate;
        let conf = GuideConfig.getById(rookieStep+'');
        if(!conf){
            return;
        }
        this.lbl_cur.string = conf.guide_stepInfo.split("|")[0];
        this.lbl_total.string = conf.guide_stepInfo.split("|")[1];
        this.lbl_msg.string = LanMgr.getLanById(conf.name);
        this.lbl_state.string = rookiestate == 0 ? LanMgr.getLanById('rookie_state_doing') : LanMgr.getLanById('rookie_state_finish');
    }

    onTapGuide() {
        const rookieStep = DataMgr.s.userInfo.data.rookieStep;
        const rookiestate = DataMgr.s.userInfo.data.rookiestate;
        if(rookieStep >= RookieStep.FINISH){
            return;
        }
        if(rookiestate == 0){

        }else{//finsh

        }
    }

}