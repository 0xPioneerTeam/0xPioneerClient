export type PioneerLvlupConfigItemId = string;
export type PioneerLvlupConfigItemCount = number;
export interface PioneerLvlupConfigData {
    id: string;
    p_exp: number;
    p_rank_1: [PioneerLvlupConfigItemId, PioneerLvlupConfigItemCount][];
    p_rank_2: [PioneerLvlupConfigItemId, PioneerLvlupConfigItemCount][];
    p_rank_3: [PioneerLvlupConfigItemId, PioneerLvlupConfigItemCount][];
    p_rank_4: [PioneerLvlupConfigItemId, PioneerLvlupConfigItemCount][];
    p_rank_5: [PioneerLvlupConfigItemId, PioneerLvlupConfigItemCount][];
}
