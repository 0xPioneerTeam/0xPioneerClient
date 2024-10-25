import AbiConfig from "../../Config/AbiConfig";
import { Ethereum, ZeroAddress, tokenNameETH } from "../ethers/Ethereum";
import { chain_util } from "../ethers/chain_util";

export class EthereumMsg {
    private _ethereum: Ethereum;
    private _decimals: { [index: string]: number } = {};

    public constructor() {
        this._ethereum = new Ethereum();
    }

    public get ethereum() {
        return this._ethereum;
    }

    public async signMessage(message: string): Promise<string> {
        return await this._ethereum.SignMessage(message);
    }

    public async getDecimals(tokenAddr: string): Promise<number> {
        if (this._decimals[tokenAddr]) return this._decimals[tokenAddr];
        let decimals: number = 1;
        if (tokenAddr == ZeroAddress) {
            decimals = Number((await this._ethereum.getDecimalsETH()).toString());
        } else {
            decimals = await this._ethereum.getDecimalsErc20ByAddr(tokenAddr);
        }
        this._decimals[tokenAddr] = decimals;
        return this._decimals[tokenAddr];
    }
    public async getBalanceErc20(tokenAddr: string): Promise<string> {
        let decimals = await this.getDecimals(tokenAddr);
        let balance = BigInt(0);
        if (tokenAddr == ZeroAddress) {
            balance = await this._ethereum.getBalanceETH();
        } else {
            balance = await this._ethereum.getBalanceErc20ByAddr(tokenAddr);
        }
        return chain_util.getStringNumber(balance, decimals);
    }
    public async getBalance1155(tokenAddr: string, id: string): Promise<string> {
        return (await this._ethereum.getBalance1155ByAddr(tokenAddr, id)).toString();
    }
    public async transferETH(fee_value: number, fee_wallet: string, fee_len: number = 8) {
        return await this._ethereum.transferETH(fee_value, fee_wallet, fee_len);
    }
    public async transferPSYC(psyc_value: number, psyc_wallet: string, psyc_len: number = 8) {
        return await this._ethereum.transferPSYC(psyc_value, psyc_wallet, psyc_len);
    }
    // public async getBalancePSYC(): Promise<string> {
    //     const abi = AbiConfig.getAbiByContract("PioneerSyCoin20");
    //     const addr = abi.addr;
    //     return await this.getBalanceErc20(addr);
    // }
    // public async getBalancePIOT(): Promise<string> {
    //     const abi = AbiConfig.getAbiByContract("PioneerToken20");
    //     const addr = abi.addr;
    //     return await this.getBalanceErc20(addr);
    // }

    // approve
    // ERC20

    // ERC1155
}
