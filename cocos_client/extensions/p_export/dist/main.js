"use strict";
/**
 * @en Registration method for the main process of Extension
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.unload = exports.load = exports.methods = void 0;
exports.methods = {
    "menu_export": Func_Export
};
/**
 * @en Hooks triggered after extension loading is complete
 */
function load() {
    Editor.Profile.getConfig("p_export").then(v => {
        console.warn("[ExportInfo]Export:" + v.__version__);
    });
}
exports.load = load;
/**
 * @en Hooks triggered after extension uninstallation is complete
 */
function unload() { }
exports.unload = unload;
//import packageJSON from '../package.json';
//is method from cocos is error,so direct use package name here.
const packageJSON_name = "p_export"; //
function Func_Export() {
    //this script can not access scene, must from execute-scene-script
    //console.log("button had press.");
    const options = {
        name: packageJSON_name,
        method: 'func_export',
        args: [10],
    };
    Editor.Message.send('scene', 'execute-scene-script', options);
}
