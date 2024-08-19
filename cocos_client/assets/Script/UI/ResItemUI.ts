import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ResItemUI')
export class ResItemUI extends Component {
    refreshUI(data: [string, number]) {
        for (const child of this.node.getChildByPath("icon").children) {
            if (child.name == data[0]) {
                child.active = true;
            } else {
                child.active = false;
            }
        }
        this.node.getChildByPath("count").getComponent(Label).string = data[1].toString();
    }
}


