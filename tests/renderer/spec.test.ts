import {Test, runTests, assertEquals, assertSame} from "../junit";
import {QRRenderOptions, QRRenderDefaultOptions} from "../../src/renderer";

class QRRenderOptionsTest {

    @Test()
    normalize() {
        assertEquals(
            QRRenderDefaultOptions,
            QRRenderOptions.normalize()
        );
        assertEquals(
            QRRenderDefaultOptions,
            QRRenderOptions.normalize({ })
        );
    }

    @Test()
    parseColorAsCSS() {
        let col: string | number[];

        col = "red";
        assertSame(col, QRRenderOptions.parseColorAsCSS(col));

        col = [ 255, 0, 0 ];
        assertEquals("#F00", QRRenderOptions.parseColorAsCSS(col));

        col = [ 0xAA, 0xBB, 0xCC, 0xDD ];
        assertEquals("#ABCD", QRRenderOptions.parseColorAsCSS(col));

        col = [ 0x23 ];
        assertEquals("#232323", QRRenderOptions.parseColorAsCSS(col));

        col = [ 0x1B, 0x2A, 0x34, 0x42 ];
        assertEquals("#1B2A3442", QRRenderOptions.parseColorAsCSS(col));
    }

    @Test()
    parseMetric() {
        const dimension = 200;
        let term: number | string;

        term = 42;
        assertSame(term, QRRenderOptions.parseMetric(term, dimension));

        term = "42px";
        assertEquals(42, QRRenderOptions.parseMetric(term, dimension));

        term = "50%";
        assertEquals(100, QRRenderOptions.parseMetric(term, dimension));
    }

    @Test()
    approachTargetSize() {
        const size: number = 200;
        let final: number, scale: number;

        [ final, scale ] = QRRenderOptions.approachTargetSize(size, 1);
        assertEquals(200, final);
        assertEquals(1, scale);

        [ final, scale ] = QRRenderOptions.approachTargetSize(size, 200);
        assertEquals(200, final);
        assertEquals(1, scale);

        [ final, scale ] = QRRenderOptions.approachTargetSize(size, 400);
        assertEquals(400, final);
        assertEquals(2, scale);

        [ final, scale ] = QRRenderOptions.approachTargetSize(size, 650);
        assertEquals(600, final);
        assertEquals(3, scale);

        [ final, scale ] = QRRenderOptions.approachTargetSize(size, 750);
        assertEquals(800, final);
        assertEquals(4, scale);
    }

}

runTests(QRRenderOptionsTest);
