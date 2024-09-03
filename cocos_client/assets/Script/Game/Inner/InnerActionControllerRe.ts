import { EventMouse, Node, UITransform, Vec2, Vec3, _decorator, game, v2, v3, view } from "cc";
import ViewController from "../../BasicView/ViewController";
import GameMainHelper from "../Helper/GameMainHelper";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";

const { ccclass, property } = _decorator;

@ccclass('InnerActionControllerRe')
export default class InnerActionControllerRe extends ViewController {

    private _isBuildingPosEdit: boolean = false;
    private _mouseDown: boolean = false;
    private _showInnerCameraPosition: Vec3 = Vec3.ZERO;
    private _showInnerCameraZoom: number = 1;

    protected viewDidLoad(): void {
        super.viewDidLoad();
    }

    protected viewDidStart(): void {
        super.viewDidStart();

        const cameraSize = GameMainHelper.instance.gameCameraSize;

        let uiTrans = this.node.getComponent(UITransform);
        let halfMapWidth = uiTrans.contentSize.width / 2;
        let halfMapHeight = uiTrans.contentSize.height / 2;

        let moveDistX = halfMapWidth - cameraSize.width / 2;
        let moveDistY = halfMapHeight - cameraSize.height / 2;

        this.node.on(Node.EventType.MOUSE_DOWN, (event: EventMouse) => {
            this._mouseDown = true;
            if (GameMainHelper.instance.isEditInnerBuildingLattice) {
                const locationPos = event.getLocation();
                NotificationMgr.triggerEvent(NotificationName.GAME_INNER_LATTICE_EDIT_ACTION_MOUSE_DOWN, { worldPos: GameMainHelper.instance.getGameCameraScreenToWorld(v3(locationPos.x, locationPos.y, 0)) });
            }
        }, this);

        this.node.on(Node.EventType.MOUSE_UP, (event: EventMouse) => {
            this._mouseDown = false;
            if (GameMainHelper.instance.isEditInnerBuildingLattice) {
                const locationPos = event.getLocation();
                NotificationMgr.triggerEvent(NotificationName.GAME_INNER_LATTICE_EDIT_ACTION_MOUSE_UP, { worldPos: GameMainHelper.instance.getGameCameraScreenToWorld(v3(locationPos.x, locationPos.y, 0)) });
            }
        }, this);

        this.node.on(Node.EventType.MOUSE_WHEEL, (event: EventMouse) => {
            return;
            if (this._isBuildingPosEdit) {

            } else {
                let zoom = GameMainHelper.instance.gameCameraZoom;
                if (event.getScrollY() > 0) {
                    zoom -= 0.05;
                } else {
                    zoom += 0.05;
                }
                GameMainHelper.instance.changeGameCameraZoom(zoom);
                this._fixCameraPos(GameMainHelper.instance.gameCameraPosition.clone());
            }
        }, this);

        this.node.on(Node.EventType.MOUSE_MOVE, (event: EventMouse) => {
            return;
            if (this._mouseDown) {
                let pos = GameMainHelper.instance.gameCameraPosition.clone().add(new Vec3(-event.movementX, event.movementY, 0));
                if (this._isBuildingPosEdit) {
                    NotificationMgr.triggerEvent(NotificationName.GAME_INNER_LATTICE_EDIT_ACTION_MOUSE_MOVE, { movement: event.getUIDelta() });
                } else {
                    this._fixCameraPos(pos);
                }
            }
        }, this);
    }

    protected viewDidAppear(): void {
        super.viewDidAppear();

        GameMainHelper.instance.changeGameCameraPosition(this._showInnerCameraPosition.clone());
        GameMainHelper.instance.changeGameCameraZoom(this._showInnerCameraZoom);

        NotificationMgr.addListener(NotificationName.GAME_INNER_BUILDING_LATTICE_EDIT_CHANGED, this._onInnerBuildingLatticeEditChanged, this);
    }

    protected viewDidDisAppear(): void {
        super.viewDidDisAppear();

        this._showInnerCameraPosition = GameMainHelper.instance.gameCameraPosition.clone();
        this._showInnerCameraZoom = GameMainHelper.instance.gameCameraZoom;

        NotificationMgr.removeListener(NotificationName.GAME_INNER_BUILDING_LATTICE_EDIT_CHANGED, this._onInnerBuildingLatticeEditChanged, this);
    }

    private _fixCameraPos(pos: Vec3) {
        const contentSize = this.node.getComponent(UITransform).contentSize;
        const scale = this.node.scale;
        const sc = 1 - GameMainHelper.instance.gameCameraZoom;
        const minx = -contentSize.width * scale.x / 2 * sc;
        const maxx = contentSize.width * scale.x / 2 * sc;
        const miny = -contentSize.height * scale.y / 2 * sc;
        const maxy = contentSize.height * scale.y / 2 * sc;

        pos.x = Math.min(Math.max(minx, pos.x), maxx);
        pos.y = Math.min(Math.max(miny, pos.y), maxy);

        GameMainHelper.instance.changeGameCameraPosition(pos);
    }
    //------------------------------------- notifcation
    private _onInnerBuildingLatticeEditChanged() {
        this._isBuildingPosEdit = GameMainHelper.instance.isEditInnerBuildingLattice;
    }
}