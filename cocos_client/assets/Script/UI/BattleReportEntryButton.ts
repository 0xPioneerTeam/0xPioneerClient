import { _decorator, Button, Component, Label, rect } from "cc";
import { UIName } from "../Const/ConstUIDefine";
import NotificationMgr from "../Basic/NotificationMgr";
import { NotificationName } from "../Const/Notification";
import UIPanelManger from "../Basic/UIPanelMgr";
import { DataMgr } from "../Data/DataMgr";
import GameMusicPlayMgr from "../Manger/GameMusicPlayMgr";
import { NetworkMgr } from "../Net/NetworkMgr";
import { s2c_user, share } from "../Net/msg/WebsocketMsg";
import { RedPointView } from "./View/RedPointView";

const { ccclass } = _decorator;

@ccclass("BattleReportEntryButton")
export class BattleReportEntryButton extends Component {

    private _reports: share.Inew_battle_report_data[] = [];

    private _redPointView: RedPointView = null;

    protected start(): void {

        this._redPointView = this.node.getChildByPath("RedPointView").getComponent(RedPointView);

        this.node.on(Button.EventType.CLICK, this.onClickButton, this);

        NetworkMgr.websocket.on("get_new_battle_report_res", this.get_new_battle_report_res);
        NetworkMgr.websocket.on("receive_new_battle_report_reward_res", this.receive_new_battle_report_reward_res);

        NetworkMgr.websocketMsg.get_new_battle_report({});
    }

    protected onDestroy(): void {
        this.node.off(Button.EventType.CLICK, this.onClickButton, this);

        NetworkMgr.websocket.off("get_new_battle_report_res", this.get_new_battle_report_res);
        NetworkMgr.websocket.off("receive_new_battle_report_reward_res", this.receive_new_battle_report_reward_res);
    }

    private _refreshRedPoint() {
        let redCount: number = 0;
        for (const report of this._reports) {
            if (report.getted) {
                continue;
            }
            if (report.type == share.Inew_battle_report_type.explore) {
                continue;
            }
            if (report.type == share.Inew_battle_report_type.mining && report.mining.rewards.length <= 0) {
                continue;
            }
            if (report.type == share.Inew_battle_report_type.fight && report.fight.winItems.length <= 0 && report.fight.winArtifacts.length <= 0) {
                continue;
            }
            if (report.type == share.Inew_battle_report_type.task && report.task.rewards.length <= 0) {
                continue;
            }
            redCount += 1;
        }
        this._redPointView.refreshUI(redCount, true);
        this.node.getChildByPath("icon_WarReport_1").active = redCount <= 0;
        this.node.getChildByPath("icon_WarReport_2").active = redCount > 0;
    }

    //------------------------------- action
    private async onClickButton() {
        GameMusicPlayMgr.playTapButtonEffect();
        await UIPanelManger.inst.pushPanel(UIName.BattleReportUI);
    }

    //------------------------------- notify
    private get_new_battle_report_res = (e: any) => {
        const p: s2c_user.Iget_new_battle_report_res = e.data;
        if (p.res !== 1) {
            return;
        }
        this._reports = p.data;
        this._refreshRedPoint();
    };

    private receive_new_battle_report_reward_res = (e: any) => {
        const p: s2c_user.Ireceive_new_battle_report_reward_res = e.data;
        if (p.res !== 1) {
            return;
        }
        for (const report of this._reports) {
            if (report.id == p.id) {
                report.getted = true;
                break;
            }
        }
        this._refreshRedPoint();    }
}
