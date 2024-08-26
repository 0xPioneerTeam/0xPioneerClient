import {
    _decorator,
    Component,
    Node,
    instantiate,
    director,
    BoxCharacterController,
    Label,
    Layout,
    UITransform,
    ProgressBar,
    Button,
    tween,
    v3,
    Details,
} from "cc";
import { HUDName, UIName } from "../Const/ConstUIDefine";
import { UIHUDController } from "./UIHUDController";
import { BoxInfoConfigData } from "../Const/BoxInfo";
import UIPanelManger, { UIPanelLayerType } from "../Basic/UIPanelMgr";
import { DataMgr } from "../Data/DataMgr";
import ConfigConfig from "../Config/ConfigConfig";
import {
    BoxNumByHeatParam,
    ConfigType,
    ExploreForOneBoxParam,
    PerNumSelectBoxParam,
    PiotToHeatCoefficientParam,
    WorldBoxThresholdParam,
} from "../Const/Config";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
import { RookieStep } from "../Const/RookieDefine";
import { NetworkMgr } from "../Net/NetworkMgr";
import { ResourceCorrespondingItem } from "../Const/ConstDefine";
import { share } from "../Net/msg/WebsocketMsg";
import { AlterView } from "./View/AlterView";
import { LanMgr } from "../Utils/Global";
const { ccclass, property } = _decorator;

@ccclass("HeatTreasureUI")
export class HeatTreasureUI extends Component {
    private _openIndex: number = -1;
    private _commonCostPiotNum: number = 1;

    private _boxContent: Node = null;
    private _boxItem: Node = null;

    protected onLoad(): void {
        this._boxContent = this.node.getChildByPath("__ViewContent/Content/ProgressBar/BoxContent");
        this._boxItem = this._boxContent.getChildByPath("Treasure");
        this._boxItem.removeFromParent();

        NotificationMgr.addListener(NotificationName.USERINFO_DID_CHANGE_TREASURE_PROGRESS, this._refreshUI, this);
        NotificationMgr.addListener(NotificationName.USERINFO_DID_CHANGE_HEAT, this._onHeatChange, this);
        NotificationMgr.addListener(NotificationName.USERINFO_BOX_INFO_CHANGE, this._refreshUI, this);

        NotificationMgr.addListener(NotificationName.USERINFO_ROOKE_STEP_CHANGE, this._refreshUI, this);
        NotificationMgr.addListener(NotificationName.ROOKIE_GUIDE_TAP_HEAT_CONVERT, this._onRookieConvertHeat, this);
        NotificationMgr.addListener(NotificationName.ROOKIE_GUIDE_TAP_HEAT_BOX, this._onRookieTapBox, this);
    }
    protected start(): void {
        this._refreshUI();
    }

    protected onDestroy(): void {
        NotificationMgr.removeListener(NotificationName.USERINFO_DID_CHANGE_TREASURE_PROGRESS, this._refreshUI, this);
        NotificationMgr.removeListener(NotificationName.USERINFO_DID_CHANGE_HEAT, this._onHeatChange, this);
        NotificationMgr.removeListener(NotificationName.USERINFO_BOX_INFO_CHANGE, this._refreshUI, this);

        NotificationMgr.removeListener(NotificationName.USERINFO_ROOKE_STEP_CHANGE, this._refreshUI, this);
        NotificationMgr.removeListener(NotificationName.ROOKIE_GUIDE_TAP_HEAT_CONVERT, this._onRookieConvertHeat, this);
        NotificationMgr.removeListener(NotificationName.ROOKIE_GUIDE_TAP_HEAT_BOX, this._onRookieTapBox, this);
    }

    update(deltaTime: number) {}

    private _refreshUI() {
        const rookieStep: RookieStep = DataMgr.s.userInfo.data.rookieStep;

        const treasureProgressView = this.node.getChildByPath("__ViewContent/Content/ProgressBar");
        const detailButton = this.node.getChildByPath("__ViewContent/Content/DetailButton");
        const questionButton = this.node.getChildByPath("__ViewContent/Content/QuestionButton");

        treasureProgressView.active = false;
        detailButton.active = false;
        questionButton.active = false;

        // if (rookieStep >= RookieStep.NPC_TALK_4) {
        //     treasureProgressView.active = true;
        //     questionButton.active = true;
        // }
        //------------------------------------------ heat
        const heatValue: number = DataMgr.s.userInfo.data.heatValue.currentHeatValue;
        const worldBoxThreshold: number[] = (ConfigConfig.getConfig(ConfigType.WorldBoxThreshold) as WorldBoxThresholdParam).thresholds;
        const beginPointerValue: number = 113;
        const endPointerValue: number = -113;
        const maxHeatThreshold: number = worldBoxThreshold[worldBoxThreshold.length - 1];

        const pointerView = this.node.getChildByPath("__ViewContent/Content/HeatProgress/Pointer");
        const heatValueView = this.node.getChildByPath("__ViewContent/Content/HeatProgress/HeatValue");
        const heatAnimView = this.node.getChildByPath("__ViewContent/Content/HeatProgress/HeatAnim");
        const gapNum: number = 5;
        const perThreshold = 1 / gapNum;
        let angleValue: number = 0;
        let heatLevel: number = gapNum - 1;
        let nextLevelNeedHeat: number = maxHeatThreshold;
        for (let i = 0; i < gapNum; i++) {
            let beginNum: number = 0;
            let endNum: number = 0;
            if (worldBoxThreshold[i - 1] != undefined) {
                beginNum = worldBoxThreshold[i - 1];
            }
            endNum = worldBoxThreshold[i];

            if (heatValue > endNum) {
                angleValue += perThreshold;
            } else if (heatValue <= endNum) {
                angleValue += (perThreshold * (heatValue - beginNum)) / (endNum - beginNum);
                heatLevel = i;
                break;
            }
        }
        if (heatLevel + 1 < worldBoxThreshold.length) {
            nextLevelNeedHeat = worldBoxThreshold[heatLevel + 1];
        }
        pointerView.angle = beginPointerValue + (endPointerValue - beginPointerValue) * Math.min(1, angleValue);
        // next level cost piot
        if (nextLevelNeedHeat == maxHeatThreshold) {
            this._commonCostPiotNum = 0;
        } else {
            this._commonCostPiotNum = Math.ceil(
                (nextLevelNeedHeat - heatValue) / (ConfigConfig.getConfig(ConfigType.PiotToHeatCoefficient) as PiotToHeatCoefficientParam).coefficient
            );
        }

        heatAnimView.active = false;
        if (heatValue >= maxHeatThreshold) {
            heatValueView.getChildByPath("Value").getComponent(Label).string = "Full";
            // heatAnimView.active = true;
        } else {
            heatValueView.getChildByPath("Value").getComponent(Label).string = heatValue.toString();
            heatAnimView.active = false;
        }

        //------------------------------------------ box
        let exploreValue: number = DataMgr.s.userInfo.data.exploreProgress;
        const perBoxNeedExploreValue: number = (ConfigConfig.getConfig(ConfigType.ExploreForOneBox) as ExploreForOneBoxParam).value;
        const boxThreshold: number[] = (ConfigConfig.getConfig(ConfigType.BoxNumByHeat) as BoxNumByHeatParam).thresholds;
        const maxBoxNum: number = boxThreshold[heatLevel];

        let isFinishRookie: boolean = rookieStep == RookieStep.FINISH;
        let worldBoxes: { rank: number; isOpen: boolean }[] = [];
        if (isFinishRookie) {
            const boxInfo: share.box_data[] = DataMgr.s.userInfo.data.boxes;
            for (let i = 0; i < maxBoxNum; i++) {
                if (boxInfo[i] == undefined) {
                    worldBoxes.push({
                        rank: 0,
                        isOpen: false,
                    });
                } else {
                    let tempRank: number = 1;
                    if (boxInfo[i].id == "90001") {
                        tempRank = 1;
                    } else if (boxInfo[i].id == "90002") {
                        tempRank = 2;
                    } else if (boxInfo[i].id == "90003") {
                        tempRank = 3;
                    } else if (boxInfo[i].id == "90004") {
                        tempRank = 4;
                    } else if (boxInfo[i].id == "90005") {
                        tempRank = 5;
                    }
                    worldBoxes.push({
                        rank: tempRank,
                        isOpen: boxInfo[i].opened,
                    });
                }
            }
        } else {
            // if (rookieStep >= RookieStep.OPEN_BOX_3) {
            //     exploreValue = perBoxNeedExploreValue * 3;
            // } else if (rookieStep >= RookieStep.OPEN_BOX_2) {
            //     exploreValue = perBoxNeedExploreValue * 2;
            // } else if (rookieStep >= RookieStep.NPC_TALK_4) {
            //     exploreValue = perBoxNeedExploreValue;
            // }

            // if (rookieStep > RookieStep.OPEN_BOX_3) {
            //     worldBoxes = [
            //         { rank: 1, isOpen: true },
            //         { rank: 1, isOpen: true },
            //         { rank: 1, isOpen: true },
            //     ];
            // } else if (rookieStep > RookieStep.OPEN_BOX_2) {
            //     worldBoxes = [
            //         { rank: 1, isOpen: true },
            //         { rank: 1, isOpen: true },
            //         { rank: 1, isOpen: false },
            //     ];
            // } else if (rookieStep > RookieStep.OPEN_BOX_1) {
            //     worldBoxes = [
            //         { rank: 1, isOpen: true },
            //         { rank: 1, isOpen: false },
            //         { rank: 1, isOpen: false },
            //     ];
            // } else {
            //     worldBoxes = [
            //         { rank: 0, isOpen: false },
            //         { rank: 0, isOpen: false },
            //         { rank: 0, isOpen: false },
            //     ];
            // }
        }
        const exploreTotalValue: number = perBoxNeedExploreValue * worldBoxes.length;

        const boxContentWidth: number = this._boxContent.getComponent(UITransform).width;
        this.node.getChildByPath("__ViewContent/Content/ProgressBar").getComponent(ProgressBar).progress = Math.min(1, exploreValue / exploreTotalValue);

        this._boxContent.removeAllChildren();
        const perNumSelectBox: number = (ConfigConfig.getConfig(ConfigType.PerNumSelectBox) as PerNumSelectBoxParam).value;
        this._openIndex = -1;
        for (let i = 0; i < worldBoxes.length; i++) {
            let isSelectBox: boolean = (i + 1) % perNumSelectBox == 0;
            let rank = worldBoxes[i].rank;
            const getted = worldBoxes[i].isOpen;
            const canGet = exploreValue >= (i + 1) * perBoxNeedExploreValue && !getted;
            if (rookieStep != RookieStep.FINISH) {
                rank = canGet ? 1 : 0;
            }

            let item = instantiate(this._boxItem);
            item.name = "HEAT_TREASURE_" + i;
            item.setParent(this._boxContent);

            for (let j = 0; j <= 5; j++) {
                item.getChildByPath("Treasure_box_" + j).active = false;
            }
            item.getChildByPath("Treasure_box_select").active = false;

            item.getChildByPath("Treasure_box_empty").active = false;
            item.getChildByPath("Treasure_box_select_empty").active = false;

            if (getted) {
                if (isSelectBox) {
                    item.getChildByPath("Treasure_box_select_empty").active = true;
                } else {
                    item.getChildByPath("Treasure_box_empty").active = true;
                }
            } else {
                let treasureView = null;
                if (isSelectBox) {
                    treasureView = item.getChildByPath("Treasure_box_select");
                } else {
                    treasureView = item.getChildByPath("Treasure_box_" + rank);
                }
                if (treasureView != null) {
                    treasureView.active = true;
                    treasureView.getChildByName("Common").active = exploreValue < (i + 1) * perBoxNeedExploreValue;
                    treasureView.getChildByName("Light").active = exploreValue >= (i + 1) * perBoxNeedExploreValue;
                    if (canGet) {
                        if (treasureView["actiontween"] == null) {
                            treasureView["actiontween"] = tween()
                                .target(treasureView)
                                .repeatForever(
                                    tween().sequence(
                                        tween().by(0.05, { position: v3(0, 10, 0) }),
                                        tween().by(0.1, { position: v3(0, -20, 0) }),
                                        tween().by(0.1, { position: v3(0, 20, 0) }),
                                        tween().by(0.05, { position: v3(0, -10, 0) }),
                                        tween().delay(1)
                                    )
                                )
                                .start();
                        }
                    } else {
                        if (treasureView["actiontween"] != null) {
                            treasureView["actiontween"].stop();
                        }
                    }
                }
            }
            item.getComponent(Button).clickEvents[0].customEventData = i.toString();
            item.getComponent(Button).interactable = canGet;
            item.setPosition(v3(-boxContentWidth / 2 + (boxContentWidth / worldBoxes.length) * (i + 1), 0, 0));
            if (canGet && this._openIndex == -1) {
                this._openIndex = i;
            }
        }
    }

    //------------------------------------------ action
    private async onTapBoxItem(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const index = parseInt(customEventData);
        if (index != this._openIndex) {
            return;
        }
        if (DataMgr.s.userInfo.data.rookieStep == RookieStep.FINISH) {
            NetworkMgr.websocketMsg.player_worldbox_open({
                boxIndex: index,
            });
        } else {
            // rookie get box
            NetworkMgr.websocketMsg.player_worldbox_beginner_open({
                boxIndex: index,
            });
        }
    }
    private async onTapConvertPiotToHeat() {
        if (this._commonCostPiotNum == 0) {
            //useLanMgr
            UIHUDController.showCenterTip("Piot has reached the maximum value");
            return;
        }
        const piotNum: number = DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Gold);
        const coefficient: number = (ConfigConfig.getConfig(ConfigType.PiotToHeatCoefficient) as PiotToHeatCoefficientParam).coefficient;
        if (piotNum * coefficient < 1) {
            //useLanMgr
            UIHUDController.showCenterTip("Please get more PIOT");
            return;
        }
        const costPiotNum: number = Math.min(this._commonCostPiotNum, piotNum);
        
        const result = await UIPanelManger.inst.pushPanel(HUDName.Alter, UIPanelLayerType.HUD);
        if (!result.success) {
            return;
        }
        result.node.getComponent(AlterView).showTip(LanMgr.replaceLanById("104005", [costPiotNum]), () => {
            NetworkMgr.websocketMsg.player_piot_to_heat({
                piotNum: costPiotNum,
            });
        });
    }
    private onTapDetail() {
        GameMusicPlayMgr.playTapButtonEffect();
    }
    private onTapQuestion() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.pushPanel(UIName.WorldTreasureTipUI);
    }

    //----------------------------------- notification
    private _onHeatChange() {
        // const rookieStep = DataMgr.s.userInfo.data.rookieStep;
        const heatAnimView = this.node.getChildByPath("__ViewContent/Content/HeatProgress/HeatAnim");
        let delayTime: number = 1.5;
        if (heatAnimView.active) {
            delayTime = 0;
        }
        // heatAnimView.active = true;
        delayTime = 0;
        this.scheduleOnce(() => {
            this._refreshUI();
            // if (DataMgr.s.userInfo.data.rookieStep == RookieStep.PIOT_TO_HEAT) {
            //     this.scheduleOnce(() => {
            //         DataMgr.s.userInfo.data.rookieStep = RookieStep.NPC_TALK_4;
            //         NotificationMgr.triggerEvent(NotificationName.USERINFO_ROOKE_STEP_CHANGE);
            //     }, 0.2);
            // }
        }, delayTime);
    }

    private _onRookieConvertHeat() {
        this.onTapConvertPiotToHeat();
    }
    private _onRookieTapBox(data: { tapIndex: string }) {
        if (data == null || data.tapIndex == null) {
            return;
        }
        this.onTapBoxItem(null, data.tapIndex);
    }
}
