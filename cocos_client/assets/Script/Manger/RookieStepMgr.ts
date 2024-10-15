import { Layers, Node, UITransform, Vec3, find, instantiate, pingPong } from "cc";
import NotificationMgr from "../Basic/NotificationMgr";
import UIPanelManger, { UIPanelLayerType } from "../Basic/UIPanelMgr";
import { UIName } from "../Const/ConstUIDefine";
import { NotificationName } from "../Const/Notification";
import { RookieStepMaskUI } from "../UI/RookieGuide/RookieStepMaskUI";
import { DataMgr } from "../Data/DataMgr";
import { RookieFinishCondition, RookieStep, RookieStepState } from "../Const/RookieDefine";
import { MainUI } from "../UI/MainUI";
import { DialogueUI } from "../UI/Outer/DialogueUI";
import { InnerBuildingControllerRe } from "../Game/Inner/InnerBuildingControllerRe";
import { NewBuildingUpgradeUI } from "../UI/Inner/NewBuildingUpgradeUI";
import { InnerBuildingType, MapBuildingType } from "../Const/BuildingDefine";
import { RecruitUI } from "../UI/Inner/RecruitUI";
import { DispatchUI } from "../UI/Dispatch/DispatchUI";
import { OuterTiledMapActionController } from "../Game/Outer/OuterTiledMapActionController";
import { OuterBuildingController } from "../Game/Outer/OuterBuildingController";
import { GameMgr } from "../Utils/Global";
import GameMainHelper from "../Game/Helper/GameMainHelper";
import { AlterView } from "../UI/View/AlterView";
import { ExerciseUI } from "../UI/ExerciseUI";
import { OuterPioneerController } from "../Game/Outer/OuterPioneerController";
import { MapPioneerActionType, MapPioneerType } from "../Const/PioneerDefine";
import { NFTBackpackUI } from "../UI/NFTBackpackUI";
import { BattleReportsUI } from "../UI/BattleReportsUI";

export default class RookieStepMgr {
    private static _instance: RookieStepMgr;

    private _mainUI: Node = null;
    private _innerBuildingController: InnerBuildingControllerRe;
    private _buildingController: OuterBuildingController;
    private _pioneerController: OuterPioneerController;
    private _tileMapController: OuterTiledMapActionController;

    private _lastTipShowWorldPos: Vec3 = null;

    private _maskView: RookieStepMaskUI = null;
    private _optionalTipView: Node = null;

    public get maskView() {
        return this._maskView;
    }
    public async init() {
        const rookieStep: RookieStep = DataMgr.s.userInfo.data.rookieStep;
        if (rookieStep == RookieStep.FINISH) {
            return;
        }

        const result = await UIPanelManger.inst.pushPanel(UIName.RookieStepMaskUI, UIPanelLayerType.ROOKIE);
        if (!result.success) {
            return;
        }
        this._maskView = result.node.getComponent(RookieStepMaskUI);
        this._maskView.hide();
        NotificationMgr.triggerEvent(NotificationName.USERINFO_ROOKE_STEP_CHANGE);

        this._optionalTipView = instantiate(this._maskView.instructView);
        this._optionalTipView.parent = result.node.parent;
        this._optionalTipView.active = false;

        setInterval(() => {
            this._checkOptionalTipShow();
        }, 100);
    }

    public static instance(): RookieStepMgr {
        if (!this._instance) {
            this._instance = new RookieStepMgr();
        }
        return this._instance;
    }

    private _checkOptionalTipShow() {
        // loading show
        const findLoading = find("Main/UI_Canvas/UIHUD/LoadingUI");
        if (findLoading != null && findLoading.activeInHierarchy) {
            this._hideOptionalTip();
            return;
        }
        const findLoading2 = find("Main/UI_Canvas/ROOKIE_ROOT/LoadingUI");
        if (findLoading2 != null && findLoading2.activeInHierarchy) {
            this._hideOptionalTip();
            return;
        }

        // mask show
        if (this.maskView.isShow()) {
            this._hideOptionalTip();
            return;
        }
        //------------- find ui
        if (this._mainUI == null) {
            this._mainUI = find("Main/UI_Canvas/UI_ROOT/MainUI");
        }
        if (this._innerBuildingController == null) {
            const InnerSceneRe = find("Main/Canvas/GameContent/Game/InnerSceneRe");
            if (InnerSceneRe != null) {
                this._innerBuildingController = InnerSceneRe.getComponent(InnerBuildingControllerRe);
            }
        }
        if (this._tileMapController == null || this._buildingController == null || this._pioneerController == null) {
            const outScene = find("Main/Canvas/GameContent/Game/OutScene");
            if (outScene != null) {
                if (this._tileMapController == null) {
                    this._tileMapController = outScene.getComponent(OuterTiledMapActionController);
                }
                if (this._buildingController == null) {
                    this._buildingController = outScene.getComponent(OuterBuildingController);
                }
                if (this._pioneerController == null) {
                    this._pioneerController = outScene.getComponent(OuterPioneerController);
                }
            }
        }

        // dialogue
        const findDialogue = find("Main/UI_Canvas/UI_ROOT/DialogueUI");
        if (findDialogue != null && findDialogue.activeInHierarchy) {
            const dialogue = findDialogue.getComponent(DialogueUI);
            const optionalView = dialogue.getOptionalView();
            if (optionalView != null) {
                this._showOptionalTip(optionalView.worldPosition);
                return;
            }
        }

        // rewrad can get
        const rookieState = DataMgr.s.userInfo.data.rookieState;
        if (rookieState == RookieStepState.FINISH) {
            if (this._mainUI != null && this._mainUI.parent.children.length > 1) {
                this._hideOptionalTip();
            } else {
                if (this._mainUI != null) {
                    const findTemp = this._mainUI.getChildByPath("GuideTask/gp_award");
                    if (findTemp != null && findTemp.activeInHierarchy) {
                        this._showOptionalTip(findTemp.worldPosition);
                    }
                }
            }
            return;
        }

        const rookieStep: RookieStep = DataMgr.s.userInfo.data.rookieStep;
        if (
            rookieStep == RookieStep.GUIDE_1001 ||
            rookieStep == RookieStep.GUIDE_1002 ||
            rookieStep == RookieStep.GUIDE_1003 ||
            rookieStep == RookieStep.GUIDE_1008
        ) {
            // map action step
            if (GameMainHelper.instance.isGameShowOuter) {
                if (this._mainUI != null) {
                    const findTemp = this._mainUI.getChildByPath("CommonContent/InnerOutChangeBtnBg");
                    if (findTemp != null && findTemp.activeInHierarchy) {
                        this._showOptionalTip(findTemp.worldPosition);
                        return;
                    }
                }
            }

            // building upgrade step
            let checkType: InnerBuildingType = null;
            switch (rookieStep) {
                case RookieStep.GUIDE_1001:
                    checkType = InnerBuildingType.MainCity;
                    break;

                case RookieStep.GUIDE_1002:
                    checkType = InnerBuildingType.Barrack;
                    break;

                case RookieStep.GUIDE_1003:
                    checkType = InnerBuildingType.House;
                    break;

                case RookieStep.GUIDE_1008:
                    checkType = InnerBuildingType.TrainingCenter;
                    break;

                default:
                    break;
            }

            // building upgrade
            const findBuilding = find("Main/UI_Canvas/UI_ROOT/NewBuildingUpgradeUI");
            if (findBuilding != null && findBuilding.activeInHierarchy) {
                const building = findBuilding.getComponent(NewBuildingUpgradeUI);
                if (building.type === checkType) {
                    const optionalView = building.getOptionalView();
                    if (optionalView != null) {
                        this._showOptionalTip(optionalView.worldPosition);
                        return;
                    }
                }
            }

            // inner city
            if (!DataMgr.s.innerBuilding.getInnerBuildingUpgrading(checkType)) {
                // not upgrading
                if (this._innerBuildingController != null) {
                    const findTemp = this._innerBuildingController.getBuildingByKey(checkType);
                    if (findTemp != null && findTemp.node.activeInHierarchy) {
                        this._showOptionalTip(findTemp.node.worldPosition);
                        return;
                    }
                }
            }
        } else if (rookieStep == RookieStep.GUIDE_1004) {
            // recruit step
            const recruitData = DataMgr.s.innerBuilding.data.get(InnerBuildingType.Barrack);
            if (!recruitData.upgrading && !recruitData.troopIng) {
                const findRecruit = find("Main/UI_Canvas/UI_ROOT/RecruitUI");
                if (findRecruit != null && findRecruit.activeInHierarchy) {
                    const recruit = findRecruit.getComponent(RecruitUI);
                    const optionalView = recruit.getOptionalView();
                    if (optionalView != null) {
                        this._showOptionalTip(optionalView.worldPosition);
                        return;
                    }
                }

                if (this._mainUI != null) {
                    const findTemp = this._mainUI.getChildByPath("CommonContent/RecuritButton");
                    if (findTemp != null && findTemp.activeInHierarchy) {
                        this._showOptionalTip(findTemp.worldPosition);
                        return;
                    }
                }
            }
        } else if (rookieStep == RookieStep.GUIDE_1005 || rookieStep == RookieStep.GUIDE_1010 || rookieStep == RookieStep.GUIDE_1012) {
            const finishConditions = DataMgr.s.userInfo.data.rookieFinishConditions;
            const collectBattleTip =
                rookieStep == RookieStep.GUIDE_1005 &&
                !finishConditions.includes(RookieFinishCondition.Collect) &&
                finishConditions.includes(RookieFinishCondition.BattleReportCollect);
            const fightBattleTip =
                rookieStep == RookieStep.GUIDE_1010 &&
                !finishConditions.includes(RookieFinishCondition.FightMonster) &&
                finishConditions.includes(RookieFinishCondition.BattleReportFightMonster);

            if (collectBattleTip || fightBattleTip) {
                const findBattleReport = find("Main/UI_Canvas/UI_ROOT/BattleReportUI");
                if (findBattleReport != null && findBattleReport.activeInHierarchy) {
                    const battleReport = findBattleReport.getComponent(BattleReportsUI);
                    const findTemp = battleReport.getOptionalView(rookieStep);
                    if (findTemp != null) {
                        this._showOptionalTip(findTemp.worldPosition);
                        return;
                    }
                }

                if (this._mainUI != null) {
                    const findTemp = this._mainUI.getChildByPath("CommonContent/reportsButton");
                    if (findTemp != null && findTemp.activeInHierarchy) {
                        this._showOptionalTip(findTemp.worldPosition);
                        return;
                    }
                }
            }

            // map action step
            if (!GameMainHelper.instance.isGameShowOuter) {
                if (this._mainUI != null) {
                    const findTemp = this._mainUI.getChildByPath("CommonContent/InnerOutChangeBtnBg");
                    if (findTemp != null && findTemp.activeInHierarchy) {
                        this._showOptionalTip(findTemp.worldPosition);
                        return;
                    }
                }
            }

            // dispath
            const findDispath = find("Main/UI_Canvas/UI_ROOT/DispatchUI");
            if (findDispath != null && findDispath.activeInHierarchy) {
                const dispatch = findDispath.getComponent(DispatchUI);
                const optionalView = dispatch.getOptionalView();
                if (optionalView != null) {
                    this._showOptionalTip(optionalView.worldPosition);
                    return;
                }
            }

            if (this._mainUI != null && this._mainUI.parent.children.length > 1) {
                // new ui, hide map optional tip
            } else {
                let isPioneerActioning: boolean = false;
                for (const pioneer of DataMgr.s.pioneer.getAll()) {
                    if (
                        pioneer.actionType == MapPioneerActionType.moving ||
                        pioneer.actionType == MapPioneerActionType.fighting ||
                        pioneer.actionType == MapPioneerActionType.mining
                    ) {
                        isPioneerActioning = true;
                        break;
                    }
                }
                if (!isPioneerActioning) {
                    // action
                    if (this._tileMapController != null) {
                        const actionView = this._tileMapController.actionView;
                        if (actionView != null && actionView.node.activeInHierarchy) {
                            this._showOptionalTip(actionView.node.getChildByPath("ActionView/Action").children[0].worldPosition, true);
                            return;
                        }
                    }

                    // map element
                    if (rookieStep == RookieStep.GUIDE_1005) {
                        if (this._buildingController != null) {
                            let buildInfo = GameMgr.findInViewBuildingInfo(MapBuildingType.resource);
                            if (buildInfo != null) {
                                const findTemp = this._buildingController.getBuildingView(buildInfo.uniqueId);
                                if (findTemp != null && findTemp.node.activeInHierarchy) {
                                    this._showOptionalTip(findTemp.node.worldPosition, true);
                                    return;
                                }
                            }
                        }
                    } else if (rookieStep == RookieStep.GUIDE_1010) {
                        if (this._pioneerController != null) {
                            const pioneerInfo = GameMgr.findInViewPioneerInfo(MapPioneerType.hred);
                            if (pioneerInfo != null) {
                                const findTemp = this._pioneerController.getPioneerByUniqueId(pioneerInfo.uniqueId);
                                if (findTemp != null && findTemp.activeInHierarchy) {
                                    this._showOptionalTip(findTemp.worldPosition, true);
                                    return;
                                }
                            }
                        }
                    } else if (rookieStep == RookieStep.GUIDE_1012) {
                        if (this._buildingController != null) {
                            let buildInfo = GameMgr.findInViewBuildingInfo(MapBuildingType.wormhole);
                            if (buildInfo != null) {
                                const findTemp = this._buildingController.getBuildingView(buildInfo.uniqueId);
                                if (findTemp != null && findTemp.node.activeInHierarchy) {
                                    this._showOptionalTip(findTemp.node.worldPosition, true);
                                    return;
                                }
                            }
                        }
                    }
                }
            }
        } else if (rookieStep == RookieStep.GUIDE_1006) {
            // piot

            const findPointAlter = find("Main/UI_Canvas/UIHUD/AlterView");
            if (findPointAlter != null && findPointAlter.activeInHierarchy) {
                const alter = findPointAlter.getComponent(AlterView);
                const optionalView = alter.getOptionalView(rookieStep);
                if (optionalView != null) {
                    this._showOptionalTip(optionalView.worldPosition);
                    return;
                }
            }

            if (this._mainUI != null) {
                const findTemp = this._mainUI.getChildByPath("CommonContent/HeatTreasureUI/__ViewContent/Content/HeatProgress");
                if (findTemp != null && findTemp.activeInHierarchy) {
                    this._showOptionalTip(findTemp.worldPosition);
                    return;
                }
            }
        } else if (rookieStep == RookieStep.GUIDE_1007) {
            // world box
            if (this._mainUI != null) {
                let canTapView = null;
                const contentView = this._mainUI.getChildByPath("CommonContent/HeatTreasureUI/__ViewContent/Content/ProgressBar/BoxContent");
                if (!contentView) {
                    return;
                }
                for (let i = 0; i < contentView.children.length; i++) {
                    let canTap: boolean = false;
                    for (const boxChild of contentView.children[i].children) {
                        if (boxChild.name == "Treasure_box_empty" || boxChild.name == "Treasure_box_select_empty") {
                            continue;
                        }
                        canTap = true;
                        break;
                    }
                    if (canTap) {
                        canTapView = contentView.children[i];
                        break;
                    }
                }
                if (canTapView != null) {
                    this._showOptionalTip(canTapView.worldPosition);
                    return;
                }
            }
        } else if (rookieStep == RookieStep.GUIDE_1009) {
            // training step
            const exerciseData = DataMgr.s.innerBuilding.data.get(InnerBuildingType.TrainingCenter);
            if (!exerciseData.upgrading && !exerciseData.tc != null && exerciseData.tc.training == null) {
                const findRecruit = find("Main/UI_Canvas/UI_ROOT/ExerciseUI");
                if (findRecruit != null && findRecruit.activeInHierarchy) {
                    const recruit = findRecruit.getComponent(ExerciseUI);
                    const optionalView = recruit.getOptionalView();
                    if (optionalView != null) {
                        this._showOptionalTip(optionalView.worldPosition);
                        return;
                    }
                }

                if (this._mainUI != null) {
                    const findTemp = this._mainUI.getChildByPath("CommonContent/ExerciseButton");
                    if (findTemp != null && findTemp.activeInHierarchy) {
                        this._showOptionalTip(findTemp.worldPosition);
                        return;
                    }
                }
            }
        } else if (rookieStep == RookieStep.GUIDE_1011) {
            // level up pioneer
            const findNFTInfo = find("Main/UI_Canvas/UI_ROOT/NFTInfoUI");
            if (findNFTInfo != null && findNFTInfo.activeInHierarchy) {
                const button = findNFTInfo.getChildByPath("__ViewContent/TabLevel/content/Level_Cost/Btn");
                if (button != null) {
                    this._showOptionalTip(button.worldPosition);
                    return;
                }
            }

            const findNFTPack = find("Main/UI_Canvas/UI_ROOT/NFTBackpack");
            if (findNFTPack != null && findNFTPack.activeInHierarchy) {
                const pack = findNFTPack.getComponent(NFTBackpackUI);
                const findTemp = pack.getOptionalView();
                if (findTemp != null) {
                    this._showOptionalTip(findTemp.worldPosition);
                    return;
                }
            }

            if (this._mainUI != null) {
                const findTemp = this._mainUI.getChildByPath("CommonContent/NFTButton");
                if (findTemp != null && findTemp.activeInHierarchy) {
                    this._showOptionalTip(findTemp.worldPosition);
                    return;
                }
            }
        }

        this._hideOptionalTip();
    }

    private _showOptionalTip(worldPos: Vec3, inOuter: boolean = false) {
        if (worldPos == null) {
            return;
        }
        const useWorldPos = worldPos.clone();
        if (
            this._lastTipShowWorldPos != null &&
            Math.abs(this._lastTipShowWorldPos.x - useWorldPos.x) <= 1 &&
            Math.abs(this._lastTipShowWorldPos.y - useWorldPos.y) <= 1
        ) {
        } else {
            if (inOuter) {
                this._optionalTipView.layer = Layers.Enum.DEFAULT;
                this._optionalTipView.worldPosition = useWorldPos;
            } else {
                this._optionalTipView.layer = Layers.Enum.UI_2D;
                const localPos = this._optionalTipView.parent.getComponent(UITransform).convertToNodeSpaceAR(useWorldPos);
                this._optionalTipView.position = localPos;
            }
            this._lastTipShowWorldPos = useWorldPos;
        }
        if (!this._optionalTipView.active) {
            this._optionalTipView.active = true;
        }
    }
    private _hideOptionalTip() {
        if (this._optionalTipView.active) {
            this._optionalTipView.active = false;
        }
    }
}
