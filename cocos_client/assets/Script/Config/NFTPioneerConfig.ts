import { resources } from "cc";
import { NFTPioneerConfigData } from "../Const/NFTPioneerDefine";
import CommonTools from "../Tool/CommonTools";
import CLog from "../Utils/CLog";

export default class NFTPioneerConfig {
    private static _confs: { [index: string]: NFTPioneerConfigData } = {};

    public static async init(): Promise<boolean> {
        // read itemconf config
        const obj: any = await new Promise((resolve) => {
            resources.load("data_local/nft_pioneer", (err: Error, data: any) => {
                if (err) {
                    resolve(null);
                    return;
                }
                resolve(data.json);
            });
        });

        if (!obj) {
            return false;
        }
        this._confs = obj;
        CLog.debug("nftPioneer init success", this._confs);
        return true;
    }

    public static getById(id: string): NFTPioneerConfigData | null {
        if (id in this._confs) {
            return this._confs[id];
        }
        return null;
    }

    public static getAll() {
        return this._confs;
    }
}
