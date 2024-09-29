import { _decorator, Color, Component, Label, Layout, Node, ProgressBar } from "cc";
import { MapPioneerActionType, MapPlayerPioneerObject } from "../../Const/PioneerDefine";
import { GameMgr, LanMgr } from "../../Utils/Global";
import { DataMgr } from "../../Data/DataMgr";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import TroopsConfig from "../../Config/TroopsConfig";
const { ccclass, property } = _decorator;

@ccclass("PlayerInfoItem")
export class PlayerInfoItem extends Component {
    private _infoUniqueId: string = null;

    private _nameLabel: Label = null;
    private get nameLabel(): Label {
        if (this._nameLabel == null) {
            this._nameLabel = this.node.getChildByPath("ContentView/Name").getComponent(Label);
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

    private _statusLabel: Label = null;
    private get statusLabel(): Label {
        if (this._statusLabel == null) {
            this._statusLabel = this.node.getChildByPath("ContentView/Status").getComponent(Label);
        }
        return this._statusLabel;
    }

    private _roleView: Node = null;
    private get roleView(): Node {
        if (this._roleView == null) {
            this._roleView = this.node.getChildByPath("ContentView/Role");
        }
        return this._roleView;
    }

    private _levelLabel: Label = null;
    private get levelLabel(): Label {
        if (this._levelLabel == null) {
            this._levelLabel = this.node.getChildByPath("ContentView/Level").getComponent(Label);
        }
        return this._levelLabel;
    }

    private _fightLabel: Label = null;
    private get fightLabel(): Label {
        if (this._fightLabel == null) {
            this._fightLabel = this.node.getChildByPath("ContentView/Fight/Content/Value").getComponent(Label);
        }
        return this._fightLabel;
    }

    private _hpProgress: ProgressBar = null;
    private get hpProgress(): ProgressBar {
        if (this._hpProgress == null) {
            this._hpProgress = this.node.getChildByPath("ContentView/Hp").getComponent(ProgressBar);
        }
        return this._hpProgress;
    }

    private _hpLabel: Label = null;
    private get hpLabel(): Label {
        if (this._hpLabel == null) {
            this._hpLabel = this.node.getChildByPath("ContentView/Hp/Value").getComponent(Label);
        }
        return this._hpLabel;
    }

    private _apProgress: ProgressBar = null;
    private get apProgress(): ProgressBar {
        if (this._apProgress == null) {
            this._apProgress = this.node.getChildByPath("ContentView/Ap").getComponent(ProgressBar);
        }
        return this._apProgress;
    }

    private _apLabel: Label = null;
    private get apLabel(): Label {
        if (this._apLabel == null) {
            this._apLabel = this.node.getChildByPath("ContentView/Ap/Value").getComponent(Label);
        }
        return this._apLabel;
    }

    public refreshUI(info: MapPlayerPioneerObject) {
        this._infoUniqueId = info.uniqueId;
        const nft = DataMgr.s.nftPioneer.getNFTById(info.NFTId);
        if (nft == undefined) {
            return;
        }
        this.nameLabel.string = LanMgr.getLanById(info.name);
        for (let i = 1; i <= 5; i++) {
            this.rankNode.getChildByPath("Star_" + i).active = i <= nft.rank;
        }
        this.rankNode.active = false;
        for (const child of this.roleView.children) {
            child.active = child.name == info.id;
        }
        this.levelLabel.string = "Lv." + nft.level;

        const toeNum = GameMgr.convertHpToTroopNum(info.hp, info.troopId);
        this.hpProgress.progress = toeNum / info.hpMax;
        this.hpLabel.string = toeNum + "/" + info.hpMax;
        
        this.apProgress.progress = info.energy / info.energyMax;
        this.apLabel.string = info.energy + "/" + info.energyMax;
        this.fightLabel.string = (info.attack * 75 + info.hp * 12 + info.defend * 100).toString();
        this.fightLabel.node.parent.getComponent(Layout).updateLayout();

        let status: string = "";
        let statusColor: Color = null;
        if (info.actionType == MapPioneerActionType.inCity) {
            status = "In city";
            statusColor = new Color().fromHEX("#8EDA61");
        } else if (info.actionType == MapPioneerActionType.moving) {
            status = "In move";
            statusColor = new Color().fromHEX("#de5e5d");
        } else if (info.actionType == MapPioneerActionType.staying) {
            status = `(${info.stayPos.x},${info.stayPos.y})`;
            statusColor = new Color().fromHEX("#8EDA61");
        } else {
            status = "In action";
            statusColor = new Color().fromHEX("#de5e5d");
        }
        this.statusLabel.string = status;
        this.statusLabel.color = statusColor;
    }

    start() {
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_ACTIONTYPE_CHANGED, this._onPioneerActionTypeChanged, this);
    }

    protected onDestroy(): void {
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_ACTIONTYPE_CHANGED, this._onPioneerActionTypeChanged, this);
    }

    update(deltaTime: number) {}

    //--------------------- notifiaction
    private _onPioneerActionTypeChanged(data: { uniqueId: string }) {
        if (this._infoUniqueId == null || this._infoUniqueId != data.uniqueId) {
            return;
        }
        const info = DataMgr.s.pioneer.getById(this._infoUniqueId) as MapPlayerPioneerObject;
        this.refreshUI(info);
    }
}
