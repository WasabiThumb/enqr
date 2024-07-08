import {StringBuilder} from "../util/string";
import {BitMatrix} from "./bitMatrix";

/**
 * Reference: {@link https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/qrcode/encoder/ByteMatrix.java zxing.qrcode.encoder.ByteMatrix}
 *
 * The original author of this class made the smart decision to use a byte array instead of an int array, since
 * it only ever stores -1, 0 or 1. This makes sense from a Java perspective as it balances speed and memory footprint.
 * An int array also makes sense from a C/C++ perspective where the native int type is usually going to be the fastest.
 * However we are in the nightmare world that is JavaScript, so I decided to pack each cell in the matrix into a
 * ternary value (2 bits) where the MSB is 0 if the value is -1 (unset) or 1 if the LSB should be treated as the value.
 * For fun, of course! :)
 *
 * This also naturally solves an [issue in zxing](https://github.com/zxing/zxing/blob/2fb22b724660b9af7edd22fc0f88358fdaf63aa1/core/src/main/java/com/google/zxing/qrcode/encoder/MatrixUtil.java#L124)
 * where the matrix is explicitly cleared with ``-1``. In C/C++ this makes sense, as ``malloc``'d data is uninitialized
 * and there is no guarantee about the value it contains. However for Java & JavaScript, int arrays are guaranteed to
 * be initialized with ``0`` and hence I used ``0`` to mark a ternary as unset. This means that after construction,
 * the matrix is already effectively initialized to ``-1``.
 */
export class TernaryMatrix {

    readonly width: number;
    readonly height: number;
    private readonly data: Uint8Array;

    constructor(width: number, height: number) {
        const octets: number = ((width * height - 1) >> 2) + 1;
        this.width = width;
        this.height = height;
        this.data = new Uint8Array(octets);
    }

    private _boundsCheck(x: number, y: number): void {
        if (x < 0 || x >= this.width) throw new Error(`X Index ${x} out of bounds for range ${this.width}`);
        if (y < 0 || y >= this.height) throw new Error(`Y Index ${y} out of bounds for range ${this.height}`);
    }

    /**
     * Allocates a NEW array containing a view of the matrix.
     */
    getArray(
        x: number = 0,
        y: number = 0,
        w: number = this.width - x,
        h: number = this.height - y
    ): TernaryValue[][] {
        if (w < 1 || h < 1) return [];
        this._boundsCheck(x, y);
        this._boundsCheck(x + w - 1, y + h - 1);

        const rows: TernaryValue[][] = new Array(h);
        for (let my=0; my < h; my++) {
            const row: TernaryValue[] = new Array(w);
            for (let mx=0; mx < w; mx++) {
                row[mx] = this.get(x + mx, y + my);
            }
            rows[my] = row;
        }
        return rows;
    }

    private get0(x: number, y: number): TernaryValue {
        let index: number = ((y * this.width) + x);
        const octet: number = this.data[index >> 2];
        index = (index << 1) & 7;

        if (octet & (1 << index)) {
            return ((octet >> (index | 1)) & 1) as 0 | 1;
        }
        return -1;
    }

    get(x: number, y: number): TernaryValue {
        this._boundsCheck(x, y);
        return this.get0(x, y);
    }

    private set0(x: number, y: number, value: TernaryValue | number | boolean = -1): void {
        let index: number = ((y * this.width) + x);
        const octetIndex: number = index >> 2;
        let octet: number = this.data[octetIndex];
        index = (index << 1) & 7;

        let f: number = (1 << index);
        if (value === -1) {
            octet &= (~f);
        } else {
            octet |= f;
            f = (1 << (index | 1));
            if (value) {
                octet |= f;
            } else {
                octet &= (~f);
            }
        }

        this.data[octetIndex] = octet;
    }

    set(x: number, y: number, value: TernaryValue | number | boolean = 1): void {
        this._boundsCheck(x, y);
        this.set0(x, y, value);
    }

    clear(value?: TernaryValue) {
        if (typeof value === "undefined" || value === -1) {
            this.data.fill(0);
        } else {
            this.data.fill(value ? 0xFF : 0b01010101);
        }
    }

    toString(): string {
        const sb = new StringBuilder((2 * this.width + 1) * this.height);
        for (let y=0; y < this.height; y++) {
            for (let x=0; x < this.width; x++) {
                sb.appendSpace();
                switch (this.get(x, y)) {
                    case 0:
                        sb.appendDigit(0);
                        break;
                    case 1:
                        sb.appendDigit(1);
                        break;
                    default:
                        sb.appendSpace();
                        break;
                }
            }
            sb.appendNewline();
        }
        return sb.toString();
    }

    clone(): TernaryMatrix {
        const ret = new TernaryMatrix(this.width, this.height);
        ret.data.set(this.data);
        return ret;
    }

    toBitMatrix(truthyValue: TernaryValue = 1): BitMatrix {
        const ret = new BitMatrix(this.width, this.height);
        for (let y=0; y < this.height; y++) {
            for (let x=0; x < this.width; x++) {
                if (this.get(x, y) === truthyValue) ret.set(x, y, true);
            }
        }
        return ret;
    }

}

/**
 * Value stored in a {@link TernaryMatrix}.
 */
export type TernaryValue = -1 | 0 | 1;
