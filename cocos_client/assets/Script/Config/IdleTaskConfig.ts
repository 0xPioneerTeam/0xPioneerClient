import { resources } from "cc";
import { ItemConfigData } from "../Const/Item";
import CLog from "../Utils/CLog";
import { IdleTaskConfigData } from "../Const/IdleTaskDefine";

export default class IdleTaskConfig {
    private static _confs: { [key: string]: IdleTaskConfigData } = {};

    public static async init(): Promise<boolean> {
        const obj: any = await new Promise((resolve) => {
            resources.load("data_local/idle_task", (err: Error, data: any) => {
                if (err) {
                    resolve(null);
                    return;
                }
                resolve(data.json);
            });
        });

        if (!obj) {
            CLog.error("idle task init error");
            return false;
        }

        this._confs = obj;
        CLog.debug("idle task init success", this._confs);
        return true;
    }

    public static getById(taskId: string): IdleTaskConfigData | null {
        if (taskId in this._confs) {
            return this._confs[taskId];
        }
        CLog.error(`idle task getById error, config[${taskId}] not exist`);
        return null;
    }
}
