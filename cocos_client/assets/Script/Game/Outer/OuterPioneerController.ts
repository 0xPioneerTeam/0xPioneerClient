import { _decorator, Color, Details, instantiate, math, Node, Prefab, UITransform, v2, v3, Vec2, Vec3 } from "cc";
import { TilePos } from "../TiledMap/TileTool";
import { OuterFightView } from "./View/OuterFightView";
import { OuterOtherPioneerView } from "./View/OuterOtherPioneerView";
import { MapItemMonster } from "./View/MapItemMonster";
import { MapPioneer } from "./View/MapPioneer";
import { OuterMapCursorView } from "./View/OuterMapCursorView";
import { GameExtraEffectType, MapMemberFactionType, MapMemberTargetType, PioneerGameTest, ResourceCorrespondingItem } from "../../Const/ConstDefine";
import { GameMgr, ItemMgr, PioneerMgr, UserInfoMgr } from "../../Utils/Global";
import { OuterBuildingController } from "./OuterBuildingController";
import { UIName } from "../../Const/ConstUIDefine";
import { DialogueUI } from "../../UI/Outer/DialogueUI";
import { SecretGuardGettedUI } from "../../UI/Outer/SecretGuardGettedUI";
import { EventUI } from "../../UI/Outer/EventUI";
import NotificationMgr from "../../Basic/NotificationMgr";
import EventConfig from "../../Config/EventConfig";
import { NotificationName } from "../../Const/Notification";
import { OuterTiledMapActionController } from "./OuterTiledMapActionController";
import GameMainHelper from "../Helper/GameMainHelper";
import ViewController from "../../BasicView/ViewController";
import UIPanelManger from "../../Basic/UIPanelMgr";
import { DataMgr } from "../../Data/DataMgr";
import {
    FIGHT_FINISHED_DATA,
    MapPioneerActionType,
    MapPioneerLogicObject,
    MapPioneerLogicType,
    MapPioneerMoveDirection,
    MapPioneerObject,
    MapPioneerType,
} from "../../Const/PioneerDefine";
import { NetworkMgr } from "../../Net/NetworkMgr";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import { RookieStep } from "../../Const/RookieDefine";
import RookieStepMgr from "../../Manger/RookieStepMgr";
import { share } from "../../Net/msg/WebsocketMsg";
import { ItemConfigData } from "../../Const/Item";
import { OuterFightResultView } from "./View/OuterFightResultView";
import { OuterRebonAndDestroyView } from "./View/OuterRebonAndDestroyView";

const { ccclass, property } = _decorator;

@ccclass("OuterPioneerController")
export class OuterPioneerController extends ViewController {
    @property(Prefab)
    private onlyFightPrefab: Prefab = null;

    public showMovingPioneerAction(tilePos: TilePos, movingPioneerId: string, usedCursor: OuterMapCursorView) {
        this._actionShowPioneerId = movingPioneerId;
        this._actionUsedCursor = usedCursor;
        if (this._actionPioneerView != null) {
            this._actionPioneerView.destroy();
            this._actionPioneerView = null;
        }
        if (this._pioneerMap.has(movingPioneerId)) {
            const view = this._pioneerMap.get(movingPioneerId);
            if (view.getComponent(MapItemMonster) != null) {
                this._actionPioneerView = instantiate(view);
                this._actionPioneerView.setParent(view.getParent());
                this._actionPioneerView.worldPosition = GameMainHelper.instance.tiledMapGetPosWorld(tilePos.x, tilePos.y);

                this._actionPioneerView.setSiblingIndex(view.getSiblingIndex());
                this._actionPioneerView.getComponent(MapItemMonster).shadowMode();
            }
            const pioneer: MapPioneerObject = DataMgr.s.pioneer.getById(movingPioneerId);
            if (pioneer != null) {
                const path = [];
                let stepLogic: MapPioneerLogicObject = null;
                // for (const logic of pioneer.logics) {
                //     if (logic.type == MapPioneerLogicType.stepmove) {
                //         stepLogic = logic;
                //         break;
                //     }
                // }
                if (stepLogic != null) {
                    let nextTilePos = tilePos;
                    for (let i = 0; i < 15; i++) {
                        nextTilePos = GameMainHelper.instance.tiledMapGetAroundByDirection(v2(nextTilePos.x, nextTilePos.y), stepLogic.stepMove.direction);
                        path.push(nextTilePos);
                    }
                }
                if (path.length > 0) {
                    this._actionPioneerFootStepViews = this._addFootSteps(path, false);
                }
            }
        }
    }
    public hideMovingPioneerAction() {
        if (this._actionPioneerView != null) {
            this._actionPioneerView.destroy();
            this._actionPioneerView = null;
        }
        if (this._actionPioneerFootStepViews != null) {
            for (const view of this._actionPioneerFootStepViews) {
                view.destroy();
            }
            this._actionPioneerFootStepViews = null;
        }
        this._actionShowPioneerId = null;
        this._actionUsedCursor = null;
    }

    public showPioneerFootStep(pioneerId: string, movePaths: TilePos[]) {
        const footViews = this._addFootSteps(movePaths, true);
        this._footPathMap.set(pioneerId, footViews);
    }
    public clearPioneerFootStep(pioneerId: string) {
        if (this._footPathMap.has(pioneerId)) {
            for (const view of this._footPathMap.get(pioneerId)) {
                view.destroy();
            }
            this._footPathMap.delete(pioneerId);
        }
    }

    @property(Prefab)
    private selfPioneer: Prefab;

    @property(Prefab)
    private otherPioneer;

    @property(Prefab)
    private battleSmall;

    @property(Prefab)
    private fightPrefab: Prefab;
    @property(Prefab)
    private fightResultPrefab: Prefab;

    @property(Prefab)
    private footPathPrefab: Prefab;
    @property(Prefab)
    private footPathTargetPrefab: Prefab;

    @property(Prefab)
    private rebonPrefab: Prefab;

    private _pioneerMap: Map<string, Node> = new Map();

    private _movingPioneerIds: string[] = [];
    private _fightDataMap: Map<
        string,
        {
            isWin: boolean;
            attackerId: string;
            attackerHp: number;
            attackerHpmax: number;
            defenderId: string;
            defenderHp: number;
            defenderHpmax: number;
            view: OuterFightView;
            intervalId: number;
        }
    > = new Map();
    private _footPathMap: Map<string, Node[]> = new Map();

    private _actionPioneerView: Node = null;
    private _actionUsedCursor: OuterMapCursorView = null;
    private _actionPioneerFootStepViews: Node[] = null;

    private _actionShowPioneerId: string = null;
    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._pioneerMap = new Map();

        NotificationMgr.addListener(NotificationName.ROOKIE_GUIDE_TAP_MAP_PIONEER, this._onRookieTapPioneer, this);

        NotificationMgr.addListener(NotificationName.ROOKIE_GUIDE_BEGIN_EYES, this._onRookieGuideBeginEyes, this);
        NotificationMgr.addListener(NotificationName.ROOKIE_GUIDE_THIRD_EYES, this._onRookieGuideThirdEyes, this);

        // talk
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_TALK_CHANGED, this._refreshUI, this);
        // action
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_ACTIONTYPE_CHANGED, this._onPioneerActionChanged, this);
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_STAY_POSITION_CHANGE, this._onPioneerStayPositionChanged, this);
        // event
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_EVENTID_CHANGE, this._onPioneerEventIdChange, this);
        // hp
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_HP_CHANGED, this._onPioneerHpChanged, this);
        // show
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_SHOW_CHANGED, this._onPioneerShowChanged, this);
        // faction
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_FACTION_CHANGED, this._refreshUI, this);
        // move
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_BEGIN_MOVE, this._onPioneerBeginMove, this);
        NotificationMgr.addListener(NotificationName.MAP_PLAYER_PIONEER_DID_MOVE_STEP, this._onPlayerPioneerDidMoveOneStep, this);
        // fight
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_SHOW_FIGHT_ANIM, this._onShowFightAnim, this);
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_FIGHT_END, this._onFightEnd, this);
        NotificationMgr.addListener(NotificationName.MAP_FAKE_FIGHT_SHOW, this._onMapFakeFightShow, this);
        // rebon
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_REBON_CHANGE, this._refreshUI, this);
        // lan
        NotificationMgr.addListener(NotificationName.CHANGE_LANG, this._refreshUI, this);
    }

    protected async viewDidStart() {
        super.viewDidStart();
        this._refreshUI();
        // checkRookie
        this.scheduleOnce(async () => {
            const actionPioneer = DataMgr.s.pioneer.getCurrentPlayer();
            if (actionPioneer != null) {
                // game camera pos
                const currentWorldPos = GameMainHelper.instance.tiledMapGetPosWorld(actionPioneer.stayPos.x, actionPioneer.stayPos.y);
                GameMainHelper.instance.changeGameCameraWorldPosition(currentWorldPos);
                // game camera zoom
                const localOuterMapScale = localStorage.getItem("local_outer_map_scale");
                if (localOuterMapScale != null) {
                    GameMainHelper.instance.changeGameCameraZoom(parseFloat(localOuterMapScale));
                }
            }
            if (DataMgr.s.userInfo.data.rookieStep == RookieStep.WAKE_UP) {
                if (actionPioneer != null) {
                    this.scheduleOnce(() => {
                        GameMainHelper.instance.tiledMapShadowErase(actionPioneer.stayPos);
                    }, 0.2);
                    GameMainHelper.instance.changeGameCameraZoom(0.5);
                    // dead
                    actionPioneer.actionType = MapPioneerActionType.dead;
                    if (this._pioneerMap.has(actionPioneer.id)) {
                        this._pioneerMap.get(actionPioneer.id).getComponent(MapPioneer).refreshUI(actionPioneer);
                    }
                }
            }
            await RookieStepMgr.instance().init();
            GameMainHelper.instance.mapInitOver();
        });
    }

    protected viewUpdate(dt: number): void {
        super.viewUpdate(dt);

        const allPioneers = DataMgr.s.pioneer.getAll(true);
        for (var i = 0; i < allPioneers.length; i++) {
            let pioneer = allPioneers[i];
            if (this._movingPioneerIds.indexOf(pioneer.id) == -1 || !this._pioneerMap.has(pioneer.id)) {
                continue;
            }
            let usedSpeed = pioneer.speed;
            // for (const logic of pioneer.logics) {
            //     if (logic.moveSpeed > 0) {
            //         usedSpeed = logic.moveSpeed;
            //     }
            // }
            // artifact move speed
            if (pioneer.type == MapPioneerType.player) {
                usedSpeed = GameMgr.getAfterEffectValue(GameExtraEffectType.MOVE_SPEED, usedSpeed);
                if (PioneerGameTest) {
                    usedSpeed = 600;
                }
            }
            let pioneermap = this._pioneerMap.get(pioneer.id);
            this._updateMoveStep(usedSpeed, dt, pioneer, pioneermap);
        }
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.ROOKIE_GUIDE_TAP_MAP_PIONEER, this._onRookieTapPioneer, this);

        NotificationMgr.removeListener(NotificationName.ROOKIE_GUIDE_BEGIN_EYES, this._onRookieGuideBeginEyes, this);
        NotificationMgr.removeListener(NotificationName.ROOKIE_GUIDE_THIRD_EYES, this._onRookieGuideThirdEyes, this);

        // talk
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_TALK_CHANGED, this._refreshUI, this);
        // action
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_ACTIONTYPE_CHANGED, this._onPioneerActionChanged, this);
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_STAY_POSITION_CHANGE, this._onPioneerStayPositionChanged, this);
        // event
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_EVENTID_CHANGE, this._onPioneerEventIdChange, this);
        // hp
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_HP_CHANGED, this._onPioneerHpChanged, this);
        // show
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_SHOW_CHANGED, this._onPioneerShowChanged, this);
        // faction
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_FACTION_CHANGED, this._refreshUI, this);
        // dealwith
        // move
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_BEGIN_MOVE, this._onPioneerBeginMove, this);
        NotificationMgr.removeListener(NotificationName.MAP_PLAYER_PIONEER_DID_MOVE_STEP, this._onPlayerPioneerDidMoveOneStep, this);
        // fight
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_SHOW_FIGHT_ANIM, this._onShowFightAnim, this);
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_FIGHT_END, this._onFightEnd, this);
        NotificationMgr.removeListener(NotificationName.MAP_FAKE_FIGHT_SHOW, this._onMapFakeFightShow, this);
        // rebon
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_REBON_CHANGE, this._refreshUI, this);
        // lan
        NotificationMgr.removeListener(NotificationName.CHANGE_LANG, this._refreshUI, this);
    }

    private _refreshUI() {
        const decorationView = this.node.getComponent(OuterTiledMapActionController).mapDecorationView();
        if (decorationView == null) {
            return;
        }
        const allPioneers = DataMgr.s.pioneer.getAll();
        let changed: boolean = false;
        for (const pioneer of allPioneers) {
            if (pioneer.show) {
                let firstInit: boolean = false;
                let temple = null;
                if (this._pioneerMap.has(pioneer.id)) {
                    temple = this._pioneerMap.get(pioneer.id);
                } else {
                    // new
                    if (pioneer.type == MapPioneerType.player) {
                        temple = instantiate(this.selfPioneer);
                    } else if (pioneer.type == MapPioneerType.npc || pioneer.type == MapPioneerType.gangster) {
                        temple = instantiate(this.otherPioneer);
                    } else if (pioneer.type == MapPioneerType.hred) {
                        temple = instantiate(this.battleSmall);
                    }
                    temple.name = "MAP_" + pioneer.id;
                    temple.setParent(decorationView);
                    firstInit = true;
                    this._pioneerMap.set(pioneer.id, temple);

                    changed = true;
                }
                if (temple != null) {
                    if (pioneer.type == MapPioneerType.player) {
                        temple.getComponent(MapPioneer).refreshUI(pioneer);
                        temple.getComponent(MapPioneer).setEventWaitedCallback(async () => {
                            GameMainHelper.instance.isTapEventWaited = true;
                            const allBuildings = DataMgr.s.mapBuilding.getObj_building();
                            for (const building of allBuildings) {
                                if (building.eventId == pioneer.actionEventId) {
                                    const currentEvent = EventConfig.getById(building.eventId);
                                    if (currentEvent != null) {
                                        const result = await UIPanelManger.inst.pushPanel(UIName.BrachEventUI);
                                        if (result.success) {
                                            result.node.getComponent(EventUI).eventUIShow(pioneer.id, building.id, currentEvent);
                                        }
                                    }
                                    break;
                                }
                            }
                        });
                    } else if (pioneer.type == MapPioneerType.npc) {
                        temple.getComponent(OuterOtherPioneerView).refreshUI(pioneer);
                    } else if (pioneer.type == MapPioneerType.gangster) {
                        temple.getComponent(OuterOtherPioneerView).refreshUI(pioneer);
                    } else if (pioneer.type == MapPioneerType.hred) {
                        temple.getComponent(MapItemMonster).refreshUI(pioneer);
                    }
                    if (firstInit) {
                        let worldPos = GameMainHelper.instance.tiledMapGetPosWorld(pioneer.stayPos.x, pioneer.stayPos.y);
                        temple.setWorldPosition(worldPos);
                    }
                }
            } else {
                if (this._pioneerMap.has(pioneer.id)) {
                    this._pioneerMap.get(pioneer.id).destroy();
                    this._pioneerMap.delete(pioneer.id);
                }
            }
        }

        // destroy
        this._pioneerMap.forEach((value: Node, key: string) => {
            let isExsit: boolean = false;
            for (const pioneer of allPioneers) {
                if (pioneer.id == key) {
                    isExsit = true;
                    break;
                }
            }
            if (!isExsit) {
                value.destroy();
                this._pioneerMap.delete(key);
            }
        });

        if (changed) {
            this.node.getComponent(OuterTiledMapActionController).sortMapItemSiblingIndex();
        }
    }

    private _updateMoveStep(speed: number, deltaTime: number, pioneer: MapPioneerObject, pioneermap: Node) {
        if (pioneer.movePaths.length == 0) {
            return;
        }
        // var curtile = this._delegate.getPioneerTiledPosByWorldPos(pioneer.worldPos);
        // //break if curpos is skip
        // if (curtile.x != pioneer.movePath[0].x || curtile.y != pioneer.movePath[0].y) {
        //     pioneer.movePath.splice(0, 1);
        //     return;
        // }

        let nexttile = pioneer.movePaths[0];
        pioneer.stayPos = v2(nexttile.x, nexttile.y);
        var nextwpos = GameMainHelper.instance.tiledMapGetPosWorld(nexttile.x, nexttile.y);
        var dist = Vec3.distance(pioneermap.worldPosition, nextwpos);
        var add = (speed * deltaTime * this.node.scale.x) / 0.5; // calc map scale
        if (dist < add) {
            //havemove 2 target
            pioneermap.setWorldPosition(nextwpos);
            PioneerMgr.pioneerDidMoveOneStep(pioneer.id);
            if (pioneer.id == this._actionShowPioneerId && this._actionUsedCursor != null) {
                this._actionUsedCursor.hide();
                this._actionUsedCursor.show([pioneer.stayPos], Color.WHITE);
            }
            return;
        } else {
            var dir = new Vec3();
            Vec3.subtract(dir, nextwpos, pioneermap.worldPosition);
            dir = dir.normalize();
            var newpos = pioneermap.worldPosition.clone();
            newpos.x += dir.x * add;
            newpos.y += dir.y * add;
            pioneermap.setWorldPosition(newpos);
            if (pioneer.id == this._actionShowPioneerId && this._actionUsedCursor != null) {
                this._actionUsedCursor.move(v2(dir.x * add * 2, dir.y * add * 2));
            }
            //pioneer move direction
            let curMoveDirection = null;
            if (dir.y != 0) {
                curMoveDirection = dir.y > 0 ? MapPioneerMoveDirection.top : MapPioneerMoveDirection.bottom;
            } else if (dir.x != 0) {
                curMoveDirection = dir.x > 0 ? MapPioneerMoveDirection.right : MapPioneerMoveDirection.left;
            }
            if (curMoveDirection != pioneer.moveDirection) {
                pioneer.moveDirection = curMoveDirection;
                if (pioneermap.getComponent(OuterOtherPioneerView) != null) {
                    pioneermap.getComponent(OuterOtherPioneerView).refreshUI(pioneer);
                } else if (pioneermap.getComponent(MapPioneer) != null) {
                    pioneermap.getComponent(MapPioneer).refreshUI(pioneer);
                } else if (pioneermap.getComponent(MapItemMonster) != null) {
                    pioneermap.getComponent(MapItemMonster).refreshUI(pioneer);
                }
            }
        }
    }

    private _addFootSteps(path: TilePos[], isShowPioneerFlag: boolean): Node[] {
        const mapBottomView = this.node.getComponent(OuterTiledMapActionController).mapBottomView();
        if (mapBottomView == null) {
            return;
        }
        const footViews = [];
        for (let i = 0; i < path.length; i++) {
            if (i == path.length - 1) {
                const footView = instantiate(this.footPathTargetPrefab);
                footView.name = "footViewTarget";
                footView.getChildByPath("Monster").active = !isShowPioneerFlag;
                footView.getChildByPath("Pioneer").active = isShowPioneerFlag;
                // mapBottomView.insertChild(footView, 0);
                this.node.addChild(footView);
                let worldPos = GameMainHelper.instance.tiledMapGetPosWorld(path[i].x, path[i].y);
                footView.setWorldPosition(worldPos);
                footViews.push(footView);
            } else {
                const currentPath = path[i];
                const nextPath = path[i + 1];
                const footView = instantiate(this.footPathPrefab);
                footView.name = "footView";
                mapBottomView.insertChild(footView, 0);
                let worldPos = GameMainHelper.instance.tiledMapGetPosWorld(currentPath.x, currentPath.y);
                footView.setWorldPosition(worldPos);
                footViews.push(footView);
                if (nextPath.calc_x - currentPath.calc_x == -1 && nextPath.calc_y - currentPath.calc_y == 0 && nextPath.calc_z - currentPath.calc_z == 1) {
                    footView.angle = 90;
                } else if (
                    nextPath.calc_x - currentPath.calc_x == 1 &&
                    nextPath.calc_y - currentPath.calc_y == 0 &&
                    nextPath.calc_z - currentPath.calc_z == -1
                ) {
                    footView.angle = 270;
                } else if (
                    nextPath.calc_x - currentPath.calc_x == 1 &&
                    nextPath.calc_y - currentPath.calc_y == -1 &&
                    nextPath.calc_z - currentPath.calc_z == 0
                ) {
                    footView.angle = 330;
                } else if (
                    nextPath.calc_x - currentPath.calc_x == -1 &&
                    nextPath.calc_y - currentPath.calc_y == 1 &&
                    nextPath.calc_z - currentPath.calc_z == 0
                ) {
                    footView.angle = 150;
                } else if (
                    nextPath.calc_x - currentPath.calc_x == 0 &&
                    nextPath.calc_y - currentPath.calc_y == 1 &&
                    nextPath.calc_z - currentPath.calc_z == -1
                ) {
                    footView.angle = 210;
                } else if (
                    nextPath.calc_x - currentPath.calc_x == 0 &&
                    nextPath.calc_y - currentPath.calc_y == -1 &&
                    nextPath.calc_z - currentPath.calc_z == 1
                ) {
                    footView.angle = 390;
                }
            }
        }
        return footViews;
    }
    //--------------------------------------------- notification
    private _onRookieTapPioneer(data: { pioneerId: string }) {
        const view = this._pioneerMap.get(data.pioneerId);
        if (view == null) {
            return;
        }
        this.getComponent(OuterTiledMapActionController)._clickOnMap(view.worldPosition);
    }
    private _onRookieGuideBeginEyes() {
        const actionPioneer = DataMgr.s.pioneer.getCurrentPlayer();
        if (actionPioneer != null) {
            actionPioneer.actionType = MapPioneerActionType.wakeup;
            let view: MapPioneer = null;
            if (this._pioneerMap.has(actionPioneer.id)) {
                view = this._pioneerMap.get(actionPioneer.id).getComponent(MapPioneer);
            }
            view.refreshUI(actionPioneer);
            this.scheduleOnce(async () => {
                actionPioneer.actionType = MapPioneerActionType.idle;
                view.refreshUI(actionPioneer);
                UIPanelManger.inst.popPanelByName(UIName.RookieGuide);

                NetworkMgr.websocketMsg.player_rookie_update({
                    rookieStep: RookieStep.NPC_TALK_1,
                });
                // const result = await UIPanelManger.inst.pushPanel(UIName.DialogueUI);
                // if (result.success) {
                //     result.node.getComponent(DialogueUI).dialogShow(TalkConfig.getById("talk14"), () => {
                //     });
                // }
            }, 6.8);
        }
    }
    private _onRookieGuideThirdEyes() {
        GameMusicPlayMgr.playGameMusic();
        GameMainHelper.instance.changeGameCameraZoom(1, true);
    }
    //---------- pioneer
    private _onPioneerActionChanged(data: { id: string }) {
        const pioneer = DataMgr.s.pioneer.getById(data.id);
        if (pioneer != undefined && pioneer.show) {
            if (pioneer.actionType == MapPioneerActionType.moving) {
                this._movingPioneerIds.push(data.id);
            } else {
                const index = this._movingPioneerIds.indexOf(data.id);
                if (index >= 0) {
                    this._movingPioneerIds.splice(index, 1);
                }
                if (this._footPathMap.has(data.id)) {
                    for (const footView of this._footPathMap.get(data.id)) {
                        footView.destroy();
                    }
                    this._footPathMap.delete(data.id);
                }
            }
            this._refreshUI();
        }
    }
    private _onPioneerStayPositionChanged(data: { id: string }) {
        const pioneer = DataMgr.s.pioneer.getById(data.id);
        if (pioneer == undefined) {
            return;
        }
        if (!this._pioneerMap.has(data.id)) {
            return;
        }
        const view = this._pioneerMap.get(data.id);
        view.worldPosition = GameMainHelper.instance.tiledMapGetPosWorld(pioneer.stayPos.x, pioneer.stayPos.y);
    }
    private _onPioneerHpChanged(): void {
        // const actionView = this._pioneerMap.get(data.id);
        // if (actionView != null && actionView.getComponent(MapPioneer) != null) {
        //     actionView.getComponent(MapPioneer).playGetResourceAnim(ResourceCorrespondingItem.Troop, data.gainValue, null);
        // }
    }
    private _onPioneerShowChanged(data: { id: string; show: boolean }): void {
        if (data.show) {
            if (data.id == "pioneer_1" || data.id == "pioneer_2" || data.id == "pioneer_3") {
                // get secret guard

                const pioneer = DataMgr.s.pioneer.getById(data.id);
                if (pioneer != undefined) {
                    if (this["_LAST_NEW_TIME"] == null) {
                        this["_LAST_NEW_TIME"] = new Date().getTime();
                    } else {
                        const currentTimeStamp = new Date().getTime();
                        if (currentTimeStamp - this["_LAST_NEW_TIME"] <= 2000) {
                            UserInfoMgr.afterNewPioneerDatas.push(pioneer);
                            return;
                        }
                    }

                    setTimeout(async () => {
                        if (UIPanelManger.inst.panelIsShow(UIName.CivilizationLevelUpUI)) {
                            UserInfoMgr.afterCivilizationClosedShowPioneerDatas.push(pioneer);
                        } else {
                            const result = await UIPanelManger.inst.pushPanel(UIName.SecretGuardGettedUI);
                            if (result.success) {
                                result.node.getComponent(SecretGuardGettedUI).dialogShow(pioneer.animType);
                            }
                        }
                    });
                }
            }
        }
        this._refreshUI();

        const pioneer = DataMgr.s.pioneer.getById(data.id);
        if (pioneer == null || pioneer.type != MapPioneerType.hred) {
            return;
        }
        // hred
        const decorationView = this.node.getComponent(OuterTiledMapActionController).mapDecorationView();

        const rebornView: Node = instantiate(this.rebonPrefab);
        rebornView.setParent(decorationView);
        rebornView.setWorldPosition(GameMainHelper.instance.tiledMapGetPosWorld(pioneer.stayPos.x, pioneer.stayPos.y));
        rebornView.getComponent(OuterRebonAndDestroyView).playAnim(data.show ? 1 : 0);
    }
    private async _onPioneerEventIdChange(data: { triggerPioneerId: string; eventBuildingId: string; eventId: string }) {
        const eventConfig = EventConfig.getById(data.eventId);
        if (eventConfig == undefined) {
            return;
        }
        this._refreshUI();
        const result = await UIPanelManger.inst.pushPanel(UIName.BrachEventUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(EventUI).eventUIShow(data.triggerPioneerId, data.eventBuildingId, eventConfig);
    }
    private _onPioneerBeginMove(data: { id: string; showMovePath: boolean }): void {
        const pioneer = DataMgr.s.pioneer.getById(data.id);
        if (this._actionShowPioneerId == data.id) {
            if (this._actionPioneerFootStepViews != null) {
                for (const view of this._actionPioneerFootStepViews) {
                    view.destroy();
                }
                this._actionPioneerFootStepViews = null;
            }
            if (data.showMovePath && pioneer.movePaths.length > 0) {
                this._actionPioneerFootStepViews = this._addFootSteps(pioneer.movePaths, true);
            }
        } else {
            // if (data.showMovePath && pioneer.movePaths.length > 0) {
            //     const footViews = this._addFootSteps(pioneer.movePaths);
            //     this._footPathMap.set(pioneer.id, footViews);
            // }
        }
    }
    private _onPlayerPioneerDidMoveOneStep(data: { id: string }): void {
        if (this._footPathMap.get(data.id)) {
            const footViews = this._footPathMap.get(data.id);
            if (footViews.length > 0) {
                const footView = footViews.shift();
                footView.destroy();
            }
        }
        this.node.getComponent(OuterTiledMapActionController).sortMapItemSiblingIndex();
    }

    private _onShowFightAnim(data: {
        fightDatas: share.Ifight_res[];
        isWin: boolean;
        attackerData: { id: string; name: string; hp: number; hpmax: number };
        defenderData: { id: string; name: string; hp: number; hpmax: number };
    }) {
        const { fightDatas, isWin, attackerData, defenderData } = data;
        const attackerView = this._pioneerMap.get(attackerData.id);
        if (attackerView == null) {
            return;
        }
        GameMusicPlayMgr.playBeginFightEffect();
        const fightView = instantiate(this.fightPrefab).getComponent(OuterFightView);
        fightView.node.setParent(this.node);
        fightView.node.worldPosition = attackerView.worldPosition;
        fightView.refreshUI(
            {
                name: attackerData.name,
                hp: attackerData.hp,
                hpMax: attackerData.hpmax,
            },
            {
                name: defenderData.name,
                hp: defenderData.hp,
                hpMax: defenderData.hpmax,
            },
            true
        );
        const intervalId = setInterval(() => {
            if (fightDatas.length <= 0) {
                if (this._fightDataMap.has(attackerData.id)) {
                    const temp = this._fightDataMap.get(attackerData.id);
                    clearInterval(temp.intervalId);
                }
                return;
            }
            const tempFightData = fightDatas.shift();
            if (tempFightData.attackerId == attackerData.id) {
                // attacker action
                defenderData.hp -= tempFightData.hp;
            } else {
                attackerData.hp -= tempFightData.hp;
                NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_HP_CHANGED);
            }
            fightView.refreshUI(
                {
                    name: attackerData.name,
                    hp: attackerData.hp,
                    hpMax: attackerData.hpmax,
                },
                {
                    name: defenderData.name,
                    hp: defenderData.hp,
                    hpMax: defenderData.hpmax,
                },
                true
            );
        }, 1000);
        this._fightDataMap.set(attackerData.id, {
            isWin: isWin,
            attackerId: attackerData.id,
            attackerHp: attackerData.hp,
            attackerHpmax: attackerData.hpmax,

            defenderId: defenderData.id,
            defenderHp: defenderData.hp,
            defenderHpmax: defenderData.hpmax,
            view: fightView,
            intervalId: intervalId,
        });
    }
    private _onFightEnd(data: { id: string }) {
        if (!this._fightDataMap.has(data.id)) {
            return;
        }
        const fightData = this._fightDataMap.get(data.id);
        clearInterval(fightData.intervalId);

        const resultView = instantiate(this.fightResultPrefab);
        resultView.setParent(this.node);
        resultView.worldPosition = fightData.view.node.worldPosition;

        fightData.view.node.destroy();

        if (fightData.isWin) {
            GameMusicPlayMgr.playFightWinEffect();

            const rookieStep: RookieStep = DataMgr.s.userInfo.data.rookieStep;
            if (rookieStep == RookieStep.ENEMY_FIGHT && fightData.defenderId == "gangster_1") {
                NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_FIGHT_ENEMY_WIN);
            } else if (rookieStep == RookieStep.LOCAL_SYSTEM_TALK_32) {
                NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_FIGHT_ENEMY_WIN);
            }
        } else {
            GameMusicPlayMgr.playFightFailEffect();
        }
        resultView.getComponent(OuterFightResultView).showResult(fightData.isWin, () => {
            resultView.destroy();
            const attackPioneer = DataMgr.s.pioneer.getById(fightData.attackerId);
            const defendPioneer = DataMgr.s.pioneer.getById(fightData.defenderId);
            if (attackPioneer != null && defendPioneer != null) {
                NotificationMgr.triggerEvent(NotificationName.FIGHT_FINISHED, {
                    attacker: {
                        name: attackPioneer.name,
                        id: attackPioneer.id,
                        hp: fightData.attackerHp,
                        hpMax: fightData.attackerHpmax,
                    },
                    defender: {
                        name: defendPioneer.name,
                        id: defendPioneer.id,
                        hp: fightData.defenderHp,
                        hpMax: fightData.defenderHpmax,
                    },
                    attackerIsSelf: true,
                    buildingId: null,
                    position: attackPioneer.stayPos,
                    isWin: fightData.isWin,
                    rewards: [],
                    isWormhole: false,
                } as FIGHT_FINISHED_DATA);
            }
        });
        this._fightDataMap.delete(data.id);
    }
    private _onMapFakeFightShow(data: { stayPositions: Vec2[] }) {
        const fightView = instantiate(this.onlyFightPrefab);
        fightView.setParent(this.node);
        if (data.stayPositions.length == 7) {
            fightView.setWorldPosition(GameMainHelper.instance.tiledMapGetPosWorld(data.stayPositions[3].x, data.stayPositions[3].y));
        } else if (data.stayPositions.length == 3) {
            const beginWorldPos = GameMainHelper.instance.tiledMapGetPosWorld(data.stayPositions[0].x, data.stayPositions[0].y);
            const endWorldPos = GameMainHelper.instance.tiledMapGetPosWorld(data.stayPositions[1].x, data.stayPositions[1].y);
            fightView.setWorldPosition(v3(beginWorldPos.x, endWorldPos.y + (beginWorldPos.y - endWorldPos.y) / 2, 0));
        } else if (data.stayPositions.length > 0) {
            fightView.setWorldPosition(GameMainHelper.instance.tiledMapGetPosWorld(data.stayPositions[0].x, data.stayPositions[0].y));
        }
        this.scheduleOnce(() => {
            fightView.destroy();
        }, 5);
    }
}
