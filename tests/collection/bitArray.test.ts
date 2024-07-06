import { Test, runTests, assertEquals, assertTrue, assertFalse } from "../junit";
import {BitArray} from "../../src/collection/bitArray";


class BitArrayTest {

    @Test()
    patterns1() {
        const array = new BitArray();
        for (let i=0; i < 34; i++) {
            array.appendBit((i & 3) === 3 || (i % 8) === 1);
        }
        assertEquals(34, array.getSize());
        assertEquals(false, array.get(0));
        assertEquals(true, array.get(1));
        assertEquals(false, array.get(2));
        assertEquals(true, array.get(3));
        assertEquals(false, array.get(4));
        assertEquals(false, array.get(5));
        assertEquals(false, array.get(6));
        assertEquals(true, array.get(7));
        assertEquals(true, array.get(31));
        assertEquals(false, array.get(32));
        assertEquals(true, array.get(33));

        const bytes = new Uint8Array(4);
        array.toBytes(0, bytes, 0, 4);
        for (let i=0; i < 4; i++) {
            assertEquals(0b01010001, bytes[i]);
        }
    }

    @Test()
    setBulk() {
        const array = new BitArray(64);
        array.setBulk(32, 0xFFFF0000);
        for (let i = 0; i < 48; i++) {
            assertFalse(array.get(i));
        }
        for (let i = 48; i < 64; i++) {
            assertTrue(array.get(i));
        }
    }

    @Test()
    setRange() {
        const array = new BitArray(64);
        array.setRange(28, 36);
        assertFalse(array.get(27));
        for (let i=28; i < 36; i++) assertTrue(array.get(i));
        assertFalse(array.get(36));
    }

    @Test()
    clear() {
        const array = new BitArray(32);
        for (let i=0; i < 32; i++) array.set(i);
        array.clear();
        for (let i=0; i < 32; i++) assertFalse(array.get(i));
    }

    @Test()
    flip() {
        const array = new BitArray(32);
        assertFalse(array.get(5));
        array.flip(5);
        assertTrue(array.get(5));
        array.flip(5);
        assertFalse(array.get(5));
    }

}

runTests(BitArrayTest);
