import { _decorator, Prefab, instantiate, Node, Component } from "cc";
import ResourcesManager from "./ResourcesMgr";
import { ResourcesMgr } from "../Utils/Global";

export enum UIPanelLayerType {
    Game,
    UI,
    HUD,
}

export interface UIPanelQueueItem {
    name: string;
    node: Node;
}

export interface UIPanelPushResult {
    success: boolean;
    node: Node;
}

const { ccclass, property } = _decorator;

@ccclass("UIPanelManger")
export default class UIPanelManger extends Component {
    public static get inst() {
        return this._inst;
    }
    public async pushPanel(name: string, layer: UIPanelLayerType = UIPanelLayerType.UI): Promise<UIPanelPushResult> {
        return new Promise<UIPanelPushResult>(async (resolve) => {
            const newNode: Node = await this._loadPrefab(name);
            if (newNode != null) {
                if (layer == UIPanelLayerType.Game) {
                    newNode.parent = this._gameLayer;
                    this._gameQueue.push({ name: name, node: newNode });
                } else if (layer == UIPanelLayerType.UI) {
                    newNode.parent = this._uiLayer;
                    this._uiQueue.push({ name: name, node: newNode });
                } else if (layer == UIPanelLayerType.HUD) {
                    newNode.parent = this._hudLayer;
                    this._hudQueue.push({ name: name, node: newNode });
                }
                resolve({ success: true, node: newNode });
            } else {
                resolve({ success: false, node: null });
            }
        });
    }
    public popPanel(node: Node, layer: UIPanelLayerType = UIPanelLayerType.UI) {
        let currentQueue: UIPanelQueueItem[] = null;
        if (layer == UIPanelLayerType.Game) {
            currentQueue = this._gameQueue;
        } else if (layer == UIPanelLayerType.UI) {
            currentQueue = this._uiQueue;
        } else if (layer == UIPanelLayerType.HUD) {
            currentQueue = this._hudQueue;
        }
        node.destroy();
        if (currentQueue != null) {
            for (let i = 0; i < currentQueue.length; i++) {
                if (currentQueue[i].node == node) {
                    currentQueue.splice(i, 1);
                    break;
                }
            }
        }
    }
    public popPanelByName(name: string) {
        let itemIndex: number = this._gameQueue.findIndex((value: UIPanelQueueItem)=> {
            return value.name == name;
        });
        if (itemIndex >= 0) {
            const item = this._gameQueue.splice(itemIndex, 1)[0];
            item.node.destroy();
            return;
        }
        itemIndex = this._uiQueue.findIndex((value: UIPanelQueueItem)=> {
            return value.name == name;
        });
        if (itemIndex >= 0) {
            const item = this._uiQueue.splice(itemIndex, 1)[0];
            item.node.destroy();
            return;
        }
        itemIndex = this._hudQueue.findIndex((value: UIPanelQueueItem)=> {
            return value.name == name;
        });
        if (itemIndex >= 0) {
            const item = this._hudQueue.splice(itemIndex, 1)[0];
            item.node.destroy();
            return;
        }
    }
    public panelIsShow(name: string, layer: UIPanelLayerType = UIPanelLayerType.UI): boolean {
        let currentQueue: UIPanelQueueItem[] = null;
        if (layer == UIPanelLayerType.Game) {
            currentQueue = this._gameQueue;
        } else if (layer == UIPanelLayerType.UI) {
            currentQueue = this._uiQueue;
        } else if (layer == UIPanelLayerType.HUD) {
            currentQueue = this._hudQueue;
        }
        let isShow: boolean = false;
        if (currentQueue != null) {
            for (const item of currentQueue) {
                if (item.name == name) {
                    isShow = true;
                    break;
                }
            }
        }
        return isShow;
    }

    private static _inst: UIPanelManger = null;
    private _gameLayer: Node = null;
    private _uiLayer: Node = null;
    private _hudLayer: Node = null;

    private _resourceMgr: ResourcesManager = null;

    private _gameQueue: UIPanelQueueItem[] = [];
    private _uiQueue: UIPanelQueueItem[] = [];
    private _hudQueue: UIPanelQueueItem[] = [];
    protected onLoad(): void {
        this._resourceMgr = ResourcesMgr;
        UIPanelManger._inst = this;
        this._gameLayer = this.node.getChildByPath("Canvas/GameContent");
        this._uiLayer = this.node.getChildByPath("UI_Canvas/UI_ROOT");
        this._hudLayer = this.node.getChildByPath("UI_Canvas/UIHUD");
    }

    private async _loadPrefab(path: string): Promise<Node | null> {
        let useNode: Node = null;
        let prefab: Prefab = await this._resourceMgr.LoadABResource(path, Prefab);
        if (prefab != null) {
            useNode = instantiate(prefab);
        }
        return useNode;
    }
}
