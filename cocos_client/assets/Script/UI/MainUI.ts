import { _decorator, Node, Button, Label } from "cc";
import { ClaimRewardUI } from "./ClaimRewardUI";
import { LanMgr, PioneerMgr, UserInfoMgr } from "../Utils/Global";
import { UIName } from "../Const/ConstUIDefine";
import { TaskListUI } from "./TaskListUI";
import { NewSettlementUI } from "./NewSettlementUI";
import ViewController from "../BasicView/ViewController";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import Config from "../Const/Config";
import { MapMemberFactionType } from "../Const/ConstDefine";
import UIPanelManger from "../Basic/UIPanelMgr";
import GameMainHelper from "../Game/Helper/GameMainHelper";
import { DataMgr } from "../Data/DataMgr";
import { NFTBackpackUI } from "./NFTBackpackUI";
import ItemData from "../Const/Item";
import ArtifactData from "../Model/ArtifactData";
import CommonTools from "../Tool/CommonTools";
import { DefenderSetUI } from "./DefenderSetUI";
import { NetworkMgr } from "../Net/NetworkMgr";

const { ccclass, property } = _decorator;

@ccclass("MainUI")
export class MainUI extends ViewController {
    @property(Button)
    backpackBtn: Button = null;

    private _claimRewardUI: ClaimRewardUI;
    private _gangsterComingTipView: Node = null;

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._gangsterComingTipView = this.node.getChildByPath("CommonContent/GangsterTipView");
        this._gangsterComingTipView.active = false;

        NotificationMgr.addListener(NotificationName.CHANGE_LANG, this.changeLang, this);
        NotificationMgr.addListener(NotificationName.CHOOSE_GANGSTER_ROUTE, this._refreshInnerOuterChange, this);
        NotificationMgr.addListener(NotificationName.GAME_INNER_BUILDING_LATTICE_EDIT_CHANGED, this._onInnerBuildingLatticeEditChanged, this);
        NotificationMgr.addListener(NotificationName.GAME_INNER_AND_OUTER_CHANGED, this._onInnerOuterChanged, this);
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_SHOW_HIDE_COUNT_CHANGED, this._onPioneerShowHideCountChanged, this);

        NotificationMgr.addListener(NotificationName.USERINFO_DID_CHANGE_LEVEL, this._onPlayerLvlupChanged, this);
        NotificationMgr.addListener(NotificationName.USERINFO_DID_CHANGE_TREASURE_PROGRESS, this._onPlayerExplorationValueChanged, this);
    }

    protected async viewDidStart(): Promise<void> {
        super.viewDidStart();

        this._claimRewardUI = this.node.getChildByPath("CommonContent/reward_ui").getComponent(ClaimRewardUI);

        this._refreshSettlememntTip();
        this._refreshInnerOuterChange();
        this._onInnerOuterChanged();
        this.changeLang();

        const bigGanster = DataMgr.s.pioneer.getById("gangster_3");
        if (bigGanster != null && bigGanster.show) {
            this.checkCanShowGansterComingTip(bigGanster.id);
        }

        this.backpackBtn.node.on(
            Button.EventType.CLICK,
            async () => {
                await UIPanelManger.inst.pushPanel(UIName.Backpack);
            },
            this
        );

        // test
        // for (let i = 1; i <= 10; i++) {
        //     DataMgr.s.artifact.addObj_artifact([new ArtifactData("700" + i, 1)]);
        // }
        //DataMgr.n.websocketMsg.create_pioneer({
        //    type: "0"
        //});
        // DataMgr.s.item.addObj_item([new ItemData("8005", 1000)]);
        // DataMgr.s.item.addObj_item([new ItemData("8001", 1000)]);
        // DataMgr.s.item.addObj_item([new ItemData("8002", 1000)]);
        // DataMgr.s.item.addObj_item([new ItemData("8003", 1000)]);
        // DataMgr.s.item.addObj_item([new ItemData("8004", 1000)]);
        // DataMgr.s.item.addObj_item([new ItemData("10", 1)]);
        // DataMgr.s.item.addObj_item([new ItemData("11", 1)]);
        // DataMgr.s.nftPioneer.generateNewNFT();
        // DataMgr.s.userInfo.gainTreasureProgress(80);
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.CHANGE_LANG, this.changeLang, this);
        NotificationMgr.removeListener(NotificationName.CHOOSE_GANGSTER_ROUTE, this._refreshInnerOuterChange, this);
        NotificationMgr.removeListener(NotificationName.GAME_INNER_BUILDING_LATTICE_EDIT_CHANGED, this._onInnerBuildingLatticeEditChanged, this);
        NotificationMgr.removeListener(NotificationName.GAME_INNER_AND_OUTER_CHANGED, this._onInnerOuterChanged, this);
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_SHOW_HIDE_COUNT_CHANGED, this._onPioneerShowHideCountChanged, this);

        NotificationMgr.removeListener(NotificationName.USERINFO_DID_CHANGE_LEVEL, this._onPlayerLvlupChanged, this);
        NotificationMgr.removeListener(NotificationName.USERINFO_DID_CHANGE_TREASURE_PROGRESS, this._onPlayerExplorationValueChanged, this);
    }

    changeLang(): void {
        // useLanMgr
        // this.node.getChildByPath("CommonContent/LeftNode/title").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("CommonContent/icon_treasure_box/Label").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("CommonContent/icon_artifact/Label").getComponent(Label).string = LanMgr.getLanById("107549");
    }

    private _refreshSettlememntTip() {
        const newSettle = localStorage.getItem("local_newSettle");
        const view = this.node.getChildByPath("CommonContent/NewSettlementTipView");
        view.active = newSettle != null;
    }
    private _refreshInnerOuterChange() {
        let isEnemy: boolean = false;
        // const building = BuildingMgr.getBuildingById("building_1");
        const building = DataMgr.s.mapBuilding.getBuildingById("building_1");

        if (building != null && building.faction == MapMemberFactionType.enemy) {
            isEnemy = true;
        }
        this.node.getChildByPath("CommonContent/InnerOutChangeBtnBg").active = !isEnemy;
    }
    private checkCanShowGansterComingTip(pioneerId: string) {
        if (pioneerId == "gangster_3") {
            this._gangsterComingTipView.active = true;
            this._gangsterComingTipView.getChildByPath("Bg/BigTeamComing").active = true;
            this._gangsterComingTipView.getChildByPath("Bg/BigTeamWillComing").active = false;
        }
    }

    //------------------------------------------------- action
    private async onTapNewSettlementTip() {
        const currentData = localStorage.getItem("local_newSettle");
        if (currentData != null) {
            const beginLevel = parseInt(currentData.split("|")[0]);
            const endLevel = parseInt(currentData.split("|")[1]);
            const result = await UIPanelManger.inst.pushPanel(UIName.NewSettlementUI);
            if (result.success) {
                result.node.getComponent(NewSettlementUI).refreshUI(beginLevel, endLevel);
            }
            localStorage.removeItem("local_newSettle");
            this._refreshSettlememntTip();
        }
    }
    private async onTapTaskList() {
        if (UIPanelManger.inst.panelIsShow(UIName.TaskListUI)) {
            return;
        }
        const result = await UIPanelManger.inst.pushPanel(UIName.TaskListUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(TaskListUI).refreshUI();
    }
    private async onTapNFT() {
        const result = await UIPanelManger.inst.pushPanel(UIName.NFTBackpackUI);
        if (result.success) {
            result.node.getComponent(NFTBackpackUI);
        }
    }
    private onTapChangeBuildingSetPos() {
        GameMainHelper.instance.changeInnerBuildingLatticeEdit();
    }

    private onTapRandomNFT() {
        DataMgr.s.nftPioneer.generateNewNFT();
    }
    private onTapRandomPioneer() {
        const pioneerIds: string[] = ["pioneer_1", "pioneer_2", "pioneer_3"];
        for (let i = 0; i < pioneerIds.length; i++) {
            if (DataMgr.s.pioneer.getById(pioneerIds[i], true) == undefined) {
                continue;
            }
            pioneerIds.splice(i, 1);
            i--;
        }
        if (pioneerIds.length > 0) {
            const randomId = CommonTools.getRandomItem(pioneerIds);
            PioneerMgr.showPioneer(randomId);
        }
    }
    private async onTapSetDefender() {
        UIPanelManger.inst.pushPanel(UIName.DefenderSetUI);
    }
    private onTapAddHeat() {
        NetworkMgr.websocketMsg.player_add_heat_value({ num: 50 });
    }
    private onTapTest() {
        DataMgr.s.userInfo.data.heatValue.getTimestamp = 0;
        DataMgr.s.userInfo.saveObj();
    }
    //----------------------------------------------------- notification
    private _onPioneerShowChanged(data: { id: string; show: boolean }) {
        this.checkCanShowGansterComingTip(data.id);
    }
    private _onPioneerShowHideCountChanged(data: { id: string }) {
        const pioneer = DataMgr.s.pioneer.getById(data.id);
        if (pioneer == undefined) {
            return;
        }
        if (pioneer.id == "gangster_3" && pioneer.showHideStruct != null && pioneer.showHideStruct.countTime > 0 && pioneer.showHideStruct.isShow) {
            this._gangsterComingTipView.active = true;
            this._gangsterComingTipView.getChildByPath("Bg/BigTeamComing").active = false;
            this._gangsterComingTipView.getChildByPath("Bg/BigTeamWillComing").active = true;
            this._gangsterComingTipView.getChildByPath("Bg/BigTeamWillComing/Tip").getComponent(Label).string = LanMgr.replaceLanById("200003", [
                CommonTools.formatSeconds(pioneer.showHideStruct.countTime),
            ]);
        }
    }

    private _onInnerBuildingLatticeEditChanged() {
        const edit: boolean = GameMainHelper.instance.isEditInnerBuildingLattice;
        this.node.getChildByPath("CommonContent").active = !edit;
    }
    private _onInnerOuterChanged() {
        const isOuter: boolean = GameMainHelper.instance.isGameShowOuter;
        this.node.getChildByPath("btnBuild").active = !isOuter;
    }

    private _onPlayerLvlupChanged(): void {
        const currentLevel: number = DataMgr.s.userInfo.data.level;
        const gap: number = 4;
        if (currentLevel % gap == 0) {
            const currentSettle: number = currentLevel / gap - 1;
            const beginLevel: number = currentSettle * gap + 1;
            const endLevel: number = (currentSettle + 1) * gap;
            if (Config.canSaveLocalData) {
                localStorage.setItem("local_newSettle", beginLevel + "|" + endLevel);
            }
            this._refreshSettlememntTip();
        }
    }
    private _onPlayerExplorationValueChanged(): void {
        this._claimRewardUI.refreshUI();
    }
}
