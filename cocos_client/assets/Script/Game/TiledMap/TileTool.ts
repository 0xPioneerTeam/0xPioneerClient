import { instantiate, Intersection2D, Node, Prefab, SpriteFrame, TiledLayer, TiledMap, v2, v3, Vec2, Vec3 } from "cc";
import { TileShadowComp } from "./TileShadowComp";

export enum TileHexDirection {
    LeftTop = 0,
    Left = 1,
    LeftBottom = 2,
    RightTop = 3,
    Right = 4,
    RightBottom = 5,
}

export enum TileMapType {
    /**
     * @en Orthogonal orientation.
     * @property ORTHO
     * @type {Number}
     * @static
     */
    ORTHO = 0,
    /**
     * @en Hexagonal orientation.
     * @property HEX
     * @type {Number}
     * @static
     */
    HEX = 1,
    /**
     * Isometric orientation.
     * @property ISO
     * @type {Number}
     * @static
     */
    ISO = 2,
}
export class TilePos {
    x: number;
    y: number;

    pixel_x:number;
    pixel_y:number;

    calc_x: number;
    calc_y: number;
    calc_z: number;

    worldx: number;
    worldy: number;
    toInfo(): string {
        return this.worldx + "," + this.worldy + "\n" + this.calc_x + "," + this.calc_y + "," + this.calc_z;
    }
    toInfoSingleLine(): string {
        return this.worldx + "," + this.worldy + " " + this.calc_x + "," + this.calc_y + "," + this.calc_z;
    }

    static _hexPoints = [[-64, 32], [-64, -32], [0, -64], [64, -32], [64, 32], [0, 64]];
    static _hexVec6: Vec2[];

    /**
     * hex 6 point contain world point
     * @param worldPx 
     * @param worldPy 
     * @returns 
     */
    constained(worldPx: number, worldPy: number): boolean {
        if (!TilePos._hexVec6) {
            TilePos._hexVec6 = [];
            TilePos._hexPoints.forEach(v => {
                TilePos._hexVec6.push(v2(v[0], v[1]));
            })
        }
        return Intersection2D.pointInPolygon(v2(worldPx - this.worldx, worldPy - this.worldy), TilePos._hexVec6);
    }

    g: number;
    h: number;
}

export interface IDynamicBlock {
    get TileX(): number;
    get TileY(): number;
    get canMoveTo(): boolean;
}

export class MyTileData {
    x: number;
    y: number;
    fall: number
    grid: number = -1;
    timer: number = 0;
    owner: string = null;

    constructor(x: number, y: number, grid: number) {
        this.x = x;
        this.y = y;
        this.grid = grid;
    }
}
const _vec3_temp = new Vec3();
const _vec3_temp2 = new Vec3();

export class TileMapHelper {
    constructor(tilemap: TiledMap) {
        TileMapHelper._instance = this;
        this._tilemap = tilemap;
        this.width = tilemap.getMapSize().width;
        this.height = tilemap.getMapSize().height;
        this.tilewidth = tilemap.getTileSize().width;
        this.tileheight = tilemap.getTileSize().height;
        this.type = tilemap.getMapOrientation() as number as TileMapType;
        if (this.type == TileMapType.ORTHO) {
            this.pixelwidth = this.tilewidth * this.width;
            this.pixelheight = this.tileheight * this.height;
        } else if (this.type == TileMapType.HEX) {
            this.pixelwidth = this.tilewidth * this.width + this.tilewidth * 0.5;
            this.pixelheight = this.tileheight * this.height * 0.75 + this.tileheight / 4;
        }
        this.InitPos();
    }

    private _tilemap: TiledMap;
    private _pos: { [x_yKey: string]: TilePos };
    width: number;
    height: number;
    tilewidth: number;
    tileheight: number;
    pixelwidth: number;
    pixelheight: number;

    type: TileMapType;

    _shadowtiles: { [x_yKey: string]: MyTileData } = {};
    _shadowNodeCompsPool:TileShadowComp[] = [];
    _shadowtag: number;
    _shadowcleantag: number;
    _shadowhalftag: number;
    _shadowhalf2tag: number;
    _shadowContentNode: Node;
    protected _shadowBorderPfb: Prefab;
    protected _freeShadowBorders: Node[] = [];
    protected _usedSHadowBorders: Node[] = [];

    private static _instance: TileMapHelper;

    static get INS(): TileMapHelper {
        return this._instance;
    }

    getShadowComp(): TileShadowComp {
        if(this._shadowNodeCompsPool.length> 0){
            return this._shadowNodeCompsPool.shift();
        }
        let shadowNode = new Node('shadowNode');
        let shadowComp = shadowNode.addComponent(TileShadowComp);
        shadowNode.setParent(this._shadowContentNode);
        return shadowComp;
    }

    getTileGridSpriteframeByGrid(grid:number): SpriteFrame {
        if(!this._tilemap){
            return null;
        }
        let tileLayer = this._tilemap._layers[0];
        let gridInfo = tileLayer.texGrids.get(grid);
        if(!gridInfo){
            console.error("gridInfo is null, grid:", grid);
            return null;
        }
        //limit tilemap not use rotated
        return gridInfo.spriteFrame;
    }

    getPos(x: number, y: number): TilePos {
        let key = x + '_' + y;
        if (this._pos[key]) {
            return this._pos[key];
        } else {
            let tilePos = new TilePos();
            tilePos.x = x;
            tilePos.y = y;
            tilePos.calc_x = x;
            tilePos.calc_y = y;
            tilePos.calc_z = 0;

            let pixelx = (x + 0.5) * this.tilewidth;
            var cross = Math.abs(y % 2) == 1;
            if (cross) pixelx += this.tilewidth * 0.5;
            let pixely = y * (this.tileheight * 0.75) + 0.5 * this.tileheight;
            _vec3_temp2.x = pixelx;
            _vec3_temp2.y = -pixely;
            _vec3_temp2.z = 0;
            Vec3.transformMat4(_vec3_temp, _vec3_temp2, this._tilemap.node.worldMatrix);

            tilePos.pixel_x = pixelx;
            tilePos.pixel_y = -pixely;
            tilePos.worldx = _vec3_temp.x;
            tilePos.worldy = _vec3_temp.y;
            this._pos[key] = tilePos;
            return tilePos;
        }
    }
    getPosWorld(x: number, y: number): Vec3 {
        let tilepos = this.getPos(x,y);
        return v3(tilepos.worldx, tilepos.worldy, 0);
    }
    getPosPixel(x: number, y: number): Vec3 {
        let tilepos = this.getPos(x,y);
        return v3(tilepos.pixel_x, tilepos.pixel_y, 0);
    }
    getPosByCalcPos(x: number, y: number, z: number): TilePos {
        return this.getPos(x, y);
    }
    getCalcPosKey(x: number, y: number, z: number): string {
        return (x | 0).toString() + "_" + (y | 0).toString() + "_" + (z | 0).toString();
    }
    getPosKey(x: number, y: number): number {
        return (y * this.width + x) | 0;
    }
    getPosByWorldPos(worldpos: Vec3): TilePos {
        let invmat = this._tilemap.node.worldMatrix.clone().invert();
        Vec3.transformMat4(_vec3_temp, worldpos, invmat);

        let wxfornode = _vec3_temp.x;
        let wyfornode = -_vec3_temp.y;

        let x1 = Math.floor(wxfornode / this.tilewidth);
        let y1 = Math.floor(wyfornode / (this.tileheight * 0.75));

        let poss: TilePos[] = [];
        var pos1 = this.getPos(x1, y1);
        var pos2 = this.getPos(x1, y1 - 1);
        var pos3 = this.getPos(x1, y1 + 1);
        var pos4 = this.getPos(x1 - 1, y1);
        var pos5 = this.getPos(x1 - 1, y1 - 1);
        var pos6 = this.getPos(x1 - 1, y1 + 1);
        var pos7 = this.getPos(x1 + 1, y1);
        var pos8 = this.getPos(x1 + 1, y1 - 1);
        var pos9 = this.getPos(x1 + 1, y1 + 1);
        poss.push(pos1);
        poss.push(pos2);
        poss.push(pos3);
        poss.push(pos4);
        poss.push(pos5);
        poss.push(pos6);
        poss.push(pos7);
        poss.push(pos8);
        poss.push(pos9);
        for (var i = 0; i < poss.length; i++) {
            var p = poss[i];
            if (p.constained(worldpos.x, worldpos.y)) {
                return p;
            }
        }
        return null;
    }
    getExtAround(pos: TilePos, extlen: number): TilePos[] {
        const postions = [];
        for (var y = pos.calc_y - extlen; y <= pos.calc_y + extlen; y++) {
            for (var x = pos.calc_x - extlen; x <= pos.calc_x + extlen; x++) {
                var z = 0 - x - y;
                if (z < pos.calc_z - extlen || z > pos.calc_z + extlen) continue;
                var gpos = this.getPosByCalcPos(x, y, z);
                //console.log("calcpos=" + x + "," + y + "," + z + "->" + gpos.x + "," + gpos.y);
                if (gpos != null) {
                    postions.push(gpos);
                }
            }
        }
        return postions;
    }
    private InitPos() {
        this._pos = {}; //TilePos[this.width * this.height];
    }

    protected _ShadowBorder_Reset() {
        // for (; this._usedSHadowBorders.length > 0;) {
        //     let borderNode = this._usedSHadowBorders[this._usedSHadowBorders.length - 1];
        //     this._shadowLayer.removeUserNode(borderNode);
        //     this._freeShadowBorders.push(this._usedSHadowBorders.pop());
        // }
    }
    protected _Fetch_ShadowBorderNode(): Node {
        let bn;
        if (this._freeShadowBorders.length > 0) {
            bn = this._freeShadowBorders.pop();
        } else {
            bn = instantiate(this._shadowBorderPfb);
        }

        return bn;
    }
    Shadow_Init(cleantag: number, shadowtag: number): void {
        this._shadowcleantag = cleantag;
        this._shadowtag = shadowtag;
        var layerNode = this._tilemap.node.getChildByName('shadowLayer');
        if(!layerNode){
            layerNode = new Node('shadowLayer');
            layerNode.setParent(this._tilemap.node);
        }
        layerNode.active = true;
        this._shadowContentNode = layerNode;
        this._shadowtiles = {};
    }

    Shadow_Earse(pos: TilePos, owner: string, extlen: number = 1, fall: boolean = false): TilePos[] {
        //console.log("pos=" + pos.x + "," + pos.y + ":" + pos.worldx + "," + pos.worldy);
        //for (var z = pos.calc_z - extlen; z <= pos.calc_z + extlen; z++) {
        const newCleardPositons = [];
        const borderTilePostions: TilePos[] = [];
        let vx = 10000;
        let vy = 10000;
        for (var y = pos.calc_y - extlen; y <= pos.calc_y + extlen; y++) {
            for (var x = pos.calc_x - extlen; x <= pos.calc_x + extlen; x++) {
                var z = 0 - x - y;
                if (z < pos.calc_z - extlen || z > pos.calc_z + extlen) continue;
                var gpos = this.getPosByCalcPos(x, y, z);
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
                            var border = Math.abs(pos.calc_x - x) == extlen || Math.abs(pos.calc_y - y) == extlen || Math.abs(pos.calc_z - z) == extlen;
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
        //}

        // update user tile for border tiles
        if (this._shadowBorderPfb) {
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
        }

        // this._tilemap.getLayer("shadow").updateViewPort(vx, vy, extlen * 2 + 1, extlen * 2 + 1);
        return newCleardPositons;
    }

    Shadow_IsAllBlack(x: number, y: number): boolean {
        let key = x + '_' + y;
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
                positions.push(this.getPos(tiles.x, tiles.y));
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

    _blocked: boolean[] = [];
    _dynamicblock: IDynamicBlock[] = [];
    Path_InitBlock(blocktag: number = 0, other: (x: number, y: number, tag: number) => void = null) {
        // let layb = this._tilemap.getLayer("block");
        // let layd = this._tilemap.getLayer("decoration");
        // layb.node.active = false;
        // layd.node.active = false;

        // for (var y = 0; y < this.height; y++) {
        //     for (var x = 0; x < this.width; x++) {
        //         var btag = layb.tiles[y * this.height + x];
        //         var btag2 = layd.tiles[y * this.height + x]; //decoration

        //         if (btag2 != 0) {
        //             if (other != null) other(x, y, btag2);
        //         }

        //         //block
        //         var block = btag == blocktag;

        //         this._blocked[y * this.height + x] = block;
        //     }
        // }
    }
    Path_AddDynamicBlock(block: IDynamicBlock): void {
        if (this._dynamicblock.some((temple) => temple.TileX == block.TileX && temple.TileY == block.TileY)) {
            return;
        }
        this._dynamicblock.push(block);
    }
    Path_RemoveDynamicBlock(block: IDynamicBlock): void {
        for (let i = 0; i < this._dynamicblock.length; i++) {
            if (this._dynamicblock[i].TileX == block.TileX && this._dynamicblock[i].TileY == block.TileY) {
                this._dynamicblock.splice(i, 1);
                break;
            }
        }
        // cannot find blockindex
        // var i = this._dynamicblock.indexOf(block);
    }
    Path_GetAround(pos: TilePos): TilePos[] {
        let around: TilePos[] = [];
        var p0 = this.getPosByCalcPos(pos.calc_x - 1, pos.calc_y, pos.calc_z + 1);
        if (p0 != null) around.push(p0);
        var p1 = this.getPosByCalcPos(pos.calc_x + 1, pos.calc_y, pos.calc_z - 1);
        if (p1 != null) around.push(p1);
        var p2 = this.getPosByCalcPos(pos.calc_x + 1, pos.calc_y - 1, pos.calc_z);
        if (p2 != null) around.push(p2);
        var p3 = this.getPosByCalcPos(pos.calc_x - 1, pos.calc_y + 1, pos.calc_z);
        if (p3 != null) around.push(p3);
        var p4 = this.getPosByCalcPos(pos.calc_x, pos.calc_y + 1, pos.calc_z - 1);
        if (p4 != null) around.push(p4);
        var p5 = this.getPosByCalcPos(pos.calc_x, pos.calc_y - 1, pos.calc_z + 1);
        if (p5 != null) around.push(p5);
        return around;
    }
    /**
     * lefttop:x:0,y:-1,z:1
     * left:x:-1,y:0,z:1
     * leftbottom:x:-1,y:1,z:0
     * righttop:x:1,y:-1,z:0
     * right:x:1,y:0,z:-1
     * rightbottom:x:0,y:1,z:-1
     * @param direction
     */
    Path_GetAroundByDirection(pos: TilePos, direction: TileHexDirection): TilePos | null {
        const directionPos = v3(0, 0, 0);
        if (direction == TileHexDirection.LeftTop) {
            directionPos.x = 0;
            directionPos.y = -1;
            directionPos.z = 1;
        } else if (direction == TileHexDirection.Left) {
            directionPos.x = -1;
            directionPos.y = 0;
            directionPos.z = 1;
        } else if (direction == TileHexDirection.LeftBottom) {
            directionPos.x = -1;
            directionPos.y = 1;
            directionPos.z = 0;
        } else if (direction == TileHexDirection.RightTop) {
            directionPos.x = 1;
            directionPos.y = -1;
            directionPos.z = 0;
        } else if (direction == TileHexDirection.Right) {
            directionPos.x = 1;
            directionPos.y = 0;
            directionPos.z = -1;
        } else if (direction == TileHexDirection.RightBottom) {
            directionPos.x = 0;
            directionPos.y = 1;
            directionPos.z = -1;
        }
        const p = this.getPosByCalcPos(pos.calc_x + directionPos.x, pos.calc_y + directionPos.y, pos.calc_z + directionPos.z);
        if (p != null) {
            return p;
        }
        return null;
    }
    Path_DistPos(a: TilePos, b: TilePos): number {
        var dx = a.calc_x - b.calc_x;
        if (dx < 0) dx *= -1;
        var dy = a.calc_y - b.calc_y;
        if (dy < 0) dy *= -1;
        var dz = a.calc_z - b.calc_z;
        if (dz < 0) dz *= -1;
        //max
        return dx > dy ? (dx > dz ? dx : dz) : dy > dz ? dy : dz;
    }
    Path_Equal(a: TilePos, b: TilePos): boolean {
        return a.calc_x == b.calc_x && a.calc_y == b.calc_y;
    }
    Path_Contains(list: TilePos[], pos: TilePos): boolean {
        for (var i = 0; i < list.length; i++) {
            if (this.Path_Equal(list[i], pos)) return true;
        }
        return false;
    }
    Path_IsBlock(x: number, y: number, isTarget: boolean = false): boolean {
        var b = this._blocked[y * this.height + x];
        if (b) {
            return b;
        }
        for (var i = 0; i < this._dynamicblock.length; i++) {
            if (this._dynamicblock[i].TileX == x && this._dynamicblock[i].TileY == y) {
                if (isTarget && this._dynamicblock[i].canMoveTo) {
                    return false;
                }
                return true;
            }
        }
        return false;
    }
    /**
     *
     * @param from
     * @param to
     * @param limitstep
     * @returns move path, if is only one pos from, cannot move to toPos
     */
    Path_FromTo(from: TilePos, to: TilePos, limitstep = 100): TilePos[] {
        if (this.Path_IsBlock(to.x, to.y, true)) {
            return [from];
        }

        var openPathTiles: TilePos[] = [];
        var closedPathTiles: TilePos[] = [];

        var currentTile = from;
        currentTile.g = 0;
        currentTile.h = this.Path_DistPos(from, to);

        // push first point to opentable
        openPathTiles.push(currentTile);

        for (var i = 0; i < limitstep; i++) // while (openPathTiles.Count != 0)
        {
            //     sort and get lowest F
            openPathTiles.sort((a, b) => a.g + a.h - (b.g + b.h));
            currentTile = openPathTiles[0];
            //    move current from open to close
            var ic = openPathTiles.indexOf(currentTile);
            openPathTiles.splice(ic, 1);
            closedPathTiles.push(currentTile);

            if (currentTile == null) {
                return [from];
            }

            var g = currentTile.g + 1;

            //  if(close have target, final it.)
            if (closedPathTiles.indexOf(to) >= 0) {
                break;
            }

            //    searach around
            var apprivateTiles = this.Path_GetAround(currentTile);
            for (var i = 0; i < apprivateTiles.length; i++) //     foreach (Tile adjacentTile in currentTile.apprivateTiles)
            {
                var adjacentTile = apprivateTiles[i];

                //block skip
                if (this.Path_IsBlock(adjacentTile.x, adjacentTile.y, to.x == adjacentTile.x && to.y == adjacentTile.y)) continue;

                //skip closed
                if (closedPathTiles.indexOf(adjacentTile) >= 0) {
                    continue;
                }

                //  if new,add and calc g h
                if (openPathTiles.indexOf(adjacentTile) < 0) {
                    adjacentTile.g = g;
                    adjacentTile.h = this.Path_DistPos(adjacentTile, to);
                    openPathTiles.push(adjacentTile);
                }
                //    try to use low g
                else if (adjacentTile.g + adjacentTile.h > g + adjacentTile.h) {
                    adjacentTile.g = g;
                }
            }
        }

        // List<Tile> finalPathTiles = new List<Tile>();
        let path: TilePos[] = [];

        // final output
        if (closedPathTiles.indexOf(to) >= 0) {
            currentTile = to;
            path.push(currentTile);

            for (var i = to.g - 1; i >= 0; i--) {
                //find and push
                for (var j = 0; j < closedPathTiles.length; j++) {
                    var pnode = closedPathTiles[j];
                    if (pnode.g == i && this.Path_DistPos(pnode, currentTile) == 1) {
                        currentTile = pnode;
                        path.push(currentTile);
                        break;
                    }
                }
            }

            path.reverse();
        }

        return path;
    }
}
