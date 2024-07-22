

import { _decorator, CCBoolean, Component, instantiate, Node, Prefab, Sprite, UITransform, v3, Vec2 } from 'cc';
import { DEV, EDITOR } from 'cc/env';
import { TileMapHelper } from './TileTool';
const { ccclass, property } = _decorator;



@ccclass('TileShadowComp')
export class TileShadowComp extends Component {

    private _tilex: number = 0;
    private _tiley: number = 0;

    private _spComp: Sprite;
    private _uiComp: UITransform;

    public get tilex(): number {
        return this._tilex;
    }

    public get tiley(): number {
        return this._tiley;
    }

    protected start(): void {
        let comp = this.node.getComponent(Sprite);
        if (comp) {
            this._spComp = comp;
        }else{
            this._spComp = this.node.addComponent(Sprite);
        }
        let uiCom = this.node.getComponent(UITransform);
        if(uiCom){
            this._uiComp = uiCom;
        }else{
            this._uiComp = this.node.addComponent(UITransform);
            this._uiComp.setContentSize(128, 128);
        }
    }

    public updateDrawInfo(tilex:number,tiley:number,grid:number){
        this._tilex = tilex;
        this._tiley = tiley;
        let pos = TileMapHelper.INS.getPos(tilex, tiley);
        this.node.setPosition(pos.worldx, pos.worldy);
        this._spComp.spriteFrame = TileMapHelper.INS.getTileGridSpriteframeByGrid(grid);
    }

}
