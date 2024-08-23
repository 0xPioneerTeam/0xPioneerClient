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
    private _data: ArtifactData[];
    private _redPointKey: string = "__artifactDataMgrRedPoint_";

    public constructor() {}

    public async loadObj(walletAddr: string) {
        this._redPointKey += walletAddr;
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
        return level * coefficient + 2;
    }
    public getObj_artifact_equiped() {
        return this._data.filter((artifact) => artifact.effectIndex >= 0);
    }
    public getObj_by_id(id: string): ArtifactData | undefined {
        return this._data.find((artifact) => artifact.artifactConfigId == id);
    }
    public getObj_by_effectIndex(effectIndex: number) {
        return this._data.find((artifact) => artifact.effectIndex == effectIndex);
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
            for (const temple of artifact.effect) {
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
        for (const temple of artifact.effect) {
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

    public getAllNewArtifactCount(): number {
        let count: number = 0;
        const localData = this._getLocalNewArtifactData();
        for (const key in localData) {
            count += localData[key].count;
        }
        return count;
    }
    public getNewArtifactCountById(uniqueId: string): number {
        const localData = this._getLocalNewArtifactData();
        if (localData[uniqueId] == null) {
            return 0;
        }
        return localData[uniqueId].count;
    }
    //-------------------------------------------------------
    public countChanged(change: ArtifactData, isCombine: boolean = false): void {
        if (change.count == 0) {
            return;
        }
    
        if (change.count > 0 && !isCombine) {
            let getNewArtifact = false;
            const exsitArtifact = this.getObj_by_id(change.uniqueId);
            if (exsitArtifact == undefined || exsitArtifact.count <= 0) {
                getNewArtifact = true;
            }
            if (getNewArtifact) {
                const localData = this._getLocalNewArtifactData();
                if (localData[change.uniqueId] != null) {
                    localData[change.uniqueId].count += change.count;
                } else {
                    localData[change.uniqueId] = change;
                }
                localStorage.setItem(this._redPointKey, JSON.stringify(localData));
                NotificationMgr.triggerEvent(NotificationName.ARTIFACTPACK_GET_NEW_ARTIFACT);
            }
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

    public readAllNewArtifact() {
        localStorage.setItem(this._redPointKey, JSON.stringify({}));
        NotificationMgr.triggerEvent(NotificationName.ARTIFACTPACK_READ_NEW_ARTIFACT);
    }
    public readNewArtifactById(uniqueId: string) {
        const localData = this._getLocalNewArtifactData();
        if (localData[uniqueId] != null) {
            delete localData[uniqueId];
            localStorage.setItem(this._redPointKey, JSON.stringify(localData));
            NotificationMgr.triggerEvent(NotificationName.ARTIFACTPACK_READ_NEW_ARTIFACT);
        }
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
    }
    private _getLocalNewArtifactData(): { [key: string]: ArtifactData } {
        return localStorage.getItem(this._redPointKey) == null ? {} : JSON.parse(localStorage.getItem(this._redPointKey));
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
}
