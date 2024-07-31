import { director, game, Rect } from "cc";
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
    grid: number;
    //_shadowcleantag 》》》 fall
    // all owners change fall
    owners: {[key:string]:number} = null;
    // frame time control change grid = fall
    fall: number;

    constructor(x: number, y: number, grid: number) {
        this.x = x;
        this.y = y;
        this.grid = grid;
        this.owners = {};
    }
}

@ccclass("OuterShadowController")
export class OuterShadowController extends ViewController {

    _shadowtiles: { [x_yKey: string]: MyTileData } = {};
    _shadowUseComp: { [x_yKey: string]: TileShadowComp } = {};
    _shadowNodeCompsPool: TileShadowComp[] = [];
    _shadowNodeUpdateMap: { [uuid: string]: TileShadowComp } = {};
    _shadowtag: number;
    _shadowcleantag: number;
    _shadowhalftag: number;
    _shadowhalf2tag: number;
    _shadowContentNodes: Node[];

    refreshUI(rect: Rect, rect2: Rect) {
        if (!this._shadowContentNodes) {
            return;
        }
        let pos1 = TileMapHelper.INS.getPosByPixelPos(v3(rect.xMin, rect.yMin));
        let pos2 = TileMapHelper.INS.getPosByPixelPos(v3(rect.xMax, rect.yMax));
        if (!pos1 || !pos2) {
            return;
        }
        // console.log("refreshUI:" + pos1.x + "," + pos1.y + "->" + pos2.x + "," + pos2.y);
        let bigSize = 2;
        let px1 = pos1.x - bigSize;
        let px2 = pos2.x + bigSize;
        let py1 = pos1.y + bigSize;
        let py2 = pos2.y - bigSize;
        this._shadowNodeUpdateMap = {};
        for (let x = px1; x <= px2; x++) {
            for (let y = py2; y <= py1; y++) {
                let x_yKey = x + '_' + y;
                let shadowData = this._shadowtiles[x_yKey];
                if (!shadowData) {
                    shadowData = new MyTileData(x, y, this._shadowtag);
                    this._shadowtiles[x_yKey] = shadowData;
                }
                let drawComp = this._shadowUseComp[x_yKey];
                if (!drawComp) {
                    drawComp = this.getShadowComp();
                    this._shadowUseComp[x_yKey] = drawComp;
                }
                drawComp.updateDrawInfo(x, y, shadowData.grid);
                this._shadowNodeUpdateMap[drawComp.node.uuid] = drawComp;
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
            if (!this._shadowNodeUpdateMap[node.uuid]) {
                let comp = node.getComponent(TileShadowComp);
                this.pushShadowComp(comp);
            }
        }
    }

    Shadow_Init(views: Node[]): void {
        this._shadowcleantag = 80;
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

    protected viewUpdate(dt: number): void {
        super.viewUpdate(dt);
        //Using frame control to prevent page minimization time calculation errors
        let datanow = director.getTotalFrames();
        for (let key in this._shadowNodeUpdateMap) {
            let comp = this._shadowNodeUpdateMap[key];
            let x_yKey = comp.tilex + '_' + comp.tiley;
            let shadowData = this._shadowtiles[x_yKey];
            if (shadowData && shadowData.fall && shadowData.grid != shadowData.fall) {
                let timeOut = true;
                for(let onwer in shadowData.owners){
                    if (datanow - shadowData.owners[onwer] < 60) {
                        timeOut = false;
                    }
                }
                if(timeOut){
                    shadowData.grid = shadowData.fall;
                    shadowData.fall = 0;
                    shadowData.owners = {};
                }
                comp.updateDrawInfo(comp.tilex, comp.tiley, shadowData.grid);
            }
        }
    }

    _historyEarsesMap: Map<string, { tiles: MyTileData[], lastuse: number }> = new Map();

    Shadow_Earse(pos: TilePos, owner: string, extlen: number = 1) {
        let datanow = director.getTotalFrames();
        let key = pos.x + '_' + pos.y + '_' + owner + '_' + extlen;
        if (this._historyEarsesMap.has(key)) {
            let data = this._historyEarsesMap.get(key);
            data.lastuse = datanow;
            data.tiles.forEach(t => {
                t.owners[owner] = datanow;
            });
            return;
        }
        let shadowDatas = [];
        for (var y = pos.y - extlen; y <= pos.y + extlen; y++) {
            for (var x = pos.x - extlen; x <= pos.x + extlen; x++) {
                var gpos = TileMapHelper.INS.getPos(x, y);
                var len = TileMapHelper.INS.Path_DistPos(pos, gpos);
                if (len > extlen) {
                    continue;
                }
                if (gpos != null) {
                    var s = this._shadowtiles[gpos.x + '_' + gpos.y];
                    if (s == null) {
                        s = new MyTileData(gpos.x, gpos.y, this._shadowtag);
                        this._shadowtiles[gpos.x + '_' + gpos.y] = s;
                    }
                    shadowDatas.push(s);
                    var border = extlen > 1 && (len == extlen);
                    if (border) {
                        if(s.grid == this._shadowcleantag){
                            for(let ownerkey in s.owners){
                                if(ownerkey != owner){
                                    //not self
                                    border = false;
                                }
                            }
                        }
                    }
                    s.grid = border?this._shadowhalftag:this._shadowcleantag;
                    s.owners[owner] = datanow;
                    s.fall = this._shadowhalf2tag;
                }
            }
        }
        this._historyEarsesMap.set(key, { tiles: shadowDatas, lastuse: datanow });
        if (this._historyEarsesMap.size > 100) {
            let keys = Array.from(this._historyEarsesMap.keys());
            for (let i = 0; i < keys.length; i++) {
                const eleKey = keys[i];
                let data = this._historyEarsesMap.get(eleKey);
                if (data.lastuse < datanow - 60*60*5) {
                    this._historyEarsesMap.delete(eleKey);
                }
            }
        }
    }


    tiledMapIsAllBlackShadow(x: number, y: number): boolean {
        let key = x + "_" + y;
        let s = this._shadowtiles[key];
        if (s) {
            return s.grid == this._shadowtag;
        }
        return true;
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