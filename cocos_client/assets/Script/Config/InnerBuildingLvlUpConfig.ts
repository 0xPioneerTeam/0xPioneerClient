import { resources } from "cc";
import CLog from "../Utils/CLog";
import { ConfigInnerBuildingLevelUpData, InnerBuildingPsycData, InnerBuildingType } from "../Const/BuildingDefine";
import { ResourceCorrespondingItem, ResourceData } from "../Const/ConstDefine";

export default class InnerBuildingLvlUpConfig {
    private static _confs: { [index: string]: ConfigInnerBuildingLevelUpData } = {};

    public static async init(): Promise<boolean> {
        // read config
        const obj = await new Promise((resolve) => {
            resources.load("data_local/inner_lvlup", (err: Error, data: any) => {
                if (err) {
                    resolve(null);
                    return;
                }
                resolve(data.json);
            });
        });

        if (!obj) {
            CLog.error("InnerBuildingLvlUpConfig init error");
            return false;
        }

        // format config
        let jsonObj = obj as object;

        for (var id in jsonObj) {
            let jd = jsonObj[id];
            let d: any = {};
            for (var key in jd) {
                d[key] = jd[key];
            }
            if (d.prefab_energy == null) {
                d.prefab_energy = "";
            }
            this._confs[id] = d as ConfigInnerBuildingLevelUpData;
        }
        CLog.debug("InnerBuildingLvlUpConfig init success", this._confs);
        return true;
    }

    public static getBuildingLevelData(level: number, key: string): any {
        if (level.toString() in this._confs) {
            const temple = this._confs[level.toString()];
            if (key in temple) {
                return temple[key];
            } else {
                return null;
            }
        } else {
            return null;
        }
    }
    public static getEnergyLevelData(level: number): InnerBuildingPsycData {
        if (level.toString() in this._confs) {
            const temple = this._confs[level.toString()];
            const convertCostResources: ResourceData[] = [];
            for (const resource of temple.psyc_convert) {
                if (resource.length != 2) {
                    continue;
                }
                convertCostResources.push({
                    type: resource[0].toString() as ResourceCorrespondingItem,
                    num: resource[1]
                });
            }
            return {
                output: temple.psyc_output,
                storage: temple.psyc_storage,
                convert: convertCostResources,
            }
        } else {
            return null;
        }
    }
    public static getUnlockTroops(level: number): string[] {
        const unlockTroops = [];
        for (let i = 1; i <= level; i++) {
            if (i.toString() in this._confs) {
                const temple = this._confs[i.toString()];
                if (temple.troops == null || temple.troops.length == 0) {
                    continue;
                }
                unlockTroops.push(temple.troops);
            }
        }
        return unlockTroops;
    }
    public static getTroopLockLevel(troopId: string): number {
        for (const key in this._confs) {
            const temple = this._confs[key];
            if (temple.troops == null || temple.troops.length == 0) {
                continue;
            }
            if (temple.troops == troopId) {
                return parseInt(key);
            }
        }
        return -1;
    }
}
