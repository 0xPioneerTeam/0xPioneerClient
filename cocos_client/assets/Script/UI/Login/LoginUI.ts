import { _decorator, Component, Node, ProgressBar, Label, SceneAsset, director, Button, EventHandler, EditBox, AssetManager, Asset, tween, v3 } from "cc";
import { md5 } from "../../Utils/Md5";
import ConfigConfig from "../../Config/ConfigConfig";
import ViewController from "../../BasicView/ViewController";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import ChainConfig from "../../Config/ChainConfig";
import CLog from "../../Utils/CLog";
import { DataMgr } from "../../Data/DataMgr";
import { NetworkMgr } from "../../Net/NetworkMgr";
import { ConfigType, LoginWhiteListParam } from "../../Const/Config";
import { AudioMgr } from "../../Utils/Global";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import { UIName } from "../../Const/ConstUIDefine";
import UIPanelManger from "../../Basic/UIPanelMgr";
import { PlayerInfoUI } from "../PlayerInfoUI";
import { CollectWalletUI } from "../CollectWallet/CollectWalletUI";
import { c2s_user } from "../../Net/msg/WebsocketMsg";
const { ccclass, property } = _decorator;

@ccclass("LoginUI")
export class LoginUI extends ViewController {
    //--------------------------------------- lifeCyc
    private _loginClicked: boolean = false;

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this.node.getChildByPath("AlertView").active = false;
    }
    protected viewDidStart(): void {
        super.viewDidStart();
        GameMusicPlayMgr.playLoginMusic();
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();
    }

    private _loginStart() {
        const chainConf = ChainConfig.getCurrentChainConfig();
        if (chainConf.api.init) {
            this.onTapStart_chain();
            return;
        }

        this.node.getChildByName("StartView").active = false;
        this.node.getChildByName("LoginView").active = true;
    }

    //--------------------------------------- action
    private async onTapStart() {
        GameMusicPlayMgr.playTapButtonEffect();
        const lastLoginMethod = localStorage.getItem("lastLoginMethod");
        if (lastLoginMethod != null) {
            this._loginStart();
            return;
        }
        const result = await UIPanelManger.inst.pushPanel(UIName.CollectWalletUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(CollectWalletUI).configuration((method: string) => {
            this._loginStart();
            localStorage.setItem("lastLoginMethod", method);
        });
    }
    private onTapStart_chain() {
        let d: c2s_user.Ilogin = { name: "", uid: "6", token: "666e730d1aac4ba8e77fa99d8ebc00e9-1726042349182-6" };
        NetworkMgr.websocketMsg.login(d);
        return;
        if (!DataMgr.r.inited) {
            CLog.warn("LoginUI: game init failed");
            return;
        }
        NetworkMgr.ethereum.init();
    }

    private async onTapLogin() {
        if (!DataMgr.r.inited) {
            CLog.warn("LoginUI: Game inited failed");
            return;
        }

        const codeEditBox = this.node.getChildByPath("LoginView/CodeInput").getComponent(EditBox);
        if (codeEditBox.string.length <= 0) {
            return;
        }

        if (this._loginClicked) return;
        this._loginClicked = true;

        let canEnter: boolean = false;
        const whiteList = ConfigConfig.getConfig(ConfigType.LoginWhiteList) as LoginWhiteListParam;
        if (whiteList == null || whiteList.whiteList == null || whiteList.whiteList.length <= 0) {
            canEnter = true;
        } else {
            for (const temple of whiteList.whiteList) {
                if (temple.toUpperCase() === md5(codeEditBox.string).toUpperCase()) {
                    canEnter = true;
                    break;
                }
            }
        }
        if (canEnter) {
            NotificationMgr.triggerEvent(NotificationName.USER_LOGIN_SUCCEED);
        }
    }

    private onTapCloseTip() {
        GameMusicPlayMgr.playTapButtonEffect();
        const contentView: Node = this.node.getChildByPath("AlertView/Img");
        // tween()
        //     .target(contentView)
        //     .to(0.5, { scale: v3(0, 0, 0) }, { easing: "bounceIn" })
        //     .call(() => {
        //         this.node.getChildByPath("AlertView").active = false;
        //     })
        //     .start();
    }
    private async onTapSetting() {
        GameMusicPlayMgr.playTapButtonEffect();
        const result = await UIPanelManger.inst.pushPanel(UIName.PlayerInfoUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(PlayerInfoUI).configuration(2, true);
    }

    private async onTapConnect() {
        GameMusicPlayMgr.playTapButtonEffect();
        const result = await UIPanelManger.inst.pushPanel(UIName.CollectWalletUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(CollectWalletUI).configuration((method: string) => {
            this._loginStart();
            localStorage.setItem("lastLoginMethod", method);
        });
    }
}
