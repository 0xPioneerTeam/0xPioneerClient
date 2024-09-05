import { Vec2 } from "cc";
import CLog from "../../Utils/CLog";
import NetGlobalData from "./Data/NetGlobalData";

export class EraseShadowDataMgr {
    private _data: Vec2[];
    private _detects: Vec2[];

    public constructor() {}

    public async loadObj() {
        this._initData();
    }

    public getEraseObj() {
        return this._data;
    }
    public getDetectObj() {
        return this._detects;
    }

    public addEraseObj(data: Vec2) {
        this._data.push(data);
    }
    public addDetectObj(data: Vec2) {
        this._detects.push(data);
    }

    private _initData() {
        this._data = [];
        this._detects = [];
        if (NetGlobalData.shadows != null) {
            const shadows = NetGlobalData.shadows;
            for (let i = 0; i < shadows.length; i++) {
                this._data.push(new Vec2(shadows[i].x, shadows[i].y));
            }
        }
        if (NetGlobalData.detects != null) {
            const detects = NetGlobalData.detects;
            for (let i = 0; i < detects.length; i++) {
                this._detects.push(new Vec2(detects[i].x, detects[i].y));
            }
        }
    }
}
