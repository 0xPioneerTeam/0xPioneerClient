import { _decorator, Component, Node } from 'cc';
import ViewController from '../../BasicView/ViewController';
import { ProgressBar, Label, Slider } from 'cc';
import { PlayerInfoItem } from '../View/PlayerInfoItem';
import GameMusicPlayMgr from '../../Manger/GameMusicPlayMgr';
import UIPanelManger from '../../Basic/UIPanelMgr';
const { ccclass, property } = _decorator;

@ccclass('ConfigureUnitTypesUI')
export class ConfigureUnitTypesUI extends ViewController {

    private _playerInfoItem: PlayerInfoItem = null;
    private _title: Label = null;
    private _totalTroop: Label = null;


    protected viewDidLoad(): void {
        super.viewDidLoad();
        

        this._playerInfoItem = this.node.getChildByPath("__ViewContent/PlayerInfoItem").getComponent(PlayerInfoItem);
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


