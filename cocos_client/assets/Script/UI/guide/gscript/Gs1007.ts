import { view, UITransform, Button, find, EventHandler, NodeEventType } from "cc";
import NotificationMgr from "../../../Basic/NotificationMgr";
import { NotificationName } from "../../../Const/Notification";
import GameMainHelper from "../../../Game/Helper/GameMainHelper";
import RookieStepMgr from "../../../Manger/RookieStepMgr";
import { GsBase } from "./GsBase";
import GameMusicPlayMgr from "../../../Manger/GameMusicPlayMgr";
import { InnerBuildingType } from "../../../Const/BuildingDefine";

export class Gs1007 extends GsBase {
    gsStart() {
        super.gsStart();
        this._guide_step = 1;
    }

    protected update(dt: number): void {
        this._guide_step = 1
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
            let canTapView = null;
            let index: number = -1;
            const contentView = this.mainUI.node.getChildByPath("CommonContent/HeatTreasureUI/__ViewContent/Content/ProgressBar/BoxContent");
            if(!contentView){
                return;
            }
            for (let i = 0; i < contentView.children.length; i++) {
                let canTap: boolean = false;
                for (const boxChild of contentView.children[i].children) {
                    if (boxChild.name == "Treasure_box_empty" || boxChild.name == "Treasure_box_select_empty") {
                        continue;
                    }
                    canTap = true;
                    break;
                }
                if (canTap) {
                    canTapView = contentView.children[i];
                    index = i;
                    break;
                }
            }
            if (canTapView == null || index == -1) {
                return;
            }
            RookieStepMgr.instance().maskView.configuration(false, canTapView.worldPosition, canTapView.getComponent(UITransform).contentSize, () => {
                RookieStepMgr.instance().maskView.hide();
                GameMusicPlayMgr.playTapButtonEffect();
                let button = canTapView.getComponent(Button);
                let event = new Event(NodeEventType.TOUCH_START);
                EventHandler.emitEvents(button.clickEvents, event, index);
                this._guide_step = 2;
            });
        }
    }
}
