import { find, Node } from "cc";
import { RookieStep } from "../../Const/RookieDefine";
import { Gswakeup } from "./gscript/Gswakeup";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import { DataMgr } from "../../Data/DataMgr";
import { GsNpcTalk1 } from "./gscript/GsNpcTalk1";
import { GsRepairCity } from "./gscript/GsRepairCity";
import { GsBase } from "./gscript/GsBase";
import { Gs1002 } from "./gscript/Gs1002";
import { Gs1003 } from "./gscript/Gs1003";
import { Gs1005 } from "./gscript/Gs1005";
import { Gs1006 } from "./gscript/Gs1006";
import { Gs1007 } from "./gscript/Gs1007";
import { Gs1008 } from "./gscript/Gs1008";
import { Gs1009 } from "./gscript/Gs1009";
import { Gs1010 } from "./gscript/Gs1010";
import { Gs1011 } from "./gscript/Gs1011";
import { Gs1012 } from "./gscript/Gs1012";


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
        // this._guideScripts[RookieStep.WAKE_UP] = Gswakeup;
        this._guideScripts[RookieStep.WAKE_UP] = Gswakeup;
        this._guideScripts[RookieStep.GUIDE_1001] = GsRepairCity;
        this._guideScripts[RookieStep.GUIDE_1002] = Gs1002;
        this._guideScripts[RookieStep.GUIDE_1003] = Gs1003;
        this._guideScripts[RookieStep.GUIDE_1005] = Gs1005;
        this._guideScripts[RookieStep.GUIDE_1006] = Gs1006;
        this._guideScripts[RookieStep.GUIDE_1007] = Gs1007;
        this._guideScripts[RookieStep.GUIDE_1008] = Gs1008;
        this._guideScripts[RookieStep.GUIDE_1009] = Gs1009;
        this._guideScripts[RookieStep.GUIDE_1010] = Gs1010;
        this._guideScripts[RookieStep.GUIDE_1011] = Gs1011;
        this._guideScripts[RookieStep.GUIDE_1012] = Gs1012;
        this._rookieNode = find("Main/UI_Canvas/ROOKIE_ROOT");
        NotificationMgr.addListener(NotificationName.USERINFO_ROOKE_STEP_CHANGE, this._onRookieStepChange, this);
    }

    public async showGuide(step:RookieStep){
        let children = this._rookieNode.children;
        children.forEach(child=>{
            let comp = child.getComponent(GsBase);
            if(comp && comp.onlyOneGudie){
                comp.endDestroy();
            }
        });
        const script = this._guideScripts[step];
        if(!script) return;
        console.log("showGuide",step);
        let node = new Node('guide_'+step);
        node.addComponent(script);
        this._rookieNode.addChild(node);
    }

    private _onRookieStepChange(){
        const rookieStep = DataMgr.s.userInfo.data.rookieStep;
        if(this._lastRookeStep == rookieStep) return;
        console.log('USERINFO_ROOKE_STEP_CHANGE',rookieStep)
        this._lastRookeStep = rookieStep;
        this.showGuide(rookieStep);
    }



}