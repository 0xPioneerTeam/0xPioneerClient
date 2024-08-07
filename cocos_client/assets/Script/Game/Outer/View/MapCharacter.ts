import { _decorator, Component} from "cc";

const { ccclass, property } = _decorator;

@ccclass("MapCharacter")
export class MapCharacter extends Component {
    public refreshUI(animType: string) {
        for (const child of this.node.getChildByPath("role").children) {
            child.active = child.name === animType;
        }
    }
}