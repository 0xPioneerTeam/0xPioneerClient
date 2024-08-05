import {
  _decorator,
  Button,
  Color,
  instantiate,
  Label,
  Layout,
  Mask,
  Node,
  ScrollView,
  UITransform,
  RichText,
} from "cc";

import ViewController from "../BasicView/ViewController";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import UIPanelManger from "../Basic/UIPanelMgr";
import { DataMgr } from "../Data/DataMgr";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
import { NetworkMgr } from "../Net/NetworkMgr";
import { s2c_user, share } from "../Net/msg/WebsocketMsg";

const { ccclass, property } = _decorator;

@ccclass("BattleReportDetailUI")
export class BattleReportsDetailUI extends ViewController {
  private _reports: share.Inew_battle_report_data[] = [];

  @property(Label)
  private attacker_name: Label = null;

  @property(Label)
  private defender_name: Label = null;

  public refreshUI() {
    // data: share.Ifight_res[]
    // console.log(data);
    // const fightDatas = data;
    const fightLogView = this.node
      .getChildByPath("__ViewContent/EffectContent/BattleReport")
      .getComponent("RichText");
    const intervalId = setInterval(() => {
      // if (fightDatas.length <= 0) {
      //     if (this._fightDataMap.has(attackerData.uniqueId)) {
      //         const temp = this._fightDataMap.get(attackerData.uniqueId);
      //         clearInterval(temp.intervalId);
      //     }
      //     return;
      // }
      // const tempFightData = fightDatas.shift();
      // if (tempFightData.attackerId == attackerData.uniqueId) {
      //     // attacker action
      //     defenderData.hp -= tempFightData.hp;
      // } else {
      //     attackerData.hp -= tempFightData.hp;
      //     // wait change
      // }
      fightLogView.string += "output\n";
    }, 1000) as unknown as number;
  }

  //---------------------------------------------------
  // action
  public onTapClose() {
    GameMusicPlayMgr.playTapButtonEffect();
    UIPanelManger.inst.popPanel(this.node);
  }
  //------------------------------ websocket
}
