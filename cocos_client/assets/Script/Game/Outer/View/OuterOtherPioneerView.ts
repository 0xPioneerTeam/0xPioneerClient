import {
    _decorator,
    Component,
    Node,
    Animation,
    Vec2,
    Vec3,
    CCInteger,
    CCFloat,
    TweenAction,
    tween,
    Graphics,
    Color,
    instantiate,
    Sprite,
    Quat,
    UITransform,
    misc,
    Label,
    ProgressBar,
    log,
    v3,
} from "cc";
import { LanMgr } from "../../../Utils/Global";
import { MapMemberFactionType } from "../../../Const/ConstDefine";
import { MapPioneerActionType, MapPioneerMoveDirection, MapPioneerObject, MapPioneerType } from "../../../Const/PioneerDefine";
import { DataMgr } from "../../../Data/DataMgr";

const { ccclass, property } = _decorator;

@ccclass("OuterOtherPioneerView")
export class OuterOtherPioneerView extends Component {
    public refreshUI(pioneer: MapPioneerObject) {
        // name
        let name = "";
        if (LanMgr.getLanById(pioneer.name).indexOf("LanguageErr") != -1) {
            name = pioneer.name;
        } else {
            name = LanMgr.getLanById(pioneer.name);
        }
        this.node.getChildByPath("name").getComponent(Label).string = name;
        // role
        for (const name of this._roleNames) {
            const view = this.node.getChildByPath("role/" + name);
            view.active = name === pioneer.animType;
            if (view.active) {
                const wLeft = view.getChildByPath("walk_left");
                const wRight = view.getChildByPath("walk_right");
                const wTop = view.getChildByPath("walk_top");
                const wBottom = view.getChildByPath("walk_bottom");
                if (pioneer.actionType == MapPioneerActionType.idle) {
                    view.getChildByPath("idle").active = true;

                    if (wLeft != null) {
                        wLeft.active = false;
                    }
                    if (wRight != null) {
                        wRight.active = false;
                    }
                    if (wTop != null) {
                        wTop.active = false;
                    }
                    if (wBottom != null) {
                        wBottom.active = false;
                    }
                } else if (pioneer.actionType == MapPioneerActionType.moving) {
                    view.getChildByPath("idle").active = false;
                    if (wLeft != null) {
                        wLeft.active = pioneer.moveDirection == MapPioneerMoveDirection.left;
                    }
                    if (wRight != null) {
                        wRight.active = pioneer.moveDirection == MapPioneerMoveDirection.right;
                    }
                    if (wTop != null) {
                        wTop.active = pioneer.moveDirection == MapPioneerMoveDirection.top;
                    }
                    if (wBottom != null) {
                        wBottom.active = pioneer.moveDirection == MapPioneerMoveDirection.bottom;
                    }
                }
            }
        }
        // friendly
        const statusView = this.node.getChildByPath("StatusView");
        statusView.active = false;
        if (pioneer.faction == MapMemberFactionType.enemy) {
            statusView.active = true;
            // useLanMgr
            // statusView.getChildByName("Text").getComponent(Label).string = LanMgr.getLanById("201001");
            statusView.getChildByPath("Text").getComponent(Label).string = "Battle";
            statusView.getChildByPath("Icon/Battle").active = true;
            statusView.getChildByPath("Icon/Search").active = false;
            statusView.getChildByName("Level").getComponent(Label).string = "Lv." + pioneer.level;
        } else if (pioneer.type == MapPioneerType.gangster && pioneer.faction == MapMemberFactionType.friend) {
            statusView.active = true;
            // useLanMgr
            // statusView.getChildByName("Text").getComponent(Label).string = LanMgr.getLanById("201001");
            statusView.getChildByPath("Text").getComponent(Label).string = "Search";
            statusView.getChildByPath("Icon/Battle").active = false;
            statusView.getChildByPath("Icon/Search").active = true;
            statusView.getChildByName("Level").getComponent(Label).string = "Lv." + pioneer.level;
        }

        // taskhide
        const canTalkData = DataMgr.s.task.getCanTalkData();
        this._hasTaskView.active = canTalkData[pioneer.id] != undefined;

        this.node.active = pioneer.actionType != MapPioneerActionType.fighting;

        const rookieSizeView = this.node.getChildByPath("role/RookieSizeView");
        if (pioneer.type == MapPioneerType.npc) {
            rookieSizeView.position = v3(0, 11.7, 0);
            rookieSizeView.getComponent(UITransform).setContentSize(90, 110);
        } else if (pioneer.type == MapPioneerType.gangster) {
            rookieSizeView.position = v3(-4, 31, 0);
            rookieSizeView.getComponent(UITransform).setContentSize(120, 150);
        }
    }

    private _hasTaskView: Node = null;
    private _playerChattingView: Node = null;
    private _taskPreparingView: Node = null;
    private _timeCountLabel: Label = null;

    private _roleNames: string[] = [
        "artisan",
        "doomsdayGangBigTeam",
        "doomsdayGangSpy",
        "doomsdayGangTeam",
        "hunter",
        "prophetess",
        "rebels",
        "secretGuard",
        "chief",
        "rabbit",
        "doc",
        "marauder",
    ];
    onLoad() {
        this._hasTaskView = this.node.getChildByPath("task_status/talkbubble");
        this._playerChattingView = this.node.getChildByPath("task_status/chatting");
        this._taskPreparingView = this.node.getChildByPath("task_status/prepare_task");
        this._timeCountLabel = this.node.getChildByPath("task_status/task_hide_count").getComponent(Label);

        this._hasTaskView.active = false;
        this._playerChattingView.active = false;
        this._taskPreparingView.active = false;
        this._timeCountLabel.node.active = false;
    }

    start() {}

    update(deltaTime: number) {}
}
