import { share } from "../../../Net/msg/WebsocketMsg";

export default class NetGlobalData {
    public static userInfo: share.Iplayer_sinfo = null;
    public static innerBuildings: share.Ibuilding_data[] = null;
    public static storehouse: share.Istorehouse_data = null;
    public static artifacts: share.Iartifact_data = null;
    public static usermap: share.Iusermap_data = null;
    public static nfts: share.Infts_data = null;
    public static mapBuildings: share.Imap_info_data = null;
    public static tasks: share.Itask_data[] = null;
    public static shadows: share.pos2d[] = null;
    public static wormholeAttackBuildingId: string = null;

    public static worldTreasureGetted: boolean = false;
}