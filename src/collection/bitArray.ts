
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer/transfer
import {StringBuilder} from "../util/string";

type TransferableArrayBuffer = ArrayBuffer & {
    transfer(length: number): ArrayBuffer
};

function ctz32(x: number): number {
    return x | 0 ? 31 - Math.clz32(x & -x) : 32;
}

export class BitArray {

    static readonly LOAD_FACTOR: number = 0.75;

    static of(array: ArrayLike<number | boolean>): BitArray {
        const ret = new BitArray(array.length);
        for (let i=0; i < array.length; i++) {
            if (array[i]) ret.set(i);
        }
        return ret;
    }

    private buf: ArrayBuffer | TransferableArrayBuffer;
    private i32: Int32Array;
    private size: number;

    constructor(size: number = 0) {
        this.size = size;
        this.buf = new ArrayBuffer(Math.floor((size + 31) / 32) * 4);
        this.i32 = new Int32Array(this.buf);
    }

    get length(): number {
        return this.size;
    }

    getSize(): number {
        return this.size;
    }

    get byteCount(): number {
        return (this.size + 7) >> 3;
    }

    //

    private ensureCapacity(newSize: number) {
        if (newSize > this.buf.byteLength * 8) {
            const target = Math.floor((Math.ceil(newSize / BitArray.LOAD_FACTOR) + 31) / 32) * 4;
            if ("transfer" in this.buf) {
                this.buf = this.buf.transfer(target);
                this.i32 = new Int32Array(this.buf);
            } else {
                const n = new ArrayBuffer(target);
                const arr = new Int32Array(n);
                arr.set(this.i32);
                this.buf = n;
                this.i32 = arr;
            }
            this.size = newSize;
        } else {
            this.size = Math.max(this.size, newSize);
        }
    }

    private rangeCheck(index: number): void {
        if (index < 0 || index >= this.size) throw new Error(`Index ${index} out of bounds for length ${this.size}`);
    }

    //

    get(i: number): boolean {
        this.rangeCheck(i);
        return (this.i32[i >> 5] & (1 << (i & 31))) != 0;
    }

    set(i: number): void {
        this.rangeCheck(i);
        this.i32[i >> 5] |= (1 << (i & 31));
    }

    flip(i: number): void {
        this.rangeCheck(i);
        this.i32[i >> 5] ^= (1 << (i & 31));
    }

    getNextSet(from: number = 0): number {
        if (from >= this.size) return this.size;
        let bitsOffset = from >> 5;
        let currentBits = this.i32[bitsOffset];
        currentBits &= -(1 << (from & 31));
        while (currentBits === 0) {
            if ((++bitsOffset) > this.i32.length) return this.size;
            currentBits = this.i32[bitsOffset];
        }
        const result = (bitsOffset * 32) + ctz32(currentBits);
        return Math.min(result, this.size);
    }

    getNextUnset(from: number = 0): number {
        if (from >= this.size) return this.size;
        let bitsOffset = from >> 5;
        let currentBits = ~this.i32[bitsOffset];
        currentBits &= -(1 << (from & 31));
        while (currentBits === 0) {
            if ((++bitsOffset) > this.i32.length) return this.size;
            currentBits = ~this.i32[bitsOffset];
        }
        const result = (bitsOffset * 32) + ctz32(currentBits);
        return Math.min(result, this.size);
    }

    setBulk(index: number, newBits: number): void {
        this.i32[index >>> 5] = newBits;
    }

    private withRange(start: number, end: number, fn: (value: number, mask: number) => number, write: boolean = true) {
        if (end < start) throw new Error(`Range end (${end}) is less than range start (${start})`);
        this.rangeCheck(start);
        if (end === start) return;
        end--;
        this.rangeCheck(end);

        let firstInt = start >> 5;
        let lastInt = end >> 5;
        let firstBit: number;
        let lastBit: number;
        let mask: number;
        for (let i=firstInt; i <= lastInt; i++) {
            firstBit = i > firstInt ? 0 : start & 0x1F;
            lastBit = i < lastInt ? 31 : end & 0x1F;
            mask = (2 << lastBit) - (1 << firstBit);

            const out = fn(this.i32[i], mask);
            if (write) {
                this.i32[i] = out as number;
            } else if (!out) {
                return;
            }
        }
    }

    setRange(start: number, end: number): void {
        this.withRange(start, end, (value, mask) => value | mask);
    }

    clear(): void {
        this.i32.fill(0);
    }

    isRange(start: number, end: number, value: boolean = true): boolean {
        let ret: boolean = true;
        this.withRange(start, end, (v, mask) => {
            if ((v & mask) !== (value ? mask : 0)) {
                ret = false;
                return 0;
            }
            return 1;
        });
        return ret;
    }

    appendBit(bit: boolean = true): void {
        const s: number = this.size;
        this.ensureCapacity(s + 1);
        if (bit) this.set(s);
    }

    appendBits(value: number, numBits: number = 32): void {
        if (numBits < 0 || numBits > 32) throw new Error("Number of bits must be between 0 and 32");
        let i: number = this.size;
        this.ensureCapacity(i + numBits);
        for (let rem = numBits - 1; rem >= 0; rem--) {
            if ((value & (1 << rem)) !== 0) {
                this.i32[i >> 5] |= 1 << (i & 0x1F);
            }
            i++;
        }
    }

    appendBitArray(other: BitArray): void {
        const oS = other.size;
        const mS = this.size;
        this.ensureCapacity(mS + oS);
        for (let i=0; i < oS; i++) {
            if (other.get(i)) this.set(mS + i);
        }
    }

    clone(): BitArray {
        const ret = new BitArray(this.size);
        ret.i32.set(this.i32);
        return ret;
    }

    copyTo(dest: Int32Array, offset: number = 0): void {
        const maxLen: number = dest.length - offset;
        let src: Int32Array = this.i32;
        if (maxLen < src.length) {
            src = src.subarray(0, maxLen);
        }
        dest.set(src, offset);
    }

    xor(other: BitArray): void {
        if (this.size !== other.size) throw new Error("Size mismatch (" + this.size + " and " + other.size + ")");
        for (let i=0; i < this.i32.length; i++) {
            this.i32[i] ^= other.i32[i];
        }
    }

    toBytes(bitOffset: number, array: Uint8Array, offset: number, numBytes: number) {
        for (let i=0; i < numBytes; i++) {
            let theByte: number = 0;
            for (let j=0; j < 8; j++) {
                if (this.get(bitOffset)) theByte |= 1 << (7 - j);
                bitOffset++;
            }
            array[offset + i] = theByte;
        }
    }

    toString(): string {
        const sb = new StringBuilder(this.size + (this.size >> 3) + 1);
        for (let i=0; i < this.size; i++) {
            if ((i & 0x7) === 0) sb.appendSpace();
            sb.appendChar(this.get(i) ? 88 : 46);
        }
        return sb.toString();
    }

}
