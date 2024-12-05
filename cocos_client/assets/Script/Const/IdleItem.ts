export enum IdleType {
    Fight = 0,
    Collection = 1,

}

export enum IdleStatus {
    Wait = 0,
    Doing = 1,
    Finish = 2,
}

export class IdleItemData {
    status: IdleStatus;// 0-normal,1-equipped,2-forbidden
    startTime:number;
    duration:number;

    type: IdleType;


}
