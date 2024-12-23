import { _decorator, Component, Node,Label,Sprite,SpriteFrame, UIOpacity } from 'cc';
import { WarOrderConfigData } from '../../Const/WarOrderDefine';
import { BackpackItem } from '../BackpackItem';
import ItemData from "../../Const/item";
const { ccclass, property } = _decorator;

@ccclass('WarOrderItem')
export class WarOrderItem extends Component {
    @property(Node)
    private basicReward: Node = null;
    @property(Node)
    private premiumReward: Node = null;
    @property(Label)
    private title: Label = null;

    start() {

    }
    refreshUI(data:WarOrderConfigData,freeRewardIds:string="",highRewardIds:string="",unLock:boolean=false) {
        this.title.string = data.id;
        if(data.freererward){
            this.basicReward.active = true;
            this.basicReward.getComponent(UIOpacity).opacity = 255;
            this.basicReward.getComponent(BackpackItem).refreshUI(new ItemData(data.freererward[0],data.freererward[1]));
            if(data.id<=parseInt(freeRewardIds)){
                this.basicReward.getComponent(BackpackItem).grayColor();
                this.basicReward.getChildByName("Get").active = true;
            }
        }
        else{
            this.basicReward.active = true;
            this.basicReward.getComponent(UIOpacity).opacity = 0;
            this.basicReward.getChildByName("Get").active = false;
        }
        if(data.highrward){
            this.premiumReward.active = true;
            this.premiumReward.getComponent(UIOpacity).opacity = 255;
            this.premiumReward.getComponent(BackpackItem).refreshUI(new ItemData(data.highrward[0],data.highrward[1]));
            if(data.id<=parseInt(highRewardIds)){
                this.premiumReward.getComponent(BackpackItem).grayColor();
                this.premiumReward.getChildByName("Get").active = true;
            }
            if(!unLock){
                this.premiumReward.getComponent(BackpackItem).grayColor();
            }
        }
        else{
            this.premiumReward.active = true;
            this.premiumReward.getComponent(UIOpacity).opacity = 0;
            this.premiumReward.getChildByName("Get").active = false;
        }
    }
}
