import { natrium_http } from "../../natrium/client/natrium_http";
import CLog from "../../Utils/CLog";

export class HttpMsg {
    private _http_host: string;
    private _http: natrium_http;

    public constructor(http_host: string = "") {
        this._http_host = http_host;
        this._http = new natrium_http();
    }

    public get http() {
        return this._http;
    }

    public init(): boolean {
        if (this._http_host == "") {
            CLog.error("HttpMsg: _http_host not set");
            return false;
        }
        this._http.init();
        CLog.debug("HttpMsg: init success");
        return true;
    }

    public async http_post(method: string, data: any): Promise<any> {
        if (this._http.connecter == null) {
            return;
        }
        const url = `${this._http_host}${method}`;
        return await this._http.connecter.post(url, data);
    }

    public async verify(walletaddr: string, signmsg: string, chainid: string, signature: string, walletType: string): Promise<any> {
        let r = await this.http_post("/verify", { walletaddr, signmsg, chainid, signature, walletType });
        return r;
    }
    public async fakeAccountVerify(inputaccount: string) {
        let r = await this.http_post("/verify", { onlyaccount: true, inputaccount });
        return r;
    }

    public async get_star_list(): Promise<any> {
        let r = await this.http_post("/get_star_list", {});
        return r;
    }

    public async get_star_info(starRole: number) {
        let r = await this.http_post("/get_star_info", { starRole });
        return r;
    }
}
