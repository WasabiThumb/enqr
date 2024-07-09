import {BitArray} from "./bitArray";

/**
 * Reference: https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/common/BitMatrix.java
 */
export class BitMatrix {

    private static ACCESS_HINT_PRIVATE = Symbol();

    /**
     * For internal usage. Creates a BitMatrix from the specified bits with a width of at most 8
     */
    static raw(width: number, ...rows: number[]): BitMatrix {
        const height: number = rows.length;
        const row = new BitArray(width);
        const ret = new BitMatrix(width, height);
        for (let i=0; i < height; i++) {
            row.setBulk(0, rows[i]);
            ret.setRow(i, row);
        }
        return ret;
    }

    readonly width: number;
    readonly height: number;
    private readonly rowSize: number;
    private readonly bits: Int32Array;
    constructor(width: number, height: number, rowSize?: number, bits?: Int32Array, accessHint?: symbol) {
        if (BitMatrix.ACCESS_HINT_PRIVATE === accessHint) {
            this.rowSize = rowSize!;
            this.bits = (!!bits) ? bits : new Int32Array(rowSize! * height);
        } else {
            if (width < 1 || height < 1) throw new Error("Both dimensions must be greater than 0");
            this.rowSize = (width + 31) >> 5;
            this.bits = new Int32Array(this.rowSize * height);
        }
        this.width = width;
        this.height = height;
    }

    private checkBounds(x: number, y: number): void {
        if (x < 0 || x >= this.width) throw new Error(`X index ${x} out of bounds for width ${this.width}`);
        if (y < 0 || y >= this.height) throw new Error(`Y index ${y} out of bounds for height ${this.height}`);
    }

    get(x: number, y: number): boolean {
        this.checkBounds(x, y);
        const offset: number = (y * this.rowSize) + (x >> 5);
        return ((this.bits[offset] >>> (x & 0x1F)) & 1) !== 0;
    }

    set(x: number, y: number, value: boolean = true): void {
        this.checkBounds(x, y);
        const offset: number = (y * this.rowSize) + (x >> 5);
        const f: number = 1 << (x & 0x1F);
        if (value) {
            this.bits[offset] |= f;
        } else {
            this.bits[offset] &= ~f;
        }
    }

    unset(x: number, y: number): void {
        this.set(x, y, false);
    }

    /**
     * @see flipAll
     */
    flip(x: number, y: number): void {
        const offset: number = (y * this.rowSize) + (x >> 5);
        this.bits[offset] ^= 1 << (x & 0x1F);
    }

    flipAll(): void {
        for (let i=0; i < this.bits.length; i++) {
            this.bits[i] = ~this.bits[i];
        }
    }

    clear(): void {
        this.bits.fill(0);
    }

    setRegion(left: number, top: number, width: number, height: number) {
        if (top < 0 || left < 0) {
            throw new Error("Left and top must be non-negative");
        }
        if (width < 1 || height < 1) {
            throw new Error("Width and height must be at least 1");
        }
        const right: number = left + width;
        const bottom: number = top + height;
        if (bottom > this.height || right > this.width) {
            throw new Error("The region must fit inside the matrix");
        }

        let offset: number;
        for (let y=top; y < bottom; y++) {
            offset = y * this.rowSize;
            for (let x=left; x < right; x++) {
                this.bits[offset + (x >> 5)] |= 1 << (x & 0x1F);
            }
        }
    }

    getRow(y: number, row?: BitArray): BitArray {
        if (typeof row === "undefined" || row.getSize() < this.width) {
            row = new BitArray(this.width);
        } else {
            row.clear();
        }
        let offset: number = y * this.rowSize;
        for (let x=0; x < this.rowSize; x++) {
            row.setBulk(x * 32, this.bits[offset + x]);
        }
        return row;
    }

    setRow(y: number, row: BitArray): void {
        row.copyTo(this.bits, y * this.rowSize);
    }

    clone(): BitMatrix {
        const cpy = new Int32Array(this.bits.length);
        cpy.set(this.bits);
        return new BitMatrix(this.width, this.height, this.rowSize, cpy, BitMatrix.ACCESS_HINT_PRIVATE);
    }

}
