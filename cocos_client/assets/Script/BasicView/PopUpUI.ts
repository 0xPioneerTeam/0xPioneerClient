import { _decorator, Component, UITransform } from 'cc';
import { BaseUI } from './BaseUI';
const { ccclass, property } = _decorator;

@ccclass('PopUpUI')
export class PopUpUI extends BaseUI {

    private static _sPopUpUIs = {};
    private static addShowingPopUpUI(ui:PopUpUI) {
        PopUpUI._sPopUpUIs[ui.uniqueUIID] = ui;
    }
    private static removeShowingPopUpUI(ui:PopUpUI) {
        delete PopUpUI._sPopUpUIs[ui.uniqueUIID];
    }

    public static hideAllShowingPopUpUI() {
        for(let uiid in PopUpUI._sPopUpUIs){
            let ui:PopUpUI = PopUpUI._sPopUpUIs[uiid];
            if (ui.typeName == "TaskListUI") {
                // donnot hide white list
            } else {
                ui.node.active = false;
            }
        }

        PopUpUI._sPopUpUIs = {};
    }
    
    public override get typeName() {
        return "PopUpUI";
    }

    public show(bShow:boolean) {
        if(bShow) {
            this.node.active = true;
            PopUpUI.addShowingPopUpUI(this);
        }
        else {
            this.node.active = false;
            PopUpUI.removeShowingPopUpUI(this);
        }
    }

    onLoad() {
        super.onLoad();
        this.node.active = false;
    }

    onDestroy() {
        if(this.node.active){
            PopUpUI.removeShowingPopUpUI(this);
        }
    }

    start() {
        
    }

    update(deltaTime: number) {

    }
}


