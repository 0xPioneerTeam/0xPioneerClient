import {_decorator, Button, Component, Label} from 'cc';
import {BattleReportsMgr} from '../Utils/Global';
import {UIName} from '../Const/ConstUIDefine';
import NotificationMgr from '../Basic/NotificationMgr';
import { NotificationName } from '../Const/Notification';
import UIPanelManger from '../Basic/UIPanelMgr';
import { DataMgr } from '../Data/DataMgr';
import GameMusicPlayMgr from '../Manger/GameMusicPlayMgr';

const {ccclass} = _decorator;


@ccclass('BattleReportEntryButton')
export class BattleReportEntryButton extends Component {
    protected onEnable() {
        this.node.on(Button.EventType.CLICK, this.onClickButton, this);
        this.updateBattleReportsUnreadCount();

        NotificationMgr.addListener(NotificationName.BATTLE_REPORT_LIST_CHANGED, this.onBattleReportListChanged, this);
    }

    protected onDisable() {
        this.node.off(Button.EventType.CLICK, this.onClickButton, this);
        NotificationMgr.removeListener(NotificationName.BATTLE_REPORT_LIST_CHANGED, this.onBattleReportListChanged, this);
    }

    private async onClickButton() {
        GameMusicPlayMgr.playTapButtonEffect();
        await UIPanelManger.inst.pushPanel(UIName.BattleReportUI);
    }

    private updateBattleReportsUnreadCount() {
        const icon_WarReport_1 = this.node.getChildByName('icon_WarReport_1');
        const icon_WarReport_2 = this.node.getChildByName('icon_WarReport_2');
        const icon_WarReport_3 = this.node.getChildByName('icon_WarReport_3');
        const emergencyCountLabel = this.node.getChildByName('emergencyCountLabel').getComponent(Label);

        const label = this.node.getChildByName('unreadCountLabel').getComponent(Label);
        const count = DataMgr.s.battleReport.unreadCount;
        if (count != 0) {
            label.string = Math.min(count, 99).toString();
            label.node.active = true;
            icon_WarReport_1.active = false;
            icon_WarReport_2.active = true;
        } else {
            label.node.active = false;
            icon_WarReport_1.active = true;
            icon_WarReport_2.active = false;
        }

        const emergencyReportCount = DataMgr.s.battleReport.emergencyCount;
        if (emergencyReportCount != 0) {
            icon_WarReport_3.active = true;
            emergencyCountLabel.string = Math.min(emergencyReportCount, 99).toString();
            emergencyCountLabel.node.active = true;
        } else {
            icon_WarReport_3.active = false;
            emergencyCountLabel.node.active = false;
        }
    }

    onBattleReportListChanged() {
        this.updateBattleReportsUnreadCount();
    }
}