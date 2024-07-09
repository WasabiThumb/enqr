/*

   Copyright 2024 Wasabi Codes

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

*/

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
