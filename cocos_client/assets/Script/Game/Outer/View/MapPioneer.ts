import {
    _decorator,
    Component,
    Node,
    Animation,
    Vec2,
    Vec3,
    CCInteger,
    CCFloat,
    TweenAction,
    tween,
    Graphics,
    Color,
    instantiate,
    Sprite,
    Quat,
    UITransform,
    misc,
    Label,
    ProgressBar,
    log,
    v3,
    color,
    Event,
} from "cc";
import { LanMgr } from "../../../Utils/Global";
import { MapPioneerActionType, MapPioneerMoveDirection, MapPioneerObject } from "../../../Const/PioneerDefine";
import { OuterFightView } from "./OuterFightView";
import { DataMgr } from "../../../Data/DataMgr";
import { OuterFightResultView } from "./OuterFightResultView";
import { NetworkMgr } from "../../../Net/NetworkMgr";
import NotificationMgr from "../../../Basic/NotificationMgr";
import { NotificationName } from "../../../Const/Notification";
import GameMusicPlayMgr from "../../../Manger/GameMusicPlayMgr";
const { ccclass, property } = _decorator;

@ccclass("MapPioneer")
export class MapPioneer extends Component {
    @property(Label)
    nameLabel: Label;

    @property(Node)
    speedUpTag: Node;

    private _model: MapPioneerObject = null;
    private _lastStatus: MapPioneerActionType = null;
    private _lastActionEndTimestamp: number = null;
    private _actionTimeStamp: number = 0;
    private _actionTotalTime: number = 0;

    private _fightView: OuterFightView = null;
    private _fightResultView: OuterFightResultView = null;
    private _fightInterval: number = null;
    private _fightAttackerOrigianlData: { id: string; name: string; hp: number; hpmax: number } = null;
    private _fightDefenderOriginalData: { id: string; name: string; hp: number; hpmax: number } = null;

    private _contentView: Node = null;
    private _addingtroopsView: Node = null;
    private _exploringView: Node = null;
    private _eventingView: Node = null;
    private _eventWaitedView: Node = null;
    private _timeCountProgress: ProgressBar = null;
    private _timeCountLabel: Label = null;

    public refreshUI(model: MapPioneerObject) {
        this._model = model;
        this.nameLabel.string = LanMgr.getLanById(this._model.name);
        this._actionTimeStamp = this._model.actionEndTimeStamp;
        this._actionTotalTime = this._actionTimeStamp - model.actionBeginTimeStamp;

        let idleView = null;
        let leftWalkView = null;
        let rightWalkView = null;
        let topWalkView = null;
        let bottomWalkView = null;
        let collectView = null;
        let deadView = null;
        let wakeUpView = null;

        let roleView = null;
        for (const name of this._roleNames) {
            const templeView = this._contentView.getChildByPath("role/" + name);
            templeView.active = name == model.animType;
            if (templeView.active) {
                roleView = templeView;
            }
        }
        if (roleView == null) {
            return;
        }
        roleView.active = true;
        idleView = roleView.getChildByName("idle");
        if (idleView.getChildByName("Common_Player_N_a_01") != null) {
            this._currnetIdleAnim = idleView.getChildByName("Common_Player_N_a_01").getComponent(Animation);
        } else if (idleView.getChildByName("Dual_Blade_N_a") != null) {
            this._currnetIdleAnim = idleView.getChildByName("Dual_Blade_N_a").getComponent(Animation);
        } else if (idleView.getChildByName("Double_Guns_N_a") != null) {
            this._currnetIdleAnim = idleView.getChildByName("Double_Guns_N_a").getComponent(Animation);
        } else if (idleView.getChildByName("Spy_N_a") != null) {
            this._currnetIdleAnim = idleView.getChildByName("Spy_N_a").getComponent(Animation);
        }
        leftWalkView = roleView.getChildByName("walk_left");
        rightWalkView = roleView.getChildByName("walk_right");
        topWalkView = roleView.getChildByName("walk_top");
        bottomWalkView = roleView.getChildByName("walk_bottom");
        collectView = roleView.getChildByName("collect") == null ? null : roleView.getChildByName("collect");

        deadView = roleView.getChildByName("Dead") == null ? null : roleView.getChildByName("Dead");
        wakeUpView = roleView.getChildByName("WakeUp") == null ? null : roleView.getChildByName("WakeUp");

        leftWalkView.active = false;
        rightWalkView.active = false;
        topWalkView.active = false;
        bottomWalkView.active = false;

        if (this._lastStatus != this._model.actionType || this._lastActionEndTimestamp != this._model.actionEndTimeStamp) {
            this._lastStatus = this._model.actionType;
            this._lastActionEndTimestamp = this._model.actionEndTimeStamp;

            idleView.active = false;
            collectView.active = false;
            if (deadView != null) {
                deadView.active = false;
            }
            if (wakeUpView != null) {
                wakeUpView.active = false;
            }

            this._addingtroopsView.active = false;
            this._exploringView.active = false;
            this._eventingView.active = false;
            this._eventWaitedView.active = false;
            this._fightView.node.active = false;
            this._fightResultView.node.active = false;

            switch (this._model.actionType) {
                case MapPioneerActionType.dead:
                    {
                        this._contentView.active = true;
                        deadView.active = true;
                    }
                    break;

                case MapPioneerActionType.wakeup:
                    {
                        this._contentView.active = true;
                        wakeUpView.active = true;
                        wakeUpView.getComponent(Animation).play();
                    }
                    break;

                case MapPioneerActionType.defend:
                    {
                        this._contentView.active = false; // not show
                    }
                    break;

                case MapPioneerActionType.idle:
                    {
                        this._contentView.active = true; // only show
                        idleView.active = true;
                        this._idleCountTime = 0;
                        if (this._currnetIdleAnim != null) {
                            this._currnetIdleAnim.play();
                        }
                    }
                    break;

                case MapPioneerActionType.moving:
                    {
                        this._contentView.active = true; // show
                    }
                    break;

                case MapPioneerActionType.fighting:
                    {
                        this._contentView.active = false;
                    }
                    break;

                case MapPioneerActionType.mining:
                    {
                        this._contentView.active = true;
                        if (collectView != null) {
                            collectView.active = true;
                        }
                    }
                    break;

                case MapPioneerActionType.addingtroops:
                    {
                        this._contentView.active = true;
                        idleView.active = true;
                        this._addingtroopsView.active = true;
                    }
                    break;

                case MapPioneerActionType.exploring:
                    {
                        this._contentView.active = true;
                        idleView.active = true;
                        this._exploringView.active = true;
                    }
                    break;

                case MapPioneerActionType.eventing:
                    {
                        this._contentView.active = true;
                        idleView.active = true;
                    }
                    break;

                case MapPioneerActionType.wormhole:
                    {
                        this._contentView.active = false;
                    }
                    break;

                default:
                    break;
            }

            if (this._model.actionType == MapPioneerActionType.fighting || this._model.actionType == MapPioneerActionType.eventing) {
                if (this._model.fightData != null && this._model.fightData.length > 0) {
                    let attacker = this._model;
                    if (this._model.actionType == MapPioneerActionType.eventing && this._model.actionBuildingId != null) {
                        const currentBuilding = DataMgr.s.mapBuilding.getBuildingById(this._model.actionBuildingId);
                        if (currentBuilding != null && currentBuilding.eventPioneerDatas.has(this._model.id)) {
                            attacker = currentBuilding.eventPioneerDatas.get(this._model.id);
                        }
                    }
                    let defender: MapPioneerObject = null;
                    const fightDatas = this._model.fightData.slice();
                    if (fightDatas[0].attackerId == attacker.id) {
                        defender = DataMgr.s.pioneer.getById(fightDatas[0].defenderId);
                    } else {
                        defender = DataMgr.s.pioneer.getById(fightDatas[0].attackerId);
                    }
                    if (defender != null) {
                        GameMusicPlayMgr.playBeginFightEffect();
                        this._fightAttackerOrigianlData = { id: attacker.id, name: attacker.name, hp: attacker.hp, hpmax: attacker.hpMax };
                        this._fightDefenderOriginalData = { id: defender.id, name: defender.name, hp: defender.hp, hpmax: defender.hpMax };
                        this._fightView.node.active = true;
                        this._fightView.refreshUI(
                            {
                                name: attacker.name,
                                hp: attacker.hp,
                                hpMax: attacker.hpMax,
                            },
                            {
                                name: defender.name,
                                hp: defender.hp,
                                hpMax: defender.hpMax,
                            },
                            true
                        );
                        this._fightInterval = setInterval(() => {
                            if (fightDatas.length <= 0) {
                                clearInterval(this._fightInterval);
                                return;
                            }
                            const data = fightDatas.shift();
                            if (data.attackerId == attacker.id) {
                                // attacker action
                                defender.hp -= data.hp;
                            } else {
                                attacker.hp -= data.hp;
                                NotificationMgr.triggerEvent(NotificationName.MAP_PIONEER_HP_CHANGED);
                            }
                            this._fightView.refreshUI(
                                {
                                    name: attacker.name,
                                    hp: attacker.hp,
                                    hpMax: attacker.hpMax,
                                },
                                {
                                    name: defender.name,
                                    hp: defender.hp,
                                    hpMax: defender.hpMax,
                                },
                                true
                            );
                        }, 250);
                    }
                }
            }
        }

        if (this._model.actionType == MapPioneerActionType.moving) {
            leftWalkView.active = this._model.moveDirection == MapPioneerMoveDirection.left;
            rightWalkView.active = this._model.moveDirection == MapPioneerMoveDirection.right;
            topWalkView.active = this._model.moveDirection == MapPioneerMoveDirection.top;
            bottomWalkView.active = this._model.moveDirection == MapPioneerMoveDirection.bottom;
        }
    }
    public setEventWaitedCallback(callback: () => void) {
        this._eventWaitedCallback = callback;
    }

    public playGetResourceAnim(resourceId: string, num: number, callback: () => void) {
        if (num <= 0) {
            return;
        }
        const animView = instantiate(this._resourceAnimView);
        animView.active = true;
        animView.setParent(this.node);
        const resourceName = ["8001", "8002", "8003", "8004"];
        for (const name of resourceName) {
            animView.getChildByName(name).active = resourceId == name;
        }
        animView.getChildByName("Label").getComponent(Label).string = "+" + num;

        animView.setPosition(v3(0, 90, 0));
        tween()
            .target(animView)
            .delay(this._playingView.length > 0 ? 0.2 : 0)
            .to(0.4, { position: v3(0, 150, 0) })
            .call(() => {
                animView.destroy();
                this._playingView.splice(this._playingView.indexOf(animView), 1);
                if (callback != null) {
                    callback();
                }
            })
            .start();

        this._playingView.push(animView);
    }
    private _eventWaitedCallback: () => void = null;

    private _playingView: Node[] = [];
    private _resourceAnimView: Node = null;

    private _roleNames: string[] = [
        "self",
        "artisan",
        "doomsdayGangBigTeam",
        "doomsdayGangSpy",
        "doomsdayGangTeam",
        "hunter",
        "prophetess",
        "rebels",
        "secretGuard",
    ];
    private _idleAnimTime: number = 4;
    private _idleGapWaitTime: number = 4;
    private _idleCountTime: number = 0;
    private _currnetIdleAnim: Animation = null;
    onLoad() {
        if (this.speedUpTag) {
            this.speedUpTag.active = false;
        }

        this._fightView = this.node.getChildByPath("FightView").getComponent(OuterFightView);
        this._fightView.node.active = false;

        this._fightResultView = this.node.getChildByPath("FightResultView").getComponent(OuterFightResultView);
        this._fightResultView.node.active = false;

        this._contentView = this.node.getChildByPath("Content");

        this._addingtroopsView = this._contentView.getChildByName("Addingtroops");
        this._addingtroopsView.active = false;

        this._exploringView = this._contentView.getChildByName("Exploring");
        this._exploringView.active = false;

        this._eventingView = this._contentView.getChildByName("Eventing");
        this._eventingView.active = false;

        this._eventWaitedView = this._contentView.getChildByName("EventWaited");
        this._eventWaitedView.active = false;

        this._timeCountProgress = this._contentView.getChildByPath("lastTIme/progressBar").getComponent(ProgressBar);
        this._timeCountLabel = this._contentView.getChildByPath("lastTIme/time").getComponent(Label);

        this._resourceAnimView = this._contentView.getChildByName("resourceGetted");
        this._resourceAnimView.active = false;
    }
    start() {}

    protected onEnable(): void {
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_FIGHT_BEGIN, this._onFightBegin, this);
        NotificationMgr.addListener(NotificationName.MAP_PIONEER_FIGHT_END, this._onFightEnd, this);
    }

    protected onDisable(): void {
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_FIGHT_BEGIN, this._onFightBegin, this);
        NotificationMgr.removeListener(NotificationName.MAP_PIONEER_FIGHT_END, this._onFightEnd, this);
    }

    update(deltaTime: number) {
        if (this._currnetIdleAnim != null) {
            this._idleCountTime += deltaTime;
            if (this._idleCountTime >= this._idleAnimTime + this._idleGapWaitTime) {
                this._idleCountTime = 0;
                this._currnetIdleAnim.play();
            } else if (this._idleCountTime >= this._idleAnimTime) {
                this._currnetIdleAnim.stop();
            }
        }
        if (this._model == null) {
            return;
        }
        const currentTimeStamp = new Date().getTime();
        if (this._actionTimeStamp > currentTimeStamp && (this._model.fightData == null || this._model.fightData.length <= 0)) {
            this._timeCountProgress.node.active = true;
            this._timeCountLabel.node.active = true;

            this._timeCountProgress.progress = (this._actionTimeStamp - currentTimeStamp) / this._actionTotalTime;
            this._timeCountLabel.string = ((this._actionTimeStamp - currentTimeStamp) / 1000).toFixed(2) + "s";
        } else {
            this._timeCountProgress.node.active = false;
            this._timeCountLabel.node.active = false;
        }

        // event tip
        if (this._model != null && this._model.actionType == MapPioneerActionType.eventing) {
            this._eventWaitedView.active = currentTimeStamp >= this._model.actionEndTimeStamp;
            this._eventingView.active = currentTimeStamp < this._model.actionEndTimeStamp;
        }
    }

    //----------------- event
    private onTapEventWaited(event: Event) {
        GameMusicPlayMgr.playTapButtonEffect();
        if (this._eventWaitedCallback != null) {
            this._eventWaitedCallback();
        }
    }

    //----------------- notificaiton
    private _onFightBegin(data: { id: string }) {
        if (this._model == null) {
            return;
        }
        if (this._model.id != data.id) {
            return;
        }
        this._model = DataMgr.s.pioneer.getById(data.id);
        this.refreshUI(this._model);
    }
    private _onFightEnd(data: { id: string }) {
        if (this._fightInterval == null) {
            return;
        }
        if (this._model == null) {
            return;
        }
        if (this._model.id != data.id) {
            return;
        }
        if (this._fightAttackerOrigianlData == null || this._fightDefenderOriginalData == null) {
            return;
        }
        if (this._model.fightData != null) {
            for (const data of this._model.fightData) {
                if (data.attackerId == this._fightAttackerOrigianlData.id) {
                    this._fightDefenderOriginalData.hp -= data.hp;
                } else {
                    this._fightAttackerOrigianlData.hp -= data.hp;
                }
            }
        }
        clearInterval(this._fightInterval);
        this._fightView.node.active = false;
        this._fightResultView.node.active = true;
        if (this._model.fightResultWin) {
            GameMusicPlayMgr.playFightWinEffect();
        } else {
            GameMusicPlayMgr.playFightFailEffect();
        }
        this._fightResultView.showResult(this._model.fightResultWin, () => {
            NotificationMgr.triggerEvent(NotificationName.FIGHT_FINISHED, {
                attacker: {
                    name: this._fightAttackerOrigianlData.name,
                    avatarIcon: "icon_player_avatar", // todo
                    hp: this._fightAttackerOrigianlData.hp,
                    hpMax: this._fightAttackerOrigianlData.hpmax,
                },
                defender: {
                    name: this._fightDefenderOriginalData.name,
                    avatarIcon: "icon_player_avatar",
                    hp: this._fightDefenderOriginalData.hp,
                    hpMax: this._fightDefenderOriginalData.hpmax,
                },
                attackerIsSelf: true,
                buildingId: null,
                position: this._model.stayPos,
                fightResult: this._fightAttackerOrigianlData.hp != 0 ? "win" : "lose",
                rewards: [],
            });
            this._fightResultView.node.active = false;
        });
    }
}
