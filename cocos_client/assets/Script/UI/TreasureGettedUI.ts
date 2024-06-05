import { _decorator, Color, Component, Label, Node, Sprite, tween, v3, Animation, ParticleSystem2D } from "cc";
import { GameRankColor, GetPropRankColor } from "../Const/ConstDefine";
import ArtifactData from "../Model/ArtifactData";
import { ArtifactMgr, ItemMgr, UserInfoMgr } from "../Utils/Global";
import ViewController from "../BasicView/ViewController";
import ArtifactConfig from "../Config/ArtifactConfig";
import ItemConfig from "../Config/ItemConfig";
import ItemData from "../Const/Item";
import UIPanelManger from "../Basic/UIPanelMgr";
import { DataMgr } from "../Data/DataMgr";
import ConfigConfig from "../Config/ConfigConfig";
import { ConfigType, WorldBoxThresholdParam } from "../Const/Config";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("TreasureGettedUI")
export class TreasureGettedUI extends ViewController {
    public async dialogShow(items: ItemData[], artifacts: ArtifactData[]) {
        const heatValue: number = DataMgr.s.userInfo.data.heatValue.currentHeatValue;
        let heatRank: number = 1;
        // left view
        const worldBoxThreshold: number[] = (ConfigConfig.getConfig(ConfigType.WorldBoxThreshold) as WorldBoxThresholdParam).thresholds;
        const maxHeatThreshold: number = worldBoxThreshold[worldBoxThreshold.length - 1];
        if (heatValue >= maxHeatThreshold) {
            heatRank = 5;
        } else {
            for (let i = 0; i < worldBoxThreshold.length; i++) {
                if (heatValue < worldBoxThreshold[i]) {
                    heatRank = i + 1;
                    break;
                }
            }
        }

        for (let i = 1; i <= 5; i++) {
            this.node.getChildByPath("Content/Treasure_box_" + i).active = i == heatRank;
        }
        // prepare treasure box node
        let treasureBoxCameraNode = this.node.getChildByPath("Content/Treasure_box_" + heatRank + "/Treasure_box_camera");
        let treasureBoxNode = this.node.getChildByPath("Content/Treasure_box_" + heatRank + "/Treasure_box");

        let tbcAni = treasureBoxCameraNode.getComponent(Animation);
        let tbAni = treasureBoxNode.getComponent(Animation);

        let tbcAniState = tbcAni.getState(tbcAni.defaultClip.name);
        let tbAniState = tbAni.getState(tbAni.defaultClip.name);
        tbcAniState.time = 0;
        tbAniState.time = 0;
        tbcAniState.play();
        tbAniState.play();

        // prepare item show node
        let itemShowAnim = this.node.getChildByPath("Content/Treasure_box_" + heatRank + "/OpenAnim");
        itemShowAnim.active = false;

        let itemShowNode = this.node.getChildByPath("Content/Treasure_box_" + heatRank + "/itemShow");
        itemShowNode.scale = v3(0.01, 0.01, 0.01);
        itemShowNode.active = false;

        let data: ItemData | ArtifactData = null;
        if (items.length > 0) {
            data = items[0];
        } else if (artifacts.length > 0) {
            data = artifacts[0];
        }
        if (data == null) {
            return;
        }

        let iconspr = itemShowNode.getChildByPath("icon").getComponent(Sprite);
        let framespr = itemShowNode.getChildByPath("Item_frame").getComponent(Sprite);

        let rank: number = 1;
        if (data as ItemData) {
            //item
            const temple = data as ItemData;
            let itemConf = ItemConfig.getById(temple.itemConfigId);
            if (itemConf) {
                iconspr.spriteFrame = await ItemMgr.getItemIcon(itemConf.icon);
                rank = itemConf.grade;
            }
        } else if (data as ArtifactData) {
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
            .delay(0.5)
            .call(() => {
                UIPanelManger.inst.popPanel(this.node);
            })
            .start();

        GameMusicPlayMgr.playOpenBoxStep1Effect();
        tween(itemShowAnim)
            .delay(5.5)
            .set({ active: true })
            .call(() => {
                GameMusicPlayMgr.playOpenBoxStep2Effect();
                itemShowAnim.getChildByName("Treasure_box_open_a").getComponent(ParticleSystem2D).resetSystem();
                itemShowAnim.getChildByName("Treasure_box_open_b").getComponent(ParticleSystem2D).resetSystem();
            })
            .start();
    }
}
