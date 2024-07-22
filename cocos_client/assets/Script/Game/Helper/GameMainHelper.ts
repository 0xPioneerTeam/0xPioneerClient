import { Camera, Mat4, Node, Prefab, Rect, Size, TiledMap, Vec2, Vec3, find, size, tween, v2 } from "cc";
import ConfigConfig from "../../Config/ConfigConfig";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import { ECursorType, GameExtraEffectType } from "../../Const/ConstDefine";
import { TileHexDirection, TileMapHelper, TilePos } from "../TiledMap/TileTool";
import { GameMgr } from "../../Utils/Global";
import { ConfigType, MapScaleParam } from "../../Const/Config";
import { DataMgr } from "../../Data/DataMgr";
import { RookieStep } from "../../Const/RookieDefine";
import { OuterTiledMapActionController } from "../Outer/OuterTiledMapActionController";
import { OuterDecorateController } from "../Outer/OuterDecorateController";

export default class GameMainHelper {
    public static get instance() {
        if (this._instance == null) {
            this._instance = new GameMainHelper();
        }
        return this._instance;
    }
    //------------------------------------------ camera
    public setGameCamera(camera: Camera) {
        this._gameCamera = camera;
        this._gameCameraOriginalOrthoHeight = this._gameCamera.orthoHeight;
        this._gameCameraZoom = 1;
    }
    public changeGameCameraZoom(zoom: number, animation: boolean = false) {
        const zoomConfig = ConfigConfig.getConfig(ConfigType.MapScaleMaxAndMin) as MapScaleParam;
        this._gameCameraZoom = Math.max(zoomConfig.scaleMin, Math.min(zoom, zoomConfig.scaleMax));
        if (!this._isGameShowOuter) {
            // new inner max zoom limit 1
            this._gameCameraZoom = Math.min(1, this._gameCameraZoom);
        }
        if (animation) {
            tween()
                .target(this._gameCamera)
                .to(0.5, { orthoHeight: this._gameCameraOriginalOrthoHeight * this._gameCameraZoom })
                .call(() => {
                    NotificationMgr.triggerEvent(NotificationName.GAME_CAMERA_ZOOM_CHANGED, this._gameCameraZoom);
                })
                .start();
        } else {
            this._gameCamera.orthoHeight = this._gameCameraOriginalOrthoHeight * this._gameCameraZoom;
            NotificationMgr.triggerEvent(NotificationName.GAME_CAMERA_ZOOM_CHANGED, this._gameCameraZoom);
        }
    }
    public changeGameCameraWorldPosition(position: Vec3, animation: boolean = false, triggerTask: boolean = false) {
        if (animation) {
            const distance = Vec3.distance(this._gameCamera.node.worldPosition.clone(), position.clone());
            tween()
                .target(this._gameCamera.node)
                .to(Math.min(0.8, distance / 1800), { worldPosition: position })
                .call(() => {
                    NotificationMgr.triggerEvent(NotificationName.GAME_CAMERA_POSITION_CHANGED, { triggerTask: triggerTask });
                })
                .start();
        } else {
            this._gameCamera.node.setWorldPosition(position);
            NotificationMgr.triggerEvent(NotificationName.GAME_CAMERA_POSITION_CHANGED, { triggerTask: triggerTask });
        }
    }
    public changeGameCameraPosition(position: Vec3, animation: boolean = false, triggerTask: boolean = false) {
        if (animation) {
            const distance = Vec3.distance(this._gameCamera.node.position.clone(), position.clone());
            tween()
                .target(this._gameCamera.node)
                .to(Math.min(0.8, distance / 1800), { position: position })
                .call(() => {
                    NotificationMgr.triggerEvent(NotificationName.GAME_CAMERA_POSITION_CHANGED, { triggerTask: triggerTask });
                })
                .start();
        } else {
            this._gameCamera.node.setPosition(position);
            NotificationMgr.triggerEvent(NotificationName.GAME_CAMERA_POSITION_CHANGED, { triggerTask: triggerTask });
        }
    }
    public getGameCameraScreenToWorld(postion: Vec3) {
        return this._gameCamera.screenToWorld(postion);
    }
    public getGameCameraWposToUI(wpos: Vec3, node: Node) {
        return this._gameCamera.convertToUINode(wpos, node);
    }
    public get gameCameraSize(): Size {
        return size(this._gameCamera.camera.width, this._gameCamera.camera.height);
    }
    public get gameCameraOrthoHeight(): number {
        return this._gameCamera.orthoHeight;
    }
    public get gameCameraWorldPosition(): Vec3 {
        return this._gameCamera.node.worldPosition;
    }
    public get gameCameraPosition(): Vec3 {
        return this._gameCamera.node.position;
    }
    public get gameCameraZoom(): number {
        return this._gameCameraZoom;
    }

    public get gameCamera(): Camera {
        return this._gameCamera;
    }

    //------------------------------------------ inner outer
    public changeInnerAndOuterShow() {
        this._isGameShowOuter = !this._isGameShowOuter;
        NotificationMgr.triggerEvent(NotificationName.GAME_INNER_AND_OUTER_CHANGED);
    }
    public get isGameShowOuter(): boolean {
        return this._isGameShowOuter;
    }
    //------------------------------------------ tiled map
    public initTiledMapHelper(map: TiledMap, tracking: Node) {
        //init tiledmap by a helper class
        this._tiledMapHelper = new TileMapHelper(map);
        this._mapNode = map.node;
        this._tiledMapHelper.Shadow_Init(0, 75);
        this._tiledMapHelper._shadowhalftag = 73;
        this._tiledMapHelper._shadowhalf2tag = 74;
        //set a callback here. 35 is block
        this._tiledMapHelper.Path_InitBlock(35);
        this._trackingView = tracking;
    }

    public get isTiledMapHelperInited(): boolean {
        return this._tiledMapHelper != null;
    }
    public get tiledMapTilewidth(): number {
        if (!this.isTiledMapHelperInited) {
            return 0;
        }
        return this._tiledMapHelper.tilewidth;
    }
    public tiledMapAddDynamicBlock(mapPos: Vec2, canMoveTo: boolean = false): void {
        if (!this.isTiledMapHelperInited) {
            return;
        }
        this._tiledMapHelper.Path_AddDynamicBlock({
            TileX: mapPos.x,
            TileY: mapPos.y,
            canMoveTo: canMoveTo,
        });
    }
    public tiledMapRemoveDynamicBlock(mapPos: Vec2): void {
        if (!this.isTiledMapHelperInited) {
            return;
        }
        this._tiledMapHelper.Path_RemoveDynamicBlock({
            TileX: mapPos.x,
            TileY: mapPos.y,
            canMoveTo: false,
        });
    }
    public tiledMapGetAround(mapPos: Vec2): TilePos[] {
        if (!this.isTiledMapHelperInited) {
            return [];
        }
        mapPos = v2(Math.min(this._tiledMapHelper.width - 1, mapPos.x), Math.min(this._tiledMapHelper.height - 1, mapPos.y));
        return this._tiledMapHelper.Path_GetAround(this._tiledMapHelper.getPos(mapPos.x, mapPos.y));
    }
    public tiledMapGetAroundByDirection(mapPos: Vec2, direction: TileHexDirection): TilePos {
        if (!this.isTiledMapHelperInited) {
            return null;
        }
        mapPos = v2(Math.min(this._tiledMapHelper.width - 1, mapPos.x), Math.min(this._tiledMapHelper.height - 1, mapPos.y));
        return this._tiledMapHelper.Path_GetAroundByDirection(this._tiledMapHelper.getPos(mapPos.x, mapPos.y), direction);
    }
    public tiledMapGetExtAround(mapPos: Vec2, range: number): TilePos[] {
        if (!this.isTiledMapHelperInited) {
            return [];
        }
        return this._tiledMapHelper.getExtAround(this._tiledMapHelper.getPos(mapPos.x, mapPos.y), range - 1);
    }
    public tiledMapGetPosWorld(x: number, y: number): Vec3 {
        if (!this.isTiledMapHelperInited) {
            return null;
        }
        return this._tiledMapHelper.getPosWorld(x, y);
    }
    public tiledMapGetTiledPosByWorldPos(worldPos: Vec3): TilePos {
        if (!this.isTiledMapHelperInited) {
            return null;
        }
        return this._tiledMapHelper.getPosByWorldPos(worldPos);
    }
    public tiledMapGetTiledPos(x: number, y: number): TilePos {
        if (!this.isTiledMapHelperInited) {
            return null;
        }
        return this._tiledMapHelper.getPos(x, y);
    }
    public tiledMapGetTiledMovePathByTiledPos(fromTilePos: Vec2, toTilePos: Vec2, toStayPos: Vec2[] = []): { canMove: boolean; path: TilePos[] } {
        if (!this.isTiledMapHelperInited) {
            return { canMove: false, path: [] };
        }
        const fromPos = this._tiledMapHelper.getPos(
            Math.min(Math.max(0, fromTilePos.x), this._tiledMapHelper.width - 1),
            Math.min(Math.max(0, fromTilePos.y), this._tiledMapHelper.height - 1)
        );
        const toPos = this._tiledMapHelper.getPos(
            Math.min(Math.max(0, toTilePos.x), this._tiledMapHelper.width - 1),
            Math.min(Math.max(0, toTilePos.y), this._tiledMapHelper.height - 1)
        );
        // path
        const movePaths = this._tiledMapHelper.Path_FromTo(fromPos, toPos);
        let canMove = true;
        if (movePaths.length <= 1) {
            //only one from pos, cannot move
            canMove = false;
        }
        // delete unuseless path
        const templeToStayPos = toStayPos.slice();
        for (let i = 0; i < movePaths.length; i++) {
            const path = movePaths[i];
            let needRemove: boolean = false;
            if (path.x == fromPos.x && path.y == fromPos.y) {
                needRemove = true;
            } else {
                for (let j = 0; j < templeToStayPos.length; j++) {
                    if (templeToStayPos[j].x == path.x && templeToStayPos[j].y == path.y) {
                        needRemove = true;
                        templeToStayPos.splice(j, 1);
                        break;
                    }
                }
            }
            if (needRemove) {
                movePaths.splice(i, 1);
                i--;
            }
        }
        return { canMove: canMove, path: movePaths };
    }
    public tiledMapIsAllBlackShadow(x: number, y: number): boolean {
        if (!this.isTiledMapHelperInited) {
            return false;
        }
        return this._tiledMapHelper.Shadow_IsAllBlack(x, y);
    }
    public tiledMapIsBlock(mapPos: Vec2): boolean {
        if (!this.isTiledMapHelperInited) {
            return false;
        }
        return this._tiledMapHelper.Path_IsBlock(mapPos.x, mapPos.y);
    }
    public tiledMapShadowErase(mapPos: Vec2, ownerId: string = "0"): TilePos[] {
        if (!this.isTiledMapHelperInited) {
            return [];
        }
        let vision: number = 6;
        vision = GameMgr.getAfterEffectValue(GameExtraEffectType.PIONEER_ONLY_VISION_RANGE, vision);
        vision = GameMgr.getAfterEffectValue(GameExtraEffectType.CITY_AND_PIONEER_VISION_RANGE, vision);
        return this._tiledMapHelper.Shadow_Earse(this._tiledMapHelper.getPos(mapPos.x, mapPos.y), ownerId, vision, false);
    }
    public tiledMapMainCityShadowErase(mapPos: Vec2) {
        if (!this.isTiledMapHelperInited) {
            return [];
        }
        const vision: number = DataMgr.s.userInfo.data.cityRadialRange - 1;
        return this._tiledMapHelper.Shadow_Earse(this._tiledMapHelper.getPos(mapPos.x, mapPos.y), "0", vision, false);
    }
    public tiledMapGetShadowClearedTiledPositions(): TilePos[] {
        if (!this.isTiledMapHelperInited) {
        return [];
        }
        return this._tiledMapHelper.Shadow_GetClearedTiledPositons();
    }
    public tiledMapShadowUpdate(dt: number) {
        if (!this.isTiledMapHelperInited) {
            return;
        }
        // this._tiledMapHelper.Shadow_Update(dt);
    }
    public showTrackingView(worldPosition: Vec3, interactData: { stepId: string; interactBuildingId: string; interactPioneerId: string }) {
        this._trackingView.active = true;
        this._trackingView.setSiblingIndex(99999);
        this._trackingView.worldPosition = worldPosition;

        this._currentTrackingInteractData = interactData;
    }
    public currentTrackingInteractData() {
        return this._currentTrackingInteractData;
    }
    public hideTrackingView() {
        this._trackingView.active = false;
    }
    //------------------------------------------ cursor
    public changeCursor(type: ECursorType) {
        NotificationMgr.triggerEvent(NotificationName.CHANGE_CURSOR, type);
    }
    //------------------------------------------ eventWaitAction
    public get isTapEventWaited(): boolean {
        return this._isTapEventWaited;
    }
    public set isTapEventWaited(value: boolean) {
        this._isTapEventWaited = value;
    }
    //------------------------------------------ BuildingLattice
    public get isEditInnerBuildingLattice(): boolean {
        return this._isEditInnerBuildingLattice;
    }
    public changeInnerBuildingLatticeEdit() {
        this._isEditInnerBuildingLattice = !this._isEditInnerBuildingLattice;
        NotificationMgr.triggerEvent(NotificationName.GAME_INNER_BUILDING_LATTICE_EDIT_CHANGED);
    }
    //-------------------------------------------- map init succeed
    public mapInitOver() {
        this._isMapInitOver = true;

        // map init over
        // check rookie step
        if (DataMgr.s.userInfo.data.rookieStep != RookieStep.FINISH) {
            NotificationMgr.triggerEvent(NotificationName.USERINFO_ROOKE_STEP_CHANGE);
        }

        const leftTalkIds: string[] = DataMgr.s.userInfo.data.talkIds;
        if (leftTalkIds != null && leftTalkIds.length > 0) {
            NotificationMgr.triggerEvent(NotificationName.USERINFO_DID_TRIGGER_LEFT_TALK, { talkId: leftTalkIds.splice(0, 1)[0] });
        }
    }
    public get isMapInitOver(): boolean {
        return this._isMapInitOver;
    }

    private static _instance: GameMainHelper;
    private _mapNode: Node;
    private _gameCamera: Camera;
    private _gameCameraOriginalOrthoHeight: number;
    private _gameCameraZoom: number;

    private _isGameShowOuter: boolean = true;

    private _isTapEventWaited: boolean = false;

    private _tiledMapHelper: TileMapHelper = null;

    private _currentTrackingInteractData: { stepId: string; interactBuildingId: string; interactPioneerId: string } = null;
    private _trackingView: Node = null;

    private _isEditInnerBuildingLattice: boolean = false;

    private _isMapInitOver: boolean = false;

    private _outScene: Node = null;


    constructor() {
        this._currentTrackingInteractData = {
            stepId: "",
            interactBuildingId: "",
            interactPioneerId: "",
        };

        NotificationMgr.addListener(NotificationName.GAME_JUMP_INNER_AND_SHOW_RELIC_TOWER, this._onGameJumpInnerAndShowRelicTower, this);
    }

    updateGameViewport() {
        if (!this._outScene) {
            this._outScene = find("Main/Canvas/GameContent/Game/OutScene");
            if (!this._outScene) {
                return;
            }
        }
        let gameCamera = this._gameCamera;
        let mapNode = this._mapNode;
        mapNode.updateWorldTransform();
        Mat4.invert(_mat4_temp, mapNode.getWorldMatrix());
        _vec3_temp.x = 0;
        _vec3_temp.y = 0;
        _vec3_temp.z = 0;
        _vec3_temp2.x = gameCamera.camera.width;
        _vec3_temp2.y = gameCamera.camera.height;
        _vec3_temp2.z = 0;
        gameCamera.camera.screenToWorld(_vec3_temp, _vec3_temp);
        gameCamera.camera.screenToWorld(_vec3_temp2, _vec3_temp2);
        Vec3.transformMat4(_vec3_temp, _vec3_temp, _mat4_temp);
        Vec3.transformMat4(_vec3_temp2, _vec3_temp2, _mat4_temp);
        Rect.fromMinMax(_rect_temp, _vec3_temp, _vec3_temp2);
        let areaWidth = TileMapHelper.INS.pixelwidth - TileMapHelper.INS.tilewidth/2;
        let areaHeight = TileMapHelper.INS.pixelheight - TileMapHelper.INS.tileheight/2;
        let sx = _rect_temp.xMin/areaWidth + 0.5;
        let sy = _rect_temp.yMin/areaHeight + 0.5;
        let ex = _rect_temp.xMax/areaWidth + 0.5;
        let ey = _rect_temp.yMax/areaHeight + 0.5;
        _vec3_temp.x = Math.floor(sx);
        _vec3_temp.y = Math.floor(sy);
        _vec3_temp2.x = Math.floor(ex);
        _vec3_temp2.y = Math.floor(ey);
        Rect.fromMinMax(_rect_temp2, _vec3_temp, _vec3_temp2);
        // console.log('mapNode info:',_rect_temp,_rect_temp2);
        this._outScene.getComponent(OuterDecorateController).refreshUI(_rect_temp,_rect_temp2);
        this._outScene.getComponent(OuterTiledMapActionController).refreshUI(_rect_temp,_rect_temp2);
    }

    private _onGameJumpInnerAndShowRelicTower() {
        this.changeInnerAndOuterShow();
    }
}
const _mat4_temp = new Mat4();
const _vec3_temp = new Vec3();
const _vec3_temp2 = new Vec3();
const _rect_temp = new Rect();
const _rect_temp2 = new Rect();