import { resources } from "cc";
import { DropConfigData } from "../Const/Drop";
import CLog from "../Utils/CLog";
import { rank_reward_config, rank_season_type, rank_type } from "../Const/rank_define";

export default class RankRewardConfig {
    private static _confs: rank_reward_config[] = [];

    public static async init(): Promise<boolean> {
        const obj: any = await new Promise((resolve) => {
            resources.load("data_local/ranking", (err: Error, data: any) => {
                if (err) {
                    resolve(null);
                    return;
                }
                resolve(data.json);
            });
        });
        if (!obj) {
            CLog.error("RankRewardConfig init error");
            return false;
        }

        for (const key in obj) {
            this._confs.push(obj[key]);
        }
        CLog.debug("RankRewardConfig init success", this._confs);
        return true;
    }

    public static getAll() {
        return this._confs;
    }

    public static checkRankOpen(seasonType: rank_season_type, type: rank_type): boolean {
        return (
            this._confs.find((item) => {
                return item.season_type == seasonType && item.ranking_type == type;
            }) != undefined
        );
    }
}
