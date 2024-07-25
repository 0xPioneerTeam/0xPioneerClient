import { instantiate, Intersection2D, Node, Prefab, SpriteFrame, TiledLayer, TiledMap, v2, v3, Vec2, Vec3 } from "cc";
import { TileShadowComp } from "./TileShadowComp";
import { Rect } from "cc";

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

    pixel_x: number;
    pixel_y: number;

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

    static _hexPoints = [
        [-64, 32],
        [-64, -32],
        [0, -64],
        [64, -32],
        [64, 32],
        [0, 64],
    ];
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
            TilePos._hexPoints.forEach((v) => {
                TilePos._hexVec6.push(v2(v[0], v[1]));
            });
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
        this._pos = {};
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

    protected _shadowBorderPfb: Prefab;
    protected _freeShadowBorders: Node[] = [];
    protected _usedShadowBorders: Node[] = [];

    private _tileGridSpriteframe: { [grid: number]: SpriteFrame } = {};

    private static _instance: TileMapHelper;

    static get INS(): TileMapHelper {
        return this._instance;
    }

    getTileGridSpriteframeByGrid(grid: number): SpriteFrame {
        if (!this._tilemap) {
            return null;
        }
        let spriteFrame = this._tileGridSpriteframe[grid];
        if(spriteFrame){
            return spriteFrame;
        }
        let tileLayer = this._tilemap._layers[0];
        let gridInfo = tileLayer.texGrids.get(grid);
        if (!gridInfo) {
            console.error("gridInfo is null, grid:", grid);
            return null;
        }
        spriteFrame = gridInfo.spriteFrame.clone();
        spriteFrame.rotated = gridInfo._rotated!;
        spriteFrame.rect = gridInfo._rect!;
        spriteFrame.offset = v2(gridInfo.offsetX,gridInfo.offsetY);
        this._tileGridSpriteframe[grid] = spriteFrame;
        return spriteFrame;
    }

    getPos(x: number, y: number): TilePos {
        let key = x + "_" + y;
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
            var cross = y % 2 != 0;
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
        let tilepos = this.getPos(x, y);
        return v3(tilepos.worldx, tilepos.worldy, 0);
    }
    getPosPixel(x: number, y: number): Vec3 {
        let tilepos = this.getPos(x, y);
        return v3(tilepos.pixel_x, tilepos.pixel_y, 0);
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
        poss.push(this.getPos(x1, y1));
        poss.push(this.getPos(x1, y1 - 1));
        poss.push(this.getPos(x1, y1 + 1));
        poss.push(this.getPos(x1 - 1, y1));
        poss.push(this.getPos(x1 - 1, y1 - 1));
        poss.push(this.getPos(x1 - 1, y1 + 1));
        poss.push(this.getPos(x1 + 1, y1));
        poss.push(this.getPos(x1 + 1, y1 - 1));
        poss.push(this.getPos(x1 + 1, y1 + 1));
        for (let i = 0; i < poss.length; i++) {
            let p = poss[i];
            if (p.constained(worldpos.x, worldpos.y)) {
                return p;
            }
        }
        return null;
    }

    getPosByPixelPos(pixel: Vec3): TilePos {
        let worldMatrix = this._tilemap.node.worldMatrix;
        Vec3.transformMat4(_vec3_temp, pixel, worldMatrix);

        let wxfornode = pixel.x;
        let wyfornode = -pixel.y;

        let x1 = Math.floor(wxfornode / this.tilewidth);
        let y1 = Math.floor(wyfornode / (this.tileheight * 0.75));

        let poss: TilePos[] = [];
        poss.push(this.getPos(x1, y1));
        poss.push(this.getPos(x1, y1 - 1));
        poss.push(this.getPos(x1, y1 + 1));
        poss.push(this.getPos(x1 - 1, y1));
        poss.push(this.getPos(x1 - 1, y1 - 1));
        poss.push(this.getPos(x1 - 1, y1 + 1));
        poss.push(this.getPos(x1 + 1, y1));
        poss.push(this.getPos(x1 + 1, y1 - 1));
        poss.push(this.getPos(x1 + 1, y1 + 1));
        for (let i = 0; i < poss.length; i++) {
            let p = poss[i];
            if (p.constained(_vec3_temp.x, _vec3_temp.y)) {
                return p;
            }
        }
        return null;
    }

    getExtAround(pos: TilePos, extlen: number): TilePos[] {
        let result = new Set<TilePos>();
        let queue: Array<[number, number, number]> = [[pos.x, pos.y, 0]];
        let visited = new Set<string>();
        visited.add(`${pos.x},${pos.y}`);

        while (queue.length > 0) {
            let [cx, cy, depth] = queue.shift();

            if (depth < extlen) {
                let neighbors = this.Path_GetAround(this.getPos(cx, cy));

                for (let tempPos of neighbors) {
                    let key = `${tempPos.x},${tempPos.y}`;
                    if (!visited.has(key)) {
                        visited.add(key);
                        queue.push([tempPos.x, tempPos.y, depth + 1]);
                        result.add(tempPos);
                    }
                }
            }
        }
        return Array.from(result);
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
        const left = this.getPos(pos.x - 1, pos.y);
        const right = this.getPos(pos.x + 1, pos.y);
        let leftTop = null;
        let rightTop = null;
        let leftBottom = null;
        let rightBottom = null;
        if (pos.y % 2 == 0) {
            leftTop = this.getPos(pos.x - 1, pos.y - 1);
            rightTop = this.getPos(pos.x, pos.y - 1);
            leftBottom = this.getPos(pos.x - 1, pos.y + 1);
            rightBottom = this.getPos(pos.x, pos.y + 1);
        } else {
            leftTop = this.getPos(pos.x, pos.y - 1);
            rightTop = this.getPos(pos.x + 1, pos.y - 1);
            leftBottom = this.getPos(pos.x, pos.y + 1);
            rightBottom = this.getPos(pos.x + 1, pos.y + 1);
        }
        if (left != null) {
            around.push(left);
        }
        if (right != null) {
            around.push(right);
        }
        if (leftTop != null) {
            around.push(leftTop);
        }
        if (rightTop != null) {
            around.push(rightTop);
        }
        if (leftBottom != null) {
            around.push(leftBottom);
        }
        if (rightBottom != null) {
            around.push(rightBottom);
        }
        return around;
    }
    Path_GetAroundByDirection(pos: TilePos, direction: TileHexDirection): TilePos | null {
        let result = null;
        if (direction == TileHexDirection.Left) {
            result = this.getPos(pos.x - 1, pos.y);
        } else if (direction == TileHexDirection.Right) {
            result = this.getPos(pos.x + 1, pos.y);
        } else {
            if (pos.y % 2 == 0) {
                if (direction == TileHexDirection.LeftTop) {
                    result = this.getPos(pos.x - 1, pos.y - 1);
                } else if (direction == TileHexDirection.RightTop) {
                    result = this.getPos(pos.x, pos.y - 1);
                } else if (direction == TileHexDirection.LeftBottom) {
                    result = this.getPos(pos.x - 1, pos.y + 1);
                } else if (direction == TileHexDirection.RightBottom) {
                    result = this.getPos(pos.x, pos.y + 1);
                }
            } else {
                if (direction == TileHexDirection.LeftTop) {
                    result = this.getPos(pos.x, pos.y - 1);
                } else if (direction == TileHexDirection.RightTop) {
                    result = this.getPos(pos.x + 1, pos.y - 1);
                } else if (direction == TileHexDirection.LeftBottom) {
                    result = this.getPos(pos.x, pos.y + 1);
                } else if (direction == TileHexDirection.RightBottom) {
                    result = this.getPos(pos.x + 1, pos.y + 1);
                }
            }
        }
        return result;
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

        for (
            var i = 0;
            i < limitstep;
            i++ // while (openPathTiles.Count != 0)
        ) {
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
            for (
                var i = 0;
                i < apprivateTiles.length;
                i++ //     foreach (Tile adjacentTile in currentTile.apprivateTiles)
            ) {
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
