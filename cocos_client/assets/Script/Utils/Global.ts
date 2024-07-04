import af from "../Manger/ArtifactMgr";
import br from "../Manger/BattleReportsMgr";
import ev from "../Manger/EvaluationMgr";
import im from "../Manger/ItemMgr";
import l from "../Manger/LanMgr";
import locad from "../Manger/LocalDataLoader";
import p from "../Manger/PioneerMgr";
import user from "../Manger/UserInfoMgr";
import game from "../Manger/GameMgr";
import clvl from "../Manger/CLvlMgr";
import back from "../Manger/BackpackMgr";

import audio from "../Basic/AudioMgr";
import res from "../Basic/ResourcesMgr";

const ArtifactMgr = new af();
const EvaluationMgr = new ev();
const ItemMgr = new im();
const LanMgr = new l();
const LocalDataLoader = new locad();
const PioneerMgr = new p();
const UserInfoMgr = new user();
const BattleReportsMgr = new br();
const GameMgr = new game();
const ClvlMgr = new clvl();
const BackpackMgr = new back();

const AudioMgr = new audio();
const ResourcesMgr = new res();

export {
    // game
    LocalDataLoader,
    ArtifactMgr,
    BattleReportsMgr,
    EvaluationMgr,
    ItemMgr,
    LanMgr,
    PioneerMgr,
    UserInfoMgr,
    GameMgr,
    ClvlMgr,
    BackpackMgr,

    // system
    AudioMgr,
    ResourcesMgr,
};
