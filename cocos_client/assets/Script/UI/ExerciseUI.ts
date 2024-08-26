import { EventTouch, instantiate, Label, Layout, ProgressBar, Slider, tween, v3 } from "cc";
import { _decorator, Component, Node } from "cc";
import UIPanelManger from "../Basic/UIPanelMgr";
import ViewController from "../BasicView/ViewController";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
import { PlayerInfoItem } from "./View/PlayerInfoItem";
import InnerBuildingLvlUpConfig from "../Config/InnerBuildingLvlUpConfig";
import { DataMgr } from "../Data/DataMgr";
import { InnerBuildingType } from "../Const/BuildingDefine";
import { ResourceCorrespondingItem } from "../Const/ConstDefine";
import { TroopExerciseObject } from "../Const/TroopsDefine";
import TroopsConfig from "../Config/TroopsConfig";
import { LanMgr } from "../Utils/Global";
import { ResItemUI } from "./ResItemUI";
import CommonTools from "../Tool/CommonTools";
import { share, WebsocketMsg } from "../Net/msg/WebsocketMsg";
import { NetworkMgr } from "../Net/NetworkMgr";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import ManualNestedScrollView from "../BasicView/ManualNestedScrollView";
const { ccclass, property } = _decorator;

@ccclass("ExerciseUI")
export class ExerciseUI extends ViewController {
    private _maxTroopNum: number = 0;
    private _maxExerciseNum: number = 0;
    private _exerciseData: TroopExerciseObject[] = [];
    private _totalCostData: [string, number][] = [];

    private _holdTime: number = 0;
    private _holdLimitTrigger: boolean = false;
    private _holdInterval: number = null;

    private _title: Label = null;

    private _timeLabel: Label = null;
    private _current_res_cur: Label;
    private _current_res_max: Label;

    private _itemScrollView: ManualNestedScrollView = null;
    private _list_Content: Node;
    private _exerciseItem: Node;

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._title = this.node.getChildByPath("__ViewContent/title").getComponent(Label);
        const contentView = this.node.getChildByPath("__ViewContent");
        this._timeLabel = contentView.getChildByPath("footer/txt_timeVal").getComponent(Label);

        this._current_res_cur = contentView.getChildByPath("current_res/num/cur").getComponent(Label);
        this._current_res_max = contentView.getChildByPath("current_res/num/max").getComponent(Label);

        this._itemScrollView = contentView.getChildByPath("ScrollView").getComponent(ManualNestedScrollView);
        this._list_Content = contentView.getChildByPath("ScrollView/View/Content");
        this._exerciseItem = this._list_Content.getChildByPath("ExercoseItem");
        this._list_Content.removeAllChildren();

        const recruitLevel = DataMgr.s.innerBuilding.getInnerBuildingLevel(InnerBuildingType.Barrack);
        const traningLevel = DataMgr.s.innerBuilding.getInnerBuildingLevel(InnerBuildingType.TrainingCenter);

        this._maxTroopNum = 9999999;
        const configMaxTroop = InnerBuildingLvlUpConfig.getBuildingLevelData(recruitLevel, "max_barr");
        if (configMaxTroop != null) {
            this._maxTroopNum = configMaxTroop;
        }

        this._maxExerciseNum = 9999999;
        const configMaxExercise = InnerBuildingLvlUpConfig.getBuildingLevelData(traningLevel, "max_troops");
        if (configMaxExercise != null) {
            this._maxExerciseNum = configMaxExercise;
        }

        const unlockTroops = InnerBuildingLvlUpConfig.getUnlockTroops(traningLevel);

        this._exerciseData = [];
        let index: number = 0;
        const allConfig = TroopsConfig.getAll();
        for (const key in allConfig) {
            const config = allConfig[key];
            this._exerciseData.push({
                id: config.id,
                name: LanMgr.getLanById(config.name),
                icon: config.icon,
                locked: unlockTroops.includes(config.id),
                ownedNum: DataMgr.s.innerBuilding.getOwnedExecriseTroopNum(config.id),
                exerciseNum: 0,
                costTime: parseInt(config.time_training),
                costResource: config.rec_cost_training,
            });

            const item = instantiate(this._exerciseItem);
            item.getChildByPath("count/minus").on(Node.EventType.TOUCH_START, this.onTouchStart, this);
            item.getChildByPath("count/minus").on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
            item.getChildByPath("count/minus").on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
            item.getChildByPath("count/plus").on(Node.EventType.TOUCH_START, this.onTouchStart, this);
            item.getChildByPath("count/plus").on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
            item.getChildByPath("count/plus").on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);

            item.getChildByPath("count/ProgressBar/Slider").getComponent(Slider).slideEvents[0].customEventData = index.toString();
            item.getChildByPath("count/ProgressBar/Slider").on(Node.EventType.TOUCH_END, this.onTapSliderHandleEnd, this)
            item.getChildByPath("count/ProgressBar/Slider").on(Node.EventType.TOUCH_CANCEL, this.onTapSliderHandleEnd, this)
            item.getChildByPath("count/ProgressBar/Slider/Handle").on(Node.EventType.TOUCH_END, this.onTapSliderHandleEnd, this);
            item.getChildByPath("count/ProgressBar/Slider/Handle").on(Node.EventType.TOUCH_CANCEL, this.onTapSliderHandleEnd, this);

            item.setParent(this._list_Content);

            index += 1;
        }
        this._list_Content.getComponent(Layout).updateLayout();
    }

    protected viewDidStart(): void {
        super.viewDidStart();

        this._refreshUI();
    }

    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node | null {
        return this.node.getChildByPath("__ViewContent");
    }

    private _refreshUI() {
        let curOwnedNum: number = 0;
        let curExecriseNum: number = 0;
        for (const element of this._exerciseData) {
            curOwnedNum += element.ownedNum;
            curExecriseNum += element.exerciseNum;
        }
        let leftOwnedNum: number = this._maxExerciseNum - curOwnedNum;

        for (let i = 0; i < this._list_Content.children.length; i++) {
            const item = this._list_Content.children[i];
            const data = this._exerciseData[i];

            // own num, cost
            item.getChildByPath("Prop/Label").getComponent(Label).string = data.ownedNum + "/" + leftOwnedNum;
            if (data.exerciseNum > 0) {
                for (let j = 0; j < 2; j++) {
                    if (j < data.costResource.length) {
                        item.getChildByPath("Prop/ResItemUI" + (j + 1)).active = true;
                        item.getChildByPath("Prop/ResItemUI" + (j + 1))
                            .getComponent(ResItemUI)
                            .refreshUI([data.costResource[j][0], data.costResource[j][1] * data.exerciseNum]);
                    } else {
                        item.getChildByPath("Prop/ResItemUI" + (j + 1)).active = false;
                    }
                }
            } else {
                for (let j = 1; j <= 2; j++) {
                    item.getChildByPath("Prop/ResItemUI" + j).active = false;
                }
            }
            // icon
            for (const child of item.getChildByPath("PropEmpty").children) {
                child.active = child.name == "troops_" + data.id;
            }
            // count
            if (data.locked) {
                item.getChildByPath("count").active = true;
                item.getChildByPath("gp_lock").active = false;
                item.getChildByPath("count/lbl_cav").getComponent(Label).string = data.name;
                item.getChildByPath("count/lbl_count").getComponent(Label).string = data.exerciseNum.toString();

                let curOtherGenerateNum = 0;
                for (let k = 0; k < this._exerciseData.length; k++) {
                    if (i == k) {
                    } else {
                        curOtherGenerateNum += this._exerciseData[k].exerciseNum;
                    }
                }
                const canAddNum = Math.min(leftOwnedNum - curOtherGenerateNum, this._maxTroopNum - curOtherGenerateNum);
                if (canAddNum == 0) {
                    item.getChildByPath("count/ProgressBar").getComponent(ProgressBar).progress = 0;
                    item.getChildByPath("count/ProgressBar/Slider").getComponent(Slider).progress = 0;
                } else {
                    item.getChildByPath("count/ProgressBar").getComponent(ProgressBar).progress = data.exerciseNum / canAddNum;
                    item.getChildByPath("count/ProgressBar/Slider").getComponent(Slider).progress = data.exerciseNum / canAddNum;
                }
            } else {
                item.getChildByPath("count").active = false;
                item.getChildByPath("gp_lock").active = true;
                item.getChildByPath("gp_lock/lbl_lockInfo").getComponent(Label).string =
                    "Training Barracks unlocked at level " + InnerBuildingLvlUpConfig.getTroopLockLevel(data.id);
            }
        }

        const totalCost: Map<string, number> = new Map();
        let totalTimeCost: number = 0;
        for (const element of this._exerciseData) {
            if (element.exerciseNum <= 0) {
                continue;
            }
            for (const cost of element.costResource) {
                if (totalCost.has(cost[0])) {
                    totalCost.set(cost[0], totalCost.get(cost[0]) + cost[1] * element.exerciseNum);
                } else {
                    totalCost.set(cost[0], cost[1] * element.exerciseNum);
                }
            }
            totalTimeCost += element.costTime * element.exerciseNum;
        }
        this._totalCostData = Array.from(totalCost);
        for (let i = 0; i < 2; i++) {
            const item = this.node.getChildByPath("__ViewContent/footer/material/Item_" + i);
            if (i < this._totalCostData.length) {
                item.active = true;
                for (const child of item.getChildByPath("Icon").children) {
                    child.active = child.name == this._totalCostData[i][0];
                }
                item.getChildByPath("Num/left").getComponent(Label).string = DataMgr.s.item.getObj_item_count(this._totalCostData[i][0]).toString();
                item.getChildByPath("Num/right").getComponent(Label).string = this._totalCostData[i][1].toString();
            } else {
                item.active = false;
            }
        }
        this._timeLabel.string = CommonTools.formatSeconds(totalTimeCost / 1000);

        //troop num
        this._current_res_cur.string = (DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Troop) - curExecriseNum).toString();
        this._current_res_max.string = this._maxTroopNum.toString();
        this._current_res_max.node.parent.getComponent(Layout).updateLayout();
    }

    private _updateNum(index: number, isMinus: boolean) {
        if (index < 0 || index > this._exerciseData.length - 1) {
            return;
        }
        let curOwnedNum = 0;
        let curOtherGenerateNum = 0;
        for (let i = 0; i < this._exerciseData.length; i++) {
            curOwnedNum += this._exerciseData[i].ownedNum;
            if (i == index) {
            } else {
                curOtherGenerateNum += this._exerciseData[i].exerciseNum;
            }
        }

        const data = this._exerciseData[index];
        const addMaxNum = Math.min(
            this._maxExerciseNum - curOwnedNum - curOtherGenerateNum,
            DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Troop) - curOtherGenerateNum
        );

        let changeNum = 1;
        if (this._holdTime > 4) {
            changeNum *= 100;
        } else if (this._holdTime > 2) {
            changeNum *= 10;
        }

        this._holdLimitTrigger = false;

        let updateResultNum = data.exerciseNum;
        if (!isMinus) {
            updateResultNum += changeNum;
        } else {
            updateResultNum -= changeNum;
        }
        updateResultNum = Math.min(Math.max(0, updateResultNum), addMaxNum);
        if (data.exerciseNum != updateResultNum) {
            data.exerciseNum = updateResultNum;
            this._refreshUI();
        }
    }

    //--------------------------------- action
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
        DataMgr.s.userInfo.changeExerciseRedPoint(false);
    }

    private async onTapGenerate() {
        GameMusicPlayMgr.playTapButtonEffect();

        const traingData: share.Itraining_data[] = [];
        for (const element of this._exerciseData) {
            if (element.exerciseNum <= 0) {
                continue;
            }
            traingData.push({
                id: element.id,
                num: element.exerciseNum,
            });
        }
        if (traingData.length <= 0) {
            // userLang LanMgr.replaceLanById("104005"
            NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, "Quantity cannot be less than 0");
            return;
        }

        let enoughResource: boolean = true;
        for (const cost of this._totalCostData) {
            if (DataMgr.s.item.getObj_item_count(cost[0]) < cost[1]) {
                enoughResource = false;
                break;
            }
        }
        if (!enoughResource) {
            // userLang LanMgr.replaceLanById("104005"
            NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, "Insufficient resources");
            return;
        }

        NetworkMgr.websocketMsg.player_training_start({
            training: traingData,
        });
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
        DataMgr.s.userInfo.changeExerciseRedPoint(false);
    }

    private onAddSlided(event: Event, customEventData: string) {
        this._itemScrollView.forceNested = true;
        const index = parseInt(customEventData);
        if (index < 0 || index > this._list_Content.children.length - 1) {
            return;
        }
        const item = this._list_Content.children[index];
        const slider = item.getChildByPath("count/ProgressBar/Slider").getComponent(Slider);
        const progress = item.getChildByPath("count/ProgressBar").getComponent(ProgressBar);

        let curOwnedNum = 0;
        let curOtherGenerateNum = 0;
        for (let i = 0; i < this._exerciseData.length; i++) {
            curOwnedNum += this._exerciseData[i].ownedNum;
            if (i == index) {
            } else {
                curOtherGenerateNum += this._exerciseData[i].exerciseNum;
            }
        }

        const addMaxNum = Math.min(
            this._maxExerciseNum - curOwnedNum - curOtherGenerateNum,
            DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Troop) - curOtherGenerateNum
        );

        if (addMaxNum <= 0) {
            slider.progress = 0;
            progress.progress = 0;
        } else {
            progress.progress = this._exerciseData[index].exerciseNum / addMaxNum;
            const currentAddTroop: number = Math.floor(slider.progress * addMaxNum);
            if (currentAddTroop != this._exerciseData[index].exerciseNum) {
                this._exerciseData[index].exerciseNum = currentAddTroop;
                this._refreshUI();
            }
        }
    }
    private onTapSliderHandleEnd() {
        this._itemScrollView.forceNested = false;
    }

    private onTouchStart(event: EventTouch) {
        const currentButton = event.currentTarget as Node;
        this._holdTime = 0;
        this._holdLimitTrigger = true;
        tween(currentButton)
            .to(0.1, { scale: v3(0.9, 0.9, 0.9) })
            .start();

        this._holdInterval = setInterval(() => {
            this._holdTime += 0.1;

            let actionIndex: number = -1;
            for (let i = 0; this._list_Content.children.length; i++) {
                if (currentButton == this._list_Content.children[i].getChildByPath("count/" + currentButton.name)) {
                    actionIndex = i;
                    break;
                }
            }
            this._updateNum(actionIndex, currentButton.name == "minus");
        }, 100) as unknown as number;
    }
    private onTouchEnd(event: EventTouch) {
        const currentButton = event.currentTarget as Node;
        if (this._holdInterval !== null) {
            clearInterval(this._holdInterval);
            this._holdInterval = null;
        }
        this._holdTime = 0;
        tween(currentButton)
            .to(0.1, { scale: v3(1, 1, 1) })
            .start();

        if (this._holdLimitTrigger) {
            let actionIndex: number = -1;
            for (let i = 0; this._list_Content.children.length; i++) {
                if (currentButton == this._list_Content.children[i].getChildByPath("count/" + currentButton.name)) {
                    actionIndex = i;
                    break;
                }
            }
            this._updateNum(actionIndex, currentButton.name == "minus");
        }
    }
}
