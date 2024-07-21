import { Vec2, Vec3 } from "cc";
import { MapBuildingType } from "./BuildingDefine";

export interface MapDecorateData {
    url: any;
    name:string;
    show:boolean;
    positions:Vec3;
    rotation:Vec3;
    scale:Vec3;
    children:DecorateData[];
}

export interface DecorateData {
    url: string;
    name:string;
    show:boolean;
    positions:Vec3;
    rotation:Vec3;
    scale:Vec3;
    block:boolean;
    blockData:Vec2[];
}
