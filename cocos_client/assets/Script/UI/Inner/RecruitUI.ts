import { _decorator, Component, instantiate, Label, Layout, Node, ProgressBar, Slider } from 'cc';
import CommonTools from '../../Tool/CommonTools';
import { ResourceCorrespondingItem } from '../../Const/ConstDefine';
import { ItemMgr, LanMgr, UserInfoMgr } from '../../Utils/Global';
import ViewController from '../../BasicView/ViewController';
import { UIHUDController } from '../UIHUDController';
import NotificationMgr from '../../Basic/NotificationMgr';
import { NotificationName } from '../../Const/Notification';
import InnerBuildingLvlUpConfig from '../../Config/InnerBuildingLvlUpConfig';
import { InnerBuildingType } from '../../Const/BuildingDefine';
import ItemData from '../../Const/Item';
import UIPanelManger from '../../Basic/UIPanelMgr';
const { ccclass, property } = _decorator;

@ccclass('RecruitUI')
export class RecruitUI extends ViewController {

    public refreshUI(initSelectGenerate: boolean = false) {
        const barrackBuildingData = UserInfoMgr.innerBuilds.get(InnerBuildingType.Barrack);
        if (barrackBuildingData == null) {
            return;
        }

        if (initSelectGenerate) {
            this._selectGenerateNum = Math.min(this._currentGenerateMaxNum(), 1);
        }

        // useLanMgr
        // this.node.getChildByPath("__ViewContent/title").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("__ViewContent/current_res/title").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("__ViewContent/recruiting/title").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("__ViewContent/footer/time/txt").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("__ViewContent/footer/Button/Label").getComponent(Label).string = LanMgr.getLanById("107549");

        const currentTroops: number = ItemMgr.getOwnItemCount(ResourceCorrespondingItem.Troop);
        

        this._totalTroop.string = this._maxTroop.toString();
        this._currentTroop.string = currentTroops.toString();
        this._totalTroopProgress.progress = currentTroops / this._maxTroop;

        this.scheduleOnce(() => {
            this._generateProgress.progress = this._selectGenerateNum / this._maxRecruitTroop;
        });
        this._generateSlider.progress = this._selectGenerateNum / this._maxRecruitTroop;
        this._generateMaxTroop.string = this._maxRecruitTroop.toString();
        this._generateSelectTroop.string = this._selectGenerateNum.toString();
        this._generateMaxTroop.node.getParent().getComponent(Layout).updateLayout();

        this._generateTimeNum = Math.ceil(this._perTroopTime * this._selectGenerateNum);
        this._generateTime.string = CommonTools.formatSeconds(this._generateTimeNum);

        if (this._costShowItems.length == this._costDatas.length) {
            for (let i = 0; i < this._costShowItems.length; i++) {
                const view = this._costShowItems[i];
                view.getChildByPath("Num/left").getComponent(Label).string = (this._costDatas[i].count * this._selectGenerateNum).toString();
                view.getChildByPath("Num/right").getComponent(Label).string = ItemMgr.getOwnItemCount(this._costDatas[i].itemConfigId).toString();
            }
        } else {
            for (const cost of this._costDatas) {
                const view = instantiate(this._costItem);
                view.active = true;
                view.setParent(this._costItem.parent);
                view.getChildByPath("Icon/8001").active = cost.itemConfigId == ResourceCorrespondingItem.Food;
                view.getChildByPath("Icon/8002").active = cost.itemConfigId == ResourceCorrespondingItem.Wood;
                view.getChildByPath("Icon/8003").active = cost.itemConfigId == ResourceCorrespondingItem.Stone;
                view.getChildByPath("Icon/8004").active = cost.itemConfigId == ResourceCorrespondingItem.Troop;
                view.getChildByPath("Num/right").getComponent(Label).string = (cost.count * this._selectGenerateNum).toString();
                view.getChildByPath("Num/left").getComponent(Label).string = ItemMgr.getOwnItemCount(cost.itemConfigId).toString();
                this._costShowItems.push(view);
            }
        }
    }

    private _perTroopTime: number = 0.001;
    private _costDatas: ItemData[] = [];
    private _maxTroop: number = 0;
    private _maxRecruitTroop: number = 0;

    private _selectGenerateNum: number = 0;
    private _generateTimeNum: number = 0;

    private _totalTroopProgress: ProgressBar = null;
    private _currentTroop: Label = null;
    private _totalTroop: Label = null;

    private _generateProgress: ProgressBar = null;
    private _generateSlider: Slider = null;
    private _generateMaxTroop: Label = null;
    private _generateSelectTroop: Label = null;

    private _generateTime: Label = null;
    private _costItem: Node = null;
    private _costShowItems: Node[] = [];
    protected viewDidLoad(): void {
        super.viewDidLoad();

        const barrackBuildingData = UserInfoMgr.innerBuilds.get(InnerBuildingType.Barrack);
        if (barrackBuildingData == null) {
            return;
        }
        this._costDatas = [];
        const configCost = InnerBuildingLvlUpConfig.getBuildingLevelData(barrackBuildingData.buildLevel, "rec_cost_barr");
        if (configCost != null) {
            const temple = JSON.parse(configCost);
            for (const data of temple) {
                this._costDatas.push(new ItemData(data[0].toString(), data[1]));
            }
        }
        // maxNum
        this._maxTroop = 9999999;
        const configMaxTroop = InnerBuildingLvlUpConfig.getBuildingLevelData(barrackBuildingData.buildLevel, "max_barr");
        if (configMaxTroop != null) {
            this._maxTroop = configMaxTroop;
        }
        // perGenerateNum
        const configPerGenerateNum = InnerBuildingLvlUpConfig.getBuildingLevelData(barrackBuildingData.buildLevel, "time_barr");
        if (configPerGenerateNum != null) {
            this._perTroopTime = configPerGenerateNum;
        }
        this._maxRecruitTroop = this._maxTroop - ItemMgr.getOwnItemCount(ResourceCorrespondingItem.Troop);

        this._totalTroopProgress = this.node.getChildByPath("__ViewContent/ProgressBar").getComponent(ProgressBar);
        this._currentTroop = this.node.getChildByPath("__ViewContent/current_res/num/cur").getComponent(Label);
        this._totalTroop = this.node.getChildByPath("__ViewContent/current_res/num/max").getComponent(Label);

        this._generateProgress = this.node.getChildByPath("__ViewContent/recruiting/scroll/ProgressBar").getComponent(ProgressBar);
        this._generateSlider = this._generateProgress.node.getChildByPath("Slider").getComponent(Slider);
        this._generateMaxTroop = this.node.getChildByPath("__ViewContent/recruiting/control/num/max").getComponent(Label);
        this._generateSelectTroop = this.node.getChildByPath("__ViewContent/recruiting/control/num/cur").getComponent(Label);


        this._generateTime = this.node.getChildByPath("__ViewContent/footer/time/txt-001").getComponent(Label);
        this._costItem = this.node.getChildByPath("__ViewContent/footer/material/Item");
        this._costItem.active = false;

        NotificationMgr.addListener(NotificationName.CHANGE_LANG, this.changeLang, this);
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.CHANGE_LANG, this.changeLang, this);
    }

    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByPath("__ViewContent");
    }


    changeLang(): void {
        if (this.node.active === false) return;
        this.refreshUI();
    }

    private _currentGenerateMaxNum(): number {
        let tempUseNum: number = 999999999;
        for (const cost of this._costDatas) {
            tempUseNum = Math.min(
                tempUseNum,
                ItemMgr.getOwnItemCount(cost.itemConfigId) / cost.count,
                this._maxRecruitTroop
            );
        }
        return Math.floor(tempUseNum);
    }

    //---------------------------------- action

    private async onTapClose() {
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel();
    }

    private onTapGenerateMax() {
        const maxTroop: number = this._currentGenerateMaxNum();
        if (maxTroop != this._selectGenerateNum) {
            this._selectGenerateNum = maxTroop;
            this.refreshUI();
        }
    }
    private onTapGenerateSub() {
        const maxTroop: number = this._currentGenerateMaxNum();
        const minNum: number = Math.min(1, maxTroop);
        let changedNum = Math.max(minNum, this._selectGenerateNum - 100);
        if (changedNum != this._selectGenerateNum) {
            this._selectGenerateNum = changedNum;
            this.refreshUI();
        }
    }
    private onTapGenerateAdd() {
        const maxTroop: number = this._currentGenerateMaxNum();
        const changedNum = Math.min(this._selectGenerateNum + 100, maxTroop);
        if (changedNum != this._selectGenerateNum) {
            this._selectGenerateNum = changedNum;
            this.refreshUI();
        }
    }
    private onGenerateSlided(event: Event, customEventData: string) {
        const maxTroop: number = this._currentGenerateMaxNum();
        const currentSelectTroop: number = Math.max(1, Math.min(Math.floor(this._generateSlider.progress * this._maxRecruitTroop), maxTroop));

        this._generateSlider.progress = currentSelectTroop / this._maxRecruitTroop;
        if (currentSelectTroop != this._selectGenerateNum) {
            this._selectGenerateNum = currentSelectTroop;
            this.refreshUI();
        }
    }

    private async onTapGenerate() {
        if (this._generateTimeNum <= 0) {
            // useLanMgr
            // LanMgr.getLanById("107549")
            UIHUDController.showCenterTip("Unable to produce");
            return;
        }
        for (const cost of this._costDatas) {
            ItemMgr.subItem(cost.itemConfigId, cost.count * this._selectGenerateNum);
        }
        UserInfoMgr.beginGenerateTroop(this._generateTimeNum, this._selectGenerateNum);

        await this.playExitAnimation();
        UIPanelManger.inst.popPanel();
    }
}


