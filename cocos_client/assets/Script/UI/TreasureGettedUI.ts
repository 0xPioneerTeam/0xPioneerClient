import { _decorator, Sprite, tween, v3, Animation, ParticleSystem2D } from "cc";
import { GameRankColor } from "../Const/ConstDefine";
import ArtifactData from "../Model/ArtifactData";
import { ArtifactMgr, ItemMgr } from "../Utils/Global";
import ViewController from "../BasicView/ViewController";
import ArtifactConfig from "../Config/ArtifactConfig";
import ItemConfig from "../Config/ItemConfig";
import ItemData from "../Const/Item";
import UIPanelManger from "../Basic/UIPanelMgr";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
import { share } from "../Net/msg/WebsocketMsg";
import { DataMgr } from "../Data/DataMgr";
import { UIName } from "../Const/ConstUIDefine";
import { ItemSelectFromThreeUI } from "./ItemSelectFromThreeUI";
import { RookieResourceAnim, RookieResourceAnimStruct, RookieStep } from "../Const/RookieDefine";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
const { ccclass, property } = _decorator;

@ccclass("TreasureGettedUI")
export class TreasureGettedUI extends ViewController {
    public async dialogShow(boxIndex: number, heatRank: number, items: ItemData[], artifacts: ArtifactData[], threes: share.Iartifact_three_conf[]) {
        for (let i = 1; i <= 5; i++) {
            this.node.getChildByPath("Content/Treasure_box_" + i).active = i == heatRank;
        }
        const boxView = this.node.getChildByPath("Content/Treasure_box_" + heatRank);
        // prepare treasure box node
        let treasureBoxNode = this.node.getChildByPath("Content/Treasure_box_" + heatRank + "/Treasure_box");
        let tbAni = treasureBoxNode.getComponent(Animation);

        let tbAniState = tbAni.getState(tbAni.defaultClip.name);
        tbAniState.time = 0;
        tbAniState.play();

        // prepare item show node
        let itemShowAnim = this.node.getChildByPath("Content/Treasure_box_" + heatRank + "/OpenAnim");
        itemShowAnim.active = false;

        let itemShowNode = this.node.getChildByPath("Content/Treasure_box_" + heatRank + "/itemShow");
        itemShowNode.scale = v3(0.01, 0.01, 0.01);
        itemShowNode.active = false;

        let closeDelayTime: number = 0.2;
        if (threes.length > 0) {
        } else {
            closeDelayTime = 0.6 + 0.5;

            let rank: number = 1;
            let data: ItemData | ArtifactData = null;
            let iconspr = itemShowNode.getChildByPath("icon").getComponent(Sprite);
            let framespr = itemShowNode.getChildByPath("Item_frame").getComponent(Sprite);
            if (artifacts.length > 0) {
                data = artifacts[0];
            } else if (items.length > 0) {
                data = items[0];
            }
            if (data instanceof ItemData) {
                //item
                const temple = data as ItemData;
                let itemConf = ItemConfig.getById(temple.itemConfigId);
                if (itemConf) {
                    iconspr.spriteFrame = await ItemMgr.getItemIcon(itemConf.icon);
                    rank = itemConf.grade;
                }
            } else if (data instanceof ArtifactData) {
                // artifact
                const temple = data as ArtifactData;
                const artifactConf = ArtifactConfig.getById(temple.artifactConfigId);
                if (artifactConf) {
                    iconspr.spriteFrame = await ArtifactMgr.getItemIcon(artifactConf.icon);
                    rank = artifactConf.rank;
                }
            }
            framespr.color = GameRankColor[rank - 1];

            tween(itemShowNode)
                .delay(5.5)
                .set({ active: true })
                .to(0.3, { scale: v3(0.1, 0.1, 0.1) })
                .to(0.1, { scale: v3(0.8, 0.8, 0.8) })
                .to(0.2, { scale: v3(0.7, 0.7, 0.7) })
                .start();
        }

        GameMusicPlayMgr.playOpenBoxStep1Effect();
        tween(itemShowAnim)
            .delay(3)
            .call(() => {})
            .delay(0.5)
            .call(() => {
                tween(boxView)
                    .to(1, { scale: v3(2, 2, 2) })
                    .start();
            })
            .delay(2)
            .set({ active: true })
            .call(() => {
                GameMusicPlayMgr.playOpenBoxStep2Effect();
                itemShowAnim.getChildByName("Treasure_box_open_a").getComponent(ParticleSystem2D).resetSystem();
                itemShowAnim.getChildByName("Treasure_box_open_b").getComponent(ParticleSystem2D).resetSystem();
            })
            .delay(closeDelayTime)
            .call(async () => {
                UIPanelManger.inst.popPanel(this.node);
                if (threes.length > 0) {
                    // select from three
                    const result = await UIPanelManger.inst.pushPanel(UIName.ItemSelectFromThreeUI);
                    if (!result.success) {
                        return;
                    }
                    result.node.getComponent(ItemSelectFromThreeUI).showItem(boxIndex, threes);
                } else {
                    const rookieStep = DataMgr.s.userInfo.data.rookieStep;
                    // if (rookieStep == RookieStep.OPEN_BOX_1 || rookieStep == RookieStep.OPEN_BOX_2 || rookieStep == RookieStep.OPEN_BOX_3) {
                    //     let animType = null;
                    //     let nextStep = null;
                    //     if (rookieStep == RookieStep.OPEN_BOX_1) {
                    //         animType = RookieResourceAnim.BOX_1_TO_PSYC;
                    //         nextStep = RookieStep.NPC_TALK_5;
                    //     } else if (rookieStep == RookieStep.OPEN_BOX_2) {
                    //         animType = RookieResourceAnim.BOX_2_TO_PSYC;
                    //         nextStep = RookieStep.NPC_TALK_7;
                    //     } else if (rookieStep == RookieStep.OPEN_BOX_3) {
                    //         animType = RookieResourceAnim.BOX_3_TO_PSYC;
                    //         nextStep = RookieStep.SYSTEM_TALK_21;
                    //     }
                    //     NotificationMgr.triggerEvent(NotificationName.GAME_MAIN_RESOURCE_PLAY_ANIM, {
                    //         animType: animType,
                    //         callback: () => {
                    //             if (threes.length <= 0) {
                    //                 for (const item of items) {
                    //                     DataMgr.s.item.countChanged(item);
                    //                 }
                    //                 for (const artifact of artifacts) {
                    //                     DataMgr.s.artifact.countChanged(artifact);
                    //                 }
                    //             }
                    //             DataMgr.s.userInfo.data.rookieStep = nextStep;
                    //             NotificationMgr.triggerEvent(NotificationName.USERINFO_ROOKE_STEP_CHANGE);
                    //         },
                    //     } as RookieResourceAnimStruct);
                    // } else {
                        for (const item of items) {
                            DataMgr.s.item.countChanged(item);
                        }
                        for (const artifact of artifacts) {
                            DataMgr.s.artifact.countChanged(artifact);
                        }
                    // }
                }
            })
            .start();
    }
}
