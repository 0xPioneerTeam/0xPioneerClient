import ItemConfig from "../../Config/ItemConfig";
import ItemData, { ItemType } from "../../Const/Item";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import NetGlobalData from "./Data/NetGlobalData";
import { ResourceCorrespondingItem } from "../../Const/ConstDefine";

export class ItemDataMgr {
    private _data: ItemData[] = [];
    private _redPointKey: string = "__itemDataMgrRedPoint_";

    public loadObj(walletAddr: string) {
        this._redPointKey += walletAddr;
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

    public getAllNewItemCount(): number {
        let count: number = 0;
        const localData = this._getLocalNewItemData();
        for (const key in localData) {
            count += localData[key].count;
        }
        return count;
    }
    public getNewItemCountById(itemId: string): number {
        const localData = this._getLocalNewItemData();
        if (localData[itemId] != null) {
            return localData[itemId].count;
        }
        return 0;
    }

    //--------------------------------------------------
    public countChanged(change: ItemData): void {
        if (change.count == 0) {
            return;
        }
        const config = ItemConfig.getById(change.itemConfigId);
        if (config == null) {
            return;
        }

        // before data changed, check new item
        if (change.count > 0) {
            let isBackpackShow: boolean = true;
            if (config.itemType == ItemType.Resource) {
                if (config.configId != ResourceCorrespondingItem.NFTExp && config.configId != ResourceCorrespondingItem.NFTRankExp && config.configId != ResourceCorrespondingItem.Honor) {
                    isBackpackShow = false;
                }
            }
            let getNewItem: boolean = false;
            if (isBackpackShow && this.getObj_item_count(config.configId) <= 0) {
                getNewItem = true;
            }
            if (getNewItem) {
                const localData = this._getLocalNewItemData();
                if (localData[config.configId] != null) {
                    localData[config.configId].count += change.count;
                } else {
                    localData[config.configId] = change;
                }
                localStorage.setItem(this._redPointKey, JSON.stringify(localData));
                NotificationMgr.triggerEvent(NotificationName.BACKPACK_GET_NEW_ITEM);
            }
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
    public readAllNewItem() {
        localStorage.setItem(this._redPointKey, JSON.stringify({}));
        NotificationMgr.triggerEvent(NotificationName.BACKPACK_READ_NEW_ITEM);
    }
    public readNewItemById(itemId: string) {
        const localData = this._getLocalNewItemData();
        if (localData[itemId] != null) {
            delete localData[itemId];
            localStorage.setItem(this._redPointKey, JSON.stringify(localData));
            NotificationMgr.triggerEvent(NotificationName.BACKPACK_READ_NEW_ITEM);
        }
    }

    //--------------------------------------------------
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
    private _getLocalNewItemData(): { [key: string]: ItemData } {
        return localStorage.getItem(this._redPointKey) == null ? {} : JSON.parse(localStorage.getItem(this._redPointKey));
    }
}
