import { CCBoolean, ImageAsset, _decorator } from "cc";
import { UIName } from "../Const/ConstUIDefine";
import ViewController from "../BasicView/ViewController";
import { ECursorStyle, ECursorType } from "../Const/ConstDefine";
import { MouseCursor } from "./MouseCursor";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import UIPanelManger from "../Basic/UIPanelMgr";
import { DataMgr } from "../Data/DataMgr";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";

const { ccclass, property } = _decorator;

@ccclass("UIMainRootController")
export class UIMainRootController extends ViewController {
    public async checkShowRookieGuide() {
        GameMusicPlayMgr.stopMusic();
        if (this.canShowRookieGuide && !DataMgr.s.userInfo.data.didFinishRookie) {
            await UIPanelManger.inst.pushPanel(UIName.RookieGuide);
        } else {
            GameMusicPlayMgr.playGameMusic();
        }
    }

    @property([ImageAsset])
    cursorImages: ImageAsset[] = [];

    @property(CCBoolean)
    private canShowRookieGuide: boolean = true;

    protected async viewDidLoad(): Promise<void> {
        super.viewDidLoad();

        MouseCursor.SetCursorStyle(ECursorStyle.url, this.cursorImages[ECursorType.Common].nativeUrl);
    }

    protected async viewDidStart(): Promise<void> {
        super.viewDidStart();

        NotificationMgr.addListener(NotificationName.CHANGE_CURSOR, this._onCursorChanged, this);
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.CHANGE_CURSOR, this._onCursorChanged, this);
    }

    //------------------------------------------ notification
    private _onCursorChanged(type: ECursorType) {
        if (type >= this.cursorImages.length) {
            type = 0;
        }
        MouseCursor.SetCursorStyle(ECursorStyle.url, this.cursorImages[type].nativeUrl);
    }
}
