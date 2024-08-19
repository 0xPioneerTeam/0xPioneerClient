import { resources } from "cc";
import { TroopsConfigData } from "../Const/TroopsDefine";

export default class TroopsConfig {
    private static _confs: { [index: string]: TroopsConfigData } = {};

    public static async init(): Promise<boolean> {
        const obj: any = await new Promise((resolve) => {
            resources.load("data_local/troops", (err: Error, data: any) => {
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

    public static getById(id: string): TroopsConfigData | null {
        if (id in this._confs) {
            return this._confs[id];
        }
        return null;
    }
    public static getAll(): { [index: string]: TroopsConfigData } {
        return this._confs;
    }
}