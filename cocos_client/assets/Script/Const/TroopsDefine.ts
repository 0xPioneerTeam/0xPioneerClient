export interface TroopsConfigData {
    id: string;
    name: string;
    desc: string;
    time_training: string;
    rec_cost_training: [string, number][];
    hp_training: string;
    icon: string;
}

export interface TroopExerciseObject {
    id: string;
    name: string;
    icon: string;
    locked: boolean;
    ownedNum: number;
    exerciseNum: number;
    costTime: number;
    hpRate: number;
    costResource: [string, number][];
}
