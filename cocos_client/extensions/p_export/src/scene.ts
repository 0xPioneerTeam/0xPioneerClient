
import { join } from 'path';
import * as fs from "fs";
import { INode } from '../@types/packages/scene/@types/public';

//change path for import cc
module.paths.push(join(Editor.App.path, 'node_modules'));


// import * as cc from "cc"


export function load() {


};
export function unload() {

};


export const methods: { [key: string]: (...any: any) => any } = {
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
async function GetPickedNode(): Promise<INode> {
    const type = Editor.Selection.getLastSelectedType();
    if (type != "node") {
        console.warn("pick type is node a node:" + type);
        return null;
    } else {
        var uuid = Editor.Selection.getLastSelected(type);
        let nodeData: INode = await Editor.Message.request('scene', 'query-node', uuid);
        console.log("[ExportInfo]pick node=", String(nodeData.name.value));
        rootuuid = String(nodeData.__prefab__.uuid);
        return nodeData;
    }
}

class Vec2 {
    x: number;
    y: number;
}

class Vec3 {
    x: number;
    y: number;
    z: number;
}

class JsonItem {
    url: string;
    name: string;
    type: string;
    show: boolean;
    block: boolean;
    blockData:Vec2[];
    posmode: string;
    positions: Vec3;
    rotation: Vec3;
    scale: Vec3;
    children: JsonItem[];
}

//Export,need comp MapTag,orelse block=false;
async function tranINodeData(node: any) {
    let iNode: INode;
    if (node.uuid) {
        iNode = node as INode;
    } else if (node.value && node.value.uuid) {
        iNode = await Editor.Message.request('scene', 'query-node', String(node.value.uuid));
    } else {
        return null;
    }
    var item = new JsonItem();
    let pbuuid = iNode.__prefab__.uuid;
    if(rootuuid == pbuuid){
        item.url = '';
    }else{
        let assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', pbuuid);
        item.url = assetInfo.name;
        console.log(assetInfo);
    }
    item.name = String(iNode.name.value);
    item.show = Boolean(iNode.active.value);
    item.positions = iNode.position.value as Vec3;
    item.rotation = iNode.rotation.value as Vec3;
    item.scale = iNode.scale.value as Vec3;
    item.children = [];
    if(item.url == ''){// not other prefab check child  
        for (let i = 0; i < iNode.children.length; i++) {
            const child = iNode.children[i];
            var subdata = await tranINodeData(child);
            if(subdata){
                item.children.push(subdata);
            }
        }
    }else{
        iNode.__comps__.forEach(async (comp) => {
            if (comp.type == "MapTag") {
                if(comp.value.hasOwnProperty("block")){
                    item.block = Boolean(comp.value['block']);
                }
                if(item.block && comp.value.hasOwnProperty("blockData")){
                    item.blockData = [];
                    comp.value['blockData'].value.forEach((element:any) => {
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
        var outpath = join(Editor.Project.path, "outinfo.json");
        console.warn("[ExportInfo]output path = " + outpath);
        console.warn("[ExportInfo]output path = " + outjson);
        fs.writeFileSync(outpath, JSON.stringify(outjson, null, 4));
    }
}