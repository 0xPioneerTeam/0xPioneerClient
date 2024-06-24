import {
    _decorator,
    Component,
    Node,
    Camera,
    EventHandler,
    Vec3,
    tween,
    inverseLerp,
    find,
    AssetManager,
    loader,
    Asset,
    Prefab,
    instantiate,
    Details,
    pingPong,
} from "cc";
import NotificationMgr from "../Basic/NotificationMgr";
import ViewController from "../BasicView/ViewController";
import { NotificationName } from "../Const/Notification";
import GameMainHelper from "./Helper/GameMainHelper";
import { ECursorType } from "../Const/ConstDefine";
import { GameMgr, ResourcesMgr } from "../Utils/Global";
import UIPanelManger, { UIPanelLayerType } from "../Basic/UIPanelMgr";
import { HUDName } from "../Const/ConstUIDefine";
import { LoadingUI } from "../UI/Loading/LoadingUI";
import { DataMgr } from "../Data/DataMgr";
import { RookieStep } from "../Const/RookieDefine";
import { BundleName } from "../Basic/ResourcesMgr";

const { ccclass, property } = _decorator;

@ccclass("GameMain")
export class GameMain extends ViewController {
    private _innerView: Node = null;

    protected viewDidLoad(): void {
        super.viewDidLoad();
        GameMainHelper.instance.setGameCamera(find("Main/Canvas/GameCamera").getComponent(Camera));

        NotificationMgr.addListener(NotificationName.MAP_PIONEER_ROOKIE_WORMHOLE_FIGHT_COUNT, this._onRookieWormholeFightCount, this);
    }

    protected viewDidStart(): void {
        super.viewDidStart();

        this._refreshUI(false);

        GameMgr.enterGameSence = true;
    }

    protected viewDidAppear(): void {
        super.viewDidAppear();

        NotificationMgr.addListener(NotificationName.GAME_INNER_AND_OUTER_CHANGED, this._onGameInnerOuterChange, this);
    }

    protected viewDidDisAppear(): void {
        super.viewDidDisAppear();

        NotificationMgr.removeListener(NotificationName.GAME_INNER_AND_OUTER_CHANGED, this._onGameInnerOuterChange, this);
    }

    protected onDestroy(): void {
        super.onDestroy();

        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_ROOKIE_WORMHOLE_FIGHT_COUNT, this._onRookieWormholeFightCount, this);
    }

    //--------------------------------------- function
    private async _refreshUI(loadingAnim: boolean = true) {
        const outerView = this.node.getChildByPath("OutScene");
        const isOuterShow: boolean = GameMainHelper.instance.isGameShowOuter;
        if (this._innerView == null) {
            return;
        }
        // inner and outer need hide first, then show
        if (isOuterShow) {
            this._innerView.active = false;
            outerView.active = true;
        } else {
            outerView.active = false;
            this._innerView.active = true;
            GameMainHelper.instance.changeCursor(ECursorType.Common);
        }
        if (loadingAnim) {
            const result = await UIPanelManger.inst.pushPanel(HUDName.Loading, UIPanelLayerType.ROOKIE);
            if (!result.success) {
                return;
            }
            this.scheduleOnce(() => {
                result.node.getComponent(LoadingUI).showLoadingProgress(1);
                this.scheduleOnce(() => {
                    UIPanelManger.inst.popPanel(result.node, UIPanelLayerType.ROOKIE);
                }, 0.2);
            }, 0.3);
        }
    }

    //--------------------------------------- notitfication
    private async _onGameInnerOuterChange() {
        let loadingAnim: boolean = true;
        const isOuterShow: boolean = GameMainHelper.instance.isGameShowOuter;
        if (!isOuterShow && this._innerView == null) {
            const beginTime: number = new Date().getTime();
            const result = await ResourcesMgr.initBundle(BundleName.InnerBundle);
            if (result.succeed) {
                const loadingResult = await UIPanelManger.inst.pushPanel(HUDName.Loading, UIPanelLayerType.ROOKIE);
                result.bundle.loadDir(
                    "",
                    async (finished: number, total: number, item: AssetManager.RequestItem) => {
                        let rate: number = 0;
                        if (loadingResult.success) {
                            const currentRate: number = finished / total;
                            rate = Math.max(rate, currentRate);
                            loadingResult.node.getComponent(LoadingUI).showLoadingProgress(rate);
                        }
                    },
                    async (err: Error, data: Asset[]) => {
                        const endTime: number = new Date().getTime();
                        if (endTime - beginTime < 300) {
                            this.scheduleOnce(() => {
                                UIPanelManger.inst.popPanel(loadingResult.node, UIPanelLayerType.ROOKIE);
                            }, 0.3 - (endTime - beginTime) / 1000);
                        } else {
                            UIPanelManger.inst.popPanel(loadingResult.node, UIPanelLayerType.ROOKIE);
                        }
                        const innerViewResult = await ResourcesMgr.loadResource(BundleName.InnerBundle, "prefab/game/InnerSceneRe", Prefab);
                        if (innerViewResult != null) {
                            this._innerView = instantiate(innerViewResult);
                            this._innerView.setParent(this.node);
                            this._refreshUI(loadingAnim);
                        }
                    }
                );
            }
            loadingAnim = false;
        } else {
            this._refreshUI(loadingAnim);
        }
    }

    private _onRookieWormholeFightCount(data: { playerId: string; resultHp: number; delayTime: number }) {
        const { playerId, resultHp, delayTime } = data;
        console.log("exce data:", data);
        this.scheduleOnce(() => {
            const pioneer = DataMgr.s.pioneer.getById(playerId);
            if (pioneer != undefined) {
                pioneer.hp = resultHp;
                NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_HP_CHANGED);
            }
            NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_FIGHT_END, { id: playerId });
        }, delayTime);
    }
}
