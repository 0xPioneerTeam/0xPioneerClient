import { _decorator, Button, Component, EventHandler, instantiate, Label, Layout, Node, Sprite } from "cc";
import { ItemMgr, LanMgr, PioneerMgr } from "../../Utils/Global";
import ViewController from "../../BasicView/ViewController";
import { UIName } from "../../Const/ConstUIDefine";
import { UIHUDController } from "../UIHUDController";
import NotificationMgr from "../../Basic/NotificationMgr";
import EventConfig from "../../Config/EventConfig";
import { EVENT_STEPEND_DATA, EventConfigData, EventCost, EventReward, EventSelectCond, EventSelectCondId, EventSelectCondNum } from "../../Const/Event";
import ItemData, { ItemConfigType, ItemType } from "../../Const/Item";
import ItemConfig from "../../Config/ItemConfig";
import { NotificationName } from "../../Const/Notification";
import { ItemGettedUI } from "../ItemGettedUI";
import Config from "../../Const/Config";
import UIPanelManger from "../../Basic/UIPanelMgr";
import { DataMgr } from "../../Data/DataMgr";
import { MapPioneerAttributesChangeModel, MapPioneerEventAttributesChangeType } from "../../Const/PioneerDefine";
import { AttrChangeType } from "../../Const/ConstDefine";
import { NetworkMgr } from "../../Net/NetworkMgr";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("EventUI")
export class EventUI extends ViewController {
    public eventUIShow(triggerPioneerId: string, eventBuildingId: string, event: EventConfigData) {
        this._triggerPioneerId = triggerPioneerId;
        this._eventBuildingId = eventBuildingId;
        this._refreshUI(event);
    }

    private _triggerPioneerId: string = null;
    private _eventBuildingId: string = null;
    private _temporaryAttributes: Map<string, MapPioneerAttributesChangeModel> = new Map();
    private _fightCallback: (
        pioneerId: string,
        enemyId: string,
        temporaryAttributes: Map<string, MapPioneerAttributesChangeModel>,
        fightOver: (succeed: boolean) => void
    ) => void = null;
    private _dealWithNextEvent: (event: EventConfigData) => void = null;

    private _event: EventConfigData = null;

    private _contentView: Node = null;

    private _dialogView: Node = null;
    private _dialogNextButton: Node = null;
    private _dialogFightButton: Node = null;
    private _dialogSelectView: Node = null;
    private _selectItem: Node = null;

    private _dialogSelectItems: Node[] = [];

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._contentView = this.node.getChildByPath("content");

        this._dialogView = this._contentView.getChildByName("dialog");
        this._dialogNextButton = this._dialogView.getChildByName("nextButton");
        this._dialogFightButton = this._dialogView.getChildByName("fightButton");
        this._dialogSelectView = this._dialogView.getChildByName("selectView");
        this._selectItem = this._dialogSelectView.getChildByName("button");
        this._selectItem.active = false;
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();
    }

    private async _refreshUI(event: EventConfigData) {
        if (event == null) {
            return;
        }
        this._event = event;

        // type = 1：text
        // type = 2：select
        // type = 3：fight
        // type = 4：exchange
        // type = 5：Attributes
        // type = 6：jungle

        // useLanMgr
        // this._dialogView.getChildByPath("nextButton/Label").getComponent(Label).string = LanMgr.getLanById("107549");
        // this._dialogView.getChildByPath("fightButton/Label").getComponent(Label).string = LanMgr.getLanById("107549");
        // this._dialogView.getChildByPath("holdButton/Label").getComponent(Label).string = LanMgr.getLanById("107549");

        // useLanMgr
        this._dialogView.getChildByPath("content/bg/label").getComponent(Label).string = LanMgr.getLanById(event.text);
        // this._dialogView.getChildByPath("content/bg/label").getComponent(Label).string = event.text;
        let localLastTip = null;
        if (this._triggerPioneerId != null) {
            localLastTip = localStorage.getItem("local_event_last_title_" + this._triggerPioneerId);
        }
        this._dialogView.getChildByPath("content/title").getComponent(Label).string = localLastTip == null ? "" : LanMgr.getLanById(localLastTip);

        this._dialogNextButton.active = false;
        this._dialogFightButton.active = false;
        this._dialogSelectView.active = false;

        this._contentView.active = true;

        if (event.type == 2) {
            if (event.select != null && event.select_txt != null && event.select.length == event.select_txt.length) {
                this._dialogSelectView.active = true;
                for (const item of this._dialogSelectItems) {
                    item.destroy();
                }
                this._dialogSelectItems = [];
                for (let i = 0; i < event.select_txt.length; i++) {
                    const item = instantiate(this._selectItem);
                    item.active = true;
                    item.setParent(this._dialogSelectView);

                    let conditionResult = null;
                    if (event.select_cond != null && i < event.select_cond.length) {
                        conditionResult = this._checkIsSatisfiedCondition(event.select_cond[i]);
                    }

                    // useLanMgr
                    item.getChildByName("label").getComponent(Label).string =
                        conditionResult != null
                            ? conditionResult.satisfy
                                ? LanMgr.getLanById(event.select_txt[i])
                                : conditionResult.tipText
                            : LanMgr.getLanById(event.select_txt[i]);
                    // item.getChildByName("label").getComponent(Label).string = conditionResult != null ? (conditionResult.satisfy ? event.select_txt[i] : conditionResult.tipText) : event.select_txt[i];

                    item.getComponent(Sprite).grayscale = conditionResult != null ? !conditionResult.satisfy : false;
                    item.getComponent(Button).interactable = conditionResult != null ? conditionResult.satisfy : true;
                    item.getComponent(Button).clickEvents[0].customEventData = i + "|" + event.select[i] + "|" + event.select_txt[i];
                    this._dialogSelectItems.push(item);
                }
                this._dialogSelectView.getComponent(Layout).updateLayout();
            }
        } else if (event.type == 3) {
            this._dialogFightButton.active = true;
            this._dialogFightButton.getComponent(Button).clickEvents[0].customEventData = event.enemy;
        } else {
            this._dialogNextButton.active = true;
            this._dialogNextButton.getComponent(Button).clickEvents[0].customEventData = event.result;
            // if (event.type == 4) {
            //     let showTip: string = "";
            //     if (event.cost != null) {
            //         showTip += await this._loseOrGainItemAndResource(event.cost, true);
            //     }
            //     if (event.reward != null) {
            //         showTip += await this._loseOrGainItemAndResource(event.reward, false);
            //     }
            //     UIHUDController.showCenterTip(showTip);
            // } else if (event.type == 5) {
            //     if (event.change != null) {
            //         let showTip: string = "";
            //         for (const tempChange of event.change) {
            //             const isPlayer: boolean = tempChange[0] == "-1";
            //             const pioneerId: string = isPlayer ? this._triggerPioneerId : tempChange[0];
            //             // 1-hp 2-attack
            //             const changedType: MapPioneerEventAttributesChangeType = tempChange[1];
            //             // 1-add 2-multi
            //             const changeMethod: AttrChangeType = tempChange[2];
            //             const changedValue: number = tempChange[3];

            //             if (isPlayer && changedType == 1) {
            //                 let useValue: number = 0;
            //                 if (changeMethod == AttrChangeType.ADD) {
            //                     useValue = changedValue;
            //                 } else if (changeMethod == AttrChangeType.MUL) {
            //                     useValue = DataMgr.s.pioneer.getById(pioneerId)?.hpMax * changedValue;
            //                 }
            //             } else {
            //                 this._temporaryAttributes.set(pioneerId, { method: changeMethod, type: changedType, value: changedValue });
            //             }
            //             if (isPlayer) {
            //                 if (changedType == 1) {
            //                     // useLanMgr
            //                     showTip += LanMgr.getLanById("207001") + "\n";
            //                     // showTip += "Your HP has changed\n";
            //                 } else {
            //                     // useLanMgr
            //                     showTip += LanMgr.getLanById("207002") + "\n";
            //                     // showTip += "Your Attack has changed\n";
            //                 }
            //             } else {
            //                 const pioneerInfo = DataMgr.s.pioneer.getById(pioneerId);
            //                 if (pioneerInfo == null) {
            //                     if (changedType == 1) {
            //                         // useLanMgr
            //                         showTip += LanMgr.getLanById("207003") + "\n";
            //                         // showTip += "Enemy's HP has changed\n";
            //                     } else {
            //                         // useLanMgr
            //                         showTip += LanMgr.getLanById("207004") + "\n";
            //                         // showTip += "Enemy's Attack has changed\n";
            //                     }
            //                 } else {
            //                     if (changedType == 1) {
            //                         // useLanMgr
            //                         showTip += LanMgr.replaceLanById("207005", [pioneerInfo.name]) + "\n";
            //                         // showTip += pioneerInfo.name + " HP has changed\n";
            //                     } else {
            //                         // useLanMgr
            //                         showTip += LanMgr.replaceLanById("207006", [pioneerInfo.name]) + "\n";
            //                         // showTip += pioneerInfo.name + " Attack has changed\n";
            //                     }
            //                 }
            //             }
            //         }
            //         UIHUDController.showCenterTip(showTip);
            //     }
            // }
        }
    }

    private _checkIsSatisfiedCondition(condition: EventSelectCond): { satisfy: boolean; tipText: string } {
        const temple: { satisfy: boolean; tipText: string } = { satisfy: true, tipText: "" };
        const type: ItemConfigType = condition[0];
        const id: EventSelectCondId = condition[1];
        const num: EventSelectCondNum = condition[2];

        if (type == ItemConfigType.Item) {
            const currentNum = DataMgr.s.item.getObj_item_count(id);
            if (currentNum >= num) {
                temple.satisfy = true;
            } else {
                temple.satisfy = false;
                const itemConf = ItemConfig.getById(id);
                if (itemConf != null) {
                    // useLanMgr
                    temple.tipText = LanMgr.replaceLanById("207007", [num]) + LanMgr.getLanById(itemConf.itemName);
                    // temple.tipText = "you need AT LEAST " + num + " " + itemConf.itemName;
                }
            }
        } else if (type == ItemConfigType.Artifact) {
            // xx wait artifact
        }
        // reserved for later
        // } else if (type == 3) {
        //     if (this._triggerPioneerId != null) {
        //         const pioneer = DataMgr.s.pioneer.getById(this._triggerPioneerId);
        //         if (id == 1) {
        //             // hp
        //             if (pioneer.hp > num) {
        //                 // only hp need left 1
        //                 temple.satisfy = true;
        //             } else {
        //                 temple.satisfy = false;

        //                 // useLanMgr
        //                 // temple.tipText = LanMgr.replaceLanById("107549", [num+1]);
        //                 temple.tipText = "you need AT LEAST " + (num + 1) + " HP";
        //             }

        //         } else if (id == 2) {
        //             // attack
        //             if (pioneer.attack >= num) {
        //                 temple.satisfy = true;
        //             } else {
        //                 temple.satisfy = false;

        //                 // useLanMgr
        //                 // temple.tipText = LanMgr.replaceLanById("107549", [num]);
        //                 temple.tipText = "you need AT LEAST " + num + " Attack";
        //             }
        //         }
        //     }
        // }
        return temple;
    }
    //------------------------------------------------ action
    private onTapNext(actionEvent: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        NetworkMgr.websocketMsg.player_event_select({
            buildingId: this._eventBuildingId,
            pioneerId: this._triggerPioneerId,
        });
        UIPanelManger.inst.popPanel(this.node);
    }
    private onTapFight(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        NetworkMgr.websocketMsg.player_event_select({
            buildingId: this._eventBuildingId,
            pioneerId: this._triggerPioneerId,
        });
        UIPanelManger.inst.popPanel(this.node);
    }
    private onTapSelect(actionEvent: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const datas = customEventData.split("|");
        const index = parseInt(datas[0]);
        const eventId = datas[1];
        const selectText = datas[2];
        if (this._triggerPioneerId != null) {
            if (Config.canSaveLocalData) {
                localStorage.setItem("local_event_last_title_" + this._triggerPioneerId, selectText);
            }
        }
        NetworkMgr.websocketMsg.player_event_select({
            buildingId: this._eventBuildingId,
            pioneerId: this._triggerPioneerId,
            selectIdx: index,
        });
        UIPanelManger.inst.popPanel(this.node);
    }
    private onTapHoldOn() {
        GameMusicPlayMgr.playTapButtonEffect();
        UIPanelManger.inst.popPanel(this.node);
    }
}
