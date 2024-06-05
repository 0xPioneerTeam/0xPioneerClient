import { _decorator, Component, Node, ProgressBar, Label, SceneAsset, director, Button, EventHandler, EditBox, AssetManager, Asset } from "cc";
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
const { ccclass, property } = _decorator;

@ccclass("CompLogin")
export class LoginUI extends ViewController {
    //--------------------------------------- lifeCyc
    private _loginClicked: boolean = false;

    protected viewDidLoad(): void {
        super.viewDidLoad();
    }
    protected viewDidStart(): void {
        super.viewDidStart();
        GameMusicPlayMgr.playLoginMusic();
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();
    }

    //--------------------------------------- action
    private onTapStart() {
        GameMusicPlayMgr.playTapButtonEffect();
        const chainConf = ChainConfig.getCurrentChainConfig();
        if (chainConf.api.init) {
            this.onTapStart_chain();
            return;
        }

        this.node.getChildByName("StartView").active = false;
        this.node.getChildByName("LoginView").active = true;
    }
    private onTapStart_chain() {
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
}
