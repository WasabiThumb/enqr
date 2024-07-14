import {isNode} from "browser-or-node";


export namespace TypedArrayUtil {

    // Is BE

    const IS_BIG_ENDIAN: boolean = (() => {
        const buf = new ArrayBuffer(2);
        const u8 = new Uint8Array(buf);
        const u16 = new Uint16Array(buf);
        u8[0] = 0xAA;
        u8[1] = 0xBB;
        return u16[0] === 0xAABB;
    })();

    export function isBigEndian(): boolean {
        return IS_BIG_ENDIAN;
    }

    // ArrayBuffer transfer

    type TransferableArrayBuffer = ArrayBuffer & {
        transfer(length: number): ArrayBuffer
    };

    export function transferArrayBuffer(a: ArrayBuffer, size: number): ArrayBuffer {
        if ("transfer" in a) return (a as TransferableArrayBuffer).transfer(size);
        const newBuffer = new ArrayBuffer(size);
        (new Uint8Array(newBuffer)).set(new Uint8Array(a), 0);
        return newBuffer;
    }

    // Shared buffer

    export function withSharedBuffer<T extends ArrayBufferView>(
        source: ArrayBufferView,
        to: { new(buffer: ArrayBuffer, offset: number, length: number): T, BYTES_PER_ELEMENT: number }
    ): T {
        let length: number = source.byteLength;
        const bytesPerElement: number = to.BYTES_PER_ELEMENT;

        if (bytesPerElement !== 1) {
            if ((length & (bytesPerElement - 1)) !== 0)
                throw new Error(`Source length ${length} is not a multiple of ${bytesPerElement}`);
            length >>= (31 - Math.clz32(bytesPerElement));
        }

        return new to(source.buffer, source.byteOffset, length);
    }

    // Base64

    export function fromBase64(base64: string): Uint8Array {
        if (isNode) {
            return Buffer.from(base64, "base64");
        }
        const binary: string = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i=0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    export function toBase64(buf: Uint8Array): string {
        if (isNode) {
            if (buf.constructor.name === "Buffer") return (buf as Buffer).toString("base64");
            return Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength).toString("base64");
        }
        return btoa((new TextDecoder()).decode(buf));
    }

}
