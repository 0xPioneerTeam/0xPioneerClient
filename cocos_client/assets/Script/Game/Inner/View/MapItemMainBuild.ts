import { _decorator, Component, Node, Vec2, Vec3, CCString, Prefab, instantiate } from 'cc';
import { MapItem } from '../../../BasicView/MapItem';
import { GameMain } from '../../../GameMain';
import { InnerBuildUI } from '../../../UI/Inner/InnerBuildUI';
import { InnerBuildingType, UserInnerBuildInfo } from '../../../Const/Manager/UserInfoMgrDefine';
import { ArtifactMgr, UIPanelMgr, UserInfoMgr } from '../../../Utils/Global';
import { UIName } from '../../../Const/ConstUIDefine';
import { BuildingUpgradeUI } from '../../../UI/Inner/BuildingUpgradeUI';
import { ArtifactEffectType } from '../../../Const/Artifact';

const { ccclass, property } = _decorator;

@ccclass('MapItemMainBuild')
export class MapItemMainBuild extends MapItem {

    @property([Prefab])
    private buildPfbList: Prefab[] = [];

    @property(Node)
    private buildingAnim: Node = null;

    private buildInfoUI: InnerBuildUI = null;

    private buildNode: Node = null;


    private _data: UserInnerBuildInfo = null;
    private _buildUpgrading: boolean = false;

    override async _onClick() {
        super._onClick();

        const view = await UIPanelMgr.openPanel(UIName.BuildingUpgradeUI);
        if (view != null) {
            view.getComponent(BuildingUpgradeUI).refreshUI();
        }
    }

    public upgradeBuild() {
        // TODO Currently only processing upgrades to level 2
        if (this._data.buildLevel >= 2 ||
            this._buildUpgrading) {
            return;
        }
        this._buildUpgrading = true;

        let up_time = 5;
        // artifact
        let artifactTime = 0;
        let artifactPropEff = ArtifactMgr.getPropEffValue(UserInfoMgr.level);
        if (artifactPropEff.eff[ArtifactEffectType.BUILDING_LVUP_TIME]) {
            artifactTime = artifactPropEff.eff[ArtifactEffectType.BUILDING_LVUP_TIME];
        }
        // total time
        up_time = Math.floor(up_time - (up_time * artifactTime));

        this.buildingAnim.active = true;
        this.scheduleOnce(() => {
            UserInfoMgr.upgradeBuild(InnerBuildingType.MainCity);

            this.refresh();
            this._buildUpgrading = false;
        }, up_time);
        this.buildInfoUI.setProgressTime(up_time);
    }

    async start() {
        super.start();

        this.buildInfoUI = this.node.getChildByName('innerBuildUI')?.getComponent(InnerBuildUI);
        const innerBuildData = await UserInfoMgr.innerBuilds;
        this._data = innerBuildData.get('0');
        this.refresh();
    }

    refresh() {
        this.buildingAnim.active = false;

        if (this._data) {
            this.buildInfoUI?.refreshUI(this._data);
            this.buildNode = instantiate(this.buildPfbList[this._data.buildLevel - 1]);
            this.buildNode.setParent(this.node);
            this.buildNode.setPosition(new Vec3(0, 0, 0));

        }
        this.node.getChildByName("innerBuildUI").setSiblingIndex(99);
    }

    update(deltaTime: number) {

    }
}


