import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RedPointView')
export class RedPointView extends Component {
    private _redPoint: Node = null;
    private _value: Label = null;
    
    public refreshUI(value: number) {
        this._redPoint.active = value > 0;
        this._value.string = value > 99 ? "99+" : value.toString();
    }

    protected onLoad(): void {
        this._redPoint = this.node.getChildByPath("Bg");
        this._value = this._redPoint.getChildByPath("Value").getComponent(Label);
    }
}


