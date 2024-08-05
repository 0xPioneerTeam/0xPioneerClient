import { _decorator, Button, Component, instantiate, Label, Layers, Layout, log, Node, Sprite, UITransform, v2, v3, Vec2, Vec3 } from "cc";
import { MapBuildingObject, MapBuildingWormholeObject } from "../../../Const/MapBuilding";
import { MapNpcPioneerData, MapNpcPioneerObject, MapPioneerObject, MapPioneerType } from "../../../Const/PioneerDefine";
import { MapBuildingType } from "../../../Const/BuildingDefine";
import { GameMgr, ItemMgr, LanMgr } from "../../../Utils/Global";
import ItemConfig from "../../../Config/ItemConfig";
import PioneerConfig from "../../../Config/PioneerConfig";
import { GAME_JUMP_SWITCH_IS_OPEN, MapInteractType } from "../../../Const/ConstDefine";
import GameMusicPlayMgr from "../../../Manger/GameMusicPlayMgr";
import { DataMgr } from "../../../Data/DataMgr";
import NotificationMgr from "../../../Basic/NotificationMgr";
import { NotificationName } from "../../../Const/Notification";
import { RookieStep } from "../../../Const/RookieDefine";
import CommonTools from "../../../Tool/CommonTools";
const { ccclass, property } = _decorator;

@ccclass("ResOprView")
export class ResOprView extends Component {
    private _targetName: string = "";

    private _actionItem: Node = null;
    private _actionItemContent: Node = null;

    public async show(
        interactBuilding: MapBuildingObject,
        interactPioneer: MapPioneerObject,
        targetPos: Vec2,
        targetWorldPos: Vec3,
        step: number,
        confirmCallback: (actionType: MapInteractType, targetName: string, costEnergy: number) => void
    ) {
        this.node.active = true;
        this.node.worldPosition = targetWorldPos;

        const infoView = this.node.getChildByPath("InfoView");
        const actionView = this.node.getChildByPath("ActionView");
        const difficultView = this.node.getChildByPath("DifficultView");

        difficultView.active = false;

        const buildingCofig = interactBuilding != null ? GameMgr.getMapBuildingConfigByExistSlotInfo(interactBuilding.uniqueId) : null;
        //----------------------------------- info
        let name: string = "";
        if (interactBuilding != null) {
            if (interactBuilding.type == MapBuildingType.resource) {
                name = LanMgr.getLanById("320003");
            } else if (interactBuilding.type == MapBuildingType.event) {
                name = LanMgr.getLanById("320004");
            } else if (interactBuilding.type == MapBuildingType.wormhole) {
                name = LanMgr.getLanById("320005");
            }
        } else if (interactPioneer != null) {
            if (interactPioneer.type == MapPioneerType.npc) {
                name = LanMgr.getLanById("330001");
            } else if (interactPioneer.type == MapPioneerType.gangster) {
                name = LanMgr.getLanById("330002");
            } else if (interactPioneer.type == MapPioneerType.hred) {
                name = LanMgr.getLanById("330003");
            }
        } else {
            name = LanMgr.getLanById("320001");
        }

        this._targetName = name;

        //name
        infoView.getChildByPath("Top/Name").getComponent(Label).string = name;
        // location
        infoView.getChildByPath("Top/Location").getComponent(Label).string = "(" + targetPos.x + "," + targetPos.y + ")";

        const resourceBuildingInfo = infoView.getChildByPath("ResourceInfo");
        const otherBuildingInfo = infoView.getChildByPath("OtherBuildingInfo");
        const pioneerInfo = infoView.getChildByPath("PioneerInfo");

        resourceBuildingInfo.active = false;
        otherBuildingInfo.active = false;
        pioneerInfo.active = false;

        if (interactBuilding != null) {
            if (interactBuilding.type == MapBuildingType.resource) {
                resourceBuildingInfo.active = true;

                const resourceData = GameMgr.getResourceBuildingRewardAndQuotaMax(interactBuilding);
                if (resourceData != null) {
                    const itemConf = ItemConfig.getById(resourceData.reward.itemConfigId);
                    resourceBuildingInfo.getChildByPath("Reward/Item/Icon").getComponent(Sprite).spriteFrame = await ItemMgr.getItemIcon(itemConf.icon);
                    resourceBuildingInfo.getChildByPath("Reward/Item/Num").getComponent(Label).string = resourceData.reward.count + "";

                    resourceBuildingInfo.getChildByPath("Quota/Value").getComponent(Label).string = interactBuilding.quota + "/" + resourceData.quotaMax;
                }
            } else {
                otherBuildingInfo.active = true;
                if (buildingCofig != null) {
                    otherBuildingInfo.getChildByPath("Title").getComponent(Label).string = LanMgr.getLanById(buildingCofig.des);
                }
            }

            if (interactBuilding.type == MapBuildingType.event) {
                difficultView.active = interactBuilding.level > DataMgr.s.artifact.getArtifactLevel();
            }
        } else if (interactPioneer != null) {
            pioneerInfo.active = true;

            const pioneerConfig = GameMgr.getMapPioneerConfigByExistSlotInfo(interactPioneer.uniqueId);
            if (pioneerConfig != null) {
                pioneerInfo.getChildByPath("Title").getComponent(Label).string = LanMgr.getLanById(pioneerConfig.des);
            }

            const monsterView = pioneerInfo.getChildByPath("MonterProperty");
            monsterView.active = false;
            if (interactPioneer.type == MapPioneerType.hred || interactPioneer.type == MapPioneerType.gangster) {
                monsterView.active = true;
                monsterView.getChildByPath("HP/Value").getComponent(Label).string = interactPioneer.hp + "/" + interactPioneer.hpMax;
                monsterView.getChildByPath("Attack/Value").getComponent(Label).string = interactPioneer.attack + "";
                monsterView.getChildByPath("Defense/Value").getComponent(Label).string = interactPioneer.defend + "";
                monsterView.getChildByPath("Speed/Value").getComponent(Label).string = interactPioneer.speed + "";
            }

            if (interactPioneer.type == MapPioneerType.hred) {
                difficultView.active = interactPioneer.level > DataMgr.s.artifact.getArtifactLevel();
            }
        } else {
            pioneerInfo.active = true;

            pioneerInfo.getChildByPath("Title").getComponent(Label).string = LanMgr.getLanById("320002");

            const monsterView = pioneerInfo.getChildByPath("MonterProperty");
            monsterView.active = false;

            difficultView.active = false;
        }

        //----------------------------------- action
        const actionTypes: number[] = [];
        if (interactBuilding != null) {
            if (interactBuilding.type == MapBuildingType.explore) {
                actionTypes.push(MapInteractType.Explore);
                actionTypes.push(MapInteractType.Move);
            } else if (interactBuilding.type == MapBuildingType.resource) {
                actionTypes.push(MapInteractType.Collect);
                actionTypes.push(MapInteractType.Move);
            } else if (interactBuilding.type == MapBuildingType.event) {
                actionTypes.push(MapInteractType.Event);
                actionTypes.push(MapInteractType.Move);
            } else if (interactBuilding.type == MapBuildingType.wormhole) {
                const wormholeObj = interactBuilding as MapBuildingWormholeObject;
                let playerIsInWormhole: boolean = false;
                // for (let [key, value] of wormholeObj.attacker) {
                //     if (value == actionPioneerId) {
                //         playerIsInWormhole = true;
                //         break;
                //     }
                // }

                actionTypes.push(MapInteractType.Wormhole);
                if (playerIsInWormhole) {
                    actionTypes.push(MapInteractType.CampOut);
                } else {
                    actionTypes.push(MapInteractType.Camp);
                }
                actionTypes.push(MapInteractType.Move);
            }
        } else if (interactPioneer != null) {
            if (interactPioneer.type == MapPioneerType.npc) {
                const npcObj = interactPioneer as MapNpcPioneerObject;
                if (npcObj.talkId != null) {
                    actionTypes.push(MapInteractType.Talk);
                }
                actionTypes.push(MapInteractType.Move);
            } else if (interactPioneer.type == MapPioneerType.gangster) {
                actionTypes.push(MapInteractType.Attack);
            } else if (interactPioneer.type == MapPioneerType.hred) {
                actionTypes.push(MapInteractType.Attack);
            }
        } else {
            actionTypes.push(MapInteractType.Move);
        }
        const buildingCost = buildingCofig != null ? buildingCofig.cost : 0;
        this._actionItemContent.destroyAllChildren();
        for (const type of actionTypes) {
            const actionItem = instantiate(this._actionItem);
            actionItem.name = "ACTION_" + type;
            actionItem.getChildByPath("Icon/Wormhole").active = type == MapInteractType.Wormhole;
            actionItem.getChildByPath("Icon/Search").active = type == MapInteractType.Explore || type == MapInteractType.Event || type == MapInteractType.Talk;
            actionItem.getChildByPath("Icon/Collect").active = type == MapInteractType.Collect;
            actionItem.getChildByPath("Icon/Attack").active = type == MapInteractType.Attack;
            actionItem.getChildByPath("Icon/Camp").active = type == MapInteractType.Camp;
            actionItem.getChildByPath("Icon/CampOut").active = type == MapInteractType.CampOut;
            actionItem.getChildByPath("Icon/Move").active = type == MapInteractType.Move;

            let title: string = "";
            if (type == MapInteractType.Wormhole) {
                //useLanMgr
                // title = LanMgr.getLanById("107549");
                title = "Engage!";
            } else if (type == MapInteractType.Move) {
                //useLanMgr
                // title = LanMgr.getLanById("107549");
                title = "Move";
            } else if (type == MapInteractType.Attack) {
                //useLanMgr
                // title = LanMgr.getLanById("107549");
                title = "Fight";
            } else if (type == MapInteractType.Explore) {
                //useLanMgr
                // title = LanMgr.getLanById("107549");
                title = "Explore";
            } else if (type == MapInteractType.Collect) {
                //useLanMgr
                // title = LanMgr.getLanById("107549");
                title = "Collect";
            } else if (type == MapInteractType.Event) {
                //useLanMgr
                // title = LanMgr.getLanById("107549");
                title = "Event";
            } else if (type == MapInteractType.Camp) {
                //useLanMgr
                // title = LanMgr.getLanById("107549");
                title = "Enter";
            } else if (type == MapInteractType.CampOut) {
                //useLanMgr
                // title = LanMgr.getLanById("107549");
                title = "Evacuate";
            } else if (type == MapInteractType.Talk) {
                //useLanMgr
                // title = LanMgr.getLanById("107549");
                title = "Talk";
            }
            const costEnergy = GameMgr.getMapActionCostEnergy(step, interactBuilding != null ? interactBuilding.uniqueId : null);
            actionItem.getChildByPath("Title").getComponent(Label).string = title;
            actionItem.getChildByPath("CostView/CostLabel").getComponent(Label).string = "-" + costEnergy;
            actionItem.getComponent(Button).clickEvents[0].customEventData = type + "|" + costEnergy;
            this._actionItemContent.addChild(actionItem);
        }
        this._confirmCallback = confirmCallback;

        CommonTools.changeLayerIteratively(this.node, DataMgr.s.userInfo.data.rookieStep == RookieStep.FINISH ? Layers.Enum.DEFAULT : this.node.layer);

        this.scheduleOnce(() => {
            let view: Node = null;
            let viewIndex: number = -1;
            const rookieStep: RookieStep = DataMgr.s.userInfo.data.rookieStep;
            if (
                rookieStep == RookieStep.NPC_TALK_1 ||
                rookieStep == RookieStep.NPC_TALK_3 ||
                rookieStep == RookieStep.NPC_TALK_4 ||
                rookieStep == RookieStep.NPC_TALK_5 ||
                rookieStep == RookieStep.NPC_TALK_6 ||
                rookieStep == RookieStep.NPC_TALK_7 ||
                rookieStep == RookieStep.NPC_TALK_19
            ) {
                viewIndex = actionTypes.indexOf(MapInteractType.Talk);
            } else if (rookieStep == RookieStep.ENEMY_FIGHT) {
                viewIndex = actionTypes.indexOf(MapInteractType.Attack);
            } else if (rookieStep == RookieStep.RESOURCE_COLLECT) {
                viewIndex = actionTypes.indexOf(MapInteractType.Collect);
            } else if (rookieStep == RookieStep.WORMHOLE_ATTACK) {
                viewIndex = actionTypes.indexOf(MapInteractType.Camp);
            } else if (rookieStep == RookieStep.OUTER_WORMHOLE) {
                viewIndex = actionTypes.indexOf(MapInteractType.CampOut);
            }
            if (viewIndex != -1) {
                view = this._actionItemContent.getChildByPath("ACTION_" + actionTypes[viewIndex]);
            }
            if (view != null) {
                NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_NEED_MASK_SHOW, {
                    tag: "mapAction",
                    view: view,
                    tapIndex: view.getComponent(Button).clickEvents[0].customEventData,
                });
            }
        });
    }
    public hide() {
        this.node.active = false;
    }
    public get isShow() {
        return this.node.active;
    }
    private _confirmCallback: (actionType: MapInteractType, targetName: string, costEnergy: number) => void = null;
    protected onLoad(): void {
        this._actionItemContent = this.node.getChildByPath("ActionView/Action");
        this._actionItem = this._actionItemContent.getChildByPath("Item");
        this._actionItem.removeFromParent();

        NotificationMgr.addListener(NotificationName.ROOKIE_GUIDE_TAP_MAP_ACTION, this._oRookieTapMapAction, this);
    }
    start() {}

    update(deltaTime: number) {}

    protected onDestroy(): void {
        NotificationMgr.removeListener(NotificationName.ROOKIE_GUIDE_TAP_MAP_ACTION, this._oRookieTapMapAction, this);
    }

    private onTapAction(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const data = customEventData.split("|");
        const actionType = parseInt(data[0]);
        const costEnergy = parseInt(data[1]);
        if (this._confirmCallback != null) {
            this._confirmCallback(actionType, this._targetName, costEnergy);
        }
        this.hide();
    }
    private onTapDifficult() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._confirmCallback != null) {
            this._confirmCallback(null, null, null);
        }
        this.hide();

        if (!GAME_JUMP_SWITCH_IS_OPEN) {
            return;
        }
        NotificationMgr.triggerEvent(NotificationName.GAME_JUMP_INNER_AND_SHOW_RELIC_TOWER);
    }

    //----------------------------- notification
    private _oRookieTapMapAction(data: { tapIndex: string }) {
        if (data == null || data.tapIndex == null) {
            return;
        }
        this.onTapAction(null, data.tapIndex);
    }
}
