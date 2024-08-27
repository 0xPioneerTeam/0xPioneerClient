import { Component, find } from "cc";
import { MainUI } from "../../MainUI";
import { OuterPioneerController } from "../../../Game/Outer/OuterPioneerController";
import { OuterTiledMapActionController } from "../../../Game/Outer/OuterTiledMapActionController";
import NotificationMgr from "../../../Basic/NotificationMgr";
import { NotificationName } from "../../../Const/Notification";
import { GameMgr } from "../../../Utils/Global";
import { InnerBuildingControllerRe } from "../../../Game/Inner/InnerBuildingControllerRe";
import { OuterShadowController } from "../../../Game/Outer/OuterShadowController";
import { OuterBuildingController } from "../../../Game/Outer/OuterBuildingController";


export class GsBase extends Component{

    public mainUI:MainUI;
    public _pioneerController:OuterPioneerController;
    public _tileMapController:OuterTiledMapActionController;
    public _shadowController:OuterShadowController;
    public _buildingController:OuterBuildingController;
    public _innerBuildingController:InnerBuildingControllerRe;

    /**isOneGudie */
    public onlyOneGudie:boolean = true;

    protected _guide_step:number = -1;

    public start(){
        this.initBinding();
        if(!GameMgr.enterGameSence)
        {
            NotificationMgr.addListener(NotificationName.GAME_SCENE_ENTER, this.gsStart, this);
            return;
        }
        this.gsStart();
    }

    gsStart(){
        if(!this._pioneerController){
            this.initBinding();
        }
    }

    initBinding(){
        this.mainUI = find("Main/UI_Canvas/UI_ROOT/MainUI").getComponent(MainUI);
        let outScene = find("Main/Canvas/GameContent/Game/OutScene");
        if(outScene == null){
            return;
        }
        this._pioneerController = outScene.getComponent(OuterPioneerController);
        this._tileMapController = outScene.getComponent(OuterTiledMapActionController);
        this._shadowController = outScene.getComponent(OuterShadowController);
        this._buildingController = outScene.getComponent(OuterBuildingController);
        let InnerSceneRe = find("Main/Canvas/GameContent/Game/InnerSceneRe");
        if(InnerSceneRe == null){
            return;
        }
        this._innerBuildingController = InnerSceneRe.getComponent(InnerBuildingControllerRe);
    }

    public findDecoLayerEle(eleName:string){
        
    }

    public endDestroy() {
        this.node.removeFromParent();
        this.node.destroy();
    }

}