import {assertEquals, runTests, Test} from "../junit";
import {GenericGF} from "../../src/ec/gf";
import {ReedSolomonEncoder} from "../../src/ec/encoder";

// noinspection JSMethodCanBeStatic
class ECTest {

    @Test("encode")
    testQRCode() {
        this.testEncoder(
            GenericGF.QR_CODE_FIELD_256,
            [
                0x10, 0x20, 0x0C, 0x56, 0x61, 0x80, 0xEC, 0x11,
                0xEC, 0x11, 0xEC, 0x11, 0xEC, 0x11, 0xEC, 0x11
            ], [
                0xA5, 0x24, 0xD4, 0xC1, 0xED, 0x36, 0xC7, 0x87,
                0x2C, 0x55
            ]
        );
        this.testEncoder(
            GenericGF.QR_CODE_FIELD_256,
            [
                0x72, 0x67, 0x2F, 0x77, 0x69, 0x6B, 0x69, 0x2F,
                0x4D, 0x61, 0x69, 0x6E, 0x5F, 0x50, 0x61, 0x67,
                0x65, 0x3B, 0x3B, 0x00, 0xEC, 0x11, 0xEC, 0x11,
                0xEC, 0x11, 0xEC, 0x11, 0xEC, 0x11, 0xEC, 0x11
            ], [
                0xD8, 0xB8, 0xEF, 0x14, 0xEC, 0xD0, 0xCC, 0x85,
                0x73, 0x40, 0x0B, 0xB5, 0x5A, 0xB8, 0x8B, 0x2E,
                0x08, 0x62
            ]
        );
    }

    //

    private testEncoder(field: GenericGF, dataWords: number[], ecWords: number[]) {
        const encoder = new ReedSolomonEncoder(field);

        const messageExpected = new Int32Array(dataWords.length + ecWords.length);
        const message = new Int32Array(dataWords.length + ecWords.length);
        messageExpected.set(dataWords, 0);
        messageExpected.set(ecWords, dataWords.length);
        message.set(dataWords, 0);

        encoder.encode(message, ecWords.length);
        this.assertDataEquals(messageExpected, message);
    }

    private assertDataEquals(a: Int32Array, b: Int32Array) {
        assertEquals(a.length, b.length);
        for (let i=0; i < a.length; i++) assertEquals(a[i], b[i]);
    }

}

runTests(ECTest);
