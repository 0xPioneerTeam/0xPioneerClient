import { resources } from "cc";
import CLog from "../Utils/CLog";
import { MissionConfigData, TaskConfigData } from "../Const/TaskDefine";

export default class MissionConfig {
    private static _confs: { [index: string]: MissionConfigData } = {};

    public static async init(): Promise<boolean> {
        const obj: any = await new Promise((resolve) => {
            resources.load("data_local/mission", (err: Error, data: any) => {
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
        CLog.debug("missionConfig init success", this._confs);
        return true;
    }

    public static getAll(): { [index: string]: MissionConfigData } {
        return this._confs;
    }
    public static getById(taskId: string): MissionConfigData | null {
        if (taskId in this._confs) {
            return this._confs[taskId];
        }
        return null;
    }
}
