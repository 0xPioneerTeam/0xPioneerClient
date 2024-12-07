export enum IdleType {
    Fight = 1,
    Collection = 2,
}

export enum IdleStatus {
    Wait = 0,
    Doing = 1,
    Finish = 2,
}

export class IdleItemData {
    id: string;
    status: IdleStatus; // 0-normal,1-equipped,2-forbidden
    startTime: number;
    duration: number;
    type: IdleType;
    reward: [[string, number]];
    cost: [string, number];
}
