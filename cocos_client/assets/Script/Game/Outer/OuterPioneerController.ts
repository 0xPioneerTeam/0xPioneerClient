import { _decorator, Color, dynamicAtlasManager, instantiate, Node, Prefab, sp, v2, v3, Vec2, Vec3 } from "cc";
import NotificationMgr from "../../Basic/NotificationMgr";
import UIPanelManger from "../../Basic/UIPanelMgr";
import ViewController from "../../BasicView/ViewController";
import EventConfig from "../../Config/EventConfig";
import { GameExtraEffectType, PioneerGameTest } from "../../Const/ConstDefine";
import { UIName } from "../../Const/ConstUIDefine";
import { NotificationName } from "../../Const/Notification";
import {
    MapFightObject,
    MapPioneerActionType,
    MapPioneerLogicObject,
    MapPioneerMoveDirection,
    MapPioneerObject,
    MapPioneerType,
} from "../../Const/PioneerDefine";
import { RookieStep } from "../../Const/RookieDefine";
import { DataMgr } from "../../Data/DataMgr";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import RookieStepMgr from "../../Manger/RookieStepMgr";
import { share } from "../../Net/msg/WebsocketMsg";
import { NetworkMgr } from "../../Net/NetworkMgr";
import { EventUI } from "../../UI/Outer/EventUI";
import { SecretGuardGettedUI } from "../../UI/Outer/SecretGuardGettedUI";
import { GameMgr, PioneerMgr, UserInfoMgr } from "../../Utils/Global";
import GameMainHelper from "../Helper/GameMainHelper";
import { TileMapHelper, TilePos } from "../TiledMap/TileTool";
import { OuterTiledMapActionController } from "./OuterTiledMapActionController";
import { MapItemMonster } from "./View/MapItemMonster";
import { MapPioneer } from "./View/MapPioneer";
import { OuterFightResultView } from "./View/OuterFightResultView";
import { OuterFightView } from "./View/OuterFightView";
import { OuterMapCursorView } from "./View/OuterMapCursorView";
import { OuterOtherPioneerView } from "./View/OuterOtherPioneerView";
import { OuterRebonAndDestroyView } from "./View/OuterRebonAndDestroyView";
import PioneerConfig from "../../Config/PioneerConfig";

const { ccclass, property } = _decorator;

@ccclass("OuterPioneerController")
export class OuterPioneerController extends ViewController {
    @property(Prefab)
    private onlyFightPrefab: Prefab = null;

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
            defenderUniqueId: string;
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

        NotificationMgr.addListener(NotificationName.MAP_PIONEER_NEED_REFRESH, this._refreshUI, this);
        // talk
        NotificationMgr.addListener(NotificationName.TASK_CAN_TALK_CHANGE, this._refreshUI, this);
        // action
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_ACTIONTYPE_CHANGED, this._onPioneerActionChanged, this);
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_STAY_POSITION_CHANGE, this._onPioneerStayPositionChanged, this);
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
        // energy
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_ENERGY_CHANGED, this._onPioneerEnergyChanged, this);
        // lan
        NotificationMgr.addListener(NotificationName.CHANGE_LANG, this._refreshUI, this);

        let lastTime = new Date().getTime();
        setInterval(() => {
            const newTime = new Date().getTime();
            const gap = newTime - lastTime;
            lastTime = newTime;
            const allPioneers = DataMgr.s.pioneer.getAll();
            for (var i = 0; i < allPioneers.length; i++) {
                let pioneer = allPioneers[i];
                if (pioneer.type != MapPioneerType.player || pioneer.actionType != MapPioneerActionType.moving) {
                    continue;
                }
                // if (this._movingPioneerIds.indexOf(pioneer.uniqueId) == -1 || !this._pioneerMap.has(pioneer.uniqueId)) {
                //     continue;
                // }
                let usedSpeed = pioneer.speed;
                // for (const logic of pioneer.logics) {
                //     if (logic.moveSpeed > 0) {
                //         usedSpeed = logic.moveSpeed;
                //     }
                // }
                // artifact move speed
                usedSpeed = GameMgr.getAfterEffectValue(GameExtraEffectType.MOVE_SPEED, usedSpeed);
                if (PioneerGameTest) {
                    usedSpeed = 600;
                }
                let pioneermap = this._pioneerMap.get(pioneer.uniqueId);
                if (pioneermap == null) {
                    continue;
                }
                this._updateMoveStep(usedSpeed, gap / 1000, pioneer, pioneermap);
            }
        }, 1000 / 60);
    }

    protected async viewDidStart() {
        super.viewDidStart();
        this._refreshUI();
        // checkRookie
        // this.scheduleOnce(async () => {
        //     const actionPioneer = DataMgr.s.pioneer.getCurrentPlayer();
        //     if (actionPioneer != null) {
        //         // game camera pos
        //         const currentWorldPos = GameMainHelper.instance.tiledMapGetPosWorld(actionPioneer.stayPos.x, actionPioneer.stayPos.y);
        //         GameMainHelper.instance.changeGameCameraWorldPosition(currentWorldPos);
        //         // game camera zoom
        //         const localOuterMapScale = localStorage.getItem("local_outer_map_scale");
        //         if (localOuterMapScale != null) {
        //             GameMainHelper.instance.changeGameCameraZoom(parseFloat(localOuterMapScale));
        //         }
        //     }
        //     if (DataMgr.s.userInfo.data.rookieStep == RookieStep.WAKE_UP) {
        //         if (actionPioneer != null) {
        //             this.scheduleOnce(() => {
        //                 GameMainHelper.instance.tiledMapShadowErase(actionPioneer.stayPos);
        //             }, 0.2);
        //             GameMainHelper.instance.changeGameCameraZoom(0.5);
        //             // dead
        //             actionPioneer.actionType = MapPioneerActionType.dead;
        //             if (this._pioneerMap.has(actionPioneer.id)) {
        //                 this._pioneerMap.get(actionPioneer.id).getComponent(MapPioneer).refreshUI(actionPioneer);
        //             }
        //         }
        //     }
        //     await RookieStepMgr.instance().init();
        //     GameMainHelper.instance.mapInitOver();
        // });
        GameMainHelper.instance.mapInitOver();
    }

    protected viewUpdate(dt: number): void {
        super.viewUpdate(dt);
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.ROOKIE_GUIDE_TAP_MAP_PIONEER, this._onRookieTapPioneer, this);

        NotificationMgr.removeListener(NotificationName.ROOKIE_GUIDE_BEGIN_EYES, this._onRookieGuideBeginEyes, this);
        NotificationMgr.removeListener(NotificationName.ROOKIE_GUIDE_THIRD_EYES, this._onRookieGuideThirdEyes, this);

        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_NEED_REFRESH, this._refreshUI, this);
        // talk
        NotificationMgr.removeListener(NotificationName.TASK_CAN_TALK_CHANGE, this._refreshUI, this);
        // action
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_ACTIONTYPE_CHANGED, this._onPioneerActionChanged, this);
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_STAY_POSITION_CHANGE, this._onPioneerStayPositionChanged, this);
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
        // energy
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_ENERGY_CHANGED, this._onPioneerEnergyChanged, this);
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
            let canShow: boolean = pioneer.show;
            if (pioneer.type == MapPioneerType.player) {
                canShow = pioneer.actionType != MapPioneerActionType.inCity;
            }
            if (canShow) {
                let firstInit: boolean = false;
                let temple = null;
                if (this._pioneerMap.has(pioneer.uniqueId)) {
                    temple = this._pioneerMap.get(pioneer.uniqueId);
                } else {
                    if(pioneer.type != MapPioneerType.player && !GameMainHelper.instance.tiledMapIsInGameScene(pioneer.stayPos.x, pioneer.stayPos.y)){
                        continue;
                    }
                    // new
                    if (pioneer.type == MapPioneerType.player) {
                        temple = instantiate(this.selfPioneer);
                    } else if (pioneer.type == MapPioneerType.npc || pioneer.type == MapPioneerType.gangster) {
                        temple = instantiate(this.otherPioneer);
                    } else if (pioneer.type == MapPioneerType.hred) {
                        temple = instantiate(this.battleSmall);
                    }
                    temple.name = "MAP_" + pioneer.uniqueId;
                    temple.setParent(decorationView);
                    firstInit = true;
                    this._pioneerMap.set(pioneer.uniqueId, temple);
                    changed = true;
                }
                if (temple != null) {
                    if (pioneer.type == MapPioneerType.player) {
                        temple.getComponent(MapPioneer).refreshUI(pioneer);
                    } else if (pioneer.type == MapPioneerType.npc) {
                        temple.getComponent(OuterOtherPioneerView).refreshUI(pioneer);
                    } else if (pioneer.type == MapPioneerType.gangster) {
                        temple.getComponent(OuterOtherPioneerView).refreshUI(pioneer);
                    } else if (pioneer.type == MapPioneerType.hred) {
                        temple.getComponent(MapItemMonster).refreshUI(pioneer);
                    }
                    if (firstInit) {
                        let pixelPos = GameMainHelper.instance.tiledMapGetPosPixel(pioneer.stayPos.x, pioneer.stayPos.y);
                        temple.setPosition(pixelPos);
                    }
                }
            } else {
                if (this._pioneerMap.has(pioneer.uniqueId)) {
                    this._pioneerMap.get(pioneer.uniqueId).destroy();
                    this._pioneerMap.delete(pioneer.uniqueId);
                }
            }
        }

        // destroy
        this._pioneerMap.forEach((value: Node, key: string) => {
            let isExsit: boolean = false;
            for (const pioneer of allPioneers) {
                if (pioneer.uniqueId == key) {
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
        var nextwpos = GameMainHelper.instance.tiledMapGetPosPixel(nexttile.x, nexttile.y);
        var dist = Vec3.distance(pioneermap.position, nextwpos);
        var add = (speed * deltaTime * this.node.scale.x) / 0.5; // calc map scale
        if (dist < add) {
            //havemove 2 target
            pioneermap.setPosition(nextwpos);
            PioneerMgr.pioneerDidMoveOneStep(pioneer.uniqueId);
            if (pioneer.uniqueId == this._actionShowPioneerId && this._actionUsedCursor != null) {
                this._actionUsedCursor.hide();
                this._actionUsedCursor.show([pioneer.stayPos], Color.WHITE);
            }
            return;
        } else {
            var dir = new Vec3();
            Vec3.subtract(dir, nextwpos, pioneermap.position);
            dir = dir.normalize();
            var newpos = pioneermap.position.clone();
            newpos.x += dir.x * add;
            newpos.y += dir.y * add;
            pioneermap.setPosition(newpos);
            if (pioneer.uniqueId == this._actionShowPioneerId && this._actionUsedCursor != null) {
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
                let pixelPos = GameMainHelper.instance.tiledMapGetPosPixel(path[i].x, path[i].y);
                footView.setPosition(pixelPos);
                footViews.push(footView);
            } else {
                const currentPath = path[i];
                const nextPath = path[i + 1];
                const footView = instantiate(this.footPathPrefab);
                footView.name = "footView";
                mapBottomView.insertChild(footView, 0);
                let pixelPos = GameMainHelper.instance.tiledMapGetPosPixel(currentPath.x, currentPath.y);
                footView.setPosition(pixelPos);
                footViews.push(footView);

                if (nextPath.x - currentPath.x == -1 && nextPath.y - currentPath.y == 0) {
                    //left
                    footView.angle = 90;
                } else if (nextPath.x - currentPath.x == 1 && nextPath.y - currentPath.y == 0) {
                    //right
                    footView.angle = 270;
                } else {
                    if (currentPath.y % 2 == 0) {
                        if (nextPath.x - currentPath.x == -1 && nextPath.y - currentPath.y == -1) {
                            //lefttop
                            footView.angle = 390;
                        } else if (nextPath.x - currentPath.x == 0 && nextPath.y - currentPath.y == -1) {
                            //righttop
                            footView.angle = 330;
                        } else if (nextPath.x - currentPath.x == -1 && nextPath.y - currentPath.y == 1) {
                            //leftbottom
                            footView.angle = 150;
                        } else if (nextPath.x - currentPath.x == 0 && nextPath.y - currentPath.y == 1) {
                            //rightbottom
                            footView.angle = 210;
                        }
                    } else {
                        if (nextPath.x - currentPath.x == 0 && nextPath.y - currentPath.y == -1) {
                            //lefttop
                            footView.angle = 390;
                        } else if (nextPath.x - currentPath.x == 1 && nextPath.y - currentPath.y == -1) {
                            //righttop
                            footView.angle = 330;
                        } else if (nextPath.x - currentPath.x == 0 && nextPath.y - currentPath.y == 1) {
                            //leftbottom
                            footView.angle = 150;
                        } else if (nextPath.x - currentPath.x == 1 && nextPath.y - currentPath.y == 1) {
                            //rightbottom
                            footView.angle = 210;
                        }
                    }
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
        // const actionPioneer = DataMgr.s.pioneer.getCurrentPlayer();
        // if (actionPioneer != null) {
        //     actionPioneer.actionType = MapPioneerActionType.wakeup;
        //     let view: MapPioneer = null;
        //     if (this._pioneerMap.has(actionPioneer.id)) {
        //         view = this._pioneerMap.get(actionPioneer.id).getComponent(MapPioneer);
        //     }
        //     view.refreshUI(actionPioneer);
        //     this.scheduleOnce(async () => {
        //         actionPioneer.actionType = MapPioneerActionType.idle;
        //         view.refreshUI(actionPioneer);
        //         UIPanelManger.inst.popPanelByName(UIName.RookieGuide);
        //         NetworkMgr.websocketMsg.player_rookie_update({
        //             rookieStep: RookieStep.NPC_TALK_1,
        //         });
        //         // const result = await UIPanelManger.inst.pushPanel(UIName.DialogueUI);
        //         // if (result.success) {
        //         //     result.node.getComponent(DialogueUI).dialogShow(TalkConfig.getById("talk14"), () => {
        //         //     });
        //         // }
        //     }, 6.8);
        // }
    }
    private _onRookieGuideThirdEyes() {
        GameMusicPlayMgr.playGameMusic();
        GameMainHelper.instance.changeGameCameraZoom(1, true);
    }
    //---------- pioneer
    private _onPioneerActionChanged(data: { uniqueId: string }) {
        const pioneer = DataMgr.s.pioneer.getById(data.uniqueId);
        // if (pioneer == undefined || pioneer.type != MapPioneerType.player) {
        //     return;
        // }
        // if (pioneer.actionType == MapPioneerActionType.moving) {
        //     this._movingPioneerIds.push(pioneer.uniqueId);
        // } else {
        //     const index = this._movingPioneerIds.indexOf(pioneer.uniqueId);
        //     if (index >= 0) {
        //         this._movingPioneerIds.splice(index, 1);
        //     }
        //     if (this._footPathMap.has(pioneer.uniqueId)) {
        //         for (const footView of this._footPathMap.get(pioneer.uniqueId)) {
        //             footView.destroy();
        //         }
        //         this._footPathMap.delete(pioneer.uniqueId);
        //     }
        // }
        this._refreshUI();
    }
    private _onPioneerStayPositionChanged(data: { uniqueId: string }) {
        this._refreshUI();
    }
    private _onPioneerHpChanged(): void {
        // const actionView = this._pioneerMap.get(data.id);
        // if (actionView != null && actionView.getComponent(MapPioneer) != null) {
        //     actionView.getComponent(MapPioneer).playGetResourceAnim(ResourceCorrespondingItem.Troop, data.gainValue, null);
        // }
    }
    private _onPioneerShowChanged(data: { uniqueId: string; show: boolean }): void {
        // if (data.show) {
        //     if (data.id == "pioneer_1" || data.id == "pioneer_2" || data.id == "pioneer_3") {
        //         // get secret guard

        //         const pioneer = DataMgr.s.pioneer.getById(data.id);
        //         if (pioneer != undefined) {
        //             if (this["_LAST_NEW_TIME"] == null) {
        //                 this["_LAST_NEW_TIME"] = new Date().getTime();
        //             } else {
        //                 const currentTimeStamp = new Date().getTime();
        //                 if (currentTimeStamp - this["_LAST_NEW_TIME"] <= 2000) {
        //                     UserInfoMgr.afterNewPioneerDatas.push(pioneer);
        //                     return;
        //                 }
        //             }

        //             setTimeout(async () => {
        //                 if (UIPanelManger.inst.panelIsShow(UIName.CivilizationLevelUpUI)) {
        //                     UserInfoMgr.afterCivilizationClosedShowPioneerDatas.push(pioneer);
        //                 } else {
        //                     const result = await UIPanelManger.inst.pushPanel(UIName.SecretGuardGettedUI);
        //                     if (result.success) {
        //                         result.node.getComponent(SecretGuardGettedUI).dialogShow(pioneer.animType);
        //                     }
        //                 }
        //             });
        //         }
        //     }
        // }
        this._refreshUI();

        const pioneer = DataMgr.s.pioneer.getById(data.uniqueId);
        if (pioneer == null || pioneer.type != MapPioneerType.hred) {
            return;
        }
        // hred
        const decorationView = this.node.getComponent(OuterTiledMapActionController).mapDecorationView();
        const rebornView: Node = instantiate(this.rebonPrefab);
        rebornView.setParent(decorationView);
        rebornView.setPosition(GameMainHelper.instance.tiledMapGetPosPixel(pioneer.stayPos.x, pioneer.stayPos.y));
        rebornView.getComponent(OuterRebonAndDestroyView).playAnim(data.show ? 1 : 0);
    }
    private _onPioneerBeginMove(data: { uniqueId: string; showMovePath: boolean }): void {
        const pioneer = DataMgr.s.pioneer.getById(data.uniqueId);
        if (this._actionShowPioneerId == data.uniqueId) {
            if (this._actionPioneerFootStepViews != null) {
                for (const view of this._actionPioneerFootStepViews) {
                    view.destroy();
                }
                this._actionPioneerFootStepViews = null;
            }
            if (data.showMovePath && pioneer.movePaths.length > 0) {
                // this._actionPioneerFootStepViews = this._addFootSteps(pioneer.movePaths, true);
            }
        } else {
            // if (data.showMovePath && pioneer.movePaths.length > 0) {
            //     const footViews = this._addFootSteps(pioneer.movePaths);
            //     this._footPathMap.set(pioneer.id, footViews);
            // }
        }
    }
    private _onPlayerPioneerDidMoveOneStep(data: { uniqueId: string }): void {
        if (this._footPathMap.get(data.uniqueId)) {
            const footViews = this._footPathMap.get(data.uniqueId);
            if (footViews.length > 0) {
                const footView = footViews.shift();
                footView.destroy();
            }
        }
        this.node.getComponent(OuterTiledMapActionController).sortMapItemSiblingIndex();
    }

    private _onShowFightAnim(data: { fightDatas: share.Ifight_res[]; isWin: boolean; attackerData: MapFightObject; defenderData: MapFightObject }) {
        const { fightDatas, isWin, attackerData, defenderData } = data;
        const attackerView = this._pioneerMap.get(attackerData.uniqueId);
        if (attackerView == null) {
            return;
        }
        GameMusicPlayMgr.playBeginFightEffect();
        const fightView = instantiate(this.fightPrefab).getComponent(OuterFightView);
        fightView.node.setParent(this.node);
        fightView.node.worldPosition = attackerView.worldPosition;
        fightView.refreshUI(attackerData, defenderData, true);

        const intervalId = setInterval(() => {
            if (fightDatas.length <= 0) {
                if (this._fightDataMap.has(attackerData.uniqueId)) {
                    const temp = this._fightDataMap.get(attackerData.uniqueId);
                    clearInterval(temp.intervalId);
                }
                return;
            }
            const tempFightData = fightDatas.shift();
            if (tempFightData.attackerId == attackerData.uniqueId) {
                // attacker action
                defenderData.hp -= tempFightData.hp;
                fightView.attackAnim(attackerData, defenderData, tempFightData.hp, true);
            } else {
                attackerData.hp -= tempFightData.hp;
                fightView.attackAnim(attackerData, defenderData, tempFightData.hp, false);
            }
            // fightView.refreshUI(
            //     {
            //         name: attackerData.name,
            //         hp: attackerData.hp,
            //         hpMax: attackerData.hpmax,
            //     },
            //     {
            //         name: defenderData.name,
            //         hp: defenderData.hp,
            //         hpMax: defenderData.hpmax,
            //     },
            //     true
            // );
        }, 1000) as unknown as number;
        this._fightDataMap.set(attackerData.uniqueId, {
            isWin: isWin,
            attackerId: attackerData.uniqueId,
            attackerHp: attackerData.hp,
            attackerHpmax: attackerData.hpmax,

            defenderUniqueId: defenderData.uniqueId,
            defenderId: defenderData.id,
            defenderHp: defenderData.hp,
            defenderHpmax: defenderData.hpmax,
            view: fightView,
            intervalId: intervalId,
        });
    }
    private _onFightEnd(data: { uniqueId: string }) {
        if (!this._fightDataMap.has(data.uniqueId)) {
            return;
        }
        const fightData = this._fightDataMap.get(data.uniqueId);
        clearInterval(fightData.intervalId);

        const resultView = instantiate(this.fightResultPrefab);
        resultView.setParent(this.node);
        resultView.worldPosition = fightData.view.node.worldPosition;

        fightData.view.node.destroy();

        if (fightData.isWin) {
            GameMusicPlayMgr.playFightWinEffect();

            // const rookieStep: RookieStep = DataMgr.s.userInfo.data.rookieStep;
            // if (rookieStep == RookieStep.ENEMY_FIGHT && fightData.defenderId == "gangster_1") {
            //     NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_FIGHT_ENEMY_WIN);
            // } else if (rookieStep == RookieStep.LOCAL_SYSTEM_TALK_32) {
            //     NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_FIGHT_ENEMY_WIN);
            // }
        } else {
            GameMusicPlayMgr.playFightFailEffect();
        }
        resultView.getComponent(OuterFightResultView).showResult(fightData.isWin, () => {
            resultView.destroy();
        });
        this._fightDataMap.delete(data.uniqueId);
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

    private _onPioneerEnergyChanged(data: { uniqueId: string }) {
        const pioneer = DataMgr.s.pioneer.getById(data.uniqueId);
        if (pioneer == undefined) {
            return;
        }
        if (pioneer.energy <= 0) {
            // wait change
            GameMgr.showBuyEnergyTip(pioneer.uniqueId);
        }
    }
}
