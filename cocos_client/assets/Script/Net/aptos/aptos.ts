import { sys } from "cc";
import CLog from "../../Utils/CLog";
import { EventEmitter } from "../../natrium/util/event_emmiter";

export const enum AptosEventType {
    init = "aptosinit",
}

export const enum AptosWalletType {
    aptos = "aptos",
    petra = "petra",
    null = "null"
}

export interface SignMessageResult {
    address: string;
    application: string;
    chainId: number;
    message: string;
    nonce: string;
    fullMessage: string;
    prefix: string;
    signature: string;
}
export interface AccountResult {
    address: string;
    publicKey: string;
}


export interface AptosEventData_init {
    res: number;
    walletType: AptosWalletType;
    account: string;
}

export class Aptos extends EventEmitter {
    public static instance: Aptos;

    private _initCallback = false;

    protected _provider: any;
    // protected _signer: any;

    protected _walletAddr: string;

    protected _walletType: AptosWalletType | null = null;

    constructor() {
        super();
        Aptos.instance = this;
    }

    public get walletAddress() {
        // return this._signer.address;
        return this._walletAddr;
    }
    public get walletType() {
        return this._walletType;
    }
    private _walletTypeDetected(): AptosWalletType {
        let win: any = window;
        if (win.petra) {
            return AptosWalletType.petra;
        }
        else if (win.aptos) {
            return AptosWalletType.aptos;
        }

        return AptosWalletType.null;
    }

    // *** login
    // res => 0:init success, 1:not installed, 2:walletType err, 3:chainId err
    public async init(walletType: AptosWalletType = AptosWalletType.aptos): Promise<void> {
        CLog.info("Aptos, Init, starting ...");
        let win: any = window;
        if (sys.platform === sys.Platform.DESKTOP_BROWSER) {
            let walletTypeDetected = this._walletTypeDetected();
            if (walletTypeDetected != walletType && walletTypeDetected != AptosWalletType.aptos) walletType = walletTypeDetected;
            this._walletType = walletType;

            switch (this.walletType) {
                case AptosWalletType.petra:
                case AptosWalletType.aptos:
                    break;
                default: 
                    {
                        let d: AptosEventData_init = {
                            res: 1,
                            walletType: walletType,
                            account: "",
                        };
                        this.emit(AptosEventType.init, d);
                        return;
                    }
            }

            // init callback
            if (!this._initCallback) {
                this._initCallback = true;
                // win.ethereum.on("chainChanged", this._chainChanged);
                // win.ethereum.on("accountsChanged", this._accountChanged);
            }
            this._provider = win.aptos;
        } else if (sys.platform === sys.Platform.MOBILE_BROWSER) {
        }

        try {
            const response = await this._provider.connect();
            this._walletAddr = response.address;

            let d: AptosEventData_init = {
                res: 0,
                walletType: walletType,
                account: response.address,
            };
            this.emit(AptosEventType.init, d);

        } catch (error) {
            let d: AptosEventData_init = {
                res: 2,
                walletType: walletType,
                account: "",
            };
            this.emit(AptosEventType.init, d);
            return;
        }

        
    }

    public async SignMessage(msg: string): Promise<SignMessageResult> {
        return await this._provider.signMessage({
            message: msg,
            nonce: new Date().getTime().toString(),
        });
    }

    public async Account(): Promise<AccountResult> {
        return await this._provider.account();
    }
}
