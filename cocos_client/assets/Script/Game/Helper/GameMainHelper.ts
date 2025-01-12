import { Camera, Mat4, Node, Prefab, Rect, Size, TiledMap, UITransform, Vec2, Vec3, find, size, tween, v2 } from "cc";
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
import { OuterShadowController } from "../Outer/OuterShadowController";
import { OuterBuildingController } from "../Outer/OuterBuildingController";
import { InnerBuildingType } from "../../Const/BuildingDefine";
import InnerBuildingLvlUpConfig from "../../Config/InnerBuildingLvlUpConfig";
import { MainCityArrowComp } from "../Outer/View/MainCityArrowComp";

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
        localStorage.setItem("local_outer_map_scale", this._gameCameraZoom.toString());
        if (!this._isGameShowOuter) {
            // new inner max zoom limit 0.8
            this._gameCameraZoom = Math.min(0.8, this._gameCameraZoom);
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
        this._gameCameraMoving = true;
        if (animation) {
            const distance = Vec3.distance(this._gameCamera.node.worldPosition.clone(), position.clone());
            tween()
                .target(this._gameCamera.node)
                .to(Math.min(0.8, distance / 1800), { worldPosition: position })
                .call(() => {
                    NotificationMgr.triggerEvent(NotificationName.GAME_CAMERA_POSITION_CHANGED, { triggerTask: triggerTask });
                    this._gameCameraMoving = false;
                })
                .start();
        } else {
            this._gameCamera.node.setWorldPosition(position);
            NotificationMgr.triggerEvent(NotificationName.GAME_CAMERA_POSITION_CHANGED, { triggerTask: triggerTask });
            this._gameCameraMoving = false;
        }
    }
    public changeGameCameraPosition(position: Vec3, animation: boolean = false, triggerTask: boolean = false) {
        this._gameCameraMoving = true;
        if (animation) {
            const distance = Vec3.distance(this._gameCamera.node.position.clone(), position.clone());
            tween()
                .target(this._gameCamera.node)
                .to(Math.min(0.8, distance / 1800), { position: position })
                .call(() => {
                    NotificationMgr.triggerEvent(NotificationName.GAME_CAMERA_POSITION_CHANGED, { triggerTask: triggerTask });
                    this._gameCameraMoving = false;
                })
                .start();
        } else {
            this._gameCamera.node.setPosition(position);
            NotificationMgr.triggerEvent(NotificationName.GAME_CAMERA_POSITION_CHANGED, { triggerTask: triggerTask });
            this._gameCameraMoving = false;
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
        if (this._gameCameraMoving) {
            // cannot change inner and outer during camera move
            return;
        }
        this._isGameShowOuter = !this._isGameShowOuter;
        NotificationMgr.triggerEvent(NotificationName.GAME_INNER_AND_OUTER_CHANGED);
    }
    public get isGameShowOuter(): boolean {
        return this._isGameShowOuter;
    }

    //------------------------------------------outer outScene
    public setOutScene(scene: Node) {
        this._outScene = scene;
        this._shadowController = scene.getComponent(OuterShadowController);
    }

    public get shadowController(): OuterShadowController {
        return this._shadowController;
    }

    //------------------------------------------ tiled map
    public initTiledMapHelper(map: TiledMap, tracking: Node) {
        //init tiledmap by a helper class
        this._tiledMapHelper = new TileMapHelper(map);
        this._mapNode = map.node;
        this._shadowBuildNode = this._mapNode.getChildByName("deco_shadow");
        let uitrans = this._shadowBuildNode.getComponent(UITransform);
        if (!uitrans) {
            this._shadowBuildNode.addComponent(UITransform);
        }
        //set a callback here. 35 is block
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
    public tiledMapAddDynamicBlock(mapPos: Vec2, uuid: string): void {
        if (!this.isTiledMapHelperInited) {
            return;
        }
        this._tiledMapHelper.Path_AddDynamicBlock(mapPos.x, mapPos.y, uuid);
    }
    public tiledMapRemoveDynamicBlock(mapPos: Vec2, uuid: string): void {
        if (!this.isTiledMapHelperInited) {
            return;
        }
        this._tiledMapHelper.Path_RemoveDynamicBlock(mapPos.x, mapPos.y, uuid);
    }
    public tiledMapGetAroundByDirection(mapPos: Vec2, direction: TileHexDirection): TilePos {
        if (!this.isTiledMapHelperInited) {
            return null;
        }
        mapPos = v2(mapPos.x, mapPos.y);
        return this._tiledMapHelper.Path_GetAroundByDirection(this._tiledMapHelper.getPos(mapPos.x, mapPos.y), direction);
    }
    public tiledMapGetExtAround(mapPos: Vec2, range: number): TilePos[] {
        if (!this.isTiledMapHelperInited) {
            return [];
        }
        return this._tiledMapHelper.getExtAround(this._tiledMapHelper.getPos(mapPos.x, mapPos.y), range - 1);
    }
    public tiledMapGetPosPixel(x: number, y: number): Vec3 {
        if (!this.isTiledMapHelperInited) {
            return null;
        }
        return this._tiledMapHelper.getPosPixel(x, y);
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
        const fromPos = this._tiledMapHelper.getPos(fromTilePos.x, fromTilePos.y);
        const toPos = this._tiledMapHelper.getPos(toTilePos.x, toTilePos.y);

        let unLimitBlocks = [];
        toStayPos.forEach((pos) => {
            unLimitBlocks.push(pos.x + "_" + pos.y);
        });
        unLimitBlocks.push(fromPos.x + "_" + fromPos.y);
        // path   fromPos exblock check
        const movePaths = this._tiledMapHelper.Path_FromTo2(fromPos, toPos, unLimitBlocks);
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
    public tiledMapIsBlock(mapPos: Vec2): boolean {
        if (!this.isTiledMapHelperInited) {
            return false;
        }
        return this._tiledMapHelper.Path_IsBlock(mapPos.x, mapPos.y);
    }
    public tiledMapShadowErase(mapPos: Vec2, ownerId: string = "0") {
        if (!this.isTiledMapHelperInited) {
            return [];
        }
        let vision: number = 6;
        vision = GameMgr.getAfterEffectValue(GameExtraEffectType.PIONEER_ONLY_VISION_RANGE, vision);
        vision = GameMgr.getAfterEffectValue(GameExtraEffectType.CITY_AND_PIONEER_VISION_RANGE, vision);
        return this.shadowController.Shadow_Earse(this._tiledMapHelper.getPos(mapPos.x, mapPos.y), ownerId, vision);
    }
    public tiledMapMainCityShadowErase(mapPos: Vec2) {
        if (!this.isTiledMapHelperInited) {
            return [];
        }
        const vision: number = DataMgr.s.userInfo.data.cityRadialRange - 1;
        return this.shadowController.Shadow_Earse(this._tiledMapHelper.getPos(mapPos.x, mapPos.y), "City", vision);
    }
    public tiledMapDetectShadowErase(mapPos: Vec2) {
        if (!this.isTiledMapHelperInited) {
            return [];
        }
        const InformationStationLevel = DataMgr.s.innerBuilding.getInnerBuildingLevel(InnerBuildingType.InformationStation);
        if (InformationStationLevel < 1) {
            return [];
        }
        const vision: number = InnerBuildingLvlUpConfig.getBuildingLevelData(InformationStationLevel, "sight_range");
        return this.shadowController.Shadow_Earse(this._tiledMapHelper.getPos(mapPos.x, mapPos.y), "City", vision);
    }
    public tiledMapGetShadowClearedTiledPositions(): TilePos[] {
        if (!this.isTiledMapHelperInited) {
            return [];
        }
        return this.shadowController.Shadow_GetClearedTiledPositons();
    }

    public tiledMapIsInGameScene(x: number, y: number): boolean {
        let pos = this._tiledMapHelper.getPos(x, y);
        _vec2_temp.x = pos.pixel_x;
        _vec2_temp.y = pos.pixel_y;
        return this._worldCameraRect.contains(_vec2_temp);
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
            NotificationMgr.triggerEvent(NotificationName.USERINFO_DID_TRIGGER_LEFT_TALK, { talkId: leftTalkIds.splice(0, 1)[0], fromRookie: false });
        }
    }
    public get isMapInitOver(): boolean {
        return this._isMapInitOver;
    }

    public get shadowBuildNode(): Node {
        return this._shadowBuildNode;
    }

    private static _instance: GameMainHelper;
    private _mapNode: Node;
    private _shadowBuildNode: Node;
    private _gameCamera: Camera;
    private _gameCameraOriginalOrthoHeight: number;
    private _gameCameraZoom: number;
    private _gameCameraMoving: boolean = false;

    private _isGameShowOuter: boolean = true;

    private _tiledMapHelper: TileMapHelper = null;

    private _currentTrackingInteractData: { stepId: string; interactBuildingId: string; interactPioneerId: string } = null;
    private _trackingView: Node = null;

    private _isEditInnerBuildingLattice: boolean = false;

    private _isMapInitOver: boolean = false;

    private _outScene: Node = null;

    private _shadowController: OuterShadowController = null;

    private _worldCameraRect: Rect = null;

    /**
     * binding ArrowComp
     */
    public bindCityArrowComp:MainCityArrowComp;

    constructor() {
        this._currentTrackingInteractData = {
            stepId: "",
            interactBuildingId: "",
            interactPioneerId: "",
        };

        NotificationMgr.addListener(NotificationName.GAME_JUMP_INNER_AND_SHOW_RELIC_TOWER, this._onGameJumpInnerAndShowRelicTower, this);
        this._worldCameraRect = new Rect();
    }

    updateGameViewport() {
        if (!this._outScene) {
            return;
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
        gameCamera.screenToWorld(_vec3_temp, _vec3_temp);
        gameCamera.screenToWorld(_vec3_temp2, _vec3_temp2);
        Vec3.transformMat4(_vec3_temp, _vec3_temp, _mat4_temp);
        Vec3.transformMat4(_vec3_temp2, _vec3_temp2, _mat4_temp);
        Rect.fromMinMax(_rect_temp, _vec3_temp, _vec3_temp2);
        let areaWidth = TileMapHelper.INS.pixelwidth - TileMapHelper.INS.tilewidth / 2;
        let areaHeight = TileMapHelper.INS.pixelheight - TileMapHelper.INS.tileheight / 4;
        let sx = _rect_temp.xMin / areaWidth - 0.5;
        let sy = _rect_temp.yMin / areaHeight + 0.5;
        let ex = _rect_temp.xMax / areaWidth - 0.5;
        let ey = _rect_temp.yMax / areaHeight + 0.5;
        _vec3_temp.x = Math.round(sx);
        _vec3_temp.y = Math.round(sy);
        _vec3_temp2.x = Math.round(ex);
        _vec3_temp2.y = Math.round(ey);
        Rect.fromMinMax(_rect_temp2, _vec3_temp, _vec3_temp2);
        this._worldCameraRect.x = _rect_temp.x;
        this._worldCameraRect.y = _rect_temp.y;
        this._worldCameraRect.width = _rect_temp.width;
        this._worldCameraRect.height = _rect_temp.height;
        // console.log('mapNode info:',_rect_temp,_rect_temp2,this._gameCamera,this._gameCamera.camera);
        this._outScene.getComponent(OuterDecorateController).refreshUI(_rect_temp, _rect_temp2);
        this._outScene.getComponent(OuterTiledMapActionController).refreshUI(_rect_temp, _rect_temp2);
        this._outScene.getComponent(OuterShadowController).refreshUI(_rect_temp, _rect_temp2);
        this._outScene.getComponent(OuterBuildingController).refreshUI(_rect_temp, _rect_temp2);
        if(this.bindCityArrowComp){
            this.bindCityArrowComp.calcMainCityArrowNode(this._worldCameraRect.center);
        }
    }

    private _onGameJumpInnerAndShowRelicTower() {
        this.changeInnerAndOuterShow();
    }
}
const _mat4_temp = new Mat4();
const _vec2_temp = new Vec2();
const _vec3_temp = new Vec3();
const _vec3_temp2 = new Vec3();
const _rect_temp = new Rect();
const _rect_temp2 = new Rect();
