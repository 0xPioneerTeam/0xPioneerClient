import { _decorator, Button, find, instantiate, Label, Node, Prefab, tween, UITransform, Vec3 } from "cc";
import NotificationMgr from "../Basic/NotificationMgr";
import UIPanelManger from "../Basic/UIPanelMgr";
import ViewController from "../BasicView/ViewController";
import { InnerBuildingType } from "../Const/BuildingDefine";
import { GAME_ENV_IS_DEBUG } from "../Const/ConstDefine";
import { UIName } from "../Const/ConstUIDefine";
import { NotificationName } from "../Const/Notification";
import { MapPioneerActionType } from "../Const/PioneerDefine";
import { RookieResourceAnim, RookieResourceAnimStruct, RookieStep } from "../Const/RookieDefine";
import { DataMgr } from "../Data/DataMgr";
import GameMainHelper from "../Game/Helper/GameMainHelper";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
import { NetworkMgr } from "../Net/NetworkMgr";
import CommonTools from "../Tool/CommonTools";
import { GameMgr, LanMgr } from "../Utils/Global";
import { NewSettlementUI } from "./NewSettlementUI";
import { NFTBackpackUI } from "./NFTBackpackUI";
import { RelicTowerUI } from "./RelicTowerUI";
import { TaskListUI } from "./TaskListUI";
import { UIHUDController } from "./UIHUDController";
import { RedPointView } from "./View/RedPointView";
import { s2c_user } from "../Net/msg/WebsocketMsg";
import AbiConfig from "../Config/AbiConfig";
import { IdleUI } from "./IdleUI";

const { ccclass, property } = _decorator;

@ccclass("MainUI")
export class MainUI extends ViewController {
    @property(Button)
    backpackBtn: Button = null;

    @property(Prefab)
    private resourceFlyAnim: Prefab = null;

    private _worldRankRedPointNum: number = 0;

    private _idleTaskRedPointNum: number = 0;

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

        // task
        NotificationMgr.addListener(NotificationName.TASK_DID_CHANGE, this._refreshTaskRedPoint, this);
        // nft
        NotificationMgr.addListener(NotificationName.NFT_LEVEL_UP, this._refreshNFTRedPoint, this);
        NotificationMgr.addListener(NotificationName.NFT_RANK_UP, this._refreshNFTRedPoint, this);
        // item
        NotificationMgr.addListener(NotificationName.RESOURCE_GETTED, this._onGetResource, this);
        NotificationMgr.addListener(NotificationName.BACKPACK_GET_NEW_ITEM, this._refreshBackpackRedPoint, this);
        NotificationMgr.addListener(NotificationName.BACKPACK_READ_NEW_ITEM, this._refreshBackpackRedPoint, this);
        // artifact
        NotificationMgr.addListener(NotificationName.ARTIFACTPACK_GET_NEW_ARTIFACT, this._onArtifactNewChanged, this);
        NotificationMgr.addListener(NotificationName.ARTIFACTPACK_READ_NEW_ARTIFACT, this._onArtifactNewChanged, this);
        // recruit
        NotificationMgr.addListener(NotificationName.INNER_BUILDING_RECRUIT_REDPOINT_CHANGED, this._refreshRecruitRedPoint, this);
        // exercise
        NotificationMgr.addListener(NotificationName.INNER_BUILDING_TRAIN_REDPOINT_CHANGED, this._refreshExerciseRedPoint, this);

        this._refreshWorldBoxCountTip();

        NetworkMgr.websocket.on("get_rank_res", this.get_rank_res);
        NetworkMgr.websocket.on("get_rank_red_point_res", this.get_rank_red_point_res);

        NetworkMgr.websocket.on("get_idle_task_red_point_res", this.get_idle_task_red_point_res);
        NetworkMgr.websocket.on("idle_task_red_point_change", this.idle_task_red_point_change);

        NetworkMgr.websocketMsg.get_idle_task_red_point({});
    }

    protected async viewDidStart(): Promise<void> {
        super.viewDidStart();
        this._refreshElementShow();
        this._refreshSettlememntTip();
        this._onInnerOuterChanged();
        this.changeLang();

        // redPoint
        this._refreshTaskRedPoint();
        this._refreshNFTRedPoint();
        this._refreshBackpackRedPoint();
        this._refreshArtifactRedPoint();
        this._refreshRecruitRedPoint();
        this._refreshExerciseRedPoint();
        NetworkMgr.websocketMsg.get_rank_red_point({});

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

        // task
        NotificationMgr.removeListener(NotificationName.TASK_DID_CHANGE, this._refreshTaskRedPoint, this);
        // nft
        NotificationMgr.removeListener(NotificationName.NFT_LEVEL_UP, this._refreshNFTRedPoint, this);
        NotificationMgr.removeListener(NotificationName.NFT_RANK_UP, this._refreshNFTRedPoint, this);
        // item
        NotificationMgr.removeListener(NotificationName.RESOURCE_GETTED, this._onGetResource, this);
        NotificationMgr.removeListener(NotificationName.BACKPACK_GET_NEW_ITEM, this._refreshBackpackRedPoint, this);
        NotificationMgr.removeListener(NotificationName.BACKPACK_READ_NEW_ITEM, this._refreshBackpackRedPoint, this);
        // artifact
        NotificationMgr.removeListener(NotificationName.ARTIFACTPACK_GET_NEW_ARTIFACT, this._onArtifactNewChanged, this);
        NotificationMgr.removeListener(NotificationName.ARTIFACTPACK_READ_NEW_ARTIFACT, this._onArtifactNewChanged, this);
        // recruit
        NotificationMgr.removeListener(NotificationName.INNER_BUILDING_RECRUIT_REDPOINT_CHANGED, this._refreshRecruitRedPoint, this);
        // exercise
        NotificationMgr.removeListener(NotificationName.INNER_BUILDING_TRAIN_REDPOINT_CHANGED, this._refreshExerciseRedPoint, this);

        NetworkMgr.websocket.off("get_rank_res", this.get_rank_res);
        NetworkMgr.websocket.off("get_rank_red_point_res", this.get_rank_red_point_res);

        NetworkMgr.websocket.off("get_idle_task_red_point_res", this.get_rank_red_point_res);
        NetworkMgr.websocket.off("idle_task_red_point_change", this.idle_task_red_point_change);
    }

    changeLang(): void {
        // useLanMgr
        // this.node.getChildByPath("CommonContent/LeftNode/title").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("CommonContent/icon_treasure_box/Label").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("CommonContent/icon_artifact/Label").getComponent(Label).string = LanMgr.getLanById("107549");
        // this._worldBoxCountTipView.getChildByPath("Content/Title").getComponent(Label).string = LanMgr.getLanById("107549")
    }

    // red point
    private _refreshTaskRedPoint() {
        const redPointValue: number = DataMgr.s.task.getAllDoingTasks().length + DataMgr.s.task.getMissionAllDoing().length;
        const redPointView = this.node.getChildByPath("CommonContent/TaskButton/RedPoint").getComponent(RedPointView);
        redPointView.refreshUI(redPointValue);
    }
    private _refreshNFTRedPoint() {
        const redPointValue: number = GameMgr.checkHasNFTCanRed() ? 1 : 0;
        const redPointView = this.node.getChildByPath("CommonContent/NFTButton/RedPoint").getComponent(RedPointView);
        redPointView.refreshUI(redPointValue, false);
    }
    private _refreshBackpackRedPoint() {
        const redPointValue: number = DataMgr.s.item.getAllNewItemCount() + DataMgr.s.artifact.getAllNewArtifactCount();
        const redPointView = this.node.getChildByPath("CommonContent/icon_treasure_box/RedPoint").getComponent(RedPointView);
        redPointView.refreshUI(redPointValue);
    }
    private _refreshArtifactRedPoint() {
        const redPointValue: number = DataMgr.s.artifact.getAllNewArtifactCount();
        const redPointView = this.node.getChildByPath("CommonContent/ArtifactButton/RedPoint").getComponent(RedPointView);
        redPointView.refreshUI(redPointValue);
    }
    private _refreshRecruitRedPoint() {
        const redPointValue: boolean = DataMgr.s.userInfo.getRecruitRedPoint();
        const redPointView = this.node.getChildByPath("CommonContent/RecuritButton/RedPoint").getComponent(RedPointView);
        redPointView.refreshUI(redPointValue ? 1 : 0, false);
    }
    private _refreshExerciseRedPoint() {
        const redPointValue: boolean = DataMgr.s.userInfo.getExerciseRedPoint();
        const redPointView = this.node.getChildByPath("CommonContent/ExerciseButton/RedPoint").getComponent(RedPointView);
        redPointView.refreshUI(redPointValue ? 1 : 0, false);
    }
    private _refreshWorldRankRedPoint() {
        const redPointView = this.node.getChildByPath("CommonContent/RankButton/RedPoint").getComponent(RedPointView);
        redPointView.refreshUI(this._worldRankRedPointNum, false);
    }
    private _refreshIdleTaskRedPoint() {
        const redPointView = this.node.getChildByPath("CommonContent/IdleTaskButton/RedPoint").getComponent(RedPointView);
        redPointView.refreshUI(this._idleTaskRedPointNum, false);
    }

    // button
    private _refreshElementShow() {
        const taskButton = this.node.getChildByPath("CommonContent/TaskButton");
        const backpackButton = this.node.getChildByPath("CommonContent/icon_treasure_box");
        const nftButton = this.node.getChildByPath("CommonContent/NFTButton");
        const reinforceButton = this.node.getChildByPath("CommonContent/ReinforceTroopsButton");
        const rankButton = this.node.getChildByPath("CommonContent/RankButton");
        const recuritButton = this.node.getChildByPath("CommonContent/RecuritButton");
        const exerciseButton = this.node.getChildByPath("CommonContent/ExerciseButton");
        const artifactButton = this.node.getChildByPath("CommonContent/ArtifactButton");

        const battleReportButton = this.node.getChildByPath("CommonContent/reportsButton");
        const pioneerListView = this.node.getChildByPath("CommonContent/LeftNode");
        const arrowContent = this.node.getChildByPath("arrowContent");
        const innerOuterChangeButton = this.node.getChildByPath("CommonContent/InnerOutChangeBtnBg");

        const innerBuildButton = this.node.getChildByPath("btnBuild");

        const rewardView = this.node.getChildByPath("CommonContent/HeatTreasureUI");
        const taskTrackView = this.node.getChildByPath("CommonContent/TaskTrackingUI");
        const idleTaskButton = this.node.getChildByPath("CommonContent/IdleTaskButton");
        const illustrationButton = this.node.getChildByPath("CommonContent/NFTIllustrationButton");

        taskButton.active = false;
        backpackButton.active = false;
        nftButton.active = false;
        reinforceButton.active = false;
        rankButton.active = false;
        recuritButton.active = false;
        exerciseButton.active = false;
        artifactButton.active = false;
        battleReportButton.active = false;
        pioneerListView.active = false;
        innerOuterChangeButton.active = false;
        idleTaskButton.active = false
        illustrationButton.active = false;
        innerBuildButton.active = false;

        rewardView.active = true;
        taskTrackView.active = false;

        this._worldBoxCountTipView.active = false;

        const rookieStep: RookieStep = DataMgr.s.userInfo.data.rookieStep;
        if (rookieStep >= RookieStep.FINISH) {
            idleTaskButton.active = true;
            illustrationButton.active = true;
            taskButton.active = true;
            backpackButton.active = true;
            reinforceButton.active = true;
            rankButton.active = true;
            nftButton.active = true;
            recuritButton.active = DataMgr.s.innerBuilding.getInnerBuildingLevel(InnerBuildingType.Barrack) >= 1;
            exerciseButton.active = DataMgr.s.innerBuilding.getInnerBuildingLevel(InnerBuildingType.TrainingCenter) >= 1;
            artifactButton.active = DataMgr.s.innerBuilding.getInnerBuildingLevel(InnerBuildingType.ArtifactStore) >= 1;

            battleReportButton.active = true;
            innerOuterChangeButton.active = true;

            // innerBuildButton.active = !GameMainHelper.instance.isGameShowOuter;

            taskTrackView.active = GameMainHelper.instance.isGameShowOuter;

            this._worldBoxCountTipView.active = true;
        } else if (rookieStep >= RookieStep.GUIDE_1010) {
            recuritButton.active = DataMgr.s.innerBuilding.getInnerBuildingLevel(InnerBuildingType.Barrack) >= 1;
            nftButton.active = true;
            battleReportButton.active = true;
            innerOuterChangeButton.active = true;
        } else if (rookieStep >= RookieStep.GUIDE_1009) {
            recuritButton.active = DataMgr.s.innerBuilding.getInnerBuildingLevel(InnerBuildingType.Barrack) >= 1;
            exerciseButton.active = DataMgr.s.innerBuilding.getInnerBuildingLevel(InnerBuildingType.TrainingCenter) >= 1;
            battleReportButton.active = true;
            innerOuterChangeButton.active = true;
        } else if (rookieStep >= RookieStep.GUIDE_1005) {
            recuritButton.active = DataMgr.s.innerBuilding.getInnerBuildingLevel(InnerBuildingType.Barrack) >= 1;
            battleReportButton.active = true;
            innerOuterChangeButton.active = true;
        } else if (rookieStep >= RookieStep.GUIDE_1004) {
            recuritButton.active = DataMgr.s.innerBuilding.getInnerBuildingLevel(InnerBuildingType.Barrack) >= 1;
            innerOuterChangeButton.active = true;
        } else if (rookieStep >= RookieStep.GUIDE_1001) {
            innerOuterChangeButton.active = true;
        }
        // } else if (rookieStep >= RookieStep.DEFEND_TAP) {
        //     defendButton.active = true;
        //     taskButton.active = true;

        //     battleReportButton.active = true;

        //     innerOuterChangeButton.active = true;

        //     if (rookieStep == RookieStep.DEFEND_TAP) {
        //         if (UIPanelManger.inst.panelIsShow(UIName.TaskListUI)) {
        //             UIPanelManger.inst.popPanelByName(UIName.TaskListUI);
        //         }
        //     }
        // } else if (rookieStep >= RookieStep.MAIN_BUILDING_TAP_1) {
        //     taskButton.active = true;

        //     battleReportButton.active = true;

        //     innerOuterChangeButton.active = true;
        // } else if (rookieStep >= RookieStep.TASK_SHOW_TAP_2) {
        //     taskButton.active = true;

        //     battleReportButton.active = true;
        // } else if (rookieStep >= RookieStep.TASK_SHOW_TAP_1) {
        //     taskButton.active = true;
        // }

        let hasOuterPioneer = false;
        for (const pioneer of DataMgr.s.pioneer.getAllSelfPlayers()) {
            if (pioneer.actionType != MapPioneerActionType.inCity) {
                hasOuterPioneer = true;
                break;
            }
        }
        pioneerListView.active = GameMainHelper.instance.isGameShowOuter && hasOuterPioneer;
        arrowContent.active = GameMainHelper.instance.isGameShowOuter;

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
                Math.max(0, (CommonTools.getStartOfNextDayTimstamp() - new Date().getTime()) / 1000)
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

    private async onTapIdle() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (UIPanelManger.inst.panelIsShow(UIName.IdleUI)) {
            return;
        }
        const result = await UIPanelManger.inst.pushPanel(UIName.IdleUI);
        if (!result.success) {
            return;
        }
        await result.node.getComponent(IdleUI).refreshUI();
    }

    private async onTapNFTIllustration() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.pushPanel(UIName.NFIllustrationUI);
    }

    private async onTapWarOrder() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.pushPanel(UIName.WarOrderUI);
    }

    private async onTapNFT() {
        GameMusicPlayMgr.playTapButtonEffect();
        const result = await UIPanelManger.inst.pushPanel(UIName.NFTBackpackUI);
        if (result.success) {
            result.node.getComponent(NFTBackpackUI);
        }
    }
    private onTapReinforceTroops() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.pushPanel(UIName.PlayerDispatchListUI);
    }

    private onTapChangeBuildingSetPos() {
        GameMusicPlayMgr.playTapButtonEffect();
        GameMainHelper.instance.changeInnerBuildingLatticeEdit();
    }
    private onTapRefreshMap() {
        GameMusicPlayMgr.playTapButtonEffect();
        NetworkMgr.websocketMsg.reborn_all();
    }
    private async onTapRank() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.pushPanel(UIName.WorldRankUI);
    }
    private async onTapRecruit() {
        GameMusicPlayMgr.playTapButtonEffect();
        const recruitBuilding = DataMgr.s.innerBuilding.data.get(InnerBuildingType.Barrack);
        if (recruitBuilding?.upgrading) {
            UIHUDController.showCenterTip(LanMgr.getLanById("201003"));
            return;
        }
        if (recruitBuilding?.troopIng) {
            UIHUDController.showCenterTip("Generating");
            // UIHUDController.showCenterTip("The building is being upgraded, please wait.");
            return;
        }
        UIPanelManger.inst.pushPanel(UIName.RecruitUI);
    }
    private async onTapExercise() {
        GameMusicPlayMgr.playTapButtonEffect();
        const exerciseBuilding = DataMgr.s.innerBuilding.data.get(InnerBuildingType.TrainingCenter);
        if (exerciseBuilding?.upgrading) {
            UIHUDController.showCenterTip(LanMgr.getLanById("201003"));
            return;
        }
        if (exerciseBuilding?.tc?.training?.end > new Date().getTime()) {
            UIHUDController.showCenterTip("Generating");
            // UIHUDController.showCenterTip("The building is being upgraded, please wait.");
            return;
        }
        UIPanelManger.inst.pushPanel(UIName.ExerciseUI);
    }
    private async onTapArtifact() {
        GameMusicPlayMgr.playTapButtonEffect();
        const artifactBuilding = DataMgr.s.innerBuilding.data.get(InnerBuildingType.ArtifactStore);
        if (artifactBuilding?.upgrading) {
            UIHUDController.showCenterTip(LanMgr.getLanById("201003"));
            return;
        }
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

    private _onGetResource() {
        this._refreshNFTRedPoint();
    }
    private _onArtifactNewChanged() {
        this._refreshBackpackRedPoint();
        this._refreshArtifactRedPoint();
    }

    //----------------------------------- socket nofify
    private get_rank_red_point_res = (e: any) => {
        const p: s2c_user.Iget_rank_red_point_res = e.data;
        if (p.res !== 1) {
            return;
        }
        this._worldRankRedPointNum = p.num;
        this._refreshWorldRankRedPoint();
    };
    private get_rank_res = (e: any) => {
        const p: s2c_user.Iget_rank_res = e.data;
        if (p.res !== 1) {
            return;
        }
        NetworkMgr.websocketMsg.get_rank_red_point({});
    };

    private get_idle_task_red_point_res = (e: any) => {
        const p: s2c_user.Iget_idle_task_red_point_res = e.data;
        if (p.res !== 1) {
            return;
        }
        this._idleTaskRedPointNum = p.num;
        this._refreshIdleTaskRedPoint();
    };
    private idle_task_red_point_change = (e: any) => {
        const p: s2c_user.Iidle_task_red_point_change = e.data;
        this._idleTaskRedPointNum = p.num;
        this._refreshIdleTaskRedPoint();
    };
}
