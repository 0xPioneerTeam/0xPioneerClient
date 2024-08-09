import NotificationMgr from "../../Basic/NotificationMgr";
import TaskStepConfig from "../../Config/TaskStepConfig";
import { GetPropData } from "../../Const/ConstDefine";
import { NotificationName } from "../../Const/Notification";
import {
    TaskStepConfigData,
    TaskAction,
    TaskCondition,
    TaskConditionType,
    TaskFinishCondition,
    TaskKillCondition,
    TaskSatisfyCondition,
    TaskShowHideCondition,
    TaskTalkCondition,
    TaskActionType,
    TaskFactionAction,
    TaskNpcGetNewTalkAction,
    TaskShowHideAction,
    TaskTalkAction,
    TaskStepObject,
    TaskInteractCondition,
    TaskInnerBuildingLevelUpCondition,
} from "../../Const/TaskDefine";
import { share } from "../../Net/msg/WebsocketMsg";
import NetGlobalData from "./Data/NetGlobalData";

export default class TaskDataMgr {
    private _data: share.Itask_info_data[] = [];
    private _canTalkData: { [key: string]: share.Itask_talk_data } = {};
    private _taskStepMap: Map<string, TaskStepObject> = new Map();
    public constructor() {}
    //--------------------------------
    public loadObj() {
        this._initData();
    }
    //--------------------------------
    public getCanTalkData() {
        return this._canTalkData;   
    }
    public getAll(): share.Itask_info_data[] {
        return this._data;
    }
    public getAllGettedTasks(): share.Itask_info_data[] {
        return this._data.filter((task) => task.isGetted);
    }
    public getAllDoingTasks(): share.Itask_info_data[] {
        return this._data.filter((task) => task.isGetted && !task.isFinished && !task.isFailed);
    }
    public getTask(taskId: string): share.Itask_info_data | null {
        const models = this._data.filter((temple) => temple.taskId == taskId);
        if (models.length > 0) {
            return models[0];
        }
        return null;
    }
    public getTaskStep(taskStepId: string): TaskStepObject | null {
        if (this._taskStepMap.has(taskStepId)) {
            return this._taskStepMap.get(taskStepId);
        }
        const config: TaskStepConfigData = TaskStepConfig.getById(taskStepId);
        if (config == null) {
            return null;
        }
        return this._convertTaskStepConfigToObject(config);
    }
    //--------------------------------
    public updateCanTalkData(canTalkData: { [key: string]: share.Itask_talk_data }) {
        this._canTalkData = canTalkData;
        NotificationMgr.triggerEvent(NotificationName.TASK_CAN_TALK_CHANGE);
    }
    //--------------------------------
    private _initData() {
        this._data = NetGlobalData.taskinfo.tasks;
        this._canTalkData = NetGlobalData.taskinfo.canTalkData;
    }
    // private _convertTaskConfigToObject(config: TaskConfigData): share.Itask_data {
    //     const preAction: TaskAction[] = [];
    //     if (config.pre_action != null) {
    //         for (const action of config.pre_action) {
    //             preAction.push(this._convertActionConfigToObject(action));
    //         }
    //     }
    //     return {
    //         taskId: config.id,
    //         name: config.name,
    //         type: config.type,
    //         preCon: this._convertConditionConfigToObject(config.pre_con),
    //         preAction: preAction,
    //         closeCon: this._convertConditionConfigToObject(config.close_con),
    //         takeCon: this._convertConditionConfigToObject(config.take_con),
    //         failCon: this._convertConditionConfigToObject(config.fail_con),
    //         steps: config.steps,
    //         stepIndex: 0,
    //         isFinished: false,
    //         isFailed: false,
    //         canGet: true,
    //         isGetted: false,
    //     };
    // }
    private _convertConditionConfigToObject(conditionConfig: any[]): TaskSatisfyCondition {
        if (conditionConfig == null || conditionConfig.length <= 0) {
            return null;
        }
        const satisfyType = conditionConfig[0];
        const conditions: TaskCondition[] = [];
        if (conditionConfig.length > 1) {
            for (let i = 1; i < conditionConfig.length; i++) {
                const temple = conditionConfig[i];
                const conditionType = temple[0];

                let talk: TaskTalkCondition = null;
                let finish: TaskFinishCondition = null;
                let kill: TaskKillCondition = null;
                let showHide: TaskShowHideCondition = null;
                let interact: TaskInteractCondition = null;
                let innerBuildingLevelUp: TaskInnerBuildingLevelUpCondition = null;
                if (conditionType == TaskConditionType.Talk) {
                    talk = {
                        talkId: temple[1],
                        talkSelectCanGetTaskIndex: temple[2],
                    };
                } else if (conditionType == TaskConditionType.Finish) {
                    finish = {
                        type: temple[1],
                        taskId: temple[2],
                        taskResult: temple[3],
                        finishTime: temple[4],
                    };
                } else if (conditionType == TaskConditionType.Kill) {
                    kill = {
                        target: temple[1],
                        enemyIds: temple[2],
                        killTime: temple[3],
                    };
                } else if (conditionType == TaskConditionType.ShowHide) {
                    showHide = {
                        type: temple[1],
                        id: temple[2],
                        status: temple[3],
                    };
                } else if (conditionType == TaskConditionType.interact) {
                    interact = {
                        target: temple[1],
                        interactId: temple[2],
                        interactTime: temple[3],
                    };
                } else if (conditionType == TaskConditionType.innerBuildingLevelUp) {
                    innerBuildingLevelUp = {
                        innerBuildingId: temple[1],
                        level: temple[2],
                    };
                }
                conditions.push({
                    type: conditionType,
                    isSatisfied: false,
                    talk: talk,
                    finish: finish,
                    kill: kill,
                    showHide: showHide,
                    interact: interact,
                    innerBuildingLevelUp: innerBuildingLevelUp,
                });
            }
        }
        return {
            satisfyType: satisfyType,
            conditions: conditions,
        };
    }
    private _convertActionConfigToObject(actionConfig: any[]): TaskAction {
        const actionType: TaskActionType = actionConfig[0];

        let showHide: TaskShowHideAction = null;
        let faction: TaskFactionAction = null;
        let talk: TaskTalkAction = null;
        let getProp: GetPropData = null;
        let npcGetNewTalk: TaskNpcGetNewTalkAction = null;
        if (actionType == TaskActionType.ShowHide) {
            showHide = {
                type: actionConfig[1],
                id: actionConfig[2],
                status: actionConfig[3],
                delayTime: actionConfig[4],
            };
        } else if (actionType == TaskActionType.Faction) {
            faction = {
                type: actionConfig[1],
                id: actionConfig[2],
                faction: actionConfig[3],
            };
        } else if (actionType == TaskActionType.Talk) {
            talk = {
                talkId: actionConfig[1],
            };
        } else if (actionType == TaskActionType.GetProp) {
            getProp = {
                type: actionConfig[1],
                propId: actionConfig[2],
                num: actionConfig[3],
            };
        } else if (actionType == TaskActionType.NpcGetNewTalk) {
            npcGetNewTalk = {
                talkId: actionConfig[1],
                npcId: actionConfig[2],
                delayTime: actionConfig[3],
            };
        }

        return {
            type: actionType,
            showHide: showHide,
            faction: faction,
            talk: talk,
            getProp: getProp,
            npcGetNewTalk: npcGetNewTalk,
        };
    }
    private _convertTaskStepConfigToObject(config: TaskStepConfigData): TaskStepObject {
        const startAction: TaskAction[] = [];
        if (config.start_action != null) {
            for (const action of config.start_action) {
                startAction.push(this._convertActionConfigToObject(action));
            }
        }

        const completeAction: TaskAction[] = [];
        if (config.complete_action != null) {
            for (const action of config.complete_action) {
                completeAction.push(this._convertActionConfigToObject(action));
            }
        }

        return {
            id: config.id,
            name: config.name,
            startAction: startAction,
            completeCon: this._convertConditionConfigToObject(config.complete_con),
            completeAction: completeAction,
            quitCon: this._convertConditionConfigToObject(config.quit_con),
            progress: config.progress,
            exp: config.exp,
            completeIndex: 0,
        };
    }
}
