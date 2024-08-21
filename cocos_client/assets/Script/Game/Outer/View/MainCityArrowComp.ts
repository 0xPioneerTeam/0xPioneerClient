import { _decorator, Component, Node, UITransform, v2, Vec2} from "cc";
import { DataMgr } from "../../../Data/DataMgr";
import GameMainHelper from "../../Helper/GameMainHelper";
import { Button } from "cc";

const { ccclass, property } = _decorator;

@ccclass("MainCityArrowComp")
export class MainCityArrowComp extends Component {

    @property(Node)
    arrowNode: Node = null;

    protected start(): void {
        GameMainHelper.instance.bindCityArrowComp = this;
    }

    calcMainCityArrowNode(cameraPos:Vec2){
        const mainCity = DataMgr.s.mapBuilding.getBuildingById(DataMgr.s.mapBuilding.getSelfMainCitySlotId() + "|building_1");
        if (mainCity == null || mainCity.stayMapPositions.length != 7) {
            return;
        }
        const currentWorldPos = GameMainHelper.instance.tiledMapGetPosPixel(mainCity.stayMapPositions[3].x, mainCity.stayMapPositions[3].y);
        const cityPos = v2(currentWorldPos.x, currentWorldPos.y);
        if(Vec2.distance(cameraPos,cityPos) > 2000){
            this.arrowNode.active = true;
            this.arrowNode.getComponent(Button).enabled = true;
            this.arrowNode.getComponent(Button).interactable = true;
            let angle = Math.atan2(cityPos.y - cameraPos.y,cityPos.x - cameraPos.x);
            let angleV = angle * 180 / Math.PI;
            let arrowAngle = angleV+90;
            this.arrowNode.angle = arrowAngle;
            let size = this.node.getComponent(UITransform).contentSize;
            let arrx,arry,arrowValue = 0;
            if(-45 <= arrowAngle && arrowAngle <= 45){
                arrowValue = arrowAngle*Math.PI/180;
                arrx = Math.tan(arrowValue) * size.width/2;
                arry = -size.height/2;
            }else if(45 <= arrowAngle && arrowAngle <= 135){
                arrowValue = (arrowAngle-90)*Math.PI/180;
                arrx = size.width/2;
                arry = Math.tan(arrowValue) * size.height/2;
            }else if(135 <= arrowAngle && arrowAngle <= 225){
                arrowValue = (arrowAngle-180)*Math.PI/180;
                arrx = -Math.tan(arrowValue) * size.width/2;
                arry = size.height/2;
            }else{//arrowAngle > 225 || arrowAngle < -45
                arrowAngle = arrowAngle<0?arrowAngle+360:arrowAngle;
                arrowValue = (arrowAngle-270)*Math.PI/180;
                arrx = -size.width/2;
                arry = -Math.tan(arrowValue) * size.height/2;
            }
            this.arrowNode.setPosition(arrx,arry);
        }else{
            this.arrowNode.active = false;
        }
    }

    onClickBlackCityBtn(){
        const mainCity = DataMgr.s.mapBuilding.getBuildingById(DataMgr.s.mapBuilding.getSelfMainCitySlotId() + "|building_1");
        if (mainCity == null || mainCity.stayMapPositions.length != 7) {
            return;
        }
        const currentWorldPos = GameMainHelper.instance.tiledMapGetPosWorld(mainCity.stayMapPositions[3].x, mainCity.stayMapPositions[3].y);
        GameMainHelper.instance.changeGameCameraWorldPosition(currentWorldPos, true);
    }
}