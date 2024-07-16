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
class Vec2 {
}
class Vec3 {
}
class JsonItem {
}
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
        let assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', pbuuid);
        item.url = assetInfo.name;
        console.log(assetInfo);
    }
    item.name = String(iNode.name.value);
    item.show = Boolean(iNode.active.value);
    item.positions = iNode.position.value;
    item.rotation = iNode.rotation.value;
    item.scale = iNode.scale.value;
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
    else {
        iNode.__comps__.forEach(async (comp) => {
            if (comp.type == "MapTag") {
                if (comp.value.hasOwnProperty("block")) {
                    item.block = Boolean(comp.value['block']);
                }
                if (item.block && comp.value.hasOwnProperty("blockData")) {
                    item.blockData = [];
                    comp.value['blockData'].value.forEach((element) => {
                        var vec2 = new Vec2();
                        vec2.x = element.value.x;
                        vec2.y = element.value.y;
                        item.blockData.push(vec2);
                    });
                    // console.log("[ExportInfo]blockData=", item.blockData);
                }
            }
        });
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
