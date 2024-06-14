import { _decorator, Component, Label, Sprite } from "cc";
import { NFTPioneerObject } from "../../Const/NFTPioneerDefine";
import ItemConfig from "../../Config/ItemConfig";
import { ItemMgr } from "../../Utils/Global";
const { ccclass, property } = _decorator;

@ccclass("NTFBackpackItem")
export class NTFBackpackItem extends Component {
    public async refreshUI(model: NFTPioneerObject = null) {
        if (model == null) {
            return;
        }
        this.node.getChildByPath("BgAvatar/Role").getComponent(Sprite).spriteFrame = await ItemMgr.getNFTIcon(model.skin);
        this.node.getChildByPath("Level").getComponent(Label).string = "Lv." + model.level;
        this.node.getChildByPath("RankBg/Label").getComponent(Label).string = "R" + model.rarity;
        this.node.getChildByPath("Name").getComponent(Label).string = model.name;
    }
}
