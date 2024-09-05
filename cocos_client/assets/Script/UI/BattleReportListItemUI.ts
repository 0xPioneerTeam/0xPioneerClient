import { _decorator, Button, Component, Label, Node, ProgressBar, RichText, Sprite, SpriteFrame, v2, v3, Vec2, Widget } from "cc";
import CommonTools from "db://assets/Script/Tool/CommonTools";
import { LanMgr } from "../Utils/Global";
import { UIName } from "../Const/ConstUIDefine";
import { LootsPopup } from "./LootsPopup";
import GameMainHelper from "../Game/Helper/GameMainHelper";
import UIPanelManger from "../Basic/UIPanelMgr";
import { DataMgr } from "../Data/DataMgr";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
import { share } from "../Net/msg/WebsocketMsg";
import { BattleReportDetailUI } from "./BattleReportDetailUI"
import { MapCharacter } from "../Game/Outer/View/MapCharacter";
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

    private _locationInfo: Vec2 = null;
    private _loots: { id: string; num: number }[] = null;

    private _report: share.Inew_battle_report_data = null;
    public get report() {
        return this._report;
    }

    protected onLoad() {
        if (this.lootsButton) this.lootsButton.node.on(Button.EventType.CLICK, this.onClickLoots, this);
    }

    public initWithReportData(report: share.Inew_battle_report_data): void {
        this._report = report;
        if (this.pendingMark) {
            this.pendingMark.active = false;
        }
        switch (report.type) {
            case share.Inew_battle_report_type.fight:
                this._initWithFightReport(report);
                break;
            case share.Inew_battle_report_type.mining:
                this._initWithMiningReport(report);
                break;
            default:
                console.error(`Unknown report type ${report.type}. ${JSON.stringify(report)}`);
                break;
        }
    }

    private _initWithFightReport(report: share.Inew_battle_report_data): void {
        const data = report.fight;
        const selfRoleInfo = data.selfIsAttacker ? data.attacker : data.defender;
        const enemyRoleInfo = data.selfIsAttacker ? data.defender : data.attacker;
        const selfIsWin: boolean = (data.selfIsAttacker && data.attackerWin) || (!data.selfIsAttacker && !data.attackerWin);

        this.node.getChildByPath("BgAvatar/RoleView").getComponent(MapCharacter).refreshUI(selfRoleInfo.avatar);
        this.leftNameLabel.string = selfRoleInfo.nameUseLan ? LanMgr.getLanById(selfRoleInfo.name) : selfRoleInfo.name;
        this.leftHpBar.progress = selfRoleInfo.hp / selfRoleInfo.hpmax;
        this.leftHpText.string = `${selfRoleInfo.hp} / ${selfRoleInfo.hpmax}`;
        this.leftAttackerOrDefenderSign.spriteFrame = data.selfIsAttacker ? this.attackerSign : this.defenderSign;

        this.node.getChildByPath("BgAvatar-001/RoleView").getComponent(MapCharacter).refreshUI(enemyRoleInfo.avatar);
        this.rightNameLabel.string = enemyRoleInfo.nameUseLan ? LanMgr.getLanById(enemyRoleInfo.name) : enemyRoleInfo.name;
        this.rightHpBar.progress = enemyRoleInfo.hp / enemyRoleInfo.hpmax;
        this.rightHpText.string = `${enemyRoleInfo.hp} / ${enemyRoleInfo.hpmax}`;
        this.rightAttackerOrDefenderSign.spriteFrame = data.selfIsAttacker ? this.defenderSign : this.attackerSign;

        this.fightResultSprite.spriteFrame = selfIsWin ? this.fightResultVictory : this.fightResultDefeat;
        this.eventTimeLabel.string = CommonTools.formatDateTime(report.timestamp * 1000);

        this._locationInfo = data.location != null ? v2(data.location.x, data.location.y) : null;
        if (data.location != null) {
            this.eventLocationLabel.string = this._locationString(this._locationInfo);
        } else {
            this.eventLocationLabel.string = "";
        }
        this._loots = [];
        for (const item of data.winItems) {
            this._loots.push({
                id: item.itemConfigId,
                num: item.count,
            });
        }
        this.lootsButton.node.active = this._loots.length > 0;
    }

    private _initWithMiningReport(report: share.Inew_battle_report_data): void {
        const data = report.mining;

        let pioneerInfo = DataMgr.s.pioneer.getById(data.pioneerUniqueId);
        const roleName = LanMgr.getLanById(pioneerInfo.name);
        const duration = data.duration;

        this.node.getChildByPath("BgAvatar/RoleView").getComponent(MapCharacter).refreshUI(pioneerInfo.animType);
        this.leftNameLabel.string = roleName;

        this._locationInfo = data.location != null ? v2(data.location.x, data.location.y) : null;
        if (data.location != null) {
            this.eventLocationLabel.string = this._locationString(this._locationInfo);
        } else {
            this.eventLocationLabel.string = "";
        }

        this.timeElapsedLabel.string = LanMgr.replaceLanById("701003", [CommonTools.formatSeconds(duration)]);

        this.eventTimeLabel.string = CommonTools.formatDateTime(report.timestamp * 1000);
        this.miningResultLabel.string = LanMgr.replaceLanById("701001", ["100"]);

        this._loots = [];
        for (const item of data.rewards) {
            this._loots.push({
                id: item.itemConfigId,
                num: item.count,
            });
        }
        this.lootsButton.node.active = this._loots.length > 0;
    }

    // private _initWithExploreReport(report): void {
    //     let buildingInfo = DataMgr.s.mapBuilding.getBuildingById(report.data.buildingId);

    //     let pioneerInfo = DataMgr.s.pioneer.getById(report.data.pioneerId);

    //     const roleName = LanMgr.getLanById(pioneerInfo == null ? "" : pioneerInfo.name);
    //     const rewards = report.data.rewards;

    //     for (const child of this.node.getChildByPath("BgAvatar").children) {
    //         child.active = child.name == pioneerInfo.id;
    //     }
    //     this.leftNameLabel.string = roleName;
    //     this._locationInfo = { type: "building", buildingId: buildingInfo.id };
    //     this.eventLocationLabel.string = this._locationString(this._locationInfo);

    //     this.eventTimeLabel.string = CommonTools.formatDateTime(report.timestamp);

    //     if (report.data.hasNextStep && !report.data.nextStepFinished) {
    //         this.eventResultLabel.node.active = false;
    //         this.branchSelectionButton.node.active = true;
    //         this.branchSelectionButton.node.on(Button.EventType.CLICK, this.onClickBranchSelection, this);
    //     } else {
    //         this.eventResultLabel.node.active = true;
    //         this.branchSelectionButton.node.active = false;
    //     }

    //     this._loots = rewards;
    //     this.lootsButton.node.active = rewards && rewards.length != 0;
    // }

    private onClickLocation() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (!this._locationInfo) {
            console.error("BattleReportListItemUI._locationInfo empty");
            return;
        }

        let pos: Vec2 = this._locationInfo;
        if (pos == null) {
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

    private async onClickReport() {
        GameMusicPlayMgr.playTapButtonEffect();
        const result = await UIPanelManger.inst.pushPanel(UIName.BattleReportDetailUI);
        await result.node.getComponent(BattleReportDetailUI).refreshUI(this._report.fight);
    }

    private _locationString(locationInfo: Vec2): string {
        return `${LanMgr.getLanById("701002")} <color=#a1cb7f>${CommonTools.formatMapPosition({ x: locationInfo.x, y: locationInfo.y })}</color>`;
    }
}
