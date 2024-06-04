import { _decorator, Component, Node, instantiate, director, BoxCharacterController, Label, Layout, UITransform, ProgressBar, Button, tween, v3 } from "cc";
import { LanMgr } from "../Utils/Global";
import { UIName } from "../Const/ConstUIDefine";
import { TreasureGettedUI } from "./TreasureGettedUI";
import { UIHUDController } from "./UIHUDController";
import BoxInfoConfig from "../Config/BoxInfoConfig";
import { BoxInfoConfigData } from "../Const/BoxInfo";
import UIPanelManger from "../Basic/UIPanelMgr";
import { DataMgr } from "../Data/DataMgr";
import ArtifactData from "../Model/ArtifactData";
import { NetworkMgr } from "../Net/NetworkMgr";
import ItemData from "../Const/Item";
import ViewController from "../BasicView/ViewController";
import ConfigConfig from "../Config/ConfigConfig";
import { ConfigType, WorldBoxThresholdParam } from "../Const/Config";
import CommonTools from "../Tool/CommonTools";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
const { ccclass, property } = _decorator;

@ccclass("HeatTreasureUI")
export class HeatTreasureUI extends Component {
    private _maxthreshold: number = 0;

    private _boxContent: Node = null;
    private _boxItem: Node = null;

    protected onLoad(): void {
        this._boxContent = this.node.getChildByPath("__ViewContent/Content/ProgressBar/BoxContent");
        this._boxItem = this._boxContent.getChildByPath("Treasure");
        this._boxItem.removeFromParent();

        NotificationMgr.addListener(NotificationName.USERINFO_DID_CHANGE_TREASURE_PROGRESS, this._refreshUI, this);
        NotificationMgr.addListener(NotificationName.USERINFO_DID_CHANGE_HEAT, this._refreshUI, this);
    }
    protected start(): void {
        this._refreshUI();
    }

    protected onDestroy(): void {
        NotificationMgr.removeListener(NotificationName.USERINFO_DID_CHANGE_TREASURE_PROGRESS, this._refreshUI, this);
        NotificationMgr.removeListener(NotificationName.USERINFO_DID_CHANGE_HEAT, this._refreshUI, this);
    }

    update(deltaTime: number) {}

    private _refreshUI() {
        //------------------------------------------ heat
        const heatValue: number = DataMgr.s.userInfo.data.heatValue.currentHeatValue;
        const worldBoxThreshold: number[] = (ConfigConfig.getConfig(ConfigType.WorldBoxThreshold) as WorldBoxThresholdParam).thresholds;
        const beginPointerValue: number = 113;
        const endPointerValue: number = -113;
        const maxHeatThreshold: number = worldBoxThreshold[worldBoxThreshold.length - 1];

        const pointerView = this.node.getChildByPath("__ViewContent/Content/HeatProgress/Pointer");
        const fullLabel = this.node.getChildByPath("__ViewContent/Content/HeatProgress/Full");
        const heatValueView = this.node.getChildByPath("__ViewContent/Content/HeatProgress/HeatValue");

        pointerView.angle = beginPointerValue + (endPointerValue - beginPointerValue) * Math.min(1, heatValue / maxHeatThreshold);
        if (heatValue >= worldBoxThreshold[worldBoxThreshold.length - 1]) {
            fullLabel.active = true;
            heatValueView.active = false;
        } else {
            fullLabel.active = false;
            heatValueView.active = true;
            heatValueView.getChildByPath("Value").getComponent(Label).string = heatValue.toString();
        }

        //------------------------------------------ box
        let exploreValue: number = DataMgr.s.userInfo.data.exploreProgress;
        exploreValue = 223
        const perBoxNeedExploreValue: number = 100;
        const boxNum: number = 4;
        const boxRanks: number[] = [0, 0, 0, 0];
        const exploreTotalValue: number = perBoxNeedExploreValue * boxNum;
        for (let i = 0; i < boxRanks.length; i++) {
            if (exploreValue >= perBoxNeedExploreValue * (i + 1)) {
                boxRanks[i] = CommonTools.getRandomInt(1, 5);
            }
        }

        const boxContentWidth: number = this._boxContent.getComponent(UITransform).width;

        this.node.getChildByPath("__ViewContent/Content/ProgressBar").getComponent(ProgressBar).progress = Math.min(1, exploreValue / exploreTotalValue);

        this._boxContent.removeAllChildren();
        for (let i = 0; i < boxNum; i++) {
            const rank = boxRanks[i];
            let item = instantiate(this._boxItem);
            item.setParent(this._boxContent);

            let treasureView = null;
            for (let j = 0; j <= 5; j++) {
                item.getChildByPath("Treasure_box_" + j).active = j == rank;
                if (j == rank) {
                    treasureView = item.getChildByPath("Treasure_box_" + j);
                }
            }
            if (treasureView != null) {
                treasureView.getChildByName("Common").active = rank <= 0;
                treasureView.getChildByName("Light").active = rank > 0;
                if (rank > 0) {
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

            item.getComponent(Button).clickEvents[0].customEventData = i.toString();
            item.setPosition(v3(-boxContentWidth / 2 + (boxContentWidth / boxNum) * (i + 1), 0, 0));
        }
    }

    //------------------------------------------ action
    private async onTapBoxItem(event: Event, customEventData: string) {
        const index = parseInt(customEventData);
        // 0-no 1-can 2-getted
        let getStatus: number = 0;
        // if (DataMgr.s.userInfo.data.treasureDidGetRewards.indexOf(data.id) != -1) {
        //     getStatus = 2;
        // } else if (DataMgr.s.userInfo.data.exploreProgress >= data.threshold) {
        //     getStatus = 1;
        // }
        if (getStatus == 2) {
        } else if (getStatus == 1) {
            // const result = await UIPanelManger.inst.pushPanel(UIName.TreasureGettedUI);
            // if (result.success) {
            //     result.node.getComponent(TreasureGettedUI).dialogShow(data, (gettedData: { boxId: string; items: ItemData[]; artifacts: ArtifactData[]; subItems: ItemData[] }) => {
            //         DataMgr.setTempSendData("player_treasure_open_res", {
            //             boxId: gettedData.boxId,
            //             items: gettedData.items,
            //             artifacts: gettedData.artifacts,
            //             subItems: gettedData.subItems
            //         });
            //         NetworkMgr.websocketMsg.player_treasure_open({ boxId: gettedData.boxId });
            //     });
            // }
        } else if (getStatus == 0) {
            // useLanMgr
            UIHUDController.showCenterTip(LanMgr.getLanById("200002"));
            // UIHUDController.showCenterTip("Please explore more to get it");
        }
    }
    private onTapDetail() {
        UIPanelManger.inst.pushPanel(UIName.WorldTreasureDetailUI);
    }
    private onTapQuestion() {
        UIPanelManger.inst.pushPanel(UIName.WorldTreasureTipUI);
    }
}
