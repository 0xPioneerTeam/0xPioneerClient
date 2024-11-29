import { _decorator, Button, Component, dynamicAtlasManager, instantiate, Label, Layers, Layout, log, Node, Sprite, UITransform, v2, v3, Vec2, Vec3 } from "cc";
import { MapBuildingObject, MapBuildingWormholeObject } from "../../../Const/MapBuilding";
import { MapPioneerObject, MapPioneerType } from "../../../Const/PioneerDefine";
import { InnerBuildingType, MapBuildingType } from "../../../Const/BuildingDefine";
import { GameMgr, ItemMgr, LanMgr } from "../../../Utils/Global";
import ItemConfig from "../../../Config/ItemConfig";
import PioneerConfig from "../../../Config/PioneerConfig";
import { GAME_JUMP_SWITCH_IS_OPEN, MapInteractType, ResourceCorrespondingItem } from "../../../Const/ConstDefine";
import GameMusicPlayMgr from "../../../Manger/GameMusicPlayMgr";
import { DataMgr } from "../../../Data/DataMgr";
import NotificationMgr from "../../../Basic/NotificationMgr";
import { NotificationName } from "../../../Const/Notification";
import { RookieStep } from "../../../Const/RookieDefine";
import CommonTools from "../../../Tool/CommonTools";
import { TilePos } from "../../TiledMap/TileTool";
import { NetworkMgr } from "../../../Net/NetworkMgr";
import { s2c_user } from "../../../Net/msg/WebsocketMsg";
const { ccclass, property } = _decorator;

@ccclass("ResOprView")
export class ResOprView extends Component {
    private _actionItem: Node = null;
    private _actionItemContent: Node = null;

    private _interactBuilding: MapBuildingObject;
    private _interactPioneer: MapPioneerObject;
    private _targetPos: Vec2;
    private _lastDisableInteractType: MapInteractType = null;

    public async show(
        isShadow: boolean,
        interactBuilding: MapBuildingObject,
        interactPioneer: MapPioneerObject,
        targetPos: Vec2,
        targetWorldPos: Vec3,
        confirmCallback: (pioneerUnqueId: string, actionType: MapInteractType, movePath: TilePos[]) => void
    ) {
        this.node.active = true;
        this.node.worldPosition = targetWorldPos;
        this._interactBuilding = interactBuilding;
        this._interactPioneer = interactPioneer;
        this._targetPos = targetPos;

        const infoView = this.node.getChildByPath("InfoView");
        const actionView = this.node.getChildByPath("ActionView");
        const difficultView = this.node.getChildByPath("DifficultView");

        difficultView.active = false;

        const buildingCofig = interactBuilding != null ? GameMgr.getMapBuildingConfigByExistSlotInfo(interactBuilding.uniqueId) : null;
        //----------------------------------- info
        let name: string = "";
        if (isShadow) {
            // use lan
            name = "shadow";
        } else {
            if (interactBuilding != null) {
                if (interactBuilding.type == MapBuildingType.city) {
                    name = LanMgr.getLanById("320006");
                } else if (interactBuilding.type == MapBuildingType.resource) {
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
        }

        //name
        infoView.getChildByPath("Top/Name").getComponent(Label).string = name;
        // location
        infoView.getChildByPath("Top/Location").getComponent(Label).string = "(" + targetPos.x + "," + targetPos.y + ")";

        const mainCityBuildingInfo = infoView.getChildByPath("MainCityInfo");
        const resourceBuildingInfo = infoView.getChildByPath("ResourceInfo");
        const otherBuildingInfo = infoView.getChildByPath("OtherBuildingInfo");
        const pioneerInfo = infoView.getChildByPath("PioneerInfo");

        mainCityBuildingInfo.active = false;
        resourceBuildingInfo.active = false;
        otherBuildingInfo.active = false;
        pioneerInfo.active = false;

        let mainCityIsSelf: boolean = false;
        let mainCityIsUnLock: boolean = true;
        if (isShadow) {
            pioneerInfo.active = true;

            // use lan
            pioneerInfo.getChildByPath("Title").getComponent(Label).string = "Shadow";

            const monsterView = pioneerInfo.getChildByPath("MonterProperty");
            monsterView.active = false;

            difficultView.active = false;
        } else {
            if (interactBuilding != null) {
                if (interactBuilding.type == MapBuildingType.city) {
                    mainCityBuildingInfo.active = true;

                    const uniqueIdSplit = interactBuilding.uniqueId.split("|");
                    if (uniqueIdSplit.length == 2) {
                        mainCityIsSelf = uniqueIdSplit[0] == DataMgr.s.mapBuilding.getSelfMainCitySlotId();
                        const info = GameMgr.getMapSlotData(uniqueIdSplit[0]);
                        if (info != undefined) {
                            let cityName: string = "";
                            let battlePower: number = 0;
                            // use this to show
                            let honor: number = 0;
                            if (uniqueIdSplit[0] == DataMgr.s.mapBuilding.getSelfMainCitySlotId()) {
                                cityName = DataMgr.s.userInfo.data.name;
                                battlePower = DataMgr.s.userInfo.data.battlePower;
                                honor = DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Honor);
                            } else {
                                cityName = info.pname;
                                battlePower = info.battlePower != null ? info.battlePower : 0;
                                honor = info.honor;
                            }
                            console.log("exce honor: " + honor);
                            infoView.getChildByPath("Top/Name").getComponent(Label).string = cityName;
                            mainCityBuildingInfo.getChildByPath("Leader/Value").getComponent(Label).string = cityName;
                            mainCityBuildingInfo.getChildByPath("Civilization/Value").getComponent(Label).string = info.level.toString();

                            mainCityIsUnLock =
                                info.playerId == DataMgr.s.userInfo.data.id || DataMgr.s.userInfo.data.explorePlayerids.indexOf(parseInt(info.playerId)) != -1;
                            const lockView = mainCityBuildingInfo.getChildByPath("Encrypted/Content/Locked");
                            const fightValueView = mainCityBuildingInfo.getChildByPath("Encrypted/Content/Title");
                            if (!mainCityIsUnLock) {
                                lockView.active = true;
                                fightValueView.active = false;
                            } else {
                                lockView.active = false;
                                fightValueView.active = true;
                                fightValueView.getChildByPath("Value").getComponent(Label).string = battlePower.toString();
                                // wait code: use honor to show
                                // ...
                                fightValueView.getChildByPath("Honor/HonorValue").getComponent(Label).string = info.honer != null ? info.honer.toString() : "0";
                            }
                        }
                    }
                } else if (interactBuilding.type == MapBuildingType.resource) {
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
        }

        //----------------------------------- action
        const actionTypes: number[] = [];
        if (isShadow) {
            if (DataMgr.s.innerBuilding.getInnerBuildingLevel(InnerBuildingType.InformationStation) > 0) {
                actionTypes.push(MapInteractType.Detect);
            }
        } else {
            if (interactBuilding != null) {
                if (interactBuilding.type == MapBuildingType.city) {
                    if (mainCityIsSelf) {
                        actionTypes.push(MapInteractType.EnterInner);
                        actionTypes.push(MapInteractType.MainBack);
                    } else {
                        if (DataMgr.s.innerBuilding.getInnerBuildingLevel(InnerBuildingType.InformationStation) > 0 && !mainCityIsUnLock) {
                            actionTypes.push(MapInteractType.Detect);
                        }
                        actionTypes.push(MapInteractType.SiegeCity);
                    }
                } else if (interactBuilding.type == MapBuildingType.explore) {
                    actionTypes.push(MapInteractType.Explore);
                    actionTypes.push(MapInteractType.Move);
                } else if (interactBuilding.type == MapBuildingType.resource) {
                    actionTypes.push(MapInteractType.Collect);
                    actionTypes.push(MapInteractType.Move);
                } else if (interactBuilding.type == MapBuildingType.event) {
                    actionTypes.push(MapInteractType.Event);
                    actionTypes.push(MapInteractType.Move);
                } else if (interactBuilding.type == MapBuildingType.wormhole) {
                    let isSelf: boolean = DataMgr.s.mapBuilding.checkBuildingIsInSelfSlot(interactBuilding.uniqueId);
                    if (isSelf) {
                        actionTypes.push(MapInteractType.WmMatch);
                        actionTypes.push(MapInteractType.WmTeleport);
                    } else {
                        let isEmpty: boolean = false;
                        const uniqueIdSplit = interactBuilding.uniqueId.split("|");
                        if (uniqueIdSplit.length == 2) {
                            const info = GameMgr.getMapSlotData(uniqueIdSplit[0]);
                            if (info != null && info.playerId == "0") {
                                isEmpty = true;
                            }
                        }
                        if (isEmpty) {
                        } else {
                            if (DataMgr.s.userInfo.data.wormholeTags.find((item) => item.tpBuildingId == interactBuilding.uniqueId)) {
                                actionTypes.push(MapInteractType.WmRecall);
                            } else {
                                actionTypes.push(MapInteractType.WmMark);
                            }
                        }
                    }
                    actionTypes.push(MapInteractType.Move);
                }
            } else if (interactPioneer != null) {
                if (interactPioneer.type == MapPioneerType.npc) {
                    actionTypes.push(MapInteractType.Talk);
                    actionTypes.push(MapInteractType.Move);
                } else if (interactPioneer.type == MapPioneerType.gangster) {
                    actionTypes.push(MapInteractType.Attack);
                } else if (interactPioneer.type == MapPioneerType.hred) {
                    actionTypes.push(MapInteractType.Attack);
                }
            } else {
                actionTypes.push(MapInteractType.Move);
                if (DataMgr.s.innerBuilding.getInnerBuildingLevel(InnerBuildingType.InformationStation) > 0) {
                    actionTypes.push(MapInteractType.Detect);
                }
            }
        }

        let moveData: { status: number; path: TilePos[] } = null;
        const interactUnqueId = DataMgr.s.pioneer.getInteractSelectUnqueId();
        if (interactUnqueId != null) {
            let sparePositions: Vec2[] = [];
            let targetStayPostions: Vec2[] = [];
            if (interactBuilding != null) {
                sparePositions = interactBuilding.stayMapPositions.slice();
                targetStayPostions = interactBuilding.stayMapPositions.slice();
                if (interactBuilding.type == MapBuildingType.city && sparePositions.length == 7) {
                    // center pos cannot use to cal move path
                    sparePositions.splice(3, 1);
                }
            } else if (interactPioneer != null) {
                if (interactPioneer.type == MapPioneerType.player || interactPioneer.type == MapPioneerType.npc) {
                    targetStayPostions = [interactPioneer.stayPos];
                }
            }
            const tempPioneer = DataMgr.s.pioneer.getById(interactUnqueId);
            if (tempPioneer != null) {
                moveData = GameMgr.findTargetLeastMovePath(tempPioneer.stayPos, targetPos, sparePositions, targetStayPostions);
            }
        }
        this._actionItemContent.destroyAllChildren();
        for (const type of actionTypes) {
            const actionItem = instantiate(this._actionItem);
            actionItem.name = "ACTION_" + type;
            actionItem.getChildByPath("Icon/Wormhole").active =
                type == MapInteractType.WmMark || type == MapInteractType.WmMatch || type == MapInteractType.WmRecall || type == MapInteractType.WmTeleport;
            actionItem.getChildByPath("Icon/Search").active = type == MapInteractType.Explore || type == MapInteractType.Event || type == MapInteractType.Talk;
            actionItem.getChildByPath("Icon/Collect").active = type == MapInteractType.Collect;
            actionItem.getChildByPath("Icon/Attack").active = type == MapInteractType.Attack;
            actionItem.getChildByPath("Icon/Camp").active = type == MapInteractType.Camp;
            actionItem.getChildByPath("Icon/CampOut").active = type == MapInteractType.CampOut;
            actionItem.getChildByPath("Icon/Move").active = type == MapInteractType.Move;
            actionItem.getChildByPath("Icon/Move").active = type == MapInteractType.Move;
            actionItem.getChildByPath("Icon/Detect").active = type == MapInteractType.Detect;
            actionItem.getChildByPath("Icon/SiegeCity").active = type == MapInteractType.SiegeCity;
            actionItem.getChildByPath("Icon/EnterInner").active = type == MapInteractType.EnterInner;
            actionItem.getChildByPath("Icon/MainBack").active = type == MapInteractType.MainBack;

            let title: string = "";
            if (type == MapInteractType.WmMark) {
                //useLanMgr
                // title = LanMgr.getLanById("107549");
                title = "Mark";
            } else if (type == MapInteractType.WmMatch) {
                //useLanMgr
                // title = LanMgr.getLanById("107549");
                title = "Match";
            } else if (type == MapInteractType.WmTeleport) {
                //useLanMgr
                // title = LanMgr.getLanById("107549");
                title = "Teleport";
            } else if (type == MapInteractType.WmRecall) {
                //useLanMgr
                // title = LanMgr.getLanById("107549");
                title = "Recall";
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
            } else if (type == MapInteractType.Detect) {
                //useLanMgr
                // title = LanMgr.getLanById("107549");
                title = "Detect";
            } else if (type == MapInteractType.SiegeCity) {
                //useLanMgr
                // title = LanMgr.getLanById("107549");
                title = "SiegeCity";
            } else if (type == MapInteractType.EnterInner) {
                //useLanMgr
                // title = LanMgr.getLanById("107549");
                title = "Enter";
            } else if (type == MapInteractType.MainBack) {
                //useLanMgr
                // title = LanMgr.getLanById("107549");
                title = "Back";
            }
            let costEnergy: number = 0;
            const costView = actionItem.getChildByPath("CostView");
            if (interactUnqueId != null) {
                costView.active = true;
                if (moveData.status === 1) {
                    costEnergy =
                        type == MapInteractType.MainBack
                            ? 0
                            : GameMgr.getMapActionCostEnergy(moveData.path.length, interactBuilding != null ? interactBuilding.uniqueId : null);
                    actionItem.getChildByPath("CostView/CostLabel").getComponent(Label).string = "-" + costEnergy;
                } else {
                    actionItem.getChildByPath("CostView/CostLabel").getComponent(Label).string = ">99";
                }
            } else {
                costView.active = false;
            }
            actionItem.getChildByPath("Title").getComponent(Label).string = title;
            actionItem.getComponent(Button).clickEvents[0].customEventData = type.toString();
            this._actionItemContent.addChild(actionItem);
        }
        this._confirmCallback = confirmCallback;

        CommonTools.changeLayerIteratively(this.node, DataMgr.s.userInfo.data.rookieStep == RookieStep.FINISH ? Layers.Enum.DEFAULT : this.node.layer);

        // this.scheduleOnce(() => {
        //     let view: Node = null;
        //     let viewIndex: number = -1;
        //     const rookieStep: RookieStep = DataMgr.s.userInfo.data.rookieStep;
        //     if (
        //         rookieStep == RookieStep.NPC_TALK_1
        //     ) {
        //         viewIndex = actionTypes.indexOf(MapInteractType.Talk);
        //     }
        //     if (viewIndex != -1) {
        //         view = this._actionItemContent.getChildByPath("ACTION_" + actionTypes[viewIndex]);
        //     }
        //     if (view != null) {
        //         NotificationMgr.triggerEvent(NotificationName.ROOKIE_GUIDE_NEED_MASK_SHOW, {
        //             tag: "mapAction",
        //             view: view,
        //             tapIndex: view.getComponent(Button).clickEvents[0].customEventData,
        //         });
        //     }
        // });
    }
    public hide() {
        this.node.active = false;
    }
    public get isShow() {
        return this.node.active;
    }
    public get interactBuilding() {
        return this._interactBuilding;
    }
    public get interactPioneer() {
        return this._interactPioneer;
    }

    private _confirmCallback: (pioneerUnqueId: string, actionType: MapInteractType, movePath: TilePos[]) => void = null;
    protected onLoad(): void {
        this._actionItemContent = this.node.getChildByPath("ActionView/Action");
        this._actionItem = this._actionItemContent.getChildByPath("Item");
        this._actionItem.removeFromParent();
    }

    start() {
        NetworkMgr.websocket.on("player_troop_to_hp_res", this._onPlayerTroopToHpRes);
        NetworkMgr.websocket.on("player_psyc_to_energy_res", this._onPlayerPsycToEnergyRes);
    }

    update(deltaTime: number) {}

    protected onDestroy(): void {
        NetworkMgr.websocket.off("player_troop_to_hp_res", this._onPlayerTroopToHpRes);
        NetworkMgr.websocket.off("player_psyc_to_energy_res", this._onPlayerPsycToEnergyRes);
    }

    private _checkReplenishDispatchCondtion(uniqueId: string) {
        if (this._lastDisableInteractType == null) {
            return;
        }
        const interactUniqueId = DataMgr.s.pioneer.getInteractSelectUnqueId();
        if (interactUniqueId != uniqueId) {
            return;
        }
        this.onTapAction(null, this._lastDisableInteractType.toString());
    }

    //--------------------------- action
    private async onTapAction(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        this._lastDisableInteractType = null;
        const interactType = parseInt(customEventData);
        let player = null;
        const interactUniqueId = DataMgr.s.pioneer.getInteractSelectUnqueId();
        if (interactUniqueId != null) {
            player = DataMgr.s.pioneer.getById(interactUniqueId);
        }
        if (player == null) {
            this.hide();
            if (this._confirmCallback != null) {
                this._confirmCallback(null, interactType, []);
            }
            return;
        }
        const result = await GameMgr.checkMapCanInteractAndCalulcateMovePath(
            player,
            interactType,
            this._interactBuilding,
            this._interactPioneer,
            this._targetPos
        );
        if (!result.enable) {
            this._lastDisableInteractType = interactType;
            return;
        }
        this.hide();
        if (this._confirmCallback != null) {
            this._confirmCallback(player.uniqueId, interactType, result.movePath);
        }
    }
    private onTapDifficult() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._confirmCallback != null) {
            this._confirmCallback(null, null, []);
        }
        this.hide();

        if (!GAME_JUMP_SWITCH_IS_OPEN) {
            return;
        }
        NotificationMgr.triggerEvent(NotificationName.GAME_JUMP_INNER_AND_SHOW_RELIC_TOWER);
    }

    //----------------------------- notification
    private _onPlayerTroopToHpRes = (e: any) => {
        const p: s2c_user.Iplayer_troop_to_hp_res = e.data;
        if (p.res !== 1) {
            return;
        }
        this._checkReplenishDispatchCondtion(p.pioneerId);
    };
    private _onPlayerPsycToEnergyRes = (e: any) => {
        const p: s2c_user.Iplayer_psyc_to_energy_res = e.data;
        if (p.res !== 1) {
            return;
        }
        this._checkReplenishDispatchCondtion(p.pioneerId);
    };
}
