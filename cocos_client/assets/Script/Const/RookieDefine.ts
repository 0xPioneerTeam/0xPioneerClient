export enum RookieStep {
    WAKE_UP = 0,

    NPC_TALK_1 = 1000,

    REPAIR_CITY = 1001,

    GUIDE_1002 = 1002,
    GUIDE_1003 = 1003,
    GUIDE_1004 = 1004,
    GUIDE_1005 = 1005,
    GUIDE_1006 = 1006,
    GUIDE_1007 = 1007,
    GUIDE_1008 = 1008,
    GUIDE_1009 = 1009,
    GUIDE_1010 = 1010,
    GUIDE_1011 = 1011,
    GUIDE_1012 = 1012,

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
