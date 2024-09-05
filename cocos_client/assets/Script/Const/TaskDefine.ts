import { GetPropData, MapMemberFactionType, MapMemberTargetType } from "./ConstDefine";

export interface TaskConfigData {
    id: string;
    name: string;
    type: number;
    pre_con: [][];
    pre_action: [][];
    close_con: [][];
    take_con: [number, any[]];
    fail_con: [][];
    steps: string[];
}

export interface TaskStepConfigData {
    id: string;
    name: string;
    start_action: [][];
    complete_con: [][];
    complete_action: [][];
    quit_con: [][];
    progress: number;
    exp: number;
}

export enum TaskUseTimeType {
    Disposable = 1,
    Repeatable = 2,
}

export enum TaskParentChildType {
    Parent = 0,
    Child = 1,
}

export enum TaskFinishResultType {
    Success = 0,
    Fail = 1,
}
export enum TaskShowHideStatus {
    hide = 0,
    show = 1,
}

export enum TaskConditionSatisfyType {
    All = 1,
    Any = 2,
}
export enum TaskConditionType {
    Talk = 1,
    Finish = 2,
    Kill = 3,
    ShowHide = 4,
    GameStart = 5,
    interact = 6,
    innerBuildingLevelUp = 7,
}

export interface TaskTalkCondition {
    talkId: string;
    talkSelectCanGetTaskIndex: number;
}
export interface TaskFinishCondition {
    type: TaskParentChildType;
    taskId: string;
    taskResult: TaskFinishResultType;
    finishTime: number;
}
export interface TaskKillCondition {
    target: MapMemberTargetType;
    enemyIds: string[];
    killTime: number;
}
export interface TaskShowHideCondition {
    type: MapMemberTargetType;
    id: string;
    status: TaskShowHideStatus;
}
export interface TaskInteractCondition {
    target: MapMemberTargetType;
    interactId: string;
    interactTime: number;
}
export interface TaskInnerBuildingLevelUpCondition {
    innerBuildingId: string;
    level: number;
}
export interface TaskCondition {
    type: TaskConditionType;
    isSatisfied?: boolean;
    talk?: TaskTalkCondition;
    finish?: TaskFinishCondition;
    kill?: TaskKillCondition;
    showHide?: TaskShowHideCondition;
    interact?: TaskInteractCondition;
    innerBuildingLevelUp?: TaskInnerBuildingLevelUpCondition;
}
export interface TaskSatisfyCondition {
    satisfyType: TaskConditionSatisfyType;
    conditions: TaskCondition[];
}

export enum TaskActionType {
    ShowHide = 1,
    Faction = 2,
    Talk = 3,
    GetProp = 4,
    NpcGetNewTalk = 5,
}

export interface TaskShowHideAction {
    type: MapMemberTargetType;
    id: string;
    status: TaskShowHideStatus;
    delayTime: number;
}
export interface TaskFactionAction {
    type: MapMemberTargetType;
    id: string;
    faction: MapMemberFactionType;
}
export interface MapBuildingFactionAction {
    buildingId: string;
    faction: MapMemberFactionType;
}
export interface PioneerFactionAction {
    pioneerId: string;
    faction: MapMemberFactionType;
}

export interface TaskTalkAction {
    talkId: string;
}
export interface TaskNpcGetNewTalkAction {
    talkId: string;
    npcId: string;
    delayTime?: number;
}

export interface TaskAction {
    type: TaskActionType;
    showHide?: TaskShowHideAction;
    faction?: TaskFactionAction;
    talk?: TaskTalkAction;
    getProp?: GetPropData;
    npcGetNewTalk?: TaskNpcGetNewTalkAction;
}

export interface TaskStepObject {
    id: string;
    name: string;
    startAction: TaskAction[];
    completeCon: TaskSatisfyCondition;
    completeIndex: number;
    completeAction: TaskAction[];
    quitCon: TaskSatisfyCondition;
    progress: number;
    exp: number;
}

//---------------------------- Missioin
export type MissionObjectiveType = number;
export type MissionObjectiveParamNum = number;
export interface MissionConfigData {
    id: string;
    name: string;
    description: string;
    start: number[];
    objective: [MissionObjectiveType, [any, MissionObjectiveParamNum]];
    reward: any[];
    open_quest: string[];
}
