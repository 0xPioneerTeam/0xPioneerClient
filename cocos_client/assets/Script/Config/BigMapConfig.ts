import { ForwardFlow, resources } from "cc";
import { MapTemplateConfigs } from "../Const/MapDefine";
import { MapBuildingConfigData } from "../Const/MapBuilding";
import { PioneerConfigData } from "../Const/PioneerDefine";

export default class BigMapConfig {
    private static _buildingConfigs: Map<string, MapBuildingConfigData[]> = new Map();
    private static _pioneerConfigs: Map<string, PioneerConfigData[]> = new Map();

    public static async init(): Promise<boolean> {
        const template_configs: MapTemplateConfigs = await new Promise((resolve) => {
            resources.load("data_map/map_template", (err: Error, data: any) => {
                if (err) {
                    resolve(null);
                    return;
                }
                resolve(data.json);
            });
        });
        if (!template_configs) {
            return false;
        }
        const idSet = new Set<string>();
        for (let i = 0; i < template_configs.player.length; i++) {
            idSet.add(template_configs.player[i]);
        }
        for (let i = 0; i < template_configs.normal.length; i++) {
            idSet.add(template_configs.normal[i]);
        }
        for (let i = 0; i < template_configs.medium.length; i++) {
            idSet.add(template_configs.medium[i]);
        }
        for (let i = 0; i < template_configs.high.length; i++) {
            idSet.add(template_configs.high[i]);
        }
        for (const id of idSet) {
            const buildingDatas: MapBuildingConfigData[] = await new Promise((resolve) => {
                resources.load("data_map/" + id, (err: Error, data: any) => {
                    if (err) {
                        resolve(null);
                        return;
                    }
                    resolve(data.json);
                });
            });
            if (!buildingDatas) {
                return false;
            }
            this._buildingConfigs.set(id, buildingDatas);

            const pioneerConfigObj: any = await new Promise((resolve) => {
                resources.load("data_map/" + id + "_pioneer", (err: Error, data: any) => {
                    if (err) {
                        resolve(null);
                        return;
                    }
                    resolve(data.json);
                });
            });
            if (!pioneerConfigObj) {
                return false;
            }
            const templePioneers = [];
            for (const key in pioneerConfigObj) {
                templePioneers.push(pioneerConfigObj[key]);
            }
            this._pioneerConfigs.set(id, templePioneers);
        }
        return true;
    }

    public static getBuildingConfigMap() {
        return this._buildingConfigs;
    }

    public static getPioneerConfigMap() {
        return this._pioneerConfigs;
    }

    public static getBuildingByMapId(mapId: string, buildingId: string) {
        if (!this._buildingConfigs.has(mapId)) {
            return;
        }
        return this._buildingConfigs.get(mapId).find((item) => item.id === buildingId);
    }
    public static getPioneerByMapId(mapId: string, pioneerId: string) {
        if (!this._pioneerConfigs.has(mapId)) {
            return;
        }
        return this._pioneerConfigs.get(mapId).find((item) => item.id === pioneerId);
    }
}
