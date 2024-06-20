import { _decorator, Component, Node, Vec2, Vec3, CCString, UITransform, Label, UIOpacity, Layout } from "cc";
import { LanMgr } from "../../../Utils/Global";
import { MapPioneerLogicType, MapPioneerActionType, MapPioneerMoveDirection, MapPioneerObject, MapPioneerType } from "../../../Const/PioneerDefine";
import { DataMgr } from "../../../Data/DataMgr";
import NotificationMgr from "../../../Basic/NotificationMgr";
import { NotificationName } from "../../../Const/Notification";

const { ccclass, property } = _decorator;

@ccclass("MapItemMonster")
export class MapItemMonster extends Component {
    private _model: MapPioneerObject = null;
    private _viewHeightMap: { [key: string]: number } = {
        monster_a_1: 170,
        monster_a_2: 170,
        monster_a_3: 170,
        monster_b_1: 240,
        monster_b_2: 240,
        monster_b_3: 240,
        monster_c_1: 220,
        monster_c_2: 220,
        monster_c_3: 220,
        monster_deathworm: 240,
        monster_dhs: 190,
        monster_sandspider: 190,
        monster_scorpion: 320,
        monster_spiderqueen: 340,
        monster_teshark: 240,
        monster_ths: 340,
    };

    public refreshUI(model: MapPioneerObject) {
        this._model = model;

        const infoView = this.node.getChildByPath("InfoView");

        infoView.getChildByPath("Gap").getComponent(UITransform).height = this._viewHeightMap[this._model.animType];
        infoView.getComponent(Layout).updateLayout();

        this._nameLabel.string = LanMgr.getLanById(model.name);
        infoView.getChildByPath("Content/Icon/Level").getComponent(Label).string = "Lv." + model.level;

        let moveCounting: boolean = false;
        // if (model.logics.length > 0) {
        //     const logic = model.logics[0];
        //     if (logic.type == MapPioneerLogicType.stepmove && logic.currentCd > 0) {
        //         moveCounting = true;
        //         this._moveCountLabel.string = "movecount:" + logic.currentCd + "s";
        //     }
        // }
        this._moveCountLabel.node.active = moveCounting;
        this._moveCountLabel.node.active = false;

        for (const child of this.node.getChildByPath("role").children) {
            child.active = child.name == model.animType;
            if (child.active) {
                this._currentShowMonster = child;
                child.getChildByPath("idle").active = model.actionType == MapPioneerActionType.idle;
                // view.getChildByPath("walk_left").active =
                //     model.actionType == MapPioneerActionType.moving && model.moveDirection == MapPioneerMoveDirection.left;
                // view.getChildByPath("walk_right").active =
                //     model.actionType == MapPioneerActionType.moving && model.moveDirection == MapPioneerMoveDirection.right;
                // view.getChildByPath("walk_top").active = model.actionType == MapPioneerActionType.moving && model.moveDirection == MapPioneerMoveDirection.top;
                // view.getChildByPath("walk_bottom").active =
                //     model.actionType == MapPioneerActionType.moving && model.moveDirection == MapPioneerMoveDirection.bottom;
            }
        }

        this.node.active = model.actionType != MapPioneerActionType.fighting;

        infoView.getChildByPath("Content/Icon/Difficult").active = model.type == MapPioneerType.hred && model.level > DataMgr.s.artifact.getArtifactLevel();
    }

    public shadowMode() {
        this.node.getComponent(UIOpacity).opacity = 100;
        for (const child of this.node.getChildByPath("role").children) {
            if (child.active) {
                this._currentShowMonster = child;
                child.getChildByPath("idle").active = true;
                child.getChildByPath("idle/Monster_Shadow").active = false;
                // view.getChildByPath("walk_left").active = false;
                // view.getChildByPath("walk_right").active = false;
                // view.getChildByPath("walk_top").active = false;
                // view.getChildByPath("walk_bottom").active = false;
            }
        }
        this._nameLabel.node.active = false;
        this._moveCountLabel.node.active = false;
    }

    private _nameLabel: Label = null;
    private _moveCountLabel: Label = null;
    private _currentShowMonster: Node = null;
    onLoad() {
        this._nameLabel = this.node.getChildByPath("InfoView/Content/name").getComponent(Label);
        this._moveCountLabel = this.node.getChildByPath("MoveCountLabel").getComponent(Label);

        NotificationMgr.addListener(NotificationName.ARTIFACT_EQUIP_DID_CHANGE, this._onArtifactEquipChange, this);
    }

    update(deltaTime: number) {}

    protected onDestroy(): void {
        NotificationMgr.removeListener(NotificationName.ARTIFACT_EQUIP_DID_CHANGE, this._onArtifactEquipChange, this);
    }

    //------------------------------------ notification
    private _onArtifactEquipChange() {
        if (this._model == null) {
            return;
        }
        this.refreshUI(this._model);
    }
}
