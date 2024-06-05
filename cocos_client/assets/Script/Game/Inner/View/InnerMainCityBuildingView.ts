import { Label, Node, UITransform, _decorator, v3 } from "cc";
import { InnerBuildingView } from "./InnerBuildingView";
import { LanMgr } from "../../../Utils/Global";
import { UIName } from "../../../Const/ConstUIDefine";
import { InnerBuildingType, UserInnerBuildInfo } from "../../../Const/BuildingDefine";
import { BuildingUpgradeUI } from "../../../UI/Inner/BuildingUpgradeUI";
import InnerBuildingLvlUpConfig from "../../../Config/InnerBuildingLvlUpConfig";
import InnerBuildingConfig from "../../../Config/InnerBuildingConfig";
import NotificationMgr from "../../../Basic/NotificationMgr";
import { NotificationName } from "../../../Const/Notification";
import UIPanelManger from "../../../Basic/UIPanelMgr";
import { DataMgr } from "../../../Data/DataMgr";

const { ccclass, property } = _decorator;

@ccclass('InnerMainCityBuildingView')
export class InnerMainCityBuildingView extends InnerBuildingView {

    public async refreshUI(building: UserInnerBuildInfo, canAction: boolean = true) {
        await super.refreshUI(building, canAction);

        if (this._buildingSize != null) {
            this._buildingUpView.position = v3(0, this._buildingSize.height, 0);
        }
        let canBuild: boolean = false;
        const innerBuildings = DataMgr.s.innerBuilding.data;
        innerBuildings.forEach((value: UserInnerBuildInfo, key: InnerBuildingType)=> {
            const innerConfig = InnerBuildingConfig.getByBuildingType(key);
            const levelConfig = InnerBuildingLvlUpConfig.getBuildingLevelData(value.buildLevel + 1, innerConfig.lvlup_cost);
            if (levelConfig != null) {
                let thisBuild: boolean = true;
                for (const cost of levelConfig) {
                    const type = cost[0].toString();
                    const num = cost[1];
                    if (DataMgr.s.item.getObj_item_count(type) < num) {
                        thisBuild = false;
                        break;
                    }
                }
                if (thisBuild) {
                    canBuild = true;
                }
            }
        });
        this._buildingUpView.active = canBuild;
    }


    private _buildingUpView: Node = null;
    protected innerBuildingLoad(): void {
        super.innerBuildingLoad();

        this._buildingUpView = this.node.getChildByName("ToBuildBuildingTip");
        this._buildingUpView.active = false;

        NotificationMgr.addListener(NotificationName.RESOURCE_GETTED, this._onResourceChanged, this);
        NotificationMgr.addListener(NotificationName.RESOURCE_CONSUMED, this._onResourceChanged, this);
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.RESOURCE_GETTED, this._onResourceChanged, this);
        NotificationMgr.removeListener(NotificationName.RESOURCE_CONSUMED, this._onResourceChanged, this);
    }


    protected async innerBuildingTaped(): Promise<void> {
        super.innerBuildingTaped();

        if (this._building == null) {
            return;
        }
        const result = await UIPanelManger.inst.pushPanel(UIName.BuildingUpgradeUI);
        if (result.success) {
            result.node.getComponent(BuildingUpgradeUI).refreshUI();
        }
    }
    
    //-------------------------------- notification
    private _onResourceChanged() {
        this.refreshUI(this._building);
    }
}