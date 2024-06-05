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
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("ClaimRewardUI")
export class ClaimRewardUI extends Component {
    @property(Node) RewardBoxArr: Node;

    public refreshUI() {
        let value = DataMgr.s.userInfo.data.exploreProgress;
        let showBox = false;
        for (let i = 0; i < this._boxViews.length; i++) {
            if (i < this._boxDatas.length) {
                const data = this._boxDatas[i];
                // 0-no 1-can 2-getted
                let getStatus: number = 0;
                if (DataMgr.s.userInfo.data.treasureDidGetRewards.indexOf(data.id) != -1) {
                    getStatus = 2;
                } else if (value >= data.threshold) {
                    getStatus = 1;
                }
                this._boxViews[i].getChildByPath("Treasure").active = getStatus != 2;
                if (getStatus != 2) {
                    for (let j = 0; j < 3; j++) {
                        const treasureView = this._boxViews[i].getChildByPath("Treasure/Treasure_box_" + j);
                        treasureView.active = j == this._boxDatas[i].icon;
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
                    showBox = true;
                }
            }
        }
        this.node.getChildByPath("bg-001/progress_bg_exp/ProgressBar").getComponent(ProgressBar).progress = Math.min(1, value / this._maxthreshold);
        if (!showBox) {
            this.node.active = false;
        }
    }

    private _boxDatas: BoxInfoConfigData[] = [];
    private _maxthreshold: number = 0;

    private _boxViews: Node[] = [];

    protected onLoad(): void {
        NetworkMgr.websocket.on("player_treasure_open_res", this._on_player_treasure_open_res.bind(this));
    }
    start() {
        this._boxDatas = BoxInfoConfig.getAllBox();
        let pre = this.RewardBoxArr.getChildByName("icon_treasure_box");
        pre.active = false;

        let beginThresholdValue: number = 0;
        for (let i = 0; i < this._boxDatas.length; i++) {
            let item = instantiate(pre);
            item.active = true;
            item.setParent(this.RewardBoxArr);
            for (let j = 0; j < 3; j++) {
                item.getChildByPath("Treasure/Treasure_box_" + j).active = j == this._boxDatas[i].icon;
            }
            item.getChildByName("Progress").getComponent(Label).string = this._boxDatas[i].threshold.toString();
            item.getChildByName("Treasure").getComponent(Button).clickEvents[0].customEventData = i.toString();
            this._boxViews.push(item);
            item["__fromthreshold"] = beginThresholdValue + this._boxDatas[i].threshold;
            this._maxthreshold = Math.max(this._maxthreshold, this._boxDatas[i].threshold);
        }
        const parentWidth = this.RewardBoxArr.getComponent(UITransform).width;
        for (const boxItem of this._boxViews) {
            boxItem.setPosition(v3(parentWidth * (boxItem["__fromthreshold"] / this._maxthreshold), boxItem.position.y, boxItem.position.z));
        }
        this.refreshUI();
    }

    protected onDestroy(): void {
        NetworkMgr.websocket.off("player_treasure_open_res", this._on_player_treasure_open_res.bind(this));
    }

    update(deltaTime: number) {}

    //------------------------------------------ action
    private async onTapBoxItem(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const index = parseInt(customEventData);
        const data = this._boxDatas[index];
        // 0-no 1-can 2-getted
        let getStatus: number = 0;
        if (DataMgr.s.userInfo.data.treasureDidGetRewards.indexOf(data.id) != -1) {
            getStatus = 2;
        } else if (DataMgr.s.userInfo.data.exploreProgress >= data.threshold) {
            getStatus = 1;
        }
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

    //-------------------------------------- websocket notification
    private _on_player_treasure_open_res(e: any) {
        this.refreshUI();
    }
}
