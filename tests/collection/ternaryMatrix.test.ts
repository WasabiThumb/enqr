import { Test, runTests, assertEquals } from "../junit";
import {TernaryMatrix, TernaryValue} from "../../src/collection/ternaryMatrix";


// noinspection JSMethodCanBeStatic
class TernaryMatrixTest {

    @Test()
    getSet() {
        let matrix: TernaryMatrix = this.createTestMatrix();
        this.checkTestMatrix(matrix);
        matrix = matrix.clone();
        this.checkTestMatrix(matrix);
    }

    @Test()
    toBitMatrix() {
        const matrix: TernaryMatrix = this.createTestMatrix();
        this.toBitMatrix0(matrix, -1);
        this.toBitMatrix0(matrix, 0);
        this.toBitMatrix0(matrix, 1);
    }

    private toBitMatrix0(matrix: TernaryMatrix, truthyValue: TernaryValue) {
        const bitMatrix = matrix.toBitMatrix(truthyValue);
        assertEquals(bitMatrix.width, matrix.width);
        assertEquals(bitMatrix.height, matrix.height);

        for (let y=0; y < matrix.height; y++) {
            for (let x=0; x < matrix.width; x++) {
                assertEquals(matrix.get(x, y) === truthyValue, bitMatrix.get(x, y));
            }
        }
    }

    private createTestMatrix(): TernaryMatrix {
        const matrix: TernaryMatrix = new TernaryMatrix(9, 9);
        for (let y=0; y < 9; y++) {
            for (let x=0; x < 9; x++) {
                switch (((y * 9) + x) & 3) {
                    case 1:
                        matrix.set(x, y, 0);
                        break;
                    case 3:
                        matrix.set(x, y, 1);
                        break;
                }
            }
        }
        return matrix;
    }

    private checkTestMatrix(matrix: TernaryMatrix): void {
        let v: TernaryValue;
        for (let y=0; y < 9; y++) {
            for (let x=0; x < 9; x++) {
                v = matrix.get(x, y);
                switch (((y * 9) + x) & 3) {
                    case 0:
                        assertEquals(-1, v);
                        break;
                    case 1:
                        assertEquals(0, v);
                        break;
                    case 2:
                        assertEquals(-1, v);
                        break;
                    case 3:
                        assertEquals(1, v);
                        break;
                }
            }
        }
    }

}

runTests(TernaryMatrixTest);