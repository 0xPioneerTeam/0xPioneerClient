export class chain_util {
    private static ethers = (window as any).ethers;

    public static getDecimalsBigInt(value: string, decimals: string | number | bigint): bigint {
        return this.ethers.parseUnits(value, decimals);
    }

    public static getStringNumber(value: string | number | bigint, decimals: string | number | bigint): string {
        return this.ethers.formatUnits(value, decimals);
    }

    public static getKeccak256(value: string): string {
        return this.ethers.keccak256(this.ethers.hexlify(this.ethers.toUtf8Bytes(value)));
    }
}
