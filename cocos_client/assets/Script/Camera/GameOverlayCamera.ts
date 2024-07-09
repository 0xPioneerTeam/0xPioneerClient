import { _decorator, Camera, Component, find, geometry, MeshRenderer, Node, Sprite, UITransform, Vec3 } from "cc";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import GameMainHelper from "../Game/Helper/GameMainHelper";
import { OuterTiledMapActionController } from "../Game/Outer/OuterTiledMapActionController";
const { ccclass, property } = _decorator;

@ccclass("GameOverlayCamera")
export class GameOverlayCamera extends Component {
    start() {
        NotificationMgr.addListener(NotificationName.GAME_CAMERA_POSITION_CHANGED, this._onGameCameraPositionChange, this);
        NotificationMgr.addListener(NotificationName.GAME_CAMERA_ZOOM_CHANGED, this._onGameCameraZoomChange, this);
    }

    private _outScene: Node = null;
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
        this._lastCameraPosition = GameMainHelper.instance.gameCameraWorldPosition.clone();
        this._lastCameraorthoHeight = GameMainHelper.instance.gameCameraOrthoHeight;
        if (!this._outScene) {
            this._outScene = find("Main/Canvas/GameContent/Game/OutScene");
            if (!this._outScene) {
                return;
            }
        }
        const frustum = this.node.getComponent(Camera).camera.frustum;
        const decorationView = this._outScene.getComponent(OuterTiledMapActionController).mapDecorationView();
        // borderMask todo update active
        let children = decorationView.children;
        let worldBox = new geometry.AABB();
        children.forEach((child) => {
            let uitransform = child.getComponent(UITransform);
            if (uitransform) {
                uitransform.getComputeAABB(worldBox);
                if (geometry.intersect.aabbFrustum(worldBox, frustum)) {
                    child.active = true;
                } else {
                    child.active = false;
                }
            }
        });
    }

    //------------------------- notification
    private _onGameCameraPositionChange() {
        this.node.worldPosition = GameMainHelper.instance.gameCameraWorldPosition;
    }
    private _onGameCameraZoomChange() {
        this.node.getComponent(Camera).orthoHeight = GameMainHelper.instance.gameCameraOrthoHeight;
    }
}
