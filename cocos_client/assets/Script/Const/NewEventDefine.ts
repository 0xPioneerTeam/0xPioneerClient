export interface NewEventConfigData {
    id: string;
    name: string;
    level: string;
    narrator: string;
    sub_event: number[][];
}

export interface NewSubEventConfigData {
    id: string;
    name: string;
    type: NewSubEventParam;
    narrator: string;
    des_a: string;
    detail_a: string;
    des_b: string;
    detail_b: string;
    illu_type: number;
    illu: number;
}

export type NewSubEventParam =
    | NewEventFightParam
    | NewEventSelectParam
    | NewEventSpaParam
    | NewEventBoxParam
    | NewEventSpiderNestParam
    | NewEventLionParam
    | NewEventBeastParam
    | NewEventBehemothsParam
    | NewEventExcavationParam;

export type NewEventRandomMonsterIds = string[];
export type NewEventMonsterLevel = number;
export type NewEventRandomSelectIds = string[];
export type NewEventRewardInfo = [string, number];
export type NewEventRecoveryMaxHpRate = number;
export type NewEventCostFoodNum = number;
export type NewEventGetFoodNum = number;
export type NewEventMonsterHpRateNum = number;
export type NewEventCostMaxHpRate = number;

export type NewEventFightParam = [MapNewEventType, NewEventRandomMonsterIds, NewEventMonsterLevel];

export type NewEventSelectParam = [MapNewEventType, NewEventRandomSelectIds, NewEventRandomSelectIds];

export type NewEventSpaParam = [MapNewEventType, number];

export type NewEventBoxParam = [MapNewEventType, NewEventRewardInfo[]];

export type NewEventSpiderNestParam = [MapNewEventType, NewEventRecoveryMaxHpRate, NewEventMonsterLevel, NewEventRandomMonsterIds, NewEventRewardInfo[]];

export type NewEventLionParam = [MapNewEventType, NewEventCostFoodNum, NewEventMonsterLevel, NewEventRandomMonsterIds, NewEventRewardInfo[]];

export type NewEventBeastParam = [MapNewEventType, NewEventGetFoodNum, NewEventMonsterLevel, NewEventRandomMonsterIds, NewEventRewardInfo[]];

export type NewEventBehemothsParam = [
    MapNewEventType,
    NewEventMonsterLevel,
    NewEventRandomMonsterIds,
    NewEventMonsterHpRateNum,
    NewEventMonsterLevel,
    NewEventRandomMonsterIds,
    NewEventMonsterHpRateNum,
    NewEventRewardInfo[],
    NewEventRewardInfo[]
];

export type NewEventExcavationParam = [MapNewEventType, NewEventCostMaxHpRate, NewEventRewardInfo[]];

export enum MapNewEventType {
    Fight = 1,
    Select = 2,
    Spa = 6,
    Box = 7,
    SpiderNest = 10,
    Lions = 11,
    MigratoryBeast = 12,
    BehemothsBattle = 13,
    Excavation = 14,
}
