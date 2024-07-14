import {ICharset} from "../charset";

export class UTF8Charset implements ICharset {

    readonly name: string = "UTF_8";
    readonly encoder: TextEncoder = new TextEncoder();
    readonly decoder: TextDecoder = new TextDecoder();

    encode(str: string): Uint8Array {
        return this.encoder.encode(str);
    }

    decode(buf: Uint8Array): string {
        return this.decoder.decode(buf);
    }

    toString(): string {
        return this.name;
    }

    get [Symbol.toStringTag]() {
        return `Charset{${this.name}}`;
    }

}
