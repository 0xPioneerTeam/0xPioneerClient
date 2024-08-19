import { _decorator, Node, Button, Label, Vec3, UITransform, instantiate, tween, dynamicAtlasManager, find, Prefab } from "cc";
import { UIName } from "../Const/ConstUIDefine";
import { TaskListUI } from "./TaskListUI";
import { NewSettlementUI } from "./NewSettlementUI";
import ViewController from "../BasicView/ViewController";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import Config from "../Const/Config";
import { GAME_ENV_IS_DEBUG, MapMemberFactionType } from "../Const/ConstDefine";
import UIPanelManger from "../Basic/UIPanelMgr";
import GameMainHelper from "../Game/Helper/GameMainHelper";
import { DataMgr } from "../Data/DataMgr";
import { NFTBackpackUI } from "./NFTBackpackUI";
import CommonTools from "../Tool/CommonTools";
import { NetworkMgr } from "../Net/NetworkMgr";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
import { RookieResourceAnim, RookieResourceAnimStruct, RookieStep } from "../Const/RookieDefine";
import TalkConfig from "../Config/TalkConfig";
import { DialogueUI } from "./Outer/DialogueUI";
import ItemData from "../Const/Item";
import { TreasureGettedUI } from "./TreasureGettedUI";
import { LanMgr } from "../Utils/Global";
import { MapPioneerActionType } from "../Const/PioneerDefine";
import { InnerBuildingType } from "../Const/BuildingDefine";
import { RelicTowerUI } from "./RelicTowerUI";
import { RecruitUI } from "./Inner/RecruitUI";

const { ccclass, property } = _decorator;

@ccclass("MainUI")
export class MainUI extends ViewController {
    @property(Button)
    backpackBtn: Button = null;

    @property(Prefab)
    private resourceFlyAnim: Prefab = null;

    private _animView: Node = null;

    private _gangsterComingTipView: Node = null;
    private _worldBoxCountTipView: Node = null;

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._animView = this.node.getChildByPath("AnimView");
        this._animView.active = true;

        this._gangsterComingTipView = this.node.getChildByPath("CommonContent/GangsterTipView");
        this._gangsterComingTipView.active = false;

        this._worldBoxCountTipView = this.node.getChildByPath("CommonContent/WorldBoxCountTipView");
        this._worldBoxCountTipView.getChildByPath("Content/Title").getComponent(Label).string = LanMgr.getLanById("106015");

        NotificationMgr.addListener(NotificationName.CHANGE_LANG, this.changeLang, this);
        NotificationMgr.addListener(NotificationName.GAME_INNER_BUILDING_LATTICE_EDIT_CHANGED, this._onInnerBuildingLatticeEditChanged, this);
        NotificationMgr.addListener(NotificationName.GAME_INNER_AND_OUTER_CHANGED, this._onInnerOuterChanged, this);
        NotificationMgr.addListener(NotificationName.INNER_BUILDING_UPGRADE_FINISHED, this._onInnerBuildingUpgradeFinished, this);

        NotificationMgr.addListener(NotificationName.USERINFO_DID_CHANGE_LEVEL, this._onPlayerLvlupChanged, this);

        NotificationMgr.addListener(NotificationName.MAP_PIONEER_ACTIONTYPE_CHANGED, this._onPioneerActionTypeChange, this);

        // rookie
        NotificationMgr.addListener(NotificationName.GAME_MAIN_RESOURCE_PLAY_ANIM, this._onGameMainResourcePlayAnim, this);
        NotificationMgr.addListener(NotificationName.USERINFO_ROOKE_STEP_CHANGE, this._onRookieStepChange, this);
        NotificationMgr.addListener(NotificationName.ROOKIE_GUIDE_TAP_MAIN_TASK, this._onRookieTapTask, this);
        NotificationMgr.addListener(NotificationName.ROOKIE_GUIDE_TAP_MAIN_DEFEND, this._onRookieTapDefend, this);

        this._refreshWorldBoxCountTip();
    }

    protected async viewDidStart(): Promise<void> {
        super.viewDidStart();
        this._refreshElementShow();
        this._refreshSettlememntTip();
        this._onInnerOuterChanged();
        this.changeLang();

        // const bigGanster = DataMgr.s.pioneer.getById("gangster_3");
        // if (bigGanster != null && bigGanster.show) {
        //     this.checkCanShowGansterComingTip(bigGanster.id);
        // }

        this.backpackBtn.node.on(
            Button.EventType.CLICK,
            async () => {
                GameMusicPlayMgr.playTapButtonEffect();
                await UIPanelManger.inst.pushPanel(UIName.Backpack);
            },
            this
        );
        let testButtonActive: boolean = GAME_ENV_IS_DEBUG;
        this.node.getChildByPath("CommonContent/AddHeatButton-001").active = false;
        this.node.getChildByPath("CommonContent/AddHeatButton-002").active = false;
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.CHANGE_LANG, this.changeLang, this);
        NotificationMgr.removeListener(NotificationName.GAME_INNER_BUILDING_LATTICE_EDIT_CHANGED, this._onInnerBuildingLatticeEditChanged, this);
        NotificationMgr.removeListener(NotificationName.GAME_INNER_AND_OUTER_CHANGED, this._onInnerOuterChanged, this);
        NotificationMgr.removeListener(NotificationName.INNER_BUILDING_UPGRADE_FINISHED, this._onInnerBuildingUpgradeFinished, this);

        NotificationMgr.removeListener(NotificationName.USERINFO_DID_CHANGE_LEVEL, this._onPlayerLvlupChanged, this);

        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_ACTIONTYPE_CHANGED, this._onPioneerActionTypeChange, this);

        NotificationMgr.removeListener(NotificationName.GAME_MAIN_RESOURCE_PLAY_ANIM, this._onGameMainResourcePlayAnim, this);
        NotificationMgr.removeListener(NotificationName.USERINFO_ROOKE_STEP_CHANGE, this._onRookieStepChange, this);
        NotificationMgr.removeListener(NotificationName.ROOKIE_GUIDE_TAP_MAIN_TASK, this._onRookieTapTask, this);
        NotificationMgr.removeListener(NotificationName.ROOKIE_GUIDE_TAP_MAIN_DEFEND, this._onRookieTapDefend, this);
    }

    changeLang(): void {
        // useLanMgr
        // this.node.getChildByPath("CommonContent/LeftNode/title").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("CommonContent/icon_treasure_box/Label").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("CommonContent/icon_artifact/Label").getComponent(Label).string = LanMgr.getLanById("107549");
        // this._worldBoxCountTipView.getChildByPath("Content/Title").getComponent(Label).string = LanMgr.getLanById("107549")
    }

    private _refreshElementShow() {
        const taskButton = this.node.getChildByPath("CommonContent/TaskButton");
        const backpackButton = this.node.getChildByPath("CommonContent/icon_treasure_box");
        const nftButton = this.node.getChildByPath("CommonContent/NFTButton");
        const defendButton = this.node.getChildByPath("CommonContent/SetDenderButton");
        const recuritButton = this.node.getChildByPath("CommonContent/RecuritButton");
        const exerciseButton = this.node.getChildByPath("CommonContent/ExerciseButton");
        const artifactButton = this.node.getChildByPath("CommonContent/ArtifactButton");
        const test1Button = this.node.getChildByPath("CommonContent/AddHeatButton-001");
        const test2Button = this.node.getChildByPath("CommonContent/AddHeatButton-002");

        const battleReportButton = this.node.getChildByPath("CommonContent/reportsButton");
        const pioneerListView = this.node.getChildByPath("CommonContent/LeftNode");
        const innerOuterChangeButton = this.node.getChildByPath("CommonContent/InnerOutChangeBtnBg");

        const innerBuildButton = this.node.getChildByPath("btnBuild");

        const rewardView = this.node.getChildByPath("CommonContent/HeatTreasureUI");
        const taskTrackView = this.node.getChildByPath("CommonContent/TaskTrackingUI");

        taskButton.active = false;
        backpackButton.active = false;
        nftButton.active = false;
        defendButton.active = false;
        recuritButton.active = false;
        exerciseButton.active = false;
        artifactButton.active = false;
        test1Button.active = false;
        test2Button.active = false;

        battleReportButton.active = false;
        pioneerListView.active = false;
        innerOuterChangeButton.active = false;

        innerBuildButton.active = false;

        rewardView.active = true;
        taskTrackView.active = false;

        this._worldBoxCountTipView.active = false;

        const rookieStep: RookieStep = DataMgr.s.userInfo.data.rookieStep;
        if (rookieStep >= RookieStep.FINISH) {
            taskButton.active = true;
            backpackButton.active = true;
            nftButton.active = true;
            defendButton.active = false;
            recuritButton.active = DataMgr.s.innerBuilding.getInnerBuildingLevel(InnerBuildingType.Barrack) >= 1;
            exerciseButton.active = DataMgr.s.innerBuilding.getInnerBuildingLevel(InnerBuildingType.TrainingCenter) >= 1;
            artifactButton.active = DataMgr.s.innerBuilding.getInnerBuildingLevel(InnerBuildingType.ArtifactStore) >= 1;
            test1Button.active = false;
            test2Button.active = false;

            battleReportButton.active = true;
            innerOuterChangeButton.active = true;

            // innerBuildButton.active = !GameMainHelper.instance.isGameShowOuter;

            taskTrackView.active = GameMainHelper.instance.isGameShowOuter;

            this._worldBoxCountTipView.active = true;
        } else if (rookieStep >= RookieStep.DEFEND_TAP) {
            defendButton.active = true;
            taskButton.active = true;

            battleReportButton.active = true;

            innerOuterChangeButton.active = true;

            if (rookieStep == RookieStep.DEFEND_TAP) {
                if (UIPanelManger.inst.panelIsShow(UIName.TaskListUI)) {
                    UIPanelManger.inst.popPanelByName(UIName.TaskListUI);
                }
            }
        } else if (rookieStep >= RookieStep.MAIN_BUILDING_TAP_1) {
            taskButton.active = true;

            battleReportButton.active = true;

            innerOuterChangeButton.active = true;
        } else if (rookieStep >= RookieStep.TASK_SHOW_TAP_2) {
            taskButton.active = true;

            battleReportButton.active = true;
        } else if (rookieStep >= RookieStep.TASK_SHOW_TAP_1) {
            taskButton.active = true;
        }

        let hasOuterPioneer = false;
        for (const pioneer of DataMgr.s.pioneer.getAllSelfPlayers()) {
            if (pioneer.actionType != MapPioneerActionType.inCity) {
                hasOuterPioneer = true;
                break;
            }
        }
        pioneerListView.active = GameMainHelper.instance.isGameShowOuter && hasOuterPioneer;

        if (!GameMainHelper.instance.isGameShowOuter && UIPanelManger.inst.panelIsShow(UIName.TaskListUI)) {
            UIPanelManger.inst.popPanelByName(UIName.TaskListUI);
        }
    }

    private _refreshSettlememntTip() {
        const newSettle = localStorage.getItem("local_newSettle");
        const view = this.node.getChildByPath("CommonContent/NewSettlementTipView");
        view.active = newSettle != null && newSettle.length > 0 && newSettle.indexOf("|") != -1;
    }
    private checkCanShowGansterComingTip(pioneerId: string) {
        if (pioneerId == "gangster_3") {
            this._gangsterComingTipView.active = true;
            this._gangsterComingTipView.getChildByPath("Bg/BigTeamComing").active = true;
            this._gangsterComingTipView.getChildByPath("Bg/BigTeamWillComing").active = false;
        }

        this._gangsterComingTipView.active = false;
    }
    private _refreshWorldBoxCountTip() {
        this.schedule(() => {
            this._worldBoxCountTipView.getChildByPath("Content/Time").getComponent(Label).string = CommonTools.formatSeconds(
                Math.max(0, (DataMgr.s.userInfo.data.boxRefreshTimestamp - new Date().getTime()) / 1000)
            );
        }, 1);
    }

    //------------------------------------------------- action
    private async onTapNewSettlementTip() {
        GameMusicPlayMgr.playTapButtonEffect();
        const currentData = localStorage.getItem("local_newSettle");
        if (currentData != null && currentData.length > 0 && currentData.indexOf("|") != -1) {
            localStorage.removeItem("local_newSettle");
            NetworkMgr.websocketMsg.get_user_settlement_info({});
            const beginLevel = parseInt(currentData.split("|")[0]);
            const endLevel = parseInt(currentData.split("|")[1]);
            const result = await UIPanelManger.inst.pushPanel(UIName.NewSettlementUI);
            if (result.success) {
                result.node.getComponent(NewSettlementUI).refreshUI(beginLevel, endLevel);
            }
            this._refreshSettlememntTip();
        }
    }
    private async onTapTaskList() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (UIPanelManger.inst.panelIsShow(UIName.TaskListUI)) {
            return;
        }
        const result = await UIPanelManger.inst.pushPanel(UIName.TaskListUI);
        if (!result.success) {
            return;
        }
        await result.node.getComponent(TaskListUI).refreshUI();
    }
    private async onTapNFT() {
        GameMusicPlayMgr.playTapButtonEffect();
        const result = await UIPanelManger.inst.pushPanel(UIName.NFTBackpackUI);
        if (result.success) {
            result.node.getComponent(NFTBackpackUI);
        }
    }
    private onTapChangeBuildingSetPos() {
        GameMusicPlayMgr.playTapButtonEffect();
        GameMainHelper.instance.changeInnerBuildingLatticeEdit();
    }
    private async onTapSetDefender() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.pushPanel(UIName.DefenderSetUI);
    }
    private onTapRefreshMap() {
        GameMusicPlayMgr.playTapButtonEffect();
        NetworkMgr.websocketMsg.reborn_all();
    }
    private async onTapRecruit() {
        GameMusicPlayMgr.playTapButtonEffect();
        const result = await UIPanelManger.inst.pushPanel(UIName.RecruitUI);
        if (result.success) {
            result.node.getComponent(RecruitUI).refreshUI(true);
        }
    }
    private async onTapExercise() {
        GameMusicPlayMgr.playTapButtonEffect();
        const result = await UIPanelManger.inst.pushPanel(UIName.ExerciseUI);
    }
    private async onTapArtifact() {
        GameMusicPlayMgr.playTapButtonEffect();
        const result = await UIPanelManger.inst.pushPanel(UIName.RelicTowerUI);
        if (result.success) {
            result.node.getComponent(RelicTowerUI).configuration(0);
        }
    }

    //----------------------------------------------------- notification
    private _onPioneerShowChanged(data: { id: string; show: boolean }) {
        this.checkCanShowGansterComingTip(data.id);
    }

    private _onInnerBuildingLatticeEditChanged() {
        const edit: boolean = GameMainHelper.instance.isEditInnerBuildingLattice;
        this.node.getChildByPath("CommonContent").active = !edit;
    }
    private _onInnerOuterChanged() {
        this._refreshElementShow();
    }

    private _onPlayerLvlupChanged(): void {
        const currentLevel: number = DataMgr.s.userInfo.data.level;
        let gap: number = 4;
        if (currentLevel % gap == 0) {
            NetworkMgr.websocketMsg.get_user_settlement_info({});
            const currentSettle: number = currentLevel / gap - 1;
            const beginLevel: number = currentSettle * gap + 1;
            const endLevel: number = (currentSettle + 1) * gap;
            localStorage.setItem("local_newSettle", beginLevel + "|" + endLevel);
            this._refreshSettlememntTip();
        }
    }

    private _onPioneerActionTypeChange() {
        this._refreshElementShow();
    }

    private _onInnerBuildingUpgradeFinished() {
        this._refreshElementShow();
    }

    private _onGameMainResourcePlayAnim(data: RookieResourceAnimStruct) {
        const { animType, callback } = data;
        let fromPos: Vec3 = null;
        let toPos: Vec3 = null;
        let moveView: Node = null;
        if (animType == RookieResourceAnim.PIONEER_0_TO_GOLD) {
            const fromView = find("Main/Canvas/GameContent/Game/OutScene/TiledMap/deco_layer/MAP_pioneer_0");
            if (fromView != null) {
                fromPos = GameMainHelper.instance.getGameCameraWposToUI(fromView.worldPosition, this.node);
            }
            const toView = this.node.getChildByPath("CommonContent/TopUI/txtGoldNum/tag");
            toPos = this.node.getComponent(UITransform).convertToNodeSpaceAR(toView.worldPosition);

            moveView = toView;
        } else if (animType == RookieResourceAnim.GOLD_TO_HEAT) {
            const fromView = this.node.getChildByPath("CommonContent/TopUI/txtGoldNum/tag");
            const toView = this.node.getChildByPath("CommonContent/HeatTreasureUI/__ViewContent/Content/HeatProgress/HeatValue");

            fromPos = this.node.getComponent(UITransform).convertToNodeSpaceAR(fromView.worldPosition);
            toPos = this.node.getComponent(UITransform).convertToNodeSpaceAR(toView.worldPosition);

            moveView = fromView;
        } else if (
            animType == RookieResourceAnim.BOX_1_TO_PSYC ||
            animType == RookieResourceAnim.BOX_2_TO_PSYC ||
            animType == RookieResourceAnim.BOX_3_TO_PSYC
        ) {
            let boxIndex: number = -1;
            if (animType == RookieResourceAnim.BOX_1_TO_PSYC) {
                boxIndex = 0;
            } else if (animType == RookieResourceAnim.BOX_2_TO_PSYC) {
                boxIndex = 1;
            } else if (animType == RookieResourceAnim.BOX_3_TO_PSYC) {
                boxIndex = 2;
            }
            const fromView = this.node.getChildByPath("CommonContent/HeatTreasureUI/__ViewContent/Content/ProgressBar/BoxContent/HEAT_TREASURE_" + boxIndex);
            const toView = this.node.getChildByPath("CommonContent/TopUI/txtEnergyNum/energy_icon");

            fromPos = this.node.getComponent(UITransform).convertToNodeSpaceAR(fromView.worldPosition);
            toPos = this.node.getComponent(UITransform).convertToNodeSpaceAR(toView.worldPosition);

            moveView = toView;
        }
        if (fromPos == null || toPos == null) {
            return;
        }
        for (let i = 0; i < 5; i++) {
            // const resourceFly = instantiate(this.resourceFlyAnim);
            // resourceFly.setParent(this._animView);
            // resourceFly.position = fromPos;
            // tween()
            //     .target(resourceFly)
            //     .delay(i * 0.2)
            //     .to(1, { position: toPos })
            //     .call(() => {
            //         resourceFly.destroy();
            //     })
            //     .start();

            const icon = instantiate(moveView);
            icon.setParent(this._animView);
            icon.position = fromPos;
            tween()
                .target(icon)
                .delay(i * 0.2)
                .to(1, { position: toPos })
                .call(() => {
                    icon.destroy();
                    if (i == 4) {
                        if (callback != null) {
                            callback();
                        }
                    }
                })
                .start();
        }
    }
    private async _onRookieStepChange() {
        this._refreshElementShow();
    }
    private _onRookieTapTask() {
        this.onTapTaskList();
        const item = UIPanelManger.inst.getPanelByName(UIName.TaskListUI);
        if (item == null) {
            return;
        }
        item.getComponent(TaskListUI).refreshUI();
    }
    private _onRookieTapDefend() {
        this.onTapSetDefender();
    }
}
