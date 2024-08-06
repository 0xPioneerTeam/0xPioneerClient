import { _decorator, Button, Color, instantiate, Label, Layout, Mask, Node, ScrollView, UITransform, RichText } from "cc";

import ViewController from "../BasicView/ViewController";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import UIPanelManger from "../Basic/UIPanelMgr";
import { DataMgr } from "../Data/DataMgr";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
import { NetworkMgr } from "../Net/NetworkMgr";
import { s2c_user, share } from "../Net/msg/WebsocketMsg";
import { LanMgr } from "../Utils/Global";

const { ccclass, property } = _decorator;

@ccclass("BattleReportDetailUI")
export class BattleReportDetailUI extends ViewController {
    private _reports: share.Inew_battle_report_data[] = [];
    private _intervalId: number = null;

    @property(Label)
    private attacker_name: Label = null;

    @property(Label)
    private defender_name: Label = null;

    @property(RichText)
    private battle_log: RichText = null;

    public refreshUI(fight: share.Inew_battle_report_fight_data) {
        const fightDatas: share.Ifight_res[] = fight.fightRes;
        // data: share.Ifight_res[]
        // console.log(data);
        // const fightDatas = data;
        // const fightDatas = [
        //   {
        //     attackerId: "0_0_4_1|hred_1",
        //     attackerName: "monster",
        //     attackerAnimType: "monster_a_1",
        //     defenderId: "3|pioneer_0",
        //     defenderName: "Pioneer",
        //     defenderAnimType: "self",
        //     hp: 1,
        //   },
        //   {
        //     attackerId: "3|pioneer_0",
        //     attackerName: "Pioneer",
        //     attackerAnimType: "self",
        //     defenderId: "0_0_4_1|hred_1",
        //     defenderName: "monster",
        //     defenderAnimType: "monster_a_1",
        //     hp: 43,
        //   },
        //   {
        //     attackerId: "0_0_4_1|hred_1",
        //     attackerName: "monster",
        //     attackerAnimType: "monster_a_1",
        //     defenderId: "3|pioneer_0",
        //     defenderName: "Pioneer",
        //     defenderAnimType: "self",
        //     hp: 2,
        //   },
        //   {
        //     attackerId: "3|pioneer_0",
        //     attackerName: "Pioneer",
        //     attackerAnimType: "self",
        //     defenderId: "0_0_4_1|hred_1",
        //     defenderName: "monster",
        //     defenderAnimType: "monster_a_1",
        //     hp: 12,
        //   },
        // ];
        // this.battle_log.string = "<color=#00ff00>Pioneer</color> anticipated <color=#ff0000>Shark</color>'s attack direction and only received <color=#0fffff>55</color> points of damage.\n"
        this.battle_log.string = "<b><color=#0fffff>【BATTLE START】</color></b>\n";
        this.attacker_name.string = LanMgr.getLanById(fightDatas[0].attackerName);
        this.defender_name.string = LanMgr.getLanById(fightDatas[0].defenderName);
        let round = 1;
        this._intervalId = setInterval(() => {
            if (fightDatas.length <= 0) {
                if (this._intervalId != null) {
                    clearInterval(this._intervalId);
                    this._intervalId = null;
                }
                this.battle_log.string += `<b><color=#0fffff>【BATTLE END】</color></b>\n`;
                return;
            }

            const tempFightData = fightDatas.shift();
            const coloredAttackerName = this.getActorName(tempFightData.attackerId, tempFightData.attackerName);
            const coloredDefenderName = this.getActorName(tempFightData.defenderId, tempFightData.defenderName);
            const coloredDamaged = `<color=#0fffff>${tempFightData.hp}</color>`;

            const normalText = [
                `${coloredAttackerName} attacked ${coloredDefenderName} and dealt ${coloredDamaged} points of damage.`,
                `${coloredAttackerName} hacked ${coloredDefenderName}, causing ${coloredDamaged} points of damage.`,
                `${coloredAttackerName} approached ${coloredDefenderName} and slashed, dealing ${coloredDamaged} points of damage.`,
                `${coloredAttackerName} lunged at ${coloredDefenderName} with a fierce strike, inflicting ${coloredDamaged} points of damage.`,
                `${coloredAttackerName} charged towards ${coloredDefenderName} and delivered a powerful blow, causing ${coloredDamaged} points of damage.`,
                `${coloredAttackerName} swung their weapon at ${coloredDefenderName}, resulting in ${coloredDamaged} points of damage.`,
                `${coloredAttackerName} unleashed a swift attack on ${coloredDefenderName}, dealing ${coloredDamaged} points of damage.`,
                `${coloredAttackerName} aimed carefully at ${coloredDefenderName} and struck, dealing ${coloredDamaged} points of damage.`,
            ];
            const littleText = [
                `${coloredAttackerName}'s attack was dodged by ${coloredDefenderName}, and only ${coloredDamaged} points of damage were received.`,
                `${coloredAttackerName}'s attack direction was anticipated by ${coloredDefenderName}, resulting in only ${coloredDamaged} points of damage being received.`,
                `${coloredAttackerName}'s strike was evaded by ${coloredDefenderName}, but ${coloredDefenderName} still took ${coloredDamaged} points of damage.`,
                `${coloredAttackerName}'s blow was sidestepped by ${coloredDefenderName}, and only ${coloredDamaged} points of damage were sustained.`,
                `${coloredAttackerName}'s attack was dodged successfully by ${coloredDefenderName}, receiving just ${coloredDamaged} points of damage.`,
                `${coloredAttackerName}'s assault was quickly avoided by ${coloredDefenderName}, but ${coloredDefenderName} still incurred ${coloredDamaged} points of damage.`,
                `${coloredAttackerName}'s hit was skillfully dodged by ${coloredDefenderName}, resulting in only ${coloredDamaged} points of damage.`,
            ];
            let reportText = "";
            if (tempFightData.hp > 1) {
                reportText = normalText[Math.floor(Math.random() * normalText.length)];
            } else {
                reportText = littleText[Math.floor(Math.random() * littleText.length)];
            }
            this.battle_log.string += `<color=#0fffff><size=14>-------------------ROUND ${round}-------------------</size></color>\n` + reportText + "\n";
            round += 1;
            // if (tempFightData.attackerId == attackerData.uniqueId) {
            //     // attacker action
            //     defenderData.hp -= tempFightData.hp;
            // } else {
            //     attackerData.hp -= tempFightData.hp;
            //     // wait change
            // }
            // fightLogView.string += "output<br>";
        }, 1000) as unknown as number;
    }

    //---------------------------------------------------
    // action
    public onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._intervalId != null) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
        UIPanelManger.inst.popPanel(this.node);
    }
    //------------------------------ websocket
    private getActorName(actorId: string, actorName: string): string {
        const [location, name] = actorId.split("|");
        if (location.includes("_")) {
            return `<b><color=#ff0000><size=20>${LanMgr.getLanById(actorName)}</size></color></b>`;
        } else {
            return `<b><color=#00ff00><size=20>${LanMgr.getLanById(actorName)}</size></color></b>`;
        }
        return "";
    }
}
