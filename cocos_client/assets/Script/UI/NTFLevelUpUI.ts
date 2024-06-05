import { _decorator, Button, Component, Label, Layout, Node, Sprite } from "cc";
import ViewController from "../BasicView/ViewController";
import UIPanelManger from "../Basic/UIPanelMgr";
import { NFTPioneerObject } from "../Const/NFTPioneerDefine";
import { ItemMgr, LanMgr } from "../Utils/Global";
import LvlupConfig from "../Config/LvlupConfig";
import { ResourceCorrespondingItem } from "../Const/ConstDefine";
import CommonTools from "../Tool/CommonTools";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import { DataMgr } from "../Data/DataMgr";
import { NetworkMgr } from "../Net/NetworkMgr";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("NTFLevelUpUI")
export class NTFLevelUpUI extends ViewController {
    public showUI(NFTData: NFTPioneerObject) {
        this._data = NFTData;

        // userlanMgr
        // this.node.getChildByPath("__ViewContent/Title").getComponent(Label).string = LanMgr.getLanById("201003");
        // this.node.getChildByPath("__ViewContent/btnUse/name").getComponent(Label).string = LanMgr.getLanById("201003");

        const resourceLimitMaxNum = LvlupConfig.getMaxNFTLevelUpNum(this._data.level, DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.NFTExp));
        this._maxLevelUpNum = Math.min(resourceLimitMaxNum, this._data.levelLimit - this._data.level);

        this._refreshUI();
    }

    //------------------------ life cycle
    private _data: NFTPioneerObject = null;
    private _levelUpNum: number = 1;
    private _maxLevelUpNum: number = 0;

    private _currentCost: number = 0;
    protected viewDidLoad(): void {
        super.viewDidLoad();

        NotificationMgr.addListener(NotificationName.NFT_LEVEL_UP, this._onNFTDidLevelUp, this);
    }
    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.NFT_LEVEL_UP, this._onNFTDidLevelUp, this);
    }
    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByPath("__ViewContent");
    }

    //------------------------ function
    private _refreshUI() {
        if (this._data == null) {
            return;
        }
        const contentView = this.node.getChildByPath("__ViewContent");
        // level
        const levelView = contentView.getChildByPath("UpgradeLevel");
        levelView.getChildByPath("Current").getComponent(Label).string = "Lv " + this._data.level;
        levelView.getChildByPath("Next").getComponent(Label).string = "Lv " + (this._data.level + this._levelUpNum);

        // attack
        const growAttack = CommonTools.getOneDecimalNum(this._data.attackGrowValue * this._levelUpNum);
        const attackView = contentView.getChildByPath("Property/Attack");
        // userlanMgr
        // attackView.getChildByPath("Current").getComponent(Label).string = LanMgr.getLanById("201003"); + " +" + growAttack;
        attackView.getChildByPath("Current").getComponent(Label).string = "ATK +" + growAttack;
        attackView.getChildByPath("Next").getComponent(Label).string = CommonTools.getOneDecimalNum(this._data.attack + growAttack).toString();

        // defense
        const growDefense = CommonTools.getOneDecimalNum(this._data.defenseGrowValue * this._levelUpNum);
        const defenseView = contentView.getChildByPath("Property/Defense");
        // userlanMgr
        // defenseView.getChildByPath("Current").getComponent(Label).string = LanMgr.getLanById("201003"); + " +" + growDefense;
        defenseView.getChildByPath("Current").getComponent(Label).string = "DEF +" + growDefense;
        defenseView.getChildByPath("Next").getComponent(Label).string = CommonTools.getOneDecimalNum(this._data.defense + growDefense).toString();

        // hp
        const growHp = CommonTools.getOneDecimalNum(this._data.hpGrowValue * this._levelUpNum);
        const hpView = contentView.getChildByPath("Property/Hp");
        // userlanMgr
        // hpView.getChildByPath("Current").getComponent(Label).string = LanMgr.getLanById("201003"); + " +" + growHp;
        hpView.getChildByPath("Current").getComponent(Label).string = "HP +" + growHp;
        hpView.getChildByPath("Next").getComponent(Label).string = CommonTools.getOneDecimalNum(this._data.hp + growHp).toString();

        // speed
        const growSpeed = CommonTools.getOneDecimalNum(this._data.speedGrowValue * this._levelUpNum);
        const speedView = contentView.getChildByPath("Property/Speed");
        // userlanMgr
        // speedView.getChildByPath("Current").getComponent(Label).string = LanMgr.getLanById("201003"); + " +" + growSpeed;
        speedView.getChildByPath("Current").getComponent(Label).string = "SPD +" + growSpeed;
        speedView.getChildByPath("Next").getComponent(Label).string = CommonTools.getOneDecimalNum(this._data.speed + growSpeed).toString();

        // iq
        const growIq = CommonTools.getOneDecimalNum(this._data.iqGrowValue * this._levelUpNum);
        const iqView = contentView.getChildByPath("Property/Int");
        // userlanMgr
        // iqView.getChildByPath("Current").getComponent(Label).string = LanMgr.getLanById("201003"); + " +" + growIq;
        iqView.getChildByPath("Current").getComponent(Label).string = "Int +" + growIq;
        iqView.getChildByPath("Next").getComponent(Label).string = CommonTools.getOneDecimalNum(this._data.iq + growIq).toString();

        // resource
        this._currentCost = LvlupConfig.getNFTLevelUpCost(this._data.level, this._data.level + this._levelUpNum);
        contentView.getChildByPath("material/Item/Num/Limit").getComponent(Label).string = DataMgr.s.item
            .getObj_item_count(ResourceCorrespondingItem.NFTExp)
            .toString();
        contentView.getChildByPath("material/Item/Num/Use").getComponent(Label).string = this._currentCost.toString();

        // action button
        contentView.getChildByPath("btnUse").getComponent(Sprite).grayscale = this._levelUpNum > this._maxLevelUpNum;
        contentView.getChildByPath("btnUse").getComponent(Button).interactable = this._levelUpNum <= this._maxLevelUpNum;
    }

    //------------------------ action
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }

    private onTapAddLevel() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._levelUpNum + 1 > this._maxLevelUpNum) {
            return;
        }
        this._levelUpNum += 1;
        this._refreshUI();
    }
    private onTapReduceLevel() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._levelUpNum > 1) {
            this._levelUpNum -= 1;
            this._refreshUI();
        }
    }
    private onTapLevelMax() {
        GameMusicPlayMgr.playTapButtonEffect();
        const maxNum = Math.max(this._levelUpNum, this._maxLevelUpNum);
        if (this._levelUpNum != maxNum) {
            this._levelUpNum = maxNum;
            this._refreshUI();
        }
    }
    private onTapConfirmLevelUp() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._data != null && this._currentCost > 0) {
            NetworkMgr.websocketMsg.player_nft_lvlup({ nftId: this._data.uniqueId, levelUpNum: this._levelUpNum });
        }
    }

    //------------------------ notification
    private _onNFTDidLevelUp(data: { nft: NFTPioneerObject }) {
        this._levelUpNum = 1;
        this._maxLevelUpNum = 0;
        this._currentCost = 0;
        this.showUI(data.nft);
    }
}
