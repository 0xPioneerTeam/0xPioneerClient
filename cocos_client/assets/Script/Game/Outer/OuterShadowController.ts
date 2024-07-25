import { Rect } from "cc";
import ViewController from "../../BasicView/ViewController";
import { _decorator, Color, Details, instantiate, math, Node, pingPong, Prefab, UITransform, v2, v3, Vec2, Vec3 } from "cc";
import { TileShadowComp } from "../TiledMap/TileShadowComp";
import { TileMapHelper, TilePos } from "../TiledMap/TileTool";
import { GameMgr } from "../../Utils/Global";
import { GameExtraEffectType } from "../../Const/ConstDefine";
import GameMainHelper from "../Helper/GameMainHelper";


const { ccclass, property } = _decorator;

export class MyTileData {
    x: number;
    y: number;
    fall: number;
    grid: number = -1;
    timer: number = 0;
    owner: string = null;
    drawComp: TileShadowComp = null;

    constructor(x: number, y: number, grid: number) {
        this.x = x;
        this.y = y;
        this.grid = grid;
    }
}

@ccclass("OuterShadowController")
export class OuterShadowController extends ViewController {

    _shadowtiles: { [x_yKey: string]: MyTileData } = {};
    _shadowNodeCompsPool: TileShadowComp[] = [];
    _shadowtag: number;
    _shadowcleantag: number;
    _shadowhalftag: number;
    _shadowhalf2tag: number;
    _shadowContentNode: Node;

    refreshUI(rect: Rect, rect2: Rect) {
        let pos1 = TileMapHelper.INS.getPosByPixelPos(v3(rect.xMin, rect.yMax));
        let pos2 = TileMapHelper.INS.getPosByPixelPos(v3(rect.xMax, rect.yMin));
        let updateList = [];
        console.log("refreshUI:" + pos1.x + "," + pos1.y + "->" + pos2.x + "," + pos2.y);
        for (let x = pos1.x - 1; x <= pos2.x; x++) {
            for (let y = pos1.y - 1; y <= pos2.y; y++) {
                let x_yKey = x + '_' + y;
                let shadowData = this._shadowtiles[x_yKey];
                if(!shadowData){
                    shadowData = new MyTileData(x, y, this._shadowtag);
                    this._shadowtiles[x_yKey] = shadowData;
                }
                let drawComp = shadowData.drawComp;
                if(!drawComp){
                    drawComp = this.getShadowComp();
                    shadowData.drawComp = drawComp;
                }
                drawComp.updateDrawInfo(x, y, shadowData.grid);
                updateList.push(drawComp.node.uuid);
            }
        }
        let nodes = this._shadowContentNode.children;
        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i];
            if (node.active && updateList.indexOf(node.uuid) == -1) {
                node.active = false;
                let comp = node.getComponent(TileShadowComp);
                let x_yKey = comp.tilex + '_' + comp.tiley;
                let shadowData = this._shadowtiles[x_yKey];
                if(shadowData){
                    shadowData.drawComp = null;
                }
                this.pushShadowComp(comp);
            }
        }
    }

    Shadow_Init(view: Node): void {
        this._shadowcleantag = 0;
        this._shadowtag = 75;
        this._shadowhalftag = 73;
        this._shadowhalf2tag = 74;
        this._shadowtiles = {};
        this._shadowContentNode = view;
        this._shadowNodeCompsPool = [];
        for (let i = 0; i < 100; i++) {
            let shadowNode = new Node("shadowNode");
            shadowNode.layer = view.layer;
            let shadowComp = shadowNode.addComponent(TileShadowComp);
            shadowNode.active = false;
            shadowNode.setParent(this._shadowContentNode);
            this._shadowNodeCompsPool.push(shadowComp);
        }
    }

    getShadowComp(): TileShadowComp {
        let shadowComp;
        if (this._shadowNodeCompsPool.length > 0) {
            shadowComp = this._shadowNodeCompsPool.shift();
            shadowComp.node.active = true;
        }else{
            let shadowNode = new Node("shadowNode");
            shadowNode.layer = this._shadowContentNode.layer;
            shadowComp = shadowNode.addComponent(TileShadowComp);
            shadowNode.setParent(this._shadowContentNode);
        }
        return shadowComp;
    }

    pushShadowComp(shadowComp: TileShadowComp) {
        this._shadowNodeCompsPool.push(shadowComp);
    }

    Shadow_Earse(pos: TilePos, owner: string, extlen: number = 1, fall: boolean = false): TilePos[] {
        //console.log("pos=" + pos.x + "," + pos.y + ":" + pos.worldx + "," + pos.worldy);
        //for (var z = pos.calc_z - extlen; z <= pos.calc_z + extlen; z++) {
        const newCleardPositons: TilePos[] = [];
        const borderTilePostions: TilePos[] = [];
        let vx = 10000;
        let vy = 10000;
        for (var y = pos.y - extlen; y <= pos.y + extlen; y++) {
            for (var x = pos.x - extlen; x <= pos.x + extlen; x++) {
                var gpos = TileMapHelper.INS.getPos(x, y);
                // console.log("calcpos=" + x + "," + y + "," + z + "->" + gpos.x + "," + gpos.y);
                if (gpos != null) {
                    if (vx > gpos.x) vx = gpos.x;
                    if (vy > gpos.y) vy = gpos.y;
                    var s = this._shadowtiles[gpos.x + '_' + gpos.y];
                    if (s == null) {
                        s = new MyTileData(gpos.x, gpos.y, this._shadowtag);
                        this._shadowtiles[gpos.x + '_' + gpos] = s;
                    }
                    // console.log("find node-" + s.x + "," + s.y + " wpos=" + gpos.worldx + "," + gpos.worldy);
                    if (!fall) {
                        if (s.grid == 0 && s.owner != null && s.owner != owner) {
                            s.timer = 0;
                            continue; //Strengthen other people’s vision
                        }
                        if (s.grid == this._shadowtag) {
                            newCleardPositons.push(gpos);
                        }
                        s.grid = this._shadowcleantag;

                        if (extlen > 1) {
                            var border = Math.abs(pos.x - x) == extlen || Math.abs(pos.y - y) == extlen;
                            if (border) {
                                s.grid = this._shadowhalftag;
                                borderTilePostions.push(gpos);
                            }
                        }
                        s.owner = owner;
                        s.fall = this._shadowhalf2tag;
                        s.timer = 0; //Fully open first, then the timing becomes semi-transparent
                    } else {
                        s.grid = this._shadowhalf2tag;
                        s.fall = -1;
                        s.timer = 0;
                    }
                    //s.grid = 0;//0 is full open
                }
            }
        }

        // update user tile for border tiles
        // if (this._shadowBorderPfb) {
        // this._ShadowBorder_Reset();
        // for (let i = 0; i < borderTilePostions.length; ++i) {
        //     let borderPos = borderTilePostions[i];
        //     let borderNode = this._Fetch_ShadowBorderNode();
        //     borderNode.setWorldPosition(v3(borderPos.worldx, borderPos.worldy, 0));
        //     this._shadowLayer.addUserNode(borderNode);
        //     this._usedSHadowBorders.push(borderNode);
        //     let bnSpr: cc.Sprite = borderNode.getComponent(cc.Sprite);
        //     bnSpr.customMaterial.setProperty("dissolveThreshold", 0.5); // TO DO : calc disolve threshold by distance from player
        // }
        // }

        // this._tilemap.getLayer("shadow").updateViewPort(vx, vy, extlen * 2 + 1, extlen * 2 + 1);
        return newCleardPositons;
    }


    tiledMapIsAllBlackShadow(x: number, y: number): boolean {
        let key = x + "_" + y;
        let s = this._shadowtiles[key];
        if (s) {
            return s.grid == this._shadowtag;
        }
        return false;
    }

    Shadow_GetClearedTiledPositons(): TilePos[] {
        const positions = [];
        for (const key in this._shadowtiles) {
            let tiles = this._shadowtiles[key];
            if (tiles.grid != this._shadowtag) {
                positions.push(TileMapHelper.INS.getPos(tiles.x, tiles.y));
            }
        }
        return positions;
    }

    Shadow_Reset() {
        for (const key in this._shadowtiles) {
            this._shadowtiles[key].grid = this._shadowtag;
            this._shadowtiles[key].fall = -1;
        }
    }

}