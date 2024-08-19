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

    private _timeLabel: Label = null;
    private _resourceItem:Node = null;
    private _resourceContent:Node;
    private _current_res_cur:Label;
    private _current_res_max:Label;

    private _list_Content:Node;
    private _exerciseItem:Node;

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._title = this.node.getChildByPath("__ViewContent/_title").getComponent(Label);
        const contentView = this.node.getChildByPath("__ViewContent");
        this._resourceContent = contentView.getChildByPath("footer/material");
        this._resourceItem = this._resourceContent.getChildByPath("Item");
        this._resourceItem.removeFromParent();
        this._timeLabel = contentView.getChildByPath("footer/txt_timeVal").getComponent(Label);

        this._current_res_cur = contentView.getChildByPath("current_res/num/cur").getComponent(Label);
        this._current_res_max = contentView.getChildByPath("current_res/num/max").getComponent(Label);

        this._list_Content = contentView.getChildByPath("ScrollView/View/Content");
        this._exerciseItem = this._list_Content.getChildByPath("ExercoseItem");
        this._list_Content.removeAllChildren();
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


