import { _decorator, Button, Component, instantiate, Label, Layout, Node, ScrollView, Toggle, UITransform, Vec2, Widget } from "cc";
import ViewController from "../../BasicView/ViewController";
import UIPanelManger from "../../Basic/UIPanelMgr";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import { DataMgr } from "../../Data/DataMgr";
import { PlayerInfoItem } from "../View/PlayerInfoItem";
const { ccclass, property } = _decorator;

@ccclass("PlayerDispatchListUI")
export class PlayerDispatchListUI extends ViewController {
    
    private _playerContentView: Node = null;
    private _playerItem: Node = null;

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._playerContentView = this.node.getChildByPath("ContentView/ScrollView/View/Content");
        this._playerItem = this._playerContentView.getChildByPath("Item");
        this._playerItem.removeFromParent();
    }

    protected viewDidStart(): void {
        super.viewDidStart();

        this._refreshUI();
    }

    protected viewPopAnimation(): boolean {
        return true;
    }

    protected contentView(): Node | null {
        return this.node.getChildByPath("ContentView");
    }

    private _refreshUI() {
        const players = DataMgr.s.pioneer.getAllPlayers();
        for (const player of players) {
            if (player.NFTId == null) {
                continue;
            }
            const view = instantiate(this._playerItem);
            view.setParent(this._playerContentView);
            view.getComponent(PlayerInfoItem).refreshUI(player);
            view.getComponent(Button).clickEvents[0].customEventData = player.id;
        }
       this._playerContentView.getComponent(Layout).updateLayout();
    }
    //-------------------------- action
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }
    private onTapItem(event: Event, customEvnetData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const player = DataMgr.s.pioneer.getById(customEvnetData);
        if (player == undefined) {
            return;
        }
        
    }
}
