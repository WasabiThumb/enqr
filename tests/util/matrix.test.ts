import {assertEquals, runTests, Test} from "../junit";
import {TernaryMatrix} from "../../src/collection/ternaryMatrix";
import {MatrixUtil} from "../../src/util/matrix";
import {Version} from "../../src/qr/version";
import {ErrorCorrectionLevel} from "../../src/ec/level";
import {BitArray} from "../../src/collection/bitArray";


class MatrixUtilTest {

    @Test()
    toString(): string {
        const array = new TernaryMatrix(3, 3);
        array.set(0, 0, 0);
        array.set(1, 0, 1);
        array.set(2, 0, 0);
        array.set(0, 1, 1);
        array.set(1, 1, 0);
        array.set(2, 1, 1);
        array.set(0, 2, -1);
        array.set(1, 2, -1);
        array.set(2, 2, -1);
        const expected: string = " 0 1 0\n" + " 1 0 1\n" + "      \n";
        assertEquals(expected, array.toString());

        // JSPort: Call the supertype, just in case
        return Object.prototype.toString.apply<this, string>(this);
    }

    @Test()
    clearMatrix() {
        // JSPORT: Matrix now starts initialized to -1, we'll adapt the test to probe this behavior
        const matrix = new TernaryMatrix(2, 2);

        function checkClear() {
            for (let y=0; y < 2; y++) {
                for (let x=0; x < 2; x++) {
                    assertEquals(-1, matrix.get(x, y));
                }
            }
        }
        checkClear();

        matrix.set(1, 0, 1);
        matrix.set(0, 1, 0);
        matrix.clear(-1);
        checkClear();
    }

    @Test()
    embedBasicPatterns1() {
        const matrix = new TernaryMatrix(21, 21);
        MatrixUtil.embedBasicPatterns(Version.getVersionForNumber(1), matrix);
        const expected: string =
            " 1 1 1 1 1 1 1 0           0 1 1 1 1 1 1 1\n" +
            " 1 0 0 0 0 0 1 0           0 1 0 0 0 0 0 1\n" +
            " 1 0 1 1 1 0 1 0           0 1 0 1 1 1 0 1\n" +
            " 1 0 1 1 1 0 1 0           0 1 0 1 1 1 0 1\n" +
            " 1 0 1 1 1 0 1 0           0 1 0 1 1 1 0 1\n" +
            " 1 0 0 0 0 0 1 0           0 1 0 0 0 0 0 1\n" +
            " 1 1 1 1 1 1 1 0 1 0 1 0 1 0 1 1 1 1 1 1 1\n" +
            " 0 0 0 0 0 0 0 0           0 0 0 0 0 0 0 0\n" +
            "             1                            \n" +
            "             0                            \n" +
            "             1                            \n" +
            "             0                            \n" +
            "             1                            \n" +
            " 0 0 0 0 0 0 0 0 1                        \n" +
            " 1 1 1 1 1 1 1 0                          \n" +
            " 1 0 0 0 0 0 1 0                          \n" +
            " 1 0 1 1 1 0 1 0                          \n" +
            " 1 0 1 1 1 0 1 0                          \n" +
            " 1 0 1 1 1 0 1 0                          \n" +
            " 1 0 0 0 0 0 1 0                          \n" +
            " 1 1 1 1 1 1 1 0                          \n";
        assertEquals(expected, matrix.toString());
    }

    @Test()
    embedBasicPatterns2() {
        const matrix = new TernaryMatrix(25, 25);
        MatrixUtil.embedBasicPatterns(Version.getVersionForNumber(2), matrix);
        const expected: string =
            " 1 1 1 1 1 1 1 0                   0 1 1 1 1 1 1 1\n" +
            " 1 0 0 0 0 0 1 0                   0 1 0 0 0 0 0 1\n" +
            " 1 0 1 1 1 0 1 0                   0 1 0 1 1 1 0 1\n" +
            " 1 0 1 1 1 0 1 0                   0 1 0 1 1 1 0 1\n" +
            " 1 0 1 1 1 0 1 0                   0 1 0 1 1 1 0 1\n" +
            " 1 0 0 0 0 0 1 0                   0 1 0 0 0 0 0 1\n" +
            " 1 1 1 1 1 1 1 0 1 0 1 0 1 0 1 0 1 0 1 1 1 1 1 1 1\n" +
            " 0 0 0 0 0 0 0 0                   0 0 0 0 0 0 0 0\n" +
            "             1                                    \n" +
            "             0                                    \n" +
            "             1                                    \n" +
            "             0                                    \n" +
            "             1                                    \n" +
            "             0                                    \n" +
            "             1                                    \n" +
            "             0                                    \n" +
            "             1                   1 1 1 1 1        \n" +
            " 0 0 0 0 0 0 0 0 1               1 0 0 0 1        \n" +
            " 1 1 1 1 1 1 1 0                 1 0 1 0 1        \n" +
            " 1 0 0 0 0 0 1 0                 1 0 0 0 1        \n" +
            " 1 0 1 1 1 0 1 0                 1 1 1 1 1        \n" +
            " 1 0 1 1 1 0 1 0                                  \n" +
            " 1 0 1 1 1 0 1 0                                  \n" +
            " 1 0 0 0 0 0 1 0                                  \n" +
            " 1 1 1 1 1 1 1 0                                  \n";
        assertEquals(expected, matrix.toString());
    }

    @Test()
    embedTypeInfo() {
        const matrix = new TernaryMatrix(21, 21);
        MatrixUtil.embedTypeInfo(ErrorCorrectionLevel.M, 5, matrix);
        const expected: string =
            "                 0                        \n" +
            "                 1                        \n" +
            "                 1                        \n" +
            "                 1                        \n" +
            "                 0                        \n" +
            "                 0                        \n" +
            "                                          \n" +
            "                 1                        \n" +
            " 1 0 0 0 0 0   0 1         1 1 0 0 1 1 1 0\n" +
            "                                          \n" +
            "                                          \n" +
            "                                          \n" +
            "                                          \n" +
            "                                          \n" +
            "                 0                        \n" +
            "                 0                        \n" +
            "                 0                        \n" +
            "                 0                        \n" +
            "                 0                        \n" +
            "                 0                        \n" +
            "                 1                        \n";
        assertEquals(expected, matrix.toString());
    }

    @Test()
    embedVersionInfo() {
        const matrix = new TernaryMatrix(21, 21);
        MatrixUtil.maybeEmbedVersionInfo(Version.getVersionForNumber(7), matrix);
        const expected: string =
            "                     0 0 1                \n" +
            "                     0 1 0                \n" +
            "                     0 1 0                \n" +
            "                     0 1 1                \n" +
            "                     1 1 1                \n" +
            "                     0 0 0                \n" +
            "                                          \n" +
            "                                          \n" +
            "                                          \n" +
            "                                          \n" +
            " 0 0 0 0 1 0                              \n" +
            " 0 1 1 1 1 0                              \n" +
            " 1 0 0 1 1 0                              \n" +
            "                                          \n" +
            "                                          \n" +
            "                                          \n" +
            "                                          \n" +
            "                                          \n" +
            "                                          \n" +
            "                                          \n" +
            "                                          \n";
        assertEquals(expected, matrix.toString());
    }

    @Test()
    embedDataBits() {
        const matrix = new TernaryMatrix(21, 21);
        MatrixUtil.embedBasicPatterns(Version.getVersionForNumber(1), matrix);

        const bits = new BitArray();
        MatrixUtil.embedDataBits(bits, -1, matrix);

        const expected: string =
            " 1 1 1 1 1 1 1 0 0 0 0 0 0 0 1 1 1 1 1 1 1\n" +
            " 1 0 0 0 0 0 1 0 0 0 0 0 0 0 1 0 0 0 0 0 1\n" +
            " 1 0 1 1 1 0 1 0 0 0 0 0 0 0 1 0 1 1 1 0 1\n" +
            " 1 0 1 1 1 0 1 0 0 0 0 0 0 0 1 0 1 1 1 0 1\n" +
            " 1 0 1 1 1 0 1 0 0 0 0 0 0 0 1 0 1 1 1 0 1\n" +
            " 1 0 0 0 0 0 1 0 0 0 0 0 0 0 1 0 0 0 0 0 1\n" +
            " 1 1 1 1 1 1 1 0 1 0 1 0 1 0 1 1 1 1 1 1 1\n" +
            " 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n" +
            " 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n" +
            " 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n" +
            " 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n" +
            " 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n" +
            " 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n" +
            " 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0\n" +
            " 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n" +
            " 1 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n" +
            " 1 0 1 1 1 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n" +
            " 1 0 1 1 1 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n" +
            " 1 0 1 1 1 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n" +
            " 1 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n" +
            " 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n";

        assertEquals(expected, matrix.toString());
    }

    @Test()
    buildMatrix() {
        const bytes: number[] = [
            32, 65, 205, 69, 41, 220, 46, 128, 236,
            42, 159, 74, 221, 244, 169, 239, 150, 138,
            70, 237, 85, 224, 96, 74, 219, 61
        ];
        const bits = new BitArray();
        for (let byte of bytes) bits.appendBits(byte, 8);

        const matrix = new TernaryMatrix(21, 21);
        MatrixUtil.buildMatrix(
            bits,
            ErrorCorrectionLevel.H,
            Version.getVersionForNumber(1),
            3,
            matrix
        );
        const expected =
            " 1 1 1 1 1 1 1 0 0 1 1 0 0 0 1 1 1 1 1 1 1\n" +
            " 1 0 0 0 0 0 1 0 0 0 0 0 0 0 1 0 0 0 0 0 1\n" +
            " 1 0 1 1 1 0 1 0 0 0 0 1 0 0 1 0 1 1 1 0 1\n" +
            " 1 0 1 1 1 0 1 0 0 1 1 0 0 0 1 0 1 1 1 0 1\n" +
            " 1 0 1 1 1 0 1 0 1 1 0 0 1 0 1 0 1 1 1 0 1\n" +
            " 1 0 0 0 0 0 1 0 0 0 1 1 1 0 1 0 0 0 0 0 1\n" +
            " 1 1 1 1 1 1 1 0 1 0 1 0 1 0 1 1 1 1 1 1 1\n" +
            " 0 0 0 0 0 0 0 0 1 1 0 1 1 0 0 0 0 0 0 0 0\n" +
            " 0 0 1 1 0 0 1 1 1 0 0 1 1 1 1 0 1 0 0 0 0\n" +
            " 1 0 1 0 1 0 0 0 0 0 1 1 1 0 0 1 0 1 1 1 0\n" +
            " 1 1 1 1 0 1 1 0 1 0 1 1 1 0 0 1 1 1 0 1 0\n" +
            " 1 0 1 0 1 1 0 1 1 1 0 0 1 1 1 0 0 1 0 1 0\n" +
            " 0 0 1 0 0 1 1 1 0 0 0 0 0 0 1 0 1 1 1 1 1\n" +
            " 0 0 0 0 0 0 0 0 1 1 0 1 0 0 0 0 0 1 0 1 1\n" +
            " 1 1 1 1 1 1 1 0 1 1 1 1 0 0 0 0 1 0 1 1 0\n" +
            " 1 0 0 0 0 0 1 0 0 0 0 1 0 1 1 1 0 0 0 0 0\n" +
            " 1 0 1 1 1 0 1 0 0 1 0 0 1 1 0 0 1 0 0 1 1\n" +
            " 1 0 1 1 1 0 1 0 1 1 0 1 0 0 0 0 0 1 1 1 0\n" +
            " 1 0 1 1 1 0 1 0 1 1 1 1 0 0 0 0 1 1 1 0 0\n" +
            " 1 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 1 0 1 0 0\n" +
            " 1 1 1 1 1 1 1 0 0 0 1 1 1 1 1 0 1 0 0 1 0\n";
        assertEquals(expected, matrix.toString());
    }

    @Test()
    findMSBSet() {
        assertEquals(0, MatrixUtil.findMSBSet(0));
        assertEquals(1, MatrixUtil.findMSBSet(1));
        assertEquals(8, MatrixUtil.findMSBSet(0x80));
        assertEquals(32, MatrixUtil.findMSBSet(0x80000000));
    }

    @Test()
    calculateBCHCode() {
        assertEquals(0xdc, MatrixUtil.calculateBCHCode(5, 0x537));
        assertEquals(0x1c2, MatrixUtil.calculateBCHCode(0x13, 0x537));
        assertEquals(0x214, MatrixUtil.calculateBCHCode(0x1b, 0x537));

        assertEquals(0xc94, MatrixUtil.calculateBCHCode(7, 0x1f25));
        assertEquals(0x5bc, MatrixUtil.calculateBCHCode(8, 0x1f25));
        assertEquals(0xa99, MatrixUtil.calculateBCHCode(9, 0x1f25));
        assertEquals(0x4d3, MatrixUtil.calculateBCHCode(10, 0x1f25));
        assertEquals(0x9a6, MatrixUtil.calculateBCHCode(20, 0x1f25));
        assertEquals(0xd75, MatrixUtil.calculateBCHCode(30, 0x1f25));
        assertEquals(0xc69, MatrixUtil.calculateBCHCode(40, 0x1f25));
    }

    @Test()
    makeVersionInfoBits() {
        const bits = new BitArray();
        MatrixUtil.makeVersionInfoBits(Version.getVersionForNumber(7), bits);
        assertEquals(" ...XXXXX ..X..X.X ..", bits.toString());
    }

    @Test()
    makeTypeInfoBits() {
        const bits = new BitArray();
        MatrixUtil.makeTypeInfoBits(ErrorCorrectionLevel.M, 5, bits);
        assertEquals(" X......X X..XXX.", bits.toString());
    }

}

runTests(MatrixUtilTest);
