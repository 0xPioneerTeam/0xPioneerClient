import { _decorator, Button, Component, Label, Node, ProgressBar, RichText, sp, Sprite, SpriteFrame, v2, v3, Vec2, Widget } from "cc";
import CommonTools from "db://assets/Script/Tool/CommonTools";
import { LanMgr } from "../Utils/Global";
import { UIName } from "../Const/ConstUIDefine";
import { LootsPopup } from "./LootsPopup";
import GameMainHelper from "../Game/Helper/GameMainHelper";
import UIPanelManger from "../Basic/UIPanelMgr";
import { DataMgr } from "../Data/DataMgr";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
import { share } from "../Net/msg/WebsocketMsg";
import { BattleReportDetailUI } from "./BattleReportDetailUI";
import { MapCharacter } from "../Game/Outer/View/MapCharacter";
import ItemData from "../Model/ItemData";
import ArtifactData from "../Model/ArtifactData";
import { NetworkMgr } from "../Net/NetworkMgr";
import { rank_season_type, rank_type } from "../Const/rank_define";
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
    private _loots: (share.Iitem_data | share.Iartifact_info_data)[] = null;

    private _report: share.Inew_battle_report_data = null;
    public get report() {
        return this._report;
    }

    protected onLoad() {}

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
            case share.Inew_battle_report_type.task:
                this._initWithTaskReport(report);
                break;
            case share.Inew_battle_report_type.explore:
                this._initWithExploreReport(report);
                break;
            case share.Inew_battle_report_type.rank:
                this._initWithRankReport(report);
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

        this._loots = [...report.fight.winArtifacts, ...report.fight.winItems];
        if (this._loots.length > 0) {
            this.lootsButton.node.active = true;
            if (report.getted) {
                this.lootsButton.node.getChildByPath("Label").getComponent(Label).string = "Spoils of war";
                this.lootsButton.getComponent(Button).clickEvents[0].customEventData = "loots";
            } else {
                this.lootsButton.node.getChildByPath("Label").getComponent(Label).string = "Claim Spoils";
                this.lootsButton.getComponent(Button).clickEvents[0].customEventData = "recivie|" + report.id;
            }
        } else {
            this.lootsButton.node.active = false;
        }
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

        this._loots = [...report.mining.rewards];
        if (this._loots.length > 0) {
            this.lootsButton.node.active = true;
            if (report.getted) {
                this.lootsButton.node.getChildByPath("Label").getComponent(Label).string = "Spoils of war";
                this.lootsButton.getComponent(Button).clickEvents[0].customEventData = "loots";
            } else {
                this.lootsButton.node.getChildByPath("Label").getComponent(Label).string = "Claim Spoils";
                this.lootsButton.getComponent(Button).clickEvents[0].customEventData = "recivie|" + report.id;
            }
        } else {
            this.lootsButton.node.active = false;
        }
    }

    private _initWithTaskReport(report: share.Inew_battle_report_data): void {
        const data = report.task;

        this.node.getChildByPath("name").getComponent(Label).string = LanMgr.getLanById(data.name);
        this.node.getChildByPath("description").getComponent(RichText).string = LanMgr.getLanById(data.description);

        const progressView = this.node.getChildByPath("ProgressView");
        progressView.getChildByPath("Progress").getComponent(Label).string = data.progress + "/" + data.total;

        this._loots = [...report.task.rewards];
        if (this._loots.length > 0) {
            this.lootsButton.node.active = true;
            if (report.getted) {
                this.lootsButton.node.getChildByPath("Label").getComponent(Label).string = "Spoils of war";
                this.lootsButton.getComponent(Button).clickEvents[0].customEventData = "loots";
            } else {
                this.lootsButton.node.getChildByPath("Label").getComponent(Label).string = "Claim Spoils";
                this.lootsButton.getComponent(Button).clickEvents[0].customEventData = "recivie|" + report.id;
            }
            progressView.setPosition(v3(progressView.position.x, 9, 0));
        } else {
            this.lootsButton.node.active = false;
            progressView.setPosition(v3(progressView.position.x, -17, 0));
        }
    }

    private _initWithExploreReport(report: share.Inew_battle_report_data): void {
        const data = report.explore;

        let pioneerInfo = DataMgr.s.pioneer.getById(data.pioneerUniqueId);
        const roleName = LanMgr.getLanById(pioneerInfo.name);
        const layers = data.layers;

        this.node.getChildByPath("BgAvatar/RoleView").getComponent(MapCharacter).refreshUI(pioneerInfo.animType);
        this.leftNameLabel.string = roleName;

        this._locationInfo = data.location != null ? v2(data.location.x, data.location.y) : null;
        if (data.location != null) {
            this.eventLocationLabel.string = this._locationString(this._locationInfo);
        } else {
            this.eventLocationLabel.string = "";
        }

        this.timeElapsedLabel.string = "Explore layers: " + layers;

        this.node.getChildByPath("ResultWin").active = data.isWin;
        this.node.getChildByPath("ResultFail").active = !data.isWin;

        this._loots = [...report.explore.rewards];
        if (this._loots.length > 0) {
            this.lootsButton.node.active = true;
            this.lootsButton.node.getChildByPath("Label").getComponent(Label).string = "Spoils of war";
            this.lootsButton.getComponent(Button).clickEvents[0].customEventData = "loots";
        } else {
            this.lootsButton.node.active = false;
        }
    }

    private _initWithRankReport(report: share.Inew_battle_report_data): void {
        const data = report.rank;
        // name
        this.node.getChildByPath("name").getComponent(Label).string = DataMgr.s.userInfo.data.name;
        // score
        let scoreTitle = "";
        if (data.rankType == rank_type.explore) {
            scoreTitle = "Explore";
        } else if (data.rankType == rank_type.fight) {
            scoreTitle = "BattlePower";
        } else if (data.rankType == rank_type.psyc) {
            scoreTitle = "PSYC";
        }
        this.node.getChildByPath("score").getComponent(Label).string = scoreTitle + ": " + data.score;
        // season title
        let seasonTitle = "";
        if (data.seasonType == rank_season_type.daily) {
            seasonTitle = "Daily";
        } else if (data.seasonType == rank_season_type.monthly) {
            seasonTitle = "Monthly";
        } else if (data.seasonType == rank_season_type.season) {
            seasonTitle = "Season";
        }
        this.node.getChildByPath("Rank/Title").getComponent(Label).string = seasonTitle;
        // rank
        this.node.getChildByPath("Rank/Value").getComponent(Label).string = data.rank.toString();

        this._loots = [...report.rank.rewards];
        if (this._loots.length > 0) {
            this.lootsButton.node.active = true;
            if (report.getted) {
                this.lootsButton.node.getChildByPath("Label").getComponent(Label).string = "Spoils of war";
                this.lootsButton.getComponent(Button).clickEvents[0].customEventData = "loots";
            } else {
                this.lootsButton.node.getChildByPath("Label").getComponent(Label).string = "Claim Spoils";
                this.lootsButton.getComponent(Button).clickEvents[0].customEventData = "recivie|" + report.id;
            }
        } else {
            this.lootsButton.node.active = false;
        }
    } 

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

    private async onClickLoots(event: Event, customEvnetData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        if (customEvnetData == "loots") {
            if (this._loots.length <= 0) {
                return;
            }
            const result = await UIPanelManger.inst.pushPanel(UIName.LootsPopup);
            if (result.success) {
                result.node.getComponent(LootsPopup).showItems(this._loots);
            }
        } else if (customEvnetData.includes("recivie")) {
            const split = customEvnetData.split("|");
            if (split.length != 2) {
                return;
            }
            const id = split[1];
            NetworkMgr.websocketMsg.receive_new_battle_report_reward({
                id: parseInt(id),
            });
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
