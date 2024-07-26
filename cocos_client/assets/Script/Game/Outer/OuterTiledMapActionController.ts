import {
    Animation,
    CCString,
    Color,
    EventMouse,
    Mask,
    Mat4,
    Node,
    Prefab,
    SpriteFrame,
    TiledLayer,
    TiledMap,
    UITransform,
    Vec2,
    Vec3,
    _decorator,
    instantiate,
    size,
    v2,
    v3,
    view
} from "cc";
import NotificationMgr from "../../Basic/NotificationMgr";
import ViewController from "../../BasicView/ViewController";
import Config from "../../Const/Config";
import {
    ECursorType,
    MapInteractType,
    MapMemberTargetType
} from "../../Const/ConstDefine";
import { NotificationName } from "../../Const/Notification";
import { DataMgr } from "../../Data/DataMgr";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import GameMainHelper from "../Helper/GameMainHelper";
import { TileHexDirection, TileMapHelper, TilePos } from "../TiledMap/TileTool";
import { OuterPioneerController } from "./OuterPioneerController";
import { OuterFogAnimShapMask } from "./View/OuterFogAnimShapMask";
import { OuterFogMask } from "./View/OuterFogMask";
import { OuterMapCursorView } from "./View/OuterMapCursorView";
import { ResOprView } from "./View/ResOprView";
import { Rect } from "cc";
import UIPanelManger, { UIPanelLayerType } from "../../Basic/UIPanelMgr";
import { MapBuildingType } from "../../Const/BuildingDefine";
import { UIName, HUDName } from "../../Const/ConstUIDefine";
import { MapBuildingWormholeObject } from "../../Const/MapBuilding";
import { MapPioneerActionType, MapPioneerObject, MapPioneerType } from "../../Const/PioneerDefine";
import { RookieStep } from "../../Const/RookieDefine";
import NetGlobalData from "../../Data/Save/Data/NetGlobalData";
import { share } from "../../Net/msg/WebsocketMsg";
import { NetworkMgr } from "../../Net/NetworkMgr";
import { MapActionConfrimTipUI } from "../../UI/MapActionConfrimTipUI";
import { UIHUDController } from "../../UI/UIHUDController";
import { AlterView } from "../../UI/View/AlterView";
import CLog from "../../Utils/CLog";
import { GameMgr, LanMgr, PioneerMgr } from "../../Utils/Global";
import { PioneersDataMgr } from "../../Data/Save/PioneersDataMgr";
import { OuterShadowController } from "./OuterShadowController";

const { ccclass, property } = _decorator;



@ccclass("OuterTiledMapActionController")
export class OuterTiledMapActionController extends ViewController {
    public mapBottomView(): Node {
        return this._mapBottomView;
    }
    public mapDecorationView(): Node {
        return this._decorationView;
    }
    public sortMapItemSiblingIndex() {
        let index = 1;
        var items: Node[] = [];
        for (const children of this._decorationView.children) {
            if (children.active) {
                items.push(children);
            }
        }
        items = items.sort((a, b) => {
            return b.position.y - a.position.y;
        });
        for (const item of items) {
            item.setSiblingIndex(index);
            index += 1;
        }
    }

    @property(Prefab)
    private tiledmap: Prefab;

    @property(Prefab)
    private trackingPrefab: Prefab;

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

    // private _localEraseShadowWorldPos: Vec2[] = [];
    // private _localEraseDataKey: string = "erase_shadow";

    // private _areaMap:Map<>

    private _fogAnimOriginalPos: Vec3 = null;

    private _fogAnimPlaying: boolean = false;
    private _fogAnimDatas: {
        allClearedTilePosions: { startPos: Vec2; endPos: Vec2 }[];
        animTilePostions: TilePos[];
        direciton: TileHexDirection;
    }[] = [];

    private _togetherBlockPositons: Vec2[][] = [];

    private _fogItem: Node = null;

    private _mapBottomView: Node = null;
    private _mapCursorView: OuterMapCursorView = null;
    private _mapActionCursorView: OuterMapCursorView = null;
    private _decorationView: Node = null;
    private _fogView: OuterFogMask = null;
    private _tilemap: TiledMap = null;
    private _tileLayers: TiledLayer[] = null;
    private _fogAnimView: Mask = null;
    private _fogAnimShapView: OuterFogAnimShapMask = null;
    private _boundContent: Node = null;
    private _boundItemMap: Map<string, Node> = new Map();
    private _boundPrefabItems: Node[] = [];
    private _actionView: ResOprView = null;

    private _hexViewRadius: number = 0;
    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._initTileMap();

        NotificationMgr.addListener(NotificationName.USERINFO_CITY_RADIAL_RANGE_CHANGE, this._onCityRadialRangeChange, this);
        NotificationMgr.addListener(NotificationName.GAME_OUTER_ACTION_ROLE_CHANGE, this._onHideActionView, this);
        NotificationMgr.addListener(NotificationName.GAME_INNER_AND_OUTER_CHANGED, this._onHideActionView, this);
    }
    protected viewDidStart(): void {
        super.viewDidStart();

        this._mouseDown = false;
        let downx = 0;
        let downy = 0;
        //make sure the map can be mouse.
        // unknow size,the screen update the the map size if biger.
        this.node._uiProps.uiTransformComp.setContentSize(size(3000000, 3000000));
        this.node.on(
            Node.EventType.MOUSE_DOWN,
            (event: EventMouse) => {
                this._mouseDown = true;
                downx = event.getLocation().x;
                downy = event.getLocation().y;
            },
            this
        );

        this.node.on(
            Node.EventType.MOUSE_UP,
            (event: EventMouse) => {
                this._mouseDown = false;
                var pos = event.getLocation();
                if (Math.abs(downx - pos.x) <= 3 && Math.abs(downy - pos.y) <= 3) {
                    //if pick a empty area.
                    //let pioneer move to
                    GameMusicPlayMgr.playTapButtonEffect();
                    const wpos = GameMainHelper.instance.getGameCameraScreenToWorld(v3(pos.x, pos.y, 0));
                    this._clickOnMap(wpos);
                }
            },
            this
        );

        this.node.on(
            Node.EventType.MOUSE_LEAVE,
            (event: EventMouse) => {
                this._mouseDown = false;
            },
            this
        );

        this.node.on(
            Node.EventType.MOUSE_WHEEL,
            (event: EventMouse) => {
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
            },
            this
        );

        this.node.on(
            Node.EventType.MOUSE_MOVE,
            (event: EventMouse) => {
                GameMainHelper.instance.changeCursor(ECursorType.Common);
                if (this._mouseDown) {
                    let pos = GameMainHelper.instance.gameCameraPosition.clone().add(new Vec3(-event.movementX, event.movementY, 0));
                    this._fixCameraPos(pos);
                } else {
                    if (GameMainHelper.instance.isTiledMapHelperInited) {
                        let pos = event.getLocation();
                        let wpos = GameMainHelper.instance.getGameCameraScreenToWorld(v3(pos.x, pos.y, 0));
                        var tp = GameMainHelper.instance.tiledMapGetTiledPosByWorldPos(wpos);

                        const shadowController = this.node.getComponent(OuterShadowController);
                        if (tp != null) {
                            if (!shadowController.tiledMapIsAllBlackShadow(tp.x, tp.y)) {
                                // check building first, because of building is block
                                const stayBuilding = DataMgr.s.mapBuilding.getShowBuildingByMapPos(v2(tp.x, tp.y));

                                if (stayBuilding != null && stayBuilding.show) {
                                    // if (stayBuilding.type == MapBuildingType.city && stayBuilding.faction != MapMemberFactionType.enemy) {
                                    //     const centerPos = stayBuilding.stayMapPositions[3];
                                    //     const visionPositions = [];
                                    //     let radialRange = DataMgr.s.userInfo.data.cityRadialRange;
                                    //     GameMgr.getAfterExtraEffectPropertyByBuilding(
                                    //         InnerBuildingType.MainCity,
                                    //         GameExtraEffectType.CITY_RADIAL_RANGE,
                                    //         radialRange
                                    //     );
                                    //     const extAround = GameMainHelper.instance.tiledMapGetExtAround(centerPos, radialRange - 1);
                                    //     for (const temple of extAround) {
                                    //         visionPositions.push(v2(temple.x, temple.y));
                                    //     }
                                    //     this._mapCursorView.show(stayBuilding.stayMapPositions, Color.WHITE, visionPositions, Color.BLUE);
                                    // } else {
                                    this._mapCursorView.show(stayBuilding.stayMapPositions, Color.WHITE);
                                    // }
                                    GameMainHelper.instance.changeCursor(ECursorType.Action);
                                } else {
                                    const isBlock = GameMainHelper.instance.tiledMapIsBlock(v2(tp.x, tp.y));
                                    if (isBlock) {
                                        let cursorShowTilePositions: Vec2[] = null;
                                        for (const positions of this._togetherBlockPositons) {
                                            if (positions.some((temple) => temple.x === tp.x && temple.y === tp.y)) {
                                                cursorShowTilePositions = positions;
                                                break;
                                            }
                                        }
                                        if (cursorShowTilePositions == null) {
                                            // if (decorate != null) {
                                            //     cursorShowTilePositions = decorate.stayMapPositions;
                                            // } else {
                                            cursorShowTilePositions = [v2(tp.x, tp.y)];
                                            // }
                                        }
                                        this._mapCursorView.show(cursorShowTilePositions, Color.RED);
                                        GameMainHelper.instance.changeCursor(ECursorType.Error);
                                    } else {
                                        const stayPioneers = DataMgr.s.pioneer.getByStayPos(v2(tp.x, tp.y), true);
                                        let existOtherPioneer: MapPioneerObject = null;
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
            },
            this
        );
        // local fog
        // this._refreshFog(GameMainHelper.instance.tiledMapGetShadowClearedTiledPositions());

        // const allShadows = DataMgr.s.eraseShadow.getObj();
        // for (const shadow of allShadows) {
        //     GameMainHelper.instance.tiledMapShadowErase(shadow);
        // }

        // this._eraseMainCityShadow();
    }

    protected viewDidAppear(): void {
        super.viewDidAppear();

        GameMainHelper.instance.changeGameCameraPosition(this._showOuterCameraPosition.clone());
        GameMainHelper.instance.changeGameCameraZoom(this._showOuterCameraZoom);
        this.scheduleOnce(() => {
            GameMainHelper.instance.updateGameViewport();
        }, 0.1);
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

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.USERINFO_CITY_RADIAL_RANGE_CHANGE, this._onCityRadialRangeChange, this);
        NotificationMgr.removeListener(NotificationName.GAME_OUTER_ACTION_ROLE_CHANGE, this._onHideActionView, this);
        NotificationMgr.removeListener(NotificationName.GAME_INNER_AND_OUTER_CHANGED, this._onHideActionView, this);
    }
    //------------------------------------
    private _initTileMap(): void {
        if (this.tiledmap == null) return;
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

        let nodes = [];
        for (let i = 0; i < 10; i++) {
            const shadowView = new Node("shadow_layer");
            shadowView.addComponent(UITransform);
            shadowView.layer = this.node.layer;
            mapView.addChild(shadowView);
            nodes.push(shadowView);
        }
        const shadowController = this.node.getComponent(OuterShadowController);
        shadowController.Shadow_Init(nodes);

        this._mapCursorView = this.node.getChildByPath("Floor/PointerCursor").getComponent(OuterMapCursorView);
        this._mapCursorView.node.removeFromParent();
        this._mapBottomView.addChild(this._mapCursorView.node);

        this._mapActionCursorView = this.node.getChildByPath("Floor/ActionCursor").getComponent(OuterMapCursorView);
        this._mapActionCursorView.node.removeFromParent();
        this._mapBottomView.addChild(this._mapActionCursorView.node);

        // force change shadow siblingIndex
        // mapView.getChildByPath("shadow").setSiblingIndex(99);

        var _tilemap = mapView.getComponent(TiledMap);
        this._tilemap = _tilemap;
        _tilemap.enableCulling = false;

        //init tiledmap by a helper class
        const trackingView = instantiate(this.trackingPrefab);
        trackingView.active = false;
        trackingView.setParent(mapView);
        GameMainHelper.instance.initTiledMapHelper(_tilemap, trackingView);


        // this._fogItem = instantiate(this.gridFogPrefab);
        // this._fogItem.layer = this.node.layer;
        // // this._fogItem.scale = v3(1.8, 1.8, 1);
        // this._fogItem.active = false;

        // this._fogView = this.node.getChildByPath("Floor/Fog").getComponent(OuterFogMask);
        // this._fogView.node.setSiblingIndex(99);

        // this._fogAnimView = this.node.getChildByPath("Floor/FogAnim").getComponent(Mask);
        // this._fogAnimView.node.active = false;
        // this._fogAnimView.node.setSiblingIndex(100);
        // this._fogAnimOriginalPos = this._fogAnimView.node.position.clone();

        // this._fogAnimShapView = this._fogAnimView.node.getChildByPath("SharpMask").getComponent(OuterFogAnimShapMask);
        // this._boundContent = this.node.getChildByPath("Floor/BoundContent");
        // this._boundContent.setSiblingIndex(101);

        this._actionView = instantiate(this.resOprPrefab).getComponent(ResOprView);
        this._actionView.node.setScale(v3(2, 2, 2));
        this._actionView.node.setParent(this.node);
        this._actionView.hide();

        this._hexViewRadius = (GameMainHelper.instance.tiledMapTilewidth * this.node.scale.x) / 2;

        this._mapCursorView.initData(this._hexViewRadius, this.node.scale.x);
        this._mapActionCursorView.initData(this._hexViewRadius, this.node.scale.x);

        // mapView.getChildByPath("BorderMask").setSiblingIndex(999);

        let mapInfo = _tilemap._mapInfo;
        let layerInfos = mapInfo.getLayers();
        let tilesets = _tilemap._tilesets;
        let textures = _tilemap._textures;
        let texGrids = _tilemap._texGrids;
        this._tileLayers = [];
        let contentSize = mapView.getComponent(UITransform).contentSize;
        for (let i = 1; i <= 12; i++) {
            let nodeName = 'layer' + i;
            let layer: TiledLayer;
            let child: Node = mapView.getChildByName('layer' + i);
            if (!child) {
                child = (new Node()) as unknown as any;
                child.name = nodeName;
                child.layer = mapView.layer;
                let uitransform = child.getComponent(UITransform);
                if (!uitransform) {
                    uitransform = child.addComponent(UITransform);
                }
                uitransform.setContentSize(contentSize);
                mapView.addChild(child);
                child.setSiblingIndex(0);
                let tempinfo = {} as any;
                let layerInfo = layerInfos[i % layerInfos.length];
                for (let key in layerInfo) {
                    tempinfo[key] = layerInfo[key];
                }
                tempinfo['name'] = nodeName;
                let px = (TileMapHelper.INS.pixelwidth - this._tilemap._tileSize.width / 2) * (i - 1)
                child.setPosition(v3(px, 0, 0));
                layer = child.getComponent(TiledLayer);
                if (!layer) {
                    layer = child.addComponent(TiledLayer);
                }
                layer.init(tempinfo, mapInfo, tilesets, textures, texGrids);
                layer.enableCulling = false;
                _tilemap._layers.push(layer);
            } else {
                layer = child.getComponent(TiledLayer);
            }
            this._tileLayers.push(layer);
        }
    }

    private _eraseMainCityShadow() {
        const mainCity = DataMgr.s.mapBuilding.getBuildingById("building_1");
        if (mainCity == null || mainCity.stayMapPositions.length != 7) {
            return;
        }
        GameMainHelper.instance.tiledMapMainCityShadowErase(v2(mainCity.stayMapPositions[3].x, mainCity.stayMapPositions[3].y));
    }

    private _lastPioneerStayPos: Map<string, Vec2> = new Map();
    private async _updateTiledmap(delta: number) {
        if (!GameMainHelper.instance.isTiledMapHelperInited) {
            return;
        }
        // GameMainHelper.instance.tiledMapShadowUpdate(delta);
        //clean pioneer view
        const selfPioneers = await DataMgr.s.pioneer.getAllPlayers(true);
        let eraseShadowWorldPos = DataMgr.s.eraseShadow.getObj();
        for (const pioneer of selfPioneers) {
            let isExsit: boolean = false;
            for (const localErase of eraseShadowWorldPos) {
                if (pioneer.stayPos.x === localErase.x && pioneer.stayPos.y === localErase.y) {
                    isExsit = true;
                    break;
                }
            }
            const newCleardPositons = GameMainHelper.instance.tiledMapShadowErase(pioneer.stayPos, pioneer.id);
            this._eraseMainCityShadow();
            if (!isExsit) {
                // this._localEraseShadowWorldPos.push(pioneer.stayPos);
                // if (Config.canSaveLocalData) {
                //     localStorage.setItem(this._localEraseDataKey, JSON.stringify(this._localEraseShadowWorldPos));
                // }
                DataMgr.s.eraseShadow.addObj(v2(pioneer.stayPos.x, pioneer.stayPos.y));
            }
            // has new, deal with fog
            if (!this._lastPioneerStayPos.has(pioneer.id)) {
                this._lastPioneerStayPos.set(pioneer.id, pioneer.stayPos);
            }
            const lastStayPos = this._lastPioneerStayPos.get(pioneer.id);
            if (lastStayPos.x != pioneer.stayPos.x || lastStayPos.y != pioneer.stayPos.y) {
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
                // this._refreshFog(GameMainHelper.instance.tiledMapGetShadowClearedTiledPositions(), newCleardPositons, pioneer.stayPos);
            }
        }
    }

    public async _clickOnMap(worldpos: Vec3) {
        if (DataMgr.s.userInfo.data.rookieStep != RookieStep.FINISH) {
            this["_actionViewActioned"] = false;
        }
        const currentActionPioneer = DataMgr.s.pioneer.getCurrentPlayer();
        if (currentActionPioneer == null) {
            return;
        }
        const outPioneerController = this.node.getComponent(OuterPioneerController);
        if (this["_actionViewActioned"] == true) {
            this["_actionViewActioned"] = false;
            return;
        }
        if (this._actionView.isShow) {
            this._actionView.hide();
            this._mapActionCursorView.hide();
            outPioneerController.hideMovingPioneerAction();
            outPioneerController.clearPioneerFootStep(currentActionPioneer.id);
            return;
        }
        if (GameMainHelper.instance.isTapEventWaited) {
            GameMainHelper.instance.isTapEventWaited = false;
            return;
        }
        const shadowController = this.node.getComponent(OuterShadowController);
        const tiledPos = GameMainHelper.instance.tiledMapGetTiledPosByWorldPos(worldpos);
        if (shadowController.tiledMapIsAllBlackShadow(tiledPos.x, tiledPos.y)) {
            return;
        }
        // check is dead
        if (currentActionPioneer.actionType == MapPioneerActionType.dead) {
            // useLanMgr
            UIHUDController.showCenterTip(LanMgr.getLanById("203003"));
            // UIHUDController.showCenterTip("pioneer is dead");
            return;
        }
        // check is busy
        if (DataMgr.s.pioneer.getCurrentActionIsBusy()) {
            // UIHUDController.showCenterTip(LanMgr.getLanById("203002"));
            return;
        }

        let stayPositons: Vec2[] = [v2(tiledPos.x, tiledPos.y)];
        // check is building first
        const stayBuilding = DataMgr.s.mapBuilding.getShowBuildingByMapPos(v2(tiledPos.x, tiledPos.y));
        let isBlock = false;
        let stayPioneer = null;
        if (stayBuilding != null) {
            if (stayBuilding.type == MapBuildingType.city) {
                GameMainHelper.instance.changeInnerAndOuterShow();
                return;
            }

            if (stayBuilding.type == MapBuildingType.wormhole) {
                // if (DataMgr.s.userInfo.data.rookieStep == RookieStep.FINISH) {
                //     UIHUDController.showCenterTip("Wormhole is updating, close temporarily");
                // UIHUDController.showCenterTip(LanMgr.getLanById("203005"));
                // return;
                // }
                const tempWormhole = stayBuilding as MapBuildingWormholeObject;
                if (tempWormhole.wormholdCountdownTime > new Date().getTime()) {
                    UIHUDController.showCenterTip("Wormhole is Busy");
                    // UIHUDController.showCenterTip(LanMgr.getLanById("203005"));
                    return;
                }
            } else if (stayBuilding.type == MapBuildingType.event) {
                if (
                    currentActionPioneer.actionBuildingId != null &&
                    currentActionPioneer.actionBuildingId != "") {
                    return;
                }
            } else {
                if (currentActionPioneer.actionType == MapPioneerActionType.wormhole || currentActionPioneer.actionType == MapPioneerActionType.eventing) {
                    return;
                }
            }
            stayPositons = stayBuilding.stayMapPositions;
        } else {
            if (currentActionPioneer.actionType == MapPioneerActionType.wormhole || currentActionPioneer.actionType == MapPioneerActionType.eventing) {
                return;
            }
            isBlock = GameMainHelper.instance.tiledMapIsBlock(v2(tiledPos.x, tiledPos.y));
            if (isBlock) {
                UIHUDController.showCenterTip(LanMgr.getLanById("203001"));
                return;
            }
            const pioneers = DataMgr.s.pioneer.getByStayPos(v2(tiledPos.x, tiledPos.y), true);
            for (const tempPioneer of pioneers) {
                if (tempPioneer.id != currentActionPioneer.id) {
                    stayPioneer = tempPioneer;
                    break;
                }
            }
            if (stayPioneer != null) {
                stayPositons = [stayPioneer.stayPos];
            }
        }

        this._mapActionCursorView.show(stayPositons, Color.WHITE);
        // view show worldPos
        let targetWorldPos = null;
        if (stayPositons.length == 1) {
            targetWorldPos = GameMainHelper.instance.tiledMapGetPosWorld(stayPositons[0].x, stayPositons[0].y);
        } else if (stayPositons.length == 3) {
            const beginWorldPos = GameMainHelper.instance.tiledMapGetPosWorld(stayPositons[0].x, stayPositons[0].y);
            const endWorldPos = GameMainHelper.instance.tiledMapGetPosWorld(stayPositons[1].x, stayPositons[1].y);
            targetWorldPos = v3(beginWorldPos.x, endWorldPos.y + (beginWorldPos.y - endWorldPos.y) / 2, 0);
        } else if (stayPositons.length == 7) {
            targetWorldPos = GameMainHelper.instance.tiledMapGetPosWorld(stayPositons[3].x, stayPositons[3].y);
        }
        if (targetWorldPos == null) {
            CLog.error("action cann't show");
            return;
        }

        // move targetPos
        let taregtPos: Vec2 = v2(tiledPos.x, tiledPos.y);
        let sparePositions: Vec2[] = [];
        let targetStayPositions: Vec2[] = [];
        if (stayBuilding != null) {
            sparePositions = stayBuilding.stayMapPositions;
            targetStayPositions = stayBuilding.stayMapPositions;
        } else if (stayPioneer != null) {
            if (stayPioneer.type == MapPioneerType.player || stayPioneer.type == MapPioneerType.npc) {
                targetStayPositions = [stayPioneer.stayPos];
            }
        }

        const rookieStep: RookieStep = DataMgr.s.userInfo.data.rookieStep;
        let movePaths: TilePos[] = [];
        if (rookieStep == RookieStep.WORMHOLE_ATTACK) {
            movePaths = GameMainHelper.instance.tiledMapGetTiledMovePathByTiledPos(
                currentActionPioneer.stayPos,
                v2(stayBuilding.stayMapPositions[0].x, stayBuilding.stayMapPositions[0].y + 2),
                targetStayPositions
            ).path;
        } else {
            if (sparePositions.length > 0) {
                // building: find least move path
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
            } else {
                // pioneer or land
                const toPosMoveData = GameMainHelper.instance.tiledMapGetTiledMovePathByTiledPos(currentActionPioneer.stayPos, taregtPos, targetStayPositions);
                if (toPosMoveData.canMove) {
                    movePaths = toPosMoveData.path;
                }
            }
        }
        // show move path
        outPioneerController.showPioneerFootStep(currentActionPioneer.id, movePaths);

        this["_actionViewFootStepPioneerId"] = currentActionPioneer.id;
        // show action panel
        await this._actionView.show(
            currentActionPioneer.id,
            stayBuilding,
            stayPioneer,
            taregtPos,
            targetWorldPos,
            movePaths.length,
            async (actionType: MapInteractType, targetName: string, costEnergy: number) => {
                this["_actionViewActioned"] = true;
                this._mouseDown = false;
                if (actionType == null && targetName == null && costEnergy == null) {
                    outPioneerController.clearPioneerFootStep(currentActionPioneer.id);
                    return;
                }
                if (costEnergy > 0) {
                    let ownEnergy: number = currentActionPioneer.energy;
                    if (ownEnergy < costEnergy) {
                        outPioneerController.clearPioneerFootStep(currentActionPioneer.id);
                        GameMgr.showBuyEnergyTip(currentActionPioneer.id);
                        return;
                    }
                }
                const result = await UIPanelManger.inst.pushPanel(UIName.MapActionConfrimTipUI);
                if (result.success) {
                    result.node
                        .getComponent(MapActionConfrimTipUI)
                        .configuration(taregtPos, targetName, movePaths.length, costEnergy, currentActionPioneer.speed, async (confirmed: boolean) => {
                            if (confirmed) {
                                if (actionType == MapInteractType.Wormhole) {
                                    if (stayBuilding == null) {
                                        return;
                                    }
                                    const result = await UIPanelManger.inst.pushPanel(HUDName.Alter, UIPanelLayerType.HUD);
                                    if (!result.success) {
                                        return;
                                    }
                                    // useLanMgr
                                    // const alterString: string = LanMgr.getLanById("106006");
                                    const alterString: string = "Use Current Pioneers To Attack Wormhole?";
                                    result.node.getComponent(AlterView).showTip(
                                        alterString,
                                        () => {
                                            if (currentActionPioneer.actionType != MapPioneerActionType.wormhole) {
                                                PioneerMgr.setMovingTarget(currentActionPioneer.id, MapMemberTargetType.building, stayBuilding.id);
                                                if (movePaths.length <= 0) {
                                                    DataMgr.s.pioneer.beginMove(currentActionPioneer.id, []);
                                                } else {
                                                    const uploadPath: share.pos2d[] = [];
                                                    for (const path of movePaths) {
                                                        uploadPath.push({ x: path.x, y: path.y });
                                                    }
                                                    NetworkMgr.websocketMsg.player_move({
                                                        pioneerId: currentActionPioneer.id,
                                                        movePath: uploadPath,
                                                        feeTxhash: "",
                                                    });
                                                }
                                                NetGlobalData.wormholeAttackBuildingId = stayBuilding.id;
                                            } else {
                                                // attack wormhole countdonw
                                                NetworkMgr.websocketMsg.player_wormhole_fight_start({
                                                    buildingId: stayBuilding.id,
                                                });
                                            }
                                        },
                                        () => {
                                            outPioneerController.clearPioneerFootStep(currentActionPioneer.id);
                                        }
                                    );
                                    return;
                                }

                                if (actionType == MapInteractType.CampOut) {
                                    for (const temple of DataMgr.s.mapBuilding.getWormholeBuildings()) {
                                        const wormObj = temple as MapBuildingWormholeObject;
                                        wormObj.attacker.forEach((value: string, key: number) => {
                                            if (value == currentActionPioneer.id) {
                                                NetworkMgr.websocketMsg.player_wormhole_set_attacker({
                                                    pioneerId: "",
                                                    buildingId: wormObj.id,
                                                    index: key,
                                                });
                                            }
                                        });
                                    }
                                    return;
                                }

                                if (actionType != MapInteractType.Move) {
                                    // move can't trigger interact
                                    if (stayBuilding != null) {
                                        PioneerMgr.setMovingTarget(currentActionPioneer.id, MapMemberTargetType.building, stayBuilding.id);
                                    }
                                    if (stayPioneer != null) {
                                        PioneerMgr.setMovingTarget(currentActionPioneer.id, MapMemberTargetType.pioneer, stayPioneer.id);
                                    }
                                }
                                if (movePaths.length <= 0) {
                                    DataMgr.s.pioneer.beginMove(currentActionPioneer.id, []);
                                } else {
                                    const uploadPath: share.pos2d[] = [];
                                    for (const path of movePaths) {
                                        uploadPath.push({ x: path.x, y: path.y });
                                    }
                                    NetworkMgr.websocketMsg.player_move({
                                        pioneerId: currentActionPioneer.id,
                                        movePath: uploadPath,
                                        feeTxhash: "",
                                    });
                                }
                            } else {
                                outPioneerController.clearPioneerFootStep(currentActionPioneer.id);
                            }
                            this._mapActionCursorView.hide();
                            outPioneerController.hideMovingPioneerAction();
                        });
                }
            }
        );
    }

    refreshUI(rect: Rect, rect2: Rect) {
        let layers = this._tileLayers;
        let areaWidth = TileMapHelper.INS.pixelwidth - TileMapHelper.INS.tilewidth / 2;
        let areaHeight = TileMapHelper.INS.pixelheight - TileMapHelper.INS.tileheight / 4;
        let stx = rect2.xMin;
        let sty = rect2.yMin;
        let endx = rect2.xMax;
        let endy = rect2.yMax;
        let containerBox = this.node._uiProps.uiTransformComp.getBoundingBox();
        let hasSets = [];
        let unBindPosArr = [];
        let lastIndex = 0;
        for (let i = stx; i <= endx; i++) {
            for (let j = sty; j <= endy; j++) {
                let pos = v3(i * areaWidth + TileMapHelper.INS.pixelwidth / 2, j * areaHeight - TileMapHelper.INS.pixelheight / 2, 0);
                //make content big
                if (!containerBox.contains(v2(pos.x + TileMapHelper.INS.pixelwidth / 2, pos.y + TileMapHelper.INS.pixelheight / 2))
                    || !containerBox.contains(v2(pos.x - TileMapHelper.INS.pixelwidth / 2, pos.y - TileMapHelper.INS.pixelheight / 2))) {
                    this.node._uiProps.uiTransformComp.setContentSize(size((Math.abs(i) + 1) * areaWidth * 2, (Math.abs(j) + 1) * areaHeight * 2));
                }
                let layerSetIndex = layers.findIndex((layer) => {
                    let node = layer.node;
                    return node.active && node.position.x == pos.x && node.position.y == pos.y;
                });
                if (layerSetIndex != -1) {
                    hasSets.push(layerSetIndex);
                    lastIndex = layerSetIndex;
                } else {
                    unBindPosArr.push(pos);
                }
            }
        }
        //binding layer
        let len = layers.length;
        for (let i = 0; i < len; i++) {
            let layIndex = lastIndex + i + 1;
            if (layIndex >= len) {
                layIndex = layIndex - len;
            }
            let layer = layers[layIndex];
            if (hasSets.indexOf(layIndex) != -1) {
                continue;
            }
            if (unBindPosArr.length > 0) {
                layer.node.active = true;
                layer.node.setPosition(unBindPosArr.pop());
            } else {
                layer.node.active = false;
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
        // const minx = ((-contentSize.width * scale.x) / 2 - contentSize.width * scale.x * range) * sc + (cameraSize.width / 2) * cameraViewRate;
        // const maxx = ((contentSize.width * scale.x) / 2 + contentSize.width * scale.x * range) * sc - (cameraSize.width / 2) * cameraViewRate;
        // const miny = ((-contentSize.height * scale.y) / 2 - contentSize.height * scale.y * range) * sc + (cameraSize.height / 2) * cameraViewRate;
        // const maxy = ((contentSize.height * scale.y) / 2 + contentSize.height * scale.y * range) * sc - (cameraSize.height / 2) * cameraViewRate;

        // pos.x = Math.min(Math.max(minx, pos.x), maxx);
        // pos.y = Math.min(Math.max(miny, pos.y), maxy);
        GameMainHelper.instance.changeGameCameraPosition(pos);
    }

    private _refreshFog(allClearedShadowPositions: TilePos[], newCleardPositons: TilePos[] = null, stayPos: Vec2 = null) {
        const getAllBoundLines: { startPos: Vec2; endPos: Vec2 }[] = [];
        const getAllBoundPos: Vec3[] = [];

        const hexViewRadius = (GameMainHelper.instance.tiledMapTilewidth * this.node.scale.x) / 2;
        const sinValue = Math.sin((30 * Math.PI) / 180);
        for (const pos of allClearedShadowPositions) {
            let isBound: boolean = false;
            const centerPos = GameMainHelper.instance.tiledMapGetPosWorld(pos.x, pos.y);
            // direction around no hex or hex is shadow, direction is bound.

            const leftTop = GameMainHelper.instance.tiledMapGetAroundByDirection(v2(pos.x, pos.y), TileHexDirection.LeftTop);
            const shadowController = this.node.getComponent(OuterShadowController);
            if (leftTop == null || shadowController.tiledMapIsAllBlackShadow(leftTop.x, leftTop.y)) {
                getAllBoundLines.push({
                    startPos: v2(centerPos.x, hexViewRadius + centerPos.y),
                    endPos: v2(-hexViewRadius + centerPos.x, sinValue * hexViewRadius + centerPos.y),
                });
                isBound = true;
            }

            const left = GameMainHelper.instance.tiledMapGetAroundByDirection(v2(pos.x, pos.y), TileHexDirection.Left);
            if (left == null || shadowController.tiledMapIsAllBlackShadow(left.x, left.y)) {
                getAllBoundLines.push({
                    startPos: v2(-hexViewRadius + centerPos.x, sinValue * hexViewRadius + centerPos.y),
                    endPos: v2(-hexViewRadius + centerPos.x, -sinValue * hexViewRadius + centerPos.y),
                });
                isBound = true;
            }

            const leftBottom = GameMainHelper.instance.tiledMapGetAroundByDirection(v2(pos.x, pos.y), TileHexDirection.LeftBottom);
            if (leftBottom == null || shadowController.tiledMapIsAllBlackShadow(leftBottom.x, leftBottom.y)) {
                getAllBoundLines.push({
                    startPos: v2(-hexViewRadius + centerPos.x, -sinValue * hexViewRadius + centerPos.y),
                    endPos: v2(centerPos.x, -hexViewRadius + centerPos.y),
                });
                isBound = true;
            }

            const rightbottom = GameMainHelper.instance.tiledMapGetAroundByDirection(v2(pos.x, pos.y), TileHexDirection.RightBottom);
            if (rightbottom == null || shadowController.tiledMapIsAllBlackShadow(rightbottom.x, rightbottom.y)) {
                getAllBoundLines.push({
                    startPos: v2(centerPos.x, -hexViewRadius + centerPos.y),
                    endPos: v2(hexViewRadius + centerPos.x, -sinValue * hexViewRadius + centerPos.y),
                });
                isBound = true;
            }

            const right = GameMainHelper.instance.tiledMapGetAroundByDirection(v2(pos.x, pos.y), TileHexDirection.Right);
            if (right == null || shadowController.tiledMapIsAllBlackShadow(right.x, right.y)) {
                getAllBoundLines.push({
                    startPos: v2(hexViewRadius + centerPos.x, -sinValue * hexViewRadius + centerPos.y),
                    endPos: v2(hexViewRadius + centerPos.x, sinValue * hexViewRadius + centerPos.y),
                });
                isBound = true;
            }

            const rightTop = GameMainHelper.instance.tiledMapGetAroundByDirection(v2(pos.x, pos.y), TileHexDirection.RightTop);
            if (rightTop == null || shadowController.tiledMapIsAllBlackShadow(rightTop.x, rightTop.y)) {
                getAllBoundLines.push({
                    startPos: v2(hexViewRadius + centerPos.x, sinValue * hexViewRadius + centerPos.y),
                    endPos: v2(centerPos.x, hexViewRadius + centerPos.y),
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

        if (this._fogAnimDatas.length <= 0 && !this._fogAnimPlaying && newCleardPositons == null) {
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
                if (key == tempPos.x + "|" + tempPos.y) {
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

    private _playFogAnim(allClearedTilePosions: { startPos: Vec2; endPos: Vec2 }[], animTilePostions: TilePos[], pioneerStayPos: Vec2) {
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

    //----------------------- notification
    private _onCityRadialRangeChange() {
        this._eraseMainCityShadow();
    }
    private _onHideActionView() {
        if (this["_actionViewFootStepPioneerId"] == null) {
            return;
        }
        if (this["_actionViewActioned"] == true) {
            this["_actionViewActioned"] = false;
            return;
        }
        if (this._actionView.isShow) {
            this._actionView.hide();
            this._mapActionCursorView.hide();
            const outPioneerController = this.node.getComponent(OuterPioneerController);
            outPioneerController.hideMovingPioneerAction();
            outPioneerController.clearPioneerFootStep(this["_actionViewFootStepPioneerId"]);
            this["_actionViewFootStepPioneerId"] = null;
        }
    }
}
