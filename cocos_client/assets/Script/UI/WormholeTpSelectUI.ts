import { _decorator, Button, Component, instantiate, Label, Layout, Node } from 'cc';
import ViewController from '../BasicView/ViewController';
import UIPanelManger from '../Basic/UIPanelMgr';
import GameMusicPlayMgr from '../Manger/GameMusicPlayMgr';
import { DataMgr } from '../Data/DataMgr';
import { WormholeTagObject } from '../Const/UserInfoDefine';
const { ccclass, property } = _decorator;

@ccclass('WormholeTpSelectUI')
export class WormholeTpSelectUI extends ViewController {
    

    private _markedData: WormholeTagObject[] = [];

    private _itemContentView: Node = null;
    private _itemView: Node = null;

    private _selectCallback: (tpBuildingId: string) => void = null;

    public configuration(selectCallback: (tpBuildingId: string)=> void) {
        this._refreshUI();

        this._selectCallback = selectCallback;
    }

    protected viewDidLoad(): void {
        super.viewDidLoad();
        this._markedData = DataMgr.s.userInfo.data.wormholeTags;

        this._itemContentView = this.node.getChildByPath("__ViewContent/ScrollView/View/Content");
        this._itemView = this._itemContentView.getChildByPath("Item");
        this._itemView.removeFromParent();
    }

    protected viewDidStart(): void {
        super.viewDidStart();
    }

    protected viewPopAnimation(): boolean {
        return true;
    }

    protected contentView(): Node | null {
        return this.node.getChildByPath("__ViewContent");
    }

    //------------------- function
    private _refreshUI() {
        for (let i = 0; i < this._markedData.length; i++) {
            const data = this._markedData[i];
            let itemView = instantiate(this._itemView);
            itemView.getChildByPath("Name").getComponent(Label).string = data.playerName;
            itemView.getChildByPath("Button").getComponent(Button).clickEvents[0].customEventData = i.toString();
            this._itemContentView.addChild(itemView);
        }
        this._itemContentView.getComponent(Layout).updateLayout();
    }

    //------------------- action
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }

    private async onTapItem(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const index: number = parseInt(customEventData);
        if (index < 0 || index > this._markedData.length - 1) {
            return;
        }
        const data = this._markedData[index];
        if (this._selectCallback != null) {
            this._selectCallback(data.tpBuildingId);
        }
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }
}


