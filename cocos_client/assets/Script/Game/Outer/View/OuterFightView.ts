import {
    _decorator,
    Animation,
    Component,
    Label,
    Material,
    Node,
    ProgressBar,
    Sprite,
    tween,
    v3,
    assetManager,
    SpriteFrame,
    Prefab,
    instantiate,
    UIOpacity,
} from "cc";
import { LanMgr, GameMgr } from "../../../Utils/Global";
import PioneerConfig from "../../../Config/PioneerConfig";
import NFTSkillConfig from "../../../Config/NFTSkillConfig";
import NFTSkillEffectConfig from "../../../Config/NFTSkillEffectConfig";
import { MapFightObject } from "../../../Const/PioneerDefine";
import { Icombat_battle_action_type, Icombat_battle_reprot_item } from "../../../Const/CombatBattleReportDefine";

const { ccclass, property } = _decorator;

interface SpriteFrameMap {
    [key: string]: SpriteFrame;
}
@ccclass("OuterFightView")
export class OuterFightView extends Component {
    @property(Material)
    private readonly material: Material;
    @property(Material)
    private readonly normalMaterial: Material;
    @property(Prefab)
    private monster: Prefab;

    @property(Prefab)
    private pioneer: Prefab;

    //rightNode is always Enemy
    private _rightNode: Node = null;
    private _leftNode: Node = null;

    //leftNode is always Self
    private _rightId: string = null;
    private _leftId: string = null;

    private _attackInfo: MapFightObject = null;
    private _defenderInfo: MapFightObject = null;

    public refreshUI(attacker: MapFightObject, defender: MapFightObject, attackerIsSelf: boolean) {
        let selfInfo = null;
        let enemyInfo = null;
        if (attackerIsSelf) {
            selfInfo = attacker;
            enemyInfo = defender;
        } else {
            selfInfo = defender;
            enemyInfo = attacker;
        }

        const attakerView = this.node.getChildByName("Enemy");
        attakerView.getChildByName("name").getComponent(Label).string = LanMgr.getLanById(enemyInfo.name);
        attakerView.getChildByPath("Hp/progressBar").getComponent(ProgressBar).progress = enemyInfo.hp / enemyInfo.hpmax;
        attakerView.getChildByPath("Hp/Value").getComponent(Label).string = enemyInfo.hp.toString();

        const defenderView = this.node.getChildByName("Self");
        defenderView.getChildByName("name").getComponent(Label).string = LanMgr.getLanById(selfInfo.name);
        defenderView.getChildByPath("Hp/progressBar").getComponent(ProgressBar).progress = selfInfo.hp / selfInfo.hpmax;
        defenderView.getChildByPath("Hp/Value").getComponent(Label).string = selfInfo.hp.toString();
    }

    public attackAnim(attacker: MapFightObject, defender: MapFightObject, damage: number, attackerIsSelf: boolean = true) {
        const enemyRole = this.node.getChildByPath("Enemy/Role");
        const selfRole = this.node.getChildByPath("Self/Role");
        // this.setSpritebyId(attacker.uniqueId);

        //set monster idle animation
        const monsterName = defender.animType;
        const monsterInstance = instantiate(this.monster);
        monsterInstance.active = true;
        const monsterNode = monsterInstance.getChildByPath(`role/${monsterName}/idle`);
        enemyRole.removeAllChildren();
        enemyRole.addChild(monsterNode);
        enemyRole.getChildByName("idle").active = true;

        //set player idle animation
        const pioneerName = attacker.animType;
        const pioneerInstance = instantiate(this.pioneer);
        pioneerInstance.active = true;
        const pioneerNode = pioneerInstance.getChildByPath(`role/${pioneerName}/idle`);
        selfRole.removeAllChildren();
        selfRole.addChild(pioneerNode);
        selfRole.getChildByName("idle").active = true;

        //save the default material,so keep Fight_a in prefab
        const sprite = this.node.getChildByPath("Fight/Fight_a").getComponent(Sprite);
        const defaultMaterial = sprite.getMaterial(0);

        const animPlaySpeed: number = 0.6;
        if (attackerIsSelf) {
            const direct = 1;
            const damageText = this.node.getChildByPath("Enemy/Damage");
            damageText.getComponent(Label).string = "";
            tween()
                .target(selfRole)
                .to(0.5 * animPlaySpeed, { position: v3(100 * direct, -60, 0) })
                .to(0.1 * animPlaySpeed, { position: v3(-300 * direct, -60, 0) })
                .to(0.05 * animPlaySpeed, { position: v3(30 * direct, -60, 0) })
                .to(0.02 * animPlaySpeed, { position: v3(0 * direct, -60, 0) })
                .call(() => {
                    this.refreshUI(attacker, defender, true);
                })
                .start();

            tween()
                .target(enemyRole)
                .delay(0.6 * animPlaySpeed)
                .call(() => {
                    // sprite.setSharedMaterial(this.material, 0);
                    this.changeMaterial(enemyRole, this.material);
                })
                .to(0.1 * animPlaySpeed, { position: v3(-50 * direct, -60, 0) })
                .to(0.1 * animPlaySpeed, { position: v3(0 * direct, -60, 0) })
                .call(() => {
                    // sprite.setSharedMaterial(defaultMaterial, 0);
                    this.changeMaterial(enemyRole, defaultMaterial);
                })
                .start();

            tween()
                .target(damageText)
                .delay(0.6 * animPlaySpeed)
                .call(() => {
                    damageText.getComponent(Label).string = "-" + damage;
                })
                .to(0.01 * animPlaySpeed, { position: v3(0, 120, 0), opacity: 1 })
                .to(0.3 * animPlaySpeed, { position: v3(0, 200, 0), opacity: 0 })
                .call(() => {
                    damageText.getComponent(Label).string = "";
                })
                .to(0.01 * animPlaySpeed, { position: v3(0, 120, 0) })
                .start();
        } else {
            const direct = -1;
            const damageText = this.node.getChildByPath("Self/Damage");
            damageText.getComponent(Label).string = "";
            tween()
                .target(enemyRole)
                .to(0.5 * animPlaySpeed, { position: v3(100 * direct, -60, 0) })
                .to(0.1 * animPlaySpeed, { position: v3(-300 * direct, -60, 0) })
                .to(0.05 * animPlaySpeed, { position: v3(30 * direct, -60, 0) })
                .to(0.02 * animPlaySpeed, { position: v3(0 * direct, -60, 0) })
                .call(() => {
                    this.refreshUI(attacker, defender, true);
                })
                .start();

            tween()
                .target(selfRole)
                .delay(0.6 * animPlaySpeed)
                .call(() => {
                    // sprite.setSharedMaterial(this.material, 0);
                    this.changeMaterial(selfRole, this.material);
                })
                .to(0.1 * animPlaySpeed, { position: v3(-50 * direct, -60, 0) })
                .to(0.1 * animPlaySpeed, { position: v3(0 * direct, -60, 0) })
                .call(() => {
                    // sprite.setSharedMaterial(defaultMaterial, 0);
                    this.changeMaterial(selfRole, defaultMaterial);
                })
                .start();

            tween()
                .target(damageText)
                .delay(0.6 * animPlaySpeed)
                .call(() => {
                    damageText.getComponent(Label).string = "-" + damage;
                })
                .to(0.01 * animPlaySpeed, { position: v3(0, 120, 0), opacity: 1 })
                .to(0.3 * animPlaySpeed, { position: v3(0, 200, 0), opacity: 0 })
                .call(() => {
                    damageText.getComponent(Label).string = "";
                })
                .to(0.01 * animPlaySpeed, { position: v3(0, 120, 0) })
                .start();
        }
    }

    //input battle item fist line to match the order of the report
    public initRoles(item: Icombat_battle_reprot_item, attacker: MapFightObject, defender: MapFightObject) {
        this._attackInfo = attacker;
        this._defenderInfo = defender;
        this._rightId = attacker.uniqueId;
        this._leftId = defender.uniqueId;
        // this._rightNode = this.node.getChildByName("Self");
        // this._leftNode = this.node.getChildByName("Enemy");

        this._rightNode = this.node.getChildByName("Self");
        this._rightNode.getChildByName("name").getComponent(Label).string = LanMgr.getLanById(attacker.name);
        this._rightNode.getChildByPath("Hp/progressBar").getComponent(ProgressBar).progress = this._attackInfo.hp / this._attackInfo.hpmax;
        this._rightNode.getChildByPath("Hp/Value").getComponent(Label).string = this._attackInfo.hp.toString();
        this._rightNode.getChildByPath("Sprit/progressBar").getComponent(ProgressBar).progress = 0;

        this._leftNode = this.node.getChildByName("Enemy");
        this._leftNode.getChildByName("name").getComponent(Label).string = LanMgr.getLanById(defender.name);
        this._leftNode.getChildByPath("Hp/progressBar").getComponent(ProgressBar).progress = this._defenderInfo.hp / this._defenderInfo.hpmax;
        this._leftNode.getChildByPath("Hp/Value").getComponent(Label).string = this._defenderInfo.hp.toString();
        this._leftNode.getChildByPath("Sprit/progressBar").getComponent(ProgressBar).progress = 0;

        // this.setSpritebyId(attacker.uniqueId);
        //set player idle animation
        const selfRole = this.node.getChildByPath("Self/Role");
        const pioneerName = attacker.animType;
        const pioneerInstance = instantiate(this.pioneer);
        pioneerInstance.active = true;
        const pioneerNode = pioneerInstance.getChildByPath(`role/${pioneerName}/idle`);
        selfRole.removeAllChildren();
        selfRole.addChild(pioneerNode);
        selfRole.getChildByName("idle").active = true;

        //set monster idle animation
        const enemyRole = this.node.getChildByPath("Enemy/Role");
        const monsterName = defender.animType;
        const monsterInstance = instantiate(this.monster);
        monsterInstance.active = true;
        const monsterNode = monsterInstance.getChildByPath(`role/${monsterName}/idle`);
        enemyRole.removeAllChildren();
        enemyRole.addChild(monsterNode);
        enemyRole.getChildByName("idle").active = true;
        //save the default material,so keep Fight_a in prefab
        // const sprite = this.node.getChildByPath("Fight/Fight_a").getComponent(Sprite);
        // this.normalMaterial = sprite.getMaterial(0);
    }
    public async doAttack(item: Icombat_battle_reprot_item, delay: number) {
        const animPlaySpeed: number = 0.6;
        const damage: number = item.attack.resultDamage;
        let attackerIsSelf = item.actionUniqueid == this._rightId;
        const selfRole = this.node.getChildByPath("Self/Role");
        const enemyRole = this.node.getChildByPath("Enemy/Role");

        this.changeMaterial(selfRole, this.normalMaterial);
        if (attackerIsSelf) {
            const direct = 1;
            const damageText = this.node.getChildByPath("Enemy/Damage");
            damageText.getComponent(Label).string = "";
            tween()
                .target(selfRole)
                .to(0.5 * animPlaySpeed, { position: v3(100 * direct, -60, 0) })
                .to(0.1 * animPlaySpeed, { position: v3(-300 * direct, -60, 0) })
                .to(0.05 * animPlaySpeed, { position: v3(30 * direct, -60, 0) })
                .to(0.02 * animPlaySpeed, { position: v3(0 * direct, -60, 0) })
                .call(() => {
                    // this.refreshUI(attacker, defender, true);
                    let hpBar = this._leftNode.getChildByPath("Hp/progressBar").getComponent(ProgressBar);
                    console.log("attack:", item.attack.resultDamage);
                    hpBar.progress -= item.attack.resultDamage / this._attackInfo.hpmax;
                })
                .start();

            tween()
                .target(enemyRole)
                .delay(0.6 * animPlaySpeed)
                .call(() => {
                    // sprite.setSharedMaterial(this.material, 0);
                    this.changeMaterial(enemyRole, this.material);
                })
                .to(0.1 * animPlaySpeed, { position: v3(-50 * direct, -60, 0) })
                .to(0.1 * animPlaySpeed, { position: v3(0 * direct, -60, 0) })
                .call(() => {
                    // sprite.setSharedMaterial(defaultMaterial, 0);
                    console.log(this.normalMaterial);
                    this.changeMaterial(enemyRole, this.normalMaterial);
                })
                .start();

            tween()
                .target(damageText)
                .delay(0.6 * animPlaySpeed)
                .call(() => {
                    damageText.getComponent(Label).string = "-" + damage;
                })
                .to(0.01 * animPlaySpeed, { position: v3(0, 120, 0), opacity: 255 })
                .to(0.3 * animPlaySpeed, { position: v3(0, 200, 0), opacity: 0 })
                .call(() => {
                    damageText.getComponent(Label).string = "";
                })
                .to(0.01 * animPlaySpeed, { position: v3(0, 120, 0) })
                .start();
        } else {
            const direct = -1;
            const damageText = this.node.getChildByPath("Self/Damage");
            damageText.getComponent(Label).string = "";
            tween()
                .target(enemyRole)
                .to(0.5 * animPlaySpeed, { position: v3(100 * direct, -60, 0) })
                .to(0.1 * animPlaySpeed, { position: v3(-300 * direct, -60, 0) })
                .to(0.05 * animPlaySpeed, { position: v3(30 * direct, -60, 0) })
                .to(0.02 * animPlaySpeed, { position: v3(0 * direct, -60, 0) })
                .call(() => {
                    // this.refreshUI(attacker, defender, true);
                    let hpBar = this._rightNode.getChildByPath("Hp/progressBar").getComponent(ProgressBar);
                    hpBar.progress -= item.attack.resultDamage / this._attackInfo.hpmax;
                })
                .start();

            tween()
                .target(selfRole)
                .delay(0.6 * animPlaySpeed)
                .call(() => {
                    // sprite.setSharedMaterial(this.material, 0);
                    this.changeMaterial(selfRole, this.material);
                })
                .to(0.1 * animPlaySpeed, { position: v3(-50 * direct, -60, 0) })
                .to(0.1 * animPlaySpeed, { position: v3(0 * direct, -60, 0) })
                .call(() => {
                    // sprite.setSharedMaterial(defaultMaterial, 0);
                    this.changeMaterial(selfRole, this.normalMaterial);
                })
                .start();

            tween()
                .target(damageText)
                .delay(0.6 * animPlaySpeed)
                .call(() => {
                    damageText.getComponent(Label).string = "-" + damage;
                })
                .to(0.01 * animPlaySpeed, { position: v3(0, 120, 0), opacity: 255 })
                .to(0.3 * animPlaySpeed, { position: v3(0, 200, 0), opacity: 0 })
                .call(() => {
                    damageText.getComponent(Label).string = "";
                })
                .to(0.01 * animPlaySpeed, { position: v3(0, 120, 0) })
                .start();
        }
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                console.log("Attack action completed");
                resolve();
            }, delay); // 等待 1 秒后完成
        });
    }

    public async doTriggerEffect(item: Icombat_battle_reprot_item, delay: number) {
        console.log("doTriggerEffect:", item);
        const actorId = item.targetUniqueid;
        // console.log(item.targetUniqueid);
        const actorNode = actorId === this._rightId ? this._rightNode : this._leftNode;
        console.log(actorNode);
        const actorRole: Node = actorNode.getChildByPath("Role");
        const skillNode: Node = actorNode.getChildByPath("SkillName");
        const lightNode: Node = actorNode.getChildByPath("Light");
        const skillInfo = NFTSkillEffectConfig.getById(item.effect.effectid);
        switch (item.effect.type) {
            case 0:
                skillNode.getComponent(Label).string = LanMgr.getLanById(skillInfo.des);
                console.log(lightNode);
                lightNode.active = true;
                console.log(lightNode.getComponent(Animation));
                lightNode.getComponent(Animation).play();
                break;
            case 1:
                skillNode.getComponent(Label).string = LanMgr.getLanById(skillInfo.des);
                break;
        }
        tween(actorRole)
            .call(() => {
                actorRole.getComponent(UIOpacity).opacity = 255;
            })
            .to(0.3, { opacity: 0 })
            .call(() => {
                actorRole.getComponent(UIOpacity).opacity = 0;
            }) // Start by fading out and scaling up
            .delay(0.3)
            .call(() => {
                actorRole.getComponent(UIOpacity).opacity = 255;
            }) // Finally, scale back to original size
            .start();
        tween()
            .target(skillNode)
            .to(0.01, { opacity: 1, scale: v3(0.1, 0.1, 0.1) })
            .to(0.3, { scale: v3(1.5, 1.5, 1.5) })
            .to(0.3, { opacity: 1, scale: v3(0.5, 0.5, 0.5) })
            .to(0.2, { scale: v3(1.5, 1.5, 1.5) })
            .to(0.1, { opacity: 0, scale: v3(1, 1, 1) })
            .call(() => {
                lightNode.getComponent(Animation).stop();
                lightNode.active = false;
                skillNode.getComponent(Label).string = "";
            })
            .start();
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                console.log("Trigger effect action completed");
                resolve();
            }, delay); // 等待 1 秒后完成
        });
    }

    public async doSpirit(item: Icombat_battle_reprot_item, delay: number) {
        const actorId = item.targetUniqueid;
        const actorNode = actorId === this._rightId ? this._rightNode : this._leftNode;
        const value = item.spirit.spiritChange;
        const progressBar = actorNode.getChildByPath("Sprit/progressBar").getComponent(ProgressBar);
        switch (item.spirit.type) {
            //spirit round charge
            case 1:
                progressBar.progress += value / 100;
                break;
            //be attack
            case 2:
                progressBar.progress += value / 100;
                break;
            default:
                break;
        }
        if (progressBar.progress >= 0.5 && progressBar.progress < 1) {
            actorNode.getChildByPath("Ready").active = true;
            actorNode.getChildByPath("Ready").getComponent(Animation).play();
        } else {
            actorNode.getChildByPath("Ready").getComponent(Animation).stop();
            actorNode.getChildByPath("Ready").active = false;
        }
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                console.log("Spirit action completed");
                resolve();
            }, delay); // 等待 1 秒后完成
        });
    }
    public async doAction(item: Icombat_battle_reprot_item) {
        switch (item.actionType) {
            case Icombat_battle_action_type.attack:
                await this.doAttack(item, 800);
                break;
            case Icombat_battle_action_type.spirit:
                await this.doSpirit(item, 300);
                break;
            case Icombat_battle_action_type.triggereffect:
                await this.doTriggerEffect(item, 1000);
                break;
            case Icombat_battle_action_type.combatbegin:
                break;
            case Icombat_battle_action_type.roundbegin:
                break;
        }
    }

    private getPrefabName(id: string) {
        const [location, name] = id.split("|");
        //splite | for uniqueid, monster's location include _ like 0_0_1_0
        if (location.includes("_")) {
            const monster = PioneerConfig.getById(name);
            if (monster) {
                return `monster/${monster.animType}/idle`;
            } else {
                return "monster/monster_a_1/idle";
            }
        } else {
            const pioneer = PioneerConfig.getById(name);
            if (pioneer) {
                return `pioneer/${pioneer.animType}/idle`;
            } else {
                return "pioneer/self/idle";
            }
        }
    }

    private changeMaterial(actorNode: Node, newMaterial: Material) {
        const idleNode = actorNode.getChildByName("idle");

        if (idleNode) {
            // foreach every sprite of prefab
            idleNode.children.forEach((child) => {
                const sprite = child.getComponent(Sprite);
                if (sprite) {
                    //flash white the sprite
                    sprite.setSharedMaterial(newMaterial, 0);
                }
            });
        } else {
            console.error("idle node not found in actorNode.");
        }
    }

    private logChildNodeNames(parentNode: Node) {
        // log the child node
        console.log("----------------");
        parentNode.children.forEach((child) => {
            console.log(child.name);
        });
    }
    start() {}

    update(deltaTime: number) {}
}
