import { _decorator, Component, Label, Node, tween, v3 } from "cc";
import ViewController from "../../BasicView/ViewController";
import UIPanelManger, { UIPanelLayerType } from "../../Basic/UIPanelMgr";
import { LanMgr } from "../../Utils/Global";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";

const { ccclass, property } = _decorator;

@ccclass("AlterTipView")
export class AlterTipView extends ViewController {
    public showTip(tip: string) {
        this.node.getChildByPath("Content/Tip").getComponent(Label).string = tip;
    }

    protected viewDidLoad(): void {
        super.viewDidLoad();

        // this.node.getChildByPath("Content/Title").getComponent(Label).string = LanMgr.getLanById("lanreplace200001");
    }

    protected viewDidAppear(): void {
        super.viewDidAppear();
    }

    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByPath("Content");
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();
    }

    //-------------------------------- action
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node, UIPanelLayerType.HUD);
    }
}
