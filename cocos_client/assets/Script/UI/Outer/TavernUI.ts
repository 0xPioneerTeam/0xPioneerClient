import { _decorator, Button, Component, instantiate, Label, Node, Sprite } from "cc";
import ViewController from "../../BasicView/ViewController";
import UIPanelManger from "../../Basic/UIPanelMgr";
import ItemData from "../../Const/Item";
import CommonTools from "../../Tool/CommonTools";
import { DataMgr } from "../../Data/DataMgr";
import { ItemMgr } from "../../Utils/Global";
import ItemConfig from "../../Config/ItemConfig";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("TavernUI")
export class TavernUI extends ViewController {
    private _buildingId: string = null;
    private _recruitTime: number = 10;
    private _costItem: ItemData[] = null;
    private _todayRefreshTime: number = 0;
    private _nextDayRefreshTime: number = 0;

    private _allCostItemViews: Node[] = [];
    private _costItemContent: Node = null;
    private _costItemView: Node = null;

    public configuration(buildingId: string) {
        this._buildingId = buildingId;
    }

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._costItem = [new ItemData("8005", 80), new ItemData("8001", 200), new ItemData("8002", 100)];
        this._todayRefreshTime = CommonTools.getDayAMTimestamp(8);
        this._nextDayRefreshTime = CommonTools.getNextDayAMTimestamp(8);

        this._costItemContent = this.node.getChildByPath("__ViewContent/RecruitView/Material");
        this._costItemView = this._costItemContent.getChildByPath("Item");
        this._costItemView.removeFromParent();
    }

    protected viewDidStart(): void {
        super.viewDidStart();

        this._refreshUI();

        this._countdownTime();
        this.schedule(() => {
            this._countdownTime();
        });
    }

    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByPath("__ViewContent");
    }

    private async _refreshUI() {
        const emptyView = this.node.getChildByPath("__ViewContent/EmptyView");
        const recruitView = this.node.getChildByPath("__ViewContent/RecruitView");

        const todayIsGet: boolean = DataMgr.s.userInfo.data.tavernGetPioneerTimestamp >= this._todayRefreshTime;
        emptyView.active = todayIsGet;
        recruitView.active = !todayIsGet;

        if (!todayIsGet) {
            for (const item of this._allCostItemViews) {
                item.destroy();
            }

            let canRecruit: boolean = true;
            this._allCostItemViews = [];
            for (const item of this._costItem) {
                const itemConfig = ItemConfig.getById(item.itemConfigId);
                if (itemConfig == null) {
                    continue;
                }

                if (item.count > DataMgr.s.item.getObj_item_count(item.itemConfigId)) {
                    canRecruit = false;
                }

                const view = instantiate(this._costItemView);
                view.getChildByPath("Icon").getComponent(Sprite).spriteFrame = await ItemMgr.getItemIcon(itemConfig.icon);
                view.getChildByPath("Num/Use").getComponent(Label).string = DataMgr.s.item.getObj_item_count(itemConfig.configId).toString();
                view.getChildByPath("Num/Limit").getComponent(Label).string = item.count.toString();
                view.parent = this._costItemContent;

                this._allCostItemViews.push(view);
            }
            recruitView.getChildByPath("TimeView/Value").getComponent(Label).string = CommonTools.formatSeconds(this._recruitTime);

            recruitView.getChildByPath("Recruit").getComponent(Sprite).grayscale = !canRecruit;
            recruitView.getChildByPath("Recruit").getComponent(Button).interactable = canRecruit;
        }
    }
    private _countdownTime() {
        const currentTimeStamp = new Date().getTime();

        let endTime: number = 0;
        if (currentTimeStamp < this._todayRefreshTime) {
            endTime = this._todayRefreshTime;
        } else {
            endTime = this._nextDayRefreshTime;
        }
        const gapTime: number = Math.max(0, endTime - currentTimeStamp);
        this.node.getChildByPath("__ViewContent/CountdownTime").getComponent(Label).string =
            "closing countdown:" + CommonTools.formatSeconds(gapTime / 1000, "HHh MMm");
    }

    //------------------- action
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }
    private async onTapRecruit() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._buildingId == null) {
            return;
        }
        // begin recruit nft
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }
}
