import {assertEquals, assertTrue, runTests, Test} from "../junit";
import {MaskUtil} from "../../src/util/mask";
import {TernaryMatrix} from "../../src/collection/ternaryMatrix";

// noinspection JSMethodCanBeStatic,DuplicatedCode
class MaskUtilTest {

    @Test()
    applyMaskPenaltyRule1() {
        let matrix = new TernaryMatrix(4, 1);
        matrix.set(0, 0, 0);
        matrix.set(1, 0, 0);
        matrix.set(2, 0, 0);
        matrix.set(3, 0, 0);
        assertEquals(0, this.applyRule(1, matrix));
        // Horizontal.
        matrix = new TernaryMatrix(6, 1);
        matrix.set(0, 0, 0);
        matrix.set(1, 0, 0);
        matrix.set(2, 0, 0);
        matrix.set(3, 0, 0);
        matrix.set(4, 0, 0);
        matrix.set(5, 0, 1);
        assertEquals(3, this.applyRule(1, matrix));
        matrix.set(5, 0, 0);
        assertEquals(4, this.applyRule(1, matrix));
        // Vertical.
        matrix = new TernaryMatrix(1, 6);
        matrix.set(0, 0, 0);
        matrix.set(0, 1, 0);
        matrix.set(0, 2, 0);
        matrix.set(0, 3, 0);
        matrix.set(0, 4, 0);
        matrix.set(0, 5, 1);
        assertEquals(3, this.applyRule(1, matrix));
        matrix.set(0, 5, 0);
        assertEquals(4, this.applyRule(1, matrix));
    }

    @Test()
    applyMaskPenaltyRule2() {
        let matrix: TernaryMatrix = new TernaryMatrix(1, 1);
        matrix.set(0, 0, 0);
        assertEquals(0, this.applyRule(2, matrix));
        matrix = new TernaryMatrix(2, 2);
        matrix.set(0, 0, 0);
        matrix.set(1, 0, 0);
        matrix.set(0, 1, 0);
        matrix.set(1, 1, 1);
        assertEquals(0, this.applyRule(2, matrix));
        matrix = new TernaryMatrix(2, 2);
        matrix.set(0, 0, 0);
        matrix.set(1, 0, 0);
        matrix.set(0, 1, 0);
        matrix.set(1, 1, 0);
        assertEquals(3, this.applyRule(2, matrix));
        matrix = new TernaryMatrix(3, 3);
        matrix.set(0, 0, 0);
        matrix.set(1, 0, 0);
        matrix.set(2, 0, 0);
        matrix.set(0, 1, 0);
        matrix.set(1, 1, 0);
        matrix.set(2, 1, 0);
        matrix.set(0, 2, 0);
        matrix.set(1, 2, 0);
        matrix.set(2, 2, 0);
        assertEquals(3 * 4, this.applyRule(2, matrix));
    }

    @Test()
    applyMaskPenaltyRule3() {
        // Horizontal 00001011101
        let matrix: TernaryMatrix = new TernaryMatrix(11, 1);
        matrix.set(0, 0, 0);
        matrix.set(1, 0, 0);
        matrix.set(2, 0, 0);
        matrix.set(3, 0, 0);
        matrix.set(4, 0, 1);
        matrix.set(5, 0, 0);
        matrix.set(6, 0, 1);
        matrix.set(7, 0, 1);
        matrix.set(8, 0, 1);
        matrix.set(9, 0, 0);
        matrix.set(10, 0, 1);
        assertEquals(40, this.applyRule(3, matrix));
        // Horizontal 10111010000
        matrix = new TernaryMatrix(11, 1);
        matrix.set(0, 0, 1);
        matrix.set(1, 0, 0);
        matrix.set(2, 0, 1);
        matrix.set(3, 0, 1);
        matrix.set(4, 0, 1);
        matrix.set(5, 0, 0);
        matrix.set(6, 0, 1);
        matrix.set(7, 0, 0);
        matrix.set(8, 0, 0);
        matrix.set(9, 0, 0);
        matrix.set(10, 0, 0);
        assertEquals(40, this.applyRule(3, matrix));
        // Horizontal 1011101.
        matrix = new TernaryMatrix(7, 1);
        matrix.set(0, 0, 1);
        matrix.set(1, 0, 0);
        matrix.set(2, 0, 1);
        matrix.set(3, 0, 1);
        matrix.set(4, 0, 1);
        matrix.set(5, 0, 0);
        matrix.set(6, 0, 1);
        assertEquals(0, this.applyRule(3, matrix));
        // Vertical 00001011101.
        matrix = new TernaryMatrix(1, 11);
        matrix.set(0, 0, 0);
        matrix.set(0, 1, 0);
        matrix.set(0, 2, 0);
        matrix.set(0, 3, 0);
        matrix.set(0, 4, 1);
        matrix.set(0, 5, 0);
        matrix.set(0, 6, 1);
        matrix.set(0, 7, 1);
        matrix.set(0, 8, 1);
        matrix.set(0, 9, 0);
        matrix.set(0, 10, 1);
        assertEquals(40, this.applyRule(3, matrix));
        // Vertical 1011101.
        matrix = new TernaryMatrix(1, 7);
        matrix.set(0, 0, 1);
        matrix.set(0, 1, 0);
        matrix.set(0, 2, 1);
        matrix.set(0, 3, 1);
        matrix.set(0, 4, 1);
        matrix.set(0, 5, 0);
        matrix.set(0, 6, 1);
        assertEquals(0, this.applyRule(3, matrix));
    }

    @Test()
    applyMaskPenaltyRule4() {
        // Dark cell ratio = 0%
        let matrix: TernaryMatrix = new TernaryMatrix(1, 1);
        matrix.set(0, 0, 0);
        assertEquals(100, this.applyRule(4, matrix));

        // Dark cell ratio = 5%
        matrix = new TernaryMatrix(2, 1);
        matrix.set(0, 0, 0);
        matrix.set(0, 0, 1);
        assertEquals(0, this.applyRule(4, matrix));

        // Dark cell ratio = 66.67%
        matrix = new TernaryMatrix(6, 1);
        matrix.set(0, 0, 0);
        matrix.set(1, 0, 1);
        matrix.set(2, 0, 1);
        matrix.set(3, 0, 1);
        matrix.set(4, 0, 1);
        matrix.set(5, 0, 0);
        assertEquals(30, this.applyRule(4, matrix));
    }

    @Test()
    getDataMaskBit() {
        let mask: number[][];
        
        mask = [
            [1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1],
        ];
        assertTrue(this.getDataMaskBit0(0, mask));
        
        mask = [
            [1, 1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0, 0],
        ];
        assertTrue(this.getDataMaskBit0(1, mask));

        mask = [
            [1, 0, 0, 1, 0, 0],
            [1, 0, 0, 1, 0, 0],
            [1, 0, 0, 1, 0, 0],
            [1, 0, 0, 1, 0, 0],
            [1, 0, 0, 1, 0, 0],
            [1, 0, 0, 1, 0, 0],  
        ];
        assertTrue(this.getDataMaskBit0(2, mask));

        mask = [
            [1, 0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0, 1],
            [0, 1, 0, 0, 1, 0],
            [1, 0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0, 1],
            [0, 1, 0, 0, 1, 0],
        ];
        assertTrue(this.getDataMaskBit0(3, mask));

        mask = [
            [1, 1, 1, 0, 0, 0],
            [1, 1, 1, 0, 0, 0],
            [0, 0, 0, 1, 1, 1],
            [0, 0, 0, 1, 1, 1],
            [1, 1, 1, 0, 0, 0],
            [1, 1, 1, 0, 0, 0],
        ];
        assertTrue(this.getDataMaskBit0(4, mask));

        mask = [
            [1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0],
            [1, 0, 0, 1, 0, 0],
            [1, 0, 1, 0, 1, 0],
            [1, 0, 0, 1, 0, 0],
            [1, 0, 0, 0, 0, 0],
        ];
        assertTrue(this.getDataMaskBit0(5, mask));

        mask = [
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 0, 0, 0],
            [1, 1, 0, 1, 1, 0],
            [1, 0, 1, 0, 1, 0],
            [1, 0, 1, 1, 0, 1],
            [1, 0, 0, 0, 1, 1],
        ];
        assertTrue(this.getDataMaskBit0(6, mask));

        mask = [
            [1, 0, 1, 0, 1, 0],
            [0, 0, 0, 1, 1, 1],
            [1, 0, 0, 0, 1, 1],
            [0, 1, 0, 1, 0, 1],
            [1, 1, 1, 0, 0, 0],
            [0, 1, 1, 1, 0, 0],
        ];
        assertTrue(this.getDataMaskBit0(7, mask));
    }

    //

    private applyRule(rule: 1 | 2 | 3 | 4, matrix: TernaryMatrix): number {
        let fn = MaskUtil[`applyMaskPenaltyRule${rule}` as `applyMaskPenaltyRule${"1" | "2" | "3" | "4"}`];
        return fn(matrix.getArray(), matrix.width, matrix.height);
    }

    private getDataMaskBit0(maskPattern: number, expected: number[][]): boolean {
        for (let x = 0; x < 6; x++) {
            for (let y = 0; y < 6; y++) {
                if ((expected[y][x] === 1) !== MaskUtil.getDataMaskBit(maskPattern, x, y)) return false;
            }
        }
        return true;
    }

}

runTests(MaskUtilTest);
