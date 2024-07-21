import { resources } from "cc";
import CLog from "../Utils/CLog";
import { MapDecorateData } from "../Const/MapDecorate";
import { JsonAsset } from "cc";

export default class MapDecorateConfig {
    private static _confMap: Map<string, MapDecorateData> = new Map;

    public static async getByKey(urlKey: string): Promise<MapDecorateData> {
        if (this._confMap.has(urlKey)) {
            return this._confMap.get(urlKey);
        }
        const obj: JsonAsset = await new Promise((resolve) => {
            resources.load("data_map/" + urlKey, (err: Error, data: any) => {
                if (err) {
                    resolve(null);
                    return;
                }
                resolve(data);
            });
        });

        if (!obj) {
            CLog.error("MapDecorateConfig load error");
            return null;
        }
        this._confMap.set(obj.name, obj.json as MapDecorateData);
        return this._confMap.get(urlKey);
    }
}