import { _decorator, Label, Node, Button, instantiate, Vec2, v2 } from "cc";
import ViewController from "../BasicView/ViewController";
import { NFTPioneerObject } from "../Const/NFTPioneerDefine";
import { LanMgr } from "../Utils/Global";
import UIPanelManger from "../Basic/UIPanelMgr";
import { UIName } from "../Const/ConstUIDefine";
import { NTFLevelUpUI } from "./NTFLevelUpUI";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import { NTFRankUpUI } from "./NTFRankUpUI";
import ConfigConfig from "../Config/ConfigConfig";
import { ConfigType, NFTRankLimitNumParam, NFTRaritySkillLimitNumParam } from "../Const/Config";
import NFTSkillConfig from "../Config/NFTSkillConfig";
import { NFTSkillDetailUI } from "./NFTSkillDetailUI";
import { NFTSkillLearnUI } from "./NFTSkillLearnUI";
import { DataMgr } from "../Data/DataMgr";
import CommonTools from "../Tool/CommonTools";
import GameMainHelper from "../Game/Helper/GameMainHelper";
const { ccclass, property } = _decorator;

@ccclass("NFTViewInfoUI")
export class NFTViewInfoUI extends ViewController {
    private _buildingId: string = null;
    private _tavernStayPos: Vec2[] = null;
    private _NFTData: NFTPioneerObject = null;
    private _nextEightTimeStamp: number = 0;

    private _skillContent: Node = null;
    private _skillItem: Node = null;
    private _skillAllItems: Node[] = [];

    public async showItem(buildingId: string, tavernStayPos: Vec2[], nft: NFTPioneerObject) {
        this._buildingId = buildingId;
        this._tavernStayPos = tavernStayPos;
        this._NFTData = nft;
        this._refreshUI();
    }

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._nextEightTimeStamp = CommonTools.getNextDayAMTimestamp(8);

        this._skillContent = this.node.getChildByPath("__ViewContent/Skill/Content");
        this._skillItem = this._skillContent.getChildByPath("SkillItem");
        this._skillItem.removeFromParent();
    }
    protected viewDidStart(): void {
        super.viewDidStart();

        this._countdown();
        this.schedule(() => {
            this._countdown();
        }, 1);
    }
    protected viewDidDestroy(): void {
        super.viewDidDestroy();
    }
    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByName("__ViewContent");
    }

    private _refreshUI() {
        if (this._NFTData == null) {
            return;
        }
        const data = this._NFTData;
        const content = this.node.getChildByPath("__ViewContent");
        // name
        content.getChildByPath("Name/Name").getComponent(Label).string = data.name;
        // base property
        // userlanMgr
        // content.getChildByPath("BaseProperty/Attack/Title").getComponent(Label).string = LanMgr.getLanById("201003");
        content.getChildByPath("BaseProperty/Attack/Value").getComponent(Label).string = data.attack.toString() + "(" + data.attackGrowValue + ")";

        // userlanMgr
        // content.getChildByPath("BaseProperty/Defense/Title").getComponent(Label).string = LanMgr.getLanById("201003");
        content.getChildByPath("BaseProperty/Defense/Value").getComponent(Label).string = data.defense.toString() + "(" + data.defenseGrowValue + ")";

        // userlanMgr
        // content.getChildByPath("BaseProperty/Hp/Title").getComponent(Label).string = LanMgr.getLanById("201003");
        content.getChildByPath("BaseProperty/Hp/Value").getComponent(Label).string = data.hp.toString() + "(" + data.hpGrowValue + ")";

        // userlanMgr
        // content.getChildByPath("BaseProperty/Speed/Title").getComponent(Label).string = LanMgr.getLanById("201003");
        content.getChildByPath("BaseProperty/Speed/Value").getComponent(Label).string = data.speed.toString() + "(" + data.speedGrowValue + ")";

        // userlanMgr
        // content.getChildByPath("BaseProperty/Int/Title").getComponent(Label).string = LanMgr.getLanById("201003");
        content.getChildByPath("BaseProperty/Int/Value").getComponent(Label).string = data.iq.toString() + "(" + data.iqGrowValue + ")";

        // skill
        for (let i = 0; i < data.skills.length; i++) {
            const skillConfig = NFTSkillConfig.getById(data.skills[i].id);
            if (skillConfig == null) {
                continue;
            }
            const item = instantiate(this._skillItem);
            item.active = true;
            item.parent = this._skillContent;
            item.getChildByPath("item").getComponent(Label).string = LanMgr.getLanById(skillConfig.name);
            for (let j = 1; j <= 5; j++) {
                item.getChildByPath("Level" + j).active = skillConfig.rank == j;
            }
            item.getComponent(Button).clickEvents[0].customEventData = i.toString();

            this._skillAllItems.push(item);
        }
    }
    private _countdown() {
        const currentTimeStamp: number = new Date().getTime();

        const gapTime: number = Math.max(0, this._nextEightTimeStamp - currentTimeStamp);
        this.node.getChildByPath("__ViewContent/Countdown").getComponent(Label).string =
            "this pioneer will leave after " + CommonTools.formatSeconds(gapTime / 1000);
    }
    //---------------------------------------------------- action
    private async onTapClose() {
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel();
    }
    private async onTapSkill(event: Event, customEventData: string) {
        if (this._NFTData == null) {
            return;
        }
        const data = this._NFTData;
        const index = parseInt(customEventData);
        const result = await UIPanelManger.inst.pushPanel(UIName.NFTSkillDetailUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(NFTSkillDetailUI).showItem(this._skillAllItems[index].worldPosition, data, index);
    }
    private async onTapRecruit() {
        if (this._buildingId == null || this._tavernStayPos == null || this._NFTData == null) {
            return;
        }
        const aroundPositons = GameMainHelper.instance.tiledMapGetExtAround(this._tavernStayPos[0], 3);
        for (let i = 0; i < aroundPositons.length; i++) {
            let isExsit: boolean = false;
            for (const pos of this._tavernStayPos) {
                if (aroundPositons[i].x === pos.x && aroundPositons[i].y === pos.y) {
                    isExsit = true;
                    break;
                }
            }
            if (isExsit) {
                aroundPositons.splice(i, 1);
                i--;
            }
        }
        const generatePos = CommonTools.getRandomItem(aroundPositons);
        DataMgr.s.pioneer.createNFTPlayer(this._NFTData, v2(generatePos.x, generatePos.y));
        DataMgr.s.mapBuilding.changeBuildingNewNft(this._buildingId, null);
        // save get time
        DataMgr.s.userInfo.data.tavernGetPioneerTimestamp = new Date().getTime();
        DataMgr.s.userInfo.saveObj();
        // pop panel
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel();
    }
}
