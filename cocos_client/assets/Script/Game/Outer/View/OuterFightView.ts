import { _decorator, Component, Label, Material, Node, ProgressBar, Sprite, tween, v3, assetManager, SpriteFrame, Prefab, instantiate } from "cc";
import { LanMgr, GameMgr } from "../../../Utils/Global";
import PioneerConfig from "../../../Config/PioneerConfig";
import { MapFightObject } from "../../../Const/PioneerDefine";
const { ccclass, property } = _decorator;

interface SpriteFrameMap {
    [key: string]: SpriteFrame;
}
@ccclass("OuterFightView")
export class OuterFightView extends Component {
    @property(Material)
    private material: Material;

    @property(Prefab)
    private monster: Prefab;

    @property(Prefab)
    private pioneer: Prefab;

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
