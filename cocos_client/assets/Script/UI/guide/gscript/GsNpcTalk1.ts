import { find, UITransform, v2 } from "cc";
import NotificationMgr from "../../../Basic/NotificationMgr";
import { NotificationName } from "../../../Const/Notification";
import { RookieStep } from "../../../Const/RookieDefine";
import { DataMgr } from "../../../Data/DataMgr";
import GameMainHelper from "../../../Game/Helper/GameMainHelper";
import { GameMgr } from "../../../Utils/Global";
import { GsBase } from "./GsBase";
import RookieStepMgr from "../../../Manger/RookieStepMgr";
import UIPanelManger from "../../../Basic/UIPanelMgr";
import TalkConfig from "../../../Config/TalkConfig";
import { UIName } from "../../../Const/ConstUIDefine";
import { DialogueUI } from "../../Outer/DialogueUI";
import { NetworkMgr } from "../../../Net/NetworkMgr";
import { GuideMgr } from "../GuideMgr";
import GuideConfig from "../../../Config/GuideConfig";


export class GsNpcTalk1 extends GsBase{

    public async start() {
        super.start();
    }

    gsStart() {
        super.gsStart();
        this.scheduleOnce(()=>{
            const actionPioneer = DataMgr.s.pioneer.getCurrentPlayer();
            let mapId = actionPioneer.uniqueId.split('|')[0];
            let npcUni = mapId + '|npc_0';
            let npcPioneer = DataMgr.s.pioneer.createNPCData(npcUni,v2(actionPioneer.stayPos.x,actionPioneer.stayPos.y + 2));
            DataMgr.s.pioneer.addObjData(npcPioneer);
            NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_NEED_REFRESH);
    
            let pioneer = this._pioneerController.getPioneerByUniqueId(npcUni);
            // const view = pioneer.find("Main/Canvas/GameContent/Game/OutScene/TiledMap/deco_layer/MAP_" + npcId + "/role/RookieSizeView");
            if (pioneer == null) {
                return;/*  */
            }
            const view = pioneer.getChildByPath('role/RookieSizeView');
            if (pioneer == undefined) {
                return;
            }
            RookieStepMgr.instance().maskView.configuration(true, view.worldPosition, view.getComponent(UITransform).contentSize, () => {
                if (pioneer == null) {
                    return;
                }
                this._tileMapController._clickOnMap(pioneer.worldPosition);
                this._guide_step = 1;
            });
        },0.2);
    }

    protected update(dt: number): void {
        if(this._guide_step == 1){
            let actionView = this._tileMapController.actionView;
            if(!actionView){
                return;
            }
            let node = actionView.node.getChildByPath('ActionView/Action');
            let view = node.children[0];
            if(!view){
                return;
            }
            RookieStepMgr.instance().maskView.configuration(true, view.worldPosition, view.getComponent(UITransform).contentSize, () => {
                actionView.hide();
                RookieStepMgr.instance().maskView.hide();
                this._oRookieTapMapAction();
            });
            this._guide_step = 2;
        }
    }
    

    async _oRookieTapMapAction(){
        const rookieStep = DataMgr.s.userInfo.data.rookieStep;
        let preTalk = GuideConfig.getById(rookieStep+'').pre_talk;
        let talkConfig;
        if(preTalk.length > 0){
           talkConfig = TalkConfig.getById(preTalk[0] + '');
        }
        talkConfig = TalkConfig.getById('talk01');
        if (talkConfig == null) {
            return;
        }
        const result = await UIPanelManger.inst.pushPanel(UIName.DialogueUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(DialogueUI).dialogShow(talkConfig);
        // NetworkMgr.websocketMsg.player_rookie_update({
        //     rookieStep: RookieStep.GUIDE_1001
        // })
        this.endDestroy();
    }
}