import { _decorator, Component, Label, Node, tween, v3 } from "cc";
import ViewController from "../../BasicView/ViewController";
import UIPanelManger, { UIPanelLayerType } from "../../Basic/UIPanelMgr";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import { DataMgr } from "../../Data/DataMgr";
import { NetworkMgr } from "../../Net/NetworkMgr";
import CLog from "../../Utils/CLog";
import { LanMgr } from "../../Utils/Global";

const { ccclass, property } = _decorator;

@ccclass("NewVersionView")
export class NewVersionView extends ViewController {
    protected viewDidLoad(): void {
        super.viewDidLoad();

        // this.node.getChildByPath("Content/Title").getComponent(Label).string = LanMgr.getLanById("lanreplace200005");
        // this.node.getChildByPath("Content/Tip").getComponent(Label).string = LanMgr.getLanById("lanreplace200041");
        // this.node.getChildByPath("Content/ReloadButton/name").getComponent(Label).string = LanMgr.getLanById("lanreplace200008");
    }

    protected viewDidAppear(): void {
        super.viewDidAppear();
    }

    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByPath("Content");
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();
    }

    //-------------------------------- action
    // private async onTapReconnect() {
    //     GameMusicPlayMgr.playTapButtonEffect();
    //     await this.playExitAnimation();
    //     UIPanelManger.inst.popPanel(this.node, UIPanelLayerType.ROOKIE);

    //     DataMgr.r.reconnects++;
    //     CLog.info(`Main/reconnect, count: ${DataMgr.r.reconnects}`);
    //     let r = await NetworkMgr.websocketConnect();
    //     if (r) {
    //         CLog.info(`Main/reconnect success [${DataMgr.r.reconnects}]`);
    //         if (DataMgr.r.wallet.addr) {
    //             CLog.info(`Main/reconnect: websocket login starting`);
    //             NetworkMgr.websocketMsg.login(DataMgr.r.loginInfo);
    //         }
    //     }
    // }

    private async onTapReload() {
        GameMusicPlayMgr.playTapButtonEffect();
        window.location.reload();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node, UIPanelLayerType.HUD);
    }
}
