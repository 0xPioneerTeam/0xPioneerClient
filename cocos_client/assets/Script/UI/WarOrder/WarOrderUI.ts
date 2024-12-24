import { _decorator, Button, Color, instantiate, Label, Layout, Node, ProgressBar, RichText, Sprite, SpriteFrame, UITransform, v3 } from "cc";
import ViewController from "../../BasicView/ViewController";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import UIPanelManger from "../../Basic/UIPanelMgr";
import { UIName } from "../../Const/ConstUIDefine";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import { NetworkMgr } from "../../Net/NetworkMgr";
import { WarOrderConfigData, BattlePass, BattlePassTask } from "../../Const/WarOrderDefine";
import WarOrderConfig from "../../Config/WarOrderConfig";
import { WarOrderItem } from "./WarOrderItem";
import { s2c_user } from "../../Net/msg/WebsocketMsg";
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

    @property(Button)
    private leftBtn: Button = null;

    @property(Button)
    private rightBtn: Button = null;

    @property(Node)
    private rewardContent: Node = null;

    @property(Node)
    private rewardItem: Node = null;
    private _orderList: WarOrderConfigData[] = [];
    protected viewDidLoad(): void {
        super.viewDidLoad();
        this._orderList = WarOrderConfig.getAll();

        NetworkMgr.websocket.on("get_battle_pass_res", this.get_battle_pass_res);
        // NetworkMgr.websocket.on("battle_pass_change", this.battle_pass_change);
        NetworkMgr.websocketMsg.get_battle_pass({});

        this._refreshUI();

        this.leftBtn.node.on('click', this.onLeftBtnClick, this);
        this.rightBtn.node.on('click', this.onRightBtnClick, this);
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

        NetworkMgr.websocket.off("get_battle_pass_res", this.get_battle_pass_res);
    }

    private resetUI() {
        this._refreshUI();
    }

    //format timestamp to Day:Hour,timestamp is string
    private formatTime(timestamp: string) {
        const date = new Date(parseInt(timestamp) * 1000);
        return `${date.getDay()} Days ${date.getHours()} Hours`;
    }

    private async _refreshUI(data: BattlePass = null) {
        //TODO: set level and lefttime and progress
        let currentLevel: number = 0;
        if (data) {
            if (data?.endTime) {
                this.time.string = this.formatTime(data.endTime);
            }
            if (data?.exp) {
                let currentExp: number = data.exp;
                for (let i = 0; i < this._orderList.length; i++) {
                    if (currentExp > this._orderList[i].exp) {
                        currentExp -= this._orderList[i].exp;
                        currentLevel = i;
                    } else {
                        break;
                    }
                }
                this.node.getChildByPath("Content/TopView/ProgressBar").getComponent(ProgressBar).progress = currentExp / this._orderList[currentLevel].exp;
            } else {
                this.node.getChildByPath("Content/TopView/ProgressBar").getComponent(ProgressBar).progress = 0;
            }
        } else {
            this.time.string = "0 Day";
            this.level.string = "0";
            this.node.getChildByPath("Content/TopView/ProgressBar").getComponent(ProgressBar).progress = 0;
        }
        currentLevel +=1;
        this.level.string = (currentLevel).toString();
        this.rewardContent.removeAllChildren();
        //refresh warorder item
        for (let i = 0; i < this._orderList.length; i++) {
            const item = instantiate(this.rewardItem);
            this.rewardContent.addChild(item);
            item.getComponent(WarOrderItem).refreshUI(this._orderList[i], data?.freeRewardIds, data?.highRewardIds, data?.unLock,currentLevel);
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
        NetworkMgr.websocketMsg.get_battle_pass_reward({});
        NetworkMgr.websocketMsg.get_battle_pass({});
    }

    private onTapTask() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.pushPanel(UIName.WarOrderTaskUI);
    }

    private get_battle_pass_res = (data: any) => {
        console.log("get_battle_pass_res", data);
        const p: BattlePass = data.data;
        this._refreshUI(p);
    }

    private onLeftBtnClick(): void {
        const scrollView = this.node.getChildByPath("Content/LeftView/Content/ScrollView").getComponent(cc.ScrollView);
        const itemWidth = this.rewardItem.width;
        scrollView.scrollToOffset(cc.v2(Math.abs(scrollView.getScrollOffset().x )- itemWidth, 0), 0.3);
    }

    private onRightBtnClick(): void {
        const scrollView = this.node.getChildByPath("Content/LeftView/Content/ScrollView").getComponent(cc.ScrollView);
        const itemWidth = this.rewardItem.width;
        scrollView.scrollToOffset(cc.v2(Math.abs(scrollView.getScrollOffset().x )+ itemWidth, 0), 0.3);
    }
}
