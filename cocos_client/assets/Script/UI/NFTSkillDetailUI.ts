import { _decorator, Color, Label, Node, RichText, UITransform, Vec3 } from "cc";
import { LanMgr } from "../Utils/Global";
import ViewController from "../BasicView/ViewController";
import UIPanelManger, { UIPanelLayerType } from "../Basic/UIPanelMgr";
import { NFTPioneerObject, NFTPioneerSkillConfigData } from "../Const/NFTPioneerDefine";

import NFTSkillConfig from "../Config/NFTSkillConfig";
import NFTSkillEffectConfig from "../Config/NFTSkillEffectConfig";
import { HUDName } from "../Const/ConstUIDefine";
import { AlterView } from "./View/AlterView";
import { DataMgr } from "../Data/DataMgr";
import { GetPropRankColor } from "../Const/ConstDefine";
import { NetworkMgr } from "../Net/NetworkMgr";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("NFTSkillDetailUI")
export class NFTSkillDetailUI extends ViewController {
    public async showItem(skillWorldPos: Vec3, data: NFTPioneerObject, skillIndex: number) {
        if (data == null || skillIndex < 0 || skillIndex >= data.skills.length) {
            return;
        }

        const localPos = this.node.getComponent(UITransform).convertToNodeSpaceAR(skillWorldPos);
        localPos.x = localPos.x + this.node.getChildByPath("__ViewContent").getComponent(UITransform).contentSize.width / 2 + 130;
        localPos.y = localPos.y - this.node.getChildByPath("__ViewContent").getComponent(UITransform).contentSize.height / 2 + 25;
        this.node.getChildByPath("__ViewContent").setPosition(localPos);

        const skillConfig = NFTSkillConfig.getById(data.skills[skillIndex].id);
        if (skillConfig == null) {
            return;
        }
        this._data = data;
        this._skillIndex = skillIndex;
        this._skillConfig = skillConfig;

        const nameLabel: Label = this.node.getChildByPath("__ViewContent/Name").getComponent(Label);
        nameLabel.string = LanMgr.getLanById(skillConfig.name);
        let useColor: Color = null;
        if (this._data.rank == 1) {
            useColor = new Color().fromHEX(GetPropRankColor.RANK1);
        } else if (this._data.rank == 2) {
            useColor = new Color().fromHEX(GetPropRankColor.RANK2);
        } else if (this._data.rank == 3) {
            useColor = new Color().fromHEX(GetPropRankColor.RANK3);
        } else if (this._data.rank == 4) {
            useColor = new Color().fromHEX(GetPropRankColor.RANK4);
        } else if (this._data.rank == 5) {
            useColor = new Color().fromHEX(GetPropRankColor.RANK5);
        }
        nameLabel.color = useColor;

        const desIds: string[] = [];
        for (const effect of skillConfig.effect) {
            desIds.push(effect.toString());
        }
        this.node.getChildByPath("__ViewContent/BgTaskListWord/DescTxt").getComponent(Label).string = NFTSkillEffectConfig.getDesByIds(desIds);
        this.node.getChildByPath("__ViewContent/btnUse").active = !data.skills[skillIndex].isOriginal;
    }

    private _data: NFTPioneerObject = null;
    private _skillIndex: number = -1;
    private _skillConfig: NFTPioneerSkillConfigData = null;
    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByName("__ViewContent");
    }

    //---------------------------------------------------- action
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }
    private async onTapForget() {
        GameMusicPlayMgr.playTapButtonEffect();
        const result = await UIPanelManger.inst.pushPanel(HUDName.Alter, UIPanelLayerType.HUD);
        if (!result.success) {
            return;
        }
        result.node.getComponent(AlterView).showTip(LanMgr.replaceLanById("106006", [this._data.name, LanMgr.getLanById(this._skillConfig.name)]), async () => {
            NetworkMgr.websocketMsg.player_nft_skill_forget({
                nftId: this._data.uniqueId,
                skillIndex: this._skillIndex
            });
            await this.playExitAnimation();
            UIPanelManger.inst.popPanel(this.node);
        });
    }
}
