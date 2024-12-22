import { resources } from "cc";
import CLog from "../Utils/CLog";
import { WarOrderConfigData } from "../Const/WarOrderDefine";

export default class WarOrderConfig {
    private static _confs: WarOrderConfigData [] = [];

    public static async init(): Promise<boolean> {
        const obj: any = await new Promise((resolve) => {
            resources.load("data_local/battlepass_lvlup", (err: Error, data: any) => {
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

        for (const key in obj) {
            this._confs.push(obj[key]);
        }
        CLog.debug("WarOrderConfig init success", this._confs);
        return true;
    }

    public static getAll():  WarOrderConfigData [] {
        return this._confs;
    }
    public static getById(Id: string): WarOrderConfigData | null {
        const findConf = this._confs.filter((conf) => {
            return conf.id === Id;
        });
        if (findConf.length > 0) {
            return findConf[0];
        }
        return null;
    }
}
