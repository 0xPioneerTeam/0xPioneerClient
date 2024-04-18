import { Camera, Size, TiledMap, Vec2, Vec3, size, tween, v2 } from "cc";
import ConfigConfig from "../../Config/ConfigConfig";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import { ECursorType, GameExtraEffectType } from "../../Const/ConstDefine";
import { TileHexDirection, TileMapHelper, TilePos } from "../TiledMap/TileTool";
import { ArtifactMgr, GameMgr, UserInfoMgr } from "../../Utils/Global";
import { ConfigType, MapScaleParam } from "../../Const/Config";
import { DataMgr } from "../../Data/DataMgr";

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
    public changeGameCameraWorldPosition(position: Vec3, animation: boolean = false) {
        if (animation) {
            const distance = Vec3.distance(this._gameCamera.node.worldPosition.clone(), position.clone());
            tween()
                .target(this._gameCamera.node)
                .to(Math.min(0.8, distance / 1800), { worldPosition: position })
                .call(() => {
                    NotificationMgr.triggerEvent(NotificationName.GAME_CAMERA_POSITION_CHANGED);
                })
                .start();
        } else {
            this._gameCamera.node.setWorldPosition(position);
            NotificationMgr.triggerEvent(NotificationName.GAME_CAMERA_POSITION_CHANGED);
        }
    }
    public changeGameCameraPosition(position: Vec3, animation: boolean = false) {
        if (animation) {
            const distance = Vec3.distance(this._gameCamera.node.position.clone(), position.clone());
            tween()
                .target(this._gameCamera.node)
                .to(Math.min(0.8, distance / 1800), { position: position })
                .call(() => {
                    NotificationMgr.triggerEvent(NotificationName.GAME_CAMERA_POSITION_CHANGED);
                })
                .start();
        } else {
            this._gameCamera.node.setPosition(position);
            NotificationMgr.triggerEvent(NotificationName.GAME_CAMERA_POSITION_CHANGED);
        }
    }
    public getGameCameraScreenToWorld(postion: Vec3) {
        return this._gameCamera.screenToWorld(postion);
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

    //------------------------------------------ inner outer
    public changeInnerAndOuterShow() {
        this._isGameShowOuter = !this._isGameShowOuter;
        NotificationMgr.triggerEvent(NotificationName.GAME_INNER_AND_OUTER_CHANGED);
    }
    public get isGameShowOuter(): boolean {
        return this._isGameShowOuter;
    }
    //------------------------------------------ tiled map
    public initTiledMapHelper(map: TiledMap) {
        //init tiledmap by a helper class
        this._tiledMapHelper = new TileMapHelper(map);
        this._tiledMapHelper.Shadow_Init(0, 75);
        this._tiledMapHelper._shadowhalftag = 73;
        this._tiledMapHelper._shadowhalf2tag = 74;
        //set a callback here. 35 is block
        this._tiledMapHelper.Path_InitBlock(35);
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
            canMoveTo: canMoveTo
        });
    }
    public tiledMapRemoveDynamicBlock(mapPos: Vec2): void {
        if (!this.isTiledMapHelperInited) {
            return;
        }
        this._tiledMapHelper.Path_RemoveDynamicBlock({
            TileX: mapPos.x,
            TileY: mapPos.y,
            canMoveTo: false
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
    public tiledMapGetTiledMovePathByTiledPos(fromTilePos: Vec2, toTilePos: Vec2, toStayPos: Vec2[] = []): { canMove: boolean, path: TilePos[] } {
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
        vision = GameMgr.getAfterExtraEffectPropertyByPioneer(ownerId, GameExtraEffectType.PIONEER_ONLY_VISION_RANGE, vision);
        vision = GameMgr.getAfterExtraEffectPropertyByPioneer(ownerId, GameExtraEffectType.CITY_AND_PIONEER_VISION_RANGE, vision);
        return this._tiledMapHelper.Shadow_Earse(this._tiledMapHelper.getPos(mapPos.x, mapPos.y), ownerId, vision, false);
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
        this._tiledMapHelper.Shadow_Update(dt);
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


    private static _instance: GameMainHelper;

    private _gameCamera: Camera;
    private _gameCameraOriginalOrthoHeight: number;
    private _gameCameraZoom: number;

    private _isGameShowOuter: boolean = true;

    private _isTapEventWaited: boolean = false;

    private _tiledMapHelper: TileMapHelper = null;


    private _isEditInnerBuildingLattice: boolean = false;
    public constructor() {

    }
}