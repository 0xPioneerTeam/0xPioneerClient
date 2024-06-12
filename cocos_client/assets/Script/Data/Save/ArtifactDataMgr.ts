import ArtifactData from "../../Model/ArtifactData";
import ArtifactConfig from "../../Config/ArtifactConfig";
import ArtifactEffectConfig from "../../Config/ArtifactEffectConfig";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import { BackpackArrangeType, GameExtraEffectType } from "../../Const/ConstDefine";
import CommonTools from "../../Tool/CommonTools";
import NetGlobalData from "./Data/NetGlobalData";
import ConfigConfig from "../../Config/ConfigConfig";
import { ConfigType, MapDifficultCoefficientParam } from "../../Const/Config";

export class ArtifactDataMgr {
    private _maxArtifactLength: number = 100;
    private _data: ArtifactData[];
    public constructor() {}

    public async loadObj() {
        this._initData();
    }
    //------------------------------------------------------------
    public getObj() {
        return this._data;
    }
    public getByUnqueId(uniqueId: string) {
        return this._data.find((artifact) => artifact.uniqueId == uniqueId);
    }
    public getByRank(rank: number) {
        return this._data.filter((artifact) => {
            const config = ArtifactConfig.getById(artifact.artifactConfigId);
            if (config == undefined) {
                return false;
            }
            return config.rank == rank;
        });
    }
    public getArtifactLevel() {
        let level: number = 0;
        for (const temple of this.getObj_artifact_equiped()) {
            const config = ArtifactConfig.getById(temple.artifactConfigId);
            if (config == null) {
                return;
            }
            level += config.rank;
        }
        let coefficient: number = 1;
        if (ConfigConfig.getConfig(ConfigType.MapDifficultCoefficient) != null) {
            coefficient = (ConfigConfig.getConfig(ConfigType.MapDifficultCoefficient) as MapDifficultCoefficientParam).coefficient;
        }
        return level * coefficient;
    }
    public getObj_artifact_equiped() {
        return this._data.filter((artifact) => artifact.effectIndex >= 0);
    }
    public getObj_by_id(id: string) {
        return this._data.find((artifact) => artifact.artifactConfigId == id);
    }
    public getObj_by_effectIndex(effectIndex: number) {
        return this._data.find((artifact) => artifact.effectIndex == effectIndex);
    }

    public getObj_artifact_maxLength() {
        return this._maxArtifactLength;
    }
    public getObj_artifact_count(artifactConfigId: string): number {
        let count: number = 0;
        for (const artifact of this._data) {
            if (artifact.artifactConfigId == artifactConfigId) {
                count += artifact.count;
            }
        }
        return count;
    }
    public getObj_artifact_sort(sortType: BackpackArrangeType) {
        if (sortType == BackpackArrangeType.Recently) {
            this._data.sort((a, b) => {
                return b.addTimeStamp - a.addTimeStamp;
            });
        } else if (sortType == BackpackArrangeType.Rarity) {
            //bigger in front
            this._data.sort((a, b) => {
                return ArtifactConfig.getById(b.artifactConfigId).rank - ArtifactConfig.getById(a.artifactConfigId).rank;
            });
        }
        NotificationMgr.triggerEvent(NotificationName.ARTIFACT_CHANGE);
    }
    public getObj_artifact_effectiveEffect(type: GameExtraEffectType, artifactStoreLevel: number): number {
        let effectNum: number = 0;
        for (const artifact of this._data) {
            if (artifact.effectIndex < 0) {
                continue;
            }
            const artifactConfig = ArtifactConfig.getById(artifact.artifactConfigId);
            if (artifactConfig.effect != null) {
                for (let j = 0; j < artifactConfig.effect.length; j++) {
                    const effectId = artifactConfig.effect[j];
                    const effConfig = ArtifactEffectConfig.getById(effectId);
                    let effectType = effConfig.type;
                    if (effectType == GameExtraEffectType.VISION_RANGE) {
                        if (effConfig.para[0] == 0) {
                            effectType = GameExtraEffectType.CITY_ONLY_VISION_RANGE;
                        } else if (effConfig.para[0] == 1) {
                            effectType = GameExtraEffectType.PIONEER_ONLY_VISION_RANGE;
                        } else if (effConfig.para[0] == 2) {
                            effectType = GameExtraEffectType.CITY_AND_PIONEER_VISION_RANGE;
                        }
                    }
                    if (effectType != type) {
                        continue;
                    }
                    if (effConfig.unlock && effConfig.unlock > artifactStoreLevel) {
                        continue;
                    }
                    if (
                        effectType == GameExtraEffectType.VISION_RANGE ||
                        effectType == GameExtraEffectType.PIONEER_ONLY_VISION_RANGE ||
                        effectType == GameExtraEffectType.CITY_AND_PIONEER_VISION_RANGE
                    ) {
                        effectNum += effConfig.para[1];
                    } else {
                        effectNum += effConfig.para[0];
                    }
                }
            }
        }
        return effectNum;
    }

    public getAllEffectiveEffect(clevel: number): Map<GameExtraEffectType, number> {
        const effectData: Map<GameExtraEffectType, number> = new Map();
        for (const artifact of this._data) {
            if (artifact.effectIndex < 0) {
                continue;
            }
            const config = ArtifactConfig.getById(artifact.artifactConfigId);
            if (config == null) {
                continue;
            }
            if (config.eff_sp != null && config.eff_sp.length > 0) {
                this._artifact_get_effects_data(effectData, config.eff_sp, clevel, true, this._checkIsInMainSlot(artifact.effectIndex));
            }
            for (const temple of config.effect) {
                this._artifact_get_effects_data(effectData, temple, clevel, false, false);
            }
        }
        return effectData;
    }
    public getEffectDataByUniqueId(uniqueId: string, clevel: number): Map<GameExtraEffectType, number> {
        const effectData: Map<GameExtraEffectType, number> = new Map();
        const artifact = this.getByUnqueId(uniqueId);
        if (artifact == undefined) {
            return effectData;
        }

        const config = ArtifactConfig.getById(artifact.artifactConfigId);
        if (config == null) {
            return effectData;
        }

        if (config.eff_sp != null && config.eff_sp.length > 0) {
            this._artifact_get_effects_data(effectData, config.eff_sp, clevel, true, this._checkIsInMainSlot(artifact.effectIndex));
        }
        for (const temple of config.effect) {
            this._artifact_get_effects_data(effectData, temple, clevel, false, false);
        }
        return effectData;
    }
    public getEffectValueByEffectType(type: GameExtraEffectType, clevel: number): number {
        let effectValue: number = 0;
        const effectData: Map<GameExtraEffectType, number> = this.getAllEffectiveEffect(clevel);
        if (effectData.has(type)) {
            effectValue = effectData.get(type);
        }
        return effectValue;
    }

    //-------------------------------------------------------
    public countChanged(change: ArtifactData): void {
        if (change.count == 0) {
            return;
        }
        let exsitIndex: number = -1;
        for (let i = 0; i < this._data.length; i++) {
            if (this._data[i].uniqueId == change.uniqueId) {
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
        this.getObj_artifact_sort(BackpackArrangeType.Recently);
        NotificationMgr.triggerEvent(NotificationName.ARTIFACT_CHANGE);
    }
    public changeObj_artifact_effectIndex(uniqueId: string, effectIndex: number) {
        const artifact = this.getByUnqueId(uniqueId);
        if (artifact == undefined) {
            return;
        }
        artifact.effectIndex = effectIndex;
        NotificationMgr.triggerEvent(NotificationName.ARTIFACT_EQUIP_DID_CHANGE);
    }

    private _initData() {
        this._data = [];
        if (NetGlobalData.artifacts == null) {
            return;
        }
        const netItems = NetGlobalData.artifacts.items;
        for (const key in netItems) {
            const item = new ArtifactData(netItems[key].artifactConfigId, netItems[key].count);
            item.addTimeStamp = netItems[key].addTimeStamp;
            item.effectIndex = netItems[key].effectIndex;
            item.effect = netItems[key].effect;
            item.uniqueId = netItems[key].uniqueId;
            this._data.push(item);
        }
        this.getObj_artifact_sort(BackpackArrangeType.Recently);
    }

    private _checkIsInMainSlot(effecIndex: number) {
        const mainIndex: number[] = [0, 5, 9];
        if (mainIndex.indexOf(effecIndex) >= 0) {
            return true;
        }
        return false;
    }
    private _artifact_get_effects_data(
        effectData: Map<GameExtraEffectType, number>,
        effectId: string,
        clevel: number,
        isMainEffect: boolean,
        isInMainSlot: boolean
    ) {
        const effect_conf = ArtifactEffectConfig.getById(effectId);
        if (effect_conf == null) {
            return effectData;
        }

        if (isMainEffect) {
            if (!isInMainSlot) {
                return;
            }
        } else {
            if (effect_conf.unlock > clevel) {
                return effectData;
            }
        }

        switch (effect_conf.type) {
            case GameExtraEffectType.BUILDING_LVUP_TIME:
            case GameExtraEffectType.BUILDING_LVLUP_RESOURCE:
            case GameExtraEffectType.MOVE_SPEED:
            case GameExtraEffectType.GATHER_TIME:
            case GameExtraEffectType.ENERGY_GENERATE:
            case GameExtraEffectType.TROOP_GENERATE_TIME:
            case GameExtraEffectType.CITY_RADIAL_RANGE:
            case GameExtraEffectType.TREASURE_PROGRESS:
                {
                    if (!effectData.has(effect_conf.type)) {
                        effectData.set(effect_conf.type, 0);
                    }
                    effectData.set(effect_conf.type, effectData.get(effect_conf.type) + effect_conf.para[0]);
                }
                break;
            case GameExtraEffectType.VISION_RANGE:
                {
                    let currentType: GameExtraEffectType = null;
                    switch (effect_conf.para[0]) {
                        case 0:
                            currentType = GameExtraEffectType.CITY_ONLY_VISION_RANGE;
                            break;
                        case 1:
                            currentType = GameExtraEffectType.PIONEER_ONLY_VISION_RANGE;
                            break;
                        case 2:
                            currentType = GameExtraEffectType.CITY_AND_PIONEER_VISION_RANGE;
                            break;
                    }
                    if (currentType != null) {
                        if (!effectData.has(currentType)) {
                            effectData.set(currentType, 0);
                        }
                        effectData.set(currentType, effectData.get(currentType) + effect_conf.para[1]);
                    }
                }
                break;
        }
        return effectData;
    }
    // public getPropEffValue(buildingLv: number) {
    //     const r = {
    //         prop: {}, // propType => { add: 0, mul: 0}
    //         eff: {}, // effectType => 0
    //     };
    //     for (let i = 0; i < this._localArtifactDatas.length; i++) {
    //         const artifact = this._localArtifactDatas[i];
    //         if (artifact.effectIndex < 0) {
    //             continue;
    //         }
    //         const artifactConfig = ArtifactConfig.getById(artifact.artifactConfigId);
    //         // prop
    //         if (artifactConfig.prop.length > 0) {
    //             for (let j = 0; j < artifactConfig.prop.length; j++) {
    //                 const propType = artifactConfig.prop[j];
    //                 const propValue = artifactConfig.prop_value[j];

    //                 if (!r.prop[propType]) r.prop[propType] = { add: 0, mul: 0 };

    //                 if (propValue[0] == AttrChangeType.ADD) {
    //                     r.prop[propType].add += propValue[0] * artifact.count;
    //                 } else if (propValue[0] == AttrChangeType.MUL) {
    //                     r.prop[propType].mul += propValue[0] * artifact.count;
    //                 }
    //             }
    //         }

    //         // effect
    //         if (artifactConfig.effect.length > 0) {
    //             for (let j = 0; j < artifactConfig.effect.length; j++) {
    //                 const effectId = artifactConfig.effect[j];
    //                 const effConfig = ArtifactEffectConfig.getById(effectId);
    //                 const effectType = effConfig.type;

    //                 if (effConfig.unlock && effConfig.unlock > cLv) {
    //                     continue;
    //                 }

    //                 if (!r.eff[effectType]) r.eff[effectType] = 0;
    //                 r.eff[effectType] += effConfig.para[0] * artifact.count;
    //             }
    //         }
    //     }

    //     return r;
    // }
}
