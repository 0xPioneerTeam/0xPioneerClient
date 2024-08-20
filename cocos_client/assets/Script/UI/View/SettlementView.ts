import { _decorator, Component, instantiate, Label, Layout, Node, UITransform, Widget } from 'cc';
import { EvaluationMgr, LanMgr } from '../../Utils/Global';
import { DataMgr } from '../../Data/DataMgr';
const { ccclass, property } = _decorator;

@ccclass('SettlementView')
export class SettlementView extends Component {

    public refreshUI(beginLevel: number, endLevel: number) {
        const model = DataMgr.s.settlement.getObj(beginLevel, endLevel);
        this.node.getChildByPath("Level/Before").getComponent(Label).string = "C.Lv " + beginLevel;
        this.node.getChildByPath("Level/After").getComponent(Label).string = "C.Lv " + endLevel;

        const leftContent = this.node.getChildByPath("LeftContent/SettlementContent");
        const rightContent = this.node.getChildByPath("RightContent/SettlementContent");
        // kill
        if (model.killEnemies > 0) {
            // useLanMgr
            // leftContent.getChildByPath("KilledEnemies/Content/Title").getComponent(Label).string = LanMgr.getLanById("107549");
            leftContent.getChildByName("KilledEnemies").active = true;
            leftContent.getChildByPath("KilledEnemies/Value").getComponent(Label).string = model.killEnemies.toString();
        } else {
            leftContent.getChildByName("KilledEnemies").active = false;
        }
        // resources
        if (model.gainResources > 0) {
            // useLanMgr
            // leftContent.getChildByPath("GainedResources/Content/Title").getComponent(Label).string = LanMgr.getLanById("107549");
            leftContent.getChildByName("GainedResources").active = true;
            leftContent.getChildByPath("GainedResources/Value").getComponent(Label).string = model.gainResources.toString();
        } else {
            leftContent.getChildByName("GainedResources").active = false;
        }
        if (model.consumeResources > 0) {
            // useLanMgr
            // leftContent.getChildByPath("ConsumedResources/Content/Title").getComponent(Label).string = LanMgr.getLanById("107549");
            leftContent.getChildByName("ConsumedResources").active = true;
            leftContent.getChildByPath("ConsumedResources/Value").getComponent(Label).string = model.consumeResources.toString();
        } else {
            leftContent.getChildByName("ConsumedResources").active = false;
        }
        // troop
        if (model.gainTroops > 0 && false) {
            // useLanMgr
            // leftContent.getChildByPath("GainedTroops/Content/Title").getComponent(Label).string = LanMgr.getLanById("107549");
            leftContent.getChildByName("GainedTroops").active = true;
            leftContent.getChildByPath("GainedTroops/Value").getComponent(Label).string = model.gainTroops.toString();
        } else {
            leftContent.getChildByName("GainedTroops").active = false;
        }
        if (model.consumeTroops > 0 && false) {
            // useLanMgr
            // leftContent.getChildByPath("ConsumedTroops/Content/Title").getComponent(Label).string = LanMgr.getLanById("107549");
            leftContent.getChildByName("ConsumedTroops").active = true;
            leftContent.getChildByPath("ConsumedTroops/Value").getComponent(Label).string = model.consumeTroops.toString();
        } else {
            leftContent.getChildByName("ConsumedTroops").active = false;
        }
        // energy
        if (model.gainEnergy > 0) {
            // useLanMgr
            // leftContent.getChildByPath("GainedEnergy/Content/Title").getComponent(Label).string = LanMgr.getLanById("107549");
            leftContent.getChildByName("GainedEnergy").active = true;
            leftContent.getChildByPath("GainedEnergy/Value").getComponent(Label).string = model.gainEnergy.toString();
        } else {
            leftContent.getChildByName("GainedEnergy").active = false;
        }
        if (model.consumeEnergy > 0) {
            // useLanMgr
            // leftContent.getChildByPath("ConsumedEnergy/Content/Title").getComponent(Label).string = LanMgr.getLanById("107549");
            leftContent.getChildByName("ConsumedEnergy").active = true;
            leftContent.getChildByPath("ConsumedEnergy/Value").getComponent(Label).string = model.consumeEnergy.toString();
        } else {
            leftContent.getChildByName("ConsumedEnergy").active = false;
        }
        // event
        if (model.exploredEvents > 0) {
            // useLanMgr
            // leftContent.getChildByPath("ExploredEvents/Content/Title").getComponent(Label).string = LanMgr.getLanById("107549");
            leftContent.getChildByName("ExploredEvents").active = true;
            leftContent.getChildByPath("ExploredEvents/Value").getComponent(Label).string = model.exploredEvents.toString();
        } else {
            leftContent.getChildByName("ExploredEvents").active = false;
        }

        if (model.newPioneerIds.length > 0) {
            // useLanMgr
            // rightContent.getChildByPath("NewPioneer/Title").getComponent(Label).string = LanMgr.getLanById("107549");
            rightContent.getChildByName("NewPioneer").active = true;
            for (const pioneerId of model.newPioneerIds) {
                const item = instantiate(this._pioneerItem);
                item.active = true;
                item.setParent(this._pioneerItem.parent);
                item.getChildByName("secretGuard").active = pioneerId == "pioneer_1";
                item.getChildByName("rebels").active = pioneerId == "pioneer_3";
                item.getChildByName("doomsdayGangSpy").active = pioneerId == "pioneer_2";
            }
            this._pioneerItem.parent.getComponent(Layout).updateLayout();
        } else {
            rightContent.getChildByName("NewPioneer").active = false;
        }

        const evaluation = EvaluationMgr.getEvaluation(model.newPioneerIds.length, model.killEnemies, model.gainResources, model.exploredEvents);
        if (evaluation != null) {
            // useLanMgr
            // rightContent.getChildByPath("Evaluation/Title").getComponent(Label).string = LanMgr.getLanById("107549");
            rightContent.getChildByName("Evaluation").active = true;
            rightContent.getChildByPath("Evaluation/Value").getComponent(Label).string = LanMgr.getLanById(evaluation.title); 
        } else {
            rightContent.getChildByName("Evaluation").active = false;
        }
    }

    private _pioneerItem: Node = null;
    protected onLoad(): void {
        this._pioneerItem = this.node.getChildByPath("RightContent/SettlementContent/NewPioneer/Content/Item");
        this._pioneerItem.active = false;
    }

    start() {

    }

    update(deltaTime: number) {

    }
}


