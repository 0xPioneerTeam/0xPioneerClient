import { resources } from "cc";
import CLog from "../Utils/CLog";
import { CLevelConfigData } from "../Const/CLevelDefine";
import { ResourceCorrespondingItem } from "../Const/ConstDefine";

export default class CLevelConfig {
    private static _confs: CLevelConfigData[];

    public static async init(): Promise<boolean> {
        // const obj: any = await new Promise((resolve) => {
        //     resources.load("data_local/chain", (err: Error, data: any) => {
        //         if (err) {
        //             resolve(null);
        //             return;
        //         }
        //         resolve(data.json);
        //     });
        // });
        // if (!obj) {
        //     CLog.error("ChainConfig init error");
        //     return false;
        // }
        this._confs = [
            {
                id: "1",
                bigClass: 1,
                smallClass: 1,
                buffs: [
                    {
                        type: 1,
                        title: "117016",
                        value: 1,
                    },
                ],
                rewards: [
                    {
                        type: ResourceCorrespondingItem.Food,
                        num: 100,
                    },
                    {
                        type: ResourceCorrespondingItem.Stone,
                        num: 100,
                    },
                ],
                conditions: [],
            },
            {
                id: "2",
                bigClass: 1,
                smallClass: 2,
                buffs: [
                    {
                        type: 1,
                        title: "117016",
                        value: 1,
                    },
                ],
                rewards: [
                    {
                        type: ResourceCorrespondingItem.Food,
                        num: 100,
                    },
                ],
                conditions: [
                    {
                        type: 2,
                        title: "117016",
                        subValue: 4,
                        value: 10,
                    }
                ]
            },
            {
                id: "3",
                bigClass: 1,
                smallClass: 3,
                buffs: [
                    {
                        type: 1,
                        title: "117016",
                        value: 1,
                    },
                ],
                rewards: [
                    {
                        type: ResourceCorrespondingItem.Food,
                        num: 100,
                    },
                ],
                conditions: [
                    {
                        type: 2,
                        title: "117016",
                        subValue: 4,
                        value: 10,
                    },
                    {
                        type: 3,
                        title: "117017",
                        subValue: 4,
                        value: 10,
                    }
                ]
            },
            {
                id: "4",
                bigClass: 2,
                smallClass: 1,
                buffs: [
                    {
                        type: 1,
                        title: "117016",
                        value: 1,
                    },
                ],
                rewards: [
                    {
                        type: ResourceCorrespondingItem.Food,
                        num: 100,
                    },
                ],
                conditions: [
                    {
                        type: 2,
                        title: "117016",
                        subValue: 4,
                        value: 10,
                    }
                ]
            },
            {
                id: "5",
                bigClass: 2,
                smallClass: 2,
                buffs: [
                    {
                        type: 1,
                        title: "117016",
                        value: 1,
                    },
                ],
                rewards: [
                    {
                        type: ResourceCorrespondingItem.Food,
                        num: 100,
                    },
                ],
                conditions: [
                    {
                        type: 2,
                        title: "117016",
                        subValue: 4,
                        value: 10,
                    }
                ]
            },
            {
                id: "6",
                bigClass: 2,
                smallClass: 3,
                buffs: [
                    {
                        type: 1,
                        title: "117016",
                        value: 1,
                    },
                ],
                rewards: [
                    {
                        type: ResourceCorrespondingItem.Food,
                        num: 100,
                    },
                ],
                conditions: [
                    {
                        type: 2,
                        title: "117016",
                        subValue: 4,
                        value: 10,
                    }
                ]
            },
            {
                id: "7",
                bigClass: 3,
                smallClass: 1,
                buffs: [
                    {
                        type: 1,
                        title: "117016",
                        value: 1,
                    },
                ],
                rewards: [
                    {
                        type: ResourceCorrespondingItem.Food,
                        num: 100,
                    },
                ],
                conditions: [
                    {
                        type: 2,
                        title: "117016",
                        subValue: 4,
                        value: 10,
                    }
                ]
            },
            {
                id: "8",
                bigClass: 3,
                smallClass: 2,
                buffs: [
                    {
                        type: 1,
                        title: "117016",
                        value: 1,
                    },
                ],
                rewards: [
                    {
                        type: ResourceCorrespondingItem.Food,
                        num: 100,
                    },
                ],
                conditions: [
                    {
                        type: 2,
                        title: "117016",
                        subValue: 4,
                        value: 10,
                    }
                ]
            },
            {
                id: "9",
                bigClass: 3,
                smallClass: 3,
                buffs: [
                    {
                        type: 1,
                        title: "117016",
                        value: 1,
                    },
                ],
                rewards: [
                    {
                        type: ResourceCorrespondingItem.Food,
                        num: 100,
                    },
                ],
                conditions: [
                    {
                        type: 2,
                        title: "117016",
                        subValue: 4,
                        value: 10,
                    }
                ]
            },
            {
                id: "10",
                bigClass: 4,
                smallClass: 1,
                buffs: [
                    {
                        type: 1,
                        title: "117016",
                        value: 1,
                    },
                ],
                rewards: [
                    {
                        type: ResourceCorrespondingItem.Food,
                        num: 100,
                    },
                ],
                conditions: [
                    {
                        type: 2,
                        title: "117016",
                        subValue: 4,
                        value: 10,
                    }
                ]
            },
            {
                id: "11",
                bigClass: 4,
                smallClass: 2,
                buffs: [
                    {
                        type: 1,
                        title: "117016",
                        value: 1,
                    },
                ],
                rewards: [
                    {
                        type: ResourceCorrespondingItem.Food,
                        num: 100,
                    },
                ],
                conditions: [
                    {
                        type: 2,
                        title: "117016",
                        subValue: 4,
                        value: 10,
                    }
                ]
            },
            {
                id: "12",
                bigClass: 4,
                smallClass: 3,
                buffs: [
                    {
                        type: 1,
                        title: "117016",
                        value: 1,
                    },
                ],
                rewards: [
                    {
                        type: ResourceCorrespondingItem.Food,
                        num: 100,
                    },
                ],
                conditions: [
                    {
                        type: 2,
                        title: "117016",
                        subValue: 4,
                        value: 10,
                    }
                ]
            },
        ];
        return true;
    }

    public static getConfs(): CLevelConfigData[] {
        return this._confs;
    }
}
