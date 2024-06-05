import { _decorator, Label, Node, Button, instantiate } from "cc";
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
import { NetworkMgr } from "../Net/NetworkMgr";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("NFTInfoUI")
export class NFTInfoUI extends ViewController {
    public async showItem(index: number = 0) {
        this._currentIndex = index;
        this._refreshUI();
    }

    private _currentIndex: number = 0;
    private _NFTDatas: NFTPioneerObject[] = [];

    private _skillContent: Node = null;
    private _skillItem: Node = null;
    private _skillGapItem: Node = null;
    private _skillAddItem: Node = null;
    private _skillAllItems: Node[] = [];
    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._currentIndex = 0;

        this._skillContent = this.node.getChildByPath("__ViewContent/Skill/Content");
        this._skillItem = this._skillContent.getChildByPath("SkillItem");
        this._skillItem.removeFromParent();
        this._skillGapItem = this._skillContent.getChildByPath("GapItem");
        this._skillGapItem.removeFromParent();
        this._skillAddItem = this._skillContent.getChildByPath("AddItem");
        this._skillAddItem.removeFromParent();

        NotificationMgr.addListener(NotificationName.NFT_LEVEL_UP, this._refreshUI, this);
        NotificationMgr.addListener(NotificationName.NFT_RANK_UP, this._refreshUI, this);
        NotificationMgr.addListener(NotificationName.NFT_LEARN_SKILL, this._refreshUI, this);
        NotificationMgr.addListener(NotificationName.NFT_FORGET_SKILL, this._refreshUI, this);
    }
    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.NFT_LEVEL_UP, this._refreshUI, this);
        NotificationMgr.removeListener(NotificationName.NFT_RANK_UP, this._refreshUI, this);
        NotificationMgr.removeListener(NotificationName.NFT_LEARN_SKILL, this._refreshUI, this);
        NotificationMgr.removeListener(NotificationName.NFT_FORGET_SKILL, this._refreshUI, this);
    }
    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByName("__ViewContent");
    }

    private _refreshUI() {
        this._NFTDatas = DataMgr.s.nftPioneer.getAll();
        this._currentIndex = Math.max(0, Math.min(this._NFTDatas.length - 1, this._currentIndex));
        const data = this._NFTDatas[this._currentIndex];
        
        const currentSkillLimit: number = (ConfigConfig.getConfig(ConfigType.NFTRaritySkillLimitNum) as NFTRaritySkillLimitNumParam).limitNumMap.get(
            data.rarity
        );

        const content = this.node.getChildByPath("__ViewContent");
        // name
        content.getChildByPath("Name/Name").getComponent(Label).string = data.name;
        // base property
        // userlanMgr
        // content.getChildByPath("BaseProperty/Attack/Title").getComponent(Label).string = LanMgr.getLanById("201003");
        content.getChildByPath("BaseProperty/Attack/Value").getComponent(Label).string = data.attack.toString();

        // userlanMgr
        // content.getChildByPath("BaseProperty/Defense/Title").getComponent(Label).string = LanMgr.getLanById("201003");
        content.getChildByPath("BaseProperty/Defense/Value").getComponent(Label).string = data.defense.toString();

        // userlanMgr
        // content.getChildByPath("BaseProperty/Hp/Title").getComponent(Label).string = LanMgr.getLanById("201003");
        content.getChildByPath("BaseProperty/Hp/Value").getComponent(Label).string = data.hp.toString();

        // userlanMgr
        // content.getChildByPath("BaseProperty/Speed/Title").getComponent(Label).string = LanMgr.getLanById("201003");
        content.getChildByPath("BaseProperty/Speed/Value").getComponent(Label).string = data.speed.toString();

        // userlanMgr
        // content.getChildByPath("BaseProperty/Int/Title").getComponent(Label).string = LanMgr.getLanById("201003");
        content.getChildByPath("BaseProperty/Int/Value").getComponent(Label).string = data.iq.toString();

        // level
        content.getChildByPath("Level/Label").getComponent(Label).string = "Lv." + data.level;
        content.getChildByPath("Level/Btn").active = data.level < data.levelLimit;
        content.getChildByPath("Level/Max").active = data.level >= data.levelLimit;
        // rank
        content.getChildByPath("Rank/Label").getComponent(Label).string = "Rank. " + data.rank;
        content.getChildByPath("Rank/Btn").active = data.rank < data.rankLimit;
        content.getChildByPath("Rank/Max").active = data.rank >= data.rankLimit;


        // skill
        for (const item of this._skillAllItems) {
            item.destroy();
        }
        this._skillAllItems = [];
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
        if (data.skills.length < currentSkillLimit) {
            if (data.skills.length % 2 != 0) {
                const item = instantiate(this._skillGapItem);
                item.active = true;
                item.parent = this._skillContent;
                this._skillAllItems.push(item);
            }
            const addItem = instantiate(this._skillAddItem);
            addItem.active = true;
            addItem.parent = this._skillContent;
            this._skillAllItems.push(addItem);
        }

        // action button
        content.getChildByPath("LeftArrowButton").active = this._currentIndex > 0;
        content.getChildByPath("RightArrowButton").active = this._currentIndex < this._NFTDatas.length - 1;
    }
    //---------------------------------------------------- action
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }

    private onTapShowLast() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._currentIndex > 0) {
            this._currentIndex -= 1;
        }
        this._refreshUI();
    }
    private onTapShowNext() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._currentIndex < this._NFTDatas.length - 1) {
            this._currentIndex += 1;
        }
        this._refreshUI();
    }

    private async onTapLevelUp() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._NFTDatas != null && this._currentIndex >= 0 && this._currentIndex < this._NFTDatas.length) {
            const result = await UIPanelManger.inst.pushPanel(UIName.NFTLevelUpUI);
            if (result.success) {
                result.node.getComponent(NTFLevelUpUI).showUI(this._NFTDatas[this._currentIndex]);
            }
        }
    }
    private async onTapRankUp() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._NFTDatas != null && this._currentIndex >= 0 && this._currentIndex < this._NFTDatas.length) {
            const result = await UIPanelManger.inst.pushPanel(UIName.NFTRankUpUI);
            if (result.success) {
                result.node.getComponent(NTFRankUpUI).showUI(this._NFTDatas[this._currentIndex]);
            }
        }
    }
    private async onTapSkill(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const data = this._NFTDatas[this._currentIndex];
        const index = parseInt(customEventData);
        const result = await UIPanelManger.inst.pushPanel(UIName.NFTSkillDetailUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(NFTSkillDetailUI).showItem(this._skillAllItems[index].worldPosition, data, index);
    }
    private async onTapAddSkill() {
        GameMusicPlayMgr.playTapButtonEffect();
        const data = this._NFTDatas[this._currentIndex];
        const result = await UIPanelManger.inst.pushPanel(UIName.NFTSkillLearnUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(NFTSkillLearnUI).showItem(data);
    }
}
