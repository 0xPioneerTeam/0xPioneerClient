import { Label } from 'cc';
import { _decorator, Component, Node } from 'cc';
import UIPanelManger from '../../Basic/UIPanelMgr';
import ViewController from '../../BasicView/ViewController';
import GameMusicPlayMgr from '../../Manger/GameMusicPlayMgr';
import { PlayerInfoItem } from '../View/PlayerInfoItem';
const { ccclass, property } = _decorator;

@ccclass('ExerciseUI')
export class ExerciseUI extends ViewController {
    private _title: Label = null;
    private _totalTroop: Label = null;


    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._title = this.node.getChildByPath("__ViewContent/_title").getComponent(Label);
    }

    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }

    private async onTapGenerate() {
        GameMusicPlayMgr.playTapButtonEffect();
        
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }
}


