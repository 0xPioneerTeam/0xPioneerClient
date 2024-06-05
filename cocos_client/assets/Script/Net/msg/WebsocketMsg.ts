import ProtobufConfig from "../../Config/ProtobufConfig";
import { MapPioneerActionType } from "../../Const/PioneerDefine";
import { natrium_ws } from "../../natrium/client/natrium_ws";
import { registermsg } from "../../natrium/share/msgs/registermsg";
import CLog from "../../Utils/CLog";

export class WebsocketMsg {
    private _websocket_host: string;
    private _websocket: natrium_ws;

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

    public send_packet(cmd: string, data: any): void {
        if (this._websocket.connecter == null) {
            return;
        }
        CLog.debug(`WebsocketMsg, send_packet, cmd:${cmd}, data:`, data);

        let pkt = this._websocket.connecter.pcodec.create_protopkt(cmd, data);
        this._websocket.connecter.send_packet(pkt);
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

    public player_pioneer_change_show(d: c2s_user.Iplayer_pioneer_change_show) {
        this.send_packet("player_pioneer_change_show", d);
    }
    public get_pioneer_info(d: c2s_user.Iget_pioneer_info) {
        this.send_packet("get_pioneer_info", d);
    }
    public get_mapbuilding_info(d: c2s_user.Iget_mapbuilding_info) {
        this.send_packet("get_mapbuilding_info", d);
    }
    public player_move(d: c2s_user.Iplayer_move) {
        this.send_packet("player_move", d);
    }
    public player_talk_select(d: c2s_user.Iplayer_talk_select) {
        this.send_packet("player_talk_select", d);
    }
    public player_gather_start(d: c2s_user.Iplayer_gather_start) {
        this.send_packet("player_gather_start", d);
    }
    public player_explore_start(d: c2s_user.Iplayer_explore_start) {
        this.send_packet("player_explore_start", d);
    }
    public player_explore_npc_start(d: c2s_user.Iplayer_explore_npc_start) {
        this.send_packet("player_explore_npc_start", d);
    }
    public player_event_start(d: c2s_user.Iplayer_event_start) {
        this.send_packet("player_event_start", d);
    }
    public player_event_select(d: c2s_user.Iplayer_event_select) {
        this.send_packet("player_event_select", d);
    }

    public player_fight_start(d: c2s_user.Iplayer_fight_start) {
        this.send_packet("player_fight_start", d);
    }
    public player_item_use(d: c2s_user.Iplayer_item_use) {
        this.send_packet("player_item_use", d);
    }
    public player_treasure_open(d: c2s_user.Iplayer_treasure_open) {
        this.send_packet("player_treasure_open", d);
    }
    public player_point_treasure_open(d: c2s_user.Iplayer_point_treasure_open) {
        this.send_packet("player_point_treasure_open", d);
    }
    public player_artifact_change(d: c2s_user.Iplayer_artifact_change) {
        this.send_packet("player_artifact_change", d);
    }
    public player_artifact_combine(d: c2s_user.Iplayer_artifact_combine) {
        this.send_packet("player_artifact_combine", d);
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

    public player_world_treasure_lottery(d: c2s_user.Iplayer_world_treasure_lottery) {
        this.send_packet("player_world_treasure_lottery", d);
    }
    public get_treasure_info(d: c2s_user.Iget_treasure_info) {
        this.send_packet("get_treasure_info", d);
    }

    public player_rookie_finish(d: c2s_user.Iplayer_rookie_finish) {
        this.send_packet("player_rookie_finish", d);
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

    public reborn_all() {
        this.send_packet("reborn_all", {});
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
    export interface Iplayer_move {
        pioneerId: string;
        movePath: share.pos2d[];
        feeTxhash: string;
    }
    export interface Iplayer_talk_select {
        talkId: string;
        selectIndex: number;
        currStep: number;
    }
    export interface Iplayer_gather_start {
        pioneerId: string;
        resourceBuildingId: string;
    }

    export interface Iplayer_explore_start {
        pioneerId: string;
        buildingId: string;
    }
    export interface Iplayer_explore_npc_start {
        pioneerId: string;
        npcId: string;
    }
    export interface Iplayer_event_start {
        pioneerId: string;
        buildingId: string;
    }
    export interface Iplayer_event_select {
        pioneerId: string;
        buildingId: string;
        selectIdx?: number;
    }
    export interface Iplayer_fight_start {
        attackerId: string;
        defenderId: string;
    }
    export interface Iplayer_item_use {
        itemId: string;
        num: number;
    }
    export interface Iplayer_treasure_open {
        boxId: string;
    }
    export interface Iplayer_point_treasure_open {
        boxId: string;
    }
    export interface Iplayer_artifact_change {
        artifactId: string;
        artifactEffectIndex: number;
    }
    export interface Iplayer_artifact_combine {
        artifactIds: string[];
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
    export interface Iplayer_world_treasure_lottery {}
    export interface Iget_treasure_info {}

    export interface Iplayer_rookie_finish {}

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

    export interface Isave_archives {
        archives: string;
    }
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
    export interface Isinfo_change {
        info: share.Iplayer_sinfo;
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
    export interface Ipioneer_change {
        pioneers: share.Ipioneer_data[];
    }
    export interface Inft_change {
        nfts: share.Infts_info_data[];
    }
    export interface Imappbuilding_change {
        mapbuildings: share.Imapbuilding_info_data[];
    }

    export interface Iplayer_exp_change {
        addExp: number;
        newExp: number;
        newLevel?: number;
        newPsycLimit?: number;
    }
    export interface Iplayer_treasure_progress_change {
        addProgress: number;
        newProgress: number;
        newLotteryProcessLimit: number;
    }
    export interface Iplayer_heat_change {
        change: number;
        newval: number;
        newlotteryTimesLimit: number;
        newlotteryProcessLimit: number;
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
    export interface Iplayer_explore_start_res {
        res: number;
        buildingId: string;
        pioneerId: string;
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
        innerBuildingId: string;
        nftId: string;
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

    export interface Iplayer_world_treasure_lottery_res {
        res: number;
        itemId: string;
        num: number;
    }
    export interface Iget_treasure_info_res {
        res: number;
        data: { [key: string]: share.Itreasure_day_data };
    }
    export interface Iplayer_world_treasure_pool_change_res {
        res: number;
        itemId: string;
        num: number;
    }
    export interface Iplayer_wormhole_set_attacker_res {
        res: number;
        buildingId: string;
        attacker: { [key: string]: string };
    }
    export interface Iplayer_wormhole_fight_attacked_res {
        res: number;
        attackerName: string;
        defenderUid: string;
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
    export interface Iuser_task_action_getnewtalk {
        npcId: string;
        talkId: string;
    }
    export interface Iuser_task_did_change {
        task: share.Itask_data;
    }
    export interface Iget_user_task_info_res {
        res: number;
        tasks: share.Itask_data[];
    }

    export interface Iplayer_lvlup_change {
        hpMaxChangeValue: number;
        showBuildingIds: string[];
        newPsycLimit: number;
        newLv: number;
        items: any;
        artifacts: any;
    }

    export interface Iget_user_settlement_info_res {
        res: number;
        data: { [key: string]: share.Isettlement_data };
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
    export interface Iplayer_sinfo {
        /** player_sinfo playerid */
        playerid: number;

        /** player_sinfo pname */
        pname: string;

        /** player_sinfo gender */
        gender: number;

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
        didFinishRookie: boolean;
        generateTroopInfo?: troop_info_data;
        generateEnergyInfo?: energy_info_data;

        currFetchTimes: number;
        limitFetchTimes: number;

        defender: { [key: string]: string };
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
        mapbuilding?: Imapbuilding_data;
        tasks?: Itask_data[];
        shadows?: pos2d[];
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
        id: string;
        show: boolean;
        level: number;
        faction: number;
        type: string;
        stayPos: pos2d;

        hpMax: number;
        hp: number;

        attack: number;

        defend: number;

        speed: number;

        actionType: string;
        actionBeginTimeStamp: number;
        actionEndTimeStamp: number;

        winProgress?: number;
        winExp: number;
        actionEventId?: string;
        actionBuildingId?: string;
        killerId?: string;
        NFTId?: string;
        talkId?: string;

        actionFightRes: Ifight_res[];
        actionFightWinner: number;
        rebirthStartTime?: number;
        rebirthEndTime?: number;

        dieTime?: number;
        rebornTime?: number;
    }
    export interface Ifight_res {
        attackerId: string;
        defenderId: string;
        hp: number;
    }

    export interface Infts_data {
        nfts: { [key: string]: Infts_info_data };
    }
    export interface Infts_info_data {
        uniqueId: string;
        rarity: number;
        name: string;

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

    export interface Imapbuilding_data {
        buildings: { [key: string]: Imapbuilding_info_data };
    }
    export interface Imapbuilding_info_data {
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

    export interface Itreasure_day_data {
        rankData: { [key: string]: Itreasure_level_arr };
    }
    export interface Itreasure_level_arr {
        levels: Itreasure_level[];
    }
    export interface Itreasure_level {
        level: number;
        reward: Ireward_data[];
    }
    export interface Ireward_data {
        itemId: number;
        count: number;
        num: number;
    }

    export interface Itask_data {
        taskId: string;
        stepIndex: number;
        isFinished: boolean;
        isFailed: boolean;
        canGet: boolean;
        isGetted: boolean;
        steps: Itask_step_data[];
    }
    export interface Itask_step_data {
        id: string;
        completeIndex: number;
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
}
