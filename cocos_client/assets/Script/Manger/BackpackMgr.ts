import ArtifactConfig from "../Config/ArtifactConfig";
import ItemConfig from "../Config/ItemConfig";
import { BackpackArrangeType, BackpackCategoryType } from "../Const/ConstDefine";
import ItemData, { ItemType } from "../Const/Item";
import { DataMgr } from "../Data/DataMgr";
import ArtifactData from "../Model/ArtifactData";

export default class BackpackMgr {
    public getBackpack(categoryType: BackpackCategoryType, arrangeType: BackpackArrangeType): (ItemData | ArtifactData)[] {
        const result: (ItemData | ArtifactData)[] = [];
        const items = DataMgr.s.item.getObj().filter((item) => {
            const config = ItemConfig.getById(item.itemConfigId);
            if (config == null) {
                return false;
            }
            return config.itemType != ItemType.Resource;
        });

        const artifact = DataMgr.s.artifact.getObj();
        if (categoryType == BackpackCategoryType.All) {
            result.push(...items, ...artifact);
        } else if (categoryType == BackpackCategoryType.Rellc) {
            result.push(...artifact);
        } else if (categoryType == BackpackCategoryType.Consumable) {
            result.push(
                ...items.filter((item) => {
                    const config = ItemConfig.getById(item.itemConfigId);
                    if (config == null) {
                        return false;
                    }
                    return config.itemType == ItemType.AddProp;
                })
            );
        } else if (categoryType == BackpackCategoryType.Special) {
            result.push(
                ...items.filter((item) => {
                    const config = ItemConfig.getById(item.itemConfigId);
                    if (config == null) {
                        return false;
                    }
                    return config.itemType == ItemType.TaskItem || config.itemType == ItemType.SkillBook;
                })
            );
        } else if (categoryType == BackpackCategoryType.Other) {
        }

        if (result.length <= 0) {
            return result;
        }
        result.sort((a: ItemData | ArtifactData, b: ItemData | ArtifactData) => {
            let bValue: number = 0;
            let aValue: number = 0;
            if (arrangeType == BackpackArrangeType.Recently) {
                bValue = b.addTimeStamp
                aValue = a.addTimeStamp;
            } else if (arrangeType == BackpackArrangeType.Rarity) {
                bValue = this._getRarity(b);
                aValue = this._getRarity(a);
            }
            return bValue - aValue;
        });
        return result;
    }

    private _getRarity(obj: ItemData | ArtifactData) {
        let rarity: number = 0;
        if (obj instanceof ItemData) {
            const config = ItemConfig.getById(obj.itemConfigId);
            rarity = config != null ? config.grade : 0;
        } else if (obj instanceof ArtifactData) {
            const config = ArtifactConfig.getById(obj.artifactConfigId);
            rarity = config != null ? config.rank : 0;
        }
        return rarity;
    }
}
