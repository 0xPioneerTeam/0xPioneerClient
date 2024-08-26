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
import { GameMgr } from "../../../Utils/Global";
import { GsBase } from "./GsBase";


export class Gswakeup extends GsBase{

    public async start() {
        await UIPanelManger.inst.pushPanel(UIName.RookieGuide);
        super.start();
    }

    gsStart() {
        super.gsStart();
        const actionPioneer = DataMgr.s.pioneer.getCurrentPlayer();
        if (DataMgr.s.userInfo.data.rookieStep == RookieStep.WAKE_UP) {
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
            // if (this._pioneerMap.has(actionPioneer.uniqueId)) {
            //     view = this._pioneerMap.get(actionPioneer.uniqueId).getComponent(MapPioneer);
            // }
            this.scheduleOnce(async () => {
                actionPioneer.actionType = MapPioneerActionType.idle;
                view.getComponent(MapPioneer).refreshUI(actionPioneer);
                UIPanelManger.inst.popPanelByName(UIName.RookieGuide);
                NetworkMgr.websocketMsg.player_rookie_update({
                    rookieStep: RookieStep.NPC_TALK_1,
                });
                this.endDestroy();
            }, 6.8);
        }
    }
    private _onRookieGuideThirdEyes() {
        GameMusicPlayMgr.playGameMusic();
        GameMainHelper.instance.changeGameCameraZoom(1, true);
    }
}