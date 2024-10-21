import { _decorator, Label, Node } from "cc";
import ViewController from "../../BasicView/ViewController";
import UIPanelManger, { UIPanelLayerType } from "../../Basic/UIPanelMgr";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import { DataMgr } from "../../Data/DataMgr";
import { NetworkMgr } from "../../Net/NetworkMgr";
import { LanMgr } from "../../Utils/Global";
import { MapPioneerType, MapPlayerPioneerObject } from "../../Const/PioneerDefine";

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
import { UIHUDController } from "../UIHUDController";
import { ItemConfigData } from "../../Const/Item";

const { ccclass, property } = _decorator;

@ccclass("ReplenishEnergyView")
export class ReplenishEnergyView extends ViewController {
    private _pioneer: MapPlayerPioneerObject = null;
    private _limitLeft: boolean = false;
    private _psycPrice: number = 99999;
    private _psycItemId: string = "";
    private _psycItemConfig: ItemConfigData = null;

    private _piotPrice: number = 99999;
    private _piotItemId: string = "";
    private _piotItemConfig: ItemConfigData = null;

    public configuration(uniqueId: string) {
        const pioneer = DataMgr.s.pioneer.getById(uniqueId);
        if (pioneer == undefined || pioneer.type != MapPioneerType.player) {
            UIPanelManger.inst.popPanel(this.node, UIPanelLayerType.HUD);
            return;
        }
        this._pioneer = pioneer as MapPlayerPioneerObject;
        const nft = DataMgr.s.nftPioneer.getNFTById(this._pioneer.NFTId);
        if (nft == null) {
            return;
        }

        const buyLimit = (ConfigConfig.getConfig(ConfigType.BuyEnergyLimit) as BuyEnergyLimitParam).limit;
        const buyPricePsyc = (ConfigConfig.getConfig(ConfigType.BuyEnergyPricePsyc) as BuyEnergyPricePsycParam).prices;
        const buyPricePiot = (ConfigConfig.getConfig(ConfigType.BuyEnergyPricePiot) as BuyEnergyPricePiotParam).prices;
        const buyThres = (ConfigConfig.getConfig(ConfigType.BuyEnergyThres) as BuyEnergyThresParam).thresholds;
        const buyCoefficient = (ConfigConfig.getConfig(ConfigType.BuyEnergyCoefficient) as BuyEnergyCoefficientParam).coefficient;

        const psycPriceData = buyPricePsyc[Math.min(buyPricePsyc.length - 1, nft.rank - 1)];
        this._psycItemId = psycPriceData[0];
        this._psycItemConfig = ItemConfig.getById(this._psycItemId);
        if (this._psycItemConfig == null) {
            return;
        }
        this._psycPrice = psycPriceData[1] - Math.floor(Math.min(buyThres, pioneer.energy) * buyCoefficient);

        const piotPriceData = buyPricePiot[Math.min(buyPricePiot.length - 1, DataMgr.s.userInfo.data.buyEnergyPiotTimes)];
        this._piotItemId = piotPriceData[0];
        this._piotItemConfig = ItemConfig.getById(this._piotItemId);
        if (this._piotItemConfig == null) {
            return;
        }
        this._piotPrice = piotPriceData[1];

        this.node.getChildByPath("Content/PsycButton/Value").getComponent(Label).string = this._psycPrice.toString();
        this.node.getChildByPath("Content/PiotButton/Value").getComponent(Label).string = this._piotPrice.toString();

        this.node.getChildByPath("Content/Tip").getComponent(Label).string = LanMgr.replaceLanById("1100201", [
            LanMgr.getLanById(this._pioneer.name),
            this._psycPrice,
            LanMgr.getLanById(this._psycItemConfig.itemName),
            this._piotPrice,
            LanMgr.getLanById(this._piotItemConfig.itemName),
            this._pioneer.energyMax - this._pioneer.energy,
            Math.max(0, buyLimit - DataMgr.s.userInfo.data.buyEnergyLimitTimes),
        ]);

        this._limitLeft = buyLimit > DataMgr.s.userInfo.data.buyEnergyLimitTimes;
    }

    protected viewDidLoad(): void {
        super.viewDidLoad();
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
    private async onTapPsycBuy() {
        GameMusicPlayMgr.playTapButtonEffect();

        if (!this._limitLeft) {
            UIHUDController.showCenterTip(LanMgr.getLanById("1100202"));
            return;
        }
        if (this._psycPrice > DataMgr.s.item.getObj_item_count(this._psycItemId)) {
            UIHUDController.showCenterTip(LanMgr.replaceLanById("1100203", [LanMgr.getLanById(this._psycItemConfig.itemName)]));
            return;
        }
        NetworkMgr.websocketMsg.player_psyc_to_energy({
            pioneerId: this._pioneer.uniqueId,
            itemId: this._psycItemId,
            itemNum: this._psycPrice,
            buyType: 0,
        });

        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node, UIPanelLayerType.HUD);
    }

    private async onTapPiotBuy() {
        GameMusicPlayMgr.playTapButtonEffect();

        if (!this._limitLeft) {
            UIHUDController.showCenterTip(LanMgr.getLanById("1100202"));
            return;
        }
        if (this._piotPrice > DataMgr.s.item.getObj_item_count(this._piotItemId)) {
            UIHUDController.showCenterTip(LanMgr.replaceLanById("1100203", [LanMgr.getLanById(this._piotItemConfig.itemName)]));
            return;
        }
        NetworkMgr.websocketMsg.player_psyc_to_energy({
            pioneerId: this._pioneer.uniqueId,
            itemId: this._piotItemId,
            itemNum: this._piotPrice,
            buyType: 1,
        });

        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node, UIPanelLayerType.HUD);
    }

    private async onTapCancel() {
        GameMusicPlayMgr.playTapButtonEffect();

        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node, UIPanelLayerType.HUD);
    }
}
