import { _decorator, Button, Color, instantiate, Label, Layout, Node, ProgressBar, RichText, Sprite, SpriteFrame, UITransform, v3 } from "cc";
import ViewController from "../../BasicView/ViewController";
import { ArtifactMgr, ItemMgr, LanMgr } from "../../Utils/Global";
import { DataMgr } from "../../Data/DataMgr";
import ItemConfig from "../../Config/ItemConfig";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import UIPanelManger from "../../Basic/UIPanelMgr";
import { UIName } from "../../Const/ConstUIDefine";
import { ItemConfigType } from "../../Const/Item";
import ArtifactConfig from "../../Config/ArtifactConfig";
import ConfigConfig from "../../Config/ConfigConfig";
import { ConfigType, WorldBoxThresholdParam, WorldTreasureBoxRarityShowNameParam } from "../../Const/Config";
import { InnerBuildingType } from "../../Const/BuildingDefine";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import { NetworkMgr } from "../../Net/NetworkMgr";
const { ccclass, property } = _decorator;

@ccclass("WarOrderTaskUI")
export class WarOrderTaskUI extends ViewController {
    @property(cc.Label)
    private taskType: Label = null;

    @property(cc.Label)
    private desc: Label = null;
    @property(cc.Label)
    private exp: Label = null;
    @property(cc.Label)
    private progress: Label = null;
    @property(cc.Button)
    private confirmButton: Button = null;

    @property(cc.Sprite)
    private finish: Sprite = null;

    @property(cc.Node)
    private taskContent: Node = null;

    @property(cc.Node)
    private taskItem: Node = null;
    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._refreshUI();
    }

    protected viewDidStart(): void {
        super.viewDidStart();
    }

    protected viewPopAnimation(): boolean {
        return true;
    }

    protected contentView(): Node {
        return this.node.getChildByPath("Content");
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();
    }

    private resetUI() {
        this._refreshUI();
    }

    private async _refreshUI() {
        for (let i = 0; i < 5; i++) {
            this.taskContent.addChild(instantiate(this.taskItem));
        }
    }
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }

    private onTapClaim() {
        GameMusicPlayMgr.playTapButtonEffect();

    }


}
