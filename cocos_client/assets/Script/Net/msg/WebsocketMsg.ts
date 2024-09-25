import NotificationMgr from "../../Basic/NotificationMgr";
import ProtobufConfig from "../../Config/ProtobufConfig";
import { WebsocketFailRetryObject } from "../../Const/ConstDefine";
import { ItemConfigType, ItemType } from "../../Const/Item";
import { NotificationName } from "../../Const/Notification";
import { MapPioneerActionType } from "../../Const/PioneerDefine";
import { natrium_ws } from "../../natrium/client/natrium_ws";
import { registermsg } from "../../natrium/share/msgs/registermsg";
import CLog from "../../Utils/CLog";

export class WebsocketMsg {
    private _websocket_host: string;
    private _websocket: natrium_ws;

    private _fail_retry_data: WebsocketFailRetryObject[] = [];

    public constructor(websocket_host: string = "") {
        this._websocket_host = websocket_host;
        this._websocket = new natrium_ws();
    }

    public get websocket() {
        return this._websocket;
    }

    public async websocketConnect(): Promise<boolean> {
        try {
            await this._websocket.connect(this._websocket_host);
        } catch (e) {
            CLog.error("WebsocketMsg: websocketConnect exception:", e);
            return false;
        }
        CLog.debug("WebsocketMsg: websocketConnect success");
        return true;
    }

    public init(): boolean {
        if (this._websocket_host == "") {
            CLog.error("WebsocketMsg: _websocket_host not set");
            return false;
        }

        this._websocket.init();

        if (this._websocket.connecter == null) {
            CLog.error("WebsocketMsg: _websocket init fail");
            return false;
        }

        let pcodec = this._websocket.connecter.pcodec;

        const protobuf = ProtobufConfig.getAll();
        pcodec.parse_protobuf(protobuf.c2s_user);
        pcodec.parse_protobuf(protobuf.s2c_user);
        pcodec.parse_protobuf(protobuf.share_structure);

        registermsg(pcodec);

        CLog.debug("WebsocketMsg: init success");

        return true;
    }

    public send_packet(cmd: string, data: any, needRetry: boolean = false): void {
        if (this._websocket.connecter == null) {
            return;
        }
        CLog.debug(`WebsocketMsg, send_packet, cmd:${cmd}, data:`, data);
        let pkt = this._websocket.connecter.pcodec.create_protopkt(cmd, data);
        this._websocket.connecter.send_packet(pkt);

        if (!needRetry) {
            return;
        }
        // save need retry data
        this._fail_retry_data.push({
            protocol: cmd,
            retryCount: 3,
            data: data,
        });
    }

    public get fail_retry_data() {
        return this._fail_retry_data;
    }
    public get_fail_retry_data_by_param(protocol: string, data: any): { index: number; findData: WebsocketFailRetryObject } {
        let index = -1;
        let findData = null;
        for (let i = 0; i < this._fail_retry_data.length; i++) {
            const item = this._fail_retry_data[i];
            let finded: boolean = false;
            if (protocol.includes(item.protocol)) {
                if (protocol == "player_gather_start_res") {
                    const resData = data as s2c_user.Iplayer_gather_start_res;
                    const localData = item.data as c2s_user.Iplayer_gather_start;
                    if (resData.buildingId == localData.resourceBuildingId && resData.pioneerId == localData.pioneerId) {
                        finded = true;
                    }
                } else if (protocol == "player_fight_start_res") {
                    const resData = data as s2c_user.Iplayer_fight_start_res;
                    const localData = item.data as c2s_user.Iplayer_fight_start;
                    if (resData.attackerId == localData.attackerId && resData.defenderId == localData.defenderId) {
                        finded = true;
                    }
                } else if (protocol == "player_event_start_res") {
                    const resData = data as s2c_user.Iplayer_event_start_res;
                    const localData = item.data as c2s_user.Iplayer_event_start;
                    if (resData.buildingId == localData.buildingId && resData.pioneerId == localData.pioneerId) {
                        finded = true;
                    }
                } else if (protocol == "player_fight_maincity_res") {
                    const resData = data as s2c_user.Iplayer_fight_maincity_res;
                    const localData = item.data as c2s_user.Iplayer_fight_maincity;
                    if (resData.buildingId == localData.buildingId && resData.pioneerId == localData.pioneerId) {
                        finded = true;
                    }
                } else if (protocol == "player_wormhole_tp_random_res") {
                    const resData = data as s2c_user.Iplayer_wormhole_tp_random_res;
                    const localData = item.data as c2s_user.Iplayer_wormhole_tp_random;
                    if (resData.buildingId == localData.buildingId && resData.pioneerId == localData.pioneerId) {
                        finded = true;
                    }
                } else if (protocol == "player_wormhole_tp_select_res") {
                    const resData = data as s2c_user.Iplayer_wormhole_tp_select_res;
                    const localData = item.data as c2s_user.Iplayer_wormhole_tp_select;
                    if (resData.buildingId == localData.buildingId && resData.pioneerId == localData.pioneerId) {
                        finded = true;
                    }
                } else if (protocol == "player_wormhole_tp_back_res") {
                    const resData = data as s2c_user.Iplayer_wormhole_tp_back_res;
                    const localData = item.data as c2s_user.Iplayer_wormhole_tp_back;
                    if (resData.buildingId == localData.buildingId && resData.pioneerId == localData.pioneerId) {
                        finded = true;
                    }
                } else if (protocol == "player_wormhole_tp_tag_res") {
                    const resData = data as s2c_user.Iplayer_wormhole_tp_tag_res;
                    const localData = item.data as c2s_user.Iplayer_wormhole_tp_tag;
                    if (resData.buildingId == localData.buildingId && resData.pioneerId == localData.pioneerId) {
                        finded = true;
                    }
                }
            }
            if (finded) {
                index = i;
                findData = item;
                break;
            }
        }
        return {
            index: index,
            findData: findData,
        };
    }
    public delete_fail_retry_data(index: number) {
        if (index < 0 || index > this._fail_retry_data.length - 1) {
            return;
        }
        this._fail_retry_data.splice(index, 1);
    }

    public login(d: c2s_user.Ilogin): void {
        this.send_packet("login", d);
    }

    public create_player(d: c2s_user.Icreate_player): void {
        this.send_packet("create_player", d);
    }

    public enter_game(d: c2s_user.Ienter_game): void {
        this.send_packet("enter_game", d);
    }

    public update_name(d: c2s_user.Iupdate_name): void {
        this.send_packet("update_name", d);
    }
    public player_psyc_to_energy(d: c2s_user.Iplayer_psyc_to_energy) {
        this.send_packet("player_psyc_to_energy", d);
    }

    public get_map_info(d: c2s_user.Iget_map_info) {
        this.send_packet("get_map_info", d);
    }
    public player_pioneer_change_show(d: c2s_user.Iplayer_pioneer_change_show) {
        this.send_packet("player_pioneer_change_show", d);
    }
    public get_pioneer_info(d: c2s_user.Iget_pioneer_info) {
        this.send_packet("get_pioneer_info", d);
    }
    public get_mapbuilding_info(d: c2s_user.Iget_mapbuilding_info) {
        this.send_packet("get_mapbuilding_info", d);
    }
    public player_troop_to_hp(d: c2s_user.Iplayer_troop_to_hp) {
        this.send_packet("player_troop_to_hp", d);
    }
    public player_move(d: c2s_user.Iplayer_move) {
        this.send_packet("player_move", d);
    }
    public player_talk_select(d: c2s_user.Iplayer_talk_select) {
        this.send_packet("player_talk_select", d);
    }
    public player_gather_start(d: c2s_user.Iplayer_gather_start) {
        this.send_packet("player_gather_start", d, true);
    }
    public player_explore_start(d: c2s_user.Iplayer_explore_start) {
        this.send_packet("player_explore_start", d);
    }
    public player_explore_npc_start(d: c2s_user.Iplayer_explore_npc_start) {
        this.send_packet("player_explore_npc_start", d);
    }
    public player_event_start(d: c2s_user.Iplayer_event_start) {
        this.send_packet("player_event_start", d, true);
    }
    public player_event_generate_enemy(d: c2s_user.Iplayer_event_generate_enemy) {
        this.send_packet("player_event_generate_enemy", d);
    }
    public player_event_select(d: c2s_user.Iplayer_event_select) {
        this.send_packet("player_event_select", d);
    }
    public player_event_exit(d: c2s_user.Iplayer_event_exit) {
        this.send_packet("player_event_exit", d);
    }
    public player_explore_maincity(d: c2s_user.Iplayer_explore_maincity) {
        this.send_packet("player_explore_maincity", d);
    }
    public player_fight_maincity(d: c2s_user.Iplayer_fight_maincity) {
        this.send_packet("player_fight_maincity", d, true);
    }
    public player_maincity_back(d: c2s_user.Iplayer_maincity_back) {
        this.send_packet("player_maincity_back", d);
    }
    public player_pos_detect(d: c2s_user.Iplayer_pos_detect) {
        this.send_packet("player_pos_detect", d);
    }
    public player_wormhole_tp_random(d: c2s_user.Iplayer_wormhole_tp_random) {
        this.send_packet("player_wormhole_tp_random", d, true);
    }
    public player_wormhole_tp_select(d: c2s_user.Iplayer_wormhole_tp_select) {
        this.send_packet("player_wormhole_tp_select", d, true);
    }
    public player_wormhole_tp_back(d: c2s_user.Iplayer_wormhole_tp_back) {
        this.send_packet("player_wormhole_tp_back", d, true);
    }
    public player_wormhole_tp_tag(d: c2s_user.Iplayer_wormhole_tp_tag) {
        this.send_packet("player_wormhole_tp_tag", d, true);
    }

    public player_fight_start(d: c2s_user.Iplayer_fight_start) {
        this.send_packet("player_fight_start", d, true);
    }
    public player_item_use(d: c2s_user.Iplayer_item_use) {
        this.send_packet("player_item_use", d);
    }
    public player_worldbox_open(d: c2s_user.Iplayer_worldbox_open) {
        this.send_packet("player_worldbox_open", d);
    }
    public player_worldbox_open_select(d: c2s_user.Iplayer_worldbox_open_select) {
        this.send_packet("player_worldbox_open_select", d);
    }
    public player_worldbox_beginner_open_select(d: c2s_user.Iplayer_worldbox_beginner_open_select) {
        this.send_packet("player_worldbox_beginner_open_select", d);
    }
    public player_artifact_change(d: c2s_user.Iplayer_artifact_change) {
        this.send_packet("player_artifact_change", d);
    }
    public player_artifact_combine(d: c2s_user.Iplayer_artifact_combine) {
        this.send_packet("player_artifact_combine", d);
    }
    public player_piot_to_heat(d: c2s_user.Iplayer_piot_to_heat) {
        this.send_packet("player_piot_to_heat", d);
    }
    public player_level_reward(d: c2s_user.Iplayer_level_reward) {
        this.send_packet("player_level_reward", d);
    }
    public player_level_up(d: c2s_user.Iplayer_level_up) {
        this.send_packet("player_level_up", d);
    }
    public player_worldbox_beginner_open(d: c2s_user.Iplayer_worldbox_beginner_open) {
        this.send_packet("player_worldbox_beginner_open", d);
    }

    public player_building_levelup(d: c2s_user.Iplayer_building_levelup) {
        this.send_packet("player_building_levelup", d);
    }
    public player_building_pos(d: c2s_user.Iplayer_building_pos) {
        this.send_packet("player_building_pos", d);
    }
    public player_generate_troop_start(d: c2s_user.Iplayer_generate_troop_start) {
        this.send_packet("player_generate_troop_start", d);
    }
    public player_training_start(d: c2s_user.Iplayer_training_start) {
        this.send_packet("player_training_start", d);
    }
    public player_building_delegate_nft(d: c2s_user.Iplayer_building_delegate_nft) {
        this.send_packet("player_building_delegate_nft", d);
    }
    public player_nft_lvlup(d: c2s_user.Iplayer_nft_lvlup) {
        this.send_packet("player_nft_lvlup", d);
    }
    public player_nft_rankup(d: c2s_user.Iplayer_nft_rankup) {
        this.send_packet("player_nft_rankup", d);
    }
    public player_nft_skill_learn(d: c2s_user.Iplayer_nft_skill_learn) {
        this.send_packet("player_nft_skill_learn", d);
    }
    public player_nft_skill_forget(d: c2s_user.Iplayer_nft_skill_forget) {
        this.send_packet("player_nft_skill_forget", d);
    }
    public player_rookie_update(d: c2s_user.Iplayer_rookie_update) {
        // NotificationMgr.triggerEvent(NotificationName.FAKE_ROOKIESTEP_CHANGE, d);
        // return;
        this.send_packet("player_rookie_update", d);
    }
    public player_get_rookie_award(d: c2s_user.Iplayer_get_rookie_award) {
        this.send_packet("player_get_rookie_award", d);
    }
    public player_rookie_wormhole_fight(d: c2s_user.Iplayer_rookie_wormhole_fight) {
        this.send_packet("player_rookie_wormhole_fight", d);
    }

    public player_wormhole_set_defender(d: c2s_user.Iplayer_wormhole_set_defender) {
        this.send_packet("player_wormhole_set_defender", d);
    }
    public player_wormhole_set_attacker(d: c2s_user.Iplayer_wormhole_set_attacker) {
        this.send_packet("player_wormhole_set_attacker", d);
    }
    public player_wormhole_fight_start(d: c2s_user.Iplayer_wormhole_fight_start) {
        this.send_packet("player_wormhole_fight_start", d);
    }

    public fetch_user_psyc(d: c2s_user.Ifetch_user_psyc) {
        this.send_packet("fetch_user_psyc", d);
    }

    public get_user_settlement_info(d: c2s_user.Iget_user_settlement_info) {
        this.send_packet("get_user_settlement_info", d);
    }

    public get_new_battle_report(d: c2s_user.Iget_new_battle_report) {
        this.send_packet("get_new_battle_report", d);
    }
    public receive_new_battle_report_reward(d: c2s_user.Ireceive_new_battle_report_reward) {
        this.send_packet("receive_new_battle_report_reward", d);
    }

    public reborn_all() {
        this.send_packet("reborn_all", {});
    }
    public reset_data() {
        this.send_packet("reset_data", {});
    }

    public save_archives(d: c2s_user.Isave_archives) {
        this.send_packet("save_archives", d);
    }
}

export const WebsocketEvent = {
    connected: "connected",
    disconnected: "disconnected",
    shakehand: "shakehand",
    error: "error",
};

export enum Ichange_pioneer_type {
    showHide,
    GetNewTalk,
    actionType,
}
export interface Ichange_pioneer_showHide {
    show: boolean;
}
export interface Ichange_pioneer_actionType {
    type: MapPioneerActionType;
}
export interface Ichange_pioneer_newTalk {
    talkId: string;
}

export namespace c2s_user {
    export interface Ilogin {
        /** login name */
        name: string;

        /** login uid */
        uid: string;

        /** login token */
        token: string;
    }

    export interface Icreate_player {
        /** create_player pname */
        pname: string;

        /** create_player gender */
        gender: number;
    }

    export interface Ienter_game {}

    export interface Iupdate_name {
        name: string;
    }
    export interface Iplayer_psyc_to_energy {
        pioneerId: string;
        psycNum: number;
    }

    export interface Iget_map_info {
        slotIds: string[];
    }

    export interface Icreate_pioneer {
        type: string;
    }

    export interface Iget_pioneers {}

    export interface Ichange_pioneer {
        type: Ichange_pioneer_type;
        pioneerId: string;
        showHide?: Ichange_pioneer_showHide;
        actionType?: Ichange_pioneer_actionType;
        newTalk?: Ichange_pioneer_newTalk;
    }

    export interface Iplayer_pioneer_change_show {
        pioneerId: string;
        show: boolean;
    }

    export interface Iget_pioneer_info {
        pioneerIds: string[];
    }
    export interface Iget_mapbuilding_info {
        mapbuildingIds: string[];
    }
    export interface Iplayer_troop_to_hp {
        pioneerId: string;
        troopNum: number;
        troopId: string;
    }
    export interface Iplayer_move {
        pioneerId: string;
        movePath: share.pos2d[];
        feeTxhash: string;
        isReturn: boolean;
    }
    export interface Iplayer_talk_select {
        talkId: string;
        selectIndex: number;
        currStep: number;
    }
    export interface Iplayer_gather_start {
        pioneerId: string;
        resourceBuildingId: string;
        feeTxhash: string;
        isReturn: boolean;
    }

    export interface Iplayer_explore_start {
        pioneerId: string;
        buildingId: string;
    }
    export interface Iplayer_explore_npc_start {
        pioneerId: string;
        npcId: string;
        isReturn: boolean;
    }
    export interface Iplayer_event_start {
        pioneerId: string;
        buildingId: string;
        isReturn: boolean;
    }
    export interface Iplayer_event_generate_enemy {
        pioneerId: string;
        buildingId: string;
        selectIdx: number;
    }
    export interface Iplayer_event_select {
        pioneerId: string;
        buildingId: string;
        selectIdx: number;
    }
    export interface Iplayer_event_exit {
        pioneerId: string;
        buildingId: string;
    }
    export interface Iplayer_explore_maincity {
        buildingId: string;
    }
    export interface Iplayer_fight_maincity {
        pioneerId: string;
        buildingId: string;
        isReturn: boolean;
    }
    export interface Iplayer_maincity_back {
        pioneerId: string;
        buildingId: string;
    }
    export interface Iplayer_pos_detect {
        detect: share.pos2d;
    }
    export interface Iplayer_wormhole_tp_random {
        buildingId: string;
        pioneerId: string;
    }
    export interface Iplayer_wormhole_tp_select {
        buildingId: string;
        pioneerId: string;
        tpBuildingId: string;
    }
    export interface Iplayer_wormhole_tp_back {
        buildingId: string;
        pioneerId: string;
    }
    export interface Iplayer_wormhole_tp_tag {
        buildingId: string;
        pioneerId: string;
    }

    export interface Iplayer_fight_start {
        attackerId: string;
        defenderId: string;
        isReturn: boolean;
    }
    export interface Iplayer_item_use {
        itemId: string;
        num: number;
    }
    export interface Iplayer_worldbox_open {
        boxIndex: number;
    }
    export interface Iplayer_worldbox_open_select {
        boxIndex: number;
        selectIndex: number;
    }
    export interface Iplayer_worldbox_beginner_open_select {
        boxIndex: number;
        selectIndex: number;
    }
    export interface Iplayer_artifact_change {
        artifactId: string;
        artifactEffectIndex: number;
    }
    export interface Iplayer_artifact_combine {
        artifactIds: string[];
    }

    export interface Iplayer_piot_to_heat {
        piotNum: number;
    }
    export interface Iplayer_level_reward {
        level: number;
    }
    export interface Iplayer_level_up {}
    export interface Iplayer_worldbox_beginner_open {
        boxIndex: number;
    }

    export interface Iplayer_building_levelup {
        innerBuildingId: string;
    }
    export interface Iplayer_building_pos {
        buildingId: string;
        pos: [number, number];
    }
    export interface Iplayer_generate_troop_start {
        num: number;
    }
    export interface Iplayer_training_start {
        training: share.Itraining_data[];
    }
    export interface Iplayer_building_delegate_nft {
        innerBuildingId: string;
        nftId: string;
    }
    export interface Iplayer_nft_lvlup {
        nftId: string;
        levelUpNum: number;
    }
    export interface Iplayer_nft_rankup {
        nftId: string;
        rankUpNum: number;
    }
    export interface Iplayer_nft_skill_learn {
        nftId: string;
        skillItemId: string;
    }
    export interface Iplayer_nft_skill_forget {
        nftId: string;
        skillIndex: number;
    }
    export interface Iplayer_rookie_update {
        rookieStep: number;
    }
    export interface Iplayer_rookie_wormhole_fight {
        pioneerId: string;
    }
    export interface Iplayer_wormhole_set_defender {
        pioneerId: string;
        index: number;
    }
    export interface Iplayer_wormhole_set_attacker {
        buildingId: string;
        pioneerId: string;
        index: number;
    }
    export interface Iplayer_wormhole_fight_start {
        buildingId: string;
    }

    export interface Ifetch_user_psyc {}

    export interface Iget_user_settlement_info {}

    export interface Iget_new_battle_report {}
    export interface Ireceive_new_battle_report_reward {
        id: number;
    }

    export interface Isave_archives {
        archives: string;
    }

    export interface Iplayer_get_rookie_award {}
}

export namespace s2c_user {
    export interface Iserver_error {
        /** server_error res */
        res: number;
    }

    export interface Ilogin_res {
        /** login_res res */
        res: number;

        /** login_res isNew */
        isNew?: boolean | null;

        /** login_res data */
        data?: share.Iuser_data | null;

        archives: string;
    }

    export interface Icreate_player_res {
        /** create_player_res res */
        res: number;

        /** create_player_res sinfo */
        sinfo?: share.Iplayer_sinfo | null;
    }

    export interface Ienter_game_res {
        /** enter_game_res res */
        res: number;

        /** enter_game_res data */
        data?: share.Iplayer_data | null;
    }
    export interface Iupdate_name_res {
        res: number;
        name: string;
    }
    export interface Isinfo_change {
        info: share.Iplayer_sinfo;
    }
    export interface Iplayer_rookie_update_res {
        res: number;
        rookieStep: number;
    }
    export interface Iplayer_rookie_wormhole_fight_res {
        res: number;
        pioneerId: string;
        hp: number;
        fightRes: share.Ifight_res[];
    }
    export interface Istorhouse_change {
        iteminfo: share.Iitem_data[];
    }
    export interface Iartifact_change {
        iteminfo: share.Iartifact_info_data[];
    }
    export interface Iplayer_artifact_change_res {
        res: number;
        data: share.Iartifact_info_data[];
    }
    export interface Iplayer_artifact_combine_res {
        res: number;
        data: share.Iartifact_info_data[];
    }
    export interface Iget_pioneers_res {
        res: number;
        data?: share.Ipioneer_info | null;
    }
    export interface Iget_map_info_res {
        res: number;
        info: share.Imap_info_data[];
        user: { [key: string]: share.Ipioneer_data };
    }

    export interface Iplayer_enterzone {
        infos: share.Iplayerinzoneinfo[];
    }
    export interface Iplayer_leavezone {
        playerids: number[];
    }
    export interface Ipioneer_leavezone {
        pioneerIds: string[];
    }
    export interface Iplayer_get_new_pioneer {
        datas: share.Ipioneer_data[];
    }
    export interface Ipioneer_change {
        pioneers: share.Ipioneer_data[];
    }
    export interface Inft_change {
        nfts: share.Infts_info_data[];
    }
    export interface Imappbuilding_change {
        mapbuildings: share.Imapbuilding_info_data[];
    }

    export interface Iplayer_move_res {
        res: number;
        pioneerId: string;
        movePath: share.pos2d[];
    }
    export interface Iplayer_gather_start_res {
        res: number;
        buildingId: string;
        pioneerId: string;
    }
    export interface Iplayer_fight_start_res {
        res: number;
        attackerId: string;
        defenderId: string;
    }
    export interface Iplayer_event_start_res {
        res: number;
        buildingId: string;
        pioneerId: string;
    }
    export interface Iplayer_fight_maincity_res {
        res: number;
        pioneerId: string;
        buildingId: string;
    }
    export interface Iplayer_explore_start_res {
        res: number;
        buildingId: string;
        pioneerId: string;
    }
    export interface Iplayer_explore_maincity_res {
        res: number;
        buildingId: string;
        battlePower: number;
    }
    export interface Iplayer_pos_detect_res {
        res: number;
        detect: share.pos2d;
    }
    export interface Iplayer_event_select_res {
        res: number;
        eventId: string;
    }
    export interface Iplayer_talk_select_res {
        res: number;
        talkId: string;
        selectIndex: number;
    }
    export interface Iplayer_explore_npc_start_res {
        res: number;
        pioneerId: string;
        npcId: string;
    }
    export interface Iplayer_fight_end {
        pioneerId: string;
    }
    export interface Iplayer_wormhole_tp_random_res {
        res: number;
        buildingId: string;
        pioneerId: string;
        tpPos: share.pos2d;
    }
    export interface Iplayer_wormhole_tp_select_res {
        res: number;
        buildingId: string;
        pioneerId: string;
        tpPos: share.pos2d;
    }
    export interface Iplayer_wormhole_tp_back_res {
        res: number;
        buildingId: string;
        pioneerId: string;
    }
    export interface Iplayer_wormhole_tp_tag_res {
        res: number;
        buildingId: string;
        pioneerId: string;
    }
    export interface Iplayer_worldbox_beginner_open_res {
        res: number;
        boxIndex: number;
        boxId: string;
        finish: boolean;
        items: share.Iitem_data[];
        artifacts: share.Iartifact_info_data[];
        threes: { [key: string]: share.Iartifact_three_confs };
    }
    export interface Iplayer_worldbox_beginner_open_select_res {
        res: number;
        boxIndex: number;
        selectIndex: number;
    }
    export interface Iplayer_worldbox_open_res {
        res: number;
        boxId: string;
        boxIndex: number;
        items: share.Iitem_data[];
        artifacts: share.Iartifact_info_data[];
        threes: { [key: string]: share.Iartifact_three_confs };
    }

    export interface Iplayer_item_use_res {
        res: number;
    }
    export interface Ibuilding_change {
        buildings: share.Ibuilding_data[];
    }
    export interface Iplayer_building_pos_res {
        res: number;
        buildingId: string;
        pos: [number, number];
    }
    export interface Iplayer_building_levelup_res {
        res: number;
        data: share.Ibuilding_data;
    }
    export interface Iplayer_building_delegate_nft_res {
        res: number;
        buildings: share.Ibuilding_data[];
        nfts: share.Infts_info_data[];
    }
    export interface Iplayer_nft_lvlup_res {
        res: number;
        nftData: share.Infts_info_data;
    }
    export interface Iplayer_nft_rankup_res {
        res: number;
        nftData: share.Infts_info_data;
    }
    export interface Iplayer_nft_skill_learn_res {
        res: number;
        nftData: share.Infts_info_data;
    }
    export interface Iplayer_nft_skill_forget_res {
        res: number;
        nftData: share.Infts_info_data;
    }
    export interface Iplayer_wormhole_set_attacker_res {
        res: number;
        buildingId: string;
        attacker: { [key: string]: string };
    }
    export interface Iplayer_wormhole_fight_res {
        res: number;
        buildingId: string;
        defenderUid: string;
        attackerName: string;
        defenderName: string;
        defenderData: { [key: string]: string };
        fightResult: boolean;
    }
    export interface Ifetch_user_psyc_res {
        res: number;
        psycfetched: number;
        txhash: string;
        logid: string;
    }
    export interface Iuser_task_talk_info_change {
        canTalkData: { [key: string]: share.Itask_talk_data };
    }
    export interface Iuser_mission_did_change {
        missions: share.Imission_data[];
    }
    export interface Iuser_task_did_change {
        task: share.Itask_info_data;
    }
    export interface Iuser_task_action_talk {
        talkId: string;
    }

    export interface Iplayer_lvlup_change {
        hpMaxChangeValue: number;
        newPsycLimit: number;
        newLv: number;
        items: any;
        artifacts: any;
    }

    export interface Iget_user_settlement_info_res {
        res: number;
        data: { [key: string]: share.Isettlement_data };
    }

    export interface Iborad_cast_msg {
        msg: string;
        type: string;
    }

    export interface Iget_new_battle_report_res {
        res: number;
        data: share.Inew_battle_report_data[];
    }
    export interface Ireceive_new_battle_report_reward_res {
        res: number;
        id: number;
    }

    export interface Iplayer_troop_to_hp_res {
        res: number;
        pioneerId: string;
    }
    export interface Iplayer_psyc_to_energy_res {
        res: number;
        pioneerId: string;
    }
}

export namespace share {
    export interface Iuser_data {
        /** user_data name */
        name: string;

        /** user_data uid */
        uid: string;

        /** user_data wallet */
        wallet: string;

        /** user_data lastlogintm */
        lastlogintm: number;
    }

    export interface energy_info_data {
        countTime: number;
        totalEnergyNum: number;
    }
    export interface troop_info_data {
        countTime: number;
        troopNum: number;
    }
    export interface pos2d {
        x: number;
        y: number;
    }
    export interface heat_value_data {
        getTimestamp: number;
        currentHeatValue: number;
        lotteryTimes: number;
        lotteryTimesLimit: number;
        lotteryProcessLimit: number;
    }
    export interface box_data {
        id: string;
        opened: boolean;
    }
    export interface Iplayer_sinfo {
        /** player_sinfo playerid */
        playerid: number;

        /** player_sinfo pname */
        pname: string;

        battlePower: number;
        explorePlayerids: number[];

        /** player_sinfo gender */
        gender: number;

        boxes: box_data[];

        talkIds: string[];

        mapid: number;
        speed: number;
        level: number;
        exp: number;
        lastAPRecTms: number;
        pos: pos2d;
        treasureProgress: number;
        heatValue: heat_value_data;
        treasureDidGetRewards: string[];
        pointTreasureDidGetRewards: string[];
        cityRadialRange: number;
        rookieStep: number;
        rookieState: number;
        generateTroopInfo?: troop_info_data;
        generateEnergyInfo?: energy_info_data;

        currFetchTimes: number;
        limitFetchTimes: number;

        defender: { [key: string]: string };

        boxRefreshTs: number;
        mapRefreshTs: number;

        lvlRewards: { [key: string]: boolean };
        // "key = type_paramb" | type
        lvlupConds: { [key: string]: number };

        buyEnergyLimitTimes: number;

        wormholeTags: share.Iwormhole_tag_data[];

        wormholeMatchTimes: number;
        wormholeTeleportTimes: number;
    }
    export interface Ibuilding_data {
        id: string;
        anim: string;
        level: number;
        upgradeCountTime: number;
        upgradeTotalTime: number;
        upgradeIng: boolean;

        troopStartTime: number;
        troopEndTime: number;
        troopNum: number;
        troopIng: boolean;
        pos: [number, number];

        tc?: Ibuilding_tc_data;
    }

    export interface Ibuilding_tc_data {
        troops: { [key: string]: number };
        training?: Ibuilding_tc_training_data;
    }
    export interface Ibuilding_tc_training_data {
        start: number;
        end: number;
        troops: { [key: string]: number };
    }

    export interface Iplayer_data {
        /** player_data info */
        info: Iplayer_info;
    }

    export interface Iplayer_info {
        /** player_info sinfo */
        sinfo: Iplayer_sinfo;
        buildings: Ibuilding_data[];
        storehouse?: Istorehouse_data;
        artifact?: Iartifact_data;
        usermap?: Iusermap_data;
        nfts?: Infts_data;
        mapbuilding: Imap_info_data;
        taskinfo: Itask_data;
        shadows: pos2d[];
        detects: pos2d[];
    }

    export interface Istorehouse_data {
        items: { [key: string]: Iitem_data };
    }
    export interface Iitem_data {
        itemConfigId: string;
        count: number;
        addTimeStamp: number;
    }

    export interface Iartifact_data {
        items: { [key: string]: Iartifact_info_data };
    }
    export interface Iartifact_info_data {
        uniqueId: string;
        artifactConfigId: string;
        count: number;
        addTimeStamp: number;
        effectIndex: number;
        effect: string[];
    }

    export interface Iusermap_data {
        pioneer: { [key: string]: Ipioneer_data };
    }
    export interface Ipioneer_data {
        uniqueId: string;
        id: string;
        show: boolean;
        level: number;
        faction: number;
        type: string;
        stayPos: pos2d;

        name: string;
        animType: string;

        hpMax: number;
        hp: number;

        attack: number;

        defend: number;

        speed: number;

        energy: number;
        energyMax: number;

        actionType: string;
        actionBeginTimeStamp: number;
        actionEndTimeStamp: number;
        actionEndReturn?: boolean;
        actionFightId?: string;
        movePath?: pos2d[];

        winProgress?: number;
        winExp: number;
        actionEventId?: string;
        actionBuildingId?: string;
        killerId?: string;
        NFTId?: string;

        actionFightBeginRes: Ifight_effect_trigger_res[];
        actionFightRes: Ifight_res[];
        actionFightWinner: number;
        rebirthStartTime?: number;
        rebirthEndTime?: number;

        dieTime?: number;
        rebornTime?: number;

        troopId?: string;
    }
    export interface Ifight_res {
        attackerId: string;
        defenderId: string;
        hp: number;
        effectRes: Ifight_effect_trigger_res[];
    }
    export interface Ifight_effect_trigger_res {
        actionId: string;
        skillId: string;
        effectId: string;
    }

    export interface Infts_data {
        nfts: { [key: string]: Infts_info_data };
    }
    export interface Infts_info_data {
        uniqueId: string;
        rarity: number;
        name: string;
        skin: string;

        level: number;
        levelLimit: number;
        rank: number;
        rankLimit: number;

        attack: number;
        defense: number;
        hp: number;
        speed: number;
        iq: number;

        attackGrowValue: number;
        defenseGrowValue: number;
        hpGrowValue: number;
        speedGrowValue: number;
        iqGrowValue: number;

        skills: Inft_pioneer_skil[];
        workingBuildingId: string;
        addTimeStamp: number;
    }
    export interface Inft_pioneer_skil {
        id: string;
        isOriginal: boolean;
    }
    export interface Imap_info_data {
        slotId: string;
        playerId: number;
        pname: string;
        level: number;
        battlePower: number;
        templateConfigId: string;
        buildings: { [key: string]: Imapbuilding_info_data };
        pioneers: { [key: string]: Ipioneer_data };
    }
    export interface Imapbuilding_info_data {
        uniqueId: string;
        id: string;
        name: string;
        type: number;
        level: number;
        show: boolean;
        faction: number;

        stayPosType: number;
        stayMapPositions: pos2d[];
        animType: string;

        defendPioneerIds: string[];

        gatherPioneerIds: string[];
        quota: number;

        explorePioneerIds: string[];

        eventId: string;
        eventIndex: number;
        eventSubId: string;
        eventWaitFightEnemyId: string;
        eventPioneerIds: string[];
        eventPioneerDatas: { [key: string]: share.Ipioneer_data };

        exp: number;
        progress: number;

        hpMax: number;
        hp: number;
        attack: number;
        winprogress: number;

        wormholdCountdownTime: number;
        attacker: { [key: string]: string };

        dieTime?: number;
        rebornTime?: number;

        maincityFightPioneerIds?: string[];
        maincityFightPioneerDatas: { [key: string]: share.Ipioneer_data };
    }
    export interface Iartifact_three_confs {
        confs: Iartifact_three_conf[];
    }
    export interface Iartifact_three_conf {
        type: ItemConfigType;
        propId: string;
        num: number;
    }

    export interface Iattacker_data {
        pioneerId: string;
        buildingId: string;
    }

    export interface Iactiontype_change_data {
        pioneerId: string;
        actiontype: string;
    }

    export interface Ipioneer_info {
        type: string;
    }

    export interface Itask_data {
        tasks: Itask_info_data[];
        canTalkData: { [key: string]: Itask_talk_data };
        missions: { [key: string]: Imission_data };
    }
    export interface Itask_info_data {
        taskId: string;
        stepIndex: number;
        isFinished: boolean;
        isFailed: boolean;
        canGet: boolean;
        isGetted: boolean;
        steps: Itask_step_data[];
    }
    export interface Itask_talk_data {
        npcUniqueId: string;
        talkId: string;
    }
    export interface Itask_step_data {
        id: string;
        completeIndex: number;
    }

    export interface Imission_data {
        missionId: string;
        isComplete: boolean;
        missionObjCount: number;
    }

    export interface Isettlement_data {
        level: number;
        newPioneerIds: string[];
        killEnemies: number;
        gainResources: number;
        consumeResources: number;
        gainTroops: number;
        consumeTroops: number;
        gainEnergy: number;
        consumeEnergy: number;
        exploredEvents: number;
    }

    export interface Iplayerinzoneinfo {
        instid: number;
        playerid: number;
        pioneerId: string;
        ver: number;
        pos: pos2d;
    }

    export enum Inew_battle_report_type {
        fight = 0,
        mining,
        task
    }
    export enum Inew_battle_report_fight_member_type {
        pioneer = 0,
        monster,
        player,
    }
    export interface Inew_battle_report_fight_member_data {
        id: string;
        avatar: string;
        name: string;
        nameUseLan: boolean;
        hp: number;
        hpmax: number;
    }
    export interface Inew_battle_report_fight_data {
        selfIsAttacker: boolean;
        attackerWin: boolean;

        location?: pos2d;

        attacker: Inew_battle_report_fight_member_data;
        defender: Inew_battle_report_fight_member_data;

        fightRes: Ifight_res[];

        winItems: Iitem_data[];
        winArtifacts: Iartifact_info_data[];
    }
    export interface Inew_battle_report_mining_data {
        pioneerUniqueId: string;
        location?: pos2d;
        duration: number;

        rewards: Iitem_data[];
    }
    export interface Inew_battle_report_task_data {
        name: string;
        description: string;
        progress: number;
        total: number;
        rewards: Iitem_data[];
    }
    export interface Inew_battle_report_data {
        id: number;
        type: Inew_battle_report_type;
        // s
        timestamp: number;
        unread: boolean;
        getted: boolean;
        fight?: Inew_battle_report_fight_data;
        mining?: Inew_battle_report_mining_data;
        task?: Inew_battle_report_task_data;
    }

    export interface Iwormhole_tag_data {
        playerId: number;
        playerName: string;
        tpBuildingId: string;
    }
    export interface Itraining_data {
        id: string;
        num: number;
    }
}
