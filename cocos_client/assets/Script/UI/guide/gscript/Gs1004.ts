import { view, UITransform, Button, find, EventHandler, NodeEventType, ProgressBar, Vec3 } from "cc";
import NotificationMgr from "../../../Basic/NotificationMgr";
import { NotificationName } from "../../../Const/Notification";
import GameMainHelper from "../../../Game/Helper/GameMainHelper";
import RookieStepMgr from "../../../Manger/RookieStepMgr";
import { GsBase } from "./GsBase";
import GameMusicPlayMgr from "../../../Manger/GameMusicPlayMgr";
import { InnerBuildingType } from "../../../Const/BuildingDefine";
import { DataMgr } from "../../../Data/DataMgr";

export class Gs1004 extends GsBase {
    gsStart() {
        super.gsStart();
    }

    protected update(dt: number): void {
        const recruitData = DataMgr.s.innerBuilding.data.get(InnerBuildingType.Barrack);
        if (recruitData.upgrading || recruitData.troopIng) {
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

    _onTapGuideTask() {
        this.initBinding();
        if (this._guide_step == 1) {
            let RecruitButton = this.mainUI.node.getChildByPath("CommonContent/RecuritButton");
            RookieStepMgr.instance().maskView.configuration(false, RecruitButton.worldPosition, RecruitButton.getComponent(UITransform).contentSize, () => {
                RookieStepMgr.instance().maskView.hide();
                let button = RecruitButton.getComponent(Button);
                let event = new Event(NodeEventType.TOUCH_START);
                EventHandler.emitEvents(button.clickEvents, event);
            });
        }
    }
}
