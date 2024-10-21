import { _decorator, Component, Label, Node, tween, v3 } from "cc";
import ViewController from "../../BasicView/ViewController";
import UIPanelManger, { UIPanelLayerType } from "../../Basic/UIPanelMgr";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import { DataMgr } from "../../Data/DataMgr";
import { NetworkMgr } from "../../Net/NetworkMgr";
import CLog from "../../Utils/CLog";
import { LanMgr } from "../../Utils/Global";
import { UIName } from "../../Const/ConstUIDefine";
import { MapPioneerActionType, MapPioneerObject, MapPioneerType, MapPlayerPioneerObject } from "../../Const/PioneerDefine";
import { PlayerDispatchDetailUI } from "../Dispatch/PlayerDispatchDetailUI";
import { GAME_ENV_IS_DEBUG, ResourceCorrespondingItem } from "../../Const/ConstDefine";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import TroopsConfig from "../../Config/TroopsConfig";
import { InnerBuildingType } from "../../Const/BuildingDefine";
import InnerBuildingLvlUpConfig from "../../Config/InnerBuildingLvlUpConfig";
import ConfigConfig from "../../Config/ConfigConfig";
import {
    ConfigType,
    BuyEnergyCoefficientParam,
    BuyEnergyLimitParam,
    BuyEnergyThresParam,
    BuyEnergyPricePiotParam,
    BuyEnergyPricePsycParam,
} from "../../Const/Config";
import ItemConfig from "../../Config/ItemConfig";

const { ccclass, property } = _decorator;

@ccclass("ReplenishEnergyView")
export class ReplenishEnergyView extends ViewController {
    private _pioneer: MapPlayerPioneerObject = null;
    public configuration(uniqueId: string) {
        const pioneer = DataMgr.s.pioneer.getById(uniqueId);
        if (pioneer == undefined || pioneer.type != MapPioneerType.player) {
            UIPanelManger.inst.popPanel(this.node, UIPanelLayerType.HUD);
            return;
        }
        this._pioneer = pioneer as MapPlayerPioneerObject;
    }

    protected viewDidLoad(): void {
        super.viewDidLoad();

        const buyLimit = (ConfigConfig.getConfig(ConfigType.BuyEnergyLimit) as BuyEnergyLimitParam).limit;
        const buyPricePsyc = (ConfigConfig.getConfig(ConfigType.BuyEnergyPricePsyc) as BuyEnergyPricePsycParam).prices;
        const buyPricePiot = (ConfigConfig.getConfig(ConfigType.BuyEnergyPricePiot) as BuyEnergyPricePiotParam).prices;
        const buyThres = (ConfigConfig.getConfig(ConfigType.BuyEnergyThres) as BuyEnergyThresParam).thresholds;
        const buyCoefficient = (ConfigConfig.getConfig(ConfigType.BuyEnergyCoefficient) as BuyEnergyCoefficientParam).coefficient;

        const itemId: string = buyPrices[nft.rank - 1][0];
        const itemConfig = ItemConfig.getById(itemId);
        if (itemConfig == null) {
            return;
        }

        const price = buyPrices[nft.rank - 1][1] - Math.floor(Math.min(buyThres, pioneer.energy) * buyCoefficient);
    }

    protected viewDidAppear(): void {
        super.viewDidAppear();
    }

    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByPath("Content");
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();
    }

    //-------------------------------- action
    private async onTapAuto() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._pioneer.actionType != MapPioneerActionType.inCity) {
            // use lan
            NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, "Not within the city, unable to replenish troops");
            return;
        }
        const limit = this._pioneer.hpMax;
        let useTroopId: string = "0";
        let useTroopNum: number = 0;
        const origianlTroopNum = DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Troop);
        let maxHp: number = Math.min(limit, origianlTroopNum);
        useTroopNum = maxHp;

        const troopsConfig = TroopsConfig.getAll();
        let unlockTroops = [];
        const troopBuildingData = DataMgr.s.innerBuilding.data.get(InnerBuildingType.TrainingCenter);
        if (troopBuildingData != null) {
            unlockTroops = InnerBuildingLvlUpConfig.getUnlockTroops(troopBuildingData.buildLevel);
        }
        for (const key in troopsConfig) {
            if (Object.prototype.hasOwnProperty.call(troopsConfig, key)) {
                const element = troopsConfig[key];
                if (!unlockTroops.includes(element.id)) {
                    continue;
                }
                const otherTroopNum = DataMgr.s.innerBuilding.getOwnedExecriseTroopNum(element.id);
                const tempTroopNum = Math.min(limit, otherTroopNum);
                const tempMaxHp = tempTroopNum * parseInt(element.hp_training);
                if (tempMaxHp > maxHp) {
                    maxHp = tempMaxHp;
                    useTroopId = element.id;
                    useTroopNum = tempTroopNum;
                }
            }
        }
        if (maxHp <= 0) {
            NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, LanMgr.getLanById("104009"));
            return;
        }
        NetworkMgr.websocketMsg.player_troop_to_hp({
            pioneerId: this._pioneer.uniqueId,
            troopNum: useTroopNum,
            troopId: useTroopId,
        });

        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node, UIPanelLayerType.HUD);
    }
    private async onTapManual() {
        GameMusicPlayMgr.playTapButtonEffect();

        const result = await UIPanelManger.inst.pushPanel(UIName.PlayerDispatchDetailUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(PlayerDispatchDetailUI).configuration([this._pioneer], 0);
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node, UIPanelLayerType.HUD);
    }
    private async onTapCancel() {
        GameMusicPlayMgr.playTapButtonEffect();

        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node, UIPanelLayerType.HUD);
    }
}
