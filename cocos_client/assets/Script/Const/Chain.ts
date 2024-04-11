export interface ChainConfigData {
    currentChainId: string;
    configs: {
        [index: string]: ChainConfigsConfigData;
    };
}

export interface ChainConfigsConfigData {
    chainId: string;
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
        init_ws: number;
        init_http: number;
        init_ethereum: number;
    }
}