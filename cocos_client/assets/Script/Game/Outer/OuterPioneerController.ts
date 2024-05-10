import { _decorator, Color, instantiate, math, Node, Prefab, v2, v3, Vec2, Vec3 } from "cc";
import { TilePos } from "../TiledMap/TileTool";
import { OuterFightView } from "./View/OuterFightView";
import { OuterOtherPioneerView } from "./View/OuterOtherPioneerView";
import { MapItemMonster } from "./View/MapItemMonster";
import { MapPioneer } from "./View/MapPioneer";
import { OuterMapCursorView } from "./View/OuterMapCursorView";
import { GameExtraEffectType, MapMemberFactionType, MapMemberTargetType, PioneerGameTest, ResourceCorrespondingItem } from "../../Const/ConstDefine";
import { BuildingMgr, GameMgr, ItemMgr, PioneerMgr, UserInfoMgr } from "../../Utils/Global";
import { OuterBuildingController } from "./OuterBuildingController";
import { UIName } from "../../Const/ConstUIDefine";
import { DialogueUI } from "../../UI/Outer/DialogueUI";
import { SecretGuardGettedUI } from "../../UI/Outer/SecretGuardGettedUI";
import { EventUI } from "../../UI/Outer/EventUI";
import NotificationMgr from "../../Basic/NotificationMgr";
import TalkConfig from "../../Config/TalkConfig";
import LvlupConfig from "../../Config/LvlupConfig";
import EventConfig from "../../Config/EventConfig";
import { OuterFightResultView } from "./View/OuterFightResultView";
import ItemData from "../../Const/Item";
import { NotificationName } from "../../Const/Notification";
import { OuterTiledMapActionController } from "./OuterTiledMapActionController";
import GameMainHelper from "../Helper/GameMainHelper";
import ViewController from "../../BasicView/ViewController";
import { TaskShowHideStatus } from "../../Const/TaskDefine";
import { EventConfigData } from "../../Const/Event";
import UIPanelManger from "../../Basic/UIPanelMgr";
import { MapBuildingObject, MapBuildingResourceObject, MapBuildingWormholeObject } from "../../Const/MapBuilding";
import { InnerBuildingType, MapBuildingType } from "../../Const/BuildingDefine";
import { DataMgr } from "../../Data/DataMgr";
import {
    MapNpcPioneerObject,
    MapPioneerActionType,
    MapPioneerAttributesChangeModel,
    MapPioneerLogicObject,
    MapPioneerLogicType,
    MapPioneerMoveDirection,
    MapPioneerObject,
    MapPioneerType,
} from "../../Const/PioneerDefine";
import { NetworkMgr } from "../../Net/NetworkMgr";

const { ccclass, property } = _decorator;

@ccclass("OuterPioneerController")
export class OuterPioneerController extends ViewController {
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
                for (const logic of pioneer.logics) {
                    if (logic.type == MapPioneerLogicType.stepmove) {
                        stepLogic = logic;
                        break;
                    }
                }
                if (stepLogic != null) {
                    let nextTilePos = tilePos;
                    for (let i = 0; i < 15; i++) {
                        nextTilePos = GameMainHelper.instance.tiledMapGetAroundByDirection(v2(nextTilePos.x, nextTilePos.y), stepLogic.stepMove.direction);
                        path.push(nextTilePos);
                    }
                }
                if (path.length > 0) {
                    this._actionPioneerFootStepViews = this._addFootSteps(path, stepLogic == null);
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
        const footViews = this._addFootSteps(movePaths);
        this._footPathMap.set(pioneerId, footViews);
    }
    public clearPioneerFootStep() {
        this._footPathMap.forEach((value: Node[])=> {
            for (const temp of value) {
                temp.destroy();
            }
        });
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

    private _pioneerMap: Map<string, Node> = new Map();
    private _movingPioneerIds: string[] = [];
    private _fightViewMap: Map<string, OuterFightView> = new Map();
    private _footPathMap: Map<string, Node[]> = new Map();

    private _actionPioneerView: Node = null;
    private _actionUsedCursor: OuterMapCursorView = null;
    private _actionPioneerFootStepViews: Node[] = null;

    private _actionShowPioneerId: string = null;
    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._pioneerMap = new Map();

        NotificationMgr.addListener(NotificationName.ROOKIE_GUIDE_BEGIN_EYES, this._onRookieGuideBeginEyes, this);
        NotificationMgr.addListener(NotificationName.ROOKIE_GUIDE_THIRD_EYES, this._onRookieGuideThirdEyes, this);

        // talk
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_TALK_CHANGED, this._refreshUI, this);
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_GET_TALK_COUNT_CHANGED, this._refreshUI, this);
        // action
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_ACTIONTYPE_CHANGED, this._onPioneerActionChanged, this);
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_EVENTSTATUS_CHANGED, this._refreshUI, this);
        // hp
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_HP_CHANGED, this._onPioneerHpChanged, this);
        // rebirth
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_REBIRTH_FINISHED, this._refreshUI, this);
        // show
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_SHOW_CHANGED, this._onPioneerShowChanged, this);
        // faction
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_FACTION_CHANGED, this._refreshUI, this);
        // dealwith
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_EXPLORED_PIONEER, this._onExploredPioneer, this);
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_EXPLORED_BUILDING, this._onExploredBuilding, this);
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_MINING_BUILDING, this._onMiningBuilding, this);
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_EVENT_BUILDING, this._onEventBuilding, this);
        // move
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_BEGIN_MOVE, this._onPioneerBeginMove, this);
        NotificationMgr.addListener(NotificationName.MAP_PLAYER_PIONEER_DID_MOVE_STEP, this._onPlayerPioneerDidMoveOneStep, this);
        // fight
        NotificationMgr.addListener(NotificationName.MAP_MEMEBER_FIGHT_BEGIN, this._onBeginFight, this);
        NotificationMgr.addListener(NotificationName.MAP_MEMEBER_FIGHT_DID_ATTACK, this._onFightDidAttack, this);
        NotificationMgr.addListener(NotificationName.MAP_MEMEBER_FIGHT_END, this._onEndFight, this);

        NotificationMgr.addListener(NotificationName.BUILDING_WORMHOLE_COUNT_DOWN_TIME_DID_FINISH, this._onWormholeCountDownTimeDidFinish, this);

    }

    protected viewDidStart() {
        super.viewDidStart();
        this._refreshUI();
        // checkRookie
        this.scheduleOnce(() => {
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
            if (!DataMgr.s.userInfo.data.didFinishRookie) {
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
            for (const logic of pioneer.logics) {
                if (logic.moveSpeed > 0) {
                    usedSpeed = logic.moveSpeed;
                }
            }
            // artifact move speed
            if (pioneer.type == MapPioneerType.player) {
                usedSpeed = GameMgr.getAfterExtraEffectPropertyByPioneer(pioneer.id, GameExtraEffectType.MOVE_SPEED, usedSpeed);
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

        NotificationMgr.removeListener(NotificationName.ROOKIE_GUIDE_BEGIN_EYES, this._onRookieGuideBeginEyes, this);
        NotificationMgr.removeListener(NotificationName.ROOKIE_GUIDE_THIRD_EYES, this._onRookieGuideThirdEyes, this);

        // talk
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_TALK_CHANGED, this._refreshUI, this);
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_GET_TALK_COUNT_CHANGED, this._refreshUI, this);
        // action
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_ACTIONTYPE_CHANGED, this._onPioneerActionChanged, this);
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_EVENTSTATUS_CHANGED, this._refreshUI, this);
        // hp
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_HP_CHANGED, this._onPioneerHpChanged, this);
        // rebirth
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_REBIRTH_FINISHED, this._refreshUI, this);
        // show
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_SHOW_CHANGED, this._onPioneerShowChanged, this);
        // faction
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_FACTION_CHANGED, this._refreshUI, this);
        // dealwith
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_EXPLORED_PIONEER, this._onExploredPioneer, this);
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_EXPLORED_BUILDING, this._onExploredBuilding, this);
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_MINING_BUILDING, this._onMiningBuilding, this);
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_EVENT_BUILDING, this._onEventBuilding, this);
        // move
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_BEGIN_MOVE, this._onPioneerBeginMove, this);
        NotificationMgr.removeListener(NotificationName.MAP_PLAYER_PIONEER_DID_MOVE_STEP, this._onPlayerPioneerDidMoveOneStep, this);
        // fight
        NotificationMgr.removeListener(NotificationName.MAP_MEMEBER_FIGHT_BEGIN, this._onBeginFight, this);
        NotificationMgr.removeListener(NotificationName.MAP_MEMEBER_FIGHT_DID_ATTACK, this._onFightDidAttack, this);
        NotificationMgr.removeListener(NotificationName.MAP_MEMEBER_FIGHT_END, this._onEndFight, this);

        NotificationMgr.removeListener(NotificationName.BUILDING_WORMHOLE_COUNT_DOWN_TIME_DID_FINISH, this._onWormholeCountDownTimeDidFinish, this);
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
                    temple.setParent(decorationView);
                    firstInit = true;
                    this._pioneerMap.set(pioneer.id, temple);

                    changed = true;
                }
                if (temple != null) {
                    if (pioneer.type == MapPioneerType.player) {
                        temple.getComponent(MapPioneer).refreshUI(pioneer);
                        temple.getComponent(MapPioneer).setEventWaitedCallback(() => {
                            GameMainHelper.instance.isTapEventWaited = true;
                            // const allBuildings = BuildingMgr.getAllBuilding();
                            const allBuildings = DataMgr.s.mapBuilding.getObj_building();
                            for (const building of allBuildings) {
                                if (building.eventId == pioneer.actionEventId) {
                                    const currentEvent = EventConfig.getById(building.eventId);
                                    if (currentEvent != null) {
                                        PioneerMgr.pioneerDealWithEvent(pioneer.id, building.id, currentEvent);
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

    private _refreshFightView(data: {
        fightId: string;
        isSelfAttack: boolean;
        isAttackBuilding: boolean;
        attackerInfo: { id: string; name: string; hp: number; hpMax: number };
        defenderInfo: { id: string; name: string; hp: number; hpMax: number };
        centerPos: Vec2[];
    }) {
        const { fightId, isSelfAttack, isAttackBuilding, attackerInfo, defenderInfo, centerPos } = data;
        const attacker = attackerInfo;
        const defender = defenderInfo;
        const attackerIsSelf = isSelfAttack;
        const fightPositons = centerPos;
        if (this._fightViewMap.has(fightId)) {
            this._fightViewMap.get(fightId).refreshUI(attacker, defender, attackerIsSelf);
        } else {
            const fightView = instantiate(this.fightPrefab).getComponent(OuterFightView);
            fightView.node.active = true;
            fightView.refreshUI(attacker, defender, attackerIsSelf);
            fightView.node.setParent(this.node);
            if (fightPositons.length == 7) {
                fightView.node.setWorldPosition(GameMainHelper.instance.tiledMapGetPosWorld(fightPositons[3].x, fightPositons[3].y));
            } else if (fightPositons.length == 3) {
                const beginWorldPos = GameMainHelper.instance.tiledMapGetPosWorld(fightPositons[0].x, fightPositons[0].y);
                const endWorldPos = GameMainHelper.instance.tiledMapGetPosWorld(fightPositons[1].x, fightPositons[1].y);
                fightView.node.setWorldPosition(v3(beginWorldPos.x, endWorldPos.y + (beginWorldPos.y - endWorldPos.y) / 2, 0));
            } else if (fightPositons.length > 0) {
                fightView.node.setWorldPosition(GameMainHelper.instance.tiledMapGetPosWorld(fightPositons[0].x, fightPositons[0].y));
            }
            this._fightViewMap.set(fightId, fightView);
        }
        let isEndFight: boolean = attacker.hp <= 0 || defender.hp <= 0;
        if (this._pioneerMap.has(attacker.id)) {
            const attackView = this._pioneerMap.get(attacker.id);
            if (isEndFight) {
                const pioneer = DataMgr.s.pioneer.getById(attacker.id);
                if (pioneer != null && pioneer.show) {
                    this.scheduleOnce(() => {
                        attackView.active = true;
                    }, 0.8);
                }
            } else {
                attackView.active = false;
            }
        }
        if (isAttackBuilding) {
            const buildingView = this.node.getComponent(OuterBuildingController).getBuildingView(defender.id);
            if (buildingView != null) {
                buildingView.showName(isEndFight);
            }
        } else if (this._pioneerMap.has(defender.id)) {
            const defendView = this._pioneerMap.get(defender.id);
            if (isEndFight) {
                const pioneer = DataMgr.s.pioneer.getById(defender.id);
                if (pioneer != null && pioneer.show) {
                    this.scheduleOnce(() => {
                        defendView.active = true;
                    }, 0.8);
                }
            } else {
                defendView.active = false;
            }
        }
    }

    private _addFootSteps(path: TilePos[], isTargetPosShowFlag: boolean = false): Node[] {
        const mapBottomView = this.node.getComponent(OuterTiledMapActionController).mapBottomView();
        if (mapBottomView == null) {
            return;
        }
        const footViews = [];
        for (let i = 0; i < path.length; i++) {
            if (i == path.length - 1) {
                if (isTargetPosShowFlag) {
                    const footView = instantiate(this.footPathTargetPrefab);
                    footView.name = "footViewTarget";
                    mapBottomView.insertChild(footView, 0);
                    let worldPos = GameMainHelper.instance.tiledMapGetPosWorld(path[i].x, path[i].y);
                    footView.setWorldPosition(worldPos);
                    footViews.push(footView);
                }
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

    private _checkInMainCityRangeAndHealHpToMax(pioneerId: string) {
        const mainCityId = "building_1";
        const pioneer = DataMgr.s.pioneer.getById(pioneerId);

        // const mainCity = BuildingMgr.getBuildingById(mainCityId);
        const mainCity = DataMgr.s.mapBuilding.getBuildingById(mainCityId);

        if (mainCity != null && mainCity.faction != MapMemberFactionType.enemy && pioneer != null && pioneer.show) {
            let radialRange = DataMgr.s.userInfo.data.cityRadialRange;
            radialRange = GameMgr.getAfterExtraEffectPropertyByBuilding(InnerBuildingType.MainCity, GameExtraEffectType.CITY_RADIAL_RANGE, radialRange);

            const isInCityRange: boolean = BuildingMgr.checkMapPosIsInBuilingRange(pioneer.stayPos, mainCityId, radialRange);
            if (isInCityRange && pioneer.hp < pioneer.hpMax) {
                PioneerMgr.pioneerHealHpToMax(pioneerId);
            }
        }
    }

    //--------------------------------------------- notification
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
                UIPanelManger.inst.popPanel();
                const result = await UIPanelManger.inst.pushPanel(UIName.DialogueUI);
                if (result.success) {
                    result.node.getComponent(DialogueUI).dialogShow(TalkConfig.getById("talk14"), () => {
                        NetworkMgr.websocketMsg.player_rookie_finish({});
                    });
                }
            }, 10);
        }
    }
    private _onRookieGuideThirdEyes() {
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
    private _onPioneerHpChanged(data: { id: string; gainValue: number }): void {
        const actionView = this._pioneerMap.get(data.id);
        if (actionView != null && actionView.getComponent(MapPioneer) != null) {
            actionView.getComponent(MapPioneer).playGetResourceAnim(ResourceCorrespondingItem.Troop, data.gainValue, null);
        }
    }
    private _onPioneerShowChanged(data: { id: string; show: boolean }): void {
        if (data.show) {
            DataMgr.s.task.showHideChanged(MapMemberTargetType.pioneer, data.id, TaskShowHideStatus.show);
            if (data.id == "pioneer_1" || data.id == "pioneer_2" || data.id == "pioneer_3") {
                // get secret guard
                const pioneer = DataMgr.s.pioneer.getById(data.id);
                if (pioneer != undefined) {
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
        } else {
            DataMgr.s.task.showHideChanged(MapMemberTargetType.pioneer, data.id, TaskShowHideStatus.hide);
        }
        this._refreshUI();
    }
    private async _onExploredPioneer(data: { id: string }): Promise<void> {
        const pioneer = DataMgr.s.pioneer.getById(data.id);
        if (pioneer != null) {
            if (pioneer.type == MapPioneerType.gangster) {
                // upload resource changed explore
                DataMgr.s.item.addObj_item([new ItemData(ResourceCorrespondingItem.Troop, pioneer.hpMax)]);
            } else if (pioneer.type == MapPioneerType.npc) {
                const npcModel = pioneer as MapNpcPioneerObject;
                if (!!npcModel && npcModel.talkId != null) {
                    const talk = TalkConfig.getById(npcModel.talkId);
                    const result = await UIPanelManger.inst.pushPanel(UIName.DialogueUI);
                    if (result.success) {
                        result.node.getComponent(DialogueUI).dialogShow(talk);
                    }
                }
            }
        }
    }
    private _onExploredBuilding(data: { id: string }): void {
        // const building = BuildingMgr.getBuildingById(buildingId);
        const building = DataMgr.s.mapBuilding.getBuildingById(data.id);
        if (building != null) {
            if (building.progress > 0) {
                const effectProgress = GameMgr.getAfterExtraEffectPropertyByPioneer(null, GameExtraEffectType.TREASURE_PROGRESS, building.progress);
                DataMgr.s.userInfo.gainTreasureProgress(effectProgress);
            }
            if (building.exp > 0) DataMgr.s.userInfo.gainExp(building.exp);
        }
    }
    private _onMiningBuilding(data: { actionId: string; id: string }): void {
        // const buildingObj: MapBuildingObject = BuildingMgr.getBuildingById(buildingId);
        const buildingObj: MapBuildingObject = DataMgr.s.mapBuilding.getBuildingById(data.id);

        if (buildingObj == null) return;
        if (buildingObj.type != MapBuildingType.resource) return;

        const building = buildingObj as MapBuildingResourceObject;

        if (building.resources != null) {
            let actionView = null;
            if (this._pioneerMap.has(data.actionId)) {
                actionView = this._pioneerMap.get(data.actionId);
            }
            const resultNum: number = Math.floor(building.resources.num * (1 + LvlupConfig.getTotalExtraRateByLvl(DataMgr.s.userInfo.data.level)));
            actionView.getComponent(MapPioneer).playGetResourceAnim(building.resources.id, resultNum, () => {
                // upload resource changed gather
                DataMgr.s.item.addObj_item([new ItemData(building.resources.id, resultNum)]);
            });

            NotificationMgr.triggerEvent(NotificationName.MINING_FINISHED, {
                buildingId: data.id,
                pioneerId: data.actionId,
                duration: 3000, //todo see assets/Script/Manger/PioneerMgr.ts:1225
                rewards: [], // no item loots by now
            });
        }

        if (building.progress > 0) {
            const effectProgress = GameMgr.getAfterExtraEffectPropertyByPioneer(null, GameExtraEffectType.TREASURE_PROGRESS, building.progress);
            DataMgr.s.userInfo.gainTreasureProgress(effectProgress);
        }
        if (building.exp > 0) DataMgr.s.userInfo.gainExp(building.exp);
    }
    private async _onEventBuilding(data: { pioneerId: string; buildingId: string; eventId: string }): Promise<void> {
        const actionPioneerId = data.pioneerId;
        const buildingId = data.buildingId;
        const eventId = data.eventId;

        DataMgr.s.battleReport.latestActiveEventState = {
            pioneerId: actionPioneerId,
            buildingId: buildingId,
            eventId: eventId,
            prevEventId: null,
        };
        const event = EventConfig.getById(eventId);
        if (event != null) {
            const result = await UIPanelManger.inst.pushPanel(UIName.BrachEventUI);
            if (result.success) {
                result.node.getComponent(EventUI).eventUIShow(
                    actionPioneerId,
                    buildingId,
                    event,
                    (
                        attackerPioneerId: string,
                        enemyPioneerId: string,
                        temporaryAttributes: Map<string, MapPioneerAttributesChangeModel>,
                        fightOver: (succeed: boolean) => void
                    ) => {
                        PioneerMgr.pioneerEventStatusToNone(actionPioneerId);
                        PioneerMgr.fight(DataMgr.s.pioneer.getById(attackerPioneerId), DataMgr.s.pioneer.getById(enemyPioneerId), null, true, DataMgr.s.mapBuilding.getBuildingById(buildingId).stayMapPositions, temporaryAttributes, fightOver);
                    },
                    (nextEvent: EventConfigData) => {
                        PioneerMgr.pioneerEventStatusToNone(actionPioneerId);
                        PioneerMgr.pioneerDealWithEvent(actionPioneerId, buildingId, nextEvent);
                    }
                );
            }
        }
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
        this._checkInMainCityRangeAndHealHpToMax(data.id);
    }

    private _onBeginFight(data: {
        fightId: string;
        isSelfAttack: boolean;
        isAttackBuilding: boolean;
        attackerInfo: { id: string; name: string; hp: number; hpMax: number };
        defenderInfo: { id: string; name: string; hp: number; hpMax: number };
        centerPos: Vec2[];
    }): void {
        this._refreshFightView(data);
    }
    private _onFightDidAttack(data: {
        fightId: string;
        isSelfAttack: boolean;
        isAttackBuilding: boolean;
        attackerInfo: { id: string; name: string; hp: number; hpMax: number };
        defenderInfo: { id: string; name: string; hp: number; hpMax: number };
        centerPos: Vec2[];
    }): void {
        this._refreshFightView(data);
    }
    private _onEndFight(data: { fightId: string; isSelfWin: boolean; playerPioneerId: string }): void {
        //fightview destroy
        if (this._fightViewMap.has(data.fightId)) {
            const fightView = this._fightViewMap.get(data.fightId);
            const resultView = instantiate(this.fightResultPrefab);
            resultView.setParent(fightView.node.parent);
            resultView.position = fightView.node.position;
            resultView.getComponent(OuterFightResultView).showResult(data.isSelfWin, () => {
                resultView.destroy();
            });
            fightView.node.destroy();
            this._fightViewMap.delete(data.fightId);
        }

        if (data.playerPioneerId != null) {
            this._checkInMainCityRangeAndHealHpToMax(data.playerPioneerId);
        }
    }

    private _onWormholeCountDownTimeDidFinish(data: { id: string }) {
        const building = DataMgr.s.mapBuilding.getBuildingById(data.id);
        if (building == null) {
            return;
        }
        // fake wormhole fight
        GameMgr.fakeWormholeFight(building.defendPioneerIds);

        const tempIds = building.defendPioneerIds.slice();
        for (const pioneerId of tempIds) {
            PioneerMgr.pioneerToIdle(pioneerId);
        }
    }
}
