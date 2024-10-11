export type rank_reward_begin_index = number;
export type rank_reward_end_index = number;
export type rank_reward_id = number;
export type rank_reward_num = number;
export enum rank_season_type {
    daily = 1,
    monthly = 2,
    season = 3,
}
export enum rank_type {
    explore = 1,
    fight = 2,
    psyc = 3,
}

export interface rank_reward_config {
    id: string;
    season_type: rank_season_type;
    ranking_type: rank_type;
    ranking_lower: number;
    ranking_upper: number;
    reward: [[rank_reward_id, rank_reward_num]];
    minimum: number;
}

export interface rank_data {
    type: rank_season_type;
    open: boolean;
    begin_time: number;
    end_time: number;
    explore_open: boolean;
    fight_open: boolean;
    psyc_open: boolean;
}

export interface rank_reward_data {
    type: rank_season_type;
    ranking_type: rank_type;
    member_limit: number;
    rewards: [rank_reward_begin_index, rank_reward_end_index, [[rank_reward_id, rank_reward_num]]][];
}
