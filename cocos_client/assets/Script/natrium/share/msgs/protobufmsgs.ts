// natrium
// license : MIT
// author : Sean Chen

export enum protobuf_c2s {
    login = 1,
    create_player,
    enter_game,
    update_name,


    goto,
    stop,
    stophome,
    changemap_begin,
    changemap_end,

    // ------ map ------
    get_map_info,

    // ------ rookie ------
    player_rookie_update,
    player_rookie_wormhole_fight,


    // ------ chain ------
    get_pending,
    upload_pending,
    get_pending_history,
    get_block_height,
    check_unused_tx_status,


    // ------ get data ------
    get_battle_report,
    get_user_settlement_info,


    // ------ player ------
    // player: talk
    player_talk_select,
    // player: piot2heat
    player_piot_to_heat,
    // player: level
    player_level_reward,
    player_level_up,
    // player: psyc2energy
    player_psyc_to_energy,


    // ------ pioneer ------
    // pioneer: getinfo
    get_pioneer_info,
    // pioneer: show/hide
    player_pioneer_change_show,
    // pioneer: move
    player_move,
    // pioneer: gather
    player_gather_start,
    // pioneer: explore
    player_explore_start,
    player_explore_npc_start,
    player_explore_gangster_start,
    // pioneer: fight(map)
    player_fight_start,
    // pioneer: event
    player_event_start,
    player_event_generate_enemy,
    player_event_select,
    player_event_exit,


    // ------ mapbuilding ------
    // mapbuilding: getinfo
    get_mapbuilding_info,


    // ------ task ------
    get_user_task_info,


    // ------ item ------
    player_item_use,


    // ------ artifact ------
    player_artifact_change,
    player_artifact_combine,


    // ------ worldbox ------
    player_worldbox_open,
    player_worldbox_open_select,
    player_worldbox_beginner_open,
    player_worldbox_beginner_open_select,


    // ------ inner-building ------
    player_building_levelup,
    player_generate_troop_start,
    player_building_delegate_nft,
    player_building_remove_nft,
    fetch_user_psyc,
    player_building_pos,


    // ------ pioneerNFT ------
    player_nft_lvlup,
    player_nft_rankup,
    player_nft_skill_learn,
    player_nft_skill_forget,
    player_bind_nft,


    // ------ wormhole ------
    player_wormhole_set_defender,
    player_wormhole_set_attacker,
    player_wormhole_fight_start,


    // ------ test ------
    reborn_all,
    reset_data,
}

export enum protobuf_s2c {
    server_error = 10000,

    login_res,
    create_player_res,
    enter_game_res,
    update_name_res,

    player_goto,
    changemap_res,
    player_stophome,

    // ------ mapw ------
    get_map_info_res,

    // ------ rookie ------
    player_rookie_update_res,
    player_rookie_wormhole_fight_res,


    // ------ chain ------
    get_pending_res,
    upload_pending_res,
    get_pending_history_res,
    get_block_height_res,
    check_unused_tx_status_res,
    // chain: notify
    pending_change,


    // ------ get data ------
    get_battle_report_res,
    get_user_settlement_info_res,


    // ------ player ------
    // player: talk
    player_talk_select_res,
    // player: piot2heat
    player_piot_to_heat_res,
    // player: level
    player_level_reward_res,
    player_level_up_res,
    // player: psyc2energy
    player_psyc_to_energy_res,
    // player: notify
    player_exp_change,
    player_lvlup_change,


    // ------ pioneer ------
    // pioneer: getinfo
    get_pioneer_info_res,
    // pioneer: show/hide
    player_pioneer_change_show_res,
    // pioneer: move
    player_move_res,
    // pioneer: gather
    player_gather_start_res,
    // pioneer: explore
    player_explore_start_res,
    player_explore_npc_start_res,
    player_explore_gangster_start_res,
    // pioneer: fight(map)
    player_fight_start_res,
    // pioneer: event
    player_event_start_res,
    player_event_generate_enemy_res,
    player_event_select_res,
    player_event_exit_res,
    // pioneer: notify
    sinfo_change,
    pioneer_change,
    player_actiontype_change,
    player_heat_change,
    player_map_pioneer_show_change,
    player_map_pioneer_faction_change,
    mappioneer_reborn_change,
    pioneer_reborn_res,
    player_fight_end,


    // ------ mapbuilding ------
    // mapbuilding: getinfo
    get_mapbuilding_info_res,
    // mapbuilding: notify
    mapbuilding_change,
    player_map_building_show_change,
    player_map_building_faction_change,
    mapbuilding_reborn_change,


    // ------ task ------
    get_user_task_info_res,
    // task: notify
    user_task_did_change,
    user_task_action_talk,
    user_task_action_getnewtalk,


    // ------ item ------
    player_item_use_res,
    // item: notify
    storhouse_change,


    // ------ artifact ------
    player_artifact_change_res,
    player_artifact_combine_res,
    // artifact: notify
    artifact_change,


    // ------ worldbox ------
    player_worldbox_open_res,
    player_worldbox_open_select_res,
    player_worldbox_beginner_open_res,
    player_worldbox_beginner_open_select_res,
    // worldbox: notify
    player_worldbox_progress_change,


    // ------ inner-building ------
    player_building_levelup_res,
    player_generate_troop_start_res,
    player_building_delegate_nft_res,
    player_building_remove_nft_res,
    fetch_user_psyc_res,
    player_building_pos_res,
    // inner-building: notify
    building_change,


    // ------ pioneerNFT ------
    player_nft_lvlup_res,
    player_nft_rankup_res,
    player_nft_skill_learn_res,
    player_nft_skill_forget_res,
    player_bind_nft_res,
    // pioneerNFT: notify
    nft_change,


    // ------ wormhole ------
    player_wormhole_set_defender_res,
    player_wormhole_set_attacker_res,
    player_wormhole_fight_start_res,
    // wormhole: notify
    player_wormhole_fight_attacked_res,
    player_wormhole_fight_res,


    // ------ test ------
    reborn_all_res,
    reset_data_res,
}
