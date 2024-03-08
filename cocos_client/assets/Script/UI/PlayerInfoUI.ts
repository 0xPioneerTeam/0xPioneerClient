import { _decorator, Button, Color, Component, EditBox, instantiate, Label, Layout, Node, Prefab, ScrollView, Slider, Sprite, UITransform, v2, Vec3 } from 'cc';
import { PopUpUI } from '../BasicView/PopUpUI';
import UserInfoMgr from '../Manger/UserInfoMgr';
import LvlupMgr from '../Manger/LvlupMgr';
import { GameMain } from '../GameMain';
import { BackpackItem } from './BackpackItem';
import ItemMgr from '../Manger/ItemMgr';
import { AudioMgr } from '../Basic/AudioMgr';
import LanMgr from '../Manger/LanMgr';
import EventMgr from '../Manger/EventMgr';
import { EventName } from '../Const/ConstDefine';
import SettlementMgr from '../Manger/SettlementMgr';
import { SettlementView } from './View/SettlementView';
const { ccclass, property } = _decorator;

@ccclass('PlayerInfoUI')
export class PlayerInfoUI extends PopUpUI {
    

    @property(Prefab)
    private settlementPrefab: Prefab = null;


    private _selectIndex: number = 0;
    private _selectSettleIndex: number = 0;
    private _selectSettleViewOffsetHeight: number[] = [];
    private _selectLang: string = "eng";

    private _tabViews: Node[] = [];
    private _tabButtons: Node[] = [];

    private _changeNameView: Node = null;
    private _nextLevelView: Node = null;
    private _rewardItem: Node = null;
    private _showRewardItems: Node[] = [];

    private _settleSelectItem: Node = null;
    private _settleUseSelectItems: Node[] = [];

    private _langSelectView: Node = null;
    

    onLoad(): void {

        this._selectIndex = 0;

        const infoView = this.node.getChildByPath("Content/tabContents/InfoContent");
        const summaryView = this.node.getChildByPath("Content/tabContents/SummaryContent");
        const achievementView = this.node.getChildByPath("Content/tabContents/AchievementContent");
        const settingView = this.node.getChildByPath("Content/tabContents/SettingsContent");
        achievementView.active = false;

        this._tabViews = [infoView, summaryView, settingView];

        const infoBtn = this.node.getChildByPath("Content/tabButtons/InfoBtn");
        const summaryBtn = this.node.getChildByPath("Content/tabButtons/SummaryBtn");
        const achievementBtn = this.node.getChildByPath("Content/tabButtons/AchievementsBtn");
        const settingBtn = this.node.getChildByPath("Content/tabButtons/SettingsBtn");
        achievementBtn.active = false;

        this._tabButtons = [infoBtn, summaryBtn, settingBtn];

        for (let i = 0; i < this._tabButtons.length; i++) {
            this._tabButtons[i].getComponent(Button).clickEvents[0].customEventData = i.toString();
        }

        this._changeNameView = this.node.getChildByName("ChangeNameContent");
        this._changeNameView.active = false;

        this._nextLevelView = this.node.getChildByName("NextLevelContent");
        this._rewardItem = this._nextLevelView.getChildByPath("NextLevelInfo/RewardContent/Rewards/Content/Item")
        this._rewardItem.active = false;
        this._nextLevelView.active = false;

        this._settleSelectItem = summaryView.getChildByPath("SettlementList/view/content/Item");
        this._settleSelectItem.active = false;

        this._langSelectView = this.node.getChildByName("OptionContainer");
        this._langSelectView.active = false;


        EventMgr.on(EventName.LOADING_FINISH, this._loadOver, this);
    }

    start() {
        
    }

    update(deltaTime: number) {

    }

    onDestroy() {
       
    }

    //-------------------------------- function
    private _loadOver() {
        this._selectLang = LanMgr.Instance.getLang();
        this._refreshUI();
    }

    private _refreshUI() {
        for (let i = 0; i < this._tabViews.length; i++) {
            this._tabViews[i].active = i == this._selectIndex;
            this._tabButtons[i].getComponent(Sprite).grayscale = (i != this._selectIndex);
        }

        const currentShowView = this._tabViews[this._selectIndex];
        if (this._selectIndex == 0) {
            // info
            let currentLevel = UserInfoMgr.Instance.level;
            currentShowView.getChildByName("UserID").getComponent(Label).string = "ID:" + UserInfoMgr.Instance.playerID;
            currentShowView.getChildByName("UserName").getComponent(Label).string = "Name:" + UserInfoMgr.Instance.playerName;
            currentShowView.getChildByName("UserLCivilizationLv").getComponent(Label).string = "Civilization Level  " + currentLevel;

            currentShowView.getChildByPath("RewardContent/CityVersion").getComponent(Label).string = "> City Vision Expand + " + LvlupMgr.Instance.getTotalVisionByLvl(currentLevel);
            currentShowView.getChildByPath("RewardContent/ResGetRateUp").getComponent(Label).string = "> Resources Gained + " + LvlupMgr.Instance.getTotalExtraRateByLvl(currentLevel) * 100 + "%";
            currentShowView.getChildByPath("RewardContent/GetHpMax").getComponent(Label).string = "> HP Max + " + LvlupMgr.Instance.getTotalHpMaxByLvl(currentLevel);

        } else if (this._selectIndex == 1) {
            // summary
            const settleViewContent = currentShowView.getChildByPath("PeriodicSettlement/view/content");
            settleViewContent.destroyAllChildren();

            const selectItemContent = currentShowView.getChildByPath("SettlementList/view/content");
            for (const item of this._settleUseSelectItems) {
                item.destroy();
            }
            this._settleUseSelectItems = [];

            const currentLevel: number = UserInfoMgr.Instance.level;
            const gap: number = 10;
            const settleCount: number = Math.floor(currentLevel / gap);
            if (settleCount <= 0) {
                currentShowView.getChildByName("PeriodicSettlement").active = false;
                currentShowView.getChildByName("SettlementList").active = false;
                currentShowView.getChildByName("EmptyTip").active = true;

            } else {
                this._selectSettleViewOffsetHeight = [];
                currentShowView.getChildByName("PeriodicSettlement").active = true;
                currentShowView.getChildByName("SettlementList").active = true;
                currentShowView.getChildByName("EmptyTip").active = false;
                for (let i = 0; i < settleCount; i++) {
                    const beginLevel: number = i * gap + 1;
                    const endLevel: number = (i + 1) * gap;
                    //view
                    const view = instantiate(this.settlementPrefab);
                    view.active = true;
                    settleViewContent.addChild(view);
                    view.getComponent(SettlementView).refreshUI(beginLevel, endLevel);
                    let lastViewOffsetHeight: number = 0;
                    if (this._selectSettleViewOffsetHeight.length > 0) {
                        lastViewOffsetHeight = this._selectSettleViewOffsetHeight[this._selectSettleViewOffsetHeight.length - 1];
                    } 
                    this._selectSettleViewOffsetHeight.push(lastViewOffsetHeight + view.getComponent(UITransform).height);
    
                    // button
                    const select = instantiate(this._settleSelectItem);
                    select.active = true;
                    selectItemContent.addChild(select);
                    select.getComponent(Button).clickEvents[0].customEventData = i.toString();
                    select.getChildByName("Label").getComponent(Label).string = "C.Lv" + beginLevel + " - " + endLevel; 
                    this._settleUseSelectItems.push(select);
                };
                settleViewContent.getComponent(Layout).updateLayout();
                selectItemContent.getComponent(Layout).updateLayout();
                this._refreshSettleButtons();
            }
            

        } else if (this._selectIndex == 2) {
            // setting
            const bgmSlider = currentShowView.getChildByName("musicVolumeSlider").getComponent(Slider);
            bgmSlider.progress = AudioMgr.instance.musicVolume;

            const effectSlider = currentShowView.getChildByName("sfxVolumeSlider").getComponent(Slider);
            effectSlider.progress = AudioMgr.instance.effectVolume;

            const lang = new Map();
            lang.set("eng", "English");
            lang.set("cn", "Chinese");
            currentShowView.getChildByPath("LanguageMenu/LanguageBtn/Label").getComponent(Label).string = lang.get(this._selectLang);

        } else if (this._selectIndex == 3) {
            // xx reversed   
        }
    }

    private async _refreshNextLevelView() {
        const nextLevel = UserInfoMgr.Instance.level + 1;
        this._nextLevelView.getChildByPath("NextLevelInfo/NextLevel").getComponent(Label).string = "Civilization Level  " + nextLevel;

        const rewardView = this._nextLevelView.getChildByPath("NextLevelInfo/RewardContent");
        const maxTip = this._nextLevelView.getChildByPath("NextLevelInfo/MaxTip");
        const nextLvConfig = LvlupMgr.Instance.getConfigByLvl(nextLevel);
        if (nextLvConfig.length > 0) {
            const levelConfig = nextLvConfig[0];

            rewardView.active = true;
            const content = rewardView;
            content.getChildByName("CityVersion").active = levelConfig.city_vision != null && levelConfig.city_vision > 0;
            content.getChildByName("CityVersion").getComponent(Label).string = "> City Vision Expand + " + levelConfig.city_vision;

            if (levelConfig.extra_res != null && levelConfig.extra_res > 0) {
                content.getChildByName("ResGetRateUp").active = true;
                content.getChildByName("ResGetRateUp").getComponent(Label).string = "> Resources Gained + " + levelConfig.extra_res * 100 + "%!";
            } else {
                content.getChildByName("ResGetRateUp").active = false;
            }

            if (levelConfig.hp_max != null && levelConfig.hp_max > 0) {
                content.getChildByName("GetHpMax").active = true;
                content.getChildByName("GetHpMax").getComponent(Label).string = "> HP Max + " + levelConfig.hp_max + "!";
            } else {
                content.getChildByName("GetHpMax").active = false;
            }

            if (levelConfig.reward != null && levelConfig.reward.length > 0) {
                content.getChildByName("Rewards").active = true;
                for (const item of this._showRewardItems) {
                    item.destroy();
                }
                this._showRewardItems = [];
                for (const data of levelConfig.reward) {
                    if (data.length == 3) {
                        const type = data[0];
                        const id = parseInt(data[1]);
                        const num = data[2];
                        const view = instantiate(this._rewardItem);
                        view.active = true;
                        view.getChildByName("Icon").getComponent(Sprite).spriteFrame = await BackpackItem.getItemIcon(ItemMgr.Instance.getItemConf(id).icon);
                        view.getChildByName("Num").getComponent(Label).string = "x" + num;
                        view.setParent(content.getChildByPath("Rewards/Content"));
                        this._showRewardItems.push(view);   
                    }
                }
                content.getChildByPath("Rewards/Content").getComponent(Layout).updateLayout();
            } else {
                content.getChildByName("Rewards").active = false;
            }

            maxTip.active = false;
        } else {
            rewardView.active = false;
            maxTip.active = true;
        }
    }

    private _refreshSettleButtons() {
        for (let i = 0; i < this._settleUseSelectItems.length; i++) {
            const item = this._settleUseSelectItems[i];
            item.getComponent(Sprite).grayscale = i != this._selectSettleIndex;
        } 
    }
   
    //----------------------------------------------------------------------
    // action
    private onTapTab(event: Event, customEventData: string) {
        const index = parseInt(customEventData);
        if (this._selectIndex == index) {
            return;
        }
        this._selectIndex = index;
        this._refreshUI();
    }
    //----------------------------------- info
    private onTapChangeNameShow() {
        this._changeNameView.active = true;
        this._changeNameView.getChildByPath("Content/UserName").getComponent(EditBox).string = "";
    }
    private onTapChangeNameClose() {
        this._changeNameView.active = false;
    }
    private onTapChangeNameConfirm() {
        const changedName: string = this._changeNameView.getChildByPath("Content/UserName").getComponent(EditBox).string;
        if (changedName.length <= 0) {
            GameMain.inst.UI.ShowTip("Name cannot be empty");
            return;
        }
        UserInfoMgr.Instance.playerName = changedName;
        this._refreshUI();
        this._changeNameView.active = false;
    }
    private onTapNextLevelShow() {
        this._nextLevelView.active = true;
        this._refreshNextLevelView();
    }
    private onTapNextLevelClose() {
        this._nextLevelView.active = false;
    }
    //-----------------------------------settlement
    private onTapSettleSelect(event: Event, customEventData: string) {
        const index = parseInt(customEventData);
        const scrollView = this.node.getChildByPath("Content/tabContents/SummaryContent/PeriodicSettlement").getComponent(ScrollView);
        let offsetY: number = 0;
        if (index > 0) {
            offsetY = this._selectSettleViewOffsetHeight[index - 1] + 5;
        }
        scrollView.scrollToOffset(v2(0, offsetY), 0.3);
    }
    private onSettleViewScrolled(event: Event) {
        const scrollView = this.node.getChildByPath("Content/tabContents/SummaryContent/PeriodicSettlement").getComponent(ScrollView);
        for (let i = 0; i < this._selectSettleViewOffsetHeight.length; i++) {
            const offset = this._selectSettleViewOffsetHeight[i];
            if (offset >= 0 && scrollView.getScrollOffset().y <= offset) {
                this._selectSettleIndex = i;
                this._refreshSettleButtons();
                break;
            }
        }
    }

    //----------------------------------- setting
    private onBgmVolumeChanged() {
        const bgmSlider = this.node.getChildByPath("Content/tabContents/SettingsContent/musicVolumeSlider").getComponent(Slider);
        AudioMgr.instance.changeMusicVolume(bgmSlider.progress);
        this._refreshUI();
    }
    private onEffectVolumeChanged() {
        const effectSlider = this.node.getChildByPath("Content/tabContents/SettingsContent/sfxVolumeSlider").getComponent(Slider);
        AudioMgr.instance.changeEffectVolume(effectSlider.progress);
        this._refreshUI();
    }
    private onTapLangSelectShow() {
        this._langSelectView.active = true;
    }
    private onTapLangItem(event: Event, customEventData: string) {
        this._selectLang = customEventData;
        LanMgr.Instance.changeLang(this._selectLang);
        this._refreshUI();
        this._langSelectView.active = false;
    }

    private onTapLangSelectClose() {
        this._langSelectView.active = false;
    }


    private onTapClose() {
        this.show(false);
    }
}


