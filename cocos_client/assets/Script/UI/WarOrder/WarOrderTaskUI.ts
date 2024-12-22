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
import { WarOrderTaskConfigData } from "../../Const/WarOrderDefine";
import WarOrderTaskConfig from "../../Config/WarOrderTaskConfig";
import {WarOrderTaskItem} from "./WarOrderTaskItem";
const { ccclass, property } = _decorator;

@ccclass("WarOrderTaskUI")
export class WarOrderTaskUI extends ViewController {
    @property(cc.Node)
    private taskContent: Node = null;

    @property(cc.Node)
    private taskItem: Node = null;

    private _taskList: WarOrderTaskConfigData[] = [];
    protected viewDidLoad(): void {
        super.viewDidLoad();
        this._taskList = WarOrderTaskConfig.getAll();
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
        this.taskContent.removeAllChildren();
        for (let i = 0; i < this._taskList.length; i++) {
            const task = { ...this._taskList[i], finish: 1 };
            const taskItemInst = instantiate(this.taskItem);
            this.taskContent.addChild(taskItemInst);
            taskItemInst.getComponent(WarOrderTaskItem).refreshUI(task);
        }
    }
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }


}
