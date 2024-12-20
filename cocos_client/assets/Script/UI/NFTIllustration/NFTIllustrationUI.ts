import { _decorator, Component, Label, Node, Sprite, SpriteFrame, Vec3, Button, EventHandler, v2, Vec2, Prefab, Slider, instantiate, Layout } from "cc";
import ViewController from "../../BasicView/ViewController";
import { UIName } from "../../Const/ConstUIDefine";
import UIPanelManger from "../../Basic/UIPanelMgr";
import { NFTIllustrationBuffItemObject, NFTIllustrationItemObject, NFTPioneerObject } from "../../Const/NFTPioneerDefine";
import { NTFBackpackItem } from "../View/NTFBackpackItem";
import { NFTInfoUI } from "../NFTInfoUI";
import { DataMgr } from "../../Data/DataMgr";
import { BackpackArrangeType } from "../../Const/ConstDefine";
import GameMusicPlayMgr from "../../Manger/GameMusicPlayMgr";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import NFTPioneerConfig from "../../Config/NFTPioneerConfig";
import { LanMgr } from "../../Utils/Global";
import { IllustrationItem } from "../View/IllustrationItem";
import NFTPioneerNameConfig from "../../Config/NFTPioneerNameConfig";
import NFTHandBookConfig from "../../Config/NFTHandBookConfig";
import { IllustrationBuffItem } from "../View/IllustrationBuffItem";
const { ccclass, property } = _decorator;

@ccclass("NFTIllustrationUI")
export class NFTIllustrationUI extends ViewController {
    @property(Prefab)
    private illustrationItem: Prefab = null;

    @property(Prefab)
    private buffItem: Prefab = null;

    private _datas: NFTIllustrationItemObject[] = [];

    private _illustrationContent: Node = null;
    private _buffContent: Node = null;

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._illustrationContent = this.node.getChildByPath("__ViewContent/Bg/ScrollView/View/Content");
        this._buffContent = this.node.getChildByPath("__ViewContent/Bg/RightView/ScrollView/View/Content");
    }

    protected viewDidStart(): void {
        super.viewDidStart();

        // useLanMgr
        // this.node.getChildByPath("__ViewContent/Bg/title").getComponent(Label).string = LanMgr.getLanById("107549");
        this._initUI();
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();
    }

    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByPath("__ViewContent");
    }

    private _initUI() {
        const nftConfigs = NFTPioneerConfig.getAll();
        const ownedNft = DataMgr.s.pioneer.getAllSelfPlayers();
        this._datas = [];

        let ownedNum: number = 0;
        for (const key in nftConfigs) {
            if (Object.prototype.hasOwnProperty.call(nftConfigs, key)) {
                const element = nftConfigs[key];
                let owned = false;
                for (const ownedElement of ownedNft) {
                    if (ownedElement.NFTInitLinkId == element.id) {
                        owned = true;
                        break;
                    }
                }
                let name: string = "";
                for (const names of element.name) {
                    for (const nameElement of names) {
                        name += " " + NFTPioneerNameConfig.getById(nameElement).name;
                    }
                }
                this._datas.push({
                    id: element.id,
                    name: name,
                    skin: element.skin,
                    owned: owned,
                });
                if (owned) {
                    ownedNum += 1;
                }
            }
        }

        for (let i = 0; i < this._datas.length; i++) {
            const data = this._datas[i];
            const item = instantiate(this.illustrationItem);
            item.getComponent(IllustrationItem).refreshUI(data);
            item.setParent(this._illustrationContent);
        }
        this._illustrationContent.getComponent(Layout).updateLayout();

        const handBookConfigs = NFTHandBookConfig.getAll();
        const buffs: NFTIllustrationBuffItemObject[] = [];
        for (const key in handBookConfigs) {
            if (Object.prototype.hasOwnProperty.call(handBookConfigs, key)) {
                const element = handBookConfigs[key];
                buffs.push({
                    needNum: element.threshold,
                    benefit: element.benefit,
                    effect: ownedNum >= element.threshold,
                });
            }
        }

        for (let i = 0; i < buffs.length; i++) {
            const data = buffs[i];
            const item = instantiate(this.buffItem);
            item.getComponent(IllustrationBuffItem).refreshUI(data);
            item.setParent(this._buffContent);
        }
        this._buffContent.getComponent(Layout).updateLayout();
    }

    //------------------------------------------------------------ action
    private async onTapClose() {
        GameMusicPlayMgr.playTapButtonEffect();
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel(this.node);
    }
}
