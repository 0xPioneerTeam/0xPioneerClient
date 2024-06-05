import { _decorator, Button, Color, instantiate, Label, Layout, Node, Vec2 } from "cc";
import { LanMgr } from "../Utils/Global";
import ViewController from "../BasicView/ViewController";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import { TaskCondition, TaskConditionType, TaskStepObject } from "../Const/TaskDefine";
import GameMainHelper from "../Game/Helper/GameMainHelper";
import CommonTools from "../Tool/CommonTools";
import UIPanelManger from "../Basic/UIPanelMgr";
import { DataMgr } from "../Data/DataMgr";
import { MapNpcPioneerObject, MapPioneerObject } from "../Const/PioneerDefine";
import { share } from "../Net/msg/WebsocketMsg";
import TaskConfig from "../Config/TaskConfig";
import TaskStepConfig from "../Config/TaskStepConfig";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";

const { ccclass, property } = _decorator;

@ccclass("TaskListUI")
export class TaskListUI extends ViewController {
    public refreshUI() {
        // useLanMgr
        // this._actionTaskView.getChildByPath("Bg/Title").getComponent(Label).string = LanMgr.getLanById("107549");
        // this._detailTaskView.getChildByPath("Bg/Title").getComponent(Label).string = LanMgr.getLanById("107549");
        // this._detailTaskView.getChildByPath("ToDoButton/Label").getComponent(Label).string = LanMgr.getLanById("107549");
        // this._detailTaskView.getChildByPath("CompletedButton/Label").getComponent(Label).string = LanMgr.getLanById("107549");
        // this._detailProgressFinishTitleItem.getChildByName("Label").getComponent(Label).string = LanMgr.getLanById("107549");
        // this._detailProgressToDoTitleItem.getChildByName("Label").getComponent(Label).string = LanMgr.getLanById("107549");
        // this._detailProgressUndoneTitleItem.getChildByName("Label").getComponent(Label).string = LanMgr.getLanById("107549");

        // clear
        for (const action of this._actionTaskList) {
            action.destroy();
        }
        this._actionTaskList = [];

        for (const detail of this._detailTaskList) {
            detail.destroy();
        }
        this._detailTaskList = [];
        for (const progress of this._detailProgressList) {
            progress.destroy();
        }
        this._detailProgressList = [];

        const finishedTasks: share.Itask_data[] = [];
        const toDoTasks: share.Itask_data[] = [];
        const allGettedTasks = DataMgr.s.task.getAllGettedTasks();
        for (const task of allGettedTasks) {
            if (task.isFinished || task.isFailed) {
                finishedTasks.push(task);
            } else {
                toDoTasks.push(task);
            }
        }
        this._toDoTaskList = toDoTasks;

        let actionTaskShowCount: number = 0;
        for (let i = toDoTasks.length - 1; i >= 0; i--) {
            if (actionTaskShowCount >= 3) {
                break;
            }
            actionTaskShowCount += 1;
            const currentTask: share.Itask_data = toDoTasks[i];
            const currentStep: share.Itask_step_data = currentTask.steps[currentTask.stepIndex];
            if (currentStep == null) {
                continue;
            }
            const taskConfig = TaskConfig.getById(currentTask.taskId);
            const taskStepConfig = TaskStepConfig.getById(currentStep?.id);
            const action = instantiate(this._actionItem);
            action.active = true;
            action.getChildByName("Title").getComponent(Label).string = LanMgr.getLanById(taskConfig.name);
            action.getChildByName("SubTitle").getComponent(Label).string = taskStepConfig == null ? "" : LanMgr.getLanById(taskStepConfig.name);
            action.getChildByName("Progress").getComponent(Label).string = currentTask.stepIndex + "/" + currentTask.steps.length;
            action.getComponent(Button).clickEvents[0].customEventData = i.toString();
            action.setParent(this._actionItem.getParent());
            this._actionTaskList.push(action);
        }

        this._actionTaskView.getChildByPath("DetailButton/TaskNum").getComponent(Label).string =
            LanMgr.replaceLanById("202003", [allGettedTasks.length]) + " >>";
        // this._actionTaskView.getChildByPath("DetailButton/TaskNum").getComponent(Label).string = "All " + taskInfo.length + " Tasks";

        this._detailTaskView.active = this._isDetailShow;
        if (this._isDetailShow) {
            let showTasks: share.Itask_data[] = null;
            if (this._isDetailToDoShow) {
                showTasks = toDoTasks;
            } else {
                showTasks = finishedTasks;
            }
            showTasks.sort((a: share.Itask_data, b: share.Itask_data) => a.taskId.localeCompare(b.taskId));
            for (let i = 0; i < showTasks.length; i++) {
                const detail = instantiate(this._detailTaskItem);
                detail.active = true;

                const taskConfig = TaskConfig.getById(showTasks[i].taskId);
                if (taskConfig == null) {
                    continue;
                }
                detail.getChildByName("Label").getComponent(Label).string = LanMgr.getLanById(taskConfig.name);
                detail.getChildByName("Selected").active = i == this._detailSelectedIndex;
                detail.getComponent(Button).clickEvents[0].customEventData = i.toString();
                detail.setParent(this._detailTaskItem.getParent());
                this._detailTaskList.push(detail);
            }
            this._detailTaskItem.getParent().getComponent(Layout).updateLayout();

            if (this._detailSelectedIndex < showTasks.length) {
                this._detailTaskView.getChildByName("ProgressList").active = true;
                const currentTask: share.Itask_data = showTasks[this._detailSelectedIndex];
                if (currentTask.isFailed) {
                    const unDoneTitleItem = instantiate(this._detailProgressUndoneTitleItem);
                    unDoneTitleItem.active = true;
                    unDoneTitleItem.setParent(this._detailProgressFinishTitleItem.getParent());
                    this._detailProgressList.push(unDoneTitleItem);
                } else {
                    // check has task finished
                    // 1- finished title
                    // 2- finished task
                    // 3- todo title
                    // 4- todo task
                    const finishedDatas: { status: number; stepData: share.Itask_step_data }[] = [];
                    const todoDatas: { status: number; stepData: share.Itask_step_data }[] = [];
                    let hasFinishedTitle: boolean = false;
                    let hasToDoTitle: boolean = false;
                    for (let i = 0; i < currentTask.steps.length; i++) {
                        let currentStep = currentTask.steps[i];
                        if (i < currentTask.stepIndex) {
                            // step finished
                            if (!hasFinishedTitle) {
                                hasFinishedTitle = true;
                                finishedDatas.push({ status: 1, stepData: null });
                            }
                            finishedDatas.push({ status: 2, stepData: currentStep });
                        } else {
                            if (!hasToDoTitle) {
                                hasToDoTitle = true;
                                todoDatas.push({ status: 3, stepData: null });
                            }
                            todoDatas.push({ status: 4, stepData: currentStep });
                        }
                    }
                    for (const temple of [...finishedDatas, ...todoDatas]) {
                        if (temple.status == 1) {
                            const finishTitleItem = instantiate(this._detailProgressFinishTitleItem);
                            finishTitleItem.active = true;
                            finishTitleItem.setParent(this._detailProgressFinishTitleItem.getParent());
                            this._detailProgressList.push(finishTitleItem);
                        } else if (temple.status == 2) {
                            const stepObj = DataMgr.s.task.getTaskStep(temple.stepData.id);

                            const finish = instantiate(this._detailProgressFinishItem);
                            finish.active = true;
                            finish.setParent(this._detailProgressFinishItem.getParent());
                            finish.getChildByName("Title").getComponent(Label).string = LanMgr.getLanById(stepObj.name);
                            finish.getChildByName("Progress").getComponent(Label).string =
                                temple.stepData.completeIndex + "/" + stepObj.completeCon.conditions.length;
                            this._detailProgressList.push(finish);
                        } else if (temple.status == 3) {
                            const toDoTitleItem = instantiate(this._detailProgressToDoTitleItem);
                            toDoTitleItem.active = true;
                            toDoTitleItem.setParent(this._detailProgressToDoTitleItem.getParent());
                            this._detailProgressList.push(toDoTitleItem);
                        } else if (temple.status == 4) {
                            const stepObj = DataMgr.s.task.getTaskStep(temple.stepData.id);

                            const finish = instantiate(this._detailProgressToDoItem);
                            finish.active = true;
                            finish.setParent(this._detailProgressToDoItem.getParent());
                            finish.getChildByName("Title").getComponent(Label).string = LanMgr.getLanById(stepObj.name);
                            finish.getChildByName("Progress").getComponent(Label).string =
                                temple.stepData.completeIndex + "/" + stepObj.completeCon.conditions.length;
                            this._detailProgressList.push(finish);
                        }
                    }
                }
                this._detailProgressToDoItem.getParent().getComponent(Layout).updateLayout();
            } else {
                this._detailTaskView.getChildByName("ProgressList").active = false;
            }
            this._toDoButton.getChildByName("Focus").active = this._isDetailToDoShow;
            this._toDoButton.getChildByName("Common").active = !this._isDetailToDoShow;
            this._toDoButton.getChildByName("Label").getComponent(Label).color = this._isDetailToDoShow
                ? new Color(66, 53, 36, 255)
                : new Color(123, 115, 112, 255);

            this._completedButton.getChildByName("Focus").active = !this._isDetailToDoShow;
            this._completedButton.getChildByName("Common").active = this._isDetailToDoShow;
            this._completedButton.getChildByName("Label").getComponent(Label).color = !this._isDetailToDoShow
                ? new Color(66, 53, 36, 255)
                : new Color(123, 115, 112, 255);
        }
    }

    private _isDetailShow: boolean = false;
    private _isDetailToDoShow: boolean = true;
    private _toDoTaskList: share.Itask_data[] = [];
    private _detailSelectedIndex: number = 0;

    private _actionTaskList: Node[] = [];
    private _detailTaskList: Node[] = [];
    private _detailProgressList: Node[] = [];

    private _actionTaskView: Node = null;
    private _detailTaskView: Node = null;
    private _actionItem: Node = null;
    private _detailTaskItem: Node = null;
    private _detailProgressFinishTitleItem: Node = null;
    private _detailProgressToDoTitleItem: Node = null;
    private _detailProgressUndoneTitleItem: Node = null;
    private _detailProgressFinishItem: Node = null;
    private _detailProgressToDoItem: Node = null;

    private _toDoButton: Node = null;
    private _completedButton: Node = null;

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._actionTaskView = this.node.getChildByName("ActionTaskView");
        this._detailTaskView = this.node.getChildByName("TaskDetailView");

        this._actionItem = this._actionTaskView.getChildByPath("List/Item");
        this._actionItem.active = false;

        this._detailTaskItem = this._detailTaskView.getChildByPath("TaskList/view/content/Item");
        this._detailTaskItem.active = false;

        this._detailProgressFinishTitleItem = this._detailTaskView.getChildByPath("ProgressList/view/content/FinishTitle");
        this._detailProgressFinishTitleItem.active = false;
        this._detailProgressToDoTitleItem = this._detailTaskView.getChildByPath("ProgressList/view/content/ToDoTitle");
        this._detailProgressToDoTitleItem.active = false;
        this._detailProgressUndoneTitleItem = this._detailTaskView.getChildByPath("ProgressList/view/content/UnDoneTitle");
        this._detailProgressUndoneTitleItem.active = false;
        this._detailProgressFinishItem = this._detailTaskView.getChildByPath("ProgressList/view/content/FinishedItem");
        this._detailProgressFinishItem.active = false;
        this._detailProgressToDoItem = this._detailTaskView.getChildByPath("ProgressList/view/content/ToDoItem");
        this._detailProgressToDoItem.active = false;

        this._toDoButton = this.node.getChildByPath("TaskDetailView/ToDoButton");
        this._completedButton = this.node.getChildByPath("TaskDetailView/CompletedButton");
    }

    protected viewDidStart(): void {
        super.viewDidStart();

        NotificationMgr.addListener(NotificationName.CHANGE_LANG, this.refreshUI, this);
        NotificationMgr.addListener(NotificationName.TASK_DID_CHANGE, this.refreshUI, this);
        NotificationMgr.addListener(NotificationName.TASK_LIST, this.refreshUI, this);

        this.refreshUI();
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.CHANGE_LANG, this.refreshUI, this);
        NotificationMgr.removeListener(NotificationName.TASK_DID_CHANGE, this.refreshUI, this);
        NotificationMgr.removeListener(NotificationName.TASK_LIST, this.refreshUI, this);
    }
    //---------------------------------------------------
    // action
    private onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.popPanel(this.node);
    }
    private onTapShowDetail() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._isDetailShow) {
            return;
        }
        this._isDetailShow = true;
        this._detailSelectedIndex = 0;
        this.refreshUI();
    }
    private onTapActionItem(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const index = parseInt(customEventData);
        if (index >= this._toDoTaskList.length) {
            return;
        }
        const templeTask: share.Itask_data = this._toDoTaskList[index];
        const currentStepTask: TaskStepObject = DataMgr.s.task.getTaskStep(templeTask.steps[templeTask.stepIndex].id);
        if (currentStepTask == null) {
            return;
        }
        let condition: TaskCondition = null;
        if (currentStepTask.completeCon != null && currentStepTask.completeCon.conditions.length > 0) {
            condition = currentStepTask.completeCon.conditions[0];
        }
        if (condition == null) {
            return;
        }
        let currentMapPos: Vec2 = null;
        if (condition.type == TaskConditionType.Talk) {
            let targetPioneer: MapNpcPioneerObject = null;
            const allNpcs = DataMgr.s.pioneer.getAllNpcs();
            for (const npc of allNpcs) {
                if (npc.talkId == condition.talk.talkId) {
                    targetPioneer = npc;
                    break;
                }
            }
            if (targetPioneer != null) {
                currentMapPos = targetPioneer.stayPos;
            }
        } else if (condition.type == TaskConditionType.Kill) {
            let targetPioneer: MapPioneerObject = null;
            if (condition.kill.enemyIds.length > 0) {
                targetPioneer = DataMgr.s.pioneer.getById(condition.kill.enemyIds[CommonTools.getRandomInt(0, condition.kill.enemyIds.length - 1)]);
            }
            if (targetPioneer != null) {
                currentMapPos = targetPioneer.stayPos;
            }
        }
        if (currentMapPos != null) {
            if (!GameMainHelper.instance.isGameShowOuter) {
                GameMainHelper.instance.changeInnerAndOuterShow();
            }
            GameMainHelper.instance.changeGameCameraWorldPosition(GameMainHelper.instance.tiledMapGetPosWorld(currentMapPos.x, currentMapPos.y), true);
        }
    }
    private onTapCloseDetail() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (!this._isDetailShow) {
            return;
        }
        this._isDetailShow = false;
        this.refreshUI();
    }
    private onTapDetailToDo() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._isDetailToDoShow) {
            return;
        }
        this._isDetailToDoShow = true;
        this._detailSelectedIndex = 0;
        this.refreshUI();
    }
    private onTapDetailCompleted() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (!this._isDetailToDoShow) {
            return;
        }
        this._isDetailToDoShow = false;
        this._detailSelectedIndex = 0;

        this.refreshUI();
    }
    private onTapDetailTaskItem(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const index = parseInt(customEventData);
        if (index == this._detailSelectedIndex) {
            return;
        }
        this._detailSelectedIndex = index;
        this.refreshUI();
    }
}
