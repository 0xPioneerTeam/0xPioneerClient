import { _decorator, Component, Label, Node } from 'cc';
import NotificationMgr from '../../Basic/NotificationMgr';
import { NotificationName } from '../../Const/Notification';
import { GameMgr } from '../../Utils/Global';
const { ccclass, property } = _decorator;

@ccclass('RedPointView')
export class RedPointView extends Component {
    private _pointValue: number = 0;
    private _showNum: boolean = true;

    private _redPoint: Node = null;
    private _value: Label = null;
    
    public refreshUI(value: number, showNum: boolean = true) {
        this._pointValue = value;
        this._showNum = showNum;

        if (GameMgr.showRedPoint) {
            this._redPoint.active = value > 0;
        } else {
            this._redPoint.active = false;
        }
        this._value.node.active = showNum;
        this._value.string = value > 99 ? "99+" : value.toString();
    }

    protected onLoad(): void {
        this._redPoint = this.node.getChildByPath("Bg");
        this._value = this._redPoint.getChildByPath("Value").getComponent(Label);
    }

    protected start(): void {
        NotificationMgr.addListener(NotificationName.GAME_SETTING_REDPOINT_SHOW_CHANGED, this._redPointShowChanged, this);
    }
    
    protected onDestroy(): void {
        NotificationMgr.removeListener(NotificationName.GAME_SETTING_REDPOINT_SHOW_CHANGED, this._redPointShowChanged, this);
    }
    


    private _redPointShowChanged() {
        this.refreshUI(this._pointValue, this._showNum);
    }
}


