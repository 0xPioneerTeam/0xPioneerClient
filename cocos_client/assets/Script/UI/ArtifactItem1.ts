import { _decorator, Component, Sprite, SpriteFrame, Node } from 'cc';
import * as cc from "cc";
import ArtifactData from '../Model/ArtifactData';
import { ArtifactMgr } from '../Utils/Global';
import ArtifactConfig from '../Config/ArtifactConfig';
import { RedPointView } from './View/RedPointView';
import { DataMgr } from '../Data/DataMgr';
const { ccclass, property } = _decorator;

@ccclass('ArtifactItem1')
export class ArtifactItem1 extends Component {
    public async refreshUI(item: ArtifactData = null) {
        const propView = this.node.getChildByName("Prop");
        if (item == null) {
            propView.active = false;
            
        } else {
            propView.active = true;
            const config = ArtifactConfig.getById(item.artifactConfigId);
            // levelBg
            // for (let i = 1; i <= 5; i++) {
            //     propView.getChildByName("Level" + i).active = i == config.rank;
            // }
            // icon
            propView.getChildByName("Icon").getComponent(Sprite).spriteFrame = await ArtifactMgr.getItemIcon(config.icon);

            // num
            // propView.getChildByName("Count").getComponent(cc.Label).string = "x" + item.count;
        }
    }
}