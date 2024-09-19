// natrium
// license : MIT
// author : Sean Chen

export enum protobuf_c2s {
    login = 1,
    create_player = 2,
    enter_game = 3,
    update_name = 4,

    goto = 100,
    stop = 101,
    stophome = 102,
    changemap_begin = 103,
    changemap_end = 104,

    // ------ map ------
    get_map_info = 200,

    // ------ rookie ------
    player_rookie_update = 300,
    player_rookie_wormhole_fight = 301,
    player_get_rookie_award = 302,

    // ------ chain ------
    get_pending = 400,
    upload_pending = 401,
    get_pending_history = 402,
    get_block_height = 403,
    check_unused_tx_status = 404,

    // ------ get data ------
    get_battle_report = 500,
    get_user_settlement_info = 501,
    get_new_battle_report = 502,

    // ------ player ------
    // player: talk
    player_talk_select = 600,
    // player: piot2heat
    player_piot_to_heat = 601,
    // player: level
    player_level_reward = 602,
    player_level_up = 603,
    // player: psyc2energy
    player_psyc_to_energy = 604,
    // player: troop2hp
    player_troop_to_hp = 605,

    // ------ pioneer ------
    // pioneer: getinfo
    get_pioneer_info = 700,
    // pioneer: show/hide
    player_pioneer_change_show = 701,
    // pioneer: move
    player_move = 702,
    // pioneer: gather
    player_gather_start = 703,
    // pioneer: explore
    player_explore_start = 704,
    player_explore_npc_start = 705,
    player_explore_gangster_start = 706,
    player_explore_maincity = 707,
    player_fight_maincity = 708,
    // pioneer: fight(map)
    player_fight_start = 709,
    // pioneer: event
    player_event_start = 710,
    player_event_generate_enemy = 711,
    player_event_select = 712,
    player_event_exit = 713,
    player_maincity_back = 714,
    player_pos_detect = 715,

    // ------ mapbuilding ------
    // mapbuilding: getinfo
    get_mapbuilding_info = 800,

    // ------ task ------
    get_user_task_info = 900,

    // ------ item ------
    player_item_use = 1000,

    // ------ artifact ------
    player_artifact_change = 1100,
    player_artifact_combine = 1101,

    // ------ worldbox ------
    player_worldbox_open = 1200,
    player_worldbox_open_select = 1201,
    player_worldbox_beginner_open = 1202,
    player_worldbox_beginner_open_select = 1203,

    // ------ inner-building ------
    player_building_levelup = 1300,
    player_generate_troop_start = 1301,
    player_building_delegate_nft = 1302,
    player_building_remove_nft = 1303,
    fetch_user_psyc = 1304,
    player_building_pos = 1305,
    player_training_start = 13051,

    // ------ pioneerNFT ------
    player_nft_lvlup = 1400,
    player_nft_rankup = 1401,
    player_nft_skill_learn = 1402,
    player_nft_skill_forget = 1403,
    player_bind_nft = 1404,

    // ------ wormhole ------
    player_wormhole_set_defender = 1500,
    player_wormhole_set_attacker = 1501,
    player_wormhole_fight_start = 1502,

    player_wormhole_tp_random = 1503,
    player_wormhole_tp_select = 1504,
    player_wormhole_tp_back = 1505,
    player_wormhole_tp_tag = 1506,

    // ------ test ------
    reborn_all = 6600,
    reset_data = 6601,
}

export enum protobuf_s2c {
    server_error = 10000,

    login_res = 10100,
    create_player_res = 10101,
    enter_game_res = 10102,
    update_name_res = 10103,

    player_goto = 10200,
    changemap_res = 10201,
    player_stophome = 10202,

    // ------ mapw ------
    get_map_info_res = 10300,

    // ------ rookie ------
    player_rookie_update_res = 10400,
    player_rookie_wormhole_fight_res = 10401,
    player_get_rookie_award_res = 10402,

    // ------ chain ------
    get_pending_res = 10500,
    upload_pending_res = 10501,
    get_pending_history_res = 10502,
    get_block_height_res = 10503,
    check_unused_tx_status_res = 10504,
    // chain: notify
    pending_change = 10550,

    // ------ get data ------
    get_battle_report_res = 10600,
    get_user_settlement_info_res = 10601,
    get_new_battle_report_res = 10602,

    // ------ player ------
    // player: talk
    player_talk_select_res = 10700,
    // player: piot2heat
    player_piot_to_heat_res = 10701,
    // player: level
    player_level_reward_res = 10702,
    player_level_up_res = 10703,
    // player: psyc2energy
    player_psyc_to_energy_res = 10704,
    // player: troop2hp
    player_troop_to_hp_res = 10705,
    // player: notify
    player_exp_change = 10750,
    player_lvlup_change = 10751,
    player_enterzone = 10752,
    player_leavezone = 10753,
    pioneer_leavezone = 10754,

    // ------ pioneer ------
    // pioneer: getinfo
    get_pioneer_info_res = 10800,
    // pioneer: show/hide
    player_pioneer_change_show_res = 10801,
    // pioneer: move
    player_move_res = 10802,
    // pioneer: gather
    player_gather_start_res = 10803,
    // pioneer: explore
    player_explore_start_res = 10804,
    player_explore_npc_start_res = 10805,
    player_explore_gangster_start_res = 10806,
    player_explore_maincity_res = 10807,
    player_fight_maincity_res = 10808,
    // pioneer: fight(map)
    player_fight_start_res = 10809,
    // pioneer: event
    player_event_start_res = 10810,
    player_event_generate_enemy_res = 10811,
    player_event_select_res = 10812,
    player_event_exit_res = 10813,
    player_maincity_back_res = 10814,
    player_pos_detect_res = 10815,
    // pioneer: notify
    sinfo_change = 10850,
    pioneer_change = 10851,
    player_actiontype_change = 10852,
    player_heat_change = 10853,
    player_map_pioneer_show_change = 10854,
    player_map_pioneer_faction_change = 10855,
    mappioneer_reborn_change = 10856,
    pioneer_reborn_res = 10857,
    player_fight_end = 10858,
    player_get_new_pioneer = 10859,
    // ------ mapbuilding ------
    // mapbuilding: getinfo
    get_mapbuilding_info_res = 10900,
    // mapbuilding: notify
    mapbuilding_change = 10951,
    player_map_building_show_change = 10952,
    player_map_building_faction_change = 10953,
    mapbuilding_reborn_change = 10954,

    // ------ task ------
    get_user_task_info_res = 11000,
    // task: notify
    user_task_did_change = 11051,
    user_task_action_talk = 11052,
    user_task_talk_info_change = 11053,
    user_mission_did_change = 11054,

    // ------ item ------
    player_item_use_res = 11100,
    // item: notify
    storhouse_change = 11151,

    // ------ artifact ------
    player_artifact_change_res = 11200,
    player_artifact_combine_res = 11201,
    // artifact: notify
    artifact_change = 11250,

    // ------ worldbox ------
    player_worldbox_open_res = 11300,
    player_worldbox_open_select_res = 11301,
    player_worldbox_beginner_open_res = 11302,
    player_worldbox_beginner_open_select_res = 11303,
    // worldbox: notify
    player_worldbox_progress_change = 11350,

    // ------ inner-building ------
    player_building_levelup_res = 11400,
    player_generate_troop_start_res = 11401,
    player_building_delegate_nft_res = 11402,
    player_building_remove_nft_res = 11403,
    fetch_user_psyc_res = 11404,
    player_building_pos_res = 11405,
    player_training_start_res = 11406,
    // inner-building: notify
    building_change = 11450,

    // ------ pioneerNFT ------
    player_nft_lvlup_res = 11500,
    player_nft_rankup_res = 11501,
    player_nft_skill_learn_res = 11502,
    player_nft_skill_forget_res = 11503,
    player_bind_nft_res = 11504,
    // pioneerNFT: notify
    nft_change = 11550,

    // ------ wormhole ------
    player_wormhole_set_defender_res = 11600,
    player_wormhole_set_attacker_res = 11601,
    player_wormhole_fight_start_res = 11602,

    player_wormhole_tp_random_res = 11603,
    player_wormhole_tp_select_res = 11604,
    player_wormhole_tp_back_res = 11605,
    player_wormhole_tp_tag_res = 11606,

    // wormhole: notify
    player_wormhole_fight_attacked_res = 11650,
    player_wormhole_fight_res = 11651,

    // ------ test ------
    reborn_all_res = 60000,
    reset_data_res = 60001,
    borad_cast_msg = 60002,
}
