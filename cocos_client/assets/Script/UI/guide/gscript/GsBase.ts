import { Component, find } from "cc";
import { MainUI } from "../../MainUI";
import GameMainHelper from "../../../Game/Helper/GameMainHelper";
import { OuterPioneerController } from "../../../Game/Outer/OuterPioneerController";
import { OuterTiledMapActionController } from "../../../Game/Outer/OuterTiledMapActionController";
import NotificationMgr from "../../../Basic/NotificationMgr";
import { NotificationName } from "../../../Const/Notification";
import { GameMgr } from "../../../Utils/Global";


export class GsBase extends Component{

    public mainUI:MainUI;

    public _pioneerController:OuterPioneerController;
    public _tileMapController:OuterTiledMapActionController;

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
    }

    public findDecoLayerEle(eleName:string){
        
    }

    public endDestroy() {
        this.node.removeFromParent();
        this.node.destroy();
    }

}