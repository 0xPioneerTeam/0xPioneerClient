import { _decorator, Component, Label, Node, tween, v3 } from "cc";
import ViewController from "../../BasicView/ViewController";
import UIPanelManger, { UIPanelLayerType } from "../../Basic/UIPanelMgr";
import { LanMgr } from "../../Utils/Global";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";

const { ccclass, property } = _decorator;

@ccclass('AlterView')
export class AlterView extends ViewController {

    public showTip(tip: string, confirmCallback: ()=> void = null, cancelCallback: ()=> void = null) {
        // useLanMgr
        // this.node.getChildByPath("Content/Title").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("Content/ConfrimButton/Label").getComponent(Label).string = LanMgr.getLanById("107549");
        // this.node.getChildByPath("Content/CancelButton/Label").getComponent(Label).string = LanMgr.getLanById("107549");

        
        this.node.getChildByPath("Content/Tip").getComponent(Label).string = tip;
        this._confirmCallback = confirmCallback;
        this._cancelCallback = cancelCallback;
    }

    private _confirmCallback: ()=> void = null;
    private _cancelCallback: ()=> void = null;
    protected viewDidLoad(): void {
        super.viewDidLoad();
    }

    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByPath("Content");
    }


    //-------------------------------- action
    private async onTapConfrim() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node, UIPanelLayerType.HUD);
        if (this._confirmCallback != null) {
            this._confirmCallback();
        }
    }

    private async onTapCancel() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node, UIPanelLayerType.HUD);
        if (this._cancelCallback != null) {
            this._cancelCallback();
        }
    }
}