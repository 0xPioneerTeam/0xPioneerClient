import {
  _decorator,
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
} from "cc";
import { LanMgr, GameMgr } from "../../../Utils/Global";
import PioneerConfig from "../../../Config/PioneerConfig";
const { ccclass, property } = _decorator;

interface SpriteFrameMap {
  [key: string]: SpriteFrame; // 自定义字符串键与 SpriteFrame 值的映射
}
@ccclass("OuterFightView")
export class OuterFightView extends Component {
  @property(Material)
  private material: Material;

  @property(Prefab)
  private monster: Prefab;

  @property(Prefab)
  private pioneer: Prefab;

  public refreshUI(
    attacker: { name: string; hp: number; hpmax: number },
    defender: { name: string; hp: number; hpmax: number },
    attackerIsSelf: boolean
  ) {
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
    attakerView.getChildByName("name").getComponent(Label).string =
      LanMgr.getLanById(enemyInfo.name);
    attakerView
      .getChildByPath("Hp/progressBar")
      .getComponent(ProgressBar).progress = enemyInfo.hp / enemyInfo.hpmax;
    attakerView.getChildByPath("Hp/Value").getComponent(Label).string =
      enemyInfo.hp.toString();

    const defenderView = this.node.getChildByName("Self");
    defenderView.getChildByName("name").getComponent(Label).string =
      LanMgr.getLanById(selfInfo.name);
    defenderView
      .getChildByPath("Hp/progressBar")
      .getComponent(ProgressBar).progress = selfInfo.hp / selfInfo.hpmax;
    defenderView.getChildByPath("Hp/Value").getComponent(Label).string =
      selfInfo.hp.toString();
  }

  public attackAnim(
    attacker: { uniqueId: string; name: string; hp: number; hpmax: number },
    defender: { uniqueId: string; name: string; hp: number; hpmax: number },
    damage: number,
    attackerIsSelf: boolean = true
  ) {
    const enemyRole = this.node.getChildByPath("Enemy/Role");
    const selfRole = this.node.getChildByPath("Self/Role");
    // this.setSpritebyId(attacker.uniqueId);

    //设置怪物形象,取用idle动画
    const monsterName = this.getPrefabName(defender.uniqueId);
    const monsterInstance = instantiate(this.monster);
    monsterInstance.active = true;
    const monsterNode = monsterInstance.getChildByPath(
      `monster/${monsterName}/idle`
    );
    enemyRole.removeAllChildren();
    enemyRole.addChild(monsterNode);
    enemyRole.getChildByName("idle").active = true;

    //设置玩家形象,取用idle动画
    const pioneerName = this.getPrefabName(attacker.uniqueId);
    const pioneerInstance = instantiate(this.pioneer);
    pioneerInstance.active = true;
    const pioneerNode = pioneerInstance.getChildByPath(
      `pioneer/${pioneerName}/idle`
    );
    selfRole.removeAllChildren();
    selfRole.addChild(pioneerNode);
    selfRole.getChildByName("idle").active = true;

    const sprite = this.node
      .getChildByPath("Fight/Fight_a")
      .getComponent(Sprite);
    const defaultMaterial = sprite.getMaterial(0);

    if (attackerIsSelf) {
      const direct = 1;
      const damageText = this.node.getChildByPath("Enemy/Damage");
      damageText.getComponent(Label).string = "";
      tween()
        .target(selfRole)
        .to(0.5, { position: v3(100 * direct, -60, 0) })
        .to(0.1, { position: v3(-300 * direct, -60, 0) })
        .to(0.05, { position: v3(30 * direct, -60, 0) })
        .to(0.02, { position: v3(0 * direct, -60, 0) })
        .call(() => {
          this.refreshUI(
            {
              name: attacker.name,
              hp: attacker.hp,
              hpmax: attacker.hpmax,
            },
            {
              name: defender.name,
              hp: defender.hp,
              hpmax: defender.hpmax,
            },
            true
          );
        })
        .start();

      tween()
        .target(enemyRole)
        .delay(0.6)
        .call(() => {
          // sprite.setSharedMaterial(this.material, 0);
          this.changeMaterial(enemyRole, this.material);
        })
        .to(0.1, { position: v3(-50 * direct, -60, 0) })
        .to(0.1, { position: v3(0 * direct, -60, 0) })
        .call(() => {
          // sprite.setSharedMaterial(defaultMaterial, 0);
          this.changeMaterial(enemyRole, defaultMaterial);
        })
        .start();

      tween()
        .target(damageText)
        .delay(0.6)
        .call(() => {
          damageText.getComponent(Label).string = "-" + damage;
        })
        .to(0.01, { position: v3(0, 120, 0), opacity: 1 })
        .to(0.3, { position: v3(0, 200, 0), opacity: 0 })
        .call(() => {
          damageText.getComponent(Label).string = "";
        })
        .to(0.01, { position: v3(0, 120, 0) })
        .start();
    } else {
      const direct = -1;
      const damageText = this.node.getChildByPath("Self/Damage");
      damageText.getComponent(Label).string = "";
      tween()
        .target(enemyRole)
        .to(0.5, { position: v3(100 * direct, -60, 0) })
        .to(0.1, { position: v3(-300 * direct, -60, 0) })
        .to(0.05, { position: v3(30 * direct, -60, 0) })
        .to(0.02, { position: v3(0 * direct, -60, 0) })
        .call(() => {
          this.refreshUI(
            {
              name: attacker.name,
              hp: attacker.hp,
              hpmax: attacker.hpmax,
            },
            {
              name: defender.name,
              hp: defender.hp,
              hpmax: defender.hpmax,
            },
            true
          );
        })
        .start();

      tween()
        .target(selfRole)
        .delay(0.6)
        .call(() => {
          // sprite.setSharedMaterial(this.material, 0);
          this.changeMaterial(selfRole, this.material);
        })
        .to(0.1, { position: v3(-50 * direct, -60, 0) })
        .to(0.1, { position: v3(0 * direct, -60, 0) })
        .call(() => {
          // sprite.setSharedMaterial(defaultMaterial, 0);
          this.changeMaterial(selfRole, defaultMaterial);
        })
        .start();

      tween()
        .target(damageText)
        .delay(0.6)
        .call(() => {
          damageText.getComponent(Label).string = "-" + damage;
        })
        .to(0.01, { position: v3(0, 120, 0), opacity: 1 })
        .to(0.3, { position: v3(0, 200, 0), opacity: 0 })
        .call(() => {
          damageText.getComponent(Label).string = "";
        })
        .to(0.01, { position: v3(0, 120, 0) })
        .start();
    }
  }

  private getPrefabName(id: string) {
    const [location, name] = id.split("|");
    //location使用_分割的是地图上的怪物角色
    if (location.includes("_")) {
      const monster = PioneerConfig.getById(name);
      if (monster) {
        return monster.animType;
      } else {
        return "monster_a_1";
      }
    } else {
      const pioneer = PioneerConfig.getById(name);
      if (pioneer) {
        return pioneer.animType;
      } else {
        return "self";
      }
    }
  }

  private changeMaterial(actorNode: Node, newMaterial: Material) {
    // 获取 idle 节点
    const idleNode = actorNode.getChildByName("idle");

    if (idleNode) {
      // 遍历 idle 节点下的所有子节点
      idleNode.children.forEach((child) => {
        // 获取子节点的 Sprite 组件
        const sprite = child.getComponent(Sprite);
        if (sprite) {
          // 设置其材质为指定材质
          sprite.setSharedMaterial(newMaterial, 0);
        }
      });
    } else {
      console.error("idle node not found in actorNode.");
    }
  }

  private logChildNodeNames(parentNode: Node) {
    // 遍历子节点并输出名称
    console.log("----------------");
    parentNode.children.forEach((child) => {
      console.log(child.name); // 打印子节点的名称
    });
  }
  start() {}

  update(deltaTime: number) {}
}
