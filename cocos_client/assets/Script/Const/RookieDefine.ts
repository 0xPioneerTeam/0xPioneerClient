export enum RookieStep {
    WAKE_UP = 0,

    NPC_TALK_1 = 10,

    REPAIR_CITY = 15,


    FINISH = 999999,
}

export enum RookieStepState {
    DOING = 0,
    FINISH = 1,
}

export enum RookieResourceAnim {
    PIONEER_0_TO_GOLD,
    GOLD_TO_HEAT,
    BOX_1_TO_PSYC,
    BOX_2_TO_PSYC,
    BOX_3_TO_PSYC,
}

export interface RookieResourceAnimStruct {
    animType: RookieResourceAnim;
    callback: () => void;
}

export enum RookieTapPositionType {
    DIALOG,
    BUTTON,
    NORMAL,
}
