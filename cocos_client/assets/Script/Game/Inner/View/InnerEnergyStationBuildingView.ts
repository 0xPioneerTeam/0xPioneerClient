import { Label, Layout, Node, _decorator, v3 } from "cc";
import { InnerBuildingView } from "./InnerBuildingView";
import { UIHUDController } from "../../../UI/UIHUDController";
import { GameMgr, ItemMgr, LanMgr } from "../../../Utils/Global";
import NotificationMgr from "../../../Basic/NotificationMgr";
import { UserInnerBuildInfo } from "../../../Const/BuildingDefine";
import InnerBuildingLvlUpConfig from "../../../Config/InnerBuildingLvlUpConfig";
import { UIName } from "../../../Const/ConstUIDefine";
import ItemData from "../../../Const/Item";
import { NotificationName } from "../../../Const/Notification";
import { GameExtraEffectType, ResourceCorrespondingItem } from "../../../Const/ConstDefine";
import UIPanelManger from "../../../Basic/UIPanelMgr";
import { DataMgr } from "../../../Data/DataMgr";
import { NetworkMgr } from "../../../Net/NetworkMgr";
import LvlupConfig from "../../../Config/LvlupConfig";
import GameMusicPlayMgr from "../../../Manger/GameMusicPlayMgr";

const { ccclass, property } = _decorator;

@ccclass("InnerEnergyStationBuildingView")
export class InnerEnergyStationBuildingView extends InnerBuildingView {
    private _limitGetTimes: number = 3;

    private _produceInfoView: Node = null;
    private _getInfoView: Node = null;

    public async refreshUI(building: UserInnerBuildInfo, canAction: boolean = true) {
        await super.refreshUI(building, canAction);

        this._viewRefresh();
    }
    //-------------------------------------------------lifecycle
    protected innerBuildingLoad(): void {
        super.innerBuildingLoad();

        this._produceInfoView = this.node.getChildByName("InfoView");
        this._produceInfoView.active = false;

        this._getInfoView = this.node.getChildByName("GetInfoView");

        NetworkMgr.websocket.on("fetch_user_psyc_res", this._onFetchUserPsycRes);
        NetworkMgr.websocket.on("player_exp_change", this._onPlayerExpChange);
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();
    }

    protected async innerBuildingTaped(): Promise<void> {
        super.innerBuildingTaped();
        if (this._building == null) {
            return;
        }
        if (this._building.buildLevel > 0) {
            
        }
    }

    //------------------------------- function
    // private _countingGenerate() {
    //     if (this._building == null) {
    //         return;
    //     }
    //     const generateInfoData = DataMgr.s.userInfo.data.generateEnergyInfo;
    //     if (this._building.buildLevel > 0 && generateInfoData != null) {
    //         const generateConfig = InnerBuildingLvlUpConfig.getEnergyLevelData(this._building.buildLevel);
    //         if (generateConfig != null) {
    //             this._produceInfoView.active = true;
    //             // userlanMgr
    //             // this._produceInfoView.getChildByPath("TopContent/Title").getComponent(Label).string = LanMgr.getLanById("201003");
    //             // this._produceInfoView.getChildByPath("BottomContent/Title").getComponent(Label).string = LanMgr.getLanById("201003");
    //             // this._produceInfoView.getChildByPath("BottomContent/Gap").getComponent(Label).string = LanMgr.getLanById("201003");
    //             this._produceInfoView.getChildByPath("TopContent/CurrentNum").getComponent(Label).string = generateInfoData.totalEnergyNum.toString();
    //             this._produceInfoView.getChildByPath("TopContent/MaxNum").getComponent(Label).string = generateConfig.storage.toString();

    //             if (generateInfoData.totalEnergyNum >= generateConfig.storage) {
    //                 this._produceInfoView.getChildByPath("BottomContent").active = false;
    //             } else {
    //                 this._produceInfoView.getChildByPath("BottomContent").active = true;
    //                 this._produceInfoView.getChildByPath("BottomContent/CurrentTime").getComponent(Label).string = generateInfoData.countTime.toString();
    //                 // output
    //                 let showOutput: string = generateConfig.output.toString();
    //                 // output after effect
    //                 const afterEffectOutput = GameMgr.getAfterExtraEffectPropertyByBuilding(this._building.buildType, GameExtraEffectType.ENERGY_GENERATE, generateConfig.output);
    //                 // output gap
    //                 const gapNum: number = afterEffectOutput - generateConfig.output;
    //                 if (gapNum > 0) {
    //                     showOutput += ("+" + gapNum);
    //                 }
    //                 this._produceInfoView.getChildByPath("BottomContent/PerNum").getComponent(Label).string = showOutput;
    //             }
    //         }

    //     } else {
    //         this._produceInfoView.active = false;
    //     }
    // }
    private _viewRefresh() {
        this._getInfoView.active = false;
        if (this._building.buildLevel > 0) {
            this._getInfoView.active = true;

            const infoViewY = InnerBuildingLvlUpConfig.getBuildingLevelData(this._building.buildLevel, "info_y_energy");
            if (infoViewY != null) {
                this._produceInfoView.position = v3(0, infoViewY, 0);
                this._getInfoView.position = v3(0, infoViewY, 0);
            }
            // get energy num
            let perEnergyGetNum: number = InnerBuildingLvlUpConfig.getBuildingLevelData(this._building.buildLevel, "psyc_output");
            if (perEnergyGetNum == null) {
                perEnergyGetNum = 1;
            }
            const orginalNum: number = perEnergyGetNum;
            perEnergyGetNum = GameMgr.getAfterEffectValue(GameExtraEffectType.ENERGY_GENERATE, perEnergyGetNum);
            const effectNum: number = perEnergyGetNum - orginalNum;
            const showGetString: string = orginalNum + (effectNum > 0 ? ("(" + effectNum + ")") : "");

            this._getInfoView.getChildByPath("TopContent/CurrentNum").getComponent(Label).string = showGetString;
            this._getInfoView.getChildByPath("TopContent").getComponent(Layout).updateLayout();

            this._limitGetTimes = DataMgr.s.userInfo.data.energyGetLimitTimes;
            this._getInfoView.getChildByPath("BottomContent/CurrentTime").getComponent(Label).string = DataMgr.s.userInfo.data.energyDidGetTimes.toString();
            this._getInfoView.getChildByPath("BottomContent/PerNum").getComponent(Label).string = this._limitGetTimes.toString();
            this._getInfoView.getChildByPath("BottomContent").getComponent(Layout).updateLayout();
        }
    }
    //------------------------------- action
    private onTapGetEnergy() {
        GameMusicPlayMgr.playTapButtonEffect();
        if (DataMgr.s.userInfo.data.energyDidGetTimes >= this._limitGetTimes) {
            // useLanMgr
            // UIHUDController.showCenterTip(LanMgr.getLanById("201003"));
            UIHUDController.showCenterTip("No PSYC to collect");
            return;
        }
        NetworkMgr.websocketMsg.fetch_user_psyc({});
    }
    // private onTapGetPSYC() {
    // if (this._building.upgradeTotalTime > 0) {
    //     UIHUDController.showCenterTip(LanMgr.getLanById("201003"));
    //     // UIHUDController.showCenterTip("The building is being upgraded, please wait.");
    //     return;
    // }
    // if (DataMgr.s.userInfo.data.generateEnergyInfo == null) {
    //     return;
    // }
    // const produceNum: number = DataMgr.s.userInfo.data.generateEnergyInfo.totalEnergyNum;
    // if (produceNum <= 0) {
    //     // useLanMgr
    //     // UIHUDController.showCenterTip(LanMgr.getLanById("201003"));
    //     UIHUDController.showCenterTip("No PSYC to collect");
    //     return;
    // }
    // }
    //------------------------------- notification
    private _onFetchUserPsycRes = (e: any) => {
        this._viewRefresh();
    }
    private _onPlayerExpChange = (e: any) => {
        this._viewRefresh();
    }
}
