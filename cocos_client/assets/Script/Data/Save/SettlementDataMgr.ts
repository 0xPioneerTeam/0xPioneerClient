import { SettlementModel } from "../../Const/SettlementDefine";
import { share } from "../../Net/msg/WebsocketMsg";

export class SettlementDataMgr {
    private _data: SettlementModel[];

    public refreshData(netData: { [key: string]: share.Isettlement_data }) {
        this._data = [];
        for (const key in netData) {
            const element = netData[key];
            this._data.push(this._convertNetDataToObject(element));
        }
    }
    public getObj(beginLevel: number, endLevel: number) {
        const newSettlement: SettlementModel = {
            level: -1,
            newPioneerIds: [],
            killEnemies: 0,
            gainResources: 0,
            consumeResources: 0,
            gainTroops: 0,
            consumeTroops: 0,
            gainEnergy: 0,
            consumeEnergy: 0,
            exploredEvents: 0,
        };
        for (const temple of this._data) {
            if (temple.level >= beginLevel && temple.level <= endLevel) {
                newSettlement.newPioneerIds = newSettlement.newPioneerIds.concat(temple.newPioneerIds);
                newSettlement.killEnemies += temple.killEnemies;
                newSettlement.gainResources += temple.gainResources;
                newSettlement.consumeResources += temple.consumeResources;
                newSettlement.gainTroops += temple.gainTroops;
                newSettlement.consumeTroops += temple.consumeTroops;
                newSettlement.gainEnergy += temple.gainEnergy;
                newSettlement.consumeEnergy += temple.consumeEnergy;
                newSettlement.exploredEvents += temple.exploredEvents;
            }
        }
        return newSettlement;
    }

    private _convertNetDataToObject(netData: share.Isettlement_data) {
        const settlement: SettlementModel = {
            level: netData.level,
            newPioneerIds: netData.newPioneerIds,
            killEnemies: netData.killEnemies,
            gainResources: netData.gainResources,
            consumeResources: netData.consumeResources,
            gainTroops: netData.gainTroops,
            consumeTroops: netData.consumeTroops,
            gainEnergy: netData.gainEnergy,
            consumeEnergy: netData.consumeEnergy,
            exploredEvents: netData.exploredEvents,
        };
        return settlement;
    }
}
