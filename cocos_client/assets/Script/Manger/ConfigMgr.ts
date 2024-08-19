import AbiConfig from "../Config/AbiConfig";
import ArtifactConfig from "../Config/ArtifactConfig";
import ArtifactEffectConfig from "../Config/ArtifactEffectConfig";
import BigMapConfig from "../Config/BigMapConfig";
import BoxInfoConfig from "../Config/BoxInfoConfig";
import ChainConfig from "../Config/ChainConfig";
import ConfigConfig from "../Config/ConfigConfig";
import DropConfig from "../Config/DropConfig";
import EvaluationConfig from "../Config/EvaluationConfig";
import EventConfig from "../Config/EventConfig";
import InnerBuildingConfig from "../Config/InnerBuildingConfig";
import InnerBuildingLvlUpConfig from "../Config/InnerBuildingLvlUpConfig";
import ItemConfig from "../Config/ItemConfig";
import LanConfig from "../Config/LanConfig";
import LvlupConfig from "../Config/LvlupConfig";
import MissionConfig from "../Config/MissionConfig";
import NewEventConfig from "../Config/NewEventConfig";
import NewSubEventConfig from "../Config/NewSubEventConfig";
import NFTPioneerConfig from "../Config/NFTPioneerConfig";
import NFTPioneerNameConfig from "../Config/NFTPioneerNameConfig";
import NFTSkillConfig from "../Config/NFTSkillConfig";
import NFTSkillEffectConfig from "../Config/NFTSkillEffectConfig";
import PioneerConfig from "../Config/PioneerConfig";
import PioneerLvlupConfig from "../Config/PioneerLvlupConfig";
import ProtobufConfig from "../Config/ProtobufConfig";
import TalkConfig from "../Config/TalkConfig";
import TaskConfig from "../Config/TaskConfig";
import TaskStepConfigData from "../Config/TaskStepConfig";
import TroopsConfig from "../Config/TroopsConfig";
import WorldBoxConfig from "../Config/WorldBoxConfig";

export default class ConfigMgr {
    public static async init(): Promise<boolean> {
        if (!(await ArtifactConfig.init())) return false;
        if (!(await ArtifactEffectConfig.init())) return false;
        if (!(await BoxInfoConfig.init())) return false;
        if (!(await ChainConfig.init())) return false;
        if (!(await ConfigConfig.init())) return false;
        if (!(await DropConfig.init())) return false;
        if (!(await EvaluationConfig.init())) return false;
        if (!(await EventConfig.init())) return false;
        if (!(await NewEventConfig.init())) return false;
        if (!(await NewSubEventConfig.init())) return false;
        if (!(await InnerBuildingConfig.init())) return false;
        if (!(await InnerBuildingLvlUpConfig.init())) return false;
        if (!(await ItemConfig.init())) return false;
        if (!(await LanConfig.init())) return false;
        if (!(await LvlupConfig.init())) return false;
        if (!(await PioneerLvlupConfig.init())) return false;
        if (!(await NFTPioneerConfig.init())) return false;
        if (!(await NFTPioneerNameConfig.init())) return false;
        if (!(await NFTSkillConfig.init())) return false;
        if (!(await NFTSkillEffectConfig.init())) return false;
        if (!(await PioneerConfig.init())) return false;
        if (!(await TalkConfig.init())) return false;
        if (!(await TaskConfig.init())) return false;
        if (!(await MissionConfig.init())) return false;
        if (!(await TaskStepConfigData.init())) return false;
        if (!(await TroopsConfig.init())) return false;
        if (!(await WorldBoxConfig.init())) return false;
        if (!(await BigMapConfig.init())) return false;

        // abi
        const chainIdConfig = ChainConfig.getCurrentConfigId();
        if (Number(chainIdConfig) > 0) {
            const chainConf = ChainConfig.getByChainId(chainIdConfig);
            if (!(await AbiConfig.init(chainConf.abi))) return false;
        }

        // protobuf
        if (!(await ProtobufConfig.init())) return false;

        return true;
    }
}
