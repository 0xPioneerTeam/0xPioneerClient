import { _decorator, Button, Color, instantiate, Label, Layout, Node, Sprite } from "cc";
import CommonTools from "../../Tool/CommonTools";
import { GameExtraEffectType, ResourceCorrespondingItem } from "../../Const/ConstDefine";
import { GameMgr, ItemMgr, LanMgr } from "../../Utils/Global";
import ViewController from "../../BasicView/ViewController";
import { UIHUDController } from "../UIHUDController";
import NotificationMgr from "../../Basic/NotificationMgr";
import { ConfigInnerBuildingData, InnerBuildingType, UserInnerBuildInfo } from "../../Const/BuildingDefine";
import InnerBuildingConfig from "../../Config/InnerBuildingConfig";
import InnerBuildingLvlUpConfig from "../../Config/InnerBuildingLvlUpConfig";
import { NotificationName } from "../../Const/Notification";
import UIPanelManger from "../../Basic/UIPanelMgr";
import { DataMgr } from "../../Data/DataMgr";
import { UIName } from "../../Const/ConstUIDefine";
import { DelegateUI } from "../DelegateUI";
import { NetworkMgr } from "../../Net/NetworkMgr";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import { RookieStep } from "../../Const/RookieDefine";
import TalkConfig from "../../Config/TalkConfig";
import { DialogueUI } from "../Outer/DialogueUI";
import { RelicTowerUI } from "../RelicTowerUI";
import { RecruitUI } from "./RecruitUI";
const { ccclass } = _decorator;

@ccclass("NewBuildingUpgradeUI")
export class NewBuildingUpgradeUI extends ViewController {
    private _type: InnerBuildingType = null;
    private _innerData: UserInnerBuildInfo = null;
    private _innerConfig: ConfigInnerBuildingData = null;
    private _costData: any[] = null;

    private _titleView: Node = null;
    private _levelView: Node = null;
    private _desc: Label = null;
    private _timeView: Node = null;
    private _resourceContent: Node = null;
    private _resourceItem: Node = null;
    private _actionButton: Node = null;
    private _recruitButton: Node = null;
    private _exerciseButton: Node = null;
    private _artifactButton: Node = null;

    public refreshUI(type: InnerBuildingType) {
        this._type = type;

        this._innerData = DataMgr.s.innerBuilding.data.get(type);
        this._innerConfig = InnerBuildingConfig.getByBuildingType(type);

        if (this._innerData == null || this._innerConfig == null) {
            UIPanelManger.inst.popPanel(this.node);
            return;
        }
        const desc = InnerBuildingLvlUpConfig.getBuildingLevelData(this._innerData.buildLevel + 1, this._innerConfig.desc);

        let time = InnerBuildingLvlUpConfig.getBuildingLevelData(this._innerData.buildLevel + 1, this._innerConfig.lvlup_time);
        if (time == null) {
            time = 5;
        }
        time = GameMgr.getAfterEffectValueByBuilding(type, GameExtraEffectType.BUILDING_LVUP_TIME, time);

        this._costData = InnerBuildingLvlUpConfig.getBuildingLevelData(this._innerData.buildLevel + 1, this._innerConfig.lvlup_cost);
        if (this._costData == null) {
            UIPanelManger.inst.popPanel(this.node);
            return;
        }

        // title
        let showName: string = "";
        if (type == InnerBuildingType.Barrack) {
            showName = "Barracks";
        } else if (type == InnerBuildingType.House) {
            showName = "House";
        } else if (type == InnerBuildingType.MainCity) {
            showName = "MainCity";
        } else if (type == InnerBuildingType.EnergyStation) {
            showName = "EnergyStation";
        } else if (type == InnerBuildingType.ArtifactStore) {
            showName = "ArtifactStore";
        }
        for (const child of this._titleView.children) {
            child.active = child.name == showName;
        }

        // level
        this._levelView.getChildByPath("Content/CurLevel").getComponent(Label).string = "Lv." + this._innerData.buildLevel;
        this._levelView.getChildByPath("Content/NextLevel").getComponent(Label).string = "Lv." + (this._innerData.buildLevel + 1);
        this._levelView.getChildByPath("Content").getComponent(Layout).updateLayout();

        // desc
        this._desc.string = LanMgr.getLanById(desc);

        // time
        // this._timeView.getChildByPath("Time").getComponent(Label).string = LanMgr.getLanById("107549");
        this._timeView.getChildByPath("Value").getComponent(Label).string = CommonTools.formatSeconds(time);

        // resource
        this._resourceContent.removeAllChildren();
        for (const cost of this._costData) {
            const type = cost[0].toString();
            let num = GameMgr.getAfterEffectValue(GameExtraEffectType.BUILDING_LVLUP_RESOURCE, cost[1]);
            const ownNum: number = DataMgr.s.item.getObj_item_count(type);

            const item = instantiate(this._resourceItem);
            item.active = true;
            item.setParent(this._resourceContent);
            item.getChildByPath("Icon/8001").active = type == ResourceCorrespondingItem.Food;
            item.getChildByPath("Icon/8002").active = type == ResourceCorrespondingItem.Wood;
            item.getChildByPath("Icon/8003").active = type == ResourceCorrespondingItem.Stone;
            item.getChildByPath("Icon/8004").active = type == ResourceCorrespondingItem.Troop;

            item.getChildByPath("num/left").getComponent(Label).string = ownNum.toString();
            item.getChildByPath("num/left").getComponent(Label).color = ownNum >= num ? new Color(142, 218, 97) : Color.RED;

            item.getChildByPath("num/right").getComponent(Label).string = num.toString();
        }

        // button
        if (this._innerData.buildLevel <= 0) {
            // useLanMgr
            // LanMgr.getLanById("107549");
            this._actionButton.getChildByPath("Label").getComponent(Label).string = "Construct";
        } else {
            // useLanMgr
            // LanMgr.getLanById("107549");
            this._actionButton.getChildByPath("Label").getComponent(Label).string = "Construct";
        }

        this._recruitButton.active = this._innerData.buildType == InnerBuildingType.Barrack && this._innerData.buildLevel >= 1;
        this._exerciseButton.active = this._innerData.buildType == InnerBuildingType.TrainingCenter && this._innerData.buildLevel >= 1;
        this._artifactButton.active = this._innerData.buildType == InnerBuildingType.ArtifactStore && this._innerData.buildLevel >= 1;
    }

    protected viewDidLoad(): void {
        super.viewDidLoad();

        const contentView = this.node.getChildByPath("__ViewContent");

        this._titleView = contentView.getChildByPath("Title");
        this._levelView = contentView.getChildByPath("LevelBg");
        this._desc = contentView.getChildByPath("Desc").getComponent(Label);
        this._timeView = contentView.getChildByPath("Time");
        this._resourceContent = contentView.getChildByPath("Resource");
        this._resourceItem = this._resourceContent.getChildByPath("Item");
        this._resourceItem.removeFromParent();
        this._actionButton = contentView.getChildByPath("ActionButton");
        this._recruitButton = contentView.getChildByPath("RecruitButton");
        this._exerciseButton = contentView.getChildByPath("ExerciseButton");
        this._artifactButton = contentView.getChildByPath("ArtifactButton");

        NotificationMgr.addListener(NotificationName.ITEM_CHANGE, this.onItemChanged, this);
        // NotificationMgr.addListener(NotificationName.ROOKIE_GUIDE_TAP_BUILDING_UPGRADE, this._onRookieTapThis, this);
    }

    protected viewDidAppear(): void {
        super.viewDidAppear();
        // const rookieStep: RookieStep = DataMgr.s.userInfo.data.rookieStep;
        // if (rookieStep == RookieStep.MAIN_BUILDING_TAP_1 || rookieStep == RookieStep.MAIN_BUILDING_TAP_2) {
        //     NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_NEED_MASK_SHOW, {
        //         tag: "buildingUpgrade",
        //         view: this._buildingMap.get(InnerBuildingType.MainCity),
        //         tapIndex: "-1",
        //     });
        // } else if (rookieStep == RookieStep.MAIN_BUILDING_TAP_3) {
        //     NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_NEED_MASK_SHOW, {
        //         tag: "buildingUpgrade",
        //         view: this._buildingMap.get(InnerBuildingType.Barrack),
        //         tapIndex: "-1",
        //     });
        // }
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.ITEM_CHANGE, this.onItemChanged, this);
        // NotificationMgr.removeListener(NotificationName.ROOKIE_GUIDE_TAP_BUILDING_UPGRADE, this._onRookieTapThis, this);
    }
    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByPath("__ViewContent");
    }

    //----------------------------- action
    private async onTapBuildingUpgrade() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._innerData == null || this._innerConfig == null || this._costData == null) {
            return;
        }

        if (this._innerData.upgrading) {
            UIHUDController.showCenterTip(LanMgr.getLanById("201003"));
            // UIHUDController.showCenterTip("The building is being upgraded, please wait.");
            return;
        }

        if (this._innerData.buildType != InnerBuildingType.MainCity) {
            // check maincity level
            const mainCityLevel = DataMgr.s.innerBuilding.getInnerBuildingLevel(InnerBuildingType.MainCity);
            const maxBuildingUpgradeLevel = InnerBuildingLvlUpConfig.getBuildingLevelData(mainCityLevel, "max_lvlBuilding");
            if (this._innerData.buildLevel + 1 > maxBuildingUpgradeLevel) {
                // useLanMgr
                // UIHUDController.showCenterTip(LanMgr.getLanById("201004"));
                UIHUDController.showCenterTip("The level limit has been reached. Please upgrade the level of the city hall first.");
                return;
            }
        }

        let canUpgrade: boolean = true;
        for (const resource of this._costData) {
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
        NetworkMgr.websocketMsg.player_building_levelup({ innerBuildingId: this._type });

        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }

    private async onTapRecruit() {
        GameMusicPlayMgr.playTapButtonEffect();
        const result = await UIPanelManger.inst.pushPanel(UIName.RecruitUI);
        if (result.success) {
            result.node.getComponent(RecruitUI).refreshUI(true);
        }

        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }
    private async onTapExercise() {
        GameMusicPlayMgr.playTapButtonEffect();
        const result = await UIPanelManger.inst.pushPanel(UIName.ExerciseUI);

        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }
    private async onTapArtifact() {
        GameMusicPlayMgr.playTapButtonEffect();
        const result = await UIPanelManger.inst.pushPanel(UIName.RelicTowerUI);
        if (result.success) {
            result.node.getComponent(RelicTowerUI).configuration(0);
        }

        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }

    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }

    //------------------- ItemMgrEvent
    onItemChanged(): void {
        if (this._type == null) {
            return;
        }
        this.refreshUI(this._type);
    }

    private async _onRookieTapThis(data: { tapIndex: string }) {
        // if (data == null || data.tapIndex == null) {
        //     return;
        // }
        // const rookieStep: RookieStep = DataMgr.s.userInfo.data.rookieStep;
        // if (data.tapIndex == "-1") {
        //     if (rookieStep == RookieStep.MAIN_BUILDING_TAP_1 || rookieStep == RookieStep.MAIN_BUILDING_TAP_2 || rookieStep == RookieStep.MAIN_BUILDING_TAP_3) {
        //         if (rookieStep == RookieStep.MAIN_BUILDING_TAP_1 || rookieStep == RookieStep.MAIN_BUILDING_TAP_2) {
        //             this.onTapBuildingUpgradeShow(null, InnerBuildingType.MainCity);
        //         } else if (rookieStep == RookieStep.MAIN_BUILDING_TAP_3) {
        //             this.onTapBuildingUpgradeShow(null, InnerBuildingType.Barrack);
        //         }
        //         NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_NEED_MASK_SHOW, {
        //             tag: "buildingUpgrade",
        //             view: this.node.getChildByPath("__ViewContent/LevelInfoView/UpgradeContent/ActionButton"),
        //             tapIndex: "-2",
        //         });
        //     }
        // } else if (data.tapIndex == "-2") {
        //     if (rookieStep == RookieStep.MAIN_BUILDING_TAP_1) {
        //         const talkConfig = TalkConfig.getById("talk18");
        //         if (talkConfig == null) {
        //             return;
        //         }
        //         const result = await UIPanelManger.inst.pushPanel(UIName.DialogueUI);
        //         if (!result.success) {
        //             return;
        //         }
        //         result.node.getComponent(DialogueUI).dialogShow(talkConfig);
        //     } else if (rookieStep == RookieStep.MAIN_BUILDING_TAP_2) {
        //         this.onTapBuildingUpgrade(null, InnerBuildingType.MainCity);
        //     } else if (rookieStep == RookieStep.MAIN_BUILDING_TAP_3) {
        //         this.onTapBuildingUpgrade(null, InnerBuildingType.Barrack);
        //     }
        // } else if (data.tapIndex == "-3") {
        //     if (rookieStep == RookieStep.MAIN_BUILDING_TAP_1) {
        //         NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_NEED_MASK_SHOW, {
        //             tag: "buildingUpgrade",
        //             view: this.node.getChildByPath("__ViewContent/BuildingInfoView/CloseButton"),
        //             tapIndex: "-4",
        //         });
        //     }
        // } else if (data.tapIndex == "-4") {
        //     this.onTapClose();
        //     NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_BUILDING_UPGRADE_CLOSE);
        // }
    }
}
