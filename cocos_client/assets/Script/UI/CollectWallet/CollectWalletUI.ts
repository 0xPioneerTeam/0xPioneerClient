import { _decorator, Button, Component, instantiate, Label, Layout, Node } from "cc";
import ViewController from "../../BasicView/ViewController";
import { LanMgr } from "../../Utils/Global";
import UIPanelManger from "../../Basic/UIPanelMgr";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("CollectWalletUI")
export class CollectWalletUI extends ViewController {
    private _methods: string[] = ["MetaMask"];

    private _itemContentView: Node = null;
    private _itemView: Node = null;

    private _connectCallback: (method: string) => void;
    public configuration(connectCallback: (method: string) => void) {
        this._connectCallback = connectCallback;
    }

    protected viewDidLoad(): void {
        super.viewDidLoad();

        // useLanMgr
        // this.node.getChildByPath("__ViewContent/Name").getComponent(Label).string = LanMgr.getLanById("107549");

        this._itemContentView = this.node.getChildByPath("__ViewContent/BgTaskListWord/ScrollView/View/Content");
        this._itemView = this._itemContentView.getChildByPath("Item");
        this._itemView.removeFromParent();
    }
    protected viewDidStart(): void {
        super.viewDidStart();

        this._refreshUI();
    }

    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByPath("__ViewContent");
    }

    private _refreshUI() {
        const lastLoginMethod = localStorage.getItem("lastLoginMethod");

        this._itemContentView.destroyAllChildren();
        for (let i = 0; i < this._methods.length; i++) {
            const view = instantiate(this._itemView);
            view.setParent(this._itemContentView);

            view.getChildByPath("Title").getComponent(Label).string = this._methods[i];
            view.getChildByPath("Connecting").active = this._methods[i] == lastLoginMethod;
            view.getComponent(Button).clickEvents[0].customEventData = i.toString();
        }

        this._itemContentView.getComponent(Layout).updateLayout();
    }

    //------------------------ action
    private async onTapItem(event: Event, customEventData: string) {
        GameMusicPlayMgr.playTapButtonEffect();
        const index = parseInt(customEventData);
        if (index < 0 || index >= this._methods.length) {
            return;
        }
        const method = this._methods[index];
        if (this._connectCallback != null) {
            this._connectCallback(method);
        }
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }
}
