import { ArtifactDataMgr } from "./Save/ArtifactDataMgr";
import { EraseShadowDataMgr } from "./Save/EraseShadowDataMgr";
import { MapBuildingDataMgr } from "./Save/MapBuildingDataMgr";
import { PioneersDataMgr } from "./Save/PioneersDataMgr";
import { ItemDataMgr } from "./Save/ItemDataMgr";
import { SettlementDataMgr } from "./Save/SettlementDataMgr";
import UserInfoDataMgr from "./Save/UserInfoDataMgr";
import TaskDataMgr from "./Save/TaskDataMgr";
import NFTPioneerDataMgr from "./Save/NFTPioneerDataMgr";
import InnerBuildingDataMgr from "./Save/InnerBuildingDataMgr";

export class SaveData {
    private _pioneersDataMgr: PioneersDataMgr;
    private _nftPioneerDataMgr: NFTPioneerDataMgr;
    private _eraseShadowDataMgr: EraseShadowDataMgr;
    private _mapBuildingDataMgr: MapBuildingDataMgr;
    private _artifactDataMgr: ArtifactDataMgr;
    private _itemDataMgr: ItemDataMgr;
    private _settlementDataMgr: SettlementDataMgr;
    private _userInfoDataMgr: UserInfoDataMgr;
    private _innerBuildingDataMgr: InnerBuildingDataMgr;
    private _taskDataMgr: TaskDataMgr;

    public get pioneer() {
        return this._pioneersDataMgr;
    }

    public get nftPioneer() {
        return this._nftPioneerDataMgr;
    }

    public get eraseShadow() {
        return this._eraseShadowDataMgr;
    }

    public get mapBuilding() {
        return this._mapBuildingDataMgr;
    }
    public get artifact() {
        return this._artifactDataMgr;
    }

    public get item() {
        return this._itemDataMgr;
    }

    public get settlement() {
        return this._settlementDataMgr;
    }

    public get userInfo() {
        return this._userInfoDataMgr;
    }

    public get innerBuilding() {
        return this._innerBuildingDataMgr;
    }

    public get task() {
        return this._taskDataMgr;
    }

    constructor() {
        this._pioneersDataMgr = new PioneersDataMgr();
        this._nftPioneerDataMgr = new NFTPioneerDataMgr();
        this._eraseShadowDataMgr = new EraseShadowDataMgr();
        this._mapBuildingDataMgr = new MapBuildingDataMgr();
        this._artifactDataMgr = new ArtifactDataMgr();
        this._itemDataMgr = new ItemDataMgr();
        this._settlementDataMgr = new SettlementDataMgr();
        this._userInfoDataMgr = new UserInfoDataMgr();
        this._innerBuildingDataMgr = new InnerBuildingDataMgr();
        this._taskDataMgr = new TaskDataMgr();
    }

    public async load(walletAddr: string) {
        this._userInfoDataMgr.loadObj(walletAddr);
        this._taskDataMgr.loadObj();
        this._itemDataMgr.loadObj(walletAddr);
        this._artifactDataMgr.loadObj(walletAddr);
        this._innerBuildingDataMgr.loadObj();
        this._pioneersDataMgr.loadObj();
        this._mapBuildingDataMgr.loadObj();
        this._nftPioneerDataMgr.loadObj();
        this._eraseShadowDataMgr.loadObj();
    }
}
