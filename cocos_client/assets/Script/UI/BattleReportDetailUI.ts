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
import { MapFightObject } from "../Const/PioneerDefine";
import { Icombat_battle_reprot_item,Icombat_battle_action_type } from "../Const/CombatBattleReportDefine";
import PioneerConfig from "../Config/PioneerConfig";
import NFTSkillConfig from "../Config/NFTSkillConfig";
import NFTSkillEffectConfig from "../Config/NFTSkillEffectConfig";

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

    private actors: Map<string, share.Inew_battle_report_fight_member_data> = new Map();
    private round:number =1;

    public refreshUI(fight: share.Inew_battle_report_fight_data) {
        const fightDatas: Icombat_battle_reprot_item[] = [];
        if (fight.fightRes != null && fight.fightRes.length > 0) {
            fightDatas.push(...fight.fightRes);
        }
        if (fightDatas.length <= 0) {
            return;
        }
        console.log(fightDatas)
        // const actors: Map<string, share.Inew_battle_report_fight_member_data> = new Map();
        this.actors.set(fight.attacker.id, fight.attacker);
        this.actors.set(fight.defender.id, fight.defender);
        console.log(this.actors)
        this.battle_log.string = "<b><color=#0fffff>【BATTLE START】</color></b>\n";

        this.attacker_name.string = LanMgr.getLanById(this.actors.get(fightDatas[0].actionUniqueid).name);
        this.defender_name.string = LanMgr.getLanById(this.actors.get(fightDatas[0].targetUniqueid).name);

        // let round = 1;
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
            this.doAction(tempFightData)
            // round += 1;
            // if (tempFightData.attackerId == attackerData.uniqueId) {
            //     // attacker action
            //     defenderData.hp -= tempFightData.hp;
            // } else {
            //     attackerData.hp -= tempFightData.hp;
            //     // wait change
            // }
            // fightLogView.string += "output<br>";
            const logHeight: number = this.battle_log.node.getComponent(UITransform).height;
            this.battle_log.node.parent.getComponent(UITransform).height = logHeight;
            if (logHeight > this.node.getChildByPath("__ViewContent/ScrollView").getComponent(UITransform).height) {
                this.node.getChildByPath("__ViewContent/ScrollView").getComponent(ScrollView).scrollToBottom();
            }
        }, 1000) as unknown as number;

        // this.attacker_name.string = LanMgr.getLanById(actors.get(fightDatas[0].attackerId).name);
        // this.defender_name.string = LanMgr.getLanById(actors.get(fightDatas[0].defenderId).name);
        // let round = 1;
        // this._intervalId = setInterval(() => {
        //     if (fightDatas.length <= 0) {
        //         if (this._intervalId != null) {
        //             clearInterval(this._intervalId);
        //             this._intervalId = null;
        //         }
        //         this.battle_log.string += `<b><color=#0fffff>【BATTLE END】</color></b>\n`;
        //         return;
        //     }

        //     const tempFightData = fightDatas.shift();
        //     const coloredAttackerName = this.getActorName(tempFightData.attackerId, actors.get(tempFightData.attackerId).name);
        //     const coloredDefenderName = this.getActorName(tempFightData.defenderId, actors.get(tempFightData.defenderId).name);
        //     const coloredDamaged = `<color=#0fffff>${tempFightData.hp}</color>`;

        //     const normalText = [
        //         `${coloredAttackerName} attacked ${coloredDefenderName} and dealt ${coloredDamaged} points of damage.`,
        //         `${coloredAttackerName} hacked ${coloredDefenderName}, causing ${coloredDamaged} points of damage.`,
        //         `${coloredAttackerName} approached ${coloredDefenderName} and slashed, dealing ${coloredDamaged} points of damage.`,
        //         `${coloredAttackerName} lunged at ${coloredDefenderName} with a fierce strike, inflicting ${coloredDamaged} points of damage.`,
        //         `${coloredAttackerName} charged towards ${coloredDefenderName} and delivered a powerful blow, causing ${coloredDamaged} points of damage.`,
        //         `${coloredAttackerName} swung their weapon at ${coloredDefenderName}, resulting in ${coloredDamaged} points of damage.`,
        //         `${coloredAttackerName} unleashed a swift attack on ${coloredDefenderName}, dealing ${coloredDamaged} points of damage.`,
        //         `${coloredAttackerName} aimed carefully at ${coloredDefenderName} and struck, dealing ${coloredDamaged} points of damage.`,
        //     ];
        //     const littleText = [
        //         `${coloredAttackerName}'s attack was dodged by ${coloredDefenderName}, and only ${coloredDamaged} points of damage were received.`,
        //         `${coloredAttackerName}'s attack direction was anticipated by ${coloredDefenderName}, resulting in only ${coloredDamaged} points of damage being received.`,
        //         `${coloredAttackerName}'s strike was evaded by ${coloredDefenderName}, but ${coloredDefenderName} still took ${coloredDamaged} points of damage.`,
        //         `${coloredAttackerName}'s blow was sidestepped by ${coloredDefenderName}, and only ${coloredDamaged} points of damage were sustained.`,
        //         `${coloredAttackerName}'s attack was dodged successfully by ${coloredDefenderName}, receiving just ${coloredDamaged} points of damage.`,
        //         `${coloredAttackerName}'s assault was quickly avoided by ${coloredDefenderName}, but ${coloredDefenderName} still incurred ${coloredDamaged} points of damage.`,
        //         `${coloredAttackerName}'s hit was skillfully dodged by ${coloredDefenderName}, resulting in only ${coloredDamaged} points of damage.`,
        //     ];
        //     let reportText = "";
        //     if (tempFightData.hp > 1) {
        //         reportText = normalText[Math.floor(Math.random() * normalText.length)];
        //     } else {
        //         reportText = littleText[Math.floor(Math.random() * littleText.length)];
        //     }
        //     this.battle_log.string += `<color=#0fffff><size=14>-------------------ROUND ${round}-------------------</size></color>\n` + reportText + "\n";
        //     round += 1;
        //     // if (tempFightData.attackerId == attackerData.uniqueId) {
        //     //     // attacker action
        //     //     defenderData.hp -= tempFightData.hp;
        //     // } else {
        //     //     attackerData.hp -= tempFightData.hp;
        //     //     // wait change
        //     // }
        //     // fightLogView.string += "output<br>";
        //     const logHeight: number = this.battle_log.node.getComponent(UITransform).height;
        //     this.battle_log.node.parent.getComponent(UITransform).height = logHeight;
        //     if (logHeight > this.node.getChildByPath("__ViewContent/ScrollView").getComponent(UITransform).height) {
        //         this.node.getChildByPath("__ViewContent/ScrollView").getComponent(ScrollView).scrollToBottom();
        //     }
        // }, 1000) as unknown as number;
    }

    public doAttack(item: Icombat_battle_reprot_item, delay: number) {
        const coloredAttackerName = this.getActorName(item.actionUniqueid, this.actors.get(item.actionUniqueid).name);
        const coloredDefenderName = this.getActorName(item.targetUniqueid, this.actors.get(item.targetUniqueid).name);
        const coloredDamaged = `<color=#0fffff>${item.attack.resultDamage}</color>`;
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
        this.battle_log.string +=  normalText[Math.floor(Math.random() * normalText.length)] +"\n";
    }

    public doTriggerEffect(item: Icombat_battle_reprot_item, delay: number) {
        console.log("doTriggerEffect:", item);
        const actorName = this.getActorName(item.actionUniqueid, this.actors.get(item.actionUniqueid).name);
        const targetName = this.getActorName(item.targetUniqueid, this.actors.get(item.targetUniqueid).name);
        const effectName = LanMgr.getLanById(NFTSkillEffectConfig.getById(item.effect.effectid).des);
        // console.log(item.targetUniqueid);
        switch(item.effect.type){
            case 0:
                this.battle_log.string += `${actorName} use skill ${effectName}.\n`;
                break;
            case 1:
                this.battle_log.string += `${targetName} get ${effectName} effect.\n`;
                break;
        }
    }

    public doSpirit(item: Icombat_battle_reprot_item, delay: number) {
        const actorName = LanMgr.getLanById(this.actors.get(item.targetUniqueid).name);
        const value = item.spirit.spiritChange;
        this.battle_log.string += `${actorName} get spirit ${value}.\n`;
    }

    public doRound(item: Icombat_battle_reprot_item, delay: number) {
        this.battle_log.string += `Round ${this.round}\n`;
        this.round +=1;
    }

    public doCombat(item: Icombat_battle_reprot_item, delay: number) {
        const actorName = this.getActorName(item.actionUniqueid, this.actors.get(item.actionUniqueid).name);
        const normalText = [
            `${actorName} reay for fight\n`,
            `${actorName} join the battle\n`,
            `${actorName} feel dangerous is closing\n`,
            `${actorName} senses an ominous presence lurking nearby.\n`,
            `${actorName} can feel the tension in the air, knowing something is not right.\n`,
            `${actorName} feels a chill as they realize the enemy is near.\n`,
            `${actorName} steels themselves for the fight ahead.\n`,
            `${actorName} prepares for an ambush, senses heightened.\n`,
            `${actorName} feels the ground shake as danger approaches.\n`,
            `${actorName} knows that battle is inevitable, and stand ready.\n`,
        ];
        this.battle_log.string +=  normalText[Math.floor(Math.random() * normalText.length)];
    }

    public doAction(item: Icombat_battle_reprot_item) {
        switch (item.actionType) {
            case Icombat_battle_action_type.attack:
                this.doAttack(item, 0);
                break;
            case Icombat_battle_action_type.spirit:
                this.doSpirit(item, 0);
                break;
            case Icombat_battle_action_type.triggereffect:
                this.doTriggerEffect(item, 0);
                break;
            case Icombat_battle_action_type.combatbegin:
                this.doCombat(item, 0);
                break;
            case Icombat_battle_action_type.roundbegin:
                this.doRound(item, 0);
                break;
        }
    }
    private getActorName(actorId: string, actorName: string): string {
        const [location, name] = actorId.split("|");
        if (location.includes("_")) {
            return `<b><color=#ff0000><size=20>${LanMgr.getLanById(actorName)}</size></color></b>`;
        } else {
            return `<b><color=#00ff00><size=20>${LanMgr.getLanById(actorName)}</size></color></b>`;
        }
        return "";
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
}
