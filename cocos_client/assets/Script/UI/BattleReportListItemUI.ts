import { _decorator, Button, Component, Label, Node, ProgressBar, RichText, Sprite, SpriteFrame } from "cc";
import CommonTools from "db://assets/Script/Tool/CommonTools";
import { BattleReportData, BattleReportExploringData, BattleReportType, LocationInfo } from "../Const/BattleReport";
import { LanMgr } from "../Utils/Global";
import { UIName } from "../Const/ConstUIDefine";
import { LootsPopup } from "./LootsPopup";
import { UIHUDController } from "./UIHUDController";
import EventConfig from "../Config/EventConfig";
import GameMainHelper from "../Game/Helper/GameMainHelper";
import UIPanelManger from "../Basic/UIPanelMgr";
import { DataMgr } from "../Data/DataMgr";
import { FIGHT_FINISHED_DATA, MINING_FINISHED_DATA } from "../Const/PioneerDefine";
import { EventUI } from "./Outer/EventUI";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";

const { ccclass, property } = _decorator;

@ccclass("BattleReportListItemUI")
export class BattleReportListItemUI extends Component {
    @property({ type: Label, group: "Common" })
    public leftNameLabel: Label = null;

    @property({ type: Sprite, group: "Common" })
    public leftAvatarIconSprite: Sprite = null;

    @property({ type: ProgressBar, group: "Fight" })
    public leftHpBar: ProgressBar = null;

    @property({ type: Label, group: "Fight" })
    public leftHpText: Label = null;

    @property({ type: Sprite, group: "Fight" })
    public leftAttackerOrDefenderSign: Sprite = null;

    @property({ type: Label, group: "Fight" })
    public rightNameLabel: Label = null;

    @property({ type: Sprite, group: "Fight" })
    public rightAvatarIconSprite: Sprite = null;

    @property({ type: ProgressBar, group: "Fight" })
    public rightHpBar: ProgressBar = null;

    @property({ type: Label, group: "Fight" })
    public rightHpText: Label = null;

    @property({ type: Sprite, group: "Fight" })
    public rightAttackerOrDefenderSign: Sprite = null;

    @property({ type: SpriteFrame, group: "Fight" })
    public attackerSign: SpriteFrame = null;

    @property({ type: SpriteFrame, group: "Fight" })
    public defenderSign: SpriteFrame = null;

    @property({ type: Label, group: "Common" })
    public eventTimeLabel: Label = null;

    @property({ type: Label, group: "Common" })
    public eventResultLabel: Label = null;

    @property({ type: Sprite, group: "Fight" })
    public fightResultSprite: Sprite = null;

    @property({ type: SpriteFrame, group: "Fight" })
    public fightResultVictory: SpriteFrame = null;

    @property({ type: SpriteFrame, group: "Fight" })
    public fightResultDefeat: SpriteFrame = null;

    @property({ type: RichText, group: "Common" })
    public eventLocationLabel: RichText = null;

    @property({ type: RichText, group: "Mining" })
    public timeElapsedLabel: RichText = null;

    @property({ type: RichText, group: "Mining" })
    public miningResultLabel: RichText = null;

    @property({ type: Node, group: "Common" })
    public pendingMark: Node = null;

    @property({ type: Button, group: "Common" })
    public lootsButton: Button = null;

    @property({ type: Button, group: "Explore" })
    public branchSelectionButton: Button = null;

    private _locationInfo: LocationInfo = null;
    private _loots: { id: string; num: number }[] = null;

    private _report: BattleReportData = null;
    public get report() {
        return this._report;
    }

    protected onLoad() {
        if (this.lootsButton) this.lootsButton.node.on(Button.EventType.CLICK, this.onClickLoots, this);
    }

    public initWithReportData(report: BattleReportData): void {
        this._report = report;
        if (this.pendingMark) {
            this.pendingMark.active = DataMgr.s.battleReport.isReportPending(report);
        }

        switch (report.type) {
            case BattleReportType.Fight:
                this._initWithFightReport(report);
                break;
            case BattleReportType.Mining:
                this._initWithMiningReport(report);
                break;
            case BattleReportType.Exploring:
                this._initWithExploreReport(report);
                break;
            default:
                console.error(`Unknown report type ${report.type}. ${JSON.stringify(report)}`);
                break;
        }
    }

    private _initWithFightReport(report: BattleReportData): void {
        const data = report.data as FIGHT_FINISHED_DATA;
        const selfRoleInfo = data.attackerIsSelf ? data.attacker : data.defender;
        this.leftNameLabel.string =
            LanMgr.getLanById(selfRoleInfo.name).indexOf("LanguageErr") == -1 ? LanMgr.getLanById(selfRoleInfo.name) : selfRoleInfo.name;
        this.leftHpBar.progress = selfRoleInfo.hp / selfRoleInfo.hpMax;
        this.leftHpText.string = `${selfRoleInfo.hp} / ${selfRoleInfo.hpMax}`;
        this.leftAttackerOrDefenderSign.spriteFrame = data.attackerIsSelf ? this.attackerSign : this.defenderSign;

        const enemyRoleInfo = !data.attackerIsSelf ? data.attacker : data.defender;
        this.rightNameLabel.string =
            LanMgr.getLanById(enemyRoleInfo.name).indexOf("LanguageErr") == -1 ? LanMgr.getLanById(enemyRoleInfo.name) : enemyRoleInfo.name;
        this.rightHpBar.progress = enemyRoleInfo.hp / enemyRoleInfo.hpMax;
        this.rightHpText.string = `${enemyRoleInfo.hp} / ${enemyRoleInfo.hpMax}`;
        this.rightAttackerOrDefenderSign.spriteFrame = !data.attackerIsSelf ? this.attackerSign : this.defenderSign;

        const selfWin = selfRoleInfo.hp != 0;
        this.fightResultSprite.spriteFrame = selfWin ? this.fightResultVictory : this.fightResultDefeat;
        this.eventTimeLabel.string = CommonTools.formatDateTime(report.timestamp);

        this._locationInfo = { type: "pos", pos: data.position };
        if (data.position != null) {
            this.eventLocationLabel.string = this._locationString(this._locationInfo);
        } else {
            this.eventLocationLabel.string = "";
        }

        this._loots = data.rewards;
        this.lootsButton.node.active = data.rewards.length != 0;
    }

    private _initWithMiningReport(report: BattleReportData): void {
        let buildingInfo = DataMgr.s.mapBuilding.getBuildingById(report.data.buildingId);

        report.data = report.data as MINING_FINISHED_DATA;

        let pioneerInfo = DataMgr.s.pioneer.getById(report.data.pioneerId);

        const roleName = LanMgr.getLanById(pioneerInfo.name);
        const duration = report.data.duration; // in milliseconds
        const rewards = report.data.rewards;

        this.leftNameLabel.string = roleName;

        this._locationInfo = { type: "building", buildingId: buildingInfo.id };
        this.eventLocationLabel.string = this._locationString(this._locationInfo);

        this.timeElapsedLabel.string = LanMgr.replaceLanById("701003", [CommonTools.formatSeconds(Math.floor(duration / 1000))]);

        this.eventTimeLabel.string = CommonTools.formatDateTime(report.timestamp);
        this.miningResultLabel.string = LanMgr.replaceLanById("701001", ["100"]);

        this._loots = rewards;
        this.lootsButton.node.active = rewards.length != 0;
    }

    private _initWithExploreReport(report: BattleReportData): void {
        let buildingInfo = DataMgr.s.mapBuilding.getBuildingById(report.data.buildingId);

        report.data = report.data as BattleReportExploringData;

        let pioneerInfo = DataMgr.s.pioneer.getById(report.data.pioneerId);

        const roleName = LanMgr.getLanById(pioneerInfo == null ? "" : pioneerInfo.name);
        const rewards = report.data.rewards;

        this.leftNameLabel.string = roleName;
        this._locationInfo = { type: "building", buildingId: buildingInfo.id };
        this.eventLocationLabel.string = this._locationString(this._locationInfo);

        this.eventTimeLabel.string = CommonTools.formatDateTime(report.timestamp);

        if (report.data.hasNextStep && !report.data.nextStepFinished) {
            this.eventResultLabel.node.active = false;
            this.branchSelectionButton.node.active = true;
            this.branchSelectionButton.node.on(Button.EventType.CLICK, this.onClickBranchSelection, this);
        } else {
            this.eventResultLabel.node.active = true;
            this.branchSelectionButton.node.active = false;
        }

        this._loots = rewards;
        this.lootsButton.node.active = rewards && rewards.length != 0;
    }

    private onClickLocation() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (!this._locationInfo) {
            console.error("BattleReportListItemUI._locationInfo empty");
            return;
        }

        let pos: { x: number; y: number };
        switch (this._locationInfo.type) {
            case "pos":
                pos = this._locationInfo.pos;
                break;
            case "building":
                let building = DataMgr.s.mapBuilding.getBuildingById(this._locationInfo.buildingId);
                pos = building.stayMapPositions[0];
                break;
            default:
                console.error(`Unknown _locationInfo.type: ${this._locationInfo.type}`);
                return;
        }
        UIPanelManger.inst.popPanelByName(UIName.BattleReportUI);
        GameMainHelper.instance.changeGameCameraWorldPosition(GameMainHelper.instance.tiledMapGetPosWorld(pos.x, pos.y), true);
    }

    private async onClickLoots() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (!this._loots) {
            console.error("BattleReportListItemUI._loots empty");
            return;
        }
        const result = await UIPanelManger.inst.pushPanel(UIName.LootsPopup);
        if (result.success) {
            result.node.getComponent(LootsPopup).showItems(this._loots);
        }
    }

    async onClickBranchSelection() {
        GameMusicPlayMgr.playTapButtonEffect();
        const reportData = this.report.data as BattleReportExploringData;

        const building = DataMgr.s.mapBuilding.getBuildingById(reportData.buildingId);
        const pioneer = DataMgr.s.pioneer.getById(reportData.pioneerId);

        if (pioneer.actionEndTimeStamp > new Date().getTime()) {
            UIHUDController.showCenterTip(LanMgr.getLanById("203005"));
            return;
        }

        const currentEvent = EventConfig.getById(building.eventId);
        if (currentEvent == null) {
            UIHUDController.showCenterTip("Error");
            return;
        }
        UIPanelManger.inst.popPanelByName(UIName.BattleReportUI);
        const result = await UIPanelManger.inst.pushPanel(UIName.BrachEventUI);
        if (result.success) {
            result.node.getComponent(EventUI).eventUIShow(reportData.pioneerId, reportData.buildingId, currentEvent);
        }
    }

    private _locationString(locationInfo: LocationInfo): string {
        if (locationInfo.type === "building") {
            const building = DataMgr.s.mapBuilding.getBuildingById(locationInfo.buildingId);
            return `${LanMgr.getLanById(building.name)} <color=#a1cb7f>${CommonTools.formatMapPosition(building.stayMapPositions[0])}</color>`;
        } else {
            return `${LanMgr.getLanById("701002")} <color=#a1cb7f>${CommonTools.formatMapPosition(locationInfo.pos)}</color>`;
        }
    }
}
