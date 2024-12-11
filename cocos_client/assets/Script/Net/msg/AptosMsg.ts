
import { AccountResult, Aptos, SignMessageResult } from "../aptos/aptos";

export class AptosMsg {
 
    private _aptos: Aptos;

    public constructor() {
        this._aptos = new Aptos();
    }

    public get aptos() {
        return this._aptos;
    }

    public async signMessage(message: string): Promise<SignMessageResult> {
        return await this._aptos.SignMessage(message);
    }

    public async account(): Promise<AccountResult> {
        return await this._aptos.Account();
    }
}