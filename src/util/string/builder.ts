import {TypedArrayUtil} from "../typedArray";
import {stringFromCodePoints} from "./charset";

export class StringBuilder {

    private static LOAD_FACTOR: number = 0.75;

    private arr: Uint16Array;
    private capacity: number;
    private index: number;
    constructor(capacity: number = 16) {
        this.capacity = Math.abs(capacity);
        this.arr = new Uint16Array(this.capacity);
        this.index = 0;
    }

    private ensureCapacity(extra: number): void {
        let target: number = this.index + extra;
        if (target <= this.capacity) return;

        target = Math.ceil(target / StringBuilder.LOAD_FACTOR);

        let ab: ArrayBuffer = this.arr.buffer;
        ab = TypedArrayUtil.transferArrayBuffer(ab, target << 1);
        this.arr = new Uint16Array(ab);

        this.capacity = target;
    }

    get length(): number {
        return this.index;
    }

    clear() {
        this.index = 0;
    }

    append(value: string | { toString(): string }): this {
        this.appendString(typeof value === "string" ? value : value.toString());
        return this;
    }

    appendSpace(): this {
        return this.appendChar(32);
    }

    appendNewline(): this {
        return this.appendChar(10);
    }

    appendDigit(d: number): this {
        return this.appendChar(48 + (d & 0xF));
    }

    appendChar(c: number): this {
        this.ensureCapacity(1);
        this.arr[this.index++] = c;
        return this;
    }

    appendString(s: string): this {
        this.ensureCapacity(s.length);
        for (let i=0; i < s.length; i++) this.arr[this.index++] = s.charCodeAt(i);
        return this;
    }

    toString(): string {
        return stringFromCodePoints(this.arr.subarray(0, this.index));
    }

}