export interface WarOrderConfigData {
    id: string;
    exp: number;
    freererward: [string, number];
    highrward: [string, number];
}

export interface WarOrderTaskConfigData {
    id: string;
    description: string;
    type: [number];
    objective: [number, [number]];
    exp: [number];
    finished?: number;
    value?: number;
    total?: number;
}

export interface BattlePass {
    res?: number;
    endTime?: string;
    exp?: number;
    unLock?: boolean;
    dailyTasks: BattlePassTask[];
    weeklyTasks: BattlePassTask[];
    seasonTasks: BattlePassTask[];
    freeRewardMaxId?: string;
    highRewardMaxId?: string;
}

export interface BattlePassTask {
    id: string;
    type: number;
    value: number;
    total: number;
    finished: boolean;
    exp: number;
}
