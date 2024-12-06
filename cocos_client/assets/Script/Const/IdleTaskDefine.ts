export interface IdleTaskConfigData {
    id: string;
    type: number;
    name: string;
    description: string;
    duration: number;
    reward: [[string, number]];
}