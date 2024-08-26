import { ItemConfigType } from "./Item";

export interface GuideConfigData {
    id: string;
    name: string;
    pre_guide: number;
    guide_stepInfo: string;
    next_guide: number;
    guidestepgroup: number;
    pre_content: [number, number];
    fin_content: [number];
}
