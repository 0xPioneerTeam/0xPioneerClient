import { _decorator, Asset, AssetManager, director } from "cc";
import ViewController from "./BasicView/ViewController";
import { AudioMgr, LanMgr, LocalDataLoader, ResourcesMgr } from "./Utils/Global";
import ConfigMgr from "./Manger/ConfigMgr";
import NotificationMgr from "./Basic/NotificationMgr";
import { NotificationName } from "./Const/Notification";
import { GameName, HUDName, UIName } from "./Const/ConstUIDefine";
import { LoadingUI } from "./UI/Loading/LoadingUI";
import { GAME_ENV_IS_DEBUG } from "./Const/ConstDefine";
import UIPanelManger, { UIPanelLayerType } from "./Basic/UIPanelMgr";
import { UIMainRootController } from "./UI/UIMainRootController";
import { DataMgr } from "./Data/DataMgr";
import { NetworkMgr } from "./Net/NetworkMgr";
import ChainConfig from "./Config/ChainConfig";
import CLog from "./Utils/CLog";
import { EthereumEventData_accountChanged, EthereumEventData_chainChanged, EthereumEventData_init, EthereumEventType } from "./Net/ethers/Ethereum";
import { c2s_user, s2c_user } from "./Net/msg/WebsocketMsg";
import { BundleName } from "./Basic/ResourcesMgr";
import { GuideMgr } from "./UI/guide/GuideMgr";
import RookieStepMgr from "./Manger/RookieStepMgr";
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

        const result = await ResourcesMgr.initBundle(BundleName.MainBundle);
        if (result.succeed) {
            result.bundle.preloadDir("");
        }

        window.addEventListener("blur", this.onBlur, false);
        window.addEventListener("focus", this.onFocus, false);
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
        const result = await ResourcesMgr.initBundle(BundleName.MainBundle);
        if (result.succeed) {
            // show loading
            UIPanelManger.inst.popPanelByName(UIName.LoginUI);
            let loadingView: LoadingUI = null;
            const loadingResult = await UIPanelManger.inst.pushPanel(HUDName.Loading, UIPanelLayerType.HUD);
            if (loadingResult.success) {
                loadingView = loadingResult.node.getComponent(LoadingUI);
            }
            result.bundle.preloadDir(
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
                    result.bundle.loadDir(
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
        }
    }

    private async _showGameMain() {
        if (this["__gameMainShowed"]) {
            return;
        }
        this["__gameMainShowed"] = true;
        await LocalDataLoader.loadLocalDatas();
        await UIPanelManger.inst.pushPanel(UIName.MainUI);
        GuideMgr.ins.initGuideData();
        RookieStepMgr.instance().init();
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
        NetworkMgr.websocket.on("update_name_res", DataMgr.update_name_res);

        NetworkMgr.websocket.on("sinfo_change", DataMgr.sinfo_change);
        NetworkMgr.websocket.on("player_rookie_update_res", DataMgr.player_rookie_update_res);
        NetworkMgr.websocket.on("player_rookie_wormhole_fight_res", DataMgr.player_rookie_wormhole_fight_res);
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
        NetworkMgr.websocket.on("get_map_info_res", DataMgr.get_map_info_res);
        NetworkMgr.websocket.on("player_enterzone", DataMgr.player_enterzone);
        NetworkMgr.websocket.on("player_leavezone", DataMgr.player_leavezone);
        NetworkMgr.websocket.on("pioneer_leavezone", DataMgr.pioneer_leavezone);

        NetworkMgr.websocket.on("player_get_new_pioneer", DataMgr.player_get_new_pioneer);
        NetworkMgr.websocket.on("pioneer_change", DataMgr.pioneer_change);
        NetworkMgr.websocket.on("mapbuilding_change", DataMgr.mapbuilding_change);

        NetworkMgr.websocket.on("mappioneer_reborn_change", DataMgr.mappioneer_reborn_change);
        NetworkMgr.websocket.on("mapbuilding_reborn_change", DataMgr.mapbuilding_reborn_change);

        NetworkMgr.websocket.on("player_move_res", DataMgr.player_move_res);
        NetworkMgr.websocket.on("player_gather_start_res", DataMgr.player_gather_start_res);
        NetworkMgr.websocket.on("player_explore_start_res", DataMgr.player_explore_start_res);
        NetworkMgr.websocket.on("player_explore_npc_start_res", DataMgr.player_explore_npc_start_res);
        NetworkMgr.websocket.on("player_wormhole_set_attacker_res", DataMgr.player_wormhole_set_attacker_res);
        NetworkMgr.websocket.on("player_explore_maincity_res", DataMgr.player_explore_maincity_res);
        NetworkMgr.websocket.on("player_pos_detect_res", DataMgr.player_pos_detect_res);


        NetworkMgr.websocket.on("player_fight_end", DataMgr.player_fight_end);

        NetworkMgr.websocket.on("player_wormhole_tp_random_res", DataMgr.player_wormhole_tp_random_res);
        NetworkMgr.websocket.on("player_wormhole_tp_select_res", DataMgr.player_wormhole_tp_select_res);
        NetworkMgr.websocket.on("player_wormhole_tp_back_res", DataMgr.player_wormhole_tp_back_res);
        NetworkMgr.websocket.on("player_wormhole_tp_tag_res", DataMgr.player_wormhole_tp_tag_res);

        // nft
        NetworkMgr.websocket.on("nft_change", DataMgr.nft_change);
        NetworkMgr.websocket.on("player_nft_lvlup_res", DataMgr.player_nft_lvlup_res);
        NetworkMgr.websocket.on("player_nft_rankup_res", DataMgr.player_nft_rankup_res);
        // wormhole
        NetworkMgr.websocket.on("player_wormhole_fight_res", DataMgr.player_wormhole_fight_res);
        // psyc
        NetworkMgr.websocket.on("fetch_user_psyc_res", DataMgr.fetch_user_psyc_res);
        // pioneernft func
        NetworkMgr.websocket.on("player_nft_skill_learn_res", DataMgr.player_nft_skill_learn_res);
        NetworkMgr.websocket.on("player_nft_skill_forget_res", DataMgr.player_nft_skill_forget_res);

        NetworkMgr.websocket.on("player_lvlup_change", DataMgr.player_lvlup_change);

        // task
        NetworkMgr.websocket.on("user_task_did_change", DataMgr.user_task_did_change);
        NetworkMgr.websocket.on("user_task_action_talk", DataMgr.user_task_action_talk);
        NetworkMgr.websocket.on("user_task_talk_info_change", DataMgr.user_task_talk_info_change);
        NetworkMgr.websocket.on("user_mission_did_change", DataMgr.user_mission_did_change);

        // box
        NetworkMgr.websocket.on("player_worldbox_beginner_open_res", DataMgr.player_worldbox_beginner_open_res);
        NetworkMgr.websocket.on("player_worldbox_beginner_open_select_res", DataMgr.player_worldbox_beginner_open_select_res);
        NetworkMgr.websocket.on("player_worldbox_open_res", DataMgr.player_worldbox_open_res);

        //settlement
        NetworkMgr.websocket.on("get_user_settlement_info_res", DataMgr.get_user_settlement_info_res);

        NotificationMgr.addListener(NotificationName.FAKE_ROOKIESTEP_CHANGE, this._onFakeRookieStepChange, this);
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
            NotificationMgr.triggerEvent(NotificationName.GAME_RETRY_CONNECT_FAILED);
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

    //------------------------ notification
    private _onFakeRookieStepChange(d: c2s_user.Iplayer_rookie_update) {
        DataMgr.player_rookie_update_res({
            data: {
                res: 1,
                rookieStep: d.rookieStep,
            },
        });
    }

    private blurTs;
    private onBlur() {
        this.blurTs = new Date().getTime();
    }
    private onFocus() {
        let durTs = new Date().getTime() - this.blurTs;
        director.tick(durTs / 1000);
    }
}
