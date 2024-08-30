import { resources } from "cc";
import { NFTPioneerSkillEffectConfigData } from "../Const/NFTPioneerDefine";
import { LanMgr } from "../Utils/Global";
import CLog from "../Utils/CLog";

export default class NFTSkillEffectConfig {
    private static _confs: { [index: string]: NFTPioneerSkillEffectConfigData } = {};

    public static async init(): Promise<boolean> {
        const obj: any = await new Promise((resolve) => {
            resources.load("data_local/skill_effect", (err: Error, data: any) => {
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
        CLog.debug("nftskilleffect init success", this._confs);
        return true;
    }

    public static getById(id: string): NFTPioneerSkillEffectConfigData | null {
        if (id in this._confs) {
            return this._confs[id];
        }
        return null;
    }
    public static getDesByIds(ids: string[]): string {
        let des = "";
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const conf = this.getById(id);
            if (conf) {
                des += LanMgr.getLanById(conf.des) + "\n";
            }
        }
        return des;
    }
}
