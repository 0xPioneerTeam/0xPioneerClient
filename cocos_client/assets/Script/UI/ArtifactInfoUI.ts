import {
    _decorator,
    Label,
    Node,
    instantiate,
    RichText,
    Color,
} from "cc";
import { ArtifactItem } from "./ArtifactItem";
import { LanMgr } from "../Utils/Global";
import ArtifactData from "../Model/ArtifactData";
import ViewController from "../BasicView/ViewController";
import ArtifactConfig from "../Config/ArtifactConfig";
import ArtifactEffectConfig from "../Config/ArtifactEffectConfig";
import { GetPropRankColor } from "../Const/ConstDefine";
import UIPanelManger from "../Basic/UIPanelMgr";
import { DataMgr } from "../Data/DataMgr";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("ArtifactInfoUI")
export class ArtifactInfoUI extends ViewController {
    public async showItem(artifacts: ArtifactData[], closeCallback: () => void = null) {
        this._artifacts = artifacts;
        this._closeCallback = closeCallback;

        for (const view of this._allEffectViews) {
            view.destroy();
        }
        this._allEffectViews = [];

        if (this._artifacts.length > 0) {
            const curArtifact: ArtifactData = this._artifacts.splice(0, 1)[0];
            // show one 
            const config = ArtifactConfig.getById(curArtifact.artifactConfigId);
            if (config != null) {
                let useColor: Color = null;
                let useTitle: string = null;
                if (config.rank == 1) {
                    useColor = new Color().fromHEX(GetPropRankColor.RANK1);
                    useTitle = LanMgr.getLanById("105001");
                } else if (config.rank == 2) {
                    useColor = new Color().fromHEX(GetPropRankColor.RANK2);
                    useTitle = LanMgr.getLanById("105002");
                } else if (config.rank == 3) {
                    useColor = new Color().fromHEX(GetPropRankColor.RANK3);
                    useTitle = LanMgr.getLanById("105003");
                } else if (config.rank == 4) {
                    useColor = new Color().fromHEX(GetPropRankColor.RANK4);
                    useTitle = LanMgr.getLanById("105004");
                } else if (config.rank == 5) {
                    useColor = new Color().fromHEX(GetPropRankColor.RANK5);
                    useTitle = LanMgr.getLanById("105005");
                }
    
                const content = this.node.getChildByName("__ViewContent");
    
                // name
                content.getChildByName("Name").getComponent(Label).string = LanMgr.getLanById(config.name);
                content.getChildByName("Name").getComponent(Label).color = useColor;
    
                // item
                content.getChildByName("ArtifactItem").getComponent(ArtifactItem).refreshUI(curArtifact);
    
                // title 
                content.getChildByName("Title").getComponent(Label).string = useTitle;
                content.getChildByName("Title").getComponent(Label).color = useColor;
    
                // effect
                const clevel = DataMgr.s.userInfo.data.level;
                if (config.effect.length > 0) {
                    const numStrings: string[] = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
                    let effectIndex: number = 0;
                    let isStableShowed: boolean = false;
                    for (let i = 0; i < config.effect.length; i++) {
                        const effectConfig = ArtifactEffectConfig.getById(config.effect[i]);
                        if (effectConfig == null) continue;
    
                        if (config.rank >= 4 && !isStableShowed) {
                            const stable = instantiate(this._stableEffectItem);
                            stable.active = true;
                            stable.parent = this._stableEffectItem.parent;
                            stable.getChildByName("Title").getComponent(Label).string = LanMgr.getLanById(effectConfig.des);
                            stable.getChildByName("Title").getComponent(Label).color = useColor;
                            this._allEffectViews.push(stable);
                            isStableShowed = true;
    
                        } else {
                            effectIndex += 1;
                            if (effectConfig.unlock > clevel) {
                                const unlock = instantiate(this._unlockEffectItem);
                                unlock.active = true;
                                unlock.parent = this._unlockEffectItem.parent;
                                unlock.getChildByPath("LockIcon/No").getComponent(Label).string = numStrings[effectIndex];
                                unlock.getChildByPath("Title").getComponent(Label).string = LanMgr.getLanById(effectConfig.des);
                                // useLanMgr
                                // unlock.getChildByPath("Title/Unlock").getComponent(Label).string = "(" + LanMgr.getLanById("107549") + " C.LV " + effectConfig.unlock + ")";
                                unlock.getChildByPath("Title/Unlock").getComponent(Label).string = "(" + "Unlocked at" + " C.LV " + effectConfig.unlock + ")";
                                this._allEffectViews.push(unlock);
    
                            } else {
                                const locked = instantiate(this._lockedEffectItem);
                                locked.active = true;
                                locked.parent = this._lockedEffectItem.parent;
                                locked.getChildByPath("LockIcon/No").getComponent(Label).string = numStrings[effectIndex];
                                locked.getChildByPath("Title").getComponent(Label).string = LanMgr.getLanById(effectConfig.des);
                                this._allEffectViews.push(locked);
                            }
                        }
                    }
    
                    // desc
                    content.getChildByName("DescTxt").getComponent(RichText).string = LanMgr.getLanById(config.des);
                }
            }
        }
    }

    private _artifacts: ArtifactData[] = [];
    private _closeCallback: () => void;

    private _allEffectViews: Node[] = [];
    private _stableEffectItem: Node = null;
    private _lockedEffectItem: Node = null;
    private _unlockEffectItem: Node = null;
    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._allEffectViews = [];

        this._stableEffectItem = this.node.getChildByPath("__ViewContent/EffectContent/StableEffect");
        this._stableEffectItem.active = false;

        this._lockedEffectItem = this.node.getChildByPath("__ViewContent/EffectContent/LockedEffect");
        this._lockedEffectItem.active = false;

        this._unlockEffectItem = this.node.getChildByPath("__ViewContent/EffectContent/UnLockEffect");
        this._unlockEffectItem.active = false;
    }
    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByName("__ViewContent");
    }
   
    //---------------------------------------------------- action
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._artifacts.length <= 0) {
            await this.playExitAnimation();
            UIPanelManger.inst.popPanel(this.node);
            if (this._closeCallback != null) {
                this._closeCallback();
            }
        } else {
            this.showItem(this._artifacts, this._closeCallback);
        }
    }
}
