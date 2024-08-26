import { resources } from "cc";
import CLog from "../Utils/CLog";
import { GuideConfigData } from "../Const/Guide";

export default class GuideConfig {
    private static _confs: GuideConfigData[] = [];

    public static async init(): Promise<boolean> {
        const obj: any = await new Promise((resolve) => {
            resources.load("data_local/guide", (err: Error, data: any) => {
                if (err) {
                    resolve(null);
                    return;
                }
                resolve(data.json);
            });
        });
        if (!obj) {
            CLog.error("DropConfig init error");
            return false;
        }

        for (const key in obj) {
            this._confs.push(obj[key]);
        }
        CLog.debug("DropConfig init success", this._confs);
        return true;
    }

    public static getById(guideId: string): GuideConfigData | null {
        const findConf = this._confs.filter((conf) => {
            return conf.id === guideId;
        });
        if (findConf.length > 0) {
            return findConf[0];
        }
        return null;
    }
}
