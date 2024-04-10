import { _decorator, Component, Node, Vec2, Vec3, Camera, UITransform, Input, input, Prefab, v2, v3, Mask, tween, CCString, SpriteFrame, instantiate, Sprite, EventMouse, Color, TiledMap, size, RenderRoot2D, Widget, CCInteger, Animation, view, Canvas } from 'cc';
import { MapBuildingType } from '../../Const/BuildingDefine';
import { ECursorType, MapMemberFactionType, PioneerGameTest, ResourceCorrespondingItem } from '../../Const/ConstDefine';
import { MapPioneerType, MapPioneerActionType, MapPioneerLogicType } from '../../Const/Model/MapPioneerModelDefine';
import { UIHUDController } from '../../UI/UIHUDController';
import { TilePos, TileHexDirection } from '../TiledMap/TileTool';
import MapPioneerModel from './Model/MapPioneerModel';
import { OuterPioneerController } from './OuterPioneerController';
import { OuterFogAnimShapMask } from './View/OuterFogAnimShapMask';
import { OuterFogMask } from './View/OuterFogMask';
import { OuterMapCursorView } from './View/OuterMapCursorView';
import { ResOprView } from './View/ResOprView';
import { ArtifactMgr, BuildingMgr, ItemMgr, LanMgr, PioneerMgr, UserInfoMgr } from '../../Utils/Global';
import GameMainHelper from '../Helper/GameMainHelper';
import ViewController from '../../BasicView/ViewController';
import EventConfig from '../../Config/EventConfig';
import Config from '../../Const/Config';
import MapBuildingModel from './Model/MapBuildingModel';
import { ArtifactEffectType } from '../../Const/Artifact';


const { ccclass, property } = _decorator;

@ccclass('OuterTiledMapActionController')
export class OuterTiledMapActionController extends ViewController {

    public mapBottomView(): Node {
        return this._mapBottomView;
    }
    public mapDecorationView(): Node {
        return this._decorationView;
    }
    public sortMapItemSiblingIndex() {
        let index = 1;
        const items: { node: Node, tilePos: TilePos }[] = [];
        for (const children of this._decorationView.children) {
            items.push({
                node: children,
                tilePos: GameMainHelper.instance.tiledMapGetTiledPosByWorldPos(children.worldPosition)
            });
        };
        items.sort((a, b) => {
            return a.tilePos.y - b.tilePos.y;
        });
        for (const item of items) {
            item.node.setSiblingIndex(index);
            index += 1;
        }
    }

    @property(Prefab)
    tiledmap: Prefab

    @property(Prefab)
    private resOprPrefab = null;

    @property([CCString])
    private tiledMapTogetherBlock: string[] = [];

    @property([SpriteFrame])
    private fogAnimDissolveImages: SpriteFrame[] = [];

    @property(Prefab)
    private shadowBorderPrefab = null;

    @property(Prefab)
    private gridFogPrefab = null;

    private _mouseDown: boolean = false;
    private _showOuterCameraPosition: Vec3 = Vec3.ZERO;
    private _showOuterCameraZoom: number = 1;

    private _localEraseShadowWorldPos: Vec2[] = [];
    private _localEraseDataKey: string = "erase_shadow";
    private _fogAnimOriginalPos: Vec3 = null;

    private _fogAnimPlaying: boolean = false;
    private _fogAnimDatas: { allClearedTilePosions: { startPos: Vec2, endPos: Vec2 }[], animTilePostions: TilePos[], direciton: TileHexDirection }[] = [];

    private _togetherBlockPositons: Vec2[][] = [];


    private _fogItem: Node = null;

    private _mapBottomView: Node = null;
    private _mapCursorView: OuterMapCursorView = null;
    private _mapActionCursorView: OuterMapCursorView = null;
    private _decorationView: Node = null;
    private _fogView: OuterFogMask = null;
    private _fogAnimView: Mask = null;
    private _fogAnimShapView: OuterFogAnimShapMask = null;
    private _boundContent: Node = null;
    private _boundItemMap: Map<string, Node> = new Map();
    private _boundPrefabItems: Node[] = [];
    private _actionView: ResOprView = null;

    private _hexViewRadius: number = 0;
    protected viewDidLoad(): void {
        super.viewDidLoad()

        this._initTileMap();

        // local shadow erase
        this._localEraseShadowWorldPos = [];
        const eraseShadowData: string = localStorage.getItem(this._localEraseDataKey);
        if (eraseShadowData != null) {
            for (const temple of JSON.parse(eraseShadowData)) {
                this._localEraseShadowWorldPos.push(v2(temple.x, temple.y));
            }
        }
        for (const pos of this._localEraseShadowWorldPos) {
            GameMainHelper.instance.tiledMapShadowErase(pos);
        }
    }
    protected viewDidStart(): void {
        super.viewDidStart();

        this._mouseDown = false;
        let downx = 0;
        let downy = 0;
        this.node.on(Node.EventType.MOUSE_DOWN, (event: EventMouse) => {
            this._mouseDown = true;
            downx = event.getLocation().x;
            downy = event.getLocation().y;
        }, this);

        this.node.on(Node.EventType.MOUSE_UP, (event: EventMouse) => {
            this._mouseDown = false;
            var pos = event.getLocation();
            if (Math.abs(downx - pos.x) <= 3 &&
                Math.abs(downy - pos.y) <= 3) {
                //if pick a empty area.
                //let pioneer move to
                const wpos = GameMainHelper.instance.getGameCameraScreenToWorld(v3(pos.x, pos.y, 0));
                this._clickOnMap(wpos);
            };
        }, this);

        this.node.on(Node.EventType.MOUSE_LEAVE, (event: EventMouse) => {
            this._mouseDown = false;
        }, this);

        this.node.on(Node.EventType.MOUSE_WHEEL, (event: EventMouse) => {
            let zoom = GameMainHelper.instance.gameCameraZoom;
            if (event.getScrollY() > 0) {
                zoom -= 0.05;
            } else {
                zoom += 0.05;
            }
            GameMainHelper.instance.changeGameCameraZoom(zoom);
            if (Config.canSaveLocalData) {
                localStorage.setItem("local_outer_map_scale", zoom.toString());
            }
            this._fixCameraPos(GameMainHelper.instance.gameCameraPosition.clone());
        }, this);

        this.node.on(Node.EventType.MOUSE_MOVE, (event: EventMouse) => {
            GameMainHelper.instance.changeCursor(ECursorType.Common);
            if (this._mouseDown) {
                let pos = GameMainHelper.instance.gameCameraPosition.clone().add(new Vec3(-event.movementX, event.movementY, 0));
                this._fixCameraPos(pos);

            } else {
                if (GameMainHelper.instance.isTiledMapHelperInited) {
                    const pos = event.getLocation();
                    const wpos = GameMainHelper.instance.getGameCameraScreenToWorld(v3(pos.x, pos.y, 0));
                    var tp = GameMainHelper.instance.tiledMapGetTiledPosByWorldPos(wpos);
                    if (tp != null) {
                        if (!GameMainHelper.instance.tiledMapIsAllBlackShadow(tp.x, tp.y)) {
                            // check building first, because of building is block
                            const stayBuilding = BuildingMgr.getShowBuildingByMapPos(v2(tp.x, tp.y));
                            if (stayBuilding != null && stayBuilding.show) {
                                if (stayBuilding.type == MapBuildingType.city &&
                                    stayBuilding.faction != MapMemberFactionType.enemy) {
                                    const centerPos = stayBuilding.stayMapPositions[3];
                                    const visionPositions = [];
                                    let radialRange = UserInfoMgr.cityVision;
                                    const artifactEffect = ArtifactMgr.getEffectiveEffect(UserInfoMgr.artifactStoreLevel);
                                    if (artifactEffect != null && artifactEffect.has(ArtifactEffectType.CITY_RADIAL_RANGE)) {
                                        radialRange += artifactEffect.get(ArtifactEffectType.CITY_RADIAL_RANGE);
                                    }
                                    const extAround = GameMainHelper.instance.tiledMapGetExtAround(centerPos, radialRange - 1);
                                    for (const temple of extAround) {
                                        visionPositions.push(v2(temple.x, temple.y));
                                    }
                                    this._mapCursorView.show(stayBuilding.stayMapPositions, Color.WHITE, visionPositions, Color.BLUE);
                                } else {
                                    this._mapCursorView.show(stayBuilding.stayMapPositions, Color.WHITE);
                                }
                                GameMainHelper.instance.changeCursor(ECursorType.Action);
                            } else {
                                const isBlock = GameMainHelper.instance.tiledMapIsBlock(v2(tp.x, tp.y));
                                if (isBlock) {
                                    let cursorShowTilePositions: Vec2[] = null;
                                    for (const positions of this._togetherBlockPositons) {
                                        if (positions.some(temple => temple.x === tp.x && temple.y === tp.y)) {
                                            cursorShowTilePositions = positions;
                                            break;
                                        }
                                    }
                                    if (cursorShowTilePositions == null) {
                                        const decorate = BuildingMgr.getDecorateByMapPos(v2(tp.x, tp.y));
                                        if (decorate != null) {
                                            cursorShowTilePositions = decorate.stayMapPositions;
                                        } else {
                                            cursorShowTilePositions = [v2(tp.x, tp.y)];
                                        }
                                    }
                                    this._mapCursorView.show(cursorShowTilePositions, Color.RED);
                                    GameMainHelper.instance.changeCursor(ECursorType.Error);

                                } else {
                                    const stayPioneers = PioneerMgr.getShowPioneersByMapPos(v2(tp.x, tp.y));
                                    let existOtherPioneer: MapPioneerModel = null;
                                    for (const templePioneer of stayPioneers) {
                                        if (templePioneer.type != MapPioneerType.player) {
                                            existOtherPioneer = templePioneer;
                                            break;
                                        }
                                    }
                                    if (existOtherPioneer != null) {
                                        GameMainHelper.instance.changeCursor(ECursorType.Action);
                                    }
                                    this._mapCursorView.show([v2(tp.x, tp.y)], Color.WHITE);
                                }
                            }

                        } else {
                            this._mapCursorView.hide();
                            GameMainHelper.instance.changeCursor(ECursorType.Error);
                        }
                    } else {
                        this._mapCursorView.hide();
                    }
                } else {
                    this._mapCursorView.hide();
                }
            }
        }, this);
        // local fog
        this._refreshFog(GameMainHelper.instance.tiledMapGetShadowClearedTiledPositions());
    }

    protected viewDidAppear(): void {
        super.viewDidAppear();

        GameMainHelper.instance.changeGameCameraPosition(this._showOuterCameraPosition.clone());
        GameMainHelper.instance.changeGameCameraZoom(this._showOuterCameraZoom);

    }

    protected viewDidDisAppear(): void {
        super.viewDidDisAppear();

        this._showOuterCameraPosition = GameMainHelper.instance.gameCameraPosition.clone();
        this._showOuterCameraZoom = GameMainHelper.instance.gameCameraZoom;
    }

    protected viewUpdate(dt: number): void {
        super.viewUpdate(dt);

        this._updateTiledmap(dt);
    }
    //------------------------------------
    private _initTileMap(): void {
        if (this.tiledmap == null)
            return;
        const mapView = instantiate(this.tiledmap);
        this.node.addChild(mapView);

        this._togetherBlockPositons = [];
        for (const positionsString of this.tiledMapTogetherBlock) {
            const temple = [];
            for (const posString of positionsString.split(";")) {
                temple.push(v2(parseInt(posString.split(",")[0]), parseInt(posString.split(",")[1])));
            }
            this._togetherBlockPositons.push(temple);
        }

        this._decorationView = mapView.getChildByPath("deco_layer");

        this._mapBottomView = new Node("bottomContent");
        this._mapBottomView.layer = this.node.layer;
        mapView.addChild(this._mapBottomView);
        this._mapBottomView.addComponent(UITransform).setContentSize(mapView.getComponent(UITransform).contentSize);
        this._mapBottomView.setSiblingIndex(this._decorationView.getSiblingIndex());

        this._mapCursorView = this.node.getChildByPath("Floor/PointerCursor").getComponent(OuterMapCursorView);
        this._mapCursorView.node.removeFromParent();
        this._mapBottomView.addChild(this._mapCursorView.node);

        this._mapActionCursorView = this.node.getChildByPath("Floor/ActionCursor").getComponent(OuterMapCursorView);
        this._mapActionCursorView.node.removeFromParent();
        this._mapBottomView.addChild(this._mapActionCursorView.node);

        // force change shadow siblingIndex
        mapView.getChildByPath("shadow").setSiblingIndex(99);

        var _tilemap = mapView.getComponent(TiledMap);
        _tilemap.enableCulling = false;
        let c = new Color(255, 255, 255, 255);
        _tilemap.getLayer("shadow").color = c;

        //init tiledmap by a helper class
        GameMainHelper.instance.initTiledMapHelper(_tilemap);

        this._fogItem = instantiate(this.gridFogPrefab);
        this._fogItem.layer = this.node.layer;
        // this._fogItem.scale = v3(1.8, 1.8, 1);
        this._fogItem.active = false;

        this._fogView = this.node.getChildByPath("Floor/Fog").getComponent(OuterFogMask);
        this._fogView.node.setSiblingIndex(99);

        this._fogAnimView = this.node.getChildByPath("Floor/FogAnim").getComponent(Mask);
        this._fogAnimView.node.active = false;
        this._fogAnimView.node.setSiblingIndex(100);
        this._fogAnimOriginalPos = this._fogAnimView.node.position.clone();

        this._fogAnimShapView = this._fogAnimView.node.getChildByPath("SharpMask").getComponent(OuterFogAnimShapMask);

        this._boundContent = this.node.getChildByPath("Floor/BoundContent");
        this._boundContent.setSiblingIndex(101);


        this._actionView = instantiate(this.resOprPrefab).getComponent(ResOprView);
        this._actionView.node.setScale(v3(2, 2, 2));
        this._actionView.node.setParent(this.node);
        this._actionView.hide();

        this._hexViewRadius = GameMainHelper.instance.tiledMapTilewidth * this.node.scale.x / 2;

        this._mapCursorView.initData(this._hexViewRadius, this.node.scale.x);
        this._mapActionCursorView.initData(this._hexViewRadius, this.node.scale.x);

        mapView.getChildByPath("BorderMask").setSiblingIndex(999);
    }

    private _lastPioneerStayPos: Map<string, Vec2> = new Map();
    private _lastTime: number = 0;
    private async _updateTiledmap(delta: number) {
        if (!GameMainHelper.instance.isTiledMapHelperInited) {
            return;
        }
        GameMainHelper.instance.tiledMapShadowUpdate(delta);
        //clean pioneer view
        const selfPioneer = await PioneerMgr.getPlayerPioneer();
        for (const pioneer of selfPioneer) {
            if (pioneer.show) {
                let isExsit: boolean = false;
                for (const localErase of this._localEraseShadowWorldPos) {
                    if (pioneer.stayPos.x === localErase.x &&
                        pioneer.stayPos.y === localErase.y) {
                        isExsit = true;
                        break;
                    }
                }
                const newCleardPositons = GameMainHelper.instance.tiledMapShadowErase(pioneer.stayPos, pioneer.id);
                if (!isExsit) {
                    this._localEraseShadowWorldPos.push(pioneer.stayPos);
                    if (Config.canSaveLocalData) {
                        localStorage.setItem(this._localEraseDataKey, JSON.stringify(this._localEraseShadowWorldPos));
                    }
                }
                // has new, deal with fog
                if (!this._lastPioneerStayPos.has(pioneer.id)) {
                    this._lastPioneerStayPos.set(pioneer.id, pioneer.stayPos);
                }
                const lastStayPos = this._lastPioneerStayPos.get(pioneer.id);
                if (lastStayPos.x != pioneer.stayPos.x ||
                    lastStayPos.y != pioneer.stayPos.y) {
                    // let currentMoveDirection = null;
                    // const direction = [TileHexDirection.Left, TileHexDirection.LeftBottom, TileHexDirection.LeftTop, TileHexDirection.Right, TileHexDirection.RightBottom, TileHexDirection.RightTop];
                    // for (const d of direction) {
                    //     const around = GameMainHelper.instance.tiledMapGetAroundByDirection(this._tiledhelper.getPos(lastStayPos.x, lastStayPos.y), d);
                    //     if (around.x == pioneer.stayPos.x &&
                    //         around.y == pioneer.stayPos.y) {
                    //         currentMoveDirection = d;
                    //         break;
                    //     }
                    // }
                    this._lastPioneerStayPos.set(pioneer.id, pioneer.stayPos);
                    this._refreshFog(GameMainHelper.instance.tiledMapGetShadowClearedTiledPositions(), newCleardPositons, pioneer.stayPos);
                }
            }
        }
    }

    private _clickOnMap(worldpos: Vec3) {
        if (this._actionView.isShow) {
            this._actionView.hide();
            this._mapActionCursorView.hide();
            this.node.getComponent(OuterPioneerController).hideMovingPioneerAction();
            return;
        }
        if (this["_actionViewActioned"] == true) {
            this["_actionViewActioned"] = false;
            return;
        }
        if (GameMainHelper.instance.isTapEventWaited) {
            GameMainHelper.instance.isTapEventWaited = false;
            return;
        }
        const tiledPos = GameMainHelper.instance.tiledMapGetTiledPosByWorldPos(worldpos);
        if (GameMainHelper.instance.tiledMapIsAllBlackShadow(tiledPos.x, tiledPos.y)) {
            return;
        }
        // check is busy
        if (PioneerMgr.currentActionPioneerIsBusy()) {
            // useLanMgr
            // UIHUDController.showCenterTip(LanMgr.getLanById("203002"));
            // UIHUDController.showCenterTip("pioneer is busy");
            return;
        }
        // check is dead
        const currentActionPioneer = PioneerMgr.getCurrentPlayerPioneer();
        if (!currentActionPioneer.show && currentActionPioneer.rebirthCountTime > 0) {
            // useLanMgr
            UIHUDController.showCenterTip(LanMgr.getLanById("203003"));
            // UIHUDController.showCenterTip("pioneer is dead");
            return;
        }

        // -1-move 0-talk 1-explore 2-collect 3-fight 4-camp 5-event 6-campcancel
        // -2 no action
        let actionType: number = -1;
        let actionMovingPioneerId: string = null;
        let targetFightBuildingModel: MapBuildingModel = null;
        let stayPositons: Vec2[] = [];
        let purchaseMovingPioneerId = null;
        let purchaseMovingBuildingId = null;
        // check is building first
        const stayBuilding = BuildingMgr.getShowBuildingByMapPos(v2(tiledPos.x, tiledPos.y));
        if (stayBuilding != null) {
            if (currentActionPioneer.actionType == MapPioneerActionType.defend &&
                stayBuilding.type == MapBuildingType.stronghold) {
                actionType = 6;
                stayPositons = stayBuilding.stayMapPositions;

            } else if (currentActionPioneer.actionType == MapPioneerActionType.eventing) {
                if (stayBuilding.eventId == currentActionPioneer.actionEventId) {
                    const currentEvent = EventConfig.getById(stayBuilding.eventId);
                    PioneerMgr.pioneerDealWithEvent(currentActionPioneer.id, stayBuilding.id, currentEvent);
                } else {
                    UIHUDController.showCenterTip(LanMgr.getLanById("203005"));
                    // UIHUDController.showCenterTip("pioneer is processing event");
                }
                actionType = -2;

            } else {
                if (stayBuilding.type == MapBuildingType.city) {
                    if (stayBuilding.faction != MapMemberFactionType.enemy) {
                        GameMainHelper.instance.changeInnerAndOuterShow();
                        actionType = -2;
                    } else {
                        actionType = 3;
                        targetFightBuildingModel = stayBuilding;
                    }
                } else if (stayBuilding.type == MapBuildingType.explore) {
                    actionType = 1;
                } else if (stayBuilding.type == MapBuildingType.resource) {
                    actionType = 2;
                } else if (stayBuilding.type == MapBuildingType.stronghold) {
                    actionType = 4;
                } else if (stayBuilding.type == MapBuildingType.event) {
                    actionType = 5;
                }
                if (actionType != -2 && actionType != 3) {
                    purchaseMovingBuildingId = stayBuilding.id;
                }
                stayPositons = stayBuilding.stayMapPositions;
            }
        } else {
            const isBlock = GameMainHelper.instance.tiledMapIsBlock(v2(tiledPos.x, tiledPos.y));
            if (isBlock) {
                // useLanMgr
                UIHUDController.showCenterTip(LanMgr.getLanById("203001"));
                // UIHUDController.showCenterTip("cann't move to block");
                return;
            }
            if (currentActionPioneer.actionType == MapPioneerActionType.defend) {
                actionType = -2;
                // useLanMgr
                UIHUDController.showCenterTip(LanMgr.getLanById("203004"));
                // UIHUDController.showCenterTip("pioneer is defending");

            } else if (currentActionPioneer.actionType == MapPioneerActionType.eventing) {
                actionType = -2;
                // useLanMgr
                UIHUDController.showCenterTip(LanMgr.getLanById("203005"));
                // UIHUDController.showCenterTip("pioneer is processing event");
            } else {
                const stayPioneers = PioneerMgr.getShowPioneersByMapPos(v2(tiledPos.x, tiledPos.y));
                let currentPioneer: MapPioneerModel = null;
                for (const tempPioneer of stayPioneers) {
                    if (tempPioneer.id != currentActionPioneer.id) {
                        currentPioneer = tempPioneer;
                        break;
                    }
                }
                if (currentPioneer != null) {
                    if (currentPioneer.faction == MapMemberFactionType.friend) {
                        if (currentPioneer.type == MapPioneerType.npc) {
                            actionType = 0;
                        } else if (currentPioneer.type == MapPioneerType.gangster) {
                            actionType = 1;
                        }
                    } else {
                        actionType = 3;
                        let isMoving: boolean = false;
                        for (const logic of currentPioneer.logics) {
                            if (logic.type == MapPioneerLogicType.targetmove ||
                                logic.type == MapPioneerLogicType.stepmove ||
                                logic.type == MapPioneerLogicType.patrol ||
                                logic.type == MapPioneerLogicType.commonmove) {
                                isMoving = true;
                                break;
                            }
                        }
                        if (isMoving) {
                            actionMovingPioneerId = currentPioneer.id;
                        }
                    }
                    if (actionType != 3) {
                        purchaseMovingPioneerId = currentPioneer.id;
                    }
                    stayPositons = [currentPioneer.stayPos];
                }
            }
        }
        if (actionType == -1) {
            stayPositons = [v2(tiledPos.x, tiledPos.y)];
        }
        if (actionType >= -1) {
            this._mapActionCursorView.show(stayPositons, Color.WHITE);
            let setWorldPosition = null;
            if (stayPositons.length == 1) {
                setWorldPosition = GameMainHelper.instance.tiledMapGetPosWorld(stayPositons[0].x, stayPositons[0].y);

            } else if (stayPositons.length == 3) {
                const beginWorldPos = GameMainHelper.instance.tiledMapGetPosWorld(stayPositons[0].x, stayPositons[0].y);
                const endWorldPos = GameMainHelper.instance.tiledMapGetPosWorld(stayPositons[1].x, stayPositons[1].y);
                setWorldPosition = v3(
                    beginWorldPos.x,
                    endWorldPos.y + (beginWorldPos.y - endWorldPos.y) / 2,
                    0
                );

            } else if (stayPositons.length == 7) {
                setWorldPosition = GameMainHelper.instance.tiledMapGetPosWorld(stayPositons[3].x, stayPositons[3].y);
            }
            // cacluate will movePath
            // -1-move 0-talk 1-explore 2-collect 3-fight 4-camp 5-event 6-campcancel
            let taregtPos: Vec2 = null;
            let sparePositions: Vec2[] = [];
            let targetStayPositions: Vec2[] = [];
            if (actionType == -1) {
                taregtPos = v2(tiledPos.x, tiledPos.y);

            } else if (actionType == 3) {
                if (actionMovingPioneerId != null) {
                    // to moving enemy
                    taregtPos = PioneerMgr.getPioneerById(actionMovingPioneerId).stayPos;

                } else if (targetFightBuildingModel != null) {
                    taregtPos = v2(tiledPos.x, tiledPos.y);
                    sparePositions = targetFightBuildingModel.stayMapPositions;
                }
                else {
                    taregtPos = v2(tiledPos.x, tiledPos.y);
                }
            } else if (actionType == 6) {
                // nothing

            } else {
                // to pioneer or building
                if (purchaseMovingPioneerId != null) {
                    taregtPos = v2(tiledPos.x, tiledPos.y);
                    const toStayPioneer = PioneerMgr.getPioneerById(purchaseMovingPioneerId);
                    if (toStayPioneer != null) {
                        targetStayPositions = [toStayPioneer.stayPos];
                    }

                } else if (purchaseMovingBuildingId != null) {
                    taregtPos = v2(tiledPos.x, tiledPos.y);
                    const toStayBuilding = BuildingMgr.getBuildingById(purchaseMovingBuildingId);
                    if (toStayBuilding != null) {
                        targetStayPositions = toStayBuilding.stayMapPositions;
                        sparePositions = toStayBuilding.stayMapPositions;
                    }
                }
            }
            let movePaths = [];
            if (taregtPos != null) {
                const toPosMoveData = GameMainHelper.instance.tiledMapGetTiledMovePathByTiledPos(currentActionPioneer.stayPos, taregtPos, targetStayPositions);
                if (toPosMoveData.canMove) {
                    movePaths = toPosMoveData.path;
                } else if (sparePositions.length > 0) {
                    let minMovePath = null;
                    for (const templePos of sparePositions) {
                        const templePath = GameMainHelper.instance.tiledMapGetTiledMovePathByTiledPos(currentActionPioneer.stayPos, templePos, targetStayPositions);
                        if (templePath.canMove) {
                            if (minMovePath == null) {
                                minMovePath = templePath.path;
                            } else {
                                if (minMovePath.length > templePath.path.length) {
                                    minMovePath = templePath.path;
                                }
                            }
                        }
                    }
                    if (minMovePath != null) {
                        movePaths = minMovePath;
                    }
                }
            }

            this._actionView.show(setWorldPosition, actionType, movePaths.length, (useActionType: number, costEnergy: number) => {
                this["_actionViewActioned"] = true;
                if (PioneerGameTest) {

                } else {
                    if (costEnergy > 0) {
                        const ownEnergy: number = ItemMgr.getOwnItemCount(ResourceCorrespondingItem.Energy);
                        if (ownEnergy < costEnergy) {
                            UIHUDController.showCenterTip(LanMgr.getLanById("106002"));
                            return;
                        }
                        ItemMgr.subItem(ResourceCorrespondingItem.Energy, costEnergy);
                    }
                }
                if (useActionType == 6) {
                    // cancel camp
                    PioneerMgr.pioneerToIdle(currentActionPioneer.id);

                } else {
                    // move to near pioneer or building
                    currentActionPioneer.purchaseMovingPioneerId = purchaseMovingPioneerId;
                    currentActionPioneer.purchaseMovingBuildingId = purchaseMovingBuildingId;
                }
                PioneerMgr.pioneerBeginMove(currentActionPioneer.id, movePaths);
                this._mapActionCursorView.hide();
                this.node.getComponent(OuterPioneerController).hideMovingPioneerAction();
            }, () => {
                this["_actionViewActioned"] = true;
                this._mapActionCursorView.hide();
                this.node.getComponent(OuterPioneerController).hideMovingPioneerAction();
            });
            if (actionMovingPioneerId != null) {
                this.node.getComponent(OuterPioneerController).showMovingPioneerAction(tiledPos, actionMovingPioneerId, this._mapActionCursorView);
            }
        }
    }

    private _fixCameraPos(pos: Vec3) {
        const cameraSize = GameMainHelper.instance.gameCameraSize;
        const contentSize = this.node.getComponent(UITransform).contentSize;
        const visibleSize = view.getVisibleSize();
        const scale = this.node.scale;
        const cameraViewRate = visibleSize.width / cameraSize.width;
        const range = 0.2;
        const sc = 1;
        const minx = (-contentSize.width * scale.x / 2 - contentSize.width * scale.x * range) * sc + cameraSize.width / 2 * cameraViewRate;
        const maxx = (contentSize.width * scale.x / 2 + contentSize.width * scale.x * range) * sc - cameraSize.width / 2 * cameraViewRate;
        const miny = (-contentSize.height * scale.y / 2 - contentSize.height * scale.y * range) * sc + cameraSize.height / 2 * cameraViewRate;
        const maxy = (contentSize.height * scale.y / 2 + contentSize.height * scale.y * range) * sc - cameraSize.height / 2 * cameraViewRate;

        pos.x = Math.min(Math.max(minx, pos.x), maxx);
        pos.y = Math.min(Math.max(miny, pos.y), maxy);

        GameMainHelper.instance.changeGameCameraPosition(pos);
    }

    private _refreshFog(allClearedShadowPositions: TilePos[], newCleardPositons: TilePos[] = null, stayPos: Vec2 = null) {
        const getAllBoundLines: { startPos: Vec2, endPos: Vec2 }[] = [];
        const getAllBoundPos: Vec3[] = [];

        const hexViewRadius = GameMainHelper.instance.tiledMapTilewidth * this.node.scale.x / 2;
        const sinValue = Math.sin(30 * Math.PI / 180);
        for (const pos of allClearedShadowPositions) {
            let isBound: boolean = false;
            const centerPos = GameMainHelper.instance.tiledMapGetPosWorld(pos.x, pos.y);
            // direction around no hex or hex is shadow, direction is bound.

            const leftTop = GameMainHelper.instance.tiledMapGetAroundByDirection(v2(pos.x, pos.y), TileHexDirection.LeftTop);
            if (leftTop == null || GameMainHelper.instance.tiledMapIsAllBlackShadow(leftTop.x, leftTop.y)) {
                getAllBoundLines.push({
                    startPos: v2(centerPos.x, hexViewRadius + centerPos.y),
                    endPos: v2(-hexViewRadius + centerPos.x, sinValue * hexViewRadius + centerPos.y)
                });
                isBound = true;
            }

            const left = GameMainHelper.instance.tiledMapGetAroundByDirection(v2(pos.x, pos.y), TileHexDirection.Left);
            if (left == null || GameMainHelper.instance.tiledMapIsAllBlackShadow(left.x, left.y)) {
                getAllBoundLines.push({
                    startPos: v2(-hexViewRadius + centerPos.x, sinValue * hexViewRadius + centerPos.y),
                    endPos: v2(-hexViewRadius + centerPos.x, -sinValue * hexViewRadius + centerPos.y)
                });
                isBound = true;
            }

            const leftBottom = GameMainHelper.instance.tiledMapGetAroundByDirection(v2(pos.x, pos.y), TileHexDirection.LeftBottom);
            if (leftBottom == null || GameMainHelper.instance.tiledMapIsAllBlackShadow(leftBottom.x, leftBottom.y)) {
                getAllBoundLines.push({
                    startPos: v2(-hexViewRadius + centerPos.x, -sinValue * hexViewRadius + centerPos.y),
                    endPos: v2(centerPos.x, -hexViewRadius + centerPos.y),
                });
                isBound = true;
            }

            const rightbottom = GameMainHelper.instance.tiledMapGetAroundByDirection(v2(pos.x, pos.y), TileHexDirection.RightBottom);
            if (rightbottom == null || GameMainHelper.instance.tiledMapIsAllBlackShadow(rightbottom.x, rightbottom.y)) {
                getAllBoundLines.push({
                    startPos: v2(centerPos.x, -hexViewRadius + centerPos.y),
                    endPos: v2(hexViewRadius + centerPos.x, -sinValue * hexViewRadius + centerPos.y),
                });
                isBound = true;
            }

            const right = GameMainHelper.instance.tiledMapGetAroundByDirection(v2(pos.x, pos.y), TileHexDirection.Right);
            if (right == null || GameMainHelper.instance.tiledMapIsAllBlackShadow(right.x, right.y)) {
                getAllBoundLines.push({
                    startPos: v2(hexViewRadius + centerPos.x, -sinValue * hexViewRadius + centerPos.y),
                    endPos: v2(hexViewRadius + centerPos.x, sinValue * hexViewRadius + centerPos.y)
                });
                isBound = true;
            }

            const rightTop = GameMainHelper.instance.tiledMapGetAroundByDirection(v2(pos.x, pos.y), TileHexDirection.RightTop);
            if (rightTop == null || GameMainHelper.instance.tiledMapIsAllBlackShadow(rightTop.x, rightTop.y)) {
                getAllBoundLines.push({
                    startPos: v2(hexViewRadius + centerPos.x, sinValue * hexViewRadius + centerPos.y),
                    endPos: v2(centerPos.x, hexViewRadius + centerPos.y)
                });
                isBound = true;
            }
            if (isBound) {
                getAllBoundPos.push(centerPos);
            }
        }
        for (const line of getAllBoundLines) {
            const inFogStartPos = this._fogView.node.getComponent(UITransform).convertToNodeSpaceAR(v3(line.startPos.x, line.startPos.y, 0));
            line.startPos = v2(Math.floor(inFogStartPos.x), Math.floor(inFogStartPos.y));

            const inFogEndPos = this._fogView.node.getComponent(UITransform).convertToNodeSpaceAR(v3(line.endPos.x, line.endPos.y, 0));
            line.endPos = v2(Math.floor(inFogEndPos.x), Math.floor(inFogEndPos.y));
        }

        if (this._fogAnimDatas.length <= 0 &&
            !this._fogAnimPlaying &&
            newCleardPositons == null) {
            // no anim
            // this._fogView.draw(getAllBoundLines);
        }
        if (newCleardPositons != null) {
            // this._fogAnimDatas.push({
            //     allClearedTilePosions: getAllBoundLines,
            //     animTilePostions: newCleardPositons,
            // });
            this._playFogAnim(getAllBoundLines, newCleardPositons, stayPos);
        }
        return;
        // bound fog
        for (const pos of getAllBoundPos) {
            if (this._boundItemMap.has(pos.x + "|" + pos.y)) {

            } else {
                let item: Node = null;
                if (this._boundPrefabItems.length > 0) {
                    item = this._boundPrefabItems.pop();
                } else {
                    item = instantiate(this._fogItem);
                }
                item.setParent(this._boundContent);
                item.setWorldPosition(pos);
                item.active = true;
                item.getComponent(Animation).play("fog_Schistose_A1");

                this._boundItemMap.set(pos.x + "|" + pos.y, item);
            }
        }
        this._boundItemMap.forEach((value: Node, key: string) => {
            let isNeed = false;
            for (const tempPos of getAllBoundPos) {
                if (key == (tempPos.x + "|" + tempPos.y)) {
                    isNeed = true;
                    break;
                }
            }
            if (!isNeed) {
                value.removeFromParent();
                this._boundPrefabItems.push(value);
                this._boundItemMap.delete(key);
            }
        });
    }

    private _playFogAnim(
        allClearedTilePosions: { startPos: Vec2, endPos: Vec2 }[],
        animTilePostions: TilePos[],
        pioneerStayPos: Vec2,
    ) {
        // draw bg fog
        // this._fogView.draw(allClearedTilePosions);
        // dismiss anim
        const stayWorldPos = GameMainHelper.instance.tiledMapGetPosWorld(pioneerStayPos.x, pioneerStayPos.y);
        for (const tilePos of animTilePostions) {
            const fogView = instantiate(this._fogItem);
            const wp = GameMainHelper.instance.tiledMapGetPosWorld(tilePos.x, tilePos.y);
            fogView.active = true;
            fogView.setParent(this.node);
            fogView.setWorldPosition(wp);
            // fogView.getComponent(Animation).play("fog_Schistose_A2");
            fogView.getComponent(Animation).play();
            fogView.getComponent(Animation).on(Animation.EventType.FINISHED, () => {
                fogView.destroy();
            });
            var dir = new Vec3();
            Vec3.subtract(dir, wp, stayWorldPos);
            dir = dir.normalize();
            // tween(fogView)
            // .delay(0.3)
            // .by(0.4, { position: v3(dir.x * 80, dir.y * 80, dir.x ) })
            // .start();
        }
        // if (data.animTilePostions != null && data.animTilePostions.length > 0) {
        //     this._fogAnimPlaying = true;
        //     this._fogAnimView.node.active = true;

        //     const fogPositions = [];
        //     let minWorldPosX: number = null;
        //     let maxWorldPosX: number = null;
        //     let minWorldPosY: number = null;
        //     let maxWorldPosY: number = null;
        //     for (const pos of data.animTilePostions) {
        //         const temple = this._fogAnimShapView.node.getComponent(UITransform).convertToNodeSpaceAR(this._tiledhelper.getPosWorld(pos.x, pos.y));
        //         fogPositions.push(v2(temple.x, temple.y));

        //         minWorldPosX = minWorldPosX == null ? this._tiledhelper.getPosWorld(pos.x, pos.y).x : minWorldPosX;
        //         maxWorldPosX = maxWorldPosX == null ? this._tiledhelper.getPosWorld(pos.x, pos.y).x : maxWorldPosX;
        //         minWorldPosY = minWorldPosY == null ? this._tiledhelper.getPosWorld(pos.x, pos.y).y : minWorldPosY;
        //         maxWorldPosY = maxWorldPosY == null ? this._tiledhelper.getPosWorld(pos.x, pos.y).y : maxWorldPosY;

        //         minWorldPosX = Math.min(this._tiledhelper.getPosWorld(pos.x, pos.y).x, minWorldPosX);
        //         maxWorldPosX = Math.max(this._tiledhelper.getPosWorld(pos.x, pos.y).x, maxWorldPosX);
        //         minWorldPosY = Math.min(this._tiledhelper.getPosWorld(pos.x, pos.y).y, minWorldPosY);
        //         maxWorldPosY = Math.max(this._tiledhelper.getPosWorld(pos.x, pos.y).y, maxWorldPosY);
        //     }

        //     const tileMapScale = 0.5;
        //     const tileMapItemSize = size(this._tiledhelper.tilewidth * tileMapScale, this._tiledhelper.tileheight * tileMapScale);
        //     // draw shapView mask
        //     this._fogAnimShapView.draw(fogPositions, tileMapItemSize.width);

        //     if (minWorldPosX != null && maxWorldPosX != null &&
        //         minWorldPosY != null && maxWorldPosY != null) {
        //         // set fogAninView size and pos  
        //         this._fogAnimView.node.getComponent(UITransform).setContentSize(
        //             size(
        //                 (maxWorldPosX - minWorldPosX + tileMapItemSize.width) / tileMapScale,
        //                 (maxWorldPosY - minWorldPosY + tileMapItemSize.height) / tileMapScale
        //             )
        //         );
        //         this._fogAnimView.node.position = this.node.getComponent(UITransform).convertToNodeSpaceAR(
        //             v3(
        //                 minWorldPosX - tileMapItemSize.width / 2,
        //                 maxWorldPosY + tileMapItemSize.height / 2,
        //                 0
        //             )
        //         );
        //         let dissolveImage = null;
        //         if (data.direciton == TileHexDirection.Left) {
        //             dissolveImage = this.fogAnimDissolveImages[0];
        //         } else if (data.direciton == TileHexDirection.LeftBottom) {
        //             dissolveImage = this.fogAnimDissolveImages[1];
        //         } else if (data.direciton == TileHexDirection.LeftTop) {
        //             dissolveImage = this.fogAnimDissolveImages[2];
        //         } else if (data.direciton == TileHexDirection.Right) {
        //             dissolveImage = this.fogAnimDissolveImages[3];
        //         } else if (data.direciton == TileHexDirection.RightBottom) {
        //             dissolveImage = this.fogAnimDissolveImages[4];
        //         } else if (data.direciton == TileHexDirection.RightTop) {
        //             dissolveImage = this.fogAnimDissolveImages[5];
        //         }
        //         if (dissolveImage == null) {
        //             dissolveImage = this.fogAnimDissolveImages[0];
        //         }
        //         this._fogAnimView.node.getComponent(Sprite).spriteFrame = dissolveImage;
        //         // sharp pos
        //         const sub = this._fogAnimView.node.position.clone().subtract(this._fogAnimOriginalPos);
        //         this._fogAnimShapView.node.position = v3(-sub.x, -sub.y, 0);
        //         tween(this._fogAnimView)
        //             .set({ alphaThreshold: 0.01 })
        //             .to(0.4, { alphaThreshold: 1 })
        //             .call(() => {
        //                 this._fogAnimPlaying = false;
        //                 this._playFogAnim();
        //             })
        //             .start();
        //     }
        // } else {
        //     this._playFogAnim();
        // }
    }
}


