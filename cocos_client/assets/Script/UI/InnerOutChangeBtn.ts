import { _decorator, Component, Node, Button, SpriteFrame, Sprite, resources, Label } from 'cc';
import NotificationMgr from '../Basic/NotificationMgr';
import { NotificationName } from '../Const/Notification';
import GameMainHelper from '../Game/Helper/GameMainHelper';
import GameMusicPlayMgr from '../Manger/GameMusicPlayMgr';
const { ccclass, property } = _decorator;

@ccclass('InnerOutChangeBtn')
export class InnerOutChangeBtn extends Component {

    @property(SpriteFrame)
    InnerIcon: SpriteFrame;

    @property(SpriteFrame)
    OutIcon: SpriteFrame;

    private _sprite: Sprite;
    private _label: Label;
    onLoad(): void {
        this._sprite = this.node.getChildByName("Icon").getComponent(Sprite);
        this._label = this.node.getChildByPath("BgWord/Label").getComponent(Label);

        NotificationMgr.addListener(NotificationName.GAME_INNER_AND_OUTER_CHANGED, this._onOutAndInnerChanged, this);
        NotificationMgr.addListener(NotificationName.CHANGE_LANG, this._onOutAndInnerChanged, this);
    }

    start() {
    }

    onDestroy(): void {
        NotificationMgr.removeListener(NotificationName.GAME_INNER_AND_OUTER_CHANGED, this._onOutAndInnerChanged, this);
        NotificationMgr.removeListener(NotificationName.CHANGE_LANG, this._onOutAndInnerChanged, this);
    }

    _onOutAndInnerChanged() {
        GameMusicPlayMgr.playChangeInnerOuterEffect();
        const isOuterShow: boolean = GameMainHelper.instance.isGameShowOuter;
        if (!isOuterShow) {
            this._sprite.spriteFrame = this.OutIcon;
            // useLanMgr
            // this._label.string = LanMgr.getLanById("107549");
            this._label.string = "WORLD";
        } else {
            this._sprite.spriteFrame = this.InnerIcon;
            // useLanMgr
            // this._label.string = LanMgr.getLanById("107549");
            this._label.string = "BASE";
        }
    }

    update(deltaTime: number) {

    }


    private onTapChange() {
        GameMusicPlayMgr.playTapButtonEffect();
        GameMainHelper.instance.changeInnerAndOuterShow();
    }
}


