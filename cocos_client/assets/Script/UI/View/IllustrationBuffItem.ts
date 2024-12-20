import { _decorator, Color, Component, Label, Layout, Node, ProgressBar, Sprite, SpriteFrame } from "cc";
import { MapPioneerActionType, MapPlayerPioneerObject } from "../../Const/PioneerDefine";
import { GameMgr, LanMgr, ResourcesMgr } from "../../Utils/Global";
import { DataMgr } from "../../Data/DataMgr";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import TroopsConfig from "../../Config/TroopsConfig";
import { NFTIllustrationBuffItemObject, NFTIllustrationItemObject } from "../../Const/NFTPioneerDefine";
import { BundleName } from "../../Basic/ResourcesMgr";
const { ccclass, property } = _decorator;

@ccclass("IllustrationBuffItem")
export class IllustrationBuffItem extends Component {
    private _commonBg: Node = null;
    private get commonBg(): Node {
        if (this._commonBg == null) {
            this._commonBg = this.node.getChildByPath("ContentView/BgCommon");
        }
        return this._commonBg;
    }

    private _effectBg: Node = null;
    private get effectBg(): Node {
        if (this._effectBg == null) {
            this._effectBg = this.node.getChildByPath("ContentView/BgEffect");
        }
        return this._effectBg;
    }

    private _titleLabel: Label = null;
    private get titleLabel(): Label {
        if (this._titleLabel == null) {
            this._titleLabel = this.node.getChildByPath("ContentView/Title").getComponent(Label);
        }
        return this._titleLabel;
    }

    private _valueLabel: Label = null;
    private get valueLabel(): Label {
        if (this._valueLabel == null) {
            this._valueLabel = this.node.getChildByPath("ContentView/Value").getComponent(Label);
        }
        return this._valueLabel;
    }

    private _effectIcon: Node = null;
    private get effectIcon(): Node {
        if (this._effectIcon == null) {
            this._effectIcon = this.node.getChildByPath("ContentView/IconEffect");
        }
        return this._effectIcon;
    }

    private _commonIcon: Node = null;
    private get commonIcon(): Node {
        if (this._commonIcon == null) {
            this._commonIcon = this.node.getChildByPath("ContentView/IconCommon");
        }
        return this._commonIcon;
    }

    private _needNumLabel: Label = null;
    private get needNumLabel(): Label {
        if (this._needNumLabel == null) {
            this._needNumLabel = this.node.getChildByPath("ContentView/NeedNum").getComponent(Label);
        }
        return this._needNumLabel;
    }

    public async refreshUI(item: NFTIllustrationBuffItemObject) {
        this.commonBg.active = !item.effect;
        this.effectBg.active = item.effect;

        const effectColor = new Color().fromHEX("#efe0ae");
        const commonColor = new Color().fromHEX("#a7a396");
        const benefitColor = new Color().fromHEX("#8EDA61");

        this.titleLabel.color = item.effect ? effectColor : commonColor;
        this.valueLabel.color = item.effect ? benefitColor : commonColor;
        this.valueLabel.string = "+" + item.benefit + "%";

        this.commonIcon.active = !item.effect;
        this.effectIcon.active = item.effect;
        this.needNumLabel.color = item.effect ? effectColor : commonColor;
        this.needNumLabel.string = item.needNum.toString();
    }

    start() {}

    protected onDestroy(): void {}

    update(deltaTime: number) {}
}
