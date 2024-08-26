import { find, Node } from "cc";
import { RookieStep } from "../../Const/RookieDefine";
import { Gswakeup } from "./gscript/Gswakeup";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import { DataMgr } from "../../Data/DataMgr";
import { GsNpcTalk1 } from "./gscript/GsNpcTalk1";


export class GuideMgr{

    private static _instance: GuideMgr;
    public static get ins(){
        if(!GuideMgr._instance){
            GuideMgr._instance = new GuideMgr();
            
        }
        return GuideMgr._instance;
    }

    private _guideScripts:{[index:string]:any};

    private _rookieNode:Node;

    private _lastRookeStep:RookieStep;

    initGuideData(){
        this._guideScripts = {};
        this._guideScripts[RookieStep.WAKE_UP] = Gswakeup;
        this._guideScripts[RookieStep.NPC_TALK_1] = GsNpcTalk1;
        this._rookieNode = find("Main/UI_Canvas/ROOKIE_ROOT");
        NotificationMgr.addListener(NotificationName.USERINFO_ROOKE_STEP_CHANGE, this._onRookieStepChange, this);
    }

    public async showGuide(step:RookieStep){
        const script = this._guideScripts[step];
        if(!script) return;
        let node = new Node('guide_'+step);
        node.addComponent(script);
        this._rookieNode.addChild(node);
    }

    private _onRookieStepChange(){
        const rookieStep = DataMgr.s.userInfo.data.rookieStep;
        if(this._lastRookeStep == rookieStep) return;
        this._lastRookeStep = rookieStep;
        this.showGuide(rookieStep);
    }



}