import {ICharset, stringFromCodePoints} from "../charset";
import {TypedArrayUtil} from "../../typedArray";

export class UTF16Charset implements ICharset {

    readonly name: string;
    private readonly nativeOrder: boolean;
    private readonly writeBOM: 0 | 1;
    constructor(name: string = "UTF_16", nativeOrder: boolean = true, writeBOM: boolean = true) {
        this.name = name;
        this.nativeOrder = nativeOrder;
        this.writeBOM = writeBOM ? 1 : 0;
    }

    encode(str: string): Uint8Array {
        const u16 = new Uint16Array(str.length + this.writeBOM);
        const u8 = TypedArrayUtil.withSharedBuffer(u16, Uint8Array);
        if (this.writeBOM) u16[0] = this.nativeOrder ? 0xFEFF : 0xFFFE;
        for (let i=0; i < str.length; i++) {
            u16[i + this.writeBOM] = str.charCodeAt(i);
            if (!this.nativeOrder) {
                let z: number = (i + this.writeBOM) << 1;
                let hi: number = u8[z];
                u8[z] = u8[z |= 1];
                u8[z] = hi;
            }
        }
        return u8;
    }

    decode(u8: Uint8Array): string {
        const byteLength: number = u8.length;
        if (byteLength === 0) return "";
        if ((byteLength & 1) === 1) throw new Error("Cannot decode UTF-16 data with odd length (" + byteLength + ")");
        const u16: Uint16Array = TypedArrayUtil.withSharedBuffer(u8, Uint16Array);
        return stringFromCodePoints(u16, !this.nativeOrder, true);
    }

    get [Symbol.toStringTag]() {
        return `Charset{${this.name}}`;
    }

}

export class UTF16BECharset extends UTF16Charset {

    constructor() {
        super("UTF_16BE", TypedArrayUtil.isBigEndian(), false);
    }

}

export class UTF16LECharset extends UTF16Charset {

    constructor() {
        super("UTF_16LE", !TypedArrayUtil.isBigEndian(), false);
    }

}
