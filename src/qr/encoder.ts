import {ErrorCorrectionLevel, ErrorCorrectionLevelID} from "../ec/level";
import {Version} from "./version";
import {Charset, CharsetName, Charsets} from "../util/string";
import {TernaryMatrix} from "../collection/ternaryMatrix";
import {MaskUtil} from "../util/mask";
import {QRCode} from "./qrcode";
import {BitArray} from "../collection/bitArray";
import {Mode} from "./mode";
import {ReedSolomonEncoder} from "../ec/encoder";
import {GenericGF} from "../ec/gf";
import {MatrixUtil} from "../util/matrix";

/*
 * Reference: https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/EncodeHintType.java
 */

export type EncodeHints = {
    /**
     * Error correction level. Can either be a string containing the level ID, or a value within the
     * {@link ErrorCorrectionLevel} enum. This defaults to {@link ErrorCorrectionLevel.L L}
     * - **L** = ~7% correction
     * - **M** = ~15% correction
     * - **Q** = ~25% correction
     * - **H** = ~30% correction
     * @see ErrorCorrectionLevel
     */
    errorCorrection?: ErrorCorrectionLevel | ErrorCorrectionLevelID | string,
    /**
     * The character set to use. This is ignored if the encoder receives a {@link Uint8Array} instead of a string.
     * If unspecified, the encoder will likely default to {@link Charsets.ISO_8859_1 ISO_8859_1}.
     * Note that this does not mean {@link Charsets.ISO_8859_1 ISO_8859_1} will **always** be used, since if the data
     * can fit within the {@link Mode.NUMERIC NUMERIC} or {@link Mode.ALPHANUMERIC ALPHANUMERIC} modes, it will use
     * their proprietary encodings.
     *
     * Specifying {@link Charsets.SHIFT_JIS SHIFT_JIS} as the character set also allows {@link Mode.KANJI KANJI} mode
     * to be selected; if you do not specify {@link Charsets.SHIFT_JIS SHIFT_JIS} this mode will never be used.
     *
     * The native encoding for JavaScript is {@link Charsets.UTF_8 UTF_8}, so it may be more optimal when you know that
     * you are storing arbitrary data or strings that are non-alphanumeric.
     */
    characterSet?: Charset | CharsetName | string,
    /**
     * The version number of the QR code. This ranges from 1 - 40, other values will cause an error. If unspecified,
     * the encoder calculates the size of the smallest QR code that can hold the specified data, or throws if a
     * version 40 QR code cannot hold the data.
     *
     * <a href="https://www.qrcode.com/en/about/version.html">See here</a> for a good summary of QR code versions.
     */
    qrVersion?: Version | number,
    /**
     * The mask pattern of the QR code. This ranges from 0 (inclusive) to {@link QRCode.NUM_MASK_PATTERNS NUM_MASK_PATTERNS}
     * (exclusive). The mask pattern applies globally to the data sections of the QR code, obfuscating it in a known
     * and reversible way. The goal of this process (in general) is to maximize the QR code's readability. If unspecified,
     * the encoder tries all patterns and selects the one that satisfies all 4 readability criteria maximally.
     */
    qrMaskPattern?: number,
    /**
     * Whether to perform compact encoding. Not currently supported.
     */
    qrCompact?: boolean,
    /**
     * Whether to use GS1 format.
     *
     * Author note: I'm not sure what this does. I ported this from [zxing](https://github.com/zxing/zxing) and it
     * appears to be spec compliant, but it seemingly just adds a couple bits to the header.
     */
    gs1Format?: boolean
};

const DefaultEncodeHints: Required<EncodeHints> = {
    errorCorrection: ErrorCorrectionLevel.L,
    characterSet: Charsets.UTF_8,
    qrVersion: 1,
    qrMaskPattern: -1,
    qrCompact: false,
    gs1Format: false
};

export namespace EncodeHints {

    export function has(hints: EncodeHints | undefined, key: keyof EncodeHints): boolean {
        if (typeof hints === "undefined") return false;
        return typeof hints[key] !== "undefined";
    }

    export function get<K extends keyof EncodeHints>(hints: EncodeHints | undefined, key: K): Required<EncodeHints>[K] {
        if (typeof hints === "undefined") return DefaultEncodeHints[key];
        let v = hints[key];
        if (typeof v === "undefined") return DefaultEncodeHints[key];
        return v as Required<EncodeHints>[K];
    }

}

type BlockPair = {
    dataBytes: Uint8Array,
    errorCorrectionBytes: Uint8Array
};
function blockPair(dataBytes: Uint8Array, errorCorrectionBytes: Uint8Array): BlockPair {
    return { dataBytes, errorCorrectionBytes };
}

/*
 * Reference: https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/qrcode/encoder/Encoder.java
 */

export namespace Encoder {

    const ALPHANUMERIC_TABLE: number[] = [
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,  // 0x00-0x0f
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,  // 0x10-0x1f
        36, -1, -1, -1, 37, 38, -1, -1, -1, -1, 39, 40, -1, 41, 42, 43,  // 0x20-0x2f
        0,   1,  2,  3,  4,  5,  6,  7,  8,  9, 44, -1, -1, -1, -1, -1,  // 0x30-0x3f
        -1, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,  // 0x40-0x4f
        25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, -1, -1, -1, -1, -1,  // 0x50-0x5f
    ];
    export function getAlphanumericCode(code: number | string): number {
        if (typeof code === "string") {
            if (code.length < 1) throw new Error("Cannot convert empty string to codepoint");
            code = code.charCodeAt(0);
        } else if (code < 0) {
            return -1;
        }
        if (code < ALPHANUMERIC_TABLE.length) return ALPHANUMERIC_TABLE[code];
        return -1;
    }

    export const DEFAULT_BYTE_MODE_ENCODING: Charset = Charsets.ISO_8859_1;

    function calculateMaskPenalty(matrix: TernaryMatrix) {
        const array = matrix.getArray();
        const { width, height } = matrix;
        return MaskUtil.applyMaskPenaltyRule1(array, width, height) +
            MaskUtil.applyMaskPenaltyRule2(array, width, height) +
            MaskUtil.applyMaskPenaltyRule3(array, width, height) +
            MaskUtil.applyMaskPenaltyRule4(array, width, height);
    }

    export function encode(content: string | Uint8Array, hints?: EncodeHints): QRCode {
        const ecLevel = ErrorCorrectionLevel.parse(EncodeHints.get(hints, "errorCorrection"));

        let version: Version;
        let headerAndDataBits: BitArray;
        let mode: Mode;

        const hasGS1FormatHint: boolean = EncodeHints.get(hints, "gs1Format");
        const hasCompactionHint: boolean = EncodeHints.get(hints, "qrCompact");

        let encoding: Charset = DEFAULT_BYTE_MODE_ENCODING;
        let hasEncodingHint: boolean = EncodeHints.has(hints, "characterSet");
        if (typeof content !== "string") {
            // noinspection SuspiciousTypeOfGuard
            if (!(content instanceof Uint8Array)) throw new Error("Content must be string or Uint8Array");
            content = Charsets.UTF_8.decode(content);
            encoding = Charsets.UTF_8;
        }
        if (hasEncodingHint) {
            let value = hints!.characterSet!;
            if (typeof value === "object") {
                encoding = value as Charset;
            } else {
                encoding = Charset.forName(`${value}`);
            }
        }

        if (hasCompactionHint) {
            mode = Mode.BYTE;
            // TODO: Implement https://github.com/zxing/zxing/blob/2fb22b724660b9af7edd22fc0f88358fdaf63aa1/core/src/main/java/com/google/zxing/qrcode/encoder/Encoder.java#L102
            throw new Error("Compaction is not implemented");
        } else {
            mode = chooseMode(content, encoding);

            const headerBits = new BitArray();

            // Append ECI segment if applicable
            if (mode === Mode.BYTE && hasEncodingHint) {
                const eci = Charset.getECI(encoding);
                if (!!eci) appendECI(eci, headerBits);
            }

            if (hasGS1FormatHint) {
                appendModeInfo(Mode.FNC1_FIRST_POSITION, headerBits);
            }

            appendModeInfo(mode, headerBits);

            // Collect data within the main segment
            const dataBits = new BitArray();
            appendBytes(content, mode, dataBits, encoding);

            if (EncodeHints.has(hints, "qrVersion")) {
                let verProto = EncodeHints.get(hints, "qrVersion");
                version = (typeof verProto === "number") ? Version.getVersionForNumber(verProto) : verProto as Version;
                const bitsNeeded: number = calculateBitsNeeded(mode, headerBits, dataBits, version);
                if (!willFit(bitsNeeded, version, ecLevel)) {
                    throw new Error("Data too big for requested version");
                }
            } else {
                version = recommendVersion(ecLevel, mode, headerBits, dataBits);
            }

            headerAndDataBits = new BitArray();
            headerAndDataBits.appendBitArray(headerBits);

            const numLetters = (mode === Mode.BYTE) ? dataBits.byteCount : content.length;
            appendLengthInfo(numLetters, version, mode, headerAndDataBits);
            headerAndDataBits.appendBitArray(dataBits);
        }

        const ecBlocks = version.getECBlocksForLevel(ecLevel);
        const numDataBytes: number = version.totalCodewords - ecBlocks.totalECCodewords;

        terminateBits(numDataBytes, headerAndDataBits);

        const finalBits: BitArray = interleaveWithECBytes(headerAndDataBits, version.totalCodewords, numDataBytes, ecBlocks.numBlocks);

        const qrCode: QRCode = QRCode();
        qrCode.ecLevel = ecLevel;
        qrCode.mode = mode;
        qrCode.version = version;

        const dimension: number = version.dimensionForVersion;
        const matrix = new TernaryMatrix(dimension, dimension);

        let maskPattern: number = EncodeHints.get(hints, "qrMaskPattern");
        if (maskPattern !== -1 && !QRCode.isValidMaskPattern(maskPattern)) maskPattern = -1;
        if (maskPattern === -1) maskPattern = chooseMaskPattern(finalBits, ecLevel, version, matrix);
        qrCode.maskPattern = maskPattern;

        MatrixUtil.buildMatrix(finalBits, ecLevel, version, maskPattern, matrix);
        qrCode.matrix = matrix;

        return qrCode;
    }

    function recommendVersion(ecLevel: ErrorCorrectionLevel, mode: Mode, headerBits: BitArray, dataBits: BitArray): Version {
        const provisionalBitsNeeded: number = calculateBitsNeeded(mode, headerBits, dataBits, Version.getVersionForNumber(1));
        const provisionalVersion: Version = chooseVersion(provisionalBitsNeeded, ecLevel);
        const bitsNeeded = calculateBitsNeeded(mode, headerBits, dataBits, provisionalVersion);
        return chooseVersion(bitsNeeded, ecLevel);
    }

    function chooseVersion(numInputBits: number, ecLevel: ErrorCorrectionLevel): Version {
        for (let versionNum = 1; versionNum <= 40; versionNum++) {
            const version: Version = Version.getVersionForNumber(versionNum);
            if (willFit(numInputBits, version, ecLevel)) return version;
        }
        throw new Error("Data too big");
    }

    function chooseMaskPattern(bits: BitArray, ecLevel: ErrorCorrectionLevel, version: Version, matrix: TernaryMatrix) {
        let minPenalty: number = 0x7FFFFFFF;
        let bestMaskPattern: number = -1;
        for (let maskPattern=0; maskPattern < QRCode.NUM_MASK_PATTERNS; maskPattern++) {
            MatrixUtil.buildMatrix(bits, ecLevel, version, maskPattern, matrix);
            const penalty: number = calculateMaskPenalty(matrix);
            matrix.clear();
            if (penalty < minPenalty) {
                minPenalty = penalty;
                bestMaskPattern = maskPattern;
            }
        }
        return bestMaskPattern;
    }

    function calculateBitsNeeded(mode: Mode, headerBits: BitArray, dataBits: BitArray, version: Version): number {
        return headerBits.getSize() + Mode.getCharacterCountBits(mode, version) + dataBits.getSize();
    }

    function willFit(numInputBits: number, version: Version, ecLevel: ErrorCorrectionLevel): boolean {
        const numBytes: number = version.totalCodewords;
        const ecBlocks = version.getECBlocksForLevel(ecLevel);
        const numEcBytes = ecBlocks.totalECCodewords;
        const numDataBytes: number = numBytes - numEcBytes;
        const totalInputBytes: number = (numInputBits + 7) >> 3;
        return numDataBytes >= totalInputBytes;
    }

    export function terminateBits(numDataBytes: number, bits: BitArray): void {
        const capacity = numDataBytes * 8;
        if (bits.getSize() > capacity) {
            throw new Error("Data bits cannot fit in the QR code (" + bits.getSize() + " > " + capacity + ")");
        }

        for (let i = 0; i < 4 && bits.getSize() < capacity; i++) {
            bits.appendBit(false);
        }

        const numBitsInLastByte = bits.getSize() & 0x07;
        if (numBitsInLastByte > 0) {
            for (let i = numBitsInLastByte; i < 8; i++) {
                bits.appendBit(false);
            }
        }

        const numPaddingBytes: number = numDataBytes - bits.byteCount;
        for (let i = 0; i < numPaddingBytes; i++) {
            bits.appendBits((i & 1) === 0 ? 0xEC : 0x11, 8);
        }

        if (bits.getSize() !== capacity) throw new Error("Bit size does not equal capacity");
    }

    export function getNumDataBytesAndNumECBytesForBlockID(
        numTotalBytes: number,
        numDataBytes: number,
        numRSBlocks: number,
        blockID: number
    ): [ number, number ] {
        if (blockID >= numRSBlocks) throw new Error("Block ID too large");

        const numRsBlocksInGroup2: number = numTotalBytes % numRSBlocks;
        const numRsBlocksInGroup1: number = numRSBlocks - numRsBlocksInGroup2;
        const numTotalBytesInGroup1: number = Math.floor(numTotalBytes / numRSBlocks);
        const numTotalBytesInGroup2: number = numTotalBytesInGroup1 + 1;
        const numDataBytesInGroup1: number = Math.floor(numDataBytes / numRSBlocks);
        const numDataBytesInGroup2: number = numDataBytesInGroup1 + 1;
        const numEcBytesInGroup1: number = numTotalBytesInGroup1 - numDataBytesInGroup1;
        const numEcBytesInGroup2: number = numTotalBytesInGroup2 - numDataBytesInGroup2;

        if (numEcBytesInGroup1 !== numEcBytesInGroup2) throw new Error("EC bytes mismatch");
        if (numRSBlocks !== (numRsBlocksInGroup1 + numRsBlocksInGroup2)) throw new Error("RS blocks mismatch");
        if (numTotalBytes !=
            ((numDataBytesInGroup1 + numEcBytesInGroup1) *
                numRsBlocksInGroup1) +
            ((numDataBytesInGroup2 + numEcBytesInGroup2) *
                numRsBlocksInGroup2)) throw new Error("Total bytes mismatch");

        if (blockID < numRsBlocksInGroup1) {
            return [ numDataBytesInGroup1, numEcBytesInGroup1 ];
        } else {
            return [ numDataBytesInGroup2, numEcBytesInGroup2 ];
        }
    }

    export function interleaveWithECBytes(bits: BitArray, numTotalBytes: number, numDataBytes: number, numRSBlocks: number): BitArray {
        if (bits.byteCount !== numDataBytes) throw new Error("Number of bits and data bytes do not match");

        let dataBytesOffset: number = 0;
        let maxNumDataBytes: number = 0;
        let maxNumEcBytes: number = 0;

        const blocks: BlockPair[] = new Array(numRSBlocks);
        for (let i=0; i < numRSBlocks; i++) {
            let [
                size,
                numEcBytesInBlock
            ] = getNumDataBytesAndNumECBytesForBlockID(
                numTotalBytes, numDataBytes, numRSBlocks, i
            );

            const dataBytes = new Uint8Array(size);
            bits.toBytes(8 * dataBytesOffset, dataBytes, 0, size);
            const ecBytes: Uint8Array = generateECBytes(dataBytes, numEcBytesInBlock);
            blocks[i] = blockPair(dataBytes, ecBytes);

            maxNumDataBytes = Math.max(maxNumDataBytes, size);
            maxNumEcBytes = Math.max(maxNumEcBytes, ecBytes.length);
            dataBytesOffset += size;
        }

        const result = new BitArray();
        function appendComponent(k: keyof BlockPair, max: number) {
            for (let i=0; i < max; i++) {
                for (let block of blocks) {
                    let comp: Uint8Array = block[k];
                    if (i < comp.length) {
                        result.appendBits(comp[i], 8);
                    }
                }
            }
        }
        appendComponent("dataBytes", maxNumDataBytes);
        appendComponent("errorCorrectionBytes", maxNumEcBytes);

        if (numTotalBytes !== result.byteCount)
            throw new Error(`Interleaving error: ${numTotalBytes} and ${result.byteCount} differ`);

        return result;
    }

    export function generateECBytes(dataBytes: Uint8Array, numEcBytesInBlock: number): Uint8Array {
        const numDataBytes: number = dataBytes.length;
        const toEncode: Int32Array = new Int32Array(numDataBytes + numEcBytesInBlock);
        for (let i=0; i < numDataBytes; i++) toEncode[i] = dataBytes[i]; // AND 0xFF should not be necessary

        const encoder = new ReedSolomonEncoder(GenericGF.QR_CODE_FIELD_256);
        encoder.encode(toEncode, numEcBytesInBlock);

        const ecBytes = new Uint8Array(numEcBytesInBlock);
        for (let i=0; i < numEcBytesInBlock; i++) {
            ecBytes[i] = toEncode[numDataBytes + i];
        }
        return ecBytes;
    }

    export function chooseMode(content: string, encoding: Charset | null = null): Mode {
        if (Charsets.SHIFT_JIS === encoding && isOnlyDoubleByteKanji(content)) {
            return Mode.KANJI;
        }
        let flags: number = 0;
        let c: number;
        for (let i=0; i < content.length; i++) {
            c = content.charCodeAt(i);
            if (c >= 48 && c <= 57) {
                flags |= 1;
            } else if (getAlphanumericCode(c) !== -1) {
                flags |= 2;
            } else {
                return Mode.BYTE;
            }
        }
        switch (flags) {
            case 0:
                return Mode.BYTE;
            case 1:
                return Mode.NUMERIC;
            case 2:
            case 3:
                return Mode.ALPHANUMERIC;
            default:
                throw new Error();
        }
    }

    function isOnlyDoubleByteKanji(content: string): boolean {
        const bytes: Uint8Array = Charsets.SHIFT_JIS.encode(content);
        const length: number = bytes.length;
        if ((length % 2) !== 0) return false;

        let byte1: number;
        for (let i=0; i < length; i += 2) {
            byte1 = bytes[i]; // AND 0xFF should not be necessary as it is sourced from Uint8Array
            if ((byte1 < 0x81 || byte1 > 0x9F) && (byte1 < 0xE0 || byte1 > 0xEB)) return false;
        }
        return true;
    }

    export function appendLengthInfo(numLetters: number, version: Version, mode: Mode, bits: BitArray): void {
        const numBits: number = Mode.getCharacterCountBits(mode, version);
        if (numLetters >= (1 << numBits)) {
            throw new Error(`${numLetters} is bigger than ${(1 << numBits) - 1}`);
        }
        bits.appendBits(numLetters, numBits);
    }

    export function appendBytes(content: string, mode: Mode, bits: BitArray, encoding: Charset): void {
        switch (mode) {
            case Mode.NUMERIC:
                appendNumericBytes(content, bits);
                break;
            case Mode.ALPHANUMERIC:
                appendAlphanumericBytes(content, bits);
                break;
            case Mode.BYTE:
                append8BitBytes(content, bits, encoding);
                break;
            case Mode.KANJI:
                appendKanjiBytes(content, bits);
                break;
            default:
                throw new Error(`Invalid mode: ${Mode[mode]} (${mode})`);
        }
    }

    export function appendNumericBytes(content: string, bits: BitArray): void {
        const { length } = content;
        let i = 0;
        let num1: number, num2: number, num3: number;
        while (i < length) {
            num1 = content.charCodeAt(i) - 48;
            if (i + 2 < length) {
                // Encode 3 numeric letters in 10 bits
                num2 = content.charCodeAt(i + 1) - 48;
                num3 = content.charCodeAt(i + 2) - 48;
                bits.appendBits(num1 * 100 + num2 * 10 + num3, 10);
                i += 3;
            } else if (i + 1 < length) {
                // Encode 2 numeric letters in 7 bits
                num2 = content.charCodeAt(i + 1) - 48;
                bits.appendBits(num1 * 10 + num2, 7);
                i += 2;
            } else {
                // Encode 1 numeric letter in 4 bits
                bits.appendBits(num1, 4);
                i++;
            }
        }
    }

    export function appendAlphanumericBytes(content: string, bits: BitArray): void {
        const { length } = content;
        let i = 0;
        let code1: number, code2: number;
        while (i < length) {
            code1 = getAlphanumericCode(content.charCodeAt(i));
            if (code1 === -1) throw new Error();
            if ((i + 1) < length) {
                code2 = getAlphanumericCode(content.charCodeAt(i + 1));
                if (code2 === -1) throw new Error();

                bits.appendBits(code1 * 45 + code2, 11);
                i += 2;
            } else {
                bits.appendBits(code1, 6);
                i++;
            }
        }
    }

    export function append8BitBytes(content: string, bits: BitArray, encoding: Charset): void {
        const bytes: Uint8Array = encoding.encode(content);
        for (let i=0; i < bytes.length; i++) bits.appendBits(bytes[i], 8);
    }

    export function appendKanjiBytes(content: string, bits: BitArray): void {
        const bytes: Uint8Array = Charsets.SHIFT_JIS.encode(content);
        if (bytes.length % 2 !== 0) throw new Error("Kanji byte size not even");

        const maxI: number = bytes.length - 1;
        for (let i=0; i < maxI; i += 2) {
            const byte1: number = bytes[i] & 0xFF;
            const byte2: number = bytes[i + 1] & 0xFF;
            const code: number = (byte1 << 8) | byte2;
            let subtracted: number = -1;
            if (code >= 0x8140 && code <= 0x9ffc) {
                subtracted = code - 0x8140;
            } else if (code >= 0xe040 && code <= 0xebbf) {
                subtracted = code - 0xc140;
            }
            if (subtracted === -1) throw new Error("Invalid byte sequence");
            const encoded: number = ((subtracted >> 8) * 0xc0) + (subtracted & 0xff);
            bits.appendBits(encoded, 13);
        }
    }

    export function appendModeInfo(mode: Mode, bits: BitArray): void {
        bits.appendBits(mode, 4);
    }

    function appendECI(eci: number[], bits: BitArray): void {
        appendModeInfo(Mode.ECI, bits);
        // This is correct for values up to 127, which is all we need now.
        bits.appendBits(eci[0], 8);
    }

}