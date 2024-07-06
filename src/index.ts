import * as Lib from "./lib";

//

type EnQR = (content: string | Uint8Array, hints?: Lib.EncodeHints) => Lib.QRCode;

/**
 * Encodes a QR code
 * @param content The content of the QR code, see [Barcode Contents](https://github.com/zxing/zxing/wiki/Barcode-Contents)
 * @param hints Hints to give to the encoder, such as preferred charset, QR version, and error correction level
 */
const EnQR: EnQR = ((content: string | Uint8Array, hints?: Lib.EncodeHints) => {
    return Lib.Encoder.encode(content, hints);
});

export = EnQR;
