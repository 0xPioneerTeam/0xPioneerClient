import { _decorator, Component, Label, Node, tween } from 'cc';
import { LanMgr, UserInfoMgr } from '../../Utils/Global';
import ViewController from '../../BasicView/ViewController';
import { UIName } from '../../Const/ConstUIDefine';
import { ItemInfoUI } from '../ItemInfoUI';
import { ArtifactInfoUI } from '../ArtifactInfoUI';
import { ItemGettedUI } from '../ItemGettedUI';
import UIPanelManger from '../../Basic/UIPanelMgr';
import GameMusicPlayMgr from '../../Manger/GameMusicPlayMgr';
const { ccclass, property } = _decorator;

@ccclass('SecretGuardGettedUI')
export class SecretGuardGettedUI extends ViewController {

    public dialogShow(pioneerAnimType: string) {
        GameMusicPlayMgr.playGetNewPioneerEffect();
        const names = [
            "secretGuard",
            "doomsdayGangSpy",
            "rebels",
        ];

        // useLanMgr
        const keen = [
            // "Dual Guns Jack",
            LanMgr.getLanById("206001"),
            // "Dual Blades Keen",
            LanMgr.getLanById("206002"),
            // "Rebels Camus"
            LanMgr.getLanById("206003")
        ];
        const wind = [
            // "Gunman as Graceful as a Gazelle"
            LanMgr.getLanById("206004"),
            // "Warrior as Wild as the Wind",
            LanMgr.getLanById("206005"),
            // "Berserker as Fearless as a Beast"
            LanMgr.getLanById("206006")
        ]
        for (const name of names) {
            this.node.getChildByPath("bgc/" + name).active = name == pioneerAnimType;
        }
        let index = names.indexOf(pioneerAnimType);
        this.node.getChildByPath("lable/Label keen").getComponent(Label).string = keen[index];
        this.node.getChildByPath("lable/Label wind").getComponent(Label).string = wind[index];

        tween(this.node)
            .delay(2)
            .call(async () => {
                UIPanelManger.inst.popPanel(this.node);
                if (UserInfoMgr.afterCivilizationClosedShowItemDatas.length > 0) {
                    const result = await UIPanelManger.inst.pushPanel(UIName.ItemGettedUI);
                    if (result.success) {
                        result.node.getComponent(ItemGettedUI).showItem(UserInfoMgr.afterCivilizationClosedShowItemDatas);
                    }
                    UserInfoMgr.afterCivilizationClosedShowItemDatas = [];
                }
                if (UserInfoMgr.afterCivilizationClosedShowArtifactDatas.length > 0) {
                    const result = await UIPanelManger.inst.pushPanel(UIName.ArtifactInfoUI);
                    if (result.success) {
                        result.node.getComponent(ArtifactInfoUI).showItem(UserInfoMgr.afterCivilizationClosedShowArtifactDatas);
                    }
                    UserInfoMgr.afterCivilizationClosedShowArtifactDatas = [];
                }
            })
            .start();
    }
}


