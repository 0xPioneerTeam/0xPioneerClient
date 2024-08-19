import { Label, Node, _decorator } from "cc";
import { InnerBuildingView } from "./InnerBuildingView";
import { UIHUDController } from "../../../UI/UIHUDController";
import { LanMgr } from "../../../Utils/Global";
import NotificationMgr from "../../../Basic/NotificationMgr";
import { UIName } from "../../../Const/ConstUIDefine";
import { RecruitUI } from "../../../UI/Inner/RecruitUI";
import CommonTools from "../../../Tool/CommonTools";
import { UserInnerBuildInfo } from "../../../Const/BuildingDefine";
import { NotificationName } from "../../../Const/Notification";
import UIPanelManger from "../../../Basic/UIPanelMgr";
import { DataMgr } from "../../../Data/DataMgr";

const { ccclass, property } = _decorator;

@ccclass("InnerTroopsBuildingView")
export class InnerTroopsBuildingView extends InnerBuildingView {
    public async refreshUI(building: UserInnerBuildInfo, canAction: boolean = true) {
        await super.refreshUI(building, canAction);
        return true;
    }

    private _generateTime: Node = null;

    protected innerBuildingLoad(): void {
        super.innerBuildingLoad();
        this._generateTime = this.node.getChildByPath("RecruitTime");
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();
    }

    protected viewUpdate(dt: number): void {
        super.viewUpdate(dt);
    }

    protected innerBuildingUpdate(): void {
        super.innerBuildingUpdate();
        if (this._building == null) {
            return;
        }
        if (this._building.tc == null) {
            return;
        }
        const currentTime: number = new Date().getTime();
        if (this._building.tc.training != null && this._building.tc.training.end > currentTime) {
            this._generateTime.active = true;
            this._generateTime.getChildByPath("Value").getComponent(Label).string = CommonTools.formatSeconds(
                (this._building.tc.training.end - currentTime) / 1000
            );
        } else {
            this._generateTime.active = false;
        }
    }
}
