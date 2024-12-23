import { _decorator, Button, Color, instantiate, Label, Layout, Node, ProgressBar, RichText, Sprite, SpriteFrame, UITransform, v3 } from "cc";
import ViewController from "../../BasicView/ViewController";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import UIPanelManger from "../../Basic/UIPanelMgr";
import { UIName } from "../../Const/ConstUIDefine";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import { NetworkMgr } from "../../Net/NetworkMgr";
import { WarOrderConfigData } from "../../Const/WarOrderDefine";
import WarOrderConfig from "../../Config/WarOrderConfig";
import { WarOrderItem } from "./WarOrderItem";
const { ccclass, property } = _decorator;

@ccclass("WarOrderUI")
export class WarOrderUI extends ViewController {
    @property(Label)
    private level: Label = null;

    @property(Label)
    private time: Label = null;
    @property(Button)
    private taskBtn: Button = null;
    @property(Button)
    private claimBtn: Button = null;

    @property(Node)
    private rewardContent: Node = null;

    @property(Node)
    private rewardItem: Node = null;
    private _orderList: WarOrderConfigData[] = [];
    protected viewDidLoad(): void {
        super.viewDidLoad();
        this._orderList = WarOrderConfig.getAll();
        
        // NetworkMgr.websocket.on("get_battle_pass_res", this.get_battle_pass_res);
        // NetworkMgr.websocket.on("battle_pass_change", this.battle_pass_change);
        // NetworkMgr.websocketMsg.get_battle_pass({});

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
        //TODO: set level and lefttime and progress
        this.time.string = "20:00";
        this.level.string = "20";
        this.node.getChildByPath("Content/TopView/ProgressBar").getComponent(ProgressBar).progress = 0.2;
        this.rewardContent.removeAllChildren();
        for (let i = 0; i < this._orderList.length; i++) {
            const item = instantiate(this.rewardItem);
            this.rewardContent.addChild(item);
            item.getComponent(WarOrderItem).refreshUI(this._orderList[i]);
        }
    }
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }

    private onTapClaim() {
        GameMusicPlayMgr.playTapButtonEffect();
        //TODO: claim reward
    }

    private onTapTask() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.pushPanel(UIName.WarOrderTaskUI);
    }
}
