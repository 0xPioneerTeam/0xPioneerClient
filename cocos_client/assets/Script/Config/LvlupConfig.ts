import { resources } from "cc";
import { LvlupConfigData } from "../Const/Lvlup";
import CLog from "../Utils/CLog";
import ItemData from "../Const/Item";

export default class LvlupConfig {
    private static _confs: { [index: string]: LvlupConfigData } = {};
    private static _extras: { [index: string]: number } = {};
    private static _hpmaxs: { [index: string]: number } = {};
    private static _visions: { [index: string]: number } = {};

    public static async init(): Promise<boolean> {
        const obj: any = await new Promise((resolve) => {
            resources.load("data_local/lvlup", (err: Error, data: any) => {
                if (err) {
                    resolve(null);
                    return;
                }
                resolve(data.json);
            });
        });
        if (!obj) {
            CLog.error("LvlupConfig init error");
            return false;
        }

        this._confs = obj;

        const keys = Object.keys(obj);
        keys.sort((a, b) => {
            let na = Number(a);
            let nb = Number(b);
            if (na > nb) return 1;
            if (na < nb) return -1;
            return 0;
        });
        for (let i = 0; i < keys.length; i++) {
            const lvlStr = keys[i];
            const conf = obj[lvlStr] as LvlupConfigData;

            if (Number(lvlStr) > 1) {
                let preLvStr = (Number(lvlStr) - 1).toString();
                this._extras[lvlStr] += this._extras[preLvStr];
                this._hpmaxs[lvlStr] += this._hpmaxs[preLvStr];
                this._visions[lvlStr] += this._visions[preLvStr];
            }
        }

        CLog.debug("LvlupConfig init success", this._confs);
        return true;
    }

    public static getById(lvlId: string): LvlupConfigData | null {
        return this._confs[lvlId];
    }

    public static getTotalExtraRateByLvl(lvl: number) {
        const lvlStr = lvl.toString();
        return this._extras[lvlStr] != undefined ? this._extras[lvlStr] : 0.0;
    }
    public static getTotalHpMaxByLvl(lvl: number) {
        const lvlStr = lvl.toString();
        return this._hpmaxs[lvlStr] != undefined ? this._hpmaxs[lvlStr] : 0;
    }
    public static getTotalVisionByLvl(lvl: number) {
        const lvlStr = lvl.toString();
        return this._visions[lvlStr] != undefined ? this._visions[lvlStr] : 0;
    }
    public static getMaxLevel() {
        return Object.keys(this._confs).length;
    }
    public static getNFTLevelUpCost(fromLevel: number, toLevel: number) {
        if (fromLevel >= toLevel) {
            return 0;
        }
        let cost: number = 0;
        for (let i = fromLevel + 1; i <= toLevel; i++) {
            const lvlStr: string = i.toString();
            if (this._confs[lvlStr] != null) {
                cost += this._confs[lvlStr].p_exp;
            }
        }
        return cost;
    }
    public static getMaxNFTLevelUpNum(fromLevel: number, ownExp: number): number {
        let maxNum: number = 0;
        let cost: number = 0;
        for (let i = fromLevel + 1; i <= Object.keys(this._confs).length; i++) {
            const lvlStr = i.toString();
            if (this._confs[lvlStr] != null) {
                cost += this._confs[lvlStr].p_exp;
            }
            if (cost <= ownExp) {
                maxNum += 1;
            } else {
                break;
            }
        }
        return maxNum;
    }

    public static getNFTRankUpCost(NFTRarity: number, fromLevel: number, toLevel: number): ItemData[] {
        if (fromLevel >= toLevel) {
            return [];
        }
        let costMap: Map<string, ItemData> = new Map();
        const valueKey: string = "p_rank_" + NFTRarity;
        for (let i = fromLevel + 1; i <= toLevel; i++) {
            const lvlStr: string = i.toString();
            if (this._confs[lvlStr] != null && this._confs[lvlStr][valueKey] != null) {
                const rankNeedItems = this._confs[lvlStr][valueKey];
                for (const tempItem of rankNeedItems) {
                    if (costMap.has(tempItem[0])) {
                        costMap.get(tempItem[0]).count += tempItem[1];
                    } else {
                        costMap.set(tempItem[0], new ItemData(tempItem[0], tempItem[1]));
                    }
                }
            }
        }
        const cost: ItemData[] = [];
        costMap.forEach((value: ItemData, key: string) => {
            cost.push(value);
        });
        return cost;
    }
    public static getMaxNFTRankUpNum(NFTRarity: number, fromLevel: number, allItems: ItemData[]) {
        let maxNum: number = 0;
        const valueKey: string = "p_rank_" + NFTRarity;
        for (let i = fromLevel + 1; i <= Object.keys(this._confs).length; i++) {
            const lvlStr = i.toString();
            if (this._confs[lvlStr] != null && this._confs[lvlStr][valueKey] != null) {
                const rankNeedItems = this._confs[lvlStr][valueKey];
                let canUp: boolean = true;
                for (const tempItem of rankNeedItems) {
                    let ownNum: number = 0;
                    for (const ownItem of allItems) {
                        if (ownItem.itemConfigId == tempItem[0]) {
                            ownNum += ownItem.count;
                        }
                    }
                    if (ownNum < tempItem[1]) {
                        canUp = false;
                        break;
                    }
                }
                if (canUp) {
                    maxNum += 1;
                } else {
                    break;
                }
            }
        }
        return maxNum;
    }
    public static getEnergyLimitTimes(lvl: number) {
        const lvlStr = lvl.toString();
        return this._confs[lvlStr] != undefined ? this._confs[lvlStr].psyc_limit : 0;
    }
}
