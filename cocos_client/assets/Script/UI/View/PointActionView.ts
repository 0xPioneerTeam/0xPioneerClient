import { _decorator, Component, Label, Layout, Node, ProgressBar, tween, v3 } from "cc";
import { UIName } from "../../Const/ConstUIDefine";
import UIPanelManger from "../../Basic/UIPanelMgr";
import { PointTreasureUI } from "../PointTreasureUI";
import { BoxInfoConfigData } from "../../Const/BoxInfo";
import BoxInfoConfig from "../../Config/BoxInfoConfig";
import { DataMgr } from "../../Data/DataMgr";
import { TreasureGettedUI } from "../TreasureGettedUI";
import ItemData from "../../Const/Item";
import ArtifactData from "../../Model/ArtifactData";
import { NetworkMgr } from "../../Net/NetworkMgr";
import { LanMgr } from "../../Utils/Global";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("PointActionView")
export class PointActionView extends Component {
    //----------------------------------------- data
    private _isOpenBox: boolean = true;
    private _userInfoTreasureValue: number = 0;
    private _boxDatas: BoxInfoConfigData[] = [];
    private _currentTreasureData: BoxInfoConfigData = null;
    //----------------------------------------- view
    private _boxView: Node = null;
    private _treasureCanGetIcon: Node = null;

    protected onLoad(): void {
        this._userInfoTreasureValue = DataMgr.s.userInfo.data.exploreProgress;
        this._boxDatas = BoxInfoConfig.getAllBox();

        this._boxView = this.node.getChildByPath("BoxContent");
        this._treasureCanGetIcon = this.node.getChildByPath("OpenButton/CanGetIcon");
        tween()
            .target(this._treasureCanGetIcon)
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
        this._treasureCanGetIcon.active = false;

        NetworkMgr.websocket.on("player_point_treasure_open_res", this._on_player_point_treasure_open_res.bind(this));
    }

    start() {
        this._refreshUI();
    }

    protected onDestroy(): void {
        NetworkMgr.websocket.off("player_point_treasure_open_res", this._on_player_point_treasure_open_res.bind(this));
    }
    update(deltaTime: number) {}

    private _refreshUI() {
        this._boxView.active = this._isOpenBox;

        let hasTreasureGet: boolean = false;
        for (let i = 0; i < this._boxDatas.length; i++) {
            if (
                DataMgr.s.userInfo.data.pointTreasureDidGetRewards.indexOf(this._boxDatas[i].id) == -1 &&
                this._userInfoTreasureValue >= this._boxDatas[i].threshold
            ) {
                hasTreasureGet = true;
                break;
            }
        }
        this._treasureCanGetIcon.active = hasTreasureGet;

        if (this._isOpenBox) {
            this._currentTreasureData = null;
            let lastTreasureIndex: number = -1;
            for (let i = 0; i < this._boxDatas.length; i++) {
                if (DataMgr.s.userInfo.data.pointTreasureDidGetRewards.indexOf(this._boxDatas[i].id) != -1) {
                    // getted
                    continue;
                }
                this._currentTreasureData = this._boxDatas[i];
                lastTreasureIndex = i - 1;
                break;
            }
            const treasureView = this._boxView.getChildByPath("BoxView/Treasure");
            if (this._currentTreasureData == null) {
                treasureView.active = false;
                // useLanMgr
                // this._boxView.getChildByPath("BoxView/Title").getComponent(Label).string = LanMgr.getLanById("107549");
                this._boxView.getChildByPath("BoxView/Title").getComponent(Label).string = "All Obtained";
                this._boxView.getChildByPath("BoxView/Progress").active = false;
                this._boxView.getChildByPath("BoxView/ProgressBar").active = false;
            } else {
                const canGet: boolean = this._userInfoTreasureValue >= this._currentTreasureData.threshold;
                treasureView.active = true;
                for (let j = 1; j <= 5; j++) {
                    const showBoxView = treasureView.getChildByPath("Treasure_box_" + j);
                    showBoxView.active = j == this._currentTreasureData.icon + 1;
                    if (showBoxView.active) {
                        showBoxView.getChildByName("Common").active = !canGet;
                        showBoxView.getChildByName("Light").active = canGet;
                        if (canGet) {
                            if (showBoxView["actiontween"] == null) {
                                showBoxView["actiontween"] = tween()
                                    .target(showBoxView)
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
                            if (showBoxView["actiontween"] != null) {
                                showBoxView["actiontween"].stop();
                            }
                        }
                    }
                }

                // useLanMgr
                // this._boxView.getChildByPath("BoxView/Title").getComponent(Label).string = LanMgr.getLanById("107549");
                this._boxView.getChildByPath("BoxView/Title").getComponent(Label).string = "Next:";

                const lastThreshold: number = lastTreasureIndex < 0 ? 0 : this._boxDatas[lastTreasureIndex].threshold;
                const totalProgress: number = this._currentTreasureData.threshold - lastThreshold;
                const progress: number = this._userInfoTreasureValue - lastThreshold;

                this._boxView.getChildByPath("BoxView/Progress").active = true;
                this._boxView.getChildByPath("BoxView/Progress/Value").getComponent(Label).string = progress.toString();
                this._boxView.getChildByPath("BoxView/Progress/Total").getComponent(Label).string = totalProgress.toString();
                this._boxView.getChildByPath("BoxView/ProgressBar").active = true;
                this._boxView.getChildByPath("BoxView/ProgressBar").getComponent(ProgressBar).progress = Math.min(1, progress / totalProgress);
            }
        }
    }

    //----------------------------------------------
    private onTapOpen() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._isOpenBox) {
            return;
        }
        this._isOpenBox = true;
        this._refreshUI();
    }
    private onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (!this._isOpenBox) {
            return;
        }
        this._isOpenBox = false;
        this._refreshUI();
    }
    private async onTapProgress() {
        GameMusicPlayMgr.playTapButtonEffect();
        await UIPanelManger.inst.pushPanel(UIName.PointTreasureUI);
    }
    private async onTapTreasure() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._currentTreasureData == null) {
            return;
        }
        const canGet: boolean = this._userInfoTreasureValue >= this._currentTreasureData.threshold;
        if (canGet) {
            // const result = await UIPanelManger.inst.pushPanel(UIName.TreasureGettedUI);
            // if (result.success) {
            //     result.node
            //         .getComponent(TreasureGettedUI)
            //         .dialogShow(
            //             this._currentTreasureData,
            //             (gettedData: { boxId: string; items: ItemData[]; artifacts: ArtifactData[]; subItems: ItemData[] }) => {
            //                 DataMgr.setTempSendData("player_point_treasure_open_res", {
            //                     boxId: gettedData.boxId,
            //                     items: gettedData.items,
            //                     artifacts: gettedData.artifacts,
            //                     subItems: gettedData.subItems,
            //                 });
            //                 NetworkMgr.websocketMsg.player_point_treasure_open({ boxId: gettedData.boxId });
            //             }
            //         );
            // }
        }
    }

    //---------------------------- socket notification
    private _on_player_point_treasure_open_res(e: any) {
        this._refreshUI();
    }
}
