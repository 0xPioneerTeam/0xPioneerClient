import { _decorator, Button, Component, instantiate, Label, Layout, Node, ScrollView, Toggle, UITransform, Vec2, Widget } from "cc";
import ViewController from "../../BasicView/ViewController";
import UIPanelManger from "../../Basic/UIPanelMgr";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import { DataMgr } from "../../Data/DataMgr";
import { PlayerInfoItem } from "../View/PlayerInfoItem";
import { UIName } from "../../Const/ConstUIDefine";
import { PlayerDispatchDetailUI } from "./PlayerDispatchDetailUI";
import { MapPlayerPioneerObject } from "../../Const/PioneerDefine";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
const { ccclass, property } = _decorator;

@ccclass("PlayerDispatchListUI")
export class PlayerDispatchListUI extends ViewController {
    private _showPlayers: MapPlayerPioneerObject[] = [];

    private _playerContentView: Node = null;
    private _playerItem: Node = null;

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._playerContentView = this.node.getChildByPath("ContentView/Bg/ItemBg/ScrollView/View/Content");
        this._playerItem = this._playerContentView.getChildByPath("Item");
        this._playerItem.removeFromParent();
    }

    protected viewDidStart(): void {
        super.viewDidStart();

        this._refreshUI();

        NotificationMgr.addListener(NotificationName.MAP_PIONEER_HP_CHANGED, this._onPioneerHpChange, this);
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_HP_CHANGED, this._onPioneerHpChange, this);
    }

    protected viewPopAnimation(): boolean {
        return true;
    }

    protected contentView(): Node | null {
        return this.node.getChildByPath("ContentView");
    }

    private _refreshUI() {
        this._playerContentView.removeAllChildren();

        this._showPlayers = [];
        const players = DataMgr.s.pioneer.getAllPlayers();
        for (const player of players) {
            if (player.NFTId == null) {
                continue;
            }
            const view = instantiate(this._playerItem);
            view.setParent(this._playerContentView);
            view.getComponent(PlayerInfoItem).refreshUI(player);
            view.getComponent(Button).clickEvents[0].customEventData = this._showPlayers.length.toString();

            this._showPlayers.push(player);
        }
        this._playerContentView.getComponent(Layout).updateLayout();
    }
    //-------------------------- action
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }
    private async onTapItem(event: Event, customEvnetData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const index = parseInt(customEvnetData);
        if (index < 0 || index > this._showPlayers.length - 1) {
            return;
        }
        const result = await UIPanelManger.inst.pushPanel(UIName.PlayerDispatchDetailUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(PlayerDispatchDetailUI).configuration(this._showPlayers, index);
    }

    //------------------------ notification
    private _onPioneerHpChange() {
        this._refreshUI();
    }
}
