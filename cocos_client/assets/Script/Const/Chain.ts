export interface ChainConfigData {
    currentConfigId: string;
    configs: {
        [index: string]: ChainConfigsConfigData;
    };
}

export interface ChainConfigsConfigData {
    chainId: string;
    chainType?: string;
    chainName: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    rpcUrls: string[];
    blockExplorerUrls: string[];
    abi: string;
    api: {
        ws_host: string;
        http_host: string;
        init: boolean;
        fee_psyc: string;
    };
}
