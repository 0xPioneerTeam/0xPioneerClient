import { UITransform, Button, find, EventHandler, NodeEventType, ProgressBar, Vec3 } from "cc";
import NotificationMgr from "../../../Basic/NotificationMgr";
import { NotificationName } from "../../../Const/Notification";
import RookieStepMgr from "../../../Manger/RookieStepMgr";
import { GsBase } from "./GsBase";
import { InnerBuildingType } from "../../../Const/BuildingDefine";
import { DataMgr } from "../../../Data/DataMgr";

export class Gs1009 extends GsBase {
    gsStart() {
        super.gsStart();
    }

    protected update(dt: number): void {
        const exerciseData = DataMgr.s.innerBuilding.data.get(InnerBuildingType.TrainingCenter);
        if (exerciseData.upgrading || (exerciseData.tc != null && exerciseData.tc.training != null)) {
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
            let ExerciseButton = find("Main/UI_Canvas/UI_ROOT/NewBuildingUpgradeUI/__ViewContent/ExerciseButton");
            RookieStepMgr.instance().maskView.configuration(false, ExerciseButton.worldPosition, ExerciseButton.getComponent(UITransform).contentSize, () => {
                RookieStepMgr.instance().maskView.hide();
                let button = ExerciseButton.getComponent(Button);
                let event = new Event(NodeEventType.TOUCH_START);
                EventHandler.emitEvents(button.clickEvents, event);
            });
        }
    }
}
