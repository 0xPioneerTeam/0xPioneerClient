import NotificationMgr from "../Basic/NotificationMgr";
import InnerBuildingConfig from "../Config/InnerBuildingConfig";
import { InnerBuildingType } from "../Const/BuildingDefine";
import { GameExtraEffectType } from "../Const/ConstDefine";
import { NotificationName } from "../Const/Notification";
import { MapPlayerPioneerObject } from "../Const/PioneerDefine";
import { DataMgr } from "../Data/DataMgr";

export default class GameMgr {
    public fakeWormholeFight(playPioneerIds: string[]): boolean {
        const enemies: {
            hpmax: number;
            hp: number;
            attack: number;
            defend: number;
        }[] = [
            {
                hpmax: 50,
                hp: 50,
                attack: 20,
                defend: 5,
            },
            {
                hpmax: 50,
                hp: 50,
                attack: 20,
                defend: 5,
            },
            {
                hpmax: 50,
                hp: 50,
                attack: 20,
                defend: 5,
            },
        ];
        let attackerHp: number = 0;
        let attackerHpmax: number = 0;
        let attackerCenterPos = null;
        const players: {
            hpmax: number;
            hp: number;
            attack: number;
            defend: number;
        }[] = [];
        for (const id of playPioneerIds) {
            const info = DataMgr.s.pioneer.getById(id);
            if (info == undefined) {
                continue;
            }
            attackerHp = info.hp;
            attackerHpmax = info.hpMax;
            attackerCenterPos = info.stayPos;
            players.push({
                hpmax: info.hpMax,
                hp: info.hp,
                attack: info.attack,
                defend: info.defend,
            });
        }
        let isWin: boolean = false;
        while (true) {
            if (players.length > 0 && enemies.length > 0) {
                const player = players[0];
                const enemy = enemies[0];
                const damage = Math.max(1, player.attack - enemy.defend);
                enemy.hp -= damage;
                if (enemy.hp <= 0) {
                    enemies.splice(0, 1);
                }
            }
            if (enemies.length > 0 && players.length > 0) {
                const enemy = enemies[0];
                const player = players[0];
                const damage = Math.max(1, enemy.attack - player.defend);
                player.hp -= damage;
                if (player.hp <= 0) {
                    players.splice(0, 1);
                }
            }
            if (enemies.length === 0 || players.length === 0) {
                break;
            }
        }
        if (enemies.length === 0) {
            isWin = true;
        } else if (players.length === 0) {
            isWin = false;
        }

        NotificationMgr.triggerEvent(NotificationName.FIGHT_FINISHED, {
            attacker: {
                name: "worm_attacker",
                avatarIcon: "icon_player_avatar", // todo
                hp: attackerHp,
                hpMax: attackerHpmax,
            },
            defender: {
                name: "fake_wormhole_enemy",
                avatarIcon: "icon_player_avatar",
                hp: 50,
                hpMax: 50,
            },
            attackerIsSelf: true,
            buildingId: null,
            position: attackerCenterPos,
            fightResult: isWin ? "win" : "lose",
            rewards: [],
        });

        return isWin;
    }
    //--------------------------- effect
    public getAfterExtraEffectPropertyByPioneer(pioneerId: string, type: GameExtraEffectType, originalValue: number): number {
        // artifact effect
        let artifactChangeRate: number = DataMgr.s.artifact.getObj_artifact_effectiveEffect(type, DataMgr.s.userInfo.artifactStoreLevel);

        // nft
        let nftChangeRate: number = 0;
        const pioneer = DataMgr.s.pioneer.getById(pioneerId) as MapPlayerPioneerObject;
        if (!!pioneer && pioneer.NFT != null) {
            nftChangeRate = DataMgr.s.nftPioneer.getNFTEffectById(pioneer.NFT.uniqueId, type);
        }

        return this._getEffectResultNum(type, originalValue, artifactChangeRate + nftChangeRate);
    }
    public getAfterExtraEffectPropertyByBuilding(buildingType: InnerBuildingType, type: GameExtraEffectType, originalValue: number): number {
        // artifact effect
        let artifactChangeRate: number = DataMgr.s.artifact.getObj_artifact_effectiveEffect(type, DataMgr.s.userInfo.artifactStoreLevel);

        let resultValue = this._getEffectResultNum(type, originalValue, artifactChangeRate);
        //nft
        if (type == GameExtraEffectType.BUILDING_LVUP_TIME) {
            const nft = DataMgr.s.nftPioneer.getNFTByWorkingBuildingId(buildingType);
            const buildingConfig = InnerBuildingConfig.getByBuildingType(buildingType);
            if (nft != undefined && buildingConfig.staff_effect != null) {
                let nftEffect = 0;
                for (const temple of buildingConfig.staff_effect) {
                    if (temple[0] == "lvlup_time" && temple[1] == DataMgr.s.userInfo.getInnerBuildingLevel(buildingType) + 1) {
                        nftEffect += temple[2][0];
                    }
                }
                resultValue = Math.floor(resultValue * (1 + nft.iq * nftEffect));
            }
        }
        resultValue = Math.max(1, resultValue);
        return resultValue;
    }

    private _getEffectResultNum(type: GameExtraEffectType, originalValue: number, effectNum: number): number {
        if (type == GameExtraEffectType.MOVE_SPEED || type == GameExtraEffectType.ENERGY_GENERATE || type == GameExtraEffectType.TREASURE_PROGRESS) {
            originalValue = Math.floor(originalValue * (1 + effectNum));
        } else if (
            type == GameExtraEffectType.BUILDING_LVUP_TIME ||
            type == GameExtraEffectType.BUILDING_LVLUP_RESOURCE ||
            type == GameExtraEffectType.GATHER_TIME ||
            type == GameExtraEffectType.TROOP_GENERATE_TIME
        ) {
            originalValue = Math.floor(originalValue * (1 - effectNum));
        } else if (
            type == GameExtraEffectType.PIONEER_ONLY_VISION_RANGE ||
            type == GameExtraEffectType.CITY_AND_PIONEER_VISION_RANGE ||
            type == GameExtraEffectType.CITY_ONLY_VISION_RANGE
        ) {
            originalValue = originalValue + effectNum;
        }
        return originalValue;
    }

    public constructor() {}
}
