// natrium
// license : MIT
// author : Sean Chen

export enum ServerErrorCode {
    ResOK = 1,
    ResUnknown = 0,

    ResInternalError = -1,
    ResDatacompCreateError = -2,
    ResMsgParamError = -3,
    ResNotGM = -4,
    ResSysBlock = -5,

    ResAlreadyLogin = -1001,
    ResCreatePlayerError = -1002,
    ResLoinedOtherUid = -1003,
    ResLoginTokenError = -1004,
    ResServiceWrong = -1005,
    ResCreatePlayerAlreadyExist = -1006,
    ResUserLoginedByOther = -1007,
    ResUserNotExist = -1008,
    ResSessionNotLogin = -1009,
    ResServiceSessionNotExist = -1010,
    ResServicePlayerNotExist = -1011,
    ResPlayerDataNotExist = -1012,
    ResPlayerFirstInitError = -1013,
    ResPlayerToMapPointNotExist = -1014,
    ResTargetPlayerNotExist = -1015,
    ResPlayerUnspendTxNotFindYet = -1016,
    ResPlayerUnspendTxAlreadyUsed = -1017,
    ResPlayerFeeConfError = -1018,
    ResPlayerNameAlreadyExist = -1019,
    ResPlayerPackageTypeUsed = -1020,
}