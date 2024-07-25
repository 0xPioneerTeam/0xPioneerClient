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

    constructor(x: number, y: number, grid: number) {
        this.x = x;
        this.y = y;
        this.grid = grid;
    }
}

@ccclass("OuterShadowController")
export class OuterShadowController extends ViewController {

    _shadowtiles: { [x_yKey: string]: MyTileData } = {};
    _shadowUseComp: { [x_yKey: string]: TileShadowComp } = {};
    _shadowNodeCompsPool: TileShadowComp[] = [];
    _shadowtag: number;
    _shadowcleantag: number;
    _shadowhalftag: number;
    _shadowhalf2tag: number;
    _shadowContentNodes: Node[];

    refreshUI(rect: Rect, rect2: Rect) {
        let pos1 = TileMapHelper.INS.getPosByPixelPos(v3(rect.xMin, rect.yMin));
        let pos2 = TileMapHelper.INS.getPosByPixelPos(v3(rect.xMax, rect.yMax));
        if(!pos1 || !pos2){
            return;
        }
        let bigSize = 2;
        let px1 = pos1.x - bigSize;
        let px2 = pos2.x + bigSize;
        let py1 = pos1.y + bigSize;
        let py2 = pos2.y - bigSize;
        let updateMap: { [uuid: string]: boolean } = {};
        // console.log("refreshUI:" + pos1.x + "," + pos1.y + "->" + pos2.x + "," + pos2.y);
        for (let x = px1; x <= px2; x++) {
            for (let y = py2; y <= py1; y++) {
                let x_yKey = x + '_' + y;
                let shadowData = this._shadowtiles[x_yKey];
                if (!shadowData) {
                    shadowData = new MyTileData(x, y, this._shadowtag);
                    this._shadowtiles[x_yKey] = shadowData;
                }
                if (shadowData.grid == 0) {
                    //empty tileTag
                    continue;
                }
                let drawComp = this._shadowUseComp[x_yKey];
                if (!drawComp) {
                    drawComp = this.getShadowComp();
                    this._shadowUseComp[x_yKey] = drawComp;
                }
                drawComp.updateDrawInfo(x, y, shadowData.grid);
                updateMap[drawComp.node.uuid] = true;
            }
        }
        let nodes = [];
        for (let i = 0; i < this._shadowContentNodes.length; i++) {
            let children = this._shadowContentNodes[i].children;
            if (children.length == 0) {
                continue;
            }
            nodes = nodes.concat(children);
        }
        for (let i = nodes.length - 1; i >= 0; i--) {
            let node = nodes[i];
            if (!updateMap[node.uuid]) {
                let comp = node.getComponent(TileShadowComp);
                this.pushShadowComp(comp);
            }
        }
    }

    Shadow_Init(views: Node[]): void {
        this._shadowcleantag = 0;
        this._shadowtag = 75;
        this._shadowhalftag = 73;
        this._shadowhalf2tag = 74;
        this._shadowtiles = {};
        this._shadowContentNodes = views;
        this._shadowNodeCompsPool = [];
        for (let i = 0; i < 100; i++) {
            let shadowNode = new Node("shadowNode");
            shadowNode.layer = views[0].layer;
            let shadowComp = shadowNode.addComponent(TileShadowComp);
            this._shadowNodeCompsPool.push(shadowComp);
        }
    }

    getShadowComp(): TileShadowComp {
        let shadowComp;
        if (this._shadowNodeCompsPool.length > 0) {
            shadowComp = this._shadowNodeCompsPool.shift();
            let len = this._shadowContentNodes.length;
            for (let i = 0; i < len; i++) {
                if (i == len - 1) {
                    shadowComp.node.setParent(this._shadowContentNodes[i]);
                    break;
                }
                if (this._shadowContentNodes[i].children.length > 200) {
                    continue;
                }
                shadowComp.node.setParent(this._shadowContentNodes[i]);
                break;
            }
        } else {
            let shadowNode = new Node("shadowNode");
            shadowNode.layer = this._shadowContentNodes[0].layer;
            shadowComp = shadowNode.addComponent(TileShadowComp);
            let len = this._shadowContentNodes.length;
            for (let i = 0; i < len; i++) {
                if (i == len - 1) {
                    shadowComp.node.setParent(this._shadowContentNodes[i]);
                    break;
                }
                if (this._shadowContentNodes[i].children.length > 200) {
                    continue;
                }
                shadowComp.node.setParent(this._shadowContentNodes[i]);
                break;
            }
        }
        return shadowComp;
    }

    pushShadowComp(shadowComp: TileShadowComp) {
        shadowComp.node.removeFromParent();
        let x_yKey = shadowComp.tilex + '_' + shadowComp.tiley;
        delete this._shadowUseComp[x_yKey];
        this._shadowNodeCompsPool.push(shadowComp);
    }

    _historyEarses: string[] = []
    Shadow_Earse(pos: TilePos, owner: string, extlen: number = 1, fall: boolean = false): TilePos[] {
        let key = pos.x + '_' + pos.y + '_' + owner + '_' + extlen + '_' + fall;
        if (this._historyEarses.indexOf(key) != -1) {
            return [];
        }
        this._historyEarses.push(key);
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
                        this._shadowtiles[gpos.x + '_' + gpos.y] = s;
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