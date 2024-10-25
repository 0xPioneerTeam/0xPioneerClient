import { _decorator, Button, Component, EditBox, instantiate, Label, Layout, Node } from "cc";
import ViewController from "../../BasicView/ViewController";
import { LanMgr } from "../../Utils/Global";
import UIPanelManger from "../../Basic/UIPanelMgr";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import { NetworkMgr } from "../../Net/NetworkMgr";
import AbiConfig from "../../Config/AbiConfig";
import { DataMgr } from "../../Data/DataMgr";
import { ResourceCorrespondingItem } from "../../Const/ConstDefine";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
const { ccclass, property } = _decorator;

@ccclass("InteractChainUI")
export class InteractChainUI extends ViewController {
    private _psycOnlineLabel: Label = null;
    private _psycOnlineInput: EditBox = null;
    private _psycOfflineLabel: Label = null;
    private _psycOfflineInput: EditBox = null;

    private _piotOnlineLabel: Label = null;
    private _piotOnlineInput: EditBox = null;
    private _piotOfflineLabel: Label = null;
    private _piotOfflineInput: EditBox = null;

    private _onlinePsycNum: number = 0;
    private _offlinePsycNum: number = 0;
    private _onlinePiotNum: number = 0;
    private _offlinePiotNum: number = 0;

    private _psycAddr: string = null;
    private _piotAddr: string = null;

    protected viewDidLoad(): void {
        super.viewDidLoad();

        const contentView = this.node.getChildByPath("__ViewContent");
        this._psycOnlineLabel = contentView.getChildByPath("Psyc/Online").getComponent(Label);
        this._psycOnlineInput = contentView.getChildByPath("Psyc/OnlineEditBox").getComponent(EditBox);
        this._psycOfflineLabel = contentView.getChildByPath("Psyc/Offline").getComponent(Label);
        this._psycOfflineInput = contentView.getChildByPath("Psyc/OfflineEditBox").getComponent(EditBox);

        this._piotOnlineLabel = contentView.getChildByPath("Piot/Online").getComponent(Label);
        this._piotOnlineInput = contentView.getChildByPath("Piot/OnlineEditBox").getComponent(EditBox);
        this._piotOfflineLabel = contentView.getChildByPath("Piot/Offline").getComponent(Label);
        this._piotOfflineInput = contentView.getChildByPath("Piot/OfflineEditBox").getComponent(EditBox);

        this._psycAddr = AbiConfig.getAbiByContract("PioneerSyCoin20").addr;
        this._piotAddr = AbiConfig.getAbiByContract("PioneerToken20").addr;

        NotificationMgr.addListener(NotificationName.ITEM_CHANGE, this._onItemChanged, this);
    }
    protected viewDidStart(): void {
        super.viewDidStart();

        this._refreshUI();
    }

    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByPath("__ViewContent");
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.ITEM_CHANGE, this._onItemChanged, this);
    }

    private async _refreshUI() {
        if (this._psycAddr == null || this._piotAddr == null) {
            return;
        }
        this._onlinePsycNum = await NetworkMgr.ethereum.getBalanceErc20IntNum(this._psycAddr);
        this._offlinePsycNum = DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Energy);

        this._onlinePiotNum = await NetworkMgr.ethereum.getBalanceErc20IntNum(this._piotAddr);
        this._offlinePiotNum = DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Gold);

        this._psycOnlineLabel.string = "Online: " + this._onlinePsycNum;
        this._psycOfflineLabel.string = "Offline: " + this._offlinePsycNum;

        this._piotOnlineLabel.string = "Online: " + this._onlinePiotNum;
        this._piotOfflineLabel.string = "Offline: " + this._offlinePiotNum;
    }

    //------------------------ action
    private async onTapDeposit(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const index = parseInt(customEventData);

        let currAddr: string = null;
        let currInputNum: number = null;
        let currMaxNum: number = null;
        if (index == 0) {
            // psyc
            currAddr = this._psycAddr;
            currInputNum = parseInt(this._psycOnlineInput.string);
            currMaxNum = this._onlinePsycNum;
        } else {
            // piot
            currAddr = this._piotAddr;
            currInputNum = parseInt(this._piotOnlineInput.string);
            currMaxNum = this._onlinePiotNum;
        }
        if (currAddr == null || currInputNum == null || currMaxNum == null) {
            return;
        }
        if (currInputNum <= 0 || currInputNum > currMaxNum) {
            return;
        }
        const res = await NetworkMgr.ethereum.isApprovedErc20("PMintable20", currAddr, "PioneerOffOnChainBridge", "", currInputNum.toString());
        if (!res) {
            await NetworkMgr.ethereum.setApproveErc20("PMintable20", currAddr, "PioneerOffOnChainBridge", "");
            return;
        }
        if (index == 0) {
            await NetworkMgr.ethereum.on2offPSYC(currInputNum, currAddr);
        } else {
            await NetworkMgr.ethereum.on2offPIOT(currInputNum, currAddr);
        }
        this._refreshUI();
    }
    private onTapWithdraw(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const index = parseInt(customEventData);

        let currInputNum: number = null;
        let currMaxNum: number = null;
        if (index == 0) {
            // psyc
            currInputNum = parseInt(this._psycOfflineInput.string);
            currMaxNum = this._offlinePsycNum;
        } else {
            // piot
            currInputNum = parseInt(this._piotOfflineInput.string);
            currMaxNum = this._offlinePiotNum;
        }

        if (currInputNum == null || currMaxNum == null) {
            return;
        }
        if (currInputNum <= 0 || currInputNum > currMaxNum) {
            return;
        }

        if (index == 0) {
            NetworkMgr.websocketMsg.player_psyc_transform_to_online({ num: currInputNum });
        } else {
            NetworkMgr.websocketMsg.player_piot_transform_to_online({ num: currInputNum });
        }
    }

    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }

    //------------------------- notify
    private _onItemChanged() {
        this._refreshUI();
    }
}
