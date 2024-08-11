import { _decorator, Camera, Component, Vec3 } from "cc";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import GameMainHelper from "../Game/Helper/GameMainHelper";
const { ccclass, property } = _decorator;

@ccclass("GameOverlayCamera")
export class GameOverlayCamera extends Component {
    start() {
        NotificationMgr.addListener(NotificationName.GAME_CAMERA_POSITION_CHANGED, this._onGameCameraPositionChange, this);
        NotificationMgr.addListener(NotificationName.GAME_CAMERA_ZOOM_CHANGED, this._onGameCameraZoomChange, this);
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_BEGIN_MOVE, this._onMapPioneerBeginMove, this);
        this._camera = this.node.getComponent(Camera);
    }

    private _camera: Camera = null;
    private _lastCameraPosition: Vec3 = new Vec3();
    private _lastCameraorthoHeight: number = 0;

    update(deltaTime: number) {
        if (!GameMainHelper.instance.isMapInitOver) {
            return;
        }
        if (
            this._lastCameraPosition.equals(GameMainHelper.instance.gameCameraWorldPosition) &&
            this._lastCameraorthoHeight == GameMainHelper.instance.gameCameraOrthoHeight
        ) {
            return;
        }
        this._checkMapMemberShow();
    }

    private _checkMapMemberShow() {
        this._lastCameraPosition = GameMainHelper.instance.gameCameraWorldPosition.clone();
        this._lastCameraorthoHeight = GameMainHelper.instance.gameCameraOrthoHeight;
        GameMainHelper.instance.updateGameViewport();
    }

    //------------------------- notification
    private _onGameCameraPositionChange() {
        this.node.worldPosition = GameMainHelper.instance.gameCameraWorldPosition;
    }
    private _onGameCameraZoomChange() {
        this._camera.orthoHeight = GameMainHelper.instance.gameCameraOrthoHeight;
    }
    private _onMapPioneerBeginMove() {
        this._checkMapMemberShow();
    }
}
