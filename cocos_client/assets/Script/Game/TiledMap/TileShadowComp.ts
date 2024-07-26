

import { _decorator, CCBoolean, Component, instantiate, Node, Prefab, Sprite, UITransform, v3, Vec2 } from 'cc';
import { DEV, EDITOR } from 'cc/env';
import { TileMapHelper } from './TileTool';
const { ccclass, property } = _decorator;



@ccclass('TileShadowComp')
export class TileShadowComp extends Component {

    private _tilex: number = 0;
    private _tiley: number = 0;
    private _grid: number = 0;

    private _spComp: Sprite;
    private _uiComp: UITransform;

    public get grid(): number {
        return this._grid;
    }

    public get tilex(): number {
        return this._tilex;
    }

    public get tiley(): number {
        return this._tiley;
    }

    protected onLoad(): void {
        let comp = this.node.getComponent(Sprite);
        if (comp) {
            this._spComp = comp;
        } else {
            this._spComp = this.node.addComponent(Sprite);
        }
        this._spComp.trim = true;
        this._spComp.type = Sprite.Type.SIMPLE;
        this._spComp.sizeMode = Sprite.SizeMode.TRIMMED;
        let uiCom = this.node.getComponent(UITransform);
        if (uiCom) {
            this._uiComp = uiCom;
        } else {
            this._uiComp = this.node.addComponent(UITransform);
            this._uiComp.setContentSize(128, 128);
            this._uiComp.anchorY = 0.5;
        }
    }

    public updateDrawInfo(tilex: number, tiley: number, grid: number) {
        this._tilex = tilex;
        this._tiley = tiley;
        this._grid = grid;
        let pos = TileMapHelper.INS.getPos(tilex, tiley);
        this.node.setPosition(pos.pixel_x, pos.pixel_y);
        if (grid == 0) {
            this._spComp.spriteFrame = null;
        } else {
            this._spComp.spriteFrame = TileMapHelper.INS.getTileGridSpriteframeByGrid(grid);
            if(grid == 75){
                this.node.setScale(1.01, 1);
            }else{
                this.node.setScale(1, 1);
            }
            this._uiComp.anchorY = 0.5;
        }
    }

}
