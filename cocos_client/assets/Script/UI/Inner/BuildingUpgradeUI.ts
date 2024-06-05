import { _decorator, Button, Color, instantiate, Label, Layout, Node, Sprite } from "cc";
import CommonTools from "../../Tool/CommonTools";
import { GameExtraEffectType, ResourceCorrespondingItem } from "../../Const/ConstDefine";
import { GameMgr, ItemMgr, LanMgr } from "../../Utils/Global";
import ViewController from "../../BasicView/ViewController";
import { UIHUDController } from "../UIHUDController";
import NotificationMgr from "../../Basic/NotificationMgr";
import { InnerBuildingType, UserInnerBuildInfo } from "../../Const/BuildingDefine";
import InnerBuildingConfig from "../../Config/InnerBuildingConfig";
import InnerBuildingLvlUpConfig from "../../Config/InnerBuildingLvlUpConfig";
import { NotificationName } from "../../Const/Notification";
import UIPanelManger from "../../Basic/UIPanelMgr";
import { DataMgr } from "../../Data/DataMgr";
import { UIName } from "../../Const/ConstUIDefine";
import { DelegateUI } from "../DelegateUI";
import { NetworkMgr } from "../../Net/NetworkMgr";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
const { ccclass } = _decorator;

@ccclass("BuildingUpgradeUI")
export class BuildingUpgradeUI extends ViewController {
    public refreshUI() {
        const buildingInfoView = this.node.getChildByPath("__ViewContent/BuildingInfoView");

        // useLanMgr
        // buildingInfoView.getChildByPath("Bg/Title").getComponent(Label).string = LanMgr.getLanById("107549");
        const innerData = DataMgr.s.innerBuilding.data;
        innerData.forEach((value: UserInnerBuildInfo, key: InnerBuildingType) => {
            if (this._buildingMap.has(key)) {
                const innerConfig = InnerBuildingConfig.getByBuildingType(key);
                if (innerConfig != null) {
                    const view = this._buildingMap.get(key);
                    view.getChildByPath("Title/Label").getComponent(Label).string = LanMgr.getLanById(innerConfig.name);
                    view.getChildByPath("Level").getComponent(Label).string = "Lv." + value.buildLevel;
                    view.getComponent(Button).clickEvents[0].customEventData = value.buildType;

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
                        view.getChildByPath("ToBuildBuildingTip").active = thisBuild;
                    } else {
                        view.getChildByPath("ToBuildBuildingTip").active = false;
                    }
                }
            }
        });
    }

    private _buildingMap: Map<InnerBuildingType, Node> = null;

    private _levelInfoView: Node = null;
    private _levelInfoCostItem: Node = null;
    private _levelInfoShowCostItems: Node[] = [];

    private _curBuildingType: InnerBuildingType = null;
    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._buildingMap = new Map();
        this._buildingMap.set(InnerBuildingType.MainCity, this.node.getChildByPath("__ViewContent/BuildingInfoView/MainCity"));
        this._buildingMap.set(InnerBuildingType.Barrack, this.node.getChildByPath("__ViewContent/BuildingInfoView/Buildings/Barracks"));
        this._buildingMap.set(InnerBuildingType.House, this.node.getChildByPath("__ViewContent/BuildingInfoView/Buildings/House"));
        this._buildingMap.set(InnerBuildingType.EnergyStation, this.node.getChildByPath("__ViewContent/BuildingInfoView/Buildings/EnergyStation"));
        this._buildingMap.set(InnerBuildingType.ArtifactStore, this.node.getChildByPath("__ViewContent/BuildingInfoView/Buildings/ArtifactStore"));

        this._levelInfoView = this.node.getChildByPath("__ViewContent/LevelInfoView");
        this._levelInfoView.active = false;
        this._levelInfoCostItem = this._levelInfoView.getChildByPath("UpgradeContent/Resource/Item");
        this._levelInfoCostItem.active = false;

        NotificationMgr.addListener(NotificationName.CHANGE_LANG, this._onLangChang, this);
        NotificationMgr.addListener(NotificationName.ITEM_CHANGE, this.onItemChanged, this);

    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.CHANGE_LANG, this._onLangChang, this);
        NotificationMgr.removeListener(NotificationName.ITEM_CHANGE, this.onItemChanged, this);

    }
    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByPath("__ViewContent");
    }

    private _onLangChang() {
        this.refreshUI();
    }

    private _refreshUpgradeUI(buildingType: InnerBuildingType) {
        if (buildingType == null) {
            return;
        }
        const userInnerData = DataMgr.s.innerBuilding.data.get(buildingType);
        const innerConfig = InnerBuildingConfig.getByBuildingType(buildingType);

        if (userInnerData == null || innerConfig == null) {
            return;
        }
        const costData = InnerBuildingLvlUpConfig.getBuildingLevelData(userInnerData.buildLevel + 1, innerConfig.lvlup_cost);
        // icon
        this._levelInfoView.getChildByPath("Bg/Barracks").active = buildingType == InnerBuildingType.Barrack;
        this._levelInfoView.getChildByPath("Bg/House").active = buildingType == InnerBuildingType.House;
        this._levelInfoView.getChildByPath("Bg/MainCity").active = buildingType == InnerBuildingType.MainCity;
        this._levelInfoView.getChildByPath("Bg/EnergyStation").active = buildingType == InnerBuildingType.EnergyStation;

        const upgradeView = this._levelInfoView.getChildByPath("UpgradeContent");
        const maxTipView = this._levelInfoView.getChildByPath("LevelMaxContent");
        if (userInnerData.buildLevel >= innerConfig.maxLevel || costData == null) {
            // level max
            upgradeView.active = false;
            maxTipView.active = true;
        } else {
            upgradeView.active = true;
            maxTipView.active = false;
            // up level
            upgradeView.getChildByName("Level").getComponent(Label).string = "lv. " + userInnerData.buildLevel + "> lv. " + (userInnerData.buildLevel + 1);

            // desc
            const desc = InnerBuildingLvlUpConfig.getBuildingLevelData(userInnerData.buildLevel + 1, innerConfig.desc);
            if (desc != null) {
                upgradeView.getChildByName("UpgradeLevelDesc").getComponent(Label).string = LanMgr.getLanById(desc);
            } else {
                upgradeView.getChildByName("UpgradeLevelDesc").getComponent(Label).string = "";
            }

            // useTime
            let time = InnerBuildingLvlUpConfig.getBuildingLevelData(userInnerData.buildLevel + 1, innerConfig.lvlup_time);
            if (time == null) {
                time = 5;
            }
            time = GameMgr.getAfterEffectValue(GameExtraEffectType.BUILDING_LVUP_TIME, time);
            upgradeView.getChildByPath("Time/Label-001").getComponent(Label).string = CommonTools.formatSeconds(time);

            // cost
            // upgradeView.getChildByName("CostTitle").getComponent(Label).string = LanMgr.getLanById("107549");
            for (const item of this._levelInfoShowCostItems) {
                item.destroy();
            }
            this._levelInfoShowCostItems = [];
            if (costData != null) {
                for (const cost of costData) {
                    const type = cost[0].toString();
                    let num = GameMgr.getAfterEffectValue(GameExtraEffectType.BUILDING_LVLUP_RESOURCE, cost[1]);
                    const ownNum: number = DataMgr.s.item.getObj_item_count(type);

                    const item = instantiate(this._levelInfoCostItem);
                    item.active = true;
                    item.setParent(this._levelInfoCostItem.parent);
                    item.getChildByPath("Icon/8001").active = type == ResourceCorrespondingItem.Food;
                    item.getChildByPath("Icon/8002").active = type == ResourceCorrespondingItem.Wood;
                    item.getChildByPath("Icon/8003").active = type == ResourceCorrespondingItem.Stone;
                    item.getChildByPath("Icon/8004").active = type == ResourceCorrespondingItem.Troop;

                    item.getChildByPath("num/left").getComponent(Label).string = num + "";
                    item.getChildByPath("num/right").getComponent(Label).string = DataMgr.s.item.getObj_item_count(type).toString();
                    item.getChildByPath("num/right").getComponent(Label).color = ownNum >= num ? new Color(142, 218, 97) : Color.RED;

                    this._levelInfoShowCostItems.push(item);
                }
                this._levelInfoCostItem.parent.getComponent(Layout).updateLayout();
            }
            // button
            upgradeView.getChildByName("ActionButton").getComponent(Button).clickEvents[0].customEventData = buildingType;
            const actionButtonTip = upgradeView.getChildByPath("ActionButton/Label").getComponent(Label);
            if (userInnerData.buildLevel <= 0) {
                // useLanMgr
                // LanMgr.getLanById("107549");
                actionButtonTip.string = "Construct";
            } else {
                // useLanMgr
                // LanMgr.getLanById("107549");
                actionButtonTip.string = "Level Up";
            }
        }
    }
    //----------------------------- action
    private onTapBuildingUpgradeShow(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const buildingType: InnerBuildingType = customEventData as InnerBuildingType;
        this._levelInfoView.active = true;
        this._curBuildingType = buildingType;
        this._refreshUpgradeUI(buildingType);
    }
    private async onTapBuildingUpgrade(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const buildingType: InnerBuildingType = customEventData as InnerBuildingType;

        const userInnerData = DataMgr.s.innerBuilding.data.get(buildingType);
        const innerConfig = InnerBuildingConfig.getByBuildingType(buildingType);
        if (userInnerData == null || innerConfig == null) {
            return;
        }
        if (DataMgr.s.userInfo.data.level < innerConfig.unlock) {
            // useLanMgr
            // UIHUDController.showCenterTip(LanMgr.getLanById("201004"));
            UIHUDController.showCenterTip("Insufficient civilization level");
            return;
        }
        if (userInnerData.upgrading) {
            UIHUDController.showCenterTip(LanMgr.getLanById("201003"));
            // UIHUDController.showCenterTip("The building is being upgraded, please wait.");
            return;
        }
        const costData = InnerBuildingLvlUpConfig.getBuildingLevelData(userInnerData.buildLevel + 1, innerConfig.lvlup_cost);
        if (costData != null) {
            let canUpgrade: boolean = true;
            for (const resource of costData) {
                if (resource.length != 2) {
                    continue;
                }
                const type = resource[0].toString();
                let needNum = GameMgr.getAfterEffectValue(GameExtraEffectType.BUILDING_LVLUP_RESOURCE, resource[1]);

                if (DataMgr.s.item.getObj_item_count(type) < needNum) {
                    canUpgrade = false;
                    break;
                }
            }
            if (!canUpgrade) {
                // useLanMgr
                UIHUDController.showCenterTip(LanMgr.getLanById("201004"));
                // UIHUDController.showCenterTip("Insufficient resources for building upgrades");
                return;
            }
            NetworkMgr.websocketMsg.player_building_levelup({ innerBuildingId: buildingType });

            await this.playExitAnimation();
            UIPanelManger.inst.popPanel(this.node);
        }
    }

    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }
    private async onTapDelegate() {
        GameMusicPlayMgr.playTapButtonEffect();
        const result = await UIPanelManger.inst.pushPanel(UIName.DelegateUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(DelegateUI).showUI(InnerBuildingType.MainCity);
    }

    //------------------- ItemMgrEvent
    onItemChanged(): void {
        this._refreshUpgradeUI(this._curBuildingType);
    }
}
