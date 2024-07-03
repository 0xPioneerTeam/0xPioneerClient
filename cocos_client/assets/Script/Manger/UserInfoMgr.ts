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

    public afterNewPioneerDatas: MapPioneerObject[] = [];

    public constructor() {
        
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
}
