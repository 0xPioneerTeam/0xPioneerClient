import { resources } from "cc";
import { NewEventConfigData } from "../Const/NewEventDefine";
import CLog from "../Utils/CLog";

export default class NewEventConfig {
    private static _confs: NewEventConfigData[] = [];

    public static async init(): Promise<boolean> {
        const obj: any = await new Promise((resolve) => {
            resources.load("data_local/event_random", (err: Error, data: any) => {
                if (err) {
                    resolve(null);
                    return;
                }
                resolve(data.json);
            });
        });
       
        this._confs = obj;
        CLog.debug("newEvent init success", this._confs);
        return true;
    }

    public static getById(id: string): NewEventConfigData | undefined {
        return this._confs.find((item)=> {
            return item.id === id;
        });
    }
}
