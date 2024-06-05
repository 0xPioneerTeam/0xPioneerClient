import { _decorator, Button, Component, EventHandler, instantiate, Layout, Node } from "cc";
import { PlayerItemUI } from "./PlayerItemUI";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import GameMainHelper from "../Game/Helper/GameMainHelper";
import { DataMgr } from "../Data/DataMgr";
import { MapPioneerActionType, MapPlayerPioneerObject } from "../Const/PioneerDefine";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("PlayerListUI")
export class PlayerListUI extends Component {
    private _playerItemContent: Node = null;
    private _playerItem: Node = null;
    private _playerItems: Node[] = [];

    private _pioneers: MapPlayerPioneerObject[] = [];

    protected onLoad(): void {
        this._playerItemContent = this.node.getChildByPath("Content/ScrollView/View/Content");
        this._playerItem = this._playerItemContent.getChildByPath("Item");
        {
            const itemButton = this._playerItem.getComponent(Button);
            const evthandler = new EventHandler();
            evthandler._componentName = "PlayerListUI";
            evthandler.target = this.node;
            evthandler.handler = "onTapPlayerItem";
            itemButton.clickEvents.push(evthandler);
        }
        this._playerItem.active = false;

        NotificationMgr.addListener(NotificationName.CHANGE_LANG, this.changeLang, this);

        NotificationMgr.addListener(NotificationName.MAP_PIONEER_SHOW_CHANGED, this._refreshPlayerList, this);
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_ACTIONTYPE_CHANGED, this._refreshPlayerList, this);
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_EVENTID_CHANGE, this._refreshPlayerList, this);
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_HP_CHANGED, this._refreshPlayerList, this);

        NotificationMgr.addListener(NotificationName.MAP_PIONEER_FIGHT_BEGIN, this._refreshPlayerList, this);
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_FIGHT_END, this._refreshPlayerList, this);
    }

    start() {
        this._refreshPlayerList();
        this.changeLang();
    }

    protected onDestroy(): void {
        NotificationMgr.removeListener(NotificationName.CHANGE_LANG, this.changeLang, this);

        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_SHOW_CHANGED, this._refreshPlayerList, this);
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_ACTIONTYPE_CHANGED, this._refreshPlayerList, this);
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_EVENTID_CHANGE, this._refreshPlayerList, this);
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_HP_CHANGED, this._refreshPlayerList, this);

        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_FIGHT_BEGIN, this._refreshPlayerList, this);
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_FIGHT_END, this._refreshPlayerList, this);
    }

    private changeLang() {
        if (this.node.active === false) return;

        // useLanMgr
        // this.node.getChildByName("title").getComponent(Label).string = LanMgr.getLanById("107549");
    }

    private _refreshPlayerList() {
        this._pioneers = [];
        for (const temple of DataMgr.s.pioneer.getAllPlayers()) {
            if (temple.show) {
                const building = DataMgr.s.mapBuilding.getBuildingById(temple.actionBuildingId);
                if (temple.actionType == MapPioneerActionType.eventing && building != null && building.eventPioneerDatas.has(temple.id)) {
                    // eventing use building data
                    const playerObj = building.eventPioneerDatas.get(temple.id) as MapPlayerPioneerObject;
                    playerObj.actionEndTimeStamp = temple.actionEndTimeStamp;
                    this._pioneers.push(playerObj);
                } else {
                    this._pioneers.push(temple);
                }
            }
        }
        let i = 0;
        for (i; i < this._pioneers.length; i++) {
            let item: Node = null;
            if (i < this._playerItems.length) {
                item = this._playerItems[i];
            } else {
                item = instantiate(this._playerItem);
                item.setParent(this._playerItemContent);
                this._playerItems.push(item);
            }
            item.active = true;
            item.getComponent(PlayerItemUI).refreshUI(this._pioneers[i]);
            item.getComponent(Button).clickEvents[0].customEventData = i.toString();
        }
        for (i + 1; i < this._playerItems.length; i++) {
            this._playerItems[i].destroy();
            this._playerItems.splice(i, 1);
            i -= 1;
        }
        this._playerItemContent.getComponent(Layout).updateLayout();
    }

    update(deltaTime: number) {}

    private onTapPlayerItem(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const index = parseInt(customEventData);
        if (GameMainHelper.instance.isGameShowOuter) {
            if (index < this._pioneers.length) {
                const currentMapPos = this._pioneers[index].stayPos;
                if (currentMapPos != null) {
                    const currentWorldPos = GameMainHelper.instance.tiledMapGetPosWorld(currentMapPos.x, currentMapPos.y);
                    GameMainHelper.instance.changeGameCameraWorldPosition(currentWorldPos, true);
                }
                DataMgr.s.pioneer.changeCurrentAction(this._pioneers[index].id);
                this._refreshPlayerList();
            }
        }
    }
}
