import ArtifactData from "../Model/ArtifactData";
import NotificationMgr from "../Basic/NotificationMgr";
import ItemData from "../Const/Item";
import { NotificationName } from "../Const/Notification";
import { DataMgr } from "../Data/DataMgr";
import { MapPioneerObject } from "../Const/PioneerDefine";
import UIPanelManger from "../Basic/UIPanelMgr";
import { UIName } from "../Const/ConstUIDefine";
import { ItemGettedUI } from "../UI/ItemGettedUI";
import { ArtifactInfoUI } from "../UI/ArtifactInfoUI";

export default class UserInfoMgr {
    private _afterTalkItemGetData: Map<string, ItemData[]> = new Map();
    private _afterCivilizationClosedShowItemDatas: ItemData[] = [];
    private _afterCivilizationClosedShowArtifactDatas: ArtifactData[] = [];
    private _afterCivilizationClosedShowPioneerDatas: MapPioneerObject[] = [];

    public constructor() {
        NotificationMgr.addListener(NotificationName.USERINFO_DID_CHANGE_LEVEL, this._onUserInfoDidChangeLevel, this);
    }
    //--------------------------------------------------
    public get afterTalkItemGetData() {
        return this._afterTalkItemGetData;
    }
    public get afterCivilizationClosedShowItemDatas() {
        return this._afterCivilizationClosedShowItemDatas;
    }
    public get afterCivilizationClosedShowArtifactDatas() {
        return this._afterCivilizationClosedShowArtifactDatas;
    }
    public get afterCivilizationClosedShowPioneerDatas() {
        return this._afterCivilizationClosedShowPioneerDatas;
    }
    //--------------------------------------------------
    public getExplorationReward(boxId: string) {
        DataMgr.s.userInfo.getExplorationReward(boxId);
    }
    
    public set afterCivilizationClosedShowItemDatas(itemDatas: ItemData[]) {
        this._afterCivilizationClosedShowItemDatas = itemDatas;
    }
    public set afterCivilizationClosedShowArtifactDatas(artifactDatas: ArtifactData[]) {
        this._afterCivilizationClosedShowArtifactDatas = artifactDatas;
    }
    public set afterCivilizationClosedShowPioneerDatas(pioneerDatas: MapPioneerObject[]) {
        this._afterCivilizationClosedShowPioneerDatas = pioneerDatas;
    }
    //-------------------------------------------------- notification
    private _onUserInfoDidChangeLevel(data: { hpMaxChangeValue: number; showBuildingIds: string[]; items: ItemData[]; artifacts: ArtifactData[] }) {
        if (data.items.length > 0) {
            setTimeout(async () => {
                if (UIPanelManger.inst.panelIsShow(UIName.CivilizationLevelUpUI) || UIPanelManger.inst.panelIsShow(UIName.SecretGuardGettedUI)) {
                    this._afterCivilizationClosedShowItemDatas.push(...data.items);
                } else {
                    const result = await UIPanelManger.inst.pushPanel(UIName.ItemGettedUI);
                    if (result.success) {
                        result.node.getComponent(ItemGettedUI).showItem(data.items);
                    }
                }
            });
        }
        if (data.artifacts.length > 0) {
            setTimeout(async () => {
                if (UIPanelManger.inst.panelIsShow(UIName.CivilizationLevelUpUI) || UIPanelManger.inst.panelIsShow(UIName.SecretGuardGettedUI)) {
                    this._afterCivilizationClosedShowArtifactDatas.push(...data.artifacts);
                } else {
                    const result = await UIPanelManger.inst.pushPanel(UIName.ArtifactInfoUI);
                    if (result.success) {
                        result.node.getComponent(ArtifactInfoUI).showItem(data.artifacts);
                    }
                }
            });
        }
    }
}
