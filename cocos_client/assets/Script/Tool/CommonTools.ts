import { Layers, Node } from "cc";

export default class CommonTools {
    public static getOneDecimalNum(num: number): number {
        return Math.floor(num * 10) / 10;
    }

    public static getRandomInt(min: number, max: number): number {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    public static getRandomNumberWithOneDecimal(min: number, max: number): number {
        const randomNumber = Math.floor(Math.random() * (max * 10 - min * 10 + 1) + min * 10) / 10;
        return randomNumber;
    }
    public static getRandomItem<T>(items: T[]): T | undefined {
        if (items.length === 0) return undefined;
        const randomIndex = Math.floor(Math.random() * items.length);
        return items[randomIndex];
    }
    public static getRandomItemByWeights<T>(elements: T[], weights: number[]): T {
        if (elements.length !== weights.length) {
            return null;
        }

        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < weights.length; i++) {
            if (random < weights[i]) {
                return elements[i];
            }
            random -= weights[i];
        }
        return null;
    }

    // Convert offset coordinates (x, y) to cube coordinates (q, r, s)
    public static offsetToCube(x: number, y: number) {
        let q = x - Math.floor(y / 2);
        let r = y;
        let s = -q - r;
        return { q, r, s };
    }

    // Convert cube coordinates (q, r, s) to offset coordinates (x, y)
    public static cubeToOffset(q: number, r: number) {
        let x = q + Math.floor(r / 2);
        let y = r;
        return { x, y };
    }

    // Get all hexes in a range z from (x, y)
    public static hexesInRange(x: number, y: number, z: number) {
        let center = this.offsetToCube(x, y);
        let results = [];

        for (let dq = -z; dq <= z; dq++) {
            for (let dr = Math.max(-z, -dq - z); dr <= Math.min(z, -dq + z); dr++) {
                let ds = -dq - dr;
                let q = center.q + dq;
                let r = center.r + dr;
                let s = center.s + ds;
                let offset = this.cubeToOffset(q, r);
                results.push(offset);
            }
        }

        return results;
    }

    // Get the coordinate at distance z in the right-down direction from (x, y)
    public static hexRightDown(x: number, y: number, z: number) {
        // Convert the offset coordinates to cube coordinates
        let { q, r, s } = this.offsetToCube(x, y);
        // - +  left down
        // - 0  left
        // + -  right top
        // + 0  right
        // 0 - left top
        // 0 + right down
        // Calculate the new cube coordinates in the right-down direction
        let qPrime = q + z;
        let rPrime = r;
        let sPrime = s;

        // Convert the new cube coordinates back to offset coordinates
        let { x: xPrime, y: yPrime } = this.cubeToOffset(qPrime, rPrime);

        return { x: xPrime, y: yPrime };
    }

    //------------------------------------------- time
    public static getNextDayAMTimestamp(hour: number): number {
        // current date
        const now = new Date();

        // next day hour date
        const nextDay = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1,
            hour, //
            0, //
            0, //
            0 //
        );
        return nextDay.getTime();
    }
    public static getDayAMTimestamp(hour: number): number {
        // current date
        const now = new Date();

        // next day hour date
        const nextDay = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            hour, //
            0, //
            0, //
            0 //
        );
        return nextDay.getTime();
    }

    public static getDayOfWeek(): number {
        const today = new Date().getDay();
        return today === 0 ? 7 : today;
    }

    /**
     * @param timestamp
     * @param format HH:MM:SS   HHH MMM
     * @returns
     */
    public static formatTimestamp(timestamp: number, format: string = "HH:MM:SS"): string {
        const date = new Date(timestamp);
        const hours = String(date.getHours()).length < 2 ? "0" + date.getHours() : String(date.getHours());
        const minutes = String(date.getMinutes()).length < 2 ? "0" + date.getMinutes() : String(date.getMinutes());
        const seconds = String(date.getSeconds()).length < 2 ? "0" + date.getSeconds() : String(date.getSeconds());
        return format.replace(/HH/g, hours).replace(/MM/g, minutes).replace(/SS/g, seconds).replace(/H/g, hours).replace(/M/g, minutes).replace(/S/g, seconds);
    }

    /**
     * @param seconds
     * @param format HH:MM:SS（00:00:00）   HHh MMm(00h 00m)
     * @returns
     */
    public static formatSeconds(seconds: number, format: string = "HH:MM:SS"): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        const formattedHours = (hours < 10 ? "0" : "") + hours;
        const formattedMinutes = (minutes < 10 ? "0" : "") + minutes;
        const formattedSeconds = (remainingSeconds < 10 ? "0" : "") + remainingSeconds;

        return format
            .replace(/HH/g, formattedHours)
            .replace(/MM/g, formattedMinutes)
            .replace(/SS/g, formattedSeconds)
            .replace(/H/g, formattedHours)
            .replace(/M/g, formattedMinutes)
            .replace(/S/g, formattedSeconds);
    }

    public static weightedRandomValue<T>(values: T[], weights: number[]): T {
        const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
        const random = Math.random() * totalWeight;

        let cumulativeWeight = 0;
        for (let i = 0; i < values.length; i++) {
            cumulativeWeight += weights[i];
            if (random < cumulativeWeight) {
                return values[i];
            }
        }

        return values[values.length - 1];
    }

    /**
     * format: (12, 34)
     * @param p
     */
    public static formatMapPosition(p: { x: number; y: number }): string {
        return `(${p.x}, ${p.y})`;
    }

    /**
     * format: 2024/1/17 01:18:30
     */
    public static formatDateTime(timestamp: number): string {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();

        return `${year}/${month}/${day} ${this.formatTimestamp(timestamp)}`;
    }

    public static mapsAreEqual<K, V>(map1: Map<K, V>, map2: Map<K, V>): boolean {
        if (map1.size !== map2.size) {
            return false;
        }

        for (let [key, value] of map1) {
            if (!map2.has(key)) {
                return false;
            }

            if (map2.get(key) !== value) {
                return false;
            }
        }

        return true;
    }

    public static arraysAreEqual(array1: any[], array2: any[]): boolean {
        console.log("exce ar1:", array1);
        console.log("exce ar2:", array2);
        if (array1.length !== array2.length) {
            return false;
        }

        for (let i = 0; i < array1.length; i++) {
            if (!this.deepEqual(array1[i], array2[i])) {
                return false;
            }
        }

        return true;
    }

    public static generateUUID() {
        var uuid = "",
            i,
            random;
        for (i = 0; i < 16; i++) {
            random = (Math.random() * 16) | 0;
            if (i === 8 || i === 12 || i === 16 || i === 20) {
                uuid += "-";
            }
            uuid += (i === 12 ? 4 : i === 16 ? (random & 3) | 8 : random).toString(16);
        }
        return uuid.substring(0, 16);
    }

    public static deepEqual(obj1: any, obj2: any): boolean {
        if (obj1 === obj2) {
            return true;
        }

        if (obj1 === null || obj2 === null || typeof obj1 !== "object" || typeof obj2 !== "object") {
            return false;
        }

        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length) {
            return false;
        }

        for (const key of keys1) {
            if (!keys2.includes(key) || !this.deepEqual(obj1[key], obj2[key])) {
                return false;
            }
        }

        return true;
    }

    //----------------------------------- COCOS
    public static changeLayerIteratively(rootNode: Node, layer: Layers.Enum) {
        const stack = [rootNode];
        while (stack.length > 0) {
            const node = stack.pop();
            node.layer = layer;
            for (let i = 0; i < node.children.length; i++) {
                stack.push(node.children[i]);
            }
        }
    }
}
