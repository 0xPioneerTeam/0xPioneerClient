export enum Icombat_battle_action_type {
    combatbegin = "combatbegin",
    roundbegin = "roundbegin",
    attack = "attack",
    spirit = "spirit",
    triggereffect = "triggereffect",
}
export enum Icombat_battle_effect_type {
    talent = 1,
    spirit = 2,
    buff = 3,
}

export enum Icombat_battle_change_type {
    rate = 1,
    value = 2,
}
export enum Icombat_battle_hp_change_type {
    all = 1,
    hp = 2,
    hpmax = 3,
}
export enum Icombat_battle_shield_change_type {
    hpmax = 1,
    hp = 2,
}
export enum Ieffect_run_action_type {
    BuffChange,
    DamageChange,
    AttackPowerChange,
    AttackPowerValueChange,
    SpiritChange,
    SpiritRateChange,
    HpChange,
    ShieldChange,
    BeAttackDamgeChange,
    noAttackRoundChange,
    AttackAction,
    AttackExtraDamage,
    BeInstantKill,
    noSpiritRoundChange,
    HpChangeByRoundDamage,
    Rebirth,
}
export interface Icombat_battle_attack {
    resultDamage: number;
    destroyShield: number;
}
export interface Icombat_battle_spirit {
    /**
     * 1-spirit round  2-be attacked
     */
    type: number;
    spiritchange: number;
}
export interface Icombat_battle_effect {
    type: Ieffect_run_action_type;
    effectid: string;

    buffid?: string;
    damageChange?: Icombat_battle_effect_damage_change;
    attackPowerChange?: Icombat_battle_effect_attackpower_change;
    spiritChange?: number;
    hpChange?: Icombat_battle_effect_hp_change;
    shieldChange?: number;
    beAttackDamageChange?: Icombat_battle_effect_beattackdamage_change;
    noAttackRound?: number;
    attackAction?: Icombat_battle_attack;
    attackExtraDamage?: Icombat_battle_attack;
    noSpiritRound?: number;
}
export interface Icombat_battle_effect_damage_change {
    rate: number;
    effectRound: number;
}
export interface Icombat_battle_effect_attackpower_change {
    effectRound: number;
    changeType: Icombat_battle_change_type;
    num: number;
}
export interface Icombat_battle_effect_hp_change {
    healthChange: number;
    healthMaxChange: number;
}
export interface Icombat_battle_effect_shield_change {
    value: number;
    effectRound: number; //shield need effect round, wait TODO
}
export interface Icombat_battle_effect_beattackdamage_change {
    rate: number;
    effectRound: number;
}

export interface Icombat_battle_reprot_item {
    actionUniqueid: string;
    targetUniqueid: string;
    actionType: Icombat_battle_action_type;

    attack?: Icombat_battle_attack;
    spirit?: Icombat_battle_spirit;
    effect?: Icombat_battle_effect;
}
