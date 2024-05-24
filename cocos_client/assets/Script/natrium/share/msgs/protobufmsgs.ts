// natrium
// license : MIT
// author : Sean Chen

export enum protobuf_c2s {
    login = 1,
    create_player = 2,
    enter_game = 3,
    save_archives = 4,

    get_pending = 119,
    upload_pending = 121,
    get_pending_history = 122,
    get_block_height = 124,
    get_pioneer_info = 125,

    player_move = 200,
    player_talk_select = 201,

    player_explore = 203,
    player_fight = 204,
    player_event_select = 205,
    player_item_use = 206,
    player_treasure_open = 207,
    player_artifact_equip = 208,
    player_artifact_remove = 209,
    player_building_levelup = 210,
    player_get_auto_energy = 211,
    player_generate_energy = 212,
    player_building_delegate_nft = 214,
    player_point_treasure_open = 215,
    player_nft_lvlup = 216,
    player_nft_rankup = 217,
    player_nft_skill_learn = 218,
    player_nft_skill_forget = 219,
    player_world_treasure_lottery = 220,
    player_add_heat_value = 221,
    player_rookie_finish = 222,
    player_wormhole_set_defender = 223,
    player_wormhole_set_attacker = 224,
    player_bind_nft = 226,
    player_pioneer_change_show = 227,
    player_event = 228,
    get_treasure_info = 229,
    get_user_task_info = 230,
    reborn_all = 231,
    get_battle_report = 299,

    fetch_user_psyc = 400,

    player_gather_start = 500,

    player_explore_start = 510,
    player_explore_npc_start = 511,
    player_explore_gangster_start = 512,
    player_generate_troop_start = 513,

    player_fight_start = 520,

    player_wormhole_fight_start = 530,
}

export enum protobuf_s2c {
    server_error = 10000,
    login_res = 10001,
    create_player_res = 10002,
    enter_game_res = 10003,
    save_archives_res = 10004,

    get_pending_res = 10135,
    pending_change = 10136,
    upload_pending_res = 10138,
    get_pending_history_res = 10139,
    get_block_height_res = 10142,
    get_pioneer_info_res = 10143,
    pioneer_change = 10144,
    mapbuilding_change = 10145,
    building_change = 10146,
    nft_change = 10147,
    sinfo_change = 10148,

    player_move_res = 20000,
    player_talk_select_res = 20201,

    player_explore_res = 20203,
    player_fight_res = 20204,
    player_event_select_res = 20205,
    player_item_use_res = 20206,
    player_treasure_open_res = 20207,
    player_artifact_equip_res = 20208,
    player_artifact_remove_res = 20209,
    player_building_levelup_res = 20210,
    player_get_auto_energy_res = 20211,
    player_generate_energy_res = 20212,
    player_building_delegate_nft_res = 20214,
    player_point_treasure_open_res = 20215,
    player_nft_lvlup_res = 20216,
    player_nft_rankup_res = 20217,
    player_nft_skill_learn_res = 20218,
    player_nft_skill_forget_res = 20219,
    player_world_treasure_lottery_res = 20220,
    player_heat_value_change_res = 20221,
    player_world_treasure_pool_change_res = 20222,
    player_add_heat_value_res = 20223,
    player_rookie_finish_res = 20224,
    player_wormhole_set_defender_res = 20225,
    player_wormhole_set_attacker_res = 20226,
    player_bind_nft_res = 20228,
    player_pioneer_change_show_res = 20229,
    player_event_res = 20230,
    get_treasure_info_res = 20231,
    get_user_task_info_res = 20232,
    get_battle_report_res = 20299,

    storhouse_change = 20300,
    player_exp_change = 20301,
    player_treasure_progress_change = 20302,
    player_actiontype_change = 20303,
    artifact_change = 20304,

    fetch_user_psyc_res = 20400,

    player_heat_change = 20500,
    player_map_building_show_change = 20501,
    player_map_pioneer_show_change = 20502,

    user_task_did_change = 20503,

    user_task_action_talk = 20508,
    player_map_building_faction_change = 20509,
    player_map_pioneer_faction_change = 20510,
    user_task_action_getnewtalk = 20511,
    reborn_all_res = 20512,
    mappioneer_reborn_change = 20513,
    mapbuilding_reborn_change = 20514,
    pioneer_reborn_res = 20515,

    player_lvlup_change = 30100,

    player_gather_start_res = 50000,

    player_explore_start_res = 50010,
    player_explore_npc_start_res = 50011,
    player_explore_gangster_start_res = 50012,
    player_generate_troop_start_res = 50213,

    player_fight_start_res = 50020,

    player_wormhole_fight_start_res = 50030,
    player_wormhole_fight_attacked_res = 50031,
    player_wormhole_fight_res = 50032,
}
