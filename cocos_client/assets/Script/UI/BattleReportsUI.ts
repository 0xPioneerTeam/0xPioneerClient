import {_decorator, Button, Color, instantiate, Label, Layout, Mask, Node, ScrollView, UITransform} from 'cc';
import {PopUpUI} from "db://assets/Script/BasicView/PopUpUI";
import {BattleReportListItemUI} from "./BattleReportListItemUI";
import {ButtonEx, ButtonExEventType} from "db://assets/Script/UI/Common/ButtonEx";
import BattleReportsMgrDefine, { BattleReportsEvent, BattleReportType } from '../Const/Manager/BattleReportsMgrDefine';
import { BattleReportsMgr } from '../Utils/Global';

const {ccclass} = _decorator;

enum ReportsFilterType {
    None,
    ReportType,
    Pending,
}

class ReportFilterState {
    public filterType: ReportsFilterType = ReportsFilterType.None;
    public reportType: BattleReportType = null;
}

@ccclass('BattleReportListUI')
export class BattleReportsUI extends PopUpUI implements BattleReportsEvent {

    private _reportUiItems: BattleReportListItemUI[] = [];
    private _fightTypeItemTemplate: Node = null;
    private _miningTypeItemTemplate: Node = null;
    private _exploreTypeItemTemplate: Node = null;
    private _permanentLastItem: Node = null;
    private _reportListScrollView: ScrollView = null;
    /** all / fight / mining / ... */
    private _typeFilterButtons: ButtonEx[] = null;
    private _pendingButton: ButtonEx = null;
    private _markAllAsReadButton: Button = null;
    private _deleteReadReportsButton: Button = null;

    private _filterState: ReportFilterState = new ReportFilterState();
    private _autoMarkReadSkipFrames = 0;

    private readonly buttonLabelActiveColor: Color = new Color("433824");
    private readonly buttonLabelGrayColor: Color = new Color("817674");

    public override get typeName(): string {
        return "BattleReportsUI";
    }

    public refreshUI() {
        this._refreshFilterGroup();

        for (const item of this._reportUiItems) {
            item.node.destroy();
        }
        this._reportUiItems = [];

        const reports = this._getReportsFiltered();
        if (!reports)
            return;

        // traverse backwards to display later report first
        for (let i = reports.length - 1; i >= 0; i--) {
            const report = reports[i];
            let uiItem: BattleReportListItemUI;
            switch (report.type) {
                case BattleReportType.Fight:
                    uiItem = instantiate(this._fightTypeItemTemplate).getComponent(BattleReportListItemUI);
                    break;
                case BattleReportType.Mining:
                    uiItem = instantiate(this._miningTypeItemTemplate).getComponent(BattleReportListItemUI);
                    break;
                case BattleReportType.Exploring:
                    uiItem = instantiate(this._exploreTypeItemTemplate).getComponent(BattleReportListItemUI);
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

        if (this._permanentLastItem) {
            this._permanentLastItem.setSiblingIndex(-1);
        }
    }

    public refreshUIAndResetScroll() {
        this.refreshUI();
        this._reportListScrollView.stopAutoScroll();
        this._reportListScrollView.scrollToTop();
    }

    public refreshUIWithKeepScrollPosition(){
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

    onLoad(): void {
        this._fightTypeItemTemplate = this.node.getChildByPath('frame/ScrollView/view/content/fightTypeItemTemplate');
        this._fightTypeItemTemplate.active = false;
        this._miningTypeItemTemplate = this.node.getChildByPath('frame/ScrollView/view/content/miningTypeItemTemplate');
        this._miningTypeItemTemplate.active = false;
        this._exploreTypeItemTemplate = this.node.getChildByPath('frame/ScrollView/view/content/exploreTypeItemTemplate');
        this._exploreTypeItemTemplate.active = false;
        this._permanentLastItem = this.node.getChildByPath('frame/ScrollView/view/content/permanentLastItem');

        const filterGroupRoot = this.node.getChildByPath('frame/navbar/reportTypeFilterGroup');
        this._typeFilterButtons = filterGroupRoot.children.map(node => node.getComponent(ButtonEx));
        this._pendingButton = this.node.getChildByPath('frame/pendingButton').getComponent(ButtonEx);
        this._initFilterGroup();

        this._deleteReadReportsButton = this.node.getChildByPath('frame/deleteReadButton').getComponent(Button);
        this._deleteReadReportsButton.node.on(Button.EventType.CLICK, this._onClickDeleteReadReports, this);
        this._markAllAsReadButton = this.node.getChildByPath('frame/markAllAsReadButton').getComponent(Button);
        this._markAllAsReadButton.node.on(Button.EventType.CLICK, this._onClickMarkAllAsRead, this);

        this._reportListScrollView = this.node.getChildByPath('frame/ScrollView').getComponent(ScrollView);
    }

    update(_deltaTime: number) {
        this._autoMarkRead();
    }

    private _autoMarkRead() {
        // Extra spare frame for engine to doing the layout correctly,
        // otherwise this will mark all the reports as read.
        if (this._autoMarkReadSkipFrames > 0) {
            this._autoMarkReadSkipFrames--;
            return;
        }
        // Mark report as read when center of the item UI is visible.
        const mask = this._reportListScrollView.node.getChildByName('view').getComponent(Mask);
        let changed = 0;

        for (const reportUiItem of this._reportUiItems) {
            if (reportUiItem.report.unread) {
                const boundingBox = reportUiItem.getComponent(UITransform).getBoundingBoxToWorld();
                if (mask.isHit(boundingBox.center)) {
                    reportUiItem.report.unread = false;
                    changed++;
                }
            }
        }
        if (changed) {
            // console.log(`BattleReportsUI auto mark ${changed} reports.`);
            BattleReportsMgr.saveData();
        }
    }

    private _onClickMarkAllAsRead() {
        BattleReportsMgr.markAllAsRead();
        this.refreshUI();
    }

    private _onClickDeleteReadReports() {
        BattleReportsMgr.deleteReadReports();
        this.refreshUIAndResetScroll();
    }

    protected onEnable() {
        BattleReportsMgr.addObserver(this);

        // Select filter tab "All" every time enter the reports UI.
        this._filterState.filterType = ReportsFilterType.None;
        this.refreshUIAndResetScroll();

        this._autoMarkReadSkipFrames = 1;
    }

    protected onDisable() {
        BattleReportsMgr.removeObserver(this);
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
        this._typeFilterButtons[0].node.on(Button.EventType.CLICK, () => {
            this._filterState.filterType = ReportsFilterType.None;
            this.refreshUIAndResetScroll();
        }, this);

        // button: Fight/Mining/...
        // same index as enum BattleReportType
        for (let i = 1; i < this._typeFilterButtons.length; i++) {
            const iCopy = i;
            initButtonStateTransition(this._typeFilterButtons[i]);
            this._typeFilterButtons[i].node.on(Button.EventType.CLICK, () => {
                this._filterState.filterType = ReportsFilterType.ReportType;
                this._filterState.reportType = iCopy;
                this.refreshUIAndResetScroll();
            }, this);
        }

        // button: Pending
        initButtonStateTransition(this._pendingButton);
        this._pendingButton.node.on(Button.EventType.CLICK, () => {
            this._filterState.filterType = ReportsFilterType.Pending;
            this.refreshUIAndResetScroll();
        }, this);
    }

    private _refreshFilterGroup() {
        const filterType = this._filterState.filterType;

        const filterAllActive = filterType == ReportsFilterType.None;
        this._typeFilterButtons[0].interactable = !filterAllActive;

        const typeFilterCurrentIndex = filterType == ReportsFilterType.ReportType ? this._filterState.reportType : -1;
        for (let i = 1; i < this._typeFilterButtons.length; i++) {
            const active = i == typeFilterCurrentIndex;
            this._typeFilterButtons[i].interactable = !active;
        }

        const filterPendingActive = filterType == ReportsFilterType.Pending;
        this._pendingButton.interactable = !filterPendingActive;
    }

    private _getReportsFiltered() {
        const reports = BattleReportsMgr.getReports();
        if (!reports) {
            return [];
        }

        switch (this._filterState.filterType) {
            case ReportsFilterType.None:
                return reports;
            case ReportsFilterType.ReportType:
                return reports.filter(item => item.type === this._filterState.reportType);
            case ReportsFilterType.Pending:
                return reports.filter(item => BattleReportsMgrDefine.isReportPending(item));
            default:
                console.error(`Unsupported filterType ${this._filterState.filterType}`);
        }
    }

    //#endregion

    //---------------------------------------------------
    // action
    onTapClose() {
        this.show(false);
    }

    public onBattleReportListChanged() {
        this.scheduleOnce(this.refreshUIWithKeepScrollPosition);
    }
}

