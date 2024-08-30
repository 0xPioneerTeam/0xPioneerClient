import { resources } from "cc";
import { NFTPioneerSkillConfigData } from "../Const/NFTPioneerDefine";
import CLog from "../Utils/CLog";

export default class NFTSkillConfig {
    private static _confs: { [index: string]: NFTPioneerSkillConfigData } = {};

    public static async init(): Promise<boolean> {
        const obj: any = await new Promise((resolve) => {
            resources.load("data_local/skill", (err: Error, data: any) => {
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
        CLog.debug("nftskill init success", this._confs);
        return true;
    }

    public static getById(id: string): NFTPioneerSkillConfigData | null {
        if (id in this._confs) {
            return this._confs[id];
        }
        return null;
    }
}
