import { Node } from "cc";
import NotificationMgr from "../../../Basic/NotificationMgr";
import UIPanelManger from "../../../Basic/UIPanelMgr";
import { UIName } from "../../../Const/ConstUIDefine";
import { NotificationName } from "../../../Const/Notification";
import { MapPioneerActionType } from "../../../Const/PioneerDefine";
import { RookieStep } from "../../../Const/RookieDefine";
import { DataMgr } from "../../../Data/DataMgr";
import GameMainHelper from "../../../Game/Helper/GameMainHelper";
import { MapPioneer } from "../../../Game/Outer/View/MapPioneer";
import GameMusicPlayMgr from "../../../Manger/GameMusicPlayMgr";
import { NetworkMgr } from "../../../Net/NetworkMgr";
import { GsBase } from "./GsBase";
import GuideConfig from "../../../Config/GuideConfig";


export class Gswakeup extends GsBase {

    

    public async start() {
        super.start();
        await UIPanelManger.inst.pushPanel(UIName.RookieGuide);
    }

    gsStart() {
        super.gsStart();
        const actionPioneer = DataMgr.s.pioneer.getCurrentPlayer();
        if (actionPioneer != null) {
            this.scheduleOnce(() => {
                GameMainHelper.instance.tiledMapShadowErase(actionPioneer.stayPos);
            }, 0.2);
            GameMainHelper.instance.changeGameCameraZoom(0.5);
            // dead
            actionPioneer.actionType = MapPioneerActionType.dead;
            let pioneer = this._pioneerController.getPioneerByUniqueId(actionPioneer.uniqueId);
            if (pioneer) {
                pioneer.getComponent(MapPioneer).refreshUI(actionPioneer);
            }
        }
    }

    protected update(dt: number): void {
        const actionPioneer = DataMgr.s.pioneer.getCurrentPlayer();
        if (actionPioneer != null) {
            GameMainHelper.instance.tiledMapShadowErase(actionPioneer.stayPos);
        }
    }

    protected onEnable(): void {
        NotificationMgr.addListener(NotificationName.ROOKIE_GUIDE_BEGIN_EYES, this._onRookieGuideBeginEyes, this);
        NotificationMgr.addListener(NotificationName.ROOKIE_GUIDE_THIRD_EYES, this._onRookieGuideThirdEyes, this);
    }

    protected onDisable(): void {
        NotificationMgr.removeListener(NotificationName.GAME_SCENE_ENTER, this.gsStart, this);
        NotificationMgr.removeListener(NotificationName.ROOKIE_GUIDE_BEGIN_EYES, this._onRookieGuideBeginEyes, this);
        NotificationMgr.removeListener(NotificationName.ROOKIE_GUIDE_THIRD_EYES, this._onRookieGuideThirdEyes, this);
    }

    private _onRookieGuideBeginEyes() {
        const actionPioneer = DataMgr.s.pioneer.getCurrentPlayer();
        if (actionPioneer != null) {
            actionPioneer.actionType = MapPioneerActionType.wakeup;
            let view: Node = this._pioneerController.getPioneerByUniqueId(actionPioneer.uniqueId);
            view.getComponent(MapPioneer).refreshUI(actionPioneer);
            let conf = GuideConfig.getById(RookieStep.WAKE_UP + '');
            let talkId = conf.pre_talk[0];

            this.scheduleOnce(async () => {
                actionPioneer.actionType = MapPioneerActionType.inCity;
                view.getComponent(MapPioneer).refreshUI(actionPioneer);
                UIPanelManger.inst.popPanelByName(UIName.RookieGuide);
                if (talkId) {
                    NotificationMgr.triggerEvent(NotificationName.USERINFO_DID_TRIGGER_LEFT_TALK, { talkId: talkId, fromRookie: true });
                }
                this.endDestroy();
            }, 6.8);
        }
    }
    private _onRookieGuideThirdEyes() {
        GameMusicPlayMgr.playGameMusic();
        GameMainHelper.instance.changeGameCameraZoom(1, true);
    }
}