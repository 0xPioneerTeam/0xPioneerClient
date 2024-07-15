"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = exports.unload = exports.load = void 0;
const path_1 = require("path");
const fs = __importStar(require("fs"));
//change path for import cc
module.paths.push((0, path_1.join)(Editor.App.path, 'node_modules'));
// import * as cc from "cc"
function load() {
}
exports.load = load;
;
function unload() {
}
exports.unload = unload;
;
exports.methods = {
    "func_export": Func_Export
};
//find a node by uuid
// function GetNode(uuid: string, parent: cc.Node = null): cc.Node {
//     if (parent == null)
//         parent = cc.director.getScene();
//     var r = parent.getChildByUuid(uuid);
//     if (r != null)
//         return r;
//     for (var i = 0; i < parent.children.length; i++) {
//         var r = GetNode(uuid, parent.children[i]);
//         if (r != null)
//             return r;
//     }
//     return null;
// }
var rootuuid = "";
var subuuids = [];
//get picked node
async function GetPickedNode() {
    const type = Editor.Selection.getLastSelectedType();
    if (type != "node") {
        console.warn("pick type is node a node:" + type);
        return null;
    }
    else {
        var uuid = Editor.Selection.getLastSelected(type);
        let nodeData = await Editor.Message.request('scene', 'query-node', uuid);
        console.log("[ExportInfo]pick node=", String(nodeData.name.value));
        rootuuid = String(nodeData.__prefab__.uuid);
        return nodeData;
    }
}
class Vec3 {
    constructor() {
        Object.defineProperty(this, "x", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "y", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "z", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
}
class JsonItem {
    constructor() {
        Object.defineProperty(this, "url", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "show", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "block", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "posmode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "positions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "rotation", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "scale", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "children", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
}
// function GetWorldPosArray(node: cc.Node): Pos2[] {
//     var pos = new Pos2();
//     pos.x = node.worldPosition.x;
//     pos.y = node.worldPosition.y;
//     var outpos: Pos2[] = [];
//     //test multi pos
//     node.children.forEach((child: cc.Node) => {
//         if (child.name.indexOf("Node") == 0) {
//             var cpos = new Pos2();
//             cpos.x = child.worldPosition.x;
//             cpos.y = child.worldPosition.y;
//             outpos.push(cpos);
//         }
//     });
//     if (outpos.length == 0) {
//         outpos.push(pos);
//     }
//     return outpos;
// }
//Export,need comp MapTag,orelse block=false;
async function tranINodeData(node) {
    let iNode;
    if (node.uuid) {
        iNode = node;
    }
    else if (node.value && node.value.uuid) {
        iNode = await Editor.Message.request('scene', 'query-node', String(node.value.uuid));
    }
    else {
        return null;
    }
    var item = new JsonItem();
    let pbuuid = iNode.__prefab__.uuid;
    if (rootuuid == pbuuid) {
        item.url = '';
    }
    else {
        item.url = await Editor.Message.request('asset-db', 'query-url', pbuuid);
    }
    item.name = String(iNode.name.value);
    item.show = Boolean(iNode.active.value);
    item.positions = iNode.position.value;
    item.rotation = iNode.rotation.value;
    item.scale = iNode.scale.value;
    console.log(iNode);
    item.children = [];
    if (item.url == '') { // not other prefab check child  
        for (let i = 0; i < iNode.children.length; i++) {
            const child = iNode.children[i];
            var subdata = await tranINodeData(child);
            if (subdata) {
                item.children.push(subdata);
            }
        }
    }
    return item;
}
//need child with name "Node" for multi pos
async function Func_Export() {
    var pick = await GetPickedNode();
    if (pick == null) {
        console.warn("[ExportInfo]Should pick export node first.");
        return;
    }
    var outjson = await tranINodeData(pick);
    {
        var outpath = (0, path_1.join)(Editor.Project.path, "outinfo.json");
        console.warn("[ExportInfo]output path = " + outpath);
        console.warn("[ExportInfo]output path = " + outjson);
        fs.writeFileSync(outpath, JSON.stringify(outjson, null, 4));
    }
}
