import { _decorator, Color, Component, Label, Layout, Node, ProgressBar, Sprite, SpriteFrame } from "cc";
import { MapPioneerActionType, MapPlayerPioneerObject } from "../../Const/PioneerDefine";
import { GameMgr, LanMgr, ResourcesMgr } from "../../Utils/Global";
import { DataMgr } from "../../Data/DataMgr";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import TroopsConfig from "../../Config/TroopsConfig";
import { NFTIllustrationItemObject } from "../../Const/NFTPioneerDefine";
import { BundleName } from "../../Basic/ResourcesMgr";
const { ccclass, property } = _decorator;

@ccclass("IllustrationItem")
export class IllustrationItem extends Component {
    private _nameLabel: Label = null;
    private get nameLabel(): Label {
        if (this._nameLabel == null) {
            this._nameLabel = this.node.getChildByPath("ContentView/img_NameBg/Name").getComponent(Label);
        }
        return this._nameLabel;
    }

    private _rankNode: Node = null;
    private get rankNode(): Node {
        if (this._rankNode == null) {
            this._rankNode = this.node.getChildByPath("ContentView/Rank");
        }
        return this._rankNode;
    }

    private _roleImgView: Sprite = null;
    private get roleImgView(): Sprite {
        if (this._roleImgView == null) {
            this._roleImgView = this.node.getChildByPath("ContentView/Role/Img").getComponent(Sprite);
        }
        return this._roleImgView;
    }

    private _gettedView: Node = null;
    private get gettedView(): Node {
        if (this._gettedView == null) {
            this._gettedView = this.node.getChildByPath("ContentView/ImgGetted");
        }
        return this._gettedView;
    }

    public async refreshUI(item: NFTIllustrationItemObject) {
        this.nameLabel.string = item.name;
        this.nameLabel.color = item.owned ? new Color().fromHEX("#efe0ae") : new Color().fromHEX("#a7a396");
        // for (let i = 1; i <= 5; i++) {
        //     this.rankNode.getChildByPath("Star_" + i).active = i <= nft.rank;
        // }
        this.rankNode.active = false;
        const frame = await ResourcesMgr.loadResource(BundleName.MainBundle, "icon/nft/" + item.skin + "/spriteFrame", SpriteFrame);
        this.roleImgView.spriteFrame = frame;
        this.gettedView.active = item.owned;
    }

    start() {}

    protected onDestroy(): void {}

    update(deltaTime: number) {}
}
