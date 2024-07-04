import ItemConfig from "../../Config/ItemConfig";
import ItemData, { ItemType } from "../../Const/Item";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import NetGlobalData from "./Data/NetGlobalData";

export class ItemDataMgr {
    private _data: ItemData[] = [];

    public loadObj() {
        this._initData();
    }

    public getObj() {
        return this._data;
    }

    public getObj_item_count(itemConfigId: string): number {
        let count: number = 0;
        for (const item of this._data) {
            if (item.itemConfigId == itemConfigId) {
                count += item.count;
            }
        }
        return count;
    }

    public getObj_item_skillbook(): ItemData[] {
        return this._data.filter((item) => {
            const config = ItemConfig.getById(item.itemConfigId);
            if (config == null) {
                return false;
            }
            return config.itemType == ItemType.SkillBook;
        });
    }

    public getObj_item_backpack(): ItemData[] {
        return this._data.filter((item) => {
            const config = ItemConfig.getById(item.itemConfigId);
            if (config == null) {
                return false;
            }
            return config.itemType != ItemType.Resource;
        });
    }
    public countChanged(change: ItemData): void {
        if (change.count == 0) {
            return;
        }
        const config = ItemConfig.getById(change.itemConfigId);
        if (config == null) {
            return;
        }
        let exsitIndex: number = -1;
        for (let i = 0; i < this._data.length; i++) {
            if (this._data[i].itemConfigId == change.itemConfigId) {
                exsitIndex = i;
                break;
            }
        }
        if (exsitIndex >= 0) {
            this._data[exsitIndex].count += change.count;
            if (change.count < 0 && this._data[exsitIndex].count <= 0) {
                this._data.splice(exsitIndex, 1);
            }
        } else {
            if (change.count > 0) {
                this._data.push(change);
            }
        }
        if (change.count > 0) {
            if (config.itemType == ItemType.Resource) {
                NotificationMgr.triggerEvent(NotificationName.RESOURCE_GETTED, { item: change });
            }
        } else if (change.count < 0) {
            if (config.itemType == ItemType.Resource) {
                NotificationMgr.triggerEvent(NotificationName.RESOURCE_CONSUMED, { item: change });
            }
        }
        NotificationMgr.triggerEvent(NotificationName.ITEM_CHANGE);
    }
    private _initData() {
        this._data = [];

        if (NetGlobalData.storehouse == null) {
            return;
        }
        const netItems = NetGlobalData.storehouse.items;
        for (const key in netItems) {
            const item = new ItemData(netItems[key].itemConfigId, netItems[key].count);
            item.addTimeStamp = netItems[key].addTimeStamp;
            this._data.push(item);
        }
    }
}
