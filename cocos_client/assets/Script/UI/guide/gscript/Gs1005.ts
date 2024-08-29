import { view, UITransform, Button, find, EventHandler, Event, EventTouch, NodeEventType } from "cc";
import NotificationMgr from "../../../Basic/NotificationMgr";
import { NotificationName } from "../../../Const/Notification";
import GameMainHelper from "../../../Game/Helper/GameMainHelper";
import RookieStepMgr from "../../../Manger/RookieStepMgr";
import { GsBase } from "./GsBase";
import GameMusicPlayMgr from "../../../Manger/GameMusicPlayMgr";
import { InnerBuildingType, MapBuildingType } from "../../../Const/BuildingDefine";
import { DataMgr } from "../../../Data/DataMgr";
import { TileMapHelper } from "../../../Game/TiledMap/TileTool";
import { UIHUDController } from "../../UIHUDController";
import { LanMgr } from "../../../Utils/Global";
import { OuterBuildingView } from "../../../Game/Outer/View/OuterBuildingView";
import { MapBuildingObject } from "../../../Const/MapBuilding";


export class Gs1005 extends GsBase{

    private _buildData:MapBuildingObject = null;
    private _resBuilding:OuterBuildingView = null;
    gsStart() {
        super.gsStart();
    }

    protected update(dt: number): void {
        let isGameShowOuter = GameMainHelper.instance.isGameShowOuter;
        if(!isGameShowOuter)
        {
            this._guide_step = 1;
            return;
        }
        if(!this._shadowController){
            this.initBinding();
            return;
        }
        if(!this._resBuilding){
            let buildInfo = this._findResourceBuilding();
            if(buildInfo){
                this._buildData = buildInfo;
                this._resBuilding = this._buildingController.getBuildingView(buildInfo.uniqueId);
            }
        }
        if(this._resBuilding){
            if(!this._resBuilding.node){
                this._resBuilding = null;
                return;
            }
            let ExploreView = this._resBuilding.node.getChildByPath("ExploreView")
            if(ExploreView.active){
                //collecting
                this._guide_step = -1;
                return;
            }
            let actionView = this._tileMapController.actionView;
            if(!actionView.node.active){
                this._guide_step = 2;
                return;
            }
            if(actionView.interactBuilding != this._buildData){
                actionView.node.active = false;
                //worning
                UIHUDController.showCenterTip(LanMgr.getLanById("1"));
                return;
            }else{
                this._guide_step = 3;
            }
        }
    }

    _findResourceBuilding(){
        let citySlot = DataMgr.s.mapBuilding.getSelfMainCitySlotId();
        let buildingData = DataMgr.s.mapBuilding.getObj_building();
        let resBds = buildingData.filter(building=>{
            if(building.type != MapBuildingType.resource){
                return false;
            }
            if(building.uniqueId.split("|")[0] != citySlot){
                return false;
            }
            if(this._shadowController.tiledMapIsAllBlackShadow(building.stayMapPositions[0].x,building.stayMapPositions[0].y)){
                return false;
            }
            return true;
        });
        const mainCity = DataMgr.s.mapBuilding.getSelfMainCityBuilding();
        let cityPos = TileMapHelper.INS.getPos(mainCity.stayMapPositions[0].x,mainCity.stayMapPositions[0].y);
        let minBuilding;
        let minLen = 99999;
        resBds.forEach(building=>{
            let buildingPos = TileMapHelper.INS.getPos(building.stayMapPositions[0].x,building.stayMapPositions[0].y);
            let len = TileMapHelper.INS.Path_DistPos(cityPos,buildingPos);
            if(len < minLen){
                minLen = len;
                minBuilding = building;
            }
        });
        return minBuilding;
    }

    
    protected onEnable(): void {
        NotificationMgr.addListener(NotificationName.ROOKIE_GUIDE_TAP_TASK_PANEL, this._onTapGuideTask, this);
    }

    protected onDisable(): void {
        NotificationMgr.removeListener(NotificationName.ROOKIE_GUIDE_TAP_TASK_PANEL, this._onTapGuideTask, this);
    }
    
    _onTapGuideTask(){
        this.initBinding();
        if(this._guide_step == 1){
            const innerOuterChangeButton = this.mainUI.node.getChildByPath("CommonContent/InnerOutChangeBtnBg");
            RookieStepMgr.instance().maskView.configuration(false, innerOuterChangeButton.worldPosition, innerOuterChangeButton.getComponent(UITransform).contentSize, () => {
                RookieStepMgr.instance().maskView.hide();
                GameMusicPlayMgr.playTapButtonEffect();
                GameMainHelper.instance.changeInnerAndOuterShow();
                this._guide_step = 2;
            });
        }
        if(this._guide_step == 2){
            const view = this._resBuilding.node;
            if(!view){
                return;
            }
            RookieStepMgr.instance().maskView.configuration(true, view.worldPosition, view.getComponent(UITransform).contentSize, () => {
                RookieStepMgr.instance().maskView.hide();
                GameMusicPlayMgr.playTapButtonEffect();
                this._tileMapController._clickOnMap(view.worldPosition);
                this._guide_step = 3;
                this.scheduleOnce(()=>{
                    this._onTapGuideTask();
                },0.5);
            });
        }
        if(this._guide_step == 3){
            let actionView = this._tileMapController.actionView;
            if(!actionView){
                return;
            }
            let node = actionView.node.getChildByPath('ActionView/Action');
            let view = node.children[0];
            if(!view){
                return;
            }
            RookieStepMgr.instance().maskView.configuration(true, view.worldPosition, view.getComponent(UITransform).contentSize, () => {
                actionView.hide();
                RookieStepMgr.instance().maskView.hide();
                let btn = view.getComponent(Button);
                let event = new Event(NodeEventType.TOUCH_START);
                EventHandler.emitEvents(btn.clickEvents,event);
            });
        }
        
    }


}