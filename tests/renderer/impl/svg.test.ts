import {Test, runTests, assertEquals} from "../../junit";
import {Encoder} from "../../../src/qr/encoder";
import {SVGQRRenderer} from "../../../src/renderer/impl/svg";
import {QRCode} from "../../../src/qr/qrcode";
import {Canvas, CanvasRenderingContext2D, loadImage} from "canvas";
import {Charsets} from "../../../src/util/string";

// noinspection JSMethodCanBeStatic
export class SVGQRRendererTest {

    @Test()
    async render() {
        const qr = Encoder.encode("Test QR Code");
        const canvas = qr.renderToCanvas() as Canvas;
        const ctx = canvas.getContext("2d");
        const reference = canvas.toBuffer("raw");

        for (let i=0; i < 4; i++) {
            await this.render0(qr, {
                svgCollation: i as 0 | 1 | 2 | 3
            }, canvas, ctx, reference);
        }
    }

    private async render0(qr: QRCode, opts: SVGQRRenderer.Options, canvas: Canvas, ctx: CanvasRenderingContext2D, reference: Buffer) {
        const dat = qr.render(new SVGQRRenderer(), opts);
        const uri = "data:image/svg+xml;charset=UTF-8;base64," +
            Buffer.from(Charsets.UTF_8.encode(dat).buffer).toString("base64");
        const img = await loadImage(uri);

        ctx.drawImage(img, 0, 0);

        const svg: Buffer = canvas.toBuffer("raw");
        assertEquals(reference.length, svg.length);

        for (let i=0; i < reference.length; i++) assertEquals(reference[i], svg[i]);
    }


}

runTests(SVGQRRendererTest);
