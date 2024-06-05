import { _decorator, Asset, AssetManager, Component, Node } from "cc";
import ViewController from "./BasicView/ViewController";
import { AudioMgr, BattleReportsMgr, LanMgr, LocalDataLoader, ResourcesMgr } from "./Utils/Global";
import ConfigMgr from "./Manger/ConfigMgr";
import NotificationMgr from "./Basic/NotificationMgr";
import { NotificationName } from "./Const/Notification";
import { GameName, HUDName, UIName } from "./Const/ConstUIDefine";
import { LoadingUI } from "./UI/Loading/LoadingUI";
import { GAME_ENV_IS_DEBUG, PioneerGameTest } from "./Const/ConstDefine";
import UIPanelManger, { UIPanelLayerType } from "./Basic/UIPanelMgr";
import { UIMainRootController } from "./UI/UIMainRootController";
import { DataMgr } from "./Data/DataMgr";
import { NetworkMgr } from "./Net/NetworkMgr";
import ChainConfig from "./Config/ChainConfig";
import CLog from "./Utils/CLog";
import { EthereumEventData_accountChanged, EthereumEventData_chainChanged, EthereumEventData_init, EthereumEventType } from "./Net/ethers/Ethereum";
import { s2c_user } from "./Net/msg/WebsocketMsg";
const { ccclass, property } = _decorator;

@ccclass("Main")
export class Main extends ViewController {
    //--------------------------------------- lifeCyc
    protected async viewDidLoad(): Promise<void> {
        super.viewDidLoad();

        // listener
        NotificationMgr.addListener(NotificationName.GAME_INITED, this._onGameInited, this);
        NotificationMgr.addListener(NotificationName.USER_LOGIN_SUCCEED, this._onUserLoginSucceed, this);

        // audio
        AudioMgr.prepareAudioSource();

        // language
        LanMgr.initData();

        // ConfigMgr init
        if (!(await ConfigMgr.init())) return;
        NotificationMgr.triggerEvent(NotificationName.CONFIG_LOADED);

        // DataMgr init
        if (!(await DataMgr.init())) return;

        // NetworkMgr init
        const chainConfig = ChainConfig.getCurrentChainConfig();
        if (chainConfig.api.init) {
            if (!NetworkMgr.init(chainConfig.api.http_host, chainConfig.api.ws_host)) {
                CLog.error("Main: NetworkMgr init failed");
                return;
            }
        }

        await UIPanelManger.inst.pushPanel(UIName.LoginUI);

        if (chainConfig.api.init) {
            this._addListener();
            NetworkMgr.websocketConnect();
        } else {
            NotificationMgr.triggerEvent(NotificationName.GAME_INITED);
        }
    }

    protected async viewDidStart(): Promise<void> {
        super.viewDidStart();
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.GAME_INITED, this._onGameInited, this);
        NotificationMgr.removeListener(NotificationName.USER_LOGIN_SUCCEED, this._onUserLoginSucceed, this);
    }

    //--------------------------------------- notification

    private async _onGameInited() {
        DataMgr.r.inited = true;

        (window as any).hideLoading();
    }

    private async _onUserLoginSucceed() {
        BattleReportsMgr.init();

        if (GAME_ENV_IS_DEBUG) {
            UIPanelManger.inst.popPanelByName(UIName.LoginUI);
            let loadingView: LoadingUI = null;
            const result = await UIPanelManger.inst.pushPanel(HUDName.Loading, UIPanelLayerType.HUD);
            if (result.success) {
                loadingView = result.node.getComponent(LoadingUI);
            }
            await this._showGameMain();
            UIPanelManger.inst.popPanel(loadingView.node, UIPanelLayerType.HUD);
            return;
        }

        // need show loading
        let loadRate: number = 0;
        const preloadRate: number = 0.4;
        ResourcesMgr.Init(async (err: Error, bundle: AssetManager.Bundle) => {
            if (err != null) {
                return;
            }
            // show loading
            UIPanelManger.inst.popPanelByName(UIName.LoginUI);
            let loadingView: LoadingUI = null;
            const result = await UIPanelManger.inst.pushPanel(HUDName.Loading, UIPanelLayerType.HUD);
            if (result.success) {
                loadingView = result.node.getComponent(LoadingUI);
            }
            bundle.preloadDir(
                "",
                (finished: number, total: number, item: AssetManager.RequestItem) => {
                    const currentRate = finished / total;
                    if (currentRate > loadRate) {
                        loadRate = currentRate;
                        loadingView?.showLoadingProgress(loadRate);
                    }
                },
                (err: Error, data: AssetManager.RequestItem[]) => {
                    if (err != null) {
                        return;
                    }
                    bundle.loadDir(
                        "",
                        (finished: number, total: number, item: AssetManager.RequestItem) => {
                            const currentRate = preloadRate + (finished / total) * (1 - preloadRate);
                            if (currentRate > loadRate) {
                                loadRate = currentRate;
                                loadingView?.showLoadingProgress(loadRate);
                            }
                        },
                        async (err: Error, data: Asset[]) => {
                            if (err != null) {
                                return;
                            }
                            // load
                            await this._showGameMain();
                            UIPanelManger.inst.popPanel(loadingView.node, UIPanelLayerType.HUD);
                        }
                    );
                }
            );
        });
    }

    private async _showGameMain() {
        await LocalDataLoader.loadLocalDatas();
        await UIPanelManger.inst.pushPanel(UIName.MainUI);
        await this.node.getChildByPath("UI_Canvas/UI_ROOT").getComponent(UIMainRootController).checkShowRookieGuide();
        await UIPanelManger.inst.pushPanel(GameName.GameMain, UIPanelLayerType.Game);
    }

    private _addListener() {
        // main listener
        // --- ethereum
        NetworkMgr.ethereum.on(EthereumEventType.accountChanged, this.accountChanged_res);
        NetworkMgr.ethereum.on(EthereumEventType.chainChanged, this.chainChanged_res);
        NetworkMgr.ethereum.on(EthereumEventType.init, this.init_res);
        // --- websocket connection
        NetworkMgr.websocket.on("disconnected", this.disconnected);
        NetworkMgr.websocket.on("connected", this.connected);
        // --- websocket common
        NetworkMgr.websocket.on("login_res", this.login_res);
        NetworkMgr.websocket.on("create_player_res", this.create_player_res);

        // DataMgr listener
        // websocket
        NetworkMgr.websocket.on("onmsg", DataMgr.onmsg);
        NetworkMgr.websocket.on("enter_game_res", DataMgr.enter_game_res);

        NetworkMgr.websocket.on("sinfo_change", DataMgr.sinfo_change);
        // item changed
        NetworkMgr.websocket.on("storhouse_change", DataMgr.storhouse_change);
        // artifact
        NetworkMgr.websocket.on("artifact_change", DataMgr.artifact_change);
        NetworkMgr.websocket.on("player_artifact_change_res", DataMgr.player_artifact_change_res);
        NetworkMgr.websocket.on("player_artifact_combine_res", DataMgr.player_artifact_combine_res);
        // inner builing
        NetworkMgr.websocket.on("building_change", DataMgr.building_change);
        NetworkMgr.websocket.on("player_building_pos_res", DataMgr.player_building_pos_res);
        NetworkMgr.websocket.on("player_building_levelup_res", DataMgr.player_building_levelup_res);
        NetworkMgr.websocket.on("player_generate_troop_start_res", DataMgr.player_generate_troop_start_res);
        // map
        NetworkMgr.websocket.on("pioneer_change", DataMgr.pioneer_change);
        NetworkMgr.websocket.on("mapbuilding_change", DataMgr.mapbuilding_change);

        NetworkMgr.websocket.on("mappioneer_reborn_change", DataMgr.mappioneer_reborn_change);
        NetworkMgr.websocket.on("mapbuilding_reborn_change", DataMgr.mapbuilding_reborn_change);

        NetworkMgr.websocket.on("player_move_res", DataMgr.player_move_res);
        NetworkMgr.websocket.on("player_gather_start_res", DataMgr.player_gather_start_res);
        NetworkMgr.websocket.on("player_explore_start_res", DataMgr.player_explore_start_res);
        NetworkMgr.websocket.on("player_explore_npc_start_res", DataMgr.player_explore_npc_start_res);
        NetworkMgr.websocket.on("player_event_select_res", DataMgr.player_event_select_res);
        NetworkMgr.websocket.on("player_wormhole_set_attacker_res", DataMgr.player_wormhole_set_attacker_res);


        NetworkMgr.websocket.on("player_fight_end", DataMgr.player_fight_end);

        // nft
        NetworkMgr.websocket.on("nft_change", DataMgr.nft_change);
        NetworkMgr.websocket.on("player_nft_lvlup_res", DataMgr.player_nft_lvlup_res);
        NetworkMgr.websocket.on("player_nft_rankup_res", DataMgr.player_nft_rankup_res);
        // wormhole
        NetworkMgr.websocket.on("player_wormhole_fight_attacked_res", DataMgr.player_wormhole_fight_attacked_res);
        NetworkMgr.websocket.on("player_wormhole_fight_res", DataMgr.player_wormhole_fight_res);
        // psyc
        NetworkMgr.websocket.on("fetch_user_psyc_res", DataMgr.fetch_user_psyc_res);
        // world treasure
        NetworkMgr.websocket.on("player_world_treasure_lottery_res", DataMgr.player_world_treasure_lottery_res);
        NetworkMgr.websocket.on("get_treasure_info_res", DataMgr.get_treasure_info_res);
        NetworkMgr.websocket.on("player_world_treasure_pool_change_res", DataMgr.player_world_treasure_pool_change_res);

        // pioneernft func
        NetworkMgr.websocket.on("player_treasure_open_res", DataMgr.player_treasure_open_res);
        NetworkMgr.websocket.on("player_point_treasure_open_res", DataMgr.player_point_treasure_open_res);
        NetworkMgr.websocket.on("player_building_delegate_nft_res", DataMgr.player_building_delegate_nft_res);
        NetworkMgr.websocket.on("player_nft_skill_learn_res", DataMgr.player_nft_skill_learn_res);
        NetworkMgr.websocket.on("player_nft_skill_forget_res", DataMgr.player_nft_skill_forget_res);

        NetworkMgr.websocket.on("player_rookie_finish_res", DataMgr.player_rookie_finish_res);
        NetworkMgr.websocket.on("player_lvlup_change", DataMgr.player_lvlup_change);

        // task
        NetworkMgr.websocket.on("user_task_action_getnewtalk", DataMgr.user_task_action_getnewtalk);
        NetworkMgr.websocket.on("user_task_did_change", DataMgr.user_task_did_change);
        NetworkMgr.websocket.on("get_user_task_info_res", DataMgr.get_user_task_info_res);

        //settlement
        NetworkMgr.websocket.on("get_user_settlement_info_res", DataMgr.get_user_settlement_info_res);
    }

    private async reconnect() {
        DataMgr.r.reconnects++;
        CLog.info(`Main/reconnect, count: ${DataMgr.r.reconnects}`);
        let r = await NetworkMgr.websocketConnect();
        if (r) {
            CLog.info(`Main/reconnect success [${DataMgr.r.reconnects}]`);
            if (DataMgr.r.wallet.addr) {
                CLog.info(`Main/reconnect: websocket login starting`);
                NetworkMgr.websocketMsg.login(DataMgr.r.loginInfo);
            }
        }
    }
    private connected = (e: any) => {
        NotificationMgr.triggerEvent(NotificationName.GAME_INITED);
    };
    private disconnected = (e: any) => {
        CLog.error("Main/disconnected, e: ", e);
        if (DataMgr.r.reconnects < 3) {
            this.reconnect();
        } else {
            CLog.error("Main/disconnected: retry connecting failed");
        }
    };

    private init_res = async (e: any) => {
        let d: EthereumEventData_init = e.data;
        if (d.res === 0) {
            let r = await NetworkMgr.LoginServer(d.account, d.walletType);
            if (r?.token) {
                DataMgr.r.wallet.type = d.walletType;
                DataMgr.r.loginInfo = r;
            }
        }
    };
    private accountChanged_res = (e: any) => {
        CLog.error("accountChanged", e);
        let d: EthereumEventData_accountChanged = e.data;
        let newAccount = d.changedAccount;

        DataMgr.r.wallet.addr = "";
        DataMgr.r.wallet.type = "";
    };
    private chainChanged_res = (e: any) => {
        CLog.error("chainChanged", e);
        let d: EthereumEventData_chainChanged = e.data;
        let newChainId = d.changedChainId;

        DataMgr.r.wallet.addr = "";
        DataMgr.r.wallet.type = "";
    };

    private login_res = (e: any) => {
        let p: s2c_user.Ilogin_res = e.data;
        if (p.res === 1) {
            if (!p.data?.uid) return;
            DataMgr.r.wallet.addr = p.data.wallet;
            if (p.isNew) {
                NetworkMgr.websocketMsg.create_player({ pname: `Pioneer${p.data.uid}`, gender: 0 });
            } else {
                NetworkMgr.websocketMsg.enter_game({});
            }
        }
    };
    private create_player_res = (e: any) => {
        let p: s2c_user.Icreate_player_res = e.data;
        if (p.res === 1) {
            NetworkMgr.websocketMsg.enter_game({});
        }
    };
}
