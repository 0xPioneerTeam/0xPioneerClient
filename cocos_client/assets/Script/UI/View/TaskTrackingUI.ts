import { _decorator, Button, Component, Label, Node, ProgressBar, Sprite, Tween, tween, TweenAction, v3, Vec2 } from "cc";
import { share } from "../../Net/msg/WebsocketMsg";
import { DataMgr } from "../../Data/DataMgr";
import { GameMgr, LanMgr } from "../../Utils/Global";
import TaskConfig from "../../Config/TaskConfig";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import { TaskStepObject } from "../../Const/TaskDefine";
import GameMainHelper from "../../Game/Helper/GameMainHelper";
const { ccclass, property } = _decorator;

@ccclass("TaskTrackingUI")
export class TaskTrackingUI extends Component {
    private _doingTask: share.Itask_info_data[] = [];
    private _isShow: boolean = false;
    private _showIndex: number = 0;
    private _currentTween: Tween<Node> = null;
    private _isPlayingTaskFinishAnim: boolean = false;

    private _contentView: Node = null;
    private _titleLabel: Label = null;
    private _progress: ProgressBar = null;
    private _progressValueUse: Label = null;
    private _progressValueLimit: Label = null;
    private _showNextButton: Node = null;

    private _finishTip: Node = null;

    protected onLoad(): void {
        this._contentView = this.node.getChildByPath("Content");
        this._titleLabel = this._contentView.getChildByPath("Title").getComponent(Label);
        this._progress = this._contentView.getChildByPath("ProgressBar").getComponent(ProgressBar);
        this._progressValueUse = this._progress.node.getChildByPath("Value/use").getComponent(Label);
        this._progressValueLimit = this._progress.node.getChildByPath("Value/limit").getComponent(Label);
        this._showNextButton = this._contentView.getChildByPath("NextButton");

        this._finishTip = this._contentView.getChildByPath("FinishTip");
        this._finishTip.active = false;

        NotificationMgr.addListener(NotificationName.TASK_DID_CHANGE, this._onTaskChange, this);
        NotificationMgr.addListener(NotificationName.TASK_LIST, this._onTaskChange, this);
    }

    start() {
        this._contentView.scale = v3(0, 1, 1);
        this._doingTask = DataMgr.s.task.getAllDoingTasks().slice();
        this._refreshUI();
    }

    update(deltaTime: number) {}

    protected onDestroy(): void {
        NotificationMgr.removeListener(NotificationName.TASK_DID_CHANGE, this._onTaskChange, this);
        NotificationMgr.removeListener(NotificationName.TASK_LIST, this._onTaskChange, this);
    }

    private _refreshUI() {
        if (this._isPlayingTaskFinishAnim) {
            return;
        }
        const needShow: boolean = this._doingTask.length > 0;

        this._showNextButton.active = true;

        if (this._doingTask.length > 0) {
            this._titleLabel.node.active = true;
            this._progress.node.active = true;
            this._finishTip.active = false;

            if (this._showIndex > this._doingTask.length - 1) {
                this._showIndex = 0;
            }
            const task = this._doingTask[this._showIndex];
            
            // ORIGINAL CODE
            const taskConfig = TaskConfig.getById(task.taskId);
            if (taskConfig != null) {
                this._titleLabel.string = LanMgr.getLanById(taskConfig.name);
                this._progress.progress = task.stepIndex / task.steps.length;
                this._progressValueUse.string = task.stepIndex.toString();
                this._progressValueLimit.string = task.steps.length.toString();
            }
            

            // CHANGE TASK PROGRESS TO TASK STEP PROGRESS
            
            // const currentTaskStep = task.steps[task.stepIndex];
            // if (currentTaskStep == null) {
            //     return;
            // }
            // const stepObj = DataMgr.s.task.getTaskStep(currentTaskStep.id);
            // if (stepObj != null) {
            //     this._titleLabel.string = LanMgr.getLanById(stepObj.name);
            //     this._progress.progress = currentTaskStep.completeIndex / stepObj.completeCon.conditions.length;
            //     this._progressValueUse.string = currentTaskStep.completeIndex.toString();
            //     this._progressValueLimit.string = stepObj.completeCon.conditions.length.toString();
            // }
            this._showNextButton.getComponent(Sprite).grayscale = !(this._doingTask.length > 1);
            this._showNextButton.getComponent(Button).interactable = this._doingTask.length > 1;
        }
        this._changeContentShow(needShow);
    }

    private _changeContentShow(needShow: boolean, callback: () => void = null) {
        if (this._isShow != needShow) {
            this._isShow = needShow;
            if (this._currentTween != null) {
                this._currentTween.stop();
                this._currentTween = null;
            }
            if (this._isShow) {
                this._contentView.scale = v3(0, 1, 1);
            } else {
                this._contentView.scale = v3(1, 1, 1);
            }
            this._currentTween = tween()
                .target(this._contentView)
                .to(1.0, { scale: this._isShow ? v3(1, 1, 1) : v3(0, 1, 1) }, { easing: this._isShow ? "sineOut" : "sineIn" })
                .call(() => {
                    if (callback != null) {
                        callback();
                    }
                })
                .start();
        }
    }

    //--------------------------- action
    private onTapShowNext() {
        GameMusicPlayMgr.playTapButtonEffect();
        this._showIndex += 1;
        if (this._showIndex > this._doingTask.length - 1) {
            this._showIndex = 0;
        }
        this._refreshUI();
        GameMainHelper.instance.hideTrackingView();
    }
    private onTapTask() {
        GameMusicPlayMgr.playTapButtonEffect();
        const templeTask: share.Itask_info_data = this._doingTask[this._showIndex];
        const currentStepTask: TaskStepObject = DataMgr.s.task.getTaskStep(templeTask.steps[templeTask.stepIndex].id);
        GameMgr.taskTracking(currentStepTask);
    }

    //--------------------------- notification
    private _onTaskChange() {
        const originalTaskNum: number = this._doingTask.length;
        this._doingTask = DataMgr.s.task.getAllDoingTasks().slice();
        if (this._doingTask.length < originalTaskNum) {
            this._isPlayingTaskFinishAnim = true;

            this._titleLabel.node.active = false;
            this._progress.node.active = false;
            this._showNextButton.active = false;

            this._finishTip.active = true;
            this._finishTip.scale = v3(2, 2, 2);
            this._finishTip.position = v3(250, 170, 0);
            tween()
                .target(this._finishTip)
                .to(1.0, { scale: v3(1, 1, 1), position: v3(0, 0, 0) }, { easing: "sineIn" })
                .call(() => {
                    this._changeContentShow(false, () => {
                        this._isPlayingTaskFinishAnim = false;
                        this._doingTask = DataMgr.s.task.getAllDoingTasks().slice();
                        this._refreshUI();
                    });
                })
                .start();
        } else {
            this._refreshUI();
        }
    }
}
