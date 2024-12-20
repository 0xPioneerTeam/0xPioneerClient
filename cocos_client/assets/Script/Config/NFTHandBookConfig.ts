import { resources } from "cc";
import { NFTHandBookConfigData, NFTPioneerConfigData } from "../Const/NFTPioneerDefine";
import CommonTools from "../Tool/CommonTools";
import CLog from "../Utils/CLog";

export default class NFTHandBookConfig {
    private static _confs: { [index: string]: NFTHandBookConfigData } = {};

    public static async init(): Promise<boolean> {
        // read itemconf config
        const obj: any = await new Promise((resolve) => {
            resources.load("data_local/handbook", (err: Error, data: any) => {
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
        return true;
    }

    public static getAll() {
        return this._confs;
    }
}
