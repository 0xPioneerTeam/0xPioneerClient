import { _decorator, Button, Color, Component, instantiate, Label, Layout, Node, ProgressBar, RichText, Sprite, UITransform, v3 } from "cc";
import ViewController from "../../BasicView/ViewController";
import { ItemMgr, LanMgr } from "../../Utils/Global";
import { CLevelConfigData } from "../../Const/CLevelDefine";
import CLevelConfig from "../../Config/CLevelConfig";
import { DataMgr } from "../../Data/DataMgr";
import ItemConfig from "../../Config/ItemConfig";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import UIPanelManger from "../../Basic/UIPanelMgr";
const { ccclass, property } = _decorator;

@ccclass("CivilizationLevelUI")
export class CivilizationLevelUI extends ViewController {
    //------------------------------ data
    private _clevelDatas: CLevelConfigData[] = [];
    private _curSelectLevel: number = 1;
    //------------------------------ view
    private _curLevelTitle: Label = null;

    private _clevelProgress: ProgressBar = null;
    private _cLevelItemContent: Node = null;
    private _clevelItem: Node = null;

    private _buffItemContent: Node = null;
    private _buffItem: Node = null;

    private _rewardItemContent: Node = null;
    private _rewardItem: Node = null;

    private _conditionItemContent: Node = null;
    private _conditionItem: Node = null;

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._clevelDatas = CLevelConfig.getConfs();
        this._curSelectLevel = DataMgr.s.userInfo.data.level;

        const contentView = this.node.getChildByPath("Content");
        // useLanMgr
        // contentView.getChildByPath("TopView/Title").getComponent(Label).string = LanMgr.getLanById("107549");
        // contentView.getChildByPath("RightView/MaxTip").getComponent(Label).string = LanMgr.getLanById("107549");

        this._curLevelTitle = contentView.getChildByPath("TopView/CurLevel/Label").getComponent(Label);

        this._clevelProgress = contentView.getChildByPath("TopView/LevelShowContent/View/ProgressBar").getComponent(ProgressBar);
        this._cLevelItemContent = contentView.getChildByPath("TopView/LevelShowContent/View/Content");
        this._clevelItem = this._cLevelItemContent.getChildByPath("Item");
        this._clevelItem.removeFromParent();

        this._buffItemContent = contentView.getChildByPath("LeftView/BuffContent/ScrollView/View/Content");
        this._buffItem = this._buffItemContent.getChildByPath("Item");
        this._buffItem.removeFromParent();

        this._rewardItemContent = contentView.getChildByPath("LeftView/RewardContent/ScrollView/View/Content");
        this._rewardItem = this._rewardItemContent.getChildByPath("Item");
        this._rewardItem.removeFromParent();

        this._conditionItemContent = contentView.getChildByPath("RightView/ScrollView/View/Content");
        this._conditionItem = this._conditionItemContent.getChildByPath("Item");
        this._conditionItem.removeFromParent();

        for (let i = 0; i < this._clevelDatas.length; i++) {
            const clevelData = this._clevelDatas[i];
            const clevelItem = instantiate(this._clevelItem);
            this._cLevelItemContent.addChild(clevelItem);

            for (let j = 1; j <= 6; j++) {
                clevelItem.getChildByPath("Icon/icon_" + j).active = clevelData.bigClass == j;
            }
            for (let j = 1; j <= 5; j++) {
                clevelItem.getChildByPath("level/img_" + j).active = clevelData.smallClass == j;
            }
            clevelItem.getComponent(Button).clickEvents[0].customEventData = i.toString();
        }
        this._cLevelItemContent.getComponent(Layout).updateLayout();

        this._refreshUI();
        this._refreshConditionUI();
    }

    protected viewDidStart(): void {
        super.viewDidStart();
    }

    protected viewPopAnimation(): boolean {
        return true;
    }

    protected contentView(): Node {
        return this.node.getChildByPath("Content");
    }

    private async _refreshUI() {
        if (this._curSelectLevel - 1 < 0 || this._curSelectLevel - 1 > this._cLevelItemContent.children.length - 1) {
            return;
        }

        // clevel item
        this._curLevelTitle.string = this._curSelectLevel + "";

        const clevelItemContentLayout = this._cLevelItemContent.getComponent(Layout);
        this._cLevelItemContent.position = v3(
            (this._curSelectLevel - 1) * (-clevelItemContentLayout.spacingX - this._clevelItem.getComponent(UITransform).width),
            this._cLevelItemContent.position.y,
            this._cLevelItemContent.position.z
        );

        for (let i = 0; i < this._cLevelItemContent.children.length; i++) {
            const item = this._cLevelItemContent.children[i];
            item.getChildByPath("img_GradeBg_Select").active = i + 1 == this._curSelectLevel;
            item.getChildByPath("img_GradeBg").active = i + 1 != this._curSelectLevel;
        }

        // progress
        const curcLevelItemView = this._cLevelItemContent.children[DataMgr.s.userInfo.data.level - 1];
        if (curcLevelItemView != undefined) {
            const progressTransform = this._clevelProgress.getComponent(UITransform);
            this._clevelProgress.progress = Math.min(
                1,
                Math.max(0, progressTransform.convertToNodeSpaceAR(curcLevelItemView.worldPosition).x / progressTransform.width)
            );
        }

        // buff
        const curcLevelBuff = this._clevelDatas[DataMgr.s.userInfo.data.level - 1]?.buffs;
        if (curcLevelBuff != undefined) {
            this._buffItemContent.destroyAllChildren();
            for (let i = 0; i < this._clevelDatas[this._curSelectLevel - 1].buffs.length; i++) {
                const buff = this._clevelDatas[this._curSelectLevel - 1].buffs[i];
                const buffItem = instantiate(this._buffItem);

                this._buffItemContent.addChild(buffItem);
                buffItem.getChildByPath("Title").getComponent(Label).string = LanMgr.getLanById(buff.title);

                let curcLevelBuffValue: number = -1;
                for (const temp of curcLevelBuff) {
                    if (temp.type == buff.type) {
                        curcLevelBuffValue = temp.value;
                        break;
                    }
                }
                let color: Color = null;
                let gapValue: number = -1;
                if (curcLevelBuffValue == -1) {
                    gapValue = buff.value;
                    color = new Color().fromHEX("#8EDA61");
                } else {
                    gapValue = buff.value - curcLevelBuffValue;
                    if (gapValue < 0) {
                        color = new Color().fromHEX("#FF5353");
                    } else if (gapValue == 0) {
                        color = new Color().fromHEX("#F3E4B1");
                    } else {
                        color = new Color().fromHEX("#8EDA61");
                    }
                }

                buffItem.getChildByPath("Value").getComponent(Label).string = gapValue.toString();
                buffItem.getChildByPath("Value").getComponent(Label).color = color;

                buffItem.getChildByPath("Line").active = i != 0;
            }
        }
        this._buffItemContent.getComponent(Layout).updateLayout();

        // reward
        this._rewardItemContent.destroyAllChildren();
        for (let i = 0; i < this._clevelDatas[this._curSelectLevel - 1].rewards.length; i++) {
            const reward = this._clevelDatas[this._curSelectLevel - 1].rewards[i];
            const config = ItemConfig.getById(reward.type);
            if (config == null) {
                continue;
            }
            const rewardItem = instantiate(this._rewardItem);

            this._rewardItemContent.addChild(rewardItem);

            for (let j = 1; j <= 5; j++) {
                rewardItem.getChildByPath("Level" + j).active = j == config.grade;
            }
            rewardItem.getChildByPath("Icon").getComponent(Sprite).spriteFrame = await ItemMgr.getItemIcon(config.icon);
            rewardItem.getChildByPath("Num/Value").getComponent(Label).string = reward.num.toString();
        }
        this._rewardItemContent.getComponent(Layout).updateLayout();

        // get reward button
        let isGetted: boolean = false;

        this.node.getChildByPath("Content/LeftView/RewardContent/ReceiveButton").getComponent(Button).interactable =
            !isGetted && DataMgr.s.userInfo.data.level >= this._curSelectLevel;
        this.node.getChildByPath("Content/LeftView/RewardContent/ReceiveButton").getComponent(Sprite).grayscale =
            isGetted || DataMgr.s.userInfo.data.level < this._curSelectLevel;
    }

    private _refreshConditionUI() {
        const maxTip = this.node.getChildByPath("Content/RightView/MaxTip");
        const conditionView = this.node.getChildByPath("Content/RightView/ScrollView");

        const conditions = this._clevelDatas[DataMgr.s.userInfo.data.level + 1]?.conditions;
        if (conditions == undefined) {
            maxTip.active = true;
            conditionView.active = false;
            return;
        }

        maxTip.active = false;
        conditionView.active = true;

        let isAllConditionFinish: boolean = false;

        const colorBegin: string = "<color=#F3E4B1>";
        const colorEnd: string = "</color>";
        for (let i = 0; i < conditions.length; i++) {
            const condition = conditions[i];
            const conditionItem = instantiate(this._conditionItem);

            this._conditionItemContent.addChild(conditionItem);

            conditionItem.getChildByPath("Title").getComponent(RichText).string = LanMgr.replaceLanById(condition.title, [
                colorBegin + condition.subValue + colorEnd,
                colorBegin + condition.value + colorEnd,
            ]);

            conditionItem.getChildByPath("ProgressBar").getComponent(ProgressBar).progress = 1 / condition.value;

            let isFinish: boolean = i != 0;
            if (isFinish) {
                conditionItem.getChildByPath("CommonBg").active = false;
                conditionItem.getChildByPath("CompleteBg").active = true;
            } else {
                conditionItem.getChildByPath("CommonBg").active = true;
                conditionItem.getChildByPath("CompleteBg").active = false;

                conditionItem.getChildByPath("CommonBg/Progress/Total").getComponent(Label).string = condition.value.toString();
                conditionItem.getChildByPath("CommonBg/Progress/Value").getComponent(Label).string = "1";
            }
        }
        this._conditionItemContent.getComponent(Layout).updateLayout();

        this.node.getChildByPath("Content/DevelopButton").getComponent(Button).interactable = isAllConditionFinish;
        this.node.getChildByPath("Content/DevelopButton").getComponent(Sprite).grayscale = !isAllConditionFinish;
    }

    //------------------------------ action
    private onTapClevelItem(event: Event, customEventData: string) {
        const index = parseInt(customEventData);
        this._curSelectLevel = index + 1;
        this._refreshUI();
    }

    private onTapReceive() {}

    private onTapDevelop() {}

    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }
}
