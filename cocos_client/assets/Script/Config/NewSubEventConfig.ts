import { resources } from "cc";
import { NewSubEventConfigData } from "../Const/NewEventDefine";
import CLog from "../Utils/CLog";

export default class NewSubEventConfig {
    private static _confs: NewSubEventConfigData[] = [];

    public static async init(): Promise<boolean> {
        const obj: any = await new Promise((resolve) => {
            resources.load("data_local/event_sub", (err: Error, data: any) => {
                if (err) {
                    resolve(null);
                    return;
                }
                resolve(data.json);
            });
        });
       
        this._confs = obj;
        CLog.debug("newsub init success", this._confs);
        return true;
    }

    public static getById(id: string): NewSubEventConfigData | undefined {
        return this._confs.find((item)=> {
            return item.id === id;
        });
    }
}
