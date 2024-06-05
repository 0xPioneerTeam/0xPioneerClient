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
import { GAME_ENV_IS_DEBUG, MapMemberFactionType } from "../Const/ConstDefine";
import UIPanelManger from "../Basic/UIPanelMgr";
import GameMainHelper from "../Game/Helper/GameMainHelper";
import { DataMgr } from "../Data/DataMgr";
import { NFTBackpackUI } from "./NFTBackpackUI";
import CommonTools from "../Tool/CommonTools";
import { NetworkMgr } from "../Net/NetworkMgr";
import ArtifactData from "../Model/ArtifactData";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";

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
        NotificationMgr.addListener(NotificationName.GAME_INNER_BUILDING_LATTICE_EDIT_CHANGED, this._onInnerBuildingLatticeEditChanged, this);
        NotificationMgr.addListener(NotificationName.GAME_INNER_AND_OUTER_CHANGED, this._onInnerOuterChanged, this);

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
                GameMusicPlayMgr.playTapButtonEffect();
                await UIPanelManger.inst.pushPanel(UIName.Backpack);
            },
            this
        );
        let testButtonActive: boolean = GAME_ENV_IS_DEBUG;
        this.node.getChildByPath("CommonContent/AddHeatButton-001").active = testButtonActive;
        this.node.getChildByPath("CommonContent/AddHeatButton-002").active = testButtonActive;
        // test
        //DataMgr.n.websocketMsg.create_pioneer({
        //    type: "0"
        //});
        // DataMgr.s.item.addObj_item([new ItemData("8001", 1000)]);
        // DataMgr.s.item.addObj_item([new ItemData("8002", 1000)]);
        // DataMgr.s.item.addObj_item([new ItemData("8003", 1000)]);
        // DataMgr.s.item.addObj_item([new ItemData("8004", 1000)]);
        // DataMgr.s.item.addObj_item([new ItemData("10", 1)]);
        // DataMgr.s.item.addObj_item([new ItemData("11", 1)]);
        // DataMgr.s.nftPioneer.generateNewNFT();
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.CHANGE_LANG, this.changeLang, this);
        NotificationMgr.removeListener(NotificationName.GAME_INNER_BUILDING_LATTICE_EDIT_CHANGED, this._onInnerBuildingLatticeEditChanged, this);
        NotificationMgr.removeListener(NotificationName.GAME_INNER_AND_OUTER_CHANGED, this._onInnerOuterChanged, this);

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

        this._gangsterComingTipView.active = false;
    }

    //------------------------------------------------- action
    private async onTapNewSettlementTip() {
        GameMusicPlayMgr.playTapButtonEffect();
        const currentData = localStorage.getItem("local_newSettle");
        if (currentData != null) {
            NetworkMgr.websocketMsg.get_user_settlement_info({});
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
        GameMusicPlayMgr.playTapButtonEffect();
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
    private onTapTest() {
        GameMusicPlayMgr.playTapButtonEffect();
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
            NetworkMgr.websocketMsg.player_pioneer_change_show({
                pioneerId: randomId,
                show: true,
            });
        }
    }
    private onTapRefreshMap() {
        GameMusicPlayMgr.playTapButtonEffect();
        NetworkMgr.websocketMsg.reborn_all();
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
        const isOuter: boolean = GameMainHelper.instance.isGameShowOuter;
        this.node.getChildByPath("btnBuild").active = !isOuter;
    }

    private _onPlayerLvlupChanged(): void {
        const currentLevel: number = DataMgr.s.userInfo.data.level;
        let gap: number = 4;
        if (currentLevel % gap == 0) {
            NetworkMgr.websocketMsg.get_user_settlement_info({});
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
