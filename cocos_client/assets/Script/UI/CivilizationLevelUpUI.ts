import { _decorator, Animation, Button, Component, instantiate, Label, Layout, Node, Sprite, tween, UIOpacity, v3 } from "cc";
import { BackpackItem } from "./BackpackItem";
import { ArtifactItem } from "./ArtifactItem";
import ArtifactData from "../Model/ArtifactData";
import { LanMgr, UserInfoMgr } from "../Utils/Global";
import { UIName } from "../Const/ConstUIDefine";
import { SecretGuardGettedUI } from "./Outer/SecretGuardGettedUI";
import ViewController from "../BasicView/ViewController";
import { ArtifactInfoUI } from "./ArtifactInfoUI";
import NotificationMgr from "../Basic/NotificationMgr";
import { LvlupConfigData } from "../Const/Lvlup";
import ItemData, { ItemConfigType } from "../Const/Item";
import { NotificationName } from "../Const/Notification";
import { ItemGettedUI } from "./ItemGettedUI";
import UIPanelManger from "../Basic/UIPanelMgr";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("CivilizationLevelUpUI")
export class CivilizationLevelUpUI extends ViewController {
    private _rewardItem: Node = null;
    private _artifactItem: Node = null;
    private _showRewardItems: Node[] = [];
    private _showArtifactItems: Node[] = [];

    private _buildAnimView: Node = null;
    private _finishAnimView: Node = null;
    private _finishLightAnimView: Node = null;

    private _showBuildAnimView: Node = null;
    private _showFinishAnimView: Node = null;

    private _tipView: Node = null;

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._rewardItem = this.node.getChildByPath("Content/RewardContent/Rewards/Content/BackpackItem");
        this._rewardItem.active = false;

        this._artifactItem = this.node.getChildByPath("Content/RewardContent/Rewards/Content/ArtifactItem");
        this._artifactItem.active = false;

        this._buildAnimView = this.node.getChildByPath("Content/Video/Mask/Build");
        this._buildAnimView.active = false;

        this._finishAnimView = this.node.getChildByPath("Content/Video/Mask/Finish");
        this._finishAnimView.active = false;

        this._finishLightAnimView = this.node.getChildByPath("Content/Video/Mask/FinishLight");
        this._finishLightAnimView.active = false;

        this._tipView = this.node.getChildByPath("Tip");
        // this._tipView.getComponent(Label).string = LanMgr.getLanById("use lan:Click on the blank space to close");
        this._tipView.active = false;

        NotificationMgr.addListener(NotificationName.CHANGE_LANG, this.refreshUI, this);
    }

    protected viewDidStart(): void {
        super.viewDidStart();

        GameMusicPlayMgr.playCLVUpEffect();
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.CHANGE_LANG, this.refreshUI, this);
    }

    public async refreshUI(levelConfig: LvlupConfigData) {
        if (levelConfig == null) {
            return;
        }
        const contentView = this.node.getChildByName("Content");
        const levelContentView = this.node.getChildByPath("LevelContent");
        // useLanMgr
        // contentView.getChildByName("Title").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("Content/RewardContent/CityVersion").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("Content/RewardContent/EventUpdate").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("Content/RewardContent/ResGetRateUp").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("Content/RewardContent/GetHpMax").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("Content/RewardContent/Rewards/Title").getComponent(Label).string = LanMgr.getLanById("107549");

        // anim
        levelContentView.active = true;
        levelContentView.getComponent(UIOpacity).opacity = 0;
        levelContentView.position = v3(0, -80, 0);

        if (this._showBuildAnimView != null) {
            this._showBuildAnimView.destroy();
        }
        if (this._showFinishAnimView != null) {
            this._showFinishAnimView.destroy();
        }
        this._finishLightAnimView.active = false;

        this.node.getChildByName("Content").getComponent(Button).interactable = false;
        this._showBuildAnimView = instantiate(this._buildAnimView);
        this._showBuildAnimView.active = true;
        this._showBuildAnimView.position = v3(0, -166, 0);
        this._showBuildAnimView.parent = this._buildAnimView.parent;
        tween()
            .target(this._showBuildAnimView)
            .delay(1.0)
            .to(0.8, { position: v3(this._showBuildAnimView.position.x, -2400, this._showBuildAnimView.position.z) })
            .delay(2.0)
            .call(() => {
                this._showBuildAnimView.active = false;

                this._showFinishAnimView = instantiate(this._finishAnimView);
                this._showFinishAnimView.active = true;
                this._showFinishAnimView.parent = this._showBuildAnimView.parent;
                this._showFinishAnimView.position = v3(0, -166, 0);

                this._finishLightAnimView.active = true;
                this._finishLightAnimView.setSiblingIndex(99);
                this._finishLightAnimView.getChildByName("Particle_Ui_Building").getComponent(Animation).play();
                tween()
                    .target(this._finishLightAnimView)
                    .delay(1.2)
                    .call(() => {
                        tween()
                            .target(levelContentView)
                            .to(0.3, { position: v3(0, 0, 0) })
                            .delay(0.5)
                            .call(() => {
                                this._finishLightAnimView.active = false;
                                this.node.getChildByName("Content").getComponent(Button).interactable = true;
                                this._tipView.active = true;
                            })
                            .start();

                        tween().target(levelContentView.getComponent(UIOpacity)).to(0.3, { opacity: 255 }).start();
                    })
                    .start();

                tween()
                    .target(this._showFinishAnimView)
                    .to(0.8, { position: v3(this._showFinishAnimView.position.x, -2400, this._showFinishAnimView.position.z) })
                    .start();
            })
            .start();

        // level
        contentView.getChildByPath("Level/Before").getComponent(Label).string = "C.LV" + (Number(levelConfig.id) - 1).toString();
        contentView.getChildByPath("Level/After").getComponent(Label).string = "C.LV" + levelConfig.id;

        // reward
        const content = contentView.getChildByName("RewardContent");
        content.getChildByName("CityFeature").active = levelConfig.city_feature != null && levelConfig.city_feature == 1;
        // useLanMgr
        // content.getChildByPath("CityFeature/Title").getComponent(Label).string = LanMgr.getLanById("107549");

        content.getChildByName("CityVersion").active = false;
        // useLanMgr
        // content.getChildByPath("CityVersion/Title").getComponent(Label).string = LanMgr.getLanById("107549");

        content.getChildByName("EventUpdate").active = levelConfig.event_building != null;
        // useLanMgr
        // content.getChildByPath("EventUpdate/Title").getComponent(Label).string = LanMgr.getLanById("107549");
        content.getChildByName("ResGetRateUp").active = false;

        content.getChildByName("GetHpMax").active = false;

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

        const clevelItem = this.node.getChildByPath("LevelContent/Item");
        for (let j = 1; j <= 6; j++) {
            clevelItem.getChildByPath("Icon/icon_" + j).active = levelConfig.age == j;
        }
        for (let j = 1; j <= 5; j++) {
            clevelItem.getChildByPath("level/img_" + j).active = levelConfig.level == j;
        }
    }

    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.popPanel(this.node);
        if (UserInfoMgr.afterCivilizationClosedShowPioneerDatas.length > 0) {
            const result = await UIPanelManger.inst.pushPanel(UIName.SecretGuardGettedUI);
            if (result.success) {
                result.node.getComponent(SecretGuardGettedUI).dialogShow(UserInfoMgr.afterCivilizationClosedShowPioneerDatas[0].animType);
            }
            UserInfoMgr.afterCivilizationClosedShowPioneerDatas = [];
        } else {
            if (UserInfoMgr.afterCivilizationClosedShowItemDatas.length > 0) {
                const result = await UIPanelManger.inst.pushPanel(UIName.ItemGettedUI);
                if (result.success) {
                    result.node.getComponent(ItemGettedUI).showItem(UserInfoMgr.afterCivilizationClosedShowItemDatas);
                }
                UserInfoMgr.afterCivilizationClosedShowItemDatas = [];
            }
            if (UserInfoMgr.afterCivilizationClosedShowArtifactDatas.length > 0) {
                const result = await UIPanelManger.inst.pushPanel(UIName.ArtifactInfoUI);
                if (result.success) {
                    result.node.getComponent(ArtifactInfoUI).showItem(UserInfoMgr.afterCivilizationClosedShowArtifactDatas);
                }
                UserInfoMgr.afterCivilizationClosedShowArtifactDatas = [];
            }
        }
    }
    private onTapCloseLevelContent() {
        GameMusicPlayMgr.playTapButtonEffect();
        this.node.getChildByPath("LevelContent").active = false;
    }
}
