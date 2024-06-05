import { _decorator, Component, Label, Node, tween, v3 } from "cc";
import ViewController from "../BasicView/ViewController";
import { LanMgr } from "../Utils/Global";
import UIPanelManger from "../Basic/UIPanelMgr";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass('WorldTreasureTipUI')
export class WorldTreasureTipUI extends ViewController {
    protected viewDidLoad(): void {
        super.viewDidLoad();


        this.node.getChildByPath("Content/Tip").getComponent(Label).string = LanMgr.getLanById("106008");
    }

    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByPath("Content");
    }    

    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }
}