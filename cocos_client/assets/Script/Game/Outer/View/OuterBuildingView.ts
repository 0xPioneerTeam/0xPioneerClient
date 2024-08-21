import { _decorator, Animation, instantiate, inverseLerp, Label, Layout, Node, ParticleSystem2D, Prefab, UITransform, v3 } from "cc";
import { GameMgr, LanMgr, ResourcesMgr } from "../../../Utils/Global";
import { MapBuildingType, InnerBuildingType, UserInnerBuildInfo } from "../../../Const/BuildingDefine";
import ViewController from "../../../BasicView/ViewController";
import NotificationMgr from "../../../Basic/NotificationMgr";
import InnerBuildingLvlUpConfig from "../../../Config/InnerBuildingLvlUpConfig";
import InnerBuildingConfig from "../../../Config/InnerBuildingConfig";
import { NotificationName } from "../../../Const/Notification";
import { MapMemberFactionType } from "../../../Const/ConstDefine";
import { MapBuildingMainCityObject, MapBuildingObject, MapBuildingTavernObject, MapBuildingWormholeObject } from "../../../Const/MapBuilding";
import { DataMgr } from "../../../Data/DataMgr";
import CommonTools from "../../../Tool/CommonTools";
import ArtifactConfig from "../../../Config/ArtifactConfig";
import { ArtifactConfigData } from "../../../Const/Artifact";
import { BundleName } from "../../../Basic/ResourcesMgr";
const { ccclass, property } = _decorator;

@ccclass("OuterBuildingView")
export class OuterBuildingView extends ViewController {
    public async refreshUI(building: MapBuildingObject) {
        this._building = building;

        this._isSelfMainCity = GameMgr.getMapBuildingSlotByUnqueId(building.uniqueId) == DataMgr.s.mapBuilding.getSelfMainCitySlotId();

        const infoView = this.node.getChildByPath("InfoView/Content");
        this.node.getChildByPath("InfoView/Gap").getComponent(UITransform).height =
            this._viewHeightMap[this._building.animType] == null ? 120 : this._viewHeightMap[this._building.animType];
        this.node.getChildByPath("InfoView").getComponent(Layout).updateLayout();

        let name: string = "";
        if (building.type == MapBuildingType.city) {
            const uniqueIdSplit = building.uniqueId.split("|");
            if (uniqueIdSplit.length == 2) {
                const data = GameMgr.getMapSlotData(uniqueIdSplit[0]);
                if (data == undefined || data.playerId == "0") {
                    name = "empty city";
                } else {
                    name = data.pname + " " + LanMgr.getLanById(building.name);
                }
            }
        } else {
            name = LanMgr.getLanById(building.name);
        }
        infoView.getChildByPath("Title/Text").getComponent(Label).string = name;
        infoView.getChildByPath("Level/Text").getComponent(Label).string = "Lv." + building.level;
        infoView.getChildByPath("Level/Difficult").active = building.type == MapBuildingType.event && building.level > DataMgr.s.artifact.getArtifactLevel();

        if (this._building.type == MapBuildingType.wormhole) {
            for (const child of this.node.getChildByPath("BuildingContent").children) {
                child.active = false;
            }
        } else {
            for (const child of this.node.getChildByPath("BuildingContent").children) {
                child.active = child.name == building.animType;
            }
        }

        const strongholdView = this.node.getChildByPath("StrongholdContent");
        const wormholdView = this.node.getChildByPath("WormholdView");
        const tavernView = this.node.getChildByPath("TavernView");
        const exploreView = this.node.getChildByPath("ExploreView");
        const collectView = this.node.getChildByPath("CollectView");

        strongholdView.active = false;
        wormholdView.active = false;
        tavernView.active = false;
        exploreView.active = false;
        collectView.active = false;

        const collectIcon = infoView.getChildByPath("Level/Collect");
        const exploreIcon = infoView.getChildByPath("Level/Explore");
        const strongholdIcon = infoView.getChildByPath("Level/Stronghold");
        const battleIcon = infoView.getChildByPath("Level/Battle");

        collectIcon.active = false;
        exploreIcon.active = false;
        strongholdIcon.active = false;
        battleIcon.active = false;

        infoView.getChildByPath("Level").active = true;
        if (building.type == MapBuildingType.city) {
            if (building.faction == MapMemberFactionType.enemy) {
                infoView.getChildByPath("Level").active = true;
                battleIcon.active = true;
            } else {
                infoView.getChildByPath("Level").active = false;
            }

            if (this._isSelfMainCity) {
                let tempShowAni: string = null;
                const effectArtifac = DataMgr.s.artifact.getObj_artifact_equiped();
                for (const temp of effectArtifac) {
                    const config: ArtifactConfigData = ArtifactConfig.getById(temp.artifactConfigId);
                    if (config == null) {
                        return;
                    }
                    if (config.rank == 5) {
                        tempShowAni = config.ani;
                        break;
                    }
                }
                if (tempShowAni != this._showArtifactAni) {
                    if (this._artifactShowView != null) {
                        this._artifactShowView.destroy();
                        this._artifactShowView = null;
                    }
                    if (tempShowAni != null) {
                        const prb = await ResourcesMgr.loadResource(BundleName.MainBundle, "prefab/artifactX5/Prefab/artifact/" + tempShowAni, Prefab);
                        this._artifactShowView = instantiate(prb);
                        infoView.getChildByPath("ArtifactShow").addChild(this._artifactShowView);
                    }
                    this._showArtifactAni = tempShowAni;
                }
            }
        } else if (building.type == MapBuildingType.explore) {
            // exploreIcon.active = true;
            // if (building.explorePioneerIds != null && building.explorePioneerIds.length > 0) {
            //     exploreView.active = true;
            //     exploreView.getChildByPath("Icon/pioneer_default").active = building.explorePioneerIds[0] == "pioneer_0";
            //     exploreView.getChildByPath("Icon/secretGuard").active = building.explorePioneerIds[0] == "pioneer_1";
            //     exploreView.getChildByPath("Icon/doomsdayGangSpy").active = building.explorePioneerIds[0] == "pioneer_2";
            //     exploreView.getChildByPath("Icon/rebels").active = building.explorePioneerIds[0] == "pioneer_3";
            //     const currentTimeStamp: number = new Date().getTime();
            //     const tempPioneer = DataMgr.s.pioneer.getById(building.explorePioneerIds[0]);
            //     exploreView.getChildByPath("Label").getComponent(Label).string = CommonTools.formatSeconds(
            //         (tempPioneer.actionEndTimeStamp - currentTimeStamp) / 1000
            //     );
            // }
        } else if (building.type == MapBuildingType.stronghold) {
            strongholdIcon.active = true;
            strongholdView.active = true;

            // let isSelf = false;
            // for (const player of players) {
            //     if (building.defendPioneerIds.indexOf(player.id) != -1) {
            //         isSelf = true;
            //         break;
            //     }
            // }

            for (const view of this._strongholdViews) {
                view.destroy();
            }
            this._strongholdViews = [];

            for (const pioneerId of building.defendPioneerIds) {
                const tempView = instantiate(this._strongholdItem);
                tempView.active = true;
                tempView.getChildByPath("pioneer_default").active = pioneerId == "pioneer_0";
                tempView.getChildByPath("secretGuard").active = pioneerId == "pioneer_1";
                tempView.getChildByPath("doomsdayGangSpy").active = pioneerId == "pioneer_2";
                tempView.getChildByPath("rebels").active = pioneerId == "pioneer_3";
                this._strongholdItem.parent.addChild(tempView);
                this._strongholdViews.push(tempView);
            }
            this._strongholdItem.parent.getComponent(Layout).updateLayout();

            // if (isSelf) {
            // this._selfView.active = true;
            // } else {
            // this._neturalView.active = true;
            // }
        } else if (building.type == MapBuildingType.wormhole) {
            strongholdIcon.active = true;
            if (this._wormholePlayBeginAnimTime > 0) {
                const preparedView = this.node.getChildByPath("BuildingContent/WormholeBeginAttack");
                preparedView.active = true;
                preparedView.getChildByPath("Lighting_Point_Effect_A").getComponent(ParticleSystem2D).resetSystem();
                this.scheduleOnce(() => {
                    preparedView.active = false;
                    this.refreshUI(this._building);
                }, this._wormholePlayBeginAnimTime);
                this._wormholePlayBeginAnimTime = 0;
            } else if (this._fakeAttack) {
                const attackComeView = this.node.getChildByPath("BuildingContent/WormholeAttackerCome");
                if (!attackComeView.active) {
                    attackComeView.active = true;
                    const animViewNames: string[] = [
                        "Lighting_Effect_A_Group_Group",
                        "Lighting_Effect_A_Group_Group/Lighting_Effect_A_Group",
                        "Lighting_Effect_A_Group_Group/Lighting_Effect_A_Group/Lighting_Effect_A",
                        "Transfer_Matrix_Effect_Tex_02",
                        "Transfer_Matrix_Effect_Tex_03",
                    ];
                    for (const name of animViewNames) {
                        attackComeView.getChildByPath(name).getComponent(Animation).play();
                    }
                    this.scheduleOnce(() => {
                        this._fakeAttack = false;
                        this.refreshUI(this._building);
                    }, 2.5);
                }
            } else {
                // common
                this.node.getChildByPath("BuildingContent/" + this._building.animType).active = true;
            }
        } else if (building.type == MapBuildingType.resource) {
            collectIcon.active = true;
            if (building.gatherPioneerIds != null && building.gatherPioneerIds.length > 0) {
                exploreView.active = true;

                for (const child of exploreView.getChildByPath("Icon").children) {
                    child.active = building.gatherPioneerIds[0].indexOf(child.name) != -1;
                }

                const currentTimeStamp: number = new Date().getTime();
                const tempPioneer = DataMgr.s.pioneer.getById(building.gatherPioneerIds[0]);
                exploreView.getChildByPath("Label").getComponent(Label).string = CommonTools.formatSeconds(
                    (tempPioneer.actionEndTimeStamp - currentTimeStamp) / 1000
                );

                collectView.active = true;
                for (const child of collectView.children) {
                    child.active = building.gatherPioneerIds[0].indexOf(child.name) != -1;
                }
            }
        } else if (building.type == MapBuildingType.event) {
            exploreIcon.active = true;
            if (building.eventPioneerIds != null && building.eventPioneerIds.length > 0) {
                exploreView.active = true;
                for (const child of exploreView.getChildByPath("Icon").children) {
                    child.active = building.eventPioneerIds[0].indexOf(child.name) != -1;
                }
            }
        } else if (building.type == MapBuildingType.tavern) {
            exploreIcon.active = true;

            const tavernObj = building as MapBuildingTavernObject;

            const countdownView = tavernView.getChildByPath("CountdownView");
            const newPioneerView = tavernView.getChildByPath("NewPioneerView");

            countdownView.active = false;
            newPioneerView.active = false;

            if (tavernObj.nft != null) {
                newPioneerView.active = true;
            } else if (tavernObj.tavernCountdownTime > 0) {
                countdownView.active = true;
                // useLanMgr
                // countdownView.getChildByPath("Text").getComponent(Label).string = LanMgr.getLanById("107549") + ":" + CommonTools.formatSeconds(tavernObj.tavernCountdownTime);
                countdownView.getChildByPath("Text").getComponent(Label).string = "recruiting: " + CommonTools.formatSeconds(tavernObj.tavernCountdownTime);
            }
            tavernView.active = countdownView.active || newPioneerView.active;
        }

        this._levelShowing = infoView.getChildByPath("Level").active;

        this._refreshEnergyTipShow();
        this._refreshBuildTipShow();

        const rookieSizeView = this.node.getChildByPath("BuildingContent/RookieSizeView");
        rookieSizeView.position = v3(0, 0, 0);
        if (building.type == MapBuildingType.city) {
            rookieSizeView.getComponent(UITransform).setContentSize(200, 200);
        } else if (building.type == MapBuildingType.resource) {
            rookieSizeView.getComponent(UITransform).setContentSize(120, 100);
        } else if (building.type == MapBuildingType.wormhole) {
            rookieSizeView.position = v3(0, 80, 0);
            rookieSizeView.getComponent(UITransform).setContentSize(200, 200);
        }
    }

    private _wormholePlayBeginAnimTime: number = 0;
    private _fakeAttack: boolean = false;

    private _isSelfMainCity: boolean = false;

    private _toGetEnergyTip: Node = null;
    private _toBuildBuildingTip: Node = null;

    private _levelShowing: boolean = false;
    private _building: MapBuildingObject = null;
    private _showArtifactAni: string = null;

    private _strongholdItem: Node = null;
    private _strongholdViews: Node[] = [];
    private _artifactShowView: Node = null;

    private _viewHeightMap: { [key: string]: number } = {
        Transfer_Matrix_Group: 280,
        Pyramid_Group: 140,
        Tree_Group: 180,
        Aquatic_Relics_Group: 140,
        ancient_ruins: 140,
        laboratory: 140,
        spider_cave: 120,
        ruin: 140,
        ambush: 160,
        oasis: 120,
        sand_mineral: 120,
        swamp_jungle: 120,
        treasure: 120,
        city: 240,
    };
    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._toGetEnergyTip = this.node.getChildByPath("InfoView/Content/ToGetEnergyTip");
        this._toGetEnergyTip.active = false;

        this._toBuildBuildingTip = this.node.getChildByPath("InfoView/Content/ToBuildBuildingTip");
        this._toBuildBuildingTip.active = false;

        this._strongholdItem = this.node.getChildByPath("StrongholdContent/Item");
        this._strongholdItem.active = false;
    }

    protected viewDidStart(): void {
        super.viewDidStart();

        NotificationMgr.addListener(NotificationName.RESOURCE_GETTED, this._onResourceChanged, this);
        NotificationMgr.addListener(NotificationName.RESOURCE_CONSUMED, this._onResourceChanged, this);
        NotificationMgr.addListener(NotificationName.ARTIFACT_EQUIP_DID_CHANGE, this._onArtifactEquipDidChange, this);
        NotificationMgr.addListener(NotificationName.MAP_BUILDING_WORMHOLE_FAKE_ATTACK, this._onWormholeFakeAttack, this);
        NotificationMgr.addListener(NotificationName.MAP_BUILDING_WORMHOLE_BEGIN_ANIM, this._onWormholeBeginAnim, this);

        this.schedule(() => {
            if (this._building != null) {
                const currentTimestamp: number = new Date().getTime();
                if (this._building.type == MapBuildingType.wormhole) {
                    const wormObj = this._building as MapBuildingWormholeObject;
                    if (wormObj.wormholdCountdownTime >= currentTimestamp) {
                        this.refreshUI(this._building);
                    }
                } else if (this._building.type == MapBuildingType.explore || this._building.type == MapBuildingType.resource) {
                    let actionPioneerId = null;
                    if (this._building.explorePioneerIds != null && this._building.explorePioneerIds.length > 0) {
                        actionPioneerId = this._building.explorePioneerIds[0];
                    } else if (this._building.gatherPioneerIds != null && this._building.gatherPioneerIds.length > 0) {
                        actionPioneerId = this._building.gatherPioneerIds[0];
                    }
                    if (actionPioneerId != null) {
                        const pioneer = DataMgr.s.pioneer.getById(actionPioneerId);
                        if (pioneer != undefined && pioneer.actionEndTimeStamp >= currentTimestamp) {
                            this.refreshUI(this._building);
                        }
                    }
                }
            }
        }, 1);
    }

    protected viewDidAppear(): void {
        super.viewDidAppear();
    }

    protected viewDidDisAppear(): void {
        super.viewDidDisAppear();
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.RESOURCE_GETTED, this._onResourceChanged, this);
        NotificationMgr.removeListener(NotificationName.RESOURCE_CONSUMED, this._onResourceChanged, this);
        NotificationMgr.removeListener(NotificationName.ARTIFACT_EQUIP_DID_CHANGE, this._onArtifactEquipDidChange, this);
        NotificationMgr.removeListener(NotificationName.MAP_BUILDING_WORMHOLE_FAKE_ATTACK, this._onWormholeFakeAttack, this);
        NotificationMgr.removeListener(NotificationName.MAP_BUILDING_WORMHOLE_BEGIN_ANIM, this._onWormholeBeginAnim, this);
    }

    protected viewUpdate(dt: number): void {
        super.viewUpdate(dt);
    }

    //-------------------------------- function
    private _refreshEnergyTipShow() {
        if (this._toGetEnergyTip == null) {
            return;
        }
        this._toGetEnergyTip.active = false;
        if (this._building != null && this._building.type == MapBuildingType.city && this._building.faction != MapMemberFactionType.enemy) {
            if (DataMgr.s.userInfo.data.energyDidGetTimes < DataMgr.s.userInfo.data.energyGetLimitTimes) {
                this._toGetEnergyTip.active = true;
            }
        }
        this._toGetEnergyTip.active = false;
    }
    private _refreshBuildTipShow() {
        if (this._toBuildBuildingTip == null) {
            return;
        }
        this._toBuildBuildingTip.active = false;
        if (
            this._isSelfMainCity &&
            this._building != null &&
            this._building.type == MapBuildingType.city &&
            this._building.faction != MapMemberFactionType.enemy
        ) {
            let canBuild: boolean = false;
            const innerBuildings = DataMgr.s.innerBuilding.data;
            innerBuildings.forEach((value: UserInnerBuildInfo, key: InnerBuildingType) => {
                const innerConfig = InnerBuildingConfig.getByBuildingType(key as InnerBuildingType);
                const levelConfig = InnerBuildingLvlUpConfig.getBuildingLevelData(value.buildLevel + 1, innerConfig.lvlup_cost);
                if (levelConfig != null) {
                    let thisBuild: boolean = true;
                    for (const cost of levelConfig) {
                        const type = cost[0].toString();
                        const num = cost[1];
                        if (DataMgr.s.item.getObj_item_count(type) < num) {
                            thisBuild = false;
                            break;
                        }
                    }
                    if (thisBuild) {
                        canBuild = true;
                    }
                }
            });
            if (canBuild) {
                this._toBuildBuildingTip.active = true;
            }
        }
    }

    //-------------------------------- notification
    private _onResourceChanged() {
        this._refreshBuildTipShow();
        this._refreshEnergyTipShow();
    }
    private _onArtifactEquipDidChange() {
        if (this._building == null) {
            return;
        }
        this.refreshUI(this._building);
    }
    private _onWormholeFakeAttack() {
        if (this._building == null) {
            return;
        }
        if (this._building.type != MapBuildingType.wormhole) {
            return;
        }
        this._fakeAttack = true;
        this.refreshUI(this._building);
    }
    private _onWormholeBeginAnim(data: { uniqueId: string, animTime: number }) {
        if (data == null) {
            return;
        }
        const { uniqueId, animTime } = data;
        if (uniqueId == null || animTime <= 0) {
            return;
        }
        if (this._building == null) {
            return;
        }
        if (this._building.type != MapBuildingType.wormhole || this._building.uniqueId != uniqueId) {
            return;
        }
        this._wormholePlayBeginAnimTime = animTime;
        this.refreshUI(this._building);
    }
}
