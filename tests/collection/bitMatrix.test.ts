import { Test, runTests, assertEquals } from "../junit";
import {BitMatrix} from "../../src/collection/bitMatrix";
import {BitArray} from "../../src/collection/bitArray";


class BitMatrixTest {

    @Test()
    getSet() {
        const matrix = new BitMatrix(33, 33);
        assertEquals(33, matrix.height);

        for (let y=0; y < 33; y++) {
            for (let x=0; x < 33; x++) {
                if ((y * x) % 3 === 0) matrix.set(x, y);
            }
        }
        for (let y=0; y < 33; y++) {
            for (let x = 0; x < 33; x++) {
                assertEquals((y * x) % 3 === 0, matrix.get(x, y));
            }
        }
    }

    @Test()
    getRow() {
        const matrix = new BitMatrix(102, 5);
        for (let x=0; x < 102; x++) {
            if ((x & 3) === 0) matrix.set(x, 2);
        }

        const array1 = matrix.getRow(2);
        assertEquals(102, array1.getSize());

        let array2: BitArray = new BitArray(60);
        array2 = matrix.getRow(2, array2);
        assertEquals(102, array2.getSize());

        let array3: BitArray = new BitArray(200);
        array3 = matrix.getRow(2, array3);
        assertEquals(200, array3.getSize());

        for (let x=0; x < 102; x++) {
            const on: boolean = (x & 3) === 0;
            assertEquals(on, array1.get(x));
            assertEquals(on, array2.get(x));
            assertEquals(on, array3.get(x));
        }
    }

}

runTests(BitMatrixTest);
