import { _decorator, Label, Node, Button, instantiate, Sprite, SpriteFrame, Color } from "cc";
import ViewController from "../BasicView/ViewController";
import { NFTPioneerObject } from "../Const/NFTPioneerDefine";
import { GameMgr, ItemMgr, LanMgr } from "../Utils/Global";
import UIPanelManger from "../Basic/UIPanelMgr";
import { UIName } from "../Const/ConstUIDefine";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import ConfigConfig from "../Config/ConfigConfig";
import { ConfigType, NFTRankLimitNumParam, NFTRaritySkillLimitNumParam } from "../Const/Config";
import NFTSkillConfig from "../Config/NFTSkillConfig";
import NFTSkillEffectConfig from "../Config/NFTSkillEffectConfig";
import { DataMgr } from "../Data/DataMgr";
import { NetworkMgr } from "../Net/NetworkMgr";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
import { GameRankColor, ResourceCorrespondingItem } from "../Const/ConstDefine";
import PioneerLvlupConfig from "../Config/PioneerLvlupConfig";
import ItemConfig from "../Config/ItemConfig";
import { RedPointView } from "./View/RedPointView";

const { ccclass, property } = _decorator;

//TODO:temp rarity name,need to be replace later
const rarityName = ["Common", "Rare", "Elite", "Hero", "Legend", "Epic"];
@ccclass("NFTInfoUI")
export class NFTInfoUI extends ViewController {
    @property({ type: SpriteFrame, tooltip: "enbale" })
    private tab_enable: SpriteFrame = null;

    @property({ type: SpriteFrame, tooltip: "disable" })
    private tab_disable: SpriteFrame = null;

    @property({ type: SpriteFrame, tooltip: "active" })
    private btn_enable: SpriteFrame = null;

    @property({ type: SpriteFrame, tooltip: "deactive" })
    private btn_disable: SpriteFrame = null;
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

        NotificationMgr.addListener(NotificationName.ITEM_CHANGE, this._refreshUI, this);
    }
    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.NFT_LEVEL_UP, this._refreshUI, this);
        NotificationMgr.removeListener(NotificationName.NFT_RANK_UP, this._refreshUI, this);
        NotificationMgr.removeListener(NotificationName.NFT_LEARN_SKILL, this._refreshUI, this);
        NotificationMgr.removeListener(NotificationName.NFT_FORGET_SKILL, this._refreshUI, this);

        NotificationMgr.removeListener(NotificationName.ITEM_CHANGE, this._refreshUI, this);
    }
    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByName("__ViewContent");
    }

    private async _refreshUI() {
        this._NFTDatas = DataMgr.s.nftPioneer.getAll();
        this._currentIndex = Math.max(0, Math.min(this._NFTDatas.length - 1, this._currentIndex));
        const data = this._NFTDatas[this._currentIndex];

        const currentSkillLimit: number = (ConfigConfig.getConfig(ConfigType.NFTRaritySkillLimitNum) as NFTRaritySkillLimitNumParam).limitNumMap.get(
            data.rarity
        );

        const content = this.node.getChildByPath("__ViewContent");
        //TODO: this rarity has no official name,need to be replace later!!!
        content.getChildByPath("info/Type/type").getComponent(Label).string = rarityName[data.rarity];
        // name
        content.getChildByPath("info/Shadow/Name").getComponent(Label).string = data.name;
        // content
        //   .getChildByPath("Title")
        //   .getComponent(Label).string = `Pioneer - ${data.name}`;
        // level
        content.getChildByPath("info/Level/Label").getComponent(Label).string = "Lv." + data.level;
        // role
        content.getChildByPath("info/Shadow/Role").getComponent(Sprite).spriteFrame = await ItemMgr.getNFTIcon(data.skin);
        // user fight power
        content.getChildByPath("info/Name/fight_power").getComponent(Label).string = (
            Math.floor((75 * data.attack + 12 * data.hp + 100 * data.defense) * 10) / 10
        ).toString();
        content.getChildByPath("info/Type").getComponent(Sprite).color = GameRankColor[data.rarity];
        // content.getChildByPath("info/Type/type").getComponent(Label).string = rarityName[data.rarity];
        // base property
        // userlanMgr
        // content.getChildByPath("BaseProperty/Attack/Title").getComponent(Label).string = LanMgr.getLanById("201003");
        content.getChildByPath("TabLevel/content/BaseProperty/Attack/Value").getComponent(Label).string = data.attack.toString();
        content.getChildByPath("TabRank/content/BaseProperty/Attack/Value").getComponent(Label).string = data.attack.toString();
        // userlanMgr
        // content.getChildByPath("BaseProperty/Defense/Title").getComponent(Label).string = LanMgr.getLanById("201003");
        content.getChildByPath("TabLevel/content/BaseProperty/Defense/Value").getComponent(Label).string = data.defense.toString();
        content.getChildByPath("TabRank/content/BaseProperty/Defense/Value").getComponent(Label).string = data.defense.toString();
        // userlanMgr
        // content.getChildByPath("BaseProperty/Hp/Title").getComponent(Label).string = LanMgr.getLanById("201003");
        content.getChildByPath("TabLevel/content/BaseProperty/Hp/Value").getComponent(Label).string = data.hp.toString();
        content.getChildByPath("TabRank/content/BaseProperty/Hp/Value").getComponent(Label).string = data.hp.toString();
        // userlanMgr
        // content.getChildByPath("BaseProperty/Speed/Title").getComponent(Label).string = LanMgr.getLanById("201003");
        content.getChildByPath("TabLevel/content/BaseProperty/Speed/Value").getComponent(Label).string = data.speed.toString();
        content.getChildByPath("TabRank/content/BaseProperty/Speed/Value").getComponent(Label).string = data.speed.toString();
        // userlanMgr
        // content.getChildByPath("BaseProperty/Int/Title").getComponent(Label).string = LanMgr.getLanById("201003");
        content.getChildByPath("TabLevel/content/BaseProperty/Int/Value").getComponent(Label).string = data.iq.toString();
        content.getChildByPath("TabRank/content/BaseProperty/Int/Value").getComponent(Label).string = data.iq.toString();

        //TAB LEVEL
        // calculate level up cost for level up 1
        const levelupCost = PioneerLvlupConfig.getNFTLevelUpCost(data.level, data.level + 1);
        content.getChildByPath("TabLevel/content/Level_Cost/cost").getComponent(Label).string = levelupCost.toString();
        content.getChildByPath("TabLevel/content/Level_Cost/current").getComponent(Label).string = DataMgr.s.item
            .getObj_item_count(ResourceCorrespondingItem.NFTExp)
            .toString();
        content.getChildByPath("TabLevel/content/Level_Cost/current").getComponent(Label).color =
            DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.NFTExp) >= levelupCost ? new Color().fromHEX("#8EDA61") : new Color().fromHEX("#EC4C4C");
        // level up
        let canLevelup = DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.NFTExp) >= levelupCost && data.level < data.levelLimit;
        content.getChildByPath("TabLevel/content/Level_Cost/Btn").getComponent(Sprite).spriteFrame = canLevelup ? this.btn_enable : this.btn_disable;
        content.getChildByPath("TabLevel/content/Level_Cost/Btn/Label").getComponent(Label).string = data.level >= data.levelLimit ? "Max" : "Level Up";

        //TAB RANK
        // rank up cost for up 1
        const rankupCost = PioneerLvlupConfig.getNFTRankUpCost(data.rarity, data.rank, data.rank + 1);

        const costItem1 = ItemConfig.getById(rankupCost[0].itemConfigId);
        const costItem2 = ItemConfig.getById(rankupCost[1].itemConfigId);
        const ownItem1: number = DataMgr.s.item.getObj_item_count(rankupCost[0].itemConfigId);
        const ownItem2: number = DataMgr.s.item.getObj_item_count(costItem2.configId);
        const needItem1: number = rankupCost[0].count;
        const needItem2: number = rankupCost[1].count;
        const costIcon1 = await ItemMgr.getItemIcon(costItem1.icon);
        const costIcon2 = await ItemMgr.getItemIcon(costItem2.icon);

        // rank up
        content.getChildByPath("TabRank/content/rank_info/from").getComponent(Label).string = "Rank." + data.rank;
        content.getChildByPath("TabRank/content/rank_info/to").getComponent(Label).string =
            data.rank >= data.rankLimit ? `Rank.${data.rank}` : `Rank.${data.rank + 1}`;
        // max level
        content.getChildByPath("TabRank/content/level_info/from").getComponent(Label).string = `Level.${data.level}/${data.levelLimit}`;
        content.getChildByPath("TabRank/content/level_info/to").getComponent(Label).string =
            data.level >= data.levelLimit ? `Level.${data.level}/${data.levelLimit}` : `Level.${data.level}/${data.levelLimit + 20}`;
        // cost 1
        content.getChildByPath("TabRank/content/Rank_Cost/res1/current").getComponent(Label).string = ownItem1.toString();
        content.getChildByPath("TabRank/content/Rank_Cost/res1/cost").getComponent(Label).string = needItem1.toString();
        content.getChildByPath("TabRank/content/Rank_Cost/res1/current").getComponent(Label).color =
            ownItem1 >= needItem1 ? new Color().fromHEX("#8EDA61") : new Color().fromHEX("#EC4C4C");
        content.getChildByPath("TabRank/content/Rank_Cost/res1/Icon").getComponent(Sprite).spriteFrame = costIcon1;
        // cost 2
        content.getChildByPath("TabRank/content/Rank_Cost/res2/current").getComponent(Label).string = ownItem2.toString();
        content.getChildByPath("TabRank/content/Rank_Cost/res2/cost").getComponent(Label).string = needItem2.toString();
        content.getChildByPath("TabRank/content/Rank_Cost/res2/current").getComponent(Label).color =
            ownItem2 >= needItem2 ? new Color().fromHEX("#8EDA61") : new Color().fromHEX("#EC4C4C");
        content.getChildByPath("TabRank/content/Rank_Cost/res2/Icon").getComponent(Sprite).spriteFrame = costIcon2;
        //btn
        let canRankup = ownItem1 >= needItem1 && ownItem2 >= needItem2 && data.rank < data.rankLimit;
        content.getChildByPath("TabRank/content/Rank_Cost/Btn").getComponent(Sprite).spriteFrame = canRankup ? this.btn_enable : this.btn_disable;
        content.getChildByPath("TabRank/content/Rank_Cost/Btn/Label").getComponent(Label).string = data.rank >= data.rankLimit ? "Max" : "Rank Up";
        // talent (old skill)
        const skillConfig = NFTSkillConfig.getById(data.skills[0].id);
        const skillEffectConfig = NFTSkillEffectConfig.getDesByIds(skillConfig.effect);
        content.getChildByPath("TabLevel/content/skill/name").getComponent(Label).string = LanMgr.getLanById(skillConfig.name);
        content.getChildByPath("TabLevel/content/skill/desc").getComponent(Label).string = skillEffectConfig;
        for (const child of content.getChildByPath("TabLevel/content/skill/Icon").children) {
            child.active = child.name == skillConfig.icon;
        }
        // skill
        // old skill have been remove tempolary, so we don't show it
        // for (const item of this._skillAllItems) {
        //     item.destroy();
        // }
        // this._skillAllItems = [];
        // for (let i = 0; i < data.skills.length; i++) {
        //     const skillConfig = NFTSkillConfig.getById(data.skills[i].id);
        //     if (skillConfig == null) {
        //         continue;
        //     }
        //     const item = instantiate(this._skillItem);
        //     item.active = true;
        //     item.parent = this._skillContent;
        //     item.getChildByPath("item").getComponent(Label).string = LanMgr.getLanById(skillConfig.name);
        //     for (let j = 1; j <= 5; j++) {
        //         item.getChildByPath("Level" + j).active = skillConfig.rank == j;
        //     }
        //     item.getComponent(Button).clickEvents[0].customEventData = i.toString();
        //     this._skillAllItems.push(item);
        // }
        // if (data.skills.length < currentSkillLimit) {
        //     if (data.skills.length % 2 != 0) {
        //         const item = instantiate(this._skillGapItem);
        //         item.active = true;
        //         item.parent = this._skillContent;
        //         this._skillAllItems.push(item);
        //     }
        //     const addItem = instantiate(this._skillAddItem);
        //     addItem.active = true;
        //     addItem.parent = this._skillContent;
        //     this._skillAllItems.push(addItem);
        // }

        // action button
        content.getChildByPath("info/LeftArrowButton").active = this._currentIndex > 0;
        content.getChildByPath("info/LeftArrowButton").getComponent(Button).interactable = true;
        content.getChildByPath("info/RightArrowButton").active = this._currentIndex < this._NFTDatas.length - 1;
        content.getChildByPath("info/RightArrowButton").getComponent(Button).interactable = true;

        // red point
        content
            .getChildByPath("TabLevel/RedPointView")
            .getComponent(RedPointView)
            .refreshUI(GameMgr.checkNFTCanLevelUp(data.uniqueId) ? 1 : 0, false);
        content
            .getChildByPath("TabRank/RedPointView")
            .getComponent(RedPointView)
            .refreshUI(GameMgr.checkNFTCanRankUp(data.uniqueId) ? 1 : 0, false);
    }
    //---------------------------------------------------- action
    private onTapTab(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const content = this.node.getChildByPath("__ViewContent");
        if (customEventData === "Level") {
            content.getChildByPath("TabLevel").getComponent(Sprite).spriteFrame = this.tab_enable;
            content.getChildByPath("TabRank").getComponent(Sprite).spriteFrame = this.tab_disable;
            content.getChildByPath("TabLevel/Label").getComponent(Label).color = new Color().fromHEX("#000000");
            content.getChildByPath("TabRank/Label").getComponent(Label).color = new Color().fromHEX("#79726F");
            content.getChildByPath("TabLevel/content").active = true;
            content.getChildByPath("TabRank/content").active = false;
        } else if (customEventData === "Rank") {
            content.getChildByPath("TabLevel").getComponent(Sprite).spriteFrame = this.tab_disable;
            content.getChildByPath("TabRank").getComponent(Sprite).spriteFrame = this.tab_enable;
            content.getChildByPath("TabLevel/Label").getComponent(Label).color = new Color().fromHEX("#79726F");
            content.getChildByPath("TabRank/Label").getComponent(Label).color = new Color().fromHEX("#000000");
            content.getChildByPath("TabLevel/content").active = false;
            content.getChildByPath("TabRank/content").active = true;
        } else {
            return;
        }
    }
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
            NetworkMgr.websocketMsg.player_nft_lvlup({ nftId: this._NFTDatas[this._currentIndex].uniqueId, levelUpNum: 1 });
        }
    }
    private async onTapRankUp() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._NFTDatas != null && this._currentIndex >= 0 && this._currentIndex < this._NFTDatas.length) {
            NetworkMgr.websocketMsg.player_nft_rankup({ nftId: this._NFTDatas[this._currentIndex].uniqueId, rankUpNum: 1 });
        }
    }
}
