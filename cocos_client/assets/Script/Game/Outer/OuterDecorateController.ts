import { _decorator, instantiate, Node, Prefab, Rect, v2, Vec2 } from "cc";
import { BundleName } from "../../Basic/ResourcesMgr";
import ViewController from "../../BasicView/ViewController";
import MapDecorateConfig from "../../Config/MapDecorateConfig";
import { DataMgr } from "../../Data/DataMgr";
import CommonTools from "../../Tool/CommonTools";
import { ResourcesMgr } from "../../Utils/Global";
import { TileMapHelper } from "../TiledMap/TileTool";
import { OuterTiledMapActionController } from "./OuterTiledMapActionController";
import GameMainHelper from "../Helper/GameMainHelper";
import { TILEMAP_SIZE } from "../../Const/ConstDefine";

const { ccclass, property } = _decorator;

const _rect_temp = new Rect();

@ccclass("OuterDecorateController")
export class OuterDecorateController extends ViewController {
    private _decoratePbs: Map<string, Prefab> = new Map();
    private _decorateAreaMap: Map<string, Node[]> = new Map();

    protected viewDidLoad(): void {
        super.viewDidLoad();
    }

    async refreshUI(rect: Rect, rect2: Rect) {
        let stx = rect2.xMin;
        let sty = rect2.yMin;
        let endx = rect2.xMax;
        let endy = rect2.yMax;
        _rect_temp.x = rect.x - 100;
        _rect_temp.y = rect.y - 100;
        _rect_temp.width = rect.width + 200;
        _rect_temp.height = rect.height + 200;

        const decorateInfoMap = DataMgr.s.mapBuilding.getDecorateInfo();
        const askInfo: Vec2[] = [];
        for (let i = stx; i <= endx; i++) {
            for (let j = sty; j <= endy; j++) {
                let areaKey = i + "_" + -j;
                if (!decorateInfoMap.has(areaKey)) {
                    askInfo.push(v2(i, -j));
                    continue;
                }
                if (!this._decorateAreaMap.has(areaKey)) {
                    this._decorateAreaMap.set(areaKey, []);
                    this.parseDecorate(decorateInfoMap.get(areaKey), i, j);
                }
                if (i == stx || i == endx || j == sty || j == endy) {
                    let nodes = this._decorateAreaMap.get(areaKey);
                    if (nodes) {
                        for (let k = 0; k < nodes.length; k++) {
                            const node = nodes[k];
                            if (_rect_temp.contains(v2(node.position.x, node.position.y))) {
                                node.active = true;
                            } else {
                                node.active = false;
                            }
                        }
                    }
                } else {
                    let nodes = this._decorateAreaMap.get(areaKey);
                    if (nodes) {
                        for (let k = 0; k < nodes.length; k++) {
                            const node = nodes[k];
                            node.active = true;
                        }
                    }
                }
            }
        }

        // request
        const slotIds = [];
        for (const info of askInfo) {
            if (info.x < 0 || info.y < 0) {
                continue;
            }
            slotIds.push(CommonTools.convertMapWorldPosToSlotId(info));
        }
        DataMgr.s.mapBuilding.requestMapInfo(slotIds);
    }

    async parseDecorate(decorateName: string, ax: number, ay: number) {
        let decorateData = await MapDecorateConfig.getByKey(decorateName);
        let areaWidth = TileMapHelper.INS.pixelwidth - TileMapHelper.INS.tilewidth / 2;
        let areaHeight = TileMapHelper.INS.pixelheight - TileMapHelper.INS.tileheight / 4;
        let areaPx = areaWidth * ax + TileMapHelper.INS.pixelwidth / 2;
        let areaPy = areaHeight * ay - TileMapHelper.INS.pixelheight / 2;
        let areaKey = ax + "_" + -ay;
        for (let i = 0; i < decorateData.children.length; i++) {
            const decorateItem = decorateData.children[i];
            this._creatDecorate(decorateItem.url).then((node: Node) => {
                if (node) {
                    node.parent = this.getComponent(OuterTiledMapActionController).mapDecorationView();
                    node.setPosition(areaPx + decorateItem.positions.x, areaPy + decorateItem.positions.y, 0);
                    node.setScale(decorateItem.scale.x, decorateItem.scale.y, decorateItem.scale.z);
                    node.setRotationFromEuler(decorateItem.rotation);
                    if (this._decorateAreaMap.has(areaKey)) {
                        this._decorateAreaMap.get(areaKey).push(node);
                    }
                }
                if(decorateItem.block && decorateItem.blockData && decorateItem.blockData.length>0){
                    for (let i = 0; i < decorateItem.blockData.length; i++) {
                        const bdata = decorateItem.blockData[i];
                        let tileX = ax * TILEMAP_SIZE + bdata.x;
                        let tileY = -ay * TILEMAP_SIZE + bdata.y;
                        GameMainHelper.instance.tiledMapAddDynamicBlock(v2(tileX, tileY),node.uuid);
                    }
                }
            });
        }
    }

    private async _creatDecorate(url: string) {
        var decoratePrb;
        if (this._decoratePbs.has(url)) {
            decoratePrb = this._decoratePbs.get(url);
        } else {
            let loadKey = url.split(".prefab")[0];
            decoratePrb = await ResourcesMgr.loadResource(BundleName.MainBundle, "prefab/decoration/" + loadKey, Prefab);
            if (decoratePrb) {
                this._decoratePbs.set(url, decoratePrb);
            }
        }
        if (decoratePrb) {
            return instantiate(decoratePrb);
        }
        return null;
    }
}
