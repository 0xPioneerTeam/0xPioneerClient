import {
    _decorator,
    Button,
    Color,
    Component,
    EditBox,
    instantiate,
    Label,
    Layout,
    Node,
    Prefab,
    ProgressBar,
    ScrollView,
    Slider,
    Sprite,
    UITransform,
    v2,
    Vec3,
} from "cc";
import { SettlementView } from "./View/SettlementView";
import ArtifactData from "../Model/ArtifactData";
import { ArtifactItem } from "./ArtifactItem";
import { BackpackItem } from "./BackpackItem";
import { LanMgr, UserInfoMgr, AudioMgr } from "../Utils/Global";
import ViewController from "../BasicView/ViewController";
import { UIHUDController } from "./UIHUDController";
import NotificationMgr from "../Basic/NotificationMgr";
import LvlupConfig from "../Config/LvlupConfig";
import ItemData, { ItemConfigType } from "../Const/Item";
import { NotificationName } from "../Const/Notification";
import Config from "../Const/Config";
import UIPanelManger from "../Basic/UIPanelMgr";
import { DataMgr } from "../Data/DataMgr";
import { NetworkMgr } from "../Net/NetworkMgr";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("PlayerInfoUI")
export class PlayerInfoUI extends ViewController {
    private _selectIndex: number = 0;
    private _selectSettleIndex: number = 0;
    private _selectSettleViewOffsetHeight: number[] = [];
    private _selectLang: string = "eng";

    private _tabViews: Node[] = [];
    private _tabButtons: Node[] = [];

    private _changeNameView: Node = null;
    private _nextLevelView: Node = null;
    private _rewardItem: Node = null;
    private _artifactItem: Node = null;
    private _showRewardItems: Node[] = [];
    private _showArtifactItems: Node[] = [];

    private _settlementItem: Node = null;
    private _settlementUseItems: Node[] = [];

    private _settleSelectItem: Node = null;
    private _settleUseSelectItems: Node[] = [];

    private _langSelectView: Node = null;

    protected viewDidLoad(): void {
        super.viewDidLoad();

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

        this._settlementItem = summaryView.getChildByPath("PeriodicSettlement/view/content/Item");
        this._settlementItem.active = false;

        this._changeNameView = this.node.getChildByName("ChangeNameContent");
        this._changeNameView.active = false;

        this._nextLevelView = this.node.getChildByName("NextLevelContent");
        this._rewardItem = this._nextLevelView.getChildByPath("NextLevelInfo/RewardContent/Rewards/Content/BackpackItem");
        this._rewardItem.active = false;
        this._artifactItem = this._nextLevelView.getChildByPath("NextLevelInfo/RewardContent/Rewards/Content/ArtifactItem");
        this._artifactItem.active = false;

        this._nextLevelView.active = false;

        this._settleSelectItem = summaryView.getChildByPath("SettlementList/view/content/Item");
        this._settleSelectItem.active = false;

        this._langSelectView = this.node.getChildByName("OptionContainer");
        this._langSelectView.active = false;

        NotificationMgr.addListener(NotificationName.CHANGE_LANG, this._onChangeLang, this);
        NotificationMgr.addListener(NotificationName.USERINFO_DID_CHANGE_LEVEL, this._refreshUI, this);
        NotificationMgr.addListener(NotificationName.SETTLEMENT_DATA_CHANGE, this._refreshUI, this);

        NetworkMgr.websocketMsg.get_user_settlement_info({});
    }

    protected viewDidStart(): void {
        super.viewDidStart();

        this._selectLang = LanMgr.getLang();
    }

    protected viewDidAppear(): void {
        super.viewDidAppear();

        this._refreshUI();
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.CHANGE_LANG, this._onChangeLang, this);
        NotificationMgr.removeListener(NotificationName.USERINFO_DID_CHANGE_LEVEL, this._refreshUI, this);
        NotificationMgr.removeListener(NotificationName.SETTLEMENT_DATA_CHANGE, this._refreshUI, this);
    }

    //-------------------------------- function
    private clearReset(): void {
        GameMusicPlayMgr.playTapButtonEffect();
        localStorage.clear();
        Config.canSaveLocalData = false;
        window.location.reload();
    }

    private async onClickExportSave() {
        // see: LocalDataLoader._importSaveOnStartIfExists
        GameMusicPlayMgr.playTapButtonEffect();
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            data[key] = localStorage.getItem(key);
        }
        await navigator.clipboard.writeText(JSON.stringify(data));
        UIHUDController.showCenterTip("Save exported to clipboard.");
    }

    private onClickImportSave() {
        GameMusicPlayMgr.playTapButtonEffect();
        const saveText = prompt("Paste save text here");
        if (!saveText) {
            return;
        }

        let saveObj: {};
        try {
            saveObj = JSON.parse(saveText);
        } catch (e) {
            UIHUDController.showCenterTip("Parse save text failed: not valid JSON");
            console.error(`Parse save text failed: ${e}`);
            return;
        }

        for (const k in saveObj) {
            if (typeof saveObj[k] !== "string") {
                UIHUDController.showCenterTip("Import save failed: save text format error.");
                return;
            }
        }

        if (Config.canSaveLocalData) {
            localStorage.setItem("importSaveOnStart", saveText);
        }
        location.reload();
    }

    private _onChangeLang() {
        this._refreshUI();
    }

    private _refreshUI() {
        if (this._settlementItem == null) {
            return;
        }
        const infoView = this.node.getChildByPath("Content/tabContents/InfoContent");
        const summaryView = this.node.getChildByPath("Content/tabContents/SummaryContent");
        const achievementView = this.node.getChildByPath("Content/tabContents/AchievementContent");
        const settingView = this.node.getChildByPath("Content/tabContents/SettingsContent");

        const infoBtn = this.node.getChildByPath("Content/tabButtons/InfoBtn");
        const summaryBtn = this.node.getChildByPath("Content/tabButtons/SummaryBtn");
        const achievementBtn = this.node.getChildByPath("Content/tabButtons/AchievementsBtn");
        const settingBtn = this.node.getChildByPath("Content/tabButtons/SettingsBtn");

        const lang = new Map();
        // useLanMgr
        // lang.set("eng", LanMgr.getLanById("107549"));
        // lang.set("cn", LanMgr.getLanById("107549"));
        lang.set("eng", "English");
        lang.set("cn", "Chinese");

        // useLanMgr
        // infoBtn.getChildByName("Label").getComponent(Label).string = LanMgr.getLanById("107549");
        // summaryBtn.getChildByName("Label").getComponent(Label).string = LanMgr.getLanById("107549");
        // achievementBtn.getChildByName("Label").getComponent(Label).string = LanMgr.getLanById("107549");
        // settingBtn.getChildByName("Label").getComponent(Label).string = LanMgr.getLanById("107549");

        // infoView.getChildByPath("NextLevel/Label").getComponent(Label).string = LanMgr.getLanById("107549");

        //  summaryView.getChildByName("Title").getComponent(Label).string = LanMgr.getLanById("107549");
        //  summaryView.getChildByName("EmptyTip").getComponent(Label).string = LanMgr.getLanById("107549");

        // settingView.getChildByName("Music").getComponent(Label).string = LanMgr.getLanById("107549");
        // settingView.getChildByName("SFX").getComponent(Label).string = LanMgr.getLanById("107549");
        // settingView.getChildByName("Language").getComponent(Label).string = LanMgr.getLanById("107549");

        // this._changeNameView.getChildByPath("Content/Title").getComponent(Label).string = LanMgr.getLanById("107549");
        // this._changeNameView.getChildByPath("Content/UserName").getComponent(EditBox).placeholder = LanMgr.getLanById("107549");
        // this._changeNameView.getChildByPath("Content/ConfirmButton/Label").getComponent(Label).string = LanMgr.getLanById("107549");

        this._langSelectView.getChildByPath("View/Content/English").getComponent(Label).string = lang.get("eng");
        this._langSelectView.getChildByPath("View/Content/Chinese").getComponent(Label).string = lang.get("cn");

        for (let i = 0; i < this._tabButtons.length; i++) {
            this._tabButtons[i].getChildByName("BtnPageLight").active = i == this._selectIndex;
            this._tabButtons[i].getChildByName("BtnPageDark").active = i != this._selectIndex;
            this._tabButtons[i].getChildByName("Label").getComponent(Label).color = i == this._selectIndex ? new Color(66, 53, 35) : new Color(122, 114, 111);
        }

        for (let i = 0; i < this._tabViews.length; i++) {
            this._tabViews[i].active = i == this._selectIndex;
            this._tabButtons[i].getComponent(Sprite).grayscale = i != this._selectIndex;
        }

        const currentShowView = this._tabViews[this._selectIndex];
        if (this._selectIndex == 0) {
            // info
            let currentLevel = DataMgr.s.userInfo.data.level;
            currentShowView.getChildByPath("UserID/UserID").getComponent(Label).string = "ID: " + DataMgr.s.userInfo.data.id;
            // useLanMgr
            // currentShowView.getChildByPath("UserName/UserName").getComponent(Label).string = LanMgr.getLanById("107549") + ":" + DataMgr.s.userInfo.data.name;
            currentShowView.getChildByPath("UserName/UserName").getComponent(Label).string = "Name: " + DataMgr.s.userInfo.data.name;

            // useLanMgr
            // currentShowView.getChildByPath("UserLCivilizationLv/UserLCivilizationLv").getComponent(Label).string = LanMgr.getLanById("107549");
            currentShowView.getChildByPath("UserCivilizationLv/Label").getComponent(Label).string = currentLevel.toString();

            // useLanMgr
            // currentShowView.getChildByPath("RewardContent/CityVersion/Content/Title").getComponent(Label).string = LanMgr.getLanById("107549");
            currentShowView.getChildByPath("RewardContent/CityVersion/Value").getComponent(Label).string = "+" + LvlupConfig.getTotalVisionByLvl(currentLevel);

            // useLanMgr
            // currentShowView.getChildByPath("RewardContent/ResGetRateUp/Content/Title").getComponent(Label).string = LanMgr.getLanById("107549");
            currentShowView.getChildByPath("RewardContent/ResGetRateUp/Value").getComponent(Label).string =
                "+" + LvlupConfig.getTotalExtraRateByLvl(currentLevel) * 100 + "%";

            // useLanMgr
            // currentShowView.getChildByPath("RewardContent/GetHpMax/Content/Title").getComponent(Label).string = LanMgr.getLanById("107549");
            currentShowView.getChildByPath("RewardContent/GetHpMax/Value").getComponent(Label).string = "+" + LvlupConfig.getTotalHpMaxByLvl(currentLevel);
        } else if (this._selectIndex == 1) {
            // summary
            const settleViewContent = currentShowView.getChildByPath("PeriodicSettlement/view/content");
            for (const item of this._settlementUseItems) {
                item.destroy();
            }
            this._settlementUseItems = [];

            const selectItemContent = currentShowView.getChildByPath("SettlementList/view/content");
            for (const item of this._settleUseSelectItems) {
                item.destroy();
            }
            this._settleUseSelectItems = [];

            let currentLevel: number = DataMgr.s.userInfo.data.level;
            const gap: number = 4;
            const settleCount: number = Math.floor(currentLevel / gap) + 1;
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
                    if (beginLevel > LvlupConfig.getMaxLevel()) {
                        break;
                    }
                    const endLevel: number = (i + 1) * gap;
                    //view
                    const view = instantiate(this._settlementItem);
                    view.active = true;
                    settleViewContent.addChild(view);
                    view.getComponent(SettlementView).refreshUI(beginLevel, endLevel);
                    let lastViewOffsetHeight: number = 0;
                    if (this._selectSettleViewOffsetHeight.length > 0) {
                        lastViewOffsetHeight = this._selectSettleViewOffsetHeight[this._selectSettleViewOffsetHeight.length - 1];
                    }
                    this._selectSettleViewOffsetHeight.push(lastViewOffsetHeight + view.getComponent(UITransform).height);
                    this._settlementUseItems.push(view);

                    // button
                    const select = instantiate(this._settleSelectItem);
                    select.active = true;
                    selectItemContent.addChild(select);
                    select.getComponent(Button).clickEvents[0].customEventData = i.toString();
                    select.getChildByName("Label").getComponent(Label).string = "C.Lv" + beginLevel + " - " + endLevel;
                    this._settleUseSelectItems.push(select);
                }
                settleViewContent.getComponent(Layout).updateLayout();
                selectItemContent.getComponent(Layout).updateLayout();
                this._refreshSettleButtons();
            }
        } else if (this._selectIndex == 2) {
            // setting
            const bgmSlider = currentShowView.getChildByName("MusicVolumeSlider").getComponent(Slider);
            bgmSlider.progress = AudioMgr.musicVolume;
            currentShowView.getChildByName("MusicProgressBar").getComponent(ProgressBar).progress = AudioMgr.musicVolume;

            const effectSlider = currentShowView.getChildByName("SfxVolumeSlider").getComponent(Slider);
            effectSlider.progress = AudioMgr.effectVolume;
            currentShowView.getChildByName("SfxProgressBar").getComponent(ProgressBar).progress = AudioMgr.effectVolume;

            currentShowView.getChildByPath("LanguageMenu/LanguageBtn/Label").getComponent(Label).string = lang.get(this._selectLang);

            // useLanMgr
            // currentShowView.getChildByName("ResetButton").getComponent(Label).string = LanMgr.getLanById("107549");
        } else if (this._selectIndex == 3) {
            // xx reversed
        }
    }

    private async _refreshNextLevelView() {
        const nextLevel = DataMgr.s.userInfo.data.level + 1;
        // useLanMgr
        // this._nextLevelView.getChildByPath("NextLevelInfo/UserCivilizationLv/Title").getComponent(Label).string = LanMgr.getLanById("107549")
        this._nextLevelView.getChildByPath("NextLevelInfo/UserCivilizationLv/NextLevel").getComponent(Label).string = nextLevel.toString();

        const rewardView = this._nextLevelView.getChildByPath("NextLevelInfo/RewardContent");
        const maxTip = this._nextLevelView.getChildByPath("NextLevelInfo/MaxTip");
        const nextLvConfig = LvlupConfig.getById(nextLevel.toString());
        if (nextLvConfig != null) {
            const levelConfig = nextLvConfig;

            rewardView.active = true;
            const content = rewardView;
            content.getChildByName("CityVersion").active = levelConfig.city_vision != null && levelConfig.city_vision > 0;
            // useLanMgr
            // content.getChildByPath("CityVersion/Content/Title").getComponent(Label).string = LanMgr.getLanById("107549");
            content.getChildByPath("CityVersion/Value").getComponent(Label).string = "+" + levelConfig.city_vision;

            if (levelConfig.extra_res != null && levelConfig.extra_res > 0) {
                content.getChildByName("ResGetRateUp").active = true;
                // useLanMgr
                // content.getChildByPath("ResGetRateUp/Content/Title").getComponent(Label).string = LanMgr.getLanById("107549");
                content.getChildByPath("ResGetRateUp/Value").getComponent(Label).string = "+" + levelConfig.extra_res * 100 + "%";
            } else {
                content.getChildByName("ResGetRateUp").active = false;
            }

            if (levelConfig.hp_max != null && levelConfig.hp_max > 0) {
                content.getChildByName("GetHpMax").active = true;
                // useLanMgr
                // content.getChildByPath("GetHpMax/Content/Title").getComponent(Label).string = LanMgr.getLanById("107549");
                content.getChildByPath("GetHpMax/Value").getComponent(Label).string = "+" + levelConfig.hp_max;
            } else {
                content.getChildByName("GetHpMax").active = false;
            }

            if (levelConfig.reward != null && levelConfig.reward.length > 0) {
                content.getChildByName("Rewards").active = true;
                for (const item of [...this._showRewardItems, ...this._showArtifactItems]) {
                    item.destroy();
                }
                this._showRewardItems = [];
                this._showArtifactItems = [];
                for (const data of levelConfig.reward) {
                    if (data.length == 3) {
                        const type = data[0];
                        const id = data[1];
                        const num = data[2];
                        if (type == ItemConfigType.Item) {
                            const view = instantiate(this._rewardItem);
                            view.active = true;
                            view.getComponent(BackpackItem).refreshUI(new ItemData(id, num));
                            view.getChildByName("Count").getComponent(Label).string = num.toString();
                            view.setParent(content.getChildByPath("Rewards/Content"));
                            this._showRewardItems.push(view);
                        } else if (type == ItemConfigType.Artifact) {
                            const view = instantiate(this._artifactItem);
                            view.active = true;
                            view.getComponent(ArtifactItem).refreshUI(new ArtifactData(id, num));
                            view.getChildByName("Count").getComponent(Label).string = num.toString();
                            view.setParent(content.getChildByPath("Rewards/Content"));
                            this._showArtifactItems.push(view);
                        }
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
            item.getChildByName("ImgScreenSelect").active = i == this._selectSettleIndex;
            item.getChildByName("Label").getComponent(Label).color = i == this._selectSettleIndex ? new Color(243, 228, 177) : new Color(255, 255, 255);
        }
    }

    //----------------------------------------------------------------------
    // action
    private onTapTab(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const index = parseInt(customEventData);
        if (this._selectIndex == index) {
            return;
        }
        this._selectIndex = index;
        this._refreshUI();
    }
    //----------------------------------- info
    private onTapChangeNameShow() {
        return;
        GameMusicPlayMgr.playTapButtonEffect();
        this._changeNameView.active = true;
        this._changeNameView.getChildByPath("Content/UserName").getComponent(EditBox).string = "";
    }
    private onTapChangeNameClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        this._changeNameView.active = false;
    }
    private onTapChangeNameConfirm() {
        GameMusicPlayMgr.playTapButtonEffect();
        const changedName: string = this._changeNameView.getChildByPath("Content/UserName").getComponent(EditBox).string;
        if (changedName.length <= 0) {
            // useLanMgr
            // LanMgr.getLanById("107549")
            UIHUDController.showCenterTip("Name cannot be empty");
            return;
        }
        DataMgr.s.userInfo.data.name = changedName;
        this._refreshUI();
        this._changeNameView.active = false;
    }
    private onTapNextLevelShow() {
        GameMusicPlayMgr.playTapButtonEffect();
        this._nextLevelView.active = true;
        this._refreshNextLevelView();
    }
    private onTapNextLevelClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        this._nextLevelView.active = false;
    }
    //-----------------------------------settlement
    private onTapSettleSelect(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
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
        const bgmSlider = this.node.getChildByPath("Content/tabContents/SettingsContent/MusicVolumeSlider").getComponent(Slider);
        this.node.getChildByPath("Content/tabContents/SettingsContent/MusicProgressBar").getComponent(ProgressBar).progress = bgmSlider.progress;
        AudioMgr.changeMusicVolume(bgmSlider.progress);
        this._refreshUI();
    }
    private onEffectVolumeChanged() {
        const effectSlider = this.node.getChildByPath("Content/tabContents/SettingsContent/SfxVolumeSlider").getComponent(Slider);
        this.node.getChildByPath("Content/tabContents/SettingsContent/SfxProgressBar").getComponent(ProgressBar).progress = effectSlider.progress;
        AudioMgr.changeEffectVolume(effectSlider.progress);
        this._refreshUI();
    }
    private onTapLangSelectShow() {
        GameMusicPlayMgr.playTapButtonEffect();
        this._langSelectView.active = true;
        this.node.getChildByPath("Content/tabContents/SettingsContent/LanguageMenu/LanguageBtn/Arrow").angle = 180;

        this._langSelectView.getChildByPath("View/Content/English/ImgScreenSelect").active = this._selectLang == "eng";
        this._langSelectView.getChildByPath("View/Content/Chinese/ImgScreenSelect").active = this._selectLang == "cn";
    }
    private onTapLangItem(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        this._selectLang = customEventData;
        LanMgr.changeLang(this._selectLang);
        this._refreshUI();
        this._langSelectView.active = false;
        this.node.getChildByPath("Content/tabContents/SettingsContent/LanguageMenu/LanguageBtn/Arrow").angle = 0;
    }

    private onTapLangSelectClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        this._langSelectView.active = false;
        this.node.getChildByPath("Content/tabContents/SettingsContent/LanguageMenu/LanguageBtn/Arrow").angle = 0;
    }

    private onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.popPanel(this.node);
    }
}
