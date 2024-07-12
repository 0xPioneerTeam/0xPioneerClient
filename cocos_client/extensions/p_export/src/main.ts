
/**
 * @en Registration method for the main process of Extension
 */

import { ExecuteSceneScriptMethodOptions } from "../@types/packages/scene/@types/public";



export const methods: { [key: string]: (...any: any) => any } = {

    "menu_export": Func_Export
};

/**
 * @en Hooks triggered after extension loading is complete
 */
export function load() {
    Editor.Profile.getConfig("p_export").then(v => {
        console.warn("[ExportInfo]Export:" + v.__version__);
    })
}

/**
 * @en Hooks triggered after extension uninstallation is complete
 */
export function unload() { }


//import packageJSON from '../package.json';
//is method from cocos is error,so direct use package name here.
const packageJSON_name: string = "p_export";//

function Func_Export() {
    //this script can not access scene, must from execute-scene-script
    //console.log("button had press.");

    const options: ExecuteSceneScriptMethodOptions = {
        name: packageJSON_name,
        method: 'func_export',
        args: [10],
    };
    Editor.Message.send('scene', 'execute-scene-script', options);
}
