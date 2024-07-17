import { _decorator, Component, Label, Node } from 'cc';
import ViewController from '../../BasicView/ViewController';
const { ccclass, property } = _decorator;

@ccclass('NewEventUI')
export class NewEventUI extends ViewController {
    private _selectContent: Node = null;
    private _selectItem: Node = null;

    public configuration() {
        const title = "";

        this.node.getChildByPath("__ViewContent/Title").getComponent(Label).string = title;

        
    }

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._selectContent = this.node.getChildByPath("__ViewContent/SelectContent");
        this._selectItem = this._selectContent.getChildByPath("Item");
        this._selectItem.removeFromParent();
    }

    protected viewPopAnimation(): boolean {
        return true;
    }

    protected contentView(): Node | null {
        return this.node.getChildByPath("__ViewContent");
    }
}


