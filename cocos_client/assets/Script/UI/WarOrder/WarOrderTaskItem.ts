import { _decorator, Component, Node, Label, Button, Sprite, SpriteFrame } from "cc";
import { GameMgr, LanMgr, ResourcesMgr } from "../../Utils/Global";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import { WarOrderTaskConfigData } from "../../Const/WarOrderDefine";
const { ccclass, property } = _decorator;

@ccclass("WarOrderTaskItem")
export class WarOrderTaskItem extends Component {
    @property(Label)
    private type: Label = null;
    @property(Label)
    private progress: Label = null;
    @property(Label)
    private desc: Label = null;
    @property(Label)
    private exp: Label = null;
    @property(Button)
    private btn: Button = null;
    @property(SpriteFrame)
    private btn_enable: SpriteFrame = null;
    @property(SpriteFrame)
    private btn_disable: SpriteFrame = null;
    @property(Sprite)
    private finished: Sprite = null;
    @property([SpriteFrame])
    private type_bg: SpriteFrame[] = [];
    private type_name: string[] = ["Daily", "Weekly", "Season"];
    private task_data: WarOrderTaskConfigData;
    start() {}
    refreshUI(data: WarOrderTaskConfigData) {
        this.task_data = data;
        this.node.getChildByPath("type").getComponent(Sprite).spriteFrame = this.type_bg[data.type[0] - 1];
        this.type.string = this.type_name[data.type[0] - 1];
        this.desc.string = LanMgr.getLanById(data.description) || "No description";
        this.exp.string = data.exp[0].toString();
        this.progress.string = `${data.value ?? 0}/${data.total ?? 0}`;
        switch (data.finished) {
            //todo
            case 0:
                this.btn.node.active = true;
                this.finished.node.active = false;
                this.btn.getComponent(Sprite).spriteFrame = this.btn_disable;
                break;
            //rewarded
            case 1:
                this.btn.node.active = false;
                this.finished.node.active = true;
                this.btn.getComponent(Sprite).spriteFrame = this.btn_disable;
                break;
        }
    }
    onTapClaim() {
        switch (this.task_data.finished) {
            case 0:
                GameMusicPlayMgr.playTapButtonEffect();
                break;
            case 1:
                GameMusicPlayMgr.playTapButtonEffect();
                //TODO: claim task exp
                break;
        }
    }
}