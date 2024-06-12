import { Canvas, Node, UITransform, find, v3 } from "cc";
import NotificationMgr from "../Basic/NotificationMgr";
import UIPanelManger, { UIPanelLayerType } from "../Basic/UIPanelMgr";
import { UIName } from "../Const/ConstUIDefine";
import { NotificationName } from "../Const/Notification";
import { RookieStepMaskUI } from "../UI/RookieGuide/RookieStepMaskUI";
import { DataMgr } from "../Data/DataMgr";
import { RookieStep } from "../Const/RookieDefine";
import { NetworkMgr } from "../Net/NetworkMgr";
import { s2c_user } from "../Net/msg/WebsocketMsg";
import GameMainHelper from "../Game/Helper/GameMainHelper";
import TalkConfig from "../Config/TalkConfig";
import { DialogueUI } from "../UI/Outer/DialogueUI";

export default class RookieStepMgr {
    private static _instance: RookieStepMgr;
    private _maskView: RookieStepMaskUI = null;

    public async init() {
        const result = await UIPanelManger.inst.pushPanel(UIName.RookieStepMaskUI, UIPanelLayerType.HUD);
        if (!result.success) {
            return;
        }
        this._maskView = result.node.getComponent(RookieStepMaskUI);
        this._refreshMaskShow();

        NotificationMgr.addListener(NotificationName.USERINFO_DID_CHANGE_HEAT, this.onHeatChange, this);
        NotificationMgr.addListener(NotificationName.TALK_FINISH, this._onTalkFinish, this);
        NotificationMgr.addListener(NotificationName.GAME_CAMERA_POSITION_CHANGED, this._onGameCameraPosChange, this);

        NotificationMgr.addListener(NotificationName.USERINFO_ROOKE_STEP_CHANGE, this._onRookieStepChange, this);
        NotificationMgr.addListener(NotificationName.ROOKIE_GUIDE_FIGHT_ENEMY_WIN, this._onRookieFightWin, this);
        NotificationMgr.addListener(NotificationName.ROOKIE_GUIDE_COLLECT_RESOURCE, this._onRookieCollectResource, this);
        NotificationMgr.addListener(NotificationName.MAP_BUILDING_WORMHOLE_ATTACKER_CHANGE, this._onRookieSetWormholeAttack, this);
        NotificationMgr.addListener(NotificationName.ROOKIE_GUIDE_BUILDING_UPGRADE_CLOSE, this._onRookieBuildingUpgradeClose, this);

        NotificationMgr.addListener(NotificationName.ROOKIE_GUIDE_NEED_MASK_SHOW, this._onRooieNeedMaskShow, this);

        NetworkMgr.websocket.on("player_worldbox_beginner_open_res", this.player_worldbox_beginner_open_res);
    }

    public static instance(): RookieStepMgr {
        if (!this._instance) {
            this._instance = new RookieStepMgr();
        }
        return this._instance;
    }

    public constructor() {}

    private _refreshMaskShow() {
        const rookieStep = DataMgr.s.userInfo.data.rookieStep;
        this._maskView.node.active = rookieStep != RookieStep.WAKE_UP && rookieStep != RookieStep.FINISH;
    }

    private onHeatChange() {
        const rookieStep = DataMgr.s.userInfo.data.rookieStep;
        if (rookieStep == RookieStep.PIOT_TO_HEAT) {
            // next step
            NetworkMgr.websocketMsg.player_rookie_update({
                rookieStep: RookieStep.NPC_TALK_4,
            });
        }
    }
    private _onTalkFinish(data: { talkId: string }) {
        const rookieStep: RookieStep = DataMgr.s.userInfo.data.rookieStep;
        if (rookieStep == RookieStep.NPC_TALK_1 && data.talkId == "talk02") {
            // next step
            NetworkMgr.websocketMsg.player_rookie_update({
                rookieStep: RookieStep.NPC_TALK_3,
            });
        } else if (rookieStep == RookieStep.NPC_TALK_3 && data.talkId == "talk03") {
            // next step
            NetworkMgr.websocketMsg.player_rookie_update({
                rookieStep: RookieStep.PIOT_TO_HEAT,
            });
        } else if (rookieStep == RookieStep.NPC_TALK_4 && data.talkId == "talk04") {
            // next step
            NetworkMgr.websocketMsg.player_rookie_update({
                rookieStep: RookieStep.OPEN_BOX_1,
            });
        } else if (rookieStep == RookieStep.NPC_TALK_5 && data.talkId == "talk05") {
            // next step
            NetworkMgr.websocketMsg.player_rookie_update({
                rookieStep: RookieStep.TASK_SHOW_TAP_1,
            });
        } else if (rookieStep == RookieStep.NPC_TALK_6 && data.talkId == "talk06") {
            // next step
            NetworkMgr.websocketMsg.player_rookie_update({
                rookieStep: RookieStep.OPEN_BOX_2,
            });
        } else if (rookieStep == RookieStep.NPC_TALK_7 && data.talkId == "talk07") {
            // next step
            NetworkMgr.websocketMsg.player_rookie_update({
                rookieStep: RookieStep.ENTER_INNER,
            });
        } else if (rookieStep == RookieStep.NPC_TALK_19 && data.talkId == "talk19") {
            // next step
            NetworkMgr.websocketMsg.player_rookie_update({
                rookieStep: RookieStep.RESOURCE_COLLECT,
            });
        } else if (rookieStep == RookieStep.MAIN_BUILDING_TAP_1 && data.talkId == "talk18") {
            // upgrade tapindex -3,  show tap close tap
            NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_TAP_BUILDING_UPGRADE, { tapIndex: "-3" });
        } else if (rookieStep == RookieStep.RESOURCE_COLLECT && data.talkId == "talk08") {
            NetworkMgr.websocketMsg.player_rookie_update({
                rookieStep: RookieStep.ENTER_INNER_2,
            });
        } else if (rookieStep == RookieStep.SYSTEM_TALK_20 && data.talkId == "talk20") {
            // next step
            NetworkMgr.websocketMsg.player_rookie_update({
                rookieStep: RookieStep.OPEN_BOX_3,
            });
        } else if (rookieStep == RookieStep.SYSTEM_TALK_21 && data.talkId == "talk21") {
            // next step
            NetworkMgr.websocketMsg.player_rookie_update({
                rookieStep: RookieStep.MAIN_BUILDING_TAP_3,
            });
        } else if (rookieStep == RookieStep.SYSTEM_TALK_22 && data.talkId == "talk22") {
            // next step
            NetworkMgr.websocketMsg.player_rookie_update({
                rookieStep: RookieStep.ENTER_OUTER,
            });
        } else if (rookieStep == RookieStep.SYSTEM_TALK_23 && data.talkId == "talk23") {
            // next step
            NetworkMgr.websocketMsg.player_rookie_update({
                rookieStep: RookieStep.DEFEND_TAP,
            });
        } else if (rookieStep == RookieStep.SYSTEM_TALK_24 && data.talkId == "talk24") {
            // next step
            NetworkMgr.websocketMsg.player_rookie_update({
                rookieStep: RookieStep.FINISH,
            });
        }
    }
    private _onGameCameraPosChange(data: { triggerTask: boolean }) {
        if (!data.triggerTask) {
            return;
        }
        const rookieStep: RookieStep = DataMgr.s.userInfo.data.rookieStep;
        if (rookieStep == RookieStep.TASK_SHOW_TAP_1) {
            const pioneer = DataMgr.s.pioneer.getById("gangster_1");
            if (pioneer == undefined) {
                return;
            }
            GameMainHelper.instance.tiledMapShadowErase(pioneer.stayPos);
            NetworkMgr.websocketMsg.player_rookie_update({
                rookieStep: RookieStep.ENEMY_FIGHT,
            });
        } else if (rookieStep == RookieStep.TASK_SHOW_TAP_2) {
            NetworkMgr.websocketMsg.player_rookie_update({
                rookieStep: RookieStep.NPC_TALK_6,
            });
        } else if (rookieStep == RookieStep.ENTER_INNER || rookieStep == RookieStep.ENTER_INNER_2) {
            const view = find("Main/Canvas/GameContent/Game/OutScene/TiledMap/deco_layer/MAP_building_1");
            if (view == null) {
                return;
            }
            this._maskView.configuration(true, view.worldPosition, view.getComponent(UITransform).contentSize, () => {
                if (rookieStep == RookieStep.ENTER_INNER) {
                    NetworkMgr.websocketMsg.player_rookie_update({
                        rookieStep: RookieStep.MAIN_BUILDING_TAP_1,
                    });
                } else {
                    NetworkMgr.websocketMsg.player_rookie_update({
                        rookieStep: RookieStep.MAIN_BUILDING_TAP_2,
                    });
                }
            });
        } else if (rookieStep == RookieStep.TASK_SHOW_TAP_3) {
            NetworkMgr.websocketMsg.player_rookie_update({
                rookieStep: RookieStep.NPC_TALK_19,
            });
        } else if (rookieStep == RookieStep.RESOURCE_COLLECT) {
            const view = find("Main/Canvas/GameContent/Game/OutScene/TiledMap/deco_layer/MAP_building_10");
            if (view == null) {
                return;
            }
            this._maskView.configuration(true, view.worldPosition, view.getComponent(UITransform).contentSize, () => {
                NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_TAP_MAP_BUILDING, { buildingId: "building_10" });
            });
        } else if (rookieStep == RookieStep.WORMHOLE_ATTACK) {
            const view = find("Main/Canvas/GameContent/Game/OutScene/TiledMap/deco_layer/MAP_building_21");
            if (view == null) {
                return;
            }
            this._maskView.configuration(true, view.worldPosition, view.getComponent(UITransform).contentSize, () => {
                NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_TAP_MAP_BUILDING, { buildingId: "building_21" });
            });
        }
    }

    private async _onRookieStepChange() {
        this._refreshMaskShow();
        const rookieStep = DataMgr.s.userInfo.data.rookieStep;
        if (
            rookieStep == RookieStep.NPC_TALK_1 ||
            rookieStep == RookieStep.NPC_TALK_3 ||
            rookieStep == RookieStep.NPC_TALK_4 ||
            rookieStep == RookieStep.NPC_TALK_5 ||
            rookieStep == RookieStep.NPC_TALK_6 ||
            rookieStep == RookieStep.NPC_TALK_7 ||
            rookieStep == RookieStep.NPC_TALK_19
        ) {
            let npcId: string = "npc_0";
            if (rookieStep == RookieStep.NPC_TALK_19) {
                npcId = "npc_9";
            }
            const view = find("Main/Canvas/GameContent/Game/OutScene/TiledMap/deco_layer/MAP_" + npcId);
            if (view == null) {
                return;
            }
            const pioneer = DataMgr.s.pioneer.getById(npcId);
            if (pioneer == undefined) {
                return;
            }
            // erase shadow
            GameMainHelper.instance.tiledMapShadowErase(pioneer.stayPos);
            // show mask
            this._maskView.configuration(true, view.worldPosition, view.getComponent(UITransform).contentSize, () => {
                NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_TAP_MAP_PIONEER, { pioneerId: npcId });
            });
        } else if (rookieStep == RookieStep.PIOT_TO_HEAT) {
            const view = find("Main/UI_Canvas/UI_ROOT/MainUI/CommonContent/HeatTreasureUI/__ViewContent/Content/HeatProgress/HeatValue");
            if (view == null) {
                return;
            }
            this._maskView.configuration(false, view.worldPosition, view.getComponent(UITransform).contentSize, () => {
                NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_TAP_HEAT_CONVERT);
            });
        } else if (rookieStep == RookieStep.OPEN_BOX_1 || rookieStep == RookieStep.OPEN_BOX_2 || rookieStep == RookieStep.OPEN_BOX_3) {
            let index: number = 0;
            if (rookieStep == RookieStep.OPEN_BOX_1) {
                index = 0;
            } else if (rookieStep == RookieStep.OPEN_BOX_2) {
                index = 1;
            } else if (rookieStep == RookieStep.OPEN_BOX_3) {
                index = 2;
            }
            const view = find("Main/UI_Canvas/UI_ROOT/MainUI/CommonContent/HeatTreasureUI/__ViewContent/Content/ProgressBar/BoxContent/HEAT_TREASURE_" + index);
            if (view == null) {
                return;
            }
            this._maskView.configuration(false, view.worldPosition, view.getComponent(UITransform).contentSize, () => {
                NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_TAP_HEAT_BOX, { tapIndex: index + "" });
            });
        } else if (rookieStep == RookieStep.TASK_SHOW_TAP_1) {
            const view = find("Main/UI_Canvas/UI_ROOT/MainUI/CommonContent/TaskButton");
            if (view == null) {
                return;
            }
            this._maskView.configuration(false, view.worldPosition, view.getComponent(UITransform).contentSize, () => {
                NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_TAP_MAIN_TASK);
            });
        } else if (rookieStep == RookieStep.TASK_SHOW_TAP_2) {
            NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_TAP_MAIN_TASK);
        } else if (rookieStep == RookieStep.TASK_SHOW_TAP_3) {
            if (!GameMainHelper.instance.isGameShowOuter) {
                GameMainHelper.instance.changeInnerAndOuterShow();
            }
            NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_TAP_MAIN_TASK);
        } else if (rookieStep == RookieStep.ENEMY_FIGHT) {
            const view = find("Main/Canvas/GameContent/Game/OutScene/TiledMap/deco_layer/MAP_gangster_1");
            if (view == null) {
                return;
            }
            if (GameMainHelper.instance.gameCameraWorldPosition != view.worldPosition) {
                GameMainHelper.instance.changeGameCameraWorldPosition(view.worldPosition, false, true);
                const pioneer = DataMgr.s.pioneer.getById("gangster_1");
                if (pioneer == undefined) {
                    return;
                }
                GameMainHelper.instance.tiledMapShadowErase(pioneer.stayPos);
            }
            this._maskView.configuration(true, view.worldPosition, view.getComponent(UITransform).contentSize, () => {
                NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_TAP_MAP_PIONEER, { pioneerId: "gangster_1" });
            });
        } else if (rookieStep == RookieStep.ENTER_INNER || rookieStep == RookieStep.ENTER_INNER_2) {
            const view = find("Main/Canvas/GameContent/Game/OutScene/TiledMap/deco_layer/MAP_building_1");
            if (view == null) {
                return;
            }
            const building = DataMgr.s.mapBuilding.getBuildingById("building_1");
            if (building == undefined) {
                return;
            }
            GameMainHelper.instance.changeGameCameraWorldPosition(view.worldPosition, true, true);
            GameMainHelper.instance.tiledMapShadowErase(building.stayMapPositions[3]);
        } else if (
            rookieStep == RookieStep.MAIN_BUILDING_TAP_1 ||
            rookieStep == RookieStep.MAIN_BUILDING_TAP_2 ||
            rookieStep == RookieStep.MAIN_BUILDING_TAP_3
        ) {
            if (GameMainHelper.instance.isGameShowOuter) {
                GameMainHelper.instance.changeInnerAndOuterShow();
            }
            const view = find("Main/Canvas/GameContent/Game/InnerSceneRe/BuildingLattice/StreetView/buildingView_1/MainCity");
            if (view == null) {
                return;
            }
            this._maskView.configuration(false, view.worldPosition, view.getComponent(UITransform).contentSize, () => {
                NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_TAP_MAIN_BUILDING);
            });
        } else if (rookieStep == RookieStep.RESOURCE_COLLECT) {
            const view = find("Main/Canvas/GameContent/Game/OutScene/TiledMap/deco_layer/MAP_building_10");
            if (view == null) {
                return;
            }
            const building = DataMgr.s.mapBuilding.getBuildingById("building_10");
            if (building == undefined) {
                return;
            }
            GameMainHelper.instance.changeGameCameraWorldPosition(view.worldPosition, true, true);
            GameMainHelper.instance.tiledMapShadowErase(building.stayMapPositions[0]);
        } else if (rookieStep == RookieStep.WORMHOLE_ATTACK) {
            const view = find("Main/Canvas/GameContent/Game/OutScene/TiledMap/deco_layer/MAP_building_21");
            if (view == null) {
                return;
            }
            const building = DataMgr.s.mapBuilding.getBuildingById("building_21");
            if (building == undefined) {
                return;
            }
            GameMainHelper.instance.changeGameCameraWorldPosition(view.worldPosition, true, true);
            GameMainHelper.instance.tiledMapShadowErase(building.stayMapPositions[0]);
        } else if (rookieStep == RookieStep.SYSTEM_TALK_20 || rookieStep == RookieStep.SYSTEM_TALK_21 || rookieStep == RookieStep.SYSTEM_TALK_22 || rookieStep == RookieStep.SYSTEM_TALK_23 || rookieStep == RookieStep.SYSTEM_TALK_24) {
            let talkId: string = "";
            if (rookieStep == RookieStep.SYSTEM_TALK_20) {
                talkId = "talk20";
            } else if (rookieStep == RookieStep.SYSTEM_TALK_21) {
                talkId = "talk21";
            } else if (rookieStep == RookieStep.SYSTEM_TALK_22) {
                talkId = "talk22";
            } else if (rookieStep == RookieStep.SYSTEM_TALK_23) {
                talkId = "talk23";
            } else if (rookieStep == RookieStep.SYSTEM_TALK_24) {
                talkId = "talk24";
            }
            const talkConfig = TalkConfig.getById(talkId);
            if (talkConfig == null) {
                return;
            }
            const result = await UIPanelManger.inst.pushPanel(UIName.DialogueUI);
            if (!result.success) {
                return;
            }
            result.node.getComponent(DialogueUI).dialogShow(talkConfig);
        } else if (rookieStep == RookieStep.ENTER_OUTER) {
            if (GameMainHelper.instance.isGameShowOuter) {
                NetworkMgr.websocketMsg.player_rookie_update({
                    rookieStep: RookieStep.WORMHOLE_ATTACK,
                });
            } else {
                const view = find("Main/UI_Canvas/UI_ROOT/MainUI/CommonContent/InnerOutChangeBtnBg");
                if (view == null) {
                    return;
                }
                this._maskView.configuration(false, view.worldPosition, view.getComponent(UITransform).contentSize, () => {
                    GameMainHelper.instance.changeInnerAndOuterShow();
                    NetworkMgr.websocketMsg.player_rookie_update({
                        rookieStep: RookieStep.WORMHOLE_ATTACK,
                    });
                });
            }
        } else if (rookieStep == RookieStep.DEFEND_TAP) {
            const view = find("Main/UI_Canvas/UI_ROOT/MainUI/CommonContent/SetDenderButton");
            if (view == null) {
                return;
            }
            this._maskView.configuration(false, view.worldPosition, view.getComponent(UITransform).contentSize, () => {
                NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_TAP_MAIN_DEFEND);
                NetworkMgr.websocketMsg.player_rookie_update({
                    rookieStep: RookieStep.SYSTEM_TALK_24,
                });
            });
        }
    }
    private _onRookieFightWin() {
        const rookieStep = DataMgr.s.userInfo.data.rookieStep;
        if (rookieStep == RookieStep.ENEMY_FIGHT) {
            NetworkMgr.websocketMsg.player_rookie_update({
                rookieStep: RookieStep.TASK_SHOW_TAP_2,
            });
        }
    }
    private _onRookieCollectResource() {
        // const rookieStep = DataMgr.s.userInfo.data.rookieStep;
        // if (rookieStep == RookieStep.RESOURCE_COLLECT) {
        //     NetworkMgr.websocketMsg.player_rookie_update({
        //         rookieStep: RookieStep.SYSTEM_TALK_8,
        //     });
        // }
    }
    private _onRookieSetWormholeAttack() {
        const rookieStep = DataMgr.s.userInfo.data.rookieStep;
        if (rookieStep == RookieStep.WORMHOLE_ATTACK) {
            NetworkMgr.websocketMsg.player_rookie_update({
                rookieStep: RookieStep.SYSTEM_TALK_23,
            });
        }
    }
    private _onRookieBuildingUpgradeClose() {
        const rookieStep = DataMgr.s.userInfo.data.rookieStep;
        if (rookieStep == RookieStep.MAIN_BUILDING_TAP_1) {
            const view = find("Main/UI_Canvas/UI_ROOT/MainUI/CommonContent/InnerOutChangeBtnBg");
            if (view == null) {
                return;
            }
            this._maskView.configuration(false, view.worldPosition, view.getComponent(UITransform).contentSize, () => {
                NetworkMgr.websocketMsg.player_rookie_update({
                    rookieStep: RookieStep.TASK_SHOW_TAP_3,
                });
            });
        }
    }

    private _onRooieNeedMaskShow(data: { tag: string; view: Node; tapIndex: string }) {
        if (data.view == null) {
            return;
        }
        const { tag, view, tapIndex } = data;
        let isFromGameView: boolean = false;
        if (tag == "mapAction") {
            isFromGameView = true;
        }
        this._maskView.configuration(isFromGameView, view.worldPosition, view.getComponent(UITransform).contentSize, () => {
            if (tag == "dialogue") {
                NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_TAP_DIALOGUE, { tapIndex: tapIndex });
            } else if (tag == "mapAction") {
                NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_TAP_MAP_ACTION, { tapIndex: tapIndex });
            } else if (tag == "mapActionConfrim") {
                NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_TAP_MAP_ACTION_CONFRIM, { tapIndex: tapIndex });
            } else if (tag == "task") {
                NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_TAP_TASK_ITEM, { tapIndex: tapIndex });
            } else if (tag == "buildingUpgrade") {
                NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_TAP_BUILDING_UPGRADE, { tapIndex: tapIndex });
            } else if (tag == "defend") {
                NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_TAP_SET_DENFENDER, { tapIndex: tapIndex });
            }
        });
    }

    //-------------------------------------- socket notify
    private player_worldbox_beginner_open_res = (e: any) => {
        const p: s2c_user.Iplayer_worldbox_beginner_open_res = e.data;
        if (p.res !== 1) {
            return;
        }
        const rookieStep = DataMgr.s.userInfo.data.rookieStep;
        if (rookieStep == RookieStep.OPEN_BOX_1 && p.boxId == "9001") {
            NetworkMgr.websocketMsg.player_rookie_update({
                rookieStep: RookieStep.NPC_TALK_5,
            });
        } else if (rookieStep == RookieStep.OPEN_BOX_2 && p.boxId == "9002") {
            NetworkMgr.websocketMsg.player_rookie_update({
                rookieStep: RookieStep.NPC_TALK_7,
            });
        } else if (rookieStep == RookieStep.OPEN_BOX_3 && p.boxId == "9003") {
            NetworkMgr.websocketMsg.player_rookie_update({
                rookieStep: RookieStep.SYSTEM_TALK_21,
            });
        }
    };
}
