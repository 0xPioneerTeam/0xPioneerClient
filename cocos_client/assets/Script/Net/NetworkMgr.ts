import { natrium_http } from "../natrium/client/natrium_http";
import { natrium_ws } from "../natrium/client/natrium_ws";

import { HttpMsg } from "./msg/HttpMsg";
import { WebsocketMsg, c2s_user } from "./msg/WebsocketMsg";
import { EthereumMsg } from "./msg/EthereumMsg";

import { Ethereum, WalletType } from "./ethers/Ethereum";

import CLog from "../Utils/CLog";
import ChainConfig from "../Config/ChainConfig";
import { UIHUDController } from "../UI/UIHUDController";

export class NetworkMgr {
    private static _httpmsg: HttpMsg;
    private static _websocketMsg: WebsocketMsg;
    private static _ethereumMsg: EthereumMsg;

    public static get websocketMsg(): WebsocketMsg {
        return this._websocketMsg;
    }
    public static get websocket(): natrium_ws {
        return this._websocketMsg.websocket;
    }

    public static get ethereumMsg(): EthereumMsg {
        return this._ethereumMsg;
    }
    public static get ethereum(): Ethereum {
        return this._ethereumMsg.ethereum;
    }

    public static get httpMsg(): HttpMsg {
        return this._httpmsg;
    }
    public static get http(): natrium_http {
        return this._httpmsg.http;
    }

    public static init(http_host: string, ws_host: string): boolean {
        this._httpmsg = new HttpMsg(http_host);
        this._websocketMsg = new WebsocketMsg(ws_host);
        this._ethereumMsg = new EthereumMsg();

        if (!this._httpmsg.init() || !this._websocketMsg.init()) {
            return false;
        }
        return true;
    }

    public static async websocketConnect(): Promise<boolean> {
        return await this.websocketMsg.websocketConnect();
    }

    public static async walletInit(walletType: WalletType = WalletType.ethereum): Promise<void> {
        await this.ethereum.init(walletType);
    }

    public static async LoginServer(account: string, walletType: string): Promise<c2s_user.Ilogin | null> {
        const signMessage = "Ethereum Signed Message:\n    Welcome to 0xPioneer\n    Login by address\n" + Math.floor(Date.now() / 1000);
        const signature = await this.ethereumMsg.signMessage(signMessage);

        CLog.info(`NetworkMgr, LoginServer, signature: ${signature}`);

        let r = await this.httpMsg.verify(account, signMessage, ChainConfig.getCurrentChainId(), signature, walletType);
        CLog.info("NetworkMgr, LoginServer, r: ", r);

        if (r.res == "OK") {
            let d: c2s_user.Ilogin = { name: "", uid: r.data.uid, token: r.data.token };
            // login designated account
            // d.uid = "2";
            // d.token = "8b99a1cffb23cdebe103fecd83e309ec-1724238715129-2";
            this.websocketMsg.login(d);
            return d;
        } else {
            if (r.code === -7) {
                UIHUDController.showCenterTip("Not Qualified");
            }
        }
        return null;
    }
}
