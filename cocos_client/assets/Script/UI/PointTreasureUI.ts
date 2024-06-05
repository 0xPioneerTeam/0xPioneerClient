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
    ScrollView,
    v2,
    Widget,
} from "cc";
import { LanMgr } from "../Utils/Global";
import { UIName } from "../Const/ConstUIDefine";
import { TreasureGettedUI } from "./TreasureGettedUI";
import { UIHUDController } from "./UIHUDController";
import BoxInfoConfig from "../Config/BoxInfoConfig";
import { BoxInfoConfigData } from "../Const/BoxInfo";
import UIPanelManger from "../Basic/UIPanelMgr";
import { DataMgr } from "../Data/DataMgr";
import ViewController from "../BasicView/ViewController";
import { NetworkMgr } from "../Net/NetworkMgr";
import ItemData from "../Const/Item";
import ArtifactData from "../Model/ArtifactData";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("PointTreasureUI")
export class PointTreasureUI extends ViewController {
    //----------------------------------------- data
    private _boxDatas: BoxInfoConfigData[] = [];

    //----------------------------------------- view
    private _currentPointLabel: Label = null;

    private _treasureProgress: ProgressBar = null;
    private _treasureContent: Node = null;
    private _treasureItem: Node = null;

    private _maxthreshold: number = 0;

    private _boxViews: Node[] = [];

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._boxDatas = BoxInfoConfig.getAllBox();

        // useLanMgr
        // this.node.getChildByPath("__ViewContent/Point/Title").getComponent(Label).string = LanMgr.getLanById("200001") + "";

        this._currentPointLabel = this.node.getChildByPath("__ViewContent/Point/Value").getComponent(Label);

        this._treasureProgress = this.node.getChildByPath("__ViewContent/ScrollView/view/content/ProgressBar").getComponent(ProgressBar);
        this._treasureContent = this.node.getChildByPath("__ViewContent/ScrollView/view/content/RewardContent");
        this._treasureItem = this._treasureContent.getChildByPath("Item");
        this._treasureItem.removeFromParent();

        NetworkMgr.websocket.on("player_point_treasure_open_res", this._on_player_point_treasure_open_res.bind(this));
    }
    protected viewDidStart(): void {
        super.viewDidStart();

        this._initTreasure();
        this._refreshUI();

        const srollView = this.node.getChildByPath("__ViewContent/ScrollView").getComponent(ScrollView);
        let currentBoxIndex: number = -1;
        for (let i = 0; i < this._boxDatas.length; i++) {
            const temp = this._boxDatas[i];
            if (DataMgr.s.userInfo.data.pointTreasureDidGetRewards.indexOf(temp.id) != -1) {
                continue;
            }
            currentBoxIndex = i;
            break;
        }
        currentBoxIndex += 1;
        if (currentBoxIndex > this._boxDatas.length - 1) {
            this.scheduleOnce(() => {
                srollView.scrollToRight();
            });
        } else {
            this.scheduleOnce(() => {
                srollView.scrollToOffset(
                    v2(
                        this._boxViews[currentBoxIndex].position.x -
                            srollView.getComponent(UITransform).width / 2 +
                            this._treasureContent.getComponent(Widget).left,
                        0
                    )
                );
            });
        }
        // this.node.getChildByPath("__ViewContent/ScrollView").getComponent(ScrollView).scrollToOffset(v2())
    }
    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NetworkMgr.websocket.off("player_point_treasure_open_res", this._on_player_point_treasure_open_res.bind(this));
    }
    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByPath("__ViewContent");
    }

    private _initTreasure() {
        let beginThresholdValue: number = 0;
        for (let i = 0; i < this._boxDatas.length; i++) {
            let item = instantiate(this._treasureItem);
            item.setParent(this._treasureContent);
            for (let j = 1; j <= 5; j++) {
                item.getChildByPath("Treasure/Treasure_box_" + j).active = j == this._boxDatas[i].icon + 1;
            }
            item.getChildByName("Progress").getComponent(Label).string = this._boxDatas[i].threshold.toString();
            item.getChildByName("Treasure").getComponent(Button).clickEvents[0].customEventData = i.toString();
            this._boxViews.push(item);
            item["__fromthreshold"] = beginThresholdValue + this._boxDatas[i].threshold;
            this._maxthreshold = Math.max(this._maxthreshold, this._boxDatas[i].threshold);
        }
        const parentWidth = this._treasureContent.getComponent(UITransform).width;
        for (const boxItem of this._boxViews) {
            boxItem.setPosition(v3(parentWidth * (boxItem["__fromthreshold"] / this._maxthreshold), boxItem.position.y, boxItem.position.z));
        }
    }
    private _refreshUI() {
        let value = DataMgr.s.userInfo.data.exploreProgress;

        this._currentPointLabel.string = value.toString();

        for (let i = 0; i < this._boxViews.length; i++) {
            if (i < this._boxDatas.length) {
                const data = this._boxDatas[i];
                // 0-no 1-can 2-getted
                let getStatus: number = 0;
                if (DataMgr.s.userInfo.data.pointTreasureDidGetRewards.indexOf(data.id) != -1) {
                    getStatus = 2;
                } else if (value >= data.threshold) {
                    getStatus = 1;
                }
                this._boxViews[i].getChildByPath("Treasure").active = getStatus != 2;
                if (getStatus != 2) {
                    for (let j = 1; j <= 5; j++) {
                        const treasureView = this._boxViews[i].getChildByPath("Treasure/Treasure_box_" + j);
                        treasureView.active = j == this._boxDatas[i].icon + 1;
                        if (treasureView.active) {
                            treasureView.getChildByName("Common").active = getStatus == 0;
                            treasureView.getChildByName("Light").active = getStatus == 1;
                            if (getStatus == 1) {
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
                }
            }
        }
        this._treasureProgress.progress = Math.min(1, value / this._maxthreshold);
    }
    //------------------------------------------ action
    private async onTapBoxItem(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const index = parseInt(customEventData);
        const data = this._boxDatas[index];
        // 0-no 1-can 2-getted
        let getStatus: number = 0;
        if (DataMgr.s.userInfo.data.pointTreasureDidGetRewards.indexOf(data.id) != -1) {
            getStatus = 2;
        } else if (DataMgr.s.userInfo.data.exploreProgress >= data.threshold) {
            getStatus = 1;
        }
        if (getStatus == 2) {
        } else if (getStatus == 1) {
            // const result = await UIPanelManger.inst.pushPanel(UIName.TreasureGettedUI);
            // if (result.success) {
            //     result.node
            //         .getComponent(TreasureGettedUI)
            //         .dialogShow(data, (gettedData: { boxId: string; items: ItemData[]; artifacts: ArtifactData[]; subItems: ItemData[] }) => {
            //             DataMgr.setTempSendData("player_point_treasure_open_res", {
            //                 boxId: gettedData.boxId,
            //                 items: gettedData.items,
            //                 artifacts: gettedData.artifacts,
            //                 subItems: gettedData.subItems,
            //             });
            //             NetworkMgr.websocketMsg.player_point_treasure_open({ boxId: gettedData.boxId });
            //         });
            // }
        } else if (getStatus == 0) {
            // useLanMgr
            UIHUDController.showCenterTip(LanMgr.getLanById("200002"));
            // UIHUDController.showCenterTip("Please explore more to get it");
        }
    }
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }
    //-------------------------- socket notification
    private _on_player_point_treasure_open_res(e: any) {
        this._refreshUI();
    }
}
