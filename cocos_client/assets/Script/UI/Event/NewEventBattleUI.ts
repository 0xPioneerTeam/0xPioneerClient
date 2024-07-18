import { _decorator, Label, Node } from "cc";
import ViewController from "../../BasicView/ViewController";
import { LanMgr } from "../../Utils/Global";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import UIPanelManger, { UIPanelLayerType } from "../../Basic/UIPanelMgr";
import { HUDName } from "../../Const/ConstUIDefine";
import { AlterView } from "../View/AlterView";
import { NetworkMgr } from "../../Net/NetworkMgr";
import { MapBuildingObject } from "../../Const/MapBuilding";
import NewEventConfig from "../../Config/NewEventConfig";
import PioneerConfig from "../../Config/PioneerConfig";
const { ccclass, property } = _decorator;

@ccclass("NewEventBattleUI")
export class NewEventBattleUI extends ViewController {
    private _pioneerId: string = null;
    private _building: MapBuildingObject = null;
    private _selectIdx: number = -1;

    public configuration(pioneerId: string, building: MapBuildingObject, selectIdx: number, enemyId: string, hpRate: number) {
        this._pioneerId = pioneerId;
        this._building = building;
        this._selectIdx = selectIdx;

        const eventConfig = NewEventConfig.getById(building.eventId);
        const enemyConfig = PioneerConfig.getById(enemyId);

        if (this._pioneerId == null || this._building == null || this._selectIdx < 0 || eventConfig == null || enemyConfig == null) {
            UIPanelManger.inst.popPanel(this.node);
            return;
        }

        this.node.getChildByPath("__ViewContent/Title").getComponent(Label).string = building.eventIndex + "/" + eventConfig.sub_event.length;

        // monster
        const monterView = this.node.getChildByPath("__ViewContent/ImgBgScreen/EnemyInfo/Monster");
        for (const child of monterView.getChildByPath("role").children) {
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
        propertyView.getChildByPath("HP/Value").getComponent(Label).string = (Math.floor(enemyConfig.hp & hpRate)).toString();
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
        });
    }

    private async onTapBattle() {
        GameMusicPlayMgr.playTapButtonEffect();

        NetworkMgr.websocketMsg.player_event_select({
            buildingId: this._building.id,
            pioneerId: this._pioneerId,
            selectIdx: this._selectIdx,
        });

        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }
}
