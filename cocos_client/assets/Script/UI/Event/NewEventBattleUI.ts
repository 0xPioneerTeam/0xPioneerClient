import { _decorator, Label, Node } from "cc";
import ViewController from "../../BasicView/ViewController";
import { GameMgr, LanMgr } from "../../Utils/Global";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import UIPanelManger, { UIPanelLayerType } from "../../Basic/UIPanelMgr";
import { HUDName } from "../../Const/ConstUIDefine";
import { AlterView } from "../View/AlterView";
import { NetworkMgr } from "../../Net/NetworkMgr";
import { MapBuildingObject } from "../../Const/MapBuilding";
import NewEventConfig from "../../Config/NewEventConfig";
import PioneerConfig from "../../Config/PioneerConfig";
import NewSubEventConfig from "../../Config/NewSubEventConfig";
import { MapNewEventType, NewEventBehemothsParam } from "../../Const/NewEventDefine";
const { ccclass, property } = _decorator;

@ccclass("NewEventBattleUI")
export class NewEventBattleUI extends ViewController {
    private _pioneerUniqueId: string = null;
    private _building: MapBuildingObject = null;
    private _selectIdx: number = -1;

    public configuration(uniqueId: string, building: MapBuildingObject) {
        this._pioneerUniqueId = uniqueId;
        this._building = building;
        this._selectIdx = GameMgr.lastEventSelectFightIdx;
        GameMgr.lastEventSelectFightIdx = -1;

        const eventConfig = NewEventConfig.getById(building.eventId);
        const subEventConfig = NewSubEventConfig.getById(building.eventSubId);
        const enemyConfig = PioneerConfig.getById(building.eventWaitFightEnemyId);

        if (this._pioneerUniqueId == null || this._building == null || this._selectIdx < 0 || eventConfig == null || subEventConfig == null || enemyConfig == null || this._selectIdx == -1) {
            UIPanelManger.inst.popPanel(this.node);
            return;
        }

        let hpRate: number = 1;
        const type = subEventConfig.type[0];
        if (type == MapNewEventType.BehemothsBattle) {
            const params = subEventConfig.type as NewEventBehemothsParam;
            if (this._selectIdx == 0) {
                hpRate = params[6] * 0.01;
            } else if (this._selectIdx == 1) {
                hpRate = params[3] * 0.01;
            }
        }

        this.node.getChildByPath("__ViewContent/Title").getComponent(Label).string = (building.eventIndex + 1) + "/" + eventConfig.sub_event.length;

        // monster
        const monterView = this.node.getChildByPath("__ViewContent/ImgBgScreen/EnemyInfo");
        for (const child of monterView.getChildByPath("Monster/role").children) {
            child.active = child.name == enemyConfig.animType;
            if (child.active) {
                child.getChildByPath("idle").active = true;
            }
        }
        monterView.getChildByPath("Name").getComponent(Label).string = LanMgr.getLanById(enemyConfig.name);

        //property
        const propertyView = this.node.getChildByPath("__ViewContent/ImgBgScreen/Property");
        propertyView.getChildByPath("ATK/Value").getComponent(Label).string = enemyConfig.attack.toString();
        propertyView.getChildByPath("DEF/Value").getComponent(Label).string = enemyConfig.def.toString();
        propertyView.getChildByPath("HP/Value").getComponent(Label).string = (Math.floor(enemyConfig.hp * hpRate)).toString();
    }

    protected viewDidLoad(): void {
        super.viewDidLoad();
    }

    protected viewPopAnimation(): boolean {
        return true;
    }

    protected contentView(): Node | null {
        return this.node.getChildByPath("__ViewContent");
    }

    //-------------------------------
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();

        const result = await UIPanelManger.inst.pushPanel(HUDName.Alter, UIPanelLayerType.HUD);
        if (!result.success) {
            return;
        }
        result.node.getComponent(AlterView).showTip("Are you sure to exit this event?", async () => {
            await this.playExitAnimation();
            UIPanelManger.inst.popPanel(this.node);

            NetworkMgr.websocketMsg.player_event_exit({
                buildingId: this._building.uniqueId,
                pioneerId: this._pioneerUniqueId,
            });
        });
    }

    private async onTapBattle() {
        GameMusicPlayMgr.playTapButtonEffect();

        NetworkMgr.websocketMsg.player_event_select({
            buildingId: this._building.uniqueId,
            pioneerId: this._pioneerUniqueId,
            selectIdx: this._selectIdx,
        });

        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }
}
