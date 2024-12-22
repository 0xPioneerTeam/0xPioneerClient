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
