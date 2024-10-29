import { _decorator, Button, Color, Component, CurveRange, EditBox, instantiate, Label, Layout, Node } from "cc";
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
    private _tabPsycButton = null;
    private _tabPiotButton = null;

    /**
     * 0-psyc  1-piot
     */
    private _tabIndex: number = 0;

    private _onlineConvertValue: number = 0;
    private _offlineConvertValue: number = 0;

    private _psycAddr: string = null;
    private _piotAddr: string = null;

    public configuration(tabIndex: number) {
        if (this._tabIndex == tabIndex) {
            return;
        }
        this._tabIndex = tabIndex;
        this._refreshUI();
    }

    protected viewDidLoad(): void {
        super.viewDidLoad();

        const contentView = this.node.getChildByPath("__ViewContent");
        this._tabPsycButton = contentView.getChildByPath("TabButtons/PsycButton");
        this._tabPiotButton = contentView.getChildByPath("TabButtons/PiotButton");

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
        if (this._tabIndex == 0 && this._psycAddr == null) {
            return;
        }
        if (this._tabIndex == 1 && this._piotAddr == null) {
            return;
        }

        const tabButtons = [this._tabPsycButton, this._tabPiotButton];
        for (let i = 0; i < tabButtons.length; i++) {
            const tabButton = tabButtons[i];
            tabButton.getChildByPath("Common").active = this._tabIndex != i;
            tabButton.getChildByPath("Light").active = this._tabIndex == i;
            tabButton.getChildByPath("Label").getComponent(Label).color = this._tabIndex == i ? new Color(66, 53, 35) : new Color(122, 114, 111);
        }

        this.node.getChildByPath("__ViewContent/PiotView").active = false;
        this.node.getChildByPath("__ViewContent/PsycView").active = false;

        let currentView: Node = null;
        let onlineValue: number = 0;
        let offlineValue: number = 0;
        if (this._tabIndex == 0) {
            currentView = this.node.getChildByPath("__ViewContent/PsycView");
            NetworkMgr.ethereum.getBalanceErc20IntNum(this._psycAddr).then((value) => {
                onlineValue = value;
                currentView.getChildByPath("OnlineView/Value").getComponent(Label).string = onlineValue.toString();
            });
            offlineValue = DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Energy);
        } else if (this._tabIndex == 1) {
            currentView = this.node.getChildByPath("__ViewContent/PiotView");

            NetworkMgr.ethereum.getBalanceErc20IntNum(this._piotAddr).then((value) => {
                onlineValue = value;
                currentView.getChildByPath("OnlineView/Value").getComponent(Label).string = onlineValue.toString();
            });
            offlineValue = DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Gold);
        }
        if (currentView == null) {
            return;
        }
        currentView.active = true;
        currentView.getChildByPath("OnlineView/Value").getComponent(Label).string = onlineValue.toString();
        currentView.getChildByPath("OfflineView/Value").getComponent(Label).string = offlineValue.toString();
        currentView.getChildByPath("OnlineView/Control/Value").getComponent(Label).string = this._onlineConvertValue.toString();
        currentView.getChildByPath("OfflineView/Control/Value").getComponent(Label).string = this._offlineConvertValue.toString();
    }

    //------------------------ action
    private onTapTab(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const index = parseInt(customEventData);
        if (this._tabIndex == index) {
            return;
        }
        this._tabIndex = index;
        this._onlineConvertValue = 0;
        this._offlineConvertValue = 0;
        this._refreshUI();
    }
    private onTapConvertNumAdd(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const index = parseInt(customEventData);
        if (index == 0) {
            this._onlineConvertValue += 1;
        } else if (index == 1) {
            this._offlineConvertValue += 1;
        }
        this._refreshUI();
    }
    private onTapConvertNumReduce(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const index = parseInt(customEventData);
        if (index == 0) {
            this._onlineConvertValue -= 1;
            if (this._onlineConvertValue < 0) {
                this._onlineConvertValue = 0;
            }
        } else if (index == 1) {
            this._offlineConvertValue -= 1;
            if (this._offlineConvertValue < 0) {
                this._offlineConvertValue = 0;
            }
        }
        this._refreshUI();
    }
    private async onTapDeposit(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        let currAddr: string = null;
        let currInputNum: number = this._onlineConvertValue;
        let currMaxNum: number = null;
        if (this._tabIndex == 0) {
            // psyc
            currAddr = this._psycAddr;
            currMaxNum = parseInt(this.node.getChildByPath("__ViewContent/PsycView/OnlineView/Value").getComponent(Label).string);
        } else {
            // piot
            currAddr = this._piotAddr;
            currMaxNum = parseInt(this.node.getChildByPath("__ViewContent/PiotView/OnlineView/Value").getComponent(Label).string);
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
        if (this._tabIndex == 0) {
            await NetworkMgr.ethereum.on2offPSYC(currInputNum, currAddr);
        } else {
            await NetworkMgr.ethereum.on2offPIOT(currInputNum, currAddr);
        }
        this._refreshUI();
    }
    private onTapWithdraw(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        let currInputNum: number = this._offlineConvertValue;
        let currMaxNum: number = null;
        if (this._tabIndex == 0) {
            // psyc
            currMaxNum = DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Energy);
        } else {
            // piot
            currMaxNum = DataMgr.s.item.getObj_item_count(ResourceCorrespondingItem.Gold);
        }

        if (currInputNum == null || currMaxNum == null) {
            return;
        }
        if (currInputNum <= 0 || currInputNum > currMaxNum) {
            return;
        }

        if (this._tabIndex == 0) {
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
