import { _decorator, Component} from "cc";
const { ccclass, property } = _decorator;

@ccclass("OuterRebonAndDestroyView")
export class OuterRebonAndDestroyView extends Component {
    /**
     * 0-destroy 1-pioneer rebon   2- building rebon
     * @param type 
     */
    public playAnim(type: number) {
        const destroyAnim = this.node.getChildByPath("Content/DestroyAnim");
        const pioneerAnim = this.node.getChildByPath("Content/PioneerRebonAnim");
        const buildingAnim = this.node.getChildByPath("Content/BuildingRebonAnim");

        destroyAnim.active = false;
        pioneerAnim.active = false;
        buildingAnim.active = false;

        if (type == 0) {
            destroyAnim.active = true;
            this.scheduleOnce(()=> {
                this.node.destroy();
            }, 20);
        } else if (type == 1) {
            pioneerAnim.active = true;
            this.scheduleOnce(()=> {
                this.node.destroy();
            }, 2.5);
        } else if (type == 2) {
            buildingAnim.active = true;
            this.scheduleOnce(()=> {
                this.node.destroy();
            }, 2.5);
        }
    }

    protected onLoad(): void {
       
    }

    start() {}

    // update(deltaTime: number) {
    //     const currentTime: number = new Date().getTime();
    //     if (currentTime < this._rebonTime && (this._rebonTime - currentTime) / 1000 <= 15) {
    //         this.node.getChildByPath("Content").active = true;
    //         this.node.getChildByPath("Content/BuildingAnim").active = this._isBuilding;
    //         this.node.getChildByPath("Content/PioneerAnim").active = !this._isBuilding;
    //     } else {
    //         this.node.getChildByPath("Content").active = false;
    //     }
    // }
}
