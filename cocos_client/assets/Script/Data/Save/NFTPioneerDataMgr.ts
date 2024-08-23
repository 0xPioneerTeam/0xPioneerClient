import NotificationMgr from "../../Basic/NotificationMgr";
import ConfigConfig from "../../Config/ConfigConfig";
import NFTPioneerConfig from "../../Config/NFTPioneerConfig";
import NFTPioneerNameConfig from "../../Config/NFTPioneerNameConfig";
import NFTSkillConfig from "../../Config/NFTSkillConfig";
import NFTSkillEffectConfig from "../../Config/NFTSkillEffectConfig";
import PioneerLvlupConfig from "../../Config/PioneerLvlupConfig";
import { InnerBuildingType } from "../../Const/BuildingDefine";
import { ConfigType, NFTLevelInitLimitNumParam, NFTLevelLimitPerRankAddNumParam, NFTRankLimitNumParam, NFTRaritySkillInitNumParam } from "../../Const/Config";
import { BackpackArrangeType, GameExtraEffectType } from "../../Const/ConstDefine";
import { NFTPioneerConfigData, NFTPioneerObject, NFTPioneerSkil } from "../../Const/NFTPioneerDefine";
import { NotificationName } from "../../Const/Notification";
import { share } from "../../Net/msg/WebsocketMsg";
import CommonTools from "../../Tool/CommonTools";
import NetGlobalData from "./Data/NetGlobalData";

export default class NFTPioneerDataMgr {
    private _data: NFTPioneerObject[] = [];
    public constructor() {}
    //--------------------------------
    public loadObj() {
        this._initData();
    }
    //--------------------------------
    public getAll(): NFTPioneerObject[] {
        return this._data;
    }
    public getNFTById(NFTId: string): NFTPioneerObject | undefined {
        return this._data.find((v) => v.uniqueId == NFTId);
    }
    public getNFTByWorkingBuildingId(buildingId: InnerBuildingType): NFTPioneerObject | undefined {
        return this._data.find((v) => v.workingBuildingId == buildingId);
    }
    public getNFTEffectById(NFTId: string, type: GameExtraEffectType): number {
        let effectNum: number = 0;
        const NFT = this.getNFTById(NFTId);
        if (NFT == undefined) {
            return effectNum;
        }
        for (const skill of NFT.skills) {
            const netData = NFTSkillConfig.getById(skill.id);
            if (netData == null) {
                continue;
            }
            for (const templeEffect of netData.effect) {
                const effectConfig = NFTSkillEffectConfig.getById(templeEffect.toString());
                if (effectConfig == null) {
                    continue;
                }
                let effectType = effectConfig.type;
                if (effectType == GameExtraEffectType.VISION_RANGE) {
                    effectType = GameExtraEffectType.PIONEER_ONLY_VISION_RANGE;
                }
                if (effectType != type) {
                    continue;
                }
                effectNum += effectConfig.para[0];
            }
        }
        return effectNum;
    }

    //-------------------------------- data action {
    public replaceData(netData: share.Infts_info_data) {
        const newObj = this._convertNetDataToObject(netData);
        let isExit: boolean = false;
        for (let i = 0; i < this._data.length; i++) {
            if (this._data[i].uniqueId == netData.uniqueId) {
                this._data[i] = newObj;
                isExit = true;
                break;
            }
        }
        if (!isExit) {
            this._data.push(newObj);
        }
        return newObj;
    }

    public NFTLevelUp(netData: share.Infts_info_data) {
        const obj = this.replaceData(netData);
        if (obj == null) {
            return;
        }
        NotificationMgr.triggerEvent(NotificationName.NFT_LEVEL_UP, { nft: obj });
    }
    public NFTRankUp(netData: share.Infts_info_data) {
        const obj = this.replaceData(netData);
        if (obj == null) {
            return;
        }
        NotificationMgr.triggerEvent(NotificationName.NFT_RANK_UP, { nft: obj });
    }

    public NFTLearnSkill(netData: share.Infts_info_data) {
        const object = this.replaceData(netData);
        if (object == undefined) {
            return;
        }
        NotificationMgr.triggerEvent(NotificationName.NFT_LEARN_SKILL);
    }
    public NFTForgetSkill(netData: share.Infts_info_data) {
        const object = this.replaceData(netData);
        if (object == undefined) {
            return;
        }
        NotificationMgr.triggerEvent(NotificationName.NFT_FORGET_SKILL);
    }

    public NFTChangeWork(NFTId: string, workingBuildingId: InnerBuildingType) {
        const lastBuildingBindObject = this.getNFTByWorkingBuildingId(workingBuildingId);
        if (lastBuildingBindObject != undefined) {
            lastBuildingBindObject.workingBuildingId = null;
        }
        const object = this.getNFTById(NFTId);
        if (object == undefined) {
            return;
        }
        object.workingBuildingId = workingBuildingId;
        NotificationMgr.triggerEvent(NotificationName.NFT_DELEGATE_BUILDING);
    }

    public NFTSort(sortType: BackpackArrangeType) {
        // sort
        if (sortType == BackpackArrangeType.Recently) {
            this._data.sort((a, b) => {
                return b.addTimeStamp - a.addTimeStamp;
            });
        } else if (sortType == BackpackArrangeType.Rarity) {
            //bigger in front
            this._data.sort((a, b) => {
                return b.rank - a.rank;
            });
        }
    }
    //--------------------------------
    private _initData() {
        this._data = [];
        if (NetGlobalData.nfts == null) {
            return;
        }
        const netNfts = NetGlobalData.nfts.nfts;
        for (const key in netNfts) {
            this._data.push(this._convertNetDataToObject(netNfts[key]));
        }
    }
    private _convertNetDataToObject(netData: share.Infts_info_data): NFTPioneerObject {
        const skills: NFTPioneerSkil[] = [];
        if (netData.skills != null) {
            for (const tempSkill of netData.skills) {
                skills.push({
                    id: tempSkill.id,
                    isOriginal: tempSkill.isOriginal,
                });
            }
        }

        return {
            uniqueId: netData.uniqueId,
            rarity: netData.rarity,
            name: netData.name,
            skin: netData.skin,

            attack: netData.attack,
            defense: netData.defense,
            hp: netData.hp,
            speed: netData.speed,
            iq: netData.iq,
            attackGrowValue: netData.attackGrowValue,
            defenseGrowValue: netData.defenseGrowValue,
            hpGrowValue: netData.hpGrowValue,
            speedGrowValue: netData.speedGrowValue,
            iqGrowValue: netData.iqGrowValue,
            level: netData.level,
            levelLimit: netData.levelLimit,
            rank: netData.rank,
            rankLimit: netData.rankLimit,
            skills: skills,
            workingBuildingId: netData.workingBuildingId as InnerBuildingType,
            addTimeStamp: netData.addTimeStamp,
        };
    }
}
