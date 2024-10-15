import { _decorator, Button, Color, instantiate, Label, Layout, Mask, Node, ScrollView, UITransform } from "cc";
import { BattleReportListItemUI } from "./BattleReportListItemUI";
import { ButtonEx, ButtonExEventType } from "db://assets/Script/UI/Common/ButtonEx";
import ViewController from "../BasicView/ViewController";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import UIPanelManger from "../Basic/UIPanelMgr";
import { DataMgr } from "../Data/DataMgr";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
import { NetworkMgr } from "../Net/NetworkMgr";
import { s2c_user, share } from "../Net/msg/WebsocketMsg";
import { read } from "original-fs";
import { RookieStep } from "../Const/RookieDefine";

const { ccclass } = _decorator;

@ccclass("BattleReportListUI")
export class BattleReportsUI extends ViewController {
    private _reportUiItems: BattleReportListItemUI[] = [];
    private _fightTypeItemTemplate: Node = null;
    private _miningTypeItemTemplate: Node = null;
    private _taskTypeItemTemplate: Node = null;
    private _exploreTypeItemTemplate: Node = null;
    private _rankTypeItemTemplate: Node = null;
    private _permanentLastItem: Node = null;
    private _reportListScrollView: ScrollView = null;
    /** all / fight / mining / ... */
    private _typeFilterButtons: ButtonEx[] = null;
    private _pendingButton: ButtonEx = null;
    private _markAllAsReadButton: Button = null;
    private _deleteReadReportsButton: Button = null;

    private _filterState: share.Inew_battle_report_type = share.Inew_battle_report_type.all;
    private _perPageNum: number = 20;
    private _reportMap: Map<number, { page: number; data: share.Inew_battle_report_data[] }> = new Map();

    private readonly buttonLabelActiveColor: Color = new Color("433824");
    private readonly buttonLabelGrayColor: Color = new Color("817674");

    public getOptionalView(rookieStep: RookieStep): Node {
        const findItem = this._reportUiItems.find((item) => {
            let isFind: boolean = false;
            const data: share.Inew_battle_report_data = item["__findData"];
            if (!data.getted) {
                if (rookieStep == RookieStep.GUIDE_1005 && data.type == share.Inew_battle_report_type.mining) {
                    isFind = true;
                } else if (rookieStep == RookieStep.GUIDE_1010 && data.type == share.Inew_battle_report_type.fight) {
                    isFind = true;
                }
            }
            return isFind;
        });
        if (findItem == undefined) {
            return null;
        }
        return findItem.node.getChildByPath("lootsButton");
    }

    public refreshUIAndResetScroll() {
        this._refreshUI();
        this._reportListScrollView.stopAutoScroll();
        this._reportListScrollView.scrollToTop();
    }

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._fightTypeItemTemplate = this.node.getChildByPath("frame/ScrollView/view/content/fightTypeItemTemplate");
        this._fightTypeItemTemplate.active = false;
        this._miningTypeItemTemplate = this.node.getChildByPath("frame/ScrollView/view/content/miningTypeItemTemplate");
        this._miningTypeItemTemplate.active = false;
        this._taskTypeItemTemplate = this.node.getChildByPath("frame/ScrollView/view/content/taskTypeItemTemplate");
        this._taskTypeItemTemplate.active = false;
        this._exploreTypeItemTemplate = this.node.getChildByPath("frame/ScrollView/view/content/exploreTypeItemTemplate");
        this._exploreTypeItemTemplate.active = false;
        this._rankTypeItemTemplate = this.node.getChildByPath("frame/ScrollView/view/content/rankTypeItemTemplate");
        this._rankTypeItemTemplate.active = false;
        this._permanentLastItem = this.node.getChildByPath("frame/ScrollView/view/content/permanentLastItem");

        const filterGroupRoot = this.node.getChildByPath("frame/navbar/reportTypeFilterGroup");
        this._typeFilterButtons = filterGroupRoot.children.map((node) => node.getComponent(ButtonEx));
        this._pendingButton = this.node.getChildByPath("frame/pendingButton").getComponent(ButtonEx);
        this._initFilterGroup();

        this._deleteReadReportsButton = this.node.getChildByPath("frame/deleteReadButton").getComponent(Button);
        this._deleteReadReportsButton.node.on(Button.EventType.CLICK, this._onClickDeleteReadReports, this);
        this._markAllAsReadButton = this.node.getChildByPath("frame/markAllAsReadButton").getComponent(Button);
        this._markAllAsReadButton.node.on(Button.EventType.CLICK, this._onClickMarkAllAsRead, this);

        // hide button
        this._pendingButton.node.active = false;
        this._deleteReadReportsButton.node.active = false;
        this._markAllAsReadButton.node.active = false;

        this._reportListScrollView = this.node.getChildByPath("frame/ScrollView").getComponent(ScrollView);

        NetworkMgr.websocket.on("get_new_battle_report_res", this.get_new_battle_report_res);
        NetworkMgr.websocket.on("receive_new_battle_report_reward_res", this.receive_new_battle_report_reward_res);

        this._refreshUI();
    }

    protected viewDidAppear(): void {
        super.viewDidAppear();
    }

    protected viewUpdate(dt: number): void {
        super.viewUpdate(dt);
    }

    protected viewDidDestroy(): void {
        NetworkMgr.websocket.off("get_new_battle_report_res", this.get_new_battle_report_res);
        NetworkMgr.websocket.off("receive_new_battle_report_reward_res", this.receive_new_battle_report_reward_res);
    }

    private _refreshUI() {
        this._refreshFilterGroup();

        for (const item of this._reportUiItems) {
            item.node.destroy();
        }
        this._reportUiItems = [];

        const data = this._getReportsFiltered();
        if (data == null) {
            NetworkMgr.websocketMsg.get_new_battle_report({
                type: this._filterState,
                page: 1,
                num: this._perPageNum,
            });
            return;
        }
        // traverse backwards to display later report first
        for (let i = 0; i < data.data.length; i++) {
            const report = data.data[i];
            let uiItem: BattleReportListItemUI;
            switch (report.type) {
                case share.Inew_battle_report_type.fight:
                    uiItem = instantiate(this._fightTypeItemTemplate).getComponent(BattleReportListItemUI);
                    break;
                case share.Inew_battle_report_type.mining:
                    uiItem = instantiate(this._miningTypeItemTemplate).getComponent(BattleReportListItemUI);
                    break;
                case share.Inew_battle_report_type.task:
                    uiItem = instantiate(this._taskTypeItemTemplate).getComponent(BattleReportListItemUI);
                    break;
                case share.Inew_battle_report_type.explore:
                    uiItem = instantiate(this._exploreTypeItemTemplate).getComponent(BattleReportListItemUI);
                    break;
                case share.Inew_battle_report_type.rank:
                    uiItem = instantiate(this._rankTypeItemTemplate).getComponent(BattleReportListItemUI);
                    break;

                default:
                    console.error(`Unknown report type: ${report.type}`);
                    continue;
            }

            this._reportUiItems.push(uiItem);
            uiItem["__findData"] = report;
            uiItem.initWithReportData(report);
            uiItem.node.setParent(this._fightTypeItemTemplate.parent);
            uiItem.node.active = true;
        }
        if (this._reportUiItems.length > 0) {
            this._permanentLastItem.active = true;
            this._permanentLastItem.setSiblingIndex(-1);
            this._permanentLastItem.getChildByPath("NoMoreTip").active = data.page == -1;
            this._permanentLastItem.getChildByPath("GetModeButton").active = data.page != -1;
        } else {
            this._permanentLastItem.active = false;
        }
    }

    private _onClickMarkAllAsRead() {
        GameMusicPlayMgr.playTapButtonEffect();
    }

    private _onClickDeleteReadReports() {
        GameMusicPlayMgr.playTapButtonEffect();
    }

    //#region filter group methods
    private _initFilterGroup() {
        // register events

        const onButtonApplyTransition = (button: ButtonEx, state: string) => {
            button.getComponentInChildren(Label).color = state !== "normal" ? this.buttonLabelActiveColor : this.buttonLabelGrayColor;
        };

        function initButtonStateTransition(button: ButtonEx) {
            button.eventTarget.on(ButtonExEventType.APPLY_TRANSITION, onButtonApplyTransition);
            onButtonApplyTransition(button, button.interactable ? "normal" : "disabled");
        }

        // button: action
        for (let i = 0; i < this._typeFilterButtons.length; i++) {
            initButtonStateTransition(this._typeFilterButtons[i]);
            this._typeFilterButtons[i].node.on(
                Button.EventType.CLICK,
                () => {
                    GameMusicPlayMgr.playTapButtonEffect();
                    if (i == 0) {
                        this._filterState = share.Inew_battle_report_type.all;
                    } else if (i == 2) {
                        this._filterState = share.Inew_battle_report_type.fight;
                    } else if (i == 4) {
                        this._filterState = share.Inew_battle_report_type.mining;
                    } else if (i == 1) {
                        this._filterState = share.Inew_battle_report_type.task;
                    } else if (i == 3) {
                        this._filterState = share.Inew_battle_report_type.explore;
                    } else if (i == 5) {
                        this._filterState = share.Inew_battle_report_type.rank;
                    }
                    this.refreshUIAndResetScroll();
                },
                this
            );
        }

        // button: Pending
        initButtonStateTransition(this._pendingButton);
        this._pendingButton.node.on(
            Button.EventType.CLICK,
            () => {
                GameMusicPlayMgr.playTapButtonEffect();
                this.refreshUIAndResetScroll();
            },
            this
        );
    }

    private _refreshFilterGroup() {
        for (let i = 0; i < this._typeFilterButtons.length; i++) {
            if (this._filterState == share.Inew_battle_report_type.all) {
                this._typeFilterButtons[i].interactable = i != 0;
            } else if (this._filterState == share.Inew_battle_report_type.fight) {
                this._typeFilterButtons[i].interactable = i != 2;
            } else if (this._filterState == share.Inew_battle_report_type.mining) {
                this._typeFilterButtons[i].interactable = i != 4;
            } else if (this._filterState == share.Inew_battle_report_type.task) {
                this._typeFilterButtons[i].interactable = i != 1;
            } else if (this._filterState == share.Inew_battle_report_type.explore) {
                this._typeFilterButtons[i].interactable = i != 3;
            } else if (this._filterState == share.Inew_battle_report_type.rank) {
                this._typeFilterButtons[i].interactable = i != 5;
            }
        }
    }

    private _getReportsFiltered(): { page: number; data: share.Inew_battle_report_data[] } {
        if (!this._reportMap.has(this._filterState)) {
            return null;
        }
        const data = this._reportMap.get(this._filterState);
        return data;
    }
    //#endregion

    //---------------------------------------------------
    // action
    onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.popPanel(this.node);
    }
    private onTapGetMore() {
        GameMusicPlayMgr.playTapButtonEffect();
        let reportData = this._reportMap.get(this._filterState);
        if (reportData == null) {
            return;
        }
        NetworkMgr.websocketMsg.get_new_battle_report({
            type: this._filterState,
            page: reportData.page,
            num: this._perPageNum,
        });
    }
    //------------------------------ websocket
    private get_new_battle_report_res = (e: any) => {
        const p: s2c_user.Iget_new_battle_report_res = e.data;
        if (p.res !== 1) {
            return;
        }
        let reportData = this._reportMap.get(this._filterState);
        if (reportData == null) {
            reportData = { page: 1, data: [] };
            this._reportMap.set(this._filterState, reportData);
        }
        if (p.data.length >= this._perPageNum) {
            reportData.page += 1;
        } else {
            reportData.page = -1;
        }
        reportData.data.push(...p.data);
        this._refreshUI();
    };
    private receive_new_battle_report_reward_res = (e: any) => {
        const p: s2c_user.Ireceive_new_battle_report_reward_res = e.data;
        if (p.res !== 1) {
            return;
        }
        let reportData = this._reportMap.get(this._filterState);
        if (reportData == null) {
            return;
        }
        for (let i = 0; i < reportData.data.length; i++) {
            if (p.id == reportData.data[i].id) {
                reportData.data[i].getted = true;
                break;
            }
        }
        this._refreshUI();
    };
}
