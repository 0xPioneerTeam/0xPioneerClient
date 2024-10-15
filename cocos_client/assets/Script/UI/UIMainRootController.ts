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
import { ResourcesMgr } from "../Utils/Global";
import { BundleName } from "../Basic/ResourcesMgr";
import TalkConfig from "../Config/TalkConfig";
import { DialogueUI } from "./Outer/DialogueUI";

const { ccclass, property } = _decorator;

@ccclass("UIMainRootController")
export class UIMainRootController extends ViewController {
    public async checkShowRookieGuide() {
        GameMusicPlayMgr.stopMusic();
        // if (DataMgr.s.userInfo.data.rookieStep == RookieStep.WAKE_UP) {
        //     await UIPanelManger.inst.pushPanel(UIName.RookieGuide);
        // } else {
            
        // }
        GameMusicPlayMgr.playGameMusic();
        const result = await ResourcesMgr.initBundle(BundleName.InnerBundle);
        if (!result.succeed) {
            return;
        }
        result.bundle.preloadDir("");
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
        NotificationMgr.addListener(NotificationName.USERINFO_DID_TRIGGER_LEFT_TALK, this._onUserInfoDidTriggerLeftTalk, this);
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.CHANGE_CURSOR, this._onCursorChanged, this);
        NotificationMgr.removeListener(NotificationName.USERINFO_DID_TRIGGER_LEFT_TALK, this._onUserInfoDidTriggerLeftTalk, this);
    }

    //------------------------------------------ notification
    private _onCursorChanged(type: ECursorType) {
        if (type >= this.cursorImages.length) {
            type = 0;
        }
        MouseCursor.SetCursorStyle(ECursorStyle.url, this.cursorImages[type].nativeUrl);
    }

    private async _onUserInfoDidTriggerLeftTalk(data: { talkId: string, fromRookie: boolean }) {
        const { talkId, fromRookie } = data;
        const config = TalkConfig.getById(talkId);
        if (config == null) {
            return;
        }
        const result = await UIPanelManger.inst.pushPanel(UIName.DialogueUI);
        if (!result.success) {
            return;
        }
        result.node.getComponent(DialogueUI).dialogShow(config, null, fromRookie);
    }
}
