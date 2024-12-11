import { natrium_http } from "../natrium/client/natrium_http";
import { natrium_ws } from "../natrium/client/natrium_ws";

import { HttpMsg } from "./msg/HttpMsg";
import { WebsocketMsg, c2s_user } from "./msg/WebsocketMsg";
import { EthereumMsg } from "./msg/EthereumMsg";

import { Ethereum, WalletType } from "./ethers/Ethereum";

import CLog from "../Utils/CLog";
import ChainConfig from "../Config/ChainConfig";
import { UIHUDController } from "../UI/UIHUDController";
import { AptosMsg } from "./msg/AptosMsg";
import { Aptos } from "./aptos/aptos";

export const enum ChainType {
    ethereum = "ethereum",
    aptos = "aptos",
}

export class NetworkMgr {
    private static _httpmsg: HttpMsg;
    private static _websocketMsg: WebsocketMsg;
    private static _ethereumMsg: EthereumMsg;
    private static _aptosMsg: AptosMsg;

    private static _chainType: ChainType;

    public static set chainType(chainType: ChainType) {
        this._chainType = chainType;
    }
    public static get chainType(): ChainType {
        return this._chainType;
    }

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

    public static get aptosMsg(): AptosMsg {
        return this._aptosMsg;
    }
    public static get aptos(): Aptos {
        return this._aptosMsg.aptos;
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
        this._aptosMsg = new AptosMsg();

        if (!this._httpmsg.init() || !this._websocketMsg.init()) {
            return false;
        }
        return true;
    }

    public static async websocketConnect(): Promise<boolean> {
        return await this.websocketMsg.websocketConnect();
    }

    public static async walletInit(chainType: ChainType): Promise<void> {
        this.chainType = chainType;
        if (this.chainType == ChainType.aptos) {
            await this.aptos.init();
        }
        else {
            await this.ethereum.init();
        }
    }

    public static async LoginServer(account: string, walletType: string): Promise<c2s_user.Ilogin | null> {
        let signMessage = "Signed Message:\n    Welcome to 0xPioneer\n    Login by address\n" + Math.floor(Date.now() / 1000);

        let signature = "";
        let publickey = "";
        let fullMessage = "";
        if (this.chainType == ChainType.aptos) {
            
            const signmessage_result = await this.aptosMsg.signMessage(signMessage);
            signature = signmessage_result.signature;
            fullMessage = signmessage_result.fullMessage;
            CLog.debug(`Wallet signMessage result: ${JSON.stringify(signmessage_result)}`);

            // get public key
            const account_result = await this.aptosMsg.account();
            CLog.debug(`Wallet account result: ${JSON.stringify(account_result)}`);
            publickey = account_result.publicKey;
        }
        else {
            signature = await this.ethereumMsg.signMessage(signMessage);
        }
        CLog.info(`NetworkMgr, LoginServer, signature: ${signature}`);

        let r = await this.httpMsg.verify(account, signMessage, ChainConfig.getCurrentChainId(), signature, walletType, this.chainType, publickey, fullMessage);
        CLog.info("NetworkMgr, LoginServer, r: ", r);

        if (r.res == "OK") {
            let d: c2s_user.Ilogin = { name: "", uid: r.data.uid, token: r.data.token };
            // login designated account
            // d.uid = "9";
            // d.token = "4111d3eef3662326324e5928088a53a6-1726775785271-9";
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
