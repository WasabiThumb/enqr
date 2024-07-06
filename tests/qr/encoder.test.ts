import {assertEquals, assertSame, assertTrue, runTests, Test} from "../junit";
import {Encoder} from "../../src/qr/encoder";
import {Mode} from "../../src/qr/mode";
import {Charsets, StringBuilder} from "../../src/util/string";
import {ErrorCorrectionLevel} from "../../src/ec/level";
import {QRCode} from "../../src/qr/qrcode";
import {BitArray} from "../../src/collection/bitArray";
import {Version} from "../../src/qr/version";

/*
 * Reference: https://github.com/zxing/zxing/blob/master/core/src/test/java/com/google/zxing/qrcode/encoder/EncoderTestCase.java
 */

// noinspection JSMethodCanBeStatic
class EncoderTest {

    @Test()
    getAlphanumericCode() {
        // The first 10 code points are numbers
        const ZERO: number = '0'.charCodeAt(0);
        for (let i=0; i < 10; i++) {
            assertEquals(i, Encoder.getAlphanumericCode(ZERO + i));
        }

        // The next 26 code points are capital alphabet letters
        const A: number = 'A'.charCodeAt(0);
        for (let i=10; i < 36; i++) {
            assertEquals(i, Encoder.getAlphanumericCode(A + i - 10));
        }

        // Others are symbol letters
        assertEquals(36, Encoder.getAlphanumericCode(' '));
        assertEquals(37, Encoder.getAlphanumericCode('$'));
        assertEquals(38, Encoder.getAlphanumericCode('%'));
        assertEquals(39, Encoder.getAlphanumericCode('*'));
        assertEquals(40, Encoder.getAlphanumericCode('+'));
        assertEquals(41, Encoder.getAlphanumericCode('-'));
        assertEquals(42, Encoder.getAlphanumericCode('.'));
        assertEquals(43, Encoder.getAlphanumericCode('/'));
        assertEquals(44, Encoder.getAlphanumericCode(':'));

        // Should return -1 for other letters;
        assertEquals(-1, Encoder.getAlphanumericCode('a'));
        assertEquals(-1, Encoder.getAlphanumericCode('#'));
        assertEquals(-1, Encoder.getAlphanumericCode('\0'));
    }

    @Test()
    chooseMode() {
        // Numeric mode
        assertSame(Mode.NUMERIC, Encoder.chooseMode("0"));
        assertSame(Mode.NUMERIC, Encoder.chooseMode("0123456789"));

        // Alphanumeric mode
        assertSame(Mode.ALPHANUMERIC, Encoder.chooseMode("A"));
        assertSame(Mode.ALPHANUMERIC, Encoder.chooseMode("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:"));

        // 8-bit byte mode
        assertSame(Mode.BYTE, Encoder.chooseMode("a"));
        assertSame(Mode.BYTE, Encoder.chooseMode("#"));
        assertSame(Mode.BYTE, Encoder.chooseMode(""));

        // Kanji mode (maybe this should be removed? see note from upstream)
        // https://github.com/zxing/zxing/blob/2fb22b724660b9af7edd22fc0f88358fdaf63aa1/core/src/test/java/com/google/zxing/qrcode/encoder/EncoderTestCase.java#L82
        assertSame(Mode.BYTE,
            Encoder.chooseMode(this.shiftJISString(this.bytes(0x8, 0xa, 0x8, 0xa, 0x8, 0xa, 0x8, 0xa6))));
        assertSame(Mode.BYTE, Encoder.chooseMode(this.shiftJISString(this.bytes(0x9, 0xf, 0x9, 0x7b))));
        assertSame(Mode.BYTE, Encoder.chooseMode(this.shiftJISString(this.bytes(0xe, 0x4, 0x9, 0x5, 0x9, 0x61))));
    }

    @Test()
    encode() {
        const qrCode = Encoder.encode("ABCDEF", {
            errorCorrection: ErrorCorrectionLevel.H
        });
        const expected: string = "<<\n" +
            " mode: ALPHANUMERIC\n" +
            " ecLevel: H\n" +
            " version: 1\n" +
            " maskPattern: 0\n" +
            " matrix:\n" +
            " 1 1 1 1 1 1 1 0 1 1 1 1 0 0 1 1 1 1 1 1 1\n" +
            " 1 0 0 0 0 0 1 0 0 1 1 1 0 0 1 0 0 0 0 0 1\n" +
            " 1 0 1 1 1 0 1 0 0 1 0 1 1 0 1 0 1 1 1 0 1\n" +
            " 1 0 1 1 1 0 1 0 1 1 1 0 1 0 1 0 1 1 1 0 1\n" +
            " 1 0 1 1 1 0 1 0 0 1 1 1 0 0 1 0 1 1 1 0 1\n" +
            " 1 0 0 0 0 0 1 0 0 1 0 0 0 0 1 0 0 0 0 0 1\n" +
            " 1 1 1 1 1 1 1 0 1 0 1 0 1 0 1 1 1 1 1 1 1\n" +
            " 0 0 0 0 0 0 0 0 0 0 1 0 1 0 0 0 0 0 0 0 0\n" +
            " 0 0 1 0 1 1 1 0 1 1 0 0 1 1 0 0 0 1 0 0 1\n" +
            " 1 0 1 1 1 0 0 1 0 0 0 1 0 1 0 0 0 0 0 0 0\n" +
            " 0 0 1 1 0 0 1 0 1 0 0 0 1 0 1 0 1 0 1 1 0\n" +
            " 1 1 0 1 0 1 0 1 1 1 0 1 0 1 0 0 0 0 0 1 0\n" +
            " 0 0 1 1 0 1 1 1 1 0 0 0 1 0 1 0 1 1 1 1 0\n" +
            " 0 0 0 0 0 0 0 0 1 0 0 1 1 1 0 1 0 1 0 0 0\n" +
            " 1 1 1 1 1 1 1 0 0 0 1 0 1 0 1 1 0 0 0 0 1\n" +
            " 1 0 0 0 0 0 1 0 1 1 1 1 0 1 0 1 1 1 1 0 1\n" +
            " 1 0 1 1 1 0 1 0 1 0 1 1 0 1 0 1 0 0 0 0 1\n" +
            " 1 0 1 1 1 0 1 0 0 1 1 0 1 1 1 1 0 1 0 1 0\n" +
            " 1 0 1 1 1 0 1 0 1 0 0 0 1 0 1 0 1 1 1 0 1\n" +
            " 1 0 0 0 0 0 1 0 0 1 1 0 1 1 0 1 0 0 0 1 1\n" +
            " 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 1 0 1 0 1\n" +
            ">>\n";
        assertEquals(expected, qrCode.toString());
    }

    @Test()
    encodeWithVersion() {
        const qrCode = Encoder.encode("ABCDEF", {
            errorCorrection: ErrorCorrectionLevel.H,
            qrVersion: 7
        });
        assertEquals(qrCode.version.versionNumber, 7);
    }

    @Test.fail()
    encodeWithVersionTooSmall() {
        // Should fail
        Encoder.encode("THISMESSAGEISTOOLONGFORAQRCODEVERSION3", {
            errorCorrection: ErrorCorrectionLevel.H,
            qrVersion: 3
        });
    }

    @Test()
    simpleUTF8ECI() {
        const qrCode = Encoder.encode("hello", {
            errorCorrection: ErrorCorrectionLevel.H,
            characterSet: Charsets.UTF_8
        });
        const expected: string = "<<\n" +
            " mode: BYTE\n" +
            " ecLevel: H\n" +
            " version: 1\n" +
            " maskPattern: 3\n" +
            " matrix:\n" +
            " 1 1 1 1 1 1 1 0 0 0 0 0 0 0 1 1 1 1 1 1 1\n" +
            " 1 0 0 0 0 0 1 0 0 0 1 0 1 0 1 0 0 0 0 0 1\n" +
            " 1 0 1 1 1 0 1 0 0 1 0 1 0 0 1 0 1 1 1 0 1\n" +
            " 1 0 1 1 1 0 1 0 0 1 1 0 1 0 1 0 1 1 1 0 1\n" +
            " 1 0 1 1 1 0 1 0 1 0 1 0 1 0 1 0 1 1 1 0 1\n" +
            " 1 0 0 0 0 0 1 0 0 0 0 0 1 0 1 0 0 0 0 0 1\n" +
            " 1 1 1 1 1 1 1 0 1 0 1 0 1 0 1 1 1 1 1 1 1\n" +
            " 0 0 0 0 0 0 0 0 1 1 1 0 0 0 0 0 0 0 0 0 0\n" +
            " 0 0 1 1 0 0 1 1 1 1 0 0 0 1 1 0 1 0 0 0 0\n" +
            " 0 0 1 1 1 0 0 0 0 0 1 1 0 0 0 1 0 1 1 1 0\n" +
            " 0 1 0 1 0 1 1 1 0 1 0 1 0 0 0 0 0 1 1 1 1\n" +
            " 1 1 0 0 1 0 0 1 1 0 0 1 1 1 1 0 1 0 1 1 0\n" +
            " 0 0 0 0 1 0 1 1 1 1 0 0 0 0 0 1 0 0 1 0 0\n" +
            " 0 0 0 0 0 0 0 0 1 1 1 1 0 0 1 1 1 0 0 0 1\n" +
            " 1 1 1 1 1 1 1 0 1 1 1 0 1 0 1 1 0 0 1 0 0\n" +
            " 1 0 0 0 0 0 1 0 0 0 1 0 0 1 1 1 1 1 1 0 1\n" +
            " 1 0 1 1 1 0 1 0 0 1 0 0 0 0 1 1 0 0 0 0 0\n" +
            " 1 0 1 1 1 0 1 0 1 1 1 0 1 0 0 0 1 1 0 0 0\n" +
            " 1 0 1 1 1 0 1 0 1 1 0 0 0 1 0 0 1 0 0 0 0\n" +
            " 1 0 0 0 0 0 1 0 0 0 0 1 1 0 1 0 1 0 1 1 0\n" +
            " 1 1 1 1 1 1 1 0 0 1 0 1 1 1 0 1 1 0 0 0 0\n" +
            ">>\n";
        assertEquals(expected, qrCode.toString());
    }

    @Test()
    encodeKanjiMode() {
        const qrCode = Encoder.encode("\u65e5\u672c", {
            errorCorrection: ErrorCorrectionLevel.M,
            characterSet: "SHIFT_JIS"
        });
        const expected: string = "<<\n" +
            " mode: KANJI\n" +
            " ecLevel: M\n" +
            " version: 1\n" +
            " maskPattern: 4\n" +
            " matrix:\n" +
            " 1 1 1 1 1 1 1 0 1 1 1 1 0 0 1 1 1 1 1 1 1\n" +
            " 1 0 0 0 0 0 1 0 0 0 0 1 1 0 1 0 0 0 0 0 1\n" +
            " 1 0 1 1 1 0 1 0 0 0 1 0 0 0 1 0 1 1 1 0 1\n" +
            " 1 0 1 1 1 0 1 0 1 0 1 0 1 0 1 0 1 1 1 0 1\n" +
            " 1 0 1 1 1 0 1 0 1 1 0 1 1 0 1 0 1 1 1 0 1\n" +
            " 1 0 0 0 0 0 1 0 1 0 1 0 1 0 1 0 0 0 0 0 1\n" +
            " 1 1 1 1 1 1 1 0 1 0 1 0 1 0 1 1 1 1 1 1 1\n" +
            " 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0\n" +
            " 1 0 0 0 1 0 1 1 1 0 0 0 1 1 1 1 1 1 0 0 1\n" +
            " 0 1 1 0 0 1 0 1 1 0 1 0 1 1 1 0 0 0 1 0 1\n" +
            " 1 1 1 1 0 1 1 1 0 0 1 0 1 1 0 0 0 0 1 1 1\n" +
            " 1 0 1 0 1 1 0 0 0 0 1 1 1 0 0 1 0 0 1 1 0\n" +
            " 0 0 1 0 1 1 1 1 1 1 1 1 0 0 1 1 1 1 0 1 1\n" +
            " 0 0 0 0 0 0 0 0 1 1 1 1 1 0 0 1 0 1 0 0 0\n" +
            " 1 1 1 1 1 1 1 0 1 1 0 1 0 0 1 1 1 1 1 1 0\n" +
            " 1 0 0 0 0 0 1 0 0 0 0 0 0 1 1 0 1 0 1 0 1\n" +
            " 1 0 1 1 1 0 1 0 1 0 1 0 1 1 1 0 0 0 1 1 1\n" +
            " 1 0 1 1 1 0 1 0 0 1 0 0 1 1 1 0 0 0 1 1 1\n" +
            " 1 0 1 1 1 0 1 0 0 1 1 0 1 1 0 0 0 1 0 0 0\n" +
            " 1 0 0 0 0 0 1 0 0 0 1 1 1 0 0 1 0 1 0 0 0\n" +
            " 1 1 1 1 1 1 1 0 1 1 1 1 0 0 1 1 1 0 1 1 0\n" +
            ">>\n";
        assertEquals(expected, qrCode.toString());
    }

    @Test()
    encodeShiftjisNumeric() {
        const qrCode: QRCode = Encoder.encode("0123", {
            errorCorrection: ErrorCorrectionLevel.M,
            characterSet: "SHIFT_JIS"
        });
        const expected: string = "<<\n" +
            " mode: NUMERIC\n" +
            " ecLevel: M\n" +
            " version: 1\n" +
            " maskPattern: 0\n" +
            " matrix:\n" +
            " 1 1 1 1 1 1 1 0 0 0 0 0 1 0 1 1 1 1 1 1 1\n" +
            " 1 0 0 0 0 0 1 0 1 1 0 1 0 0 1 0 0 0 0 0 1\n" +
            " 1 0 1 1 1 0 1 0 0 1 1 0 0 0 1 0 1 1 1 0 1\n" +
            " 1 0 1 1 1 0 1 0 0 0 1 0 0 0 1 0 1 1 1 0 1\n" +
            " 1 0 1 1 1 0 1 0 1 0 1 1 1 0 1 0 1 1 1 0 1\n" +
            " 1 0 0 0 0 0 1 0 0 1 0 1 0 0 1 0 0 0 0 0 1\n" +
            " 1 1 1 1 1 1 1 0 1 0 1 0 1 0 1 1 1 1 1 1 1\n" +
            " 0 0 0 0 0 0 0 0 0 1 1 0 0 0 0 0 0 0 0 0 0\n" +
            " 1 0 1 0 1 0 1 0 0 0 0 0 1 0 0 0 1 0 0 1 0\n" +
            " 0 0 0 0 0 0 0 1 1 0 1 1 0 1 0 1 0 1 0 1 0\n" +
            " 0 1 0 1 0 1 1 1 1 0 0 1 0 1 1 1 0 1 0 1 0\n" +
            " 0 1 1 1 0 0 0 0 0 0 1 1 1 1 0 1 1 1 0 1 0\n" +
            " 0 0 0 1 1 1 1 1 1 1 1 1 0 1 1 1 0 0 1 0 1\n" +
            " 0 0 0 0 0 0 0 0 1 1 0 0 0 0 1 0 0 0 1 1 0\n" +
            " 1 1 1 1 1 1 1 0 0 1 0 0 1 0 0 0 1 0 0 0 1\n" +
            " 1 0 0 0 0 0 1 0 0 1 0 0 0 0 1 0 0 0 1 0 0\n" +
            " 1 0 1 1 1 0 1 0 1 1 0 0 1 0 1 0 1 0 1 0 1\n" +
            " 1 0 1 1 1 0 1 0 0 1 1 1 0 1 0 1 0 1 0 1 0\n" +
            " 1 0 1 1 1 0 1 0 1 0 1 1 0 1 1 1 0 1 1 0 1\n" +
            " 1 0 0 0 0 0 1 0 0 0 1 1 1 1 0 1 1 1 0 0 0\n" +
            " 1 1 1 1 1 1 1 0 1 0 1 1 0 1 1 1 0 1 1 0 1\n" +
            ">>\n";
        assertEquals(expected, qrCode.toString());
    }

    @Test()
    appendModeInfo() {
        const bits = new BitArray();
        Encoder.appendModeInfo(Mode.NUMERIC, bits);
        assertEquals(" ...X", bits.toString());
    }

    @Test()
    appendLengthInfo() {
        let bits: BitArray = new BitArray();
        Encoder.appendLengthInfo(1,  // 1 letter (1/1)
            Version.getVersionForNumber(1),
            Mode.NUMERIC,
            bits);
        assertEquals(" ........ .X", bits.toString());  // 10 bits

        bits = new BitArray();
        Encoder.appendLengthInfo(2,  // 2 letters (2/1)
            Version.getVersionForNumber(10),
            Mode.ALPHANUMERIC,
            bits);
        assertEquals(" ........ .X.", bits.toString());  // 11 bits

        bits = new BitArray();
        Encoder.appendLengthInfo(255,  // 255 letter (255/1)
            Version.getVersionForNumber(27),
            Mode.BYTE,
            bits);
        assertEquals(" ........ XXXXXXXX", bits.toString());  // 16 bits

        bits = new BitArray();
        Encoder.appendLengthInfo(512,  // 512 letters (1024/2)
            Version.getVersionForNumber(40),
            Mode.KANJI,
            bits);
        assertEquals(" ..X..... ....", bits.toString());  // 12 bits
    }

    @Test()
    appendBytes() {
        let bits: BitArray = new BitArray();
        Encoder.appendBytes("1", Mode.NUMERIC, bits, Encoder.DEFAULT_BYTE_MODE_ENCODING);
        assertEquals(" ...X" , bits.toString());

        bits = new BitArray();
        Encoder.appendBytes("A", Mode.ALPHANUMERIC, bits, Encoder.DEFAULT_BYTE_MODE_ENCODING);
        assertEquals(" ..X.X." , bits.toString());

        expect(() => {
            Encoder.appendBytes("a", Mode.ALPHANUMERIC, bits, Encoder.DEFAULT_BYTE_MODE_ENCODING);
        }).toThrow();

        bits = new BitArray();
        Encoder.appendBytes("abc", Mode.BYTE, bits, Encoder.DEFAULT_BYTE_MODE_ENCODING);
        assertEquals(" .XX....X .XX...X. .XX...XX", bits.toString());

        Encoder.appendBytes("\0", Mode.BYTE, bits, Encoder.DEFAULT_BYTE_MODE_ENCODING);

        bits = new BitArray();
        Encoder.appendBytes(this.shiftJISString(this.bytes(0x93, 0x5f)), Mode.KANJI, bits,
            Encoder.DEFAULT_BYTE_MODE_ENCODING);
        assertEquals(" .XX.XX.. XXXXX", bits.toString());
    }

    @Test()
    terminateBits() {
        let v: BitArray = new BitArray();
        Encoder.terminateBits(0, v);
        assertEquals("", v.toString());
        v = new BitArray();
        Encoder.terminateBits(1, v);
        assertEquals(" ........", v.toString());
        v = new BitArray();
        v.appendBits(0, 3);  // Append 000
        Encoder.terminateBits(1, v);
        assertEquals(" ........", v.toString());
        v = new BitArray();
        v.appendBits(0, 5);  // Append 00000
        Encoder.terminateBits(1, v);
        assertEquals(" ........", v.toString());
        v = new BitArray();
        v.appendBits(0, 8);  // Append 00000000
        Encoder.terminateBits(1, v);
        assertEquals(" ........", v.toString());
        v = new BitArray();
        Encoder.terminateBits(2, v);
        assertEquals(" ........ XXX.XX..", v.toString());
        v = new BitArray();
        v.appendBits(0, 1);  // Append 0
        Encoder.terminateBits(3, v);
        assertEquals(" ........ XXX.XX.. ...X...X", v.toString());
    }

    @Test()
    getNumDataBytesAndNumECBytesForBlockID() {
        let numDataBytes: number;
        let numEcBytes: number;

        // Version 1-H
        [ numDataBytes, numEcBytes ] =
            Encoder.getNumDataBytesAndNumECBytesForBlockID(26, 9, 1, 0);
        assertEquals(9, numDataBytes);
        assertEquals(17, numEcBytes);

        // Version 3-H.  2 blocks.
        [ numDataBytes, numEcBytes ] =
            Encoder.getNumDataBytesAndNumECBytesForBlockID(70, 26, 2, 0);
        assertEquals(13, numDataBytes);
        assertEquals(22, numEcBytes);

        [ numDataBytes, numEcBytes ] =
            Encoder.getNumDataBytesAndNumECBytesForBlockID(70, 26, 2, 1);
        assertEquals(13, numDataBytes);
        assertEquals(22, numEcBytes);

        // Version 7-H. (4 + 1) blocks.
        [ numDataBytes, numEcBytes ] =
            Encoder.getNumDataBytesAndNumECBytesForBlockID(196, 66, 5, 0);
        assertEquals(13, numDataBytes);
        assertEquals(26, numEcBytes);

        [ numDataBytes, numEcBytes ] =
            Encoder.getNumDataBytesAndNumECBytesForBlockID(196, 66, 5, 4);
        assertEquals(14, numDataBytes);
        assertEquals(26, numEcBytes);

        // Version 40-H. (20 + 61) blocks.
        [ numDataBytes, numEcBytes ] =
            Encoder.getNumDataBytesAndNumECBytesForBlockID(3706, 1276, 81, 0);
        assertEquals(15, numDataBytes);
        assertEquals(30, numEcBytes);

        [ numDataBytes, numEcBytes ] =
            Encoder.getNumDataBytesAndNumECBytesForBlockID(3706, 1276, 81, 20);
        assertEquals(16, numDataBytes);
        assertEquals(30, numEcBytes);

        [ numDataBytes, numEcBytes ] =
            Encoder.getNumDataBytesAndNumECBytesForBlockID(3706, 1276, 81, 80);
        assertEquals(16, numDataBytes);
        assertEquals(30, numEcBytes);
    }

    @Test()
    interleaveWithECBytes() {
        const dataBytes = this.bytes(32, 65, 205, 69, 41, 220, 46, 128, 236);

        let bitsIn: BitArray = new BitArray();
        for (let i=0; i < dataBytes.length; i++) bitsIn.appendBits(dataBytes[i], 8);

        let bitsOut: BitArray = Encoder.interleaveWithECBytes(bitsIn, 26, 9, 1);

        const expected = this.bytes(
            // Data bytes.
            32, 65, 205, 69, 41, 220, 46, 128, 236,
            // Error correction bytes.
            42, 159, 74, 221, 244, 169, 239, 150, 138, 70,
            237, 85, 224, 96, 74, 219, 61
        );
        assertEquals(expected.length, bitsOut.byteCount);

        let outArray: Uint8Array = new Uint8Array(expected.length);
        bitsOut.toBytes(0, outArray, 0, expected.length);
        assertTrue(this.bytesEqual(expected, outArray));
    }

    @Test()
    appendNumericBytes() {
        // 1 = 01 = 0001 in 4 bits.
        let bits: BitArray = new BitArray();
        Encoder.appendNumericBytes("1", bits);
        assertEquals(" ...X" , bits.toString());
        // 12 = 0xc = 0001100 in 7 bits.
        bits = new BitArray();
        Encoder.appendNumericBytes("12", bits);
        assertEquals(" ...XX.." , bits.toString());
        // 123 = 0x7b = 0001111011 in 10 bits.
        bits = new BitArray();
        Encoder.appendNumericBytes("123", bits);
        assertEquals(" ...XXXX. XX" , bits.toString());
        // 1234 = "123" + "4" = 0001111011 + 0100
        bits = new BitArray();
        Encoder.appendNumericBytes("1234", bits);
        assertEquals(" ...XXXX. XX.X.." , bits.toString());
        // Empty.
        bits = new BitArray();
        Encoder.appendNumericBytes("", bits);
        assertEquals("" , bits.toString());
    }

    @Test()
    appendAlphanumericBytes() {
        // A = 10 = 0xa = 001010 in 6 bits
        let bits: BitArray = new BitArray();
        Encoder.appendAlphanumericBytes("A", bits);
        assertEquals(" ..X.X." , bits.toString());
        // AB = 10 * 45 + 11 = 461 = 0x1cd = 00111001101 in 11 bits
        bits = new BitArray();
        Encoder.appendAlphanumericBytes("AB", bits);
        assertEquals(" ..XXX..X X.X", bits.toString());
        // ABC = "AB" + "C" = 00111001101 + 001100
        bits = new BitArray();
        Encoder.appendAlphanumericBytes("ABC", bits);
        assertEquals(" ..XXX..X X.X..XX. ." , bits.toString());
        // Empty.
        bits = new BitArray();
        Encoder.appendAlphanumericBytes("", bits);
        assertEquals("" , bits.toString());
        // Invalid data.
        expect(() => {
            Encoder.appendAlphanumericBytes("abc", new BitArray());
        }).toThrow();
    }

    @Test()
    append8BitBytes() {
        // 0x61, 0x62, 0x63
        let bits: BitArray = new BitArray();
        Encoder.append8BitBytes("abc", bits, Encoder.DEFAULT_BYTE_MODE_ENCODING);
        assertEquals(" .XX....X .XX...X. .XX...XX", bits.toString());
        // Empty.
        bits = new BitArray();
        Encoder.append8BitBytes("", bits, Encoder.DEFAULT_BYTE_MODE_ENCODING);
        assertEquals("", bits.toString());
    }

    @Test()
    appendKanjiBytes() {
        let bits: BitArray = new BitArray();
        Encoder.appendKanjiBytes(this.shiftJISString(this.bytes(0x93, 0x5f)), bits);
        assertEquals(" .XX.XX.. XXXXX", bits.toString());
        Encoder.appendKanjiBytes(this.shiftJISString(this.bytes(0xe4, 0xaa)), bits);
        assertEquals(" .XX.XX.. XXXXXXX. X.X.X.X. X.", bits.toString());
    }

    @Test()
    generateECBytes() {
        let dataBytes: Uint8Array = this.bytes(32, 65, 205, 69, 41, 220, 46, 128, 236);
        let ecBytes: Uint8Array = Encoder.generateECBytes(dataBytes, 17);
        let expected: Uint8Array = this.bytes(
            42, 159, 74, 221, 244, 169, 239, 150, 138, 70, 237, 85, 224, 96, 74, 219, 61
        );
        assertTrue(this.bytesEqual(expected, ecBytes));

        dataBytes = this.bytes(67, 70, 22, 38, 54, 70, 86, 102, 118, 134, 150, 166,  182, 198, 214);
        ecBytes = Encoder.generateECBytes(dataBytes, 18);
        expected = this.bytes(
            175, 80, 155, 64, 178, 45, 214, 233, 65, 209, 12, 155, 117, 31, 140, 214, 27, 187
        );
        assertTrue(this.bytesEqual(expected, ecBytes));

        // High-order zero coefficient case.
        dataBytes = this.bytes(32, 49, 205, 69, 42, 20, 0, 236, 17);
        ecBytes = Encoder.generateECBytes(dataBytes, 17);
        expected = this.bytes(
            0, 3, 130, 179, 194, 0, 55, 211, 110, 79, 98, 72, 170, 96, 211, 137, 213
        );
        assertTrue(this.bytesEqual(expected, ecBytes));
    }

    @Test()
    testBugInBitVectorNumBytes() {
        // This exists for historical reasons, see reference
        const builder = new StringBuilder(3518);
        for (let x = 0; x < 3518; x++) {
            builder.appendDigit(0);
        }
        Encoder.encode(builder.toString(), {
            errorCorrection: ErrorCorrectionLevel.L
        });
    }

    //

    private bytesEqual(a: ArrayLike<number>, b: ArrayLike<number>): boolean {
        const l: number = a.length;
        if (l !== b.length) return false;
        if (l === 0) return false; // 0-length arrays are not considered equal
        let d: number = 0;
        for (let i=0; i < l; i++) d |= a[i] ^ b[i];
        return ((1 & ((d - 1) >>> 8)) - 1) === 0;
    }

    private bytes(...ints: number[]): Uint8Array {
        return new Uint8Array(ints);
    }

    private shiftJISString(bytes: Uint8Array): string {
        return Charsets.SHIFT_JIS.decode(bytes);
    }

}

runTests(EncoderTest);
