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

const { ccclass } = _decorator;

@ccclass("BattleReportListUI")
export class BattleReportsUI extends ViewController {
    private _reportUiItems: BattleReportListItemUI[] = [];
    private _fightTypeItemTemplate: Node = null;
    private _miningTypeItemTemplate: Node = null;
    private _exploreTypeItemTemplate: Node = null;
    private _taskTypeItemTemplate: Node = null;
    private _permanentLastItem: Node = null;
    private _reportListScrollView: ScrollView = null;
    /** all / fight / mining / ... */
    private _typeFilterButtons: ButtonEx[] = null;
    private _pendingButton: ButtonEx = null;
    private _markAllAsReadButton: Button = null;
    private _deleteReadReportsButton: Button = null;

    private _filterState: share.Inew_battle_report_type = null;
    private _reports: share.Inew_battle_report_data[] = [];

    private readonly buttonLabelActiveColor: Color = new Color("433824");
    private readonly buttonLabelGrayColor: Color = new Color("817674");

    public refreshUI() {
        this._refreshFilterGroup();

        for (const item of this._reportUiItems) {
            item.node.destroy();
        }
        this._reportUiItems = [];

        const reports = this._getReportsFiltered();
        if (!reports) return;

        // traverse backwards to display later report first
        for (let i = reports.length - 1; i >= 0; i--) {
            const report = reports[i];
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

                default:
                    console.error(`Unknown report type: ${report.type}`);
                    continue;
            }

            this._reportUiItems.push(uiItem);
            uiItem.initWithReportData(report);
            uiItem.node.setParent(this._fightTypeItemTemplate.parent);
            uiItem.node.active = true;
        }

        // if (this._permanentLastItem) {
        //     this._permanentLastItem.setSiblingIndex(-1);
        // }
    }

    public refreshUIAndResetScroll() {
        this.refreshUI();
        this._reportListScrollView.stopAutoScroll();
        this._reportListScrollView.scrollToTop();
    }

    public refreshUIWithKeepScrollPosition() {
        // save scroll state
        const scrollOffsetBefore = this._reportListScrollView.getScrollOffset();
        const layoutComp = this._fightTypeItemTemplate.parent.getComponent(Layout);
        const scrollViewContentHeightBefore = layoutComp.getComponent(UITransform).height;

        this.refreshUI();
        layoutComp.updateLayout();

        // restore scroll position and keep the position of items on screen
        const heightDiff = layoutComp.getComponent(UITransform).height - scrollViewContentHeightBefore;
        if (heightDiff > 0) {
            this._reportListScrollView.stopAutoScroll();
            this._reportListScrollView.scrollToOffset(scrollOffsetBefore.add2f(0, heightDiff));
        }
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

        // request data
        NetworkMgr.websocketMsg.get_new_battle_report({});
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

        // button: All
        initButtonStateTransition(this._typeFilterButtons[0]);
        this._typeFilterButtons[0].node.on(
            Button.EventType.CLICK,
            () => {
                GameMusicPlayMgr.playTapButtonEffect();
                this._filterState = null;
                this.refreshUIAndResetScroll();
            },
            this
        );

        // button: Fight/Mining/...
        for (let i = 1; i < this._typeFilterButtons.length; i++) {
            const iCopy = i;
            initButtonStateTransition(this._typeFilterButtons[i]);
            this._typeFilterButtons[i].node.on(
                Button.EventType.CLICK,
                () => {
                    GameMusicPlayMgr.playTapButtonEffect();
                    if (i == 1) {
                        this._filterState = share.Inew_battle_report_type.fight;
                    } else if (i == 2) {
                        this._filterState = share.Inew_battle_report_type.mining;
                    } else if (i == 3) {
                        this._filterState = share.Inew_battle_report_type.task;
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
            if (this._filterState == null) {
                this._typeFilterButtons[i].interactable = i != 0;
            } else if (this._filterState == share.Inew_battle_report_type.fight) {
                this._typeFilterButtons[i].interactable = i != 1;
            } else if (this._filterState == share.Inew_battle_report_type.mining) {
                this._typeFilterButtons[i].interactable = i != 2;
            } else if (this._filterState == share.Inew_battle_report_type.task) {
                this._typeFilterButtons[i].interactable = i != 3;
            }
        }
    }

    private _getReportsFiltered() {
        if (this._reports.length == 0) {
            return [];
        }
        if (this._filterState == null) {
            return this._reports;
        }
        return this._reports.filter((item) => item.type == this._filterState);
    }

    //#endregion

    //---------------------------------------------------
    // action
    onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.popPanel(this.node);
    }
    //------------------------------ websocket
    private get_new_battle_report_res = (e: any) => {
        const p: s2c_user.Iget_new_battle_report_res = e.data;
        if (p.res !== 1) {
            return;
        }
        this._reports = p.data;
        this.refreshUIAndResetScroll();
    }
    private receive_new_battle_report_reward_res = (e: any) => {
        const p: s2c_user.Ireceive_new_battle_report_reward_res = e.data;
        if (p.res !== 1) {
            return;
        }
        for (let i = 0; i < this._reports.length; i++) {
            if (p.id == this._reports[i].id) {
                this._reports[i].getted = true;
                break;
            }
        }
        this.refreshUI();
    }
}
