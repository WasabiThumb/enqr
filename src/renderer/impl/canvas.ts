import {QRRenderer, QRRenderOptions} from "../spec";
import {Canvas, createCanvas} from "canvas";
import {QRCode} from "../../qr/qrcode";
import {isBrowser} from "browser-or-node";


abstract class AbstractCanvasQRRenderer<T extends Canvas | HTMLCanvasElement | OffscreenCanvas> implements QRRenderer<T> {

    protected abstract makeCanvas(w: number, h: number): T;

    abstract toDataURL(canvas: T): string | Promise<string>;

    abstract toBlob(canvas: T): Promise<Blob>;

    render(qr: QRCode, options?: QRRenderOptions): T {
        const opts = QRRenderOptions.normalize(options);

        const { matrix } = qr;
        const [ width, xScale ] = QRRenderOptions.approachTargetSize(matrix.width, opts.targetSize);
        const [ height, yScale ] = QRRenderOptions.approachTargetSize(matrix.height, opts.targetSize);

        const quiet: number = QRRenderOptions.parseMetric(opts.quietZone, Math.max(width, height));
        const outerWidth: number = width + (quiet * 2);
        const outerHeight: number = height + (quiet * 2);

        const canvas: T = this.makeCanvas(outerWidth, outerHeight);
        const ctx = canvas.getContext("2d")! as unknown as CanvasRenderingContext2D;

        ctx.fillStyle = QRRenderOptions.parseColorAsCSS(opts.background);
        ctx.fillRect(0, 0, outerWidth, outerHeight);

        ctx.fillStyle = QRRenderOptions.parseColorAsCSS(opts.foreground);
        for (let y=0; y < matrix.height; y++) {
            for (let x=0; x < matrix.width; x++) {
                if (matrix.get(x, y) !== 1) continue;
                ctx.fillRect(
                    quiet + (x * xScale),
                    quiet + (y * yScale),
                    xScale, yScale
                );
            }
        }

        return canvas;
    }

}

class NodeCanvasQRRenderer extends AbstractCanvasQRRenderer<Canvas> {

    protected makeCanvas(w: number, h: number): Canvas {
        return createCanvas(w, h);
    }

    toDataURL(canvas: Canvas): string {
        return canvas.toDataURL();
    }

    async toBlob(canvas: Canvas): Promise<Blob> {
        const buf = canvas.toBuffer();
        let mime: string | undefined = undefined;
        switch (canvas.type) {
            case "svg":
                mime = "image/svg+xml";
                break;
            case "pdf":
                mime = "application/pdf";
                break;
            case "image":
                mime = "image/png";
                break;
        }
        return new Blob([ buf.buffer ], { type: mime });
    }

}

class NativeCanvasQRRenderer extends AbstractCanvasQRRenderer<HTMLCanvasElement> {

    protected makeCanvas(w: number, h: number): HTMLCanvasElement {
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        return canvas;
    }

    toDataURL(canvas: HTMLCanvasElement): string {
        return canvas.toDataURL();
    }

    toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
        return new Promise<Blob>((res, rej) => {
           canvas.toBlob((blob) => {
               if (!blob) rej();
               res(blob!);
           });
        });
    }

}

export class CanvasQRRenderer extends AbstractCanvasQRRenderer<Canvas | HTMLCanvasElement> {

    private readonly backend: NativeCanvasQRRenderer | NodeCanvasQRRenderer;

    constructor() {
        super();
        this.backend = isBrowser ? (new NativeCanvasQRRenderer()) : (new NodeCanvasQRRenderer());
    }

    protected makeCanvas(w: number, h: number): Canvas | HTMLCanvasElement {
        // @ts-ignore
        return this.backend.makeCanvas(w, h);
    }

    toBlob(canvas: Canvas | HTMLCanvasElement): Promise<Blob> {
        // @ts-ignore
        return this.backend.toBlob(canvas);
    }

    toDataURL(canvas: Canvas | HTMLCanvasElement): string {
        // @ts-ignore
        return this.backend.toDataURL(canvas);
    }

}

export class OffscreenCanvasQRRenderer extends AbstractCanvasQRRenderer<OffscreenCanvas> {

    protected makeCanvas(w: number, h: number): OffscreenCanvas {
        return new OffscreenCanvas(w, h);
    }

    toBlob(canvas: OffscreenCanvas): Promise<Blob> {
        return canvas.convertToBlob();
    }

    toDataURL(canvas: OffscreenCanvas): Promise<string> {
        return canvas.convertToBlob()
            .then<string>((blob) => {
                return new Promise<string>((res, rej) => {
                    const fr = new FileReader();
                    fr.onloadend = function () {
                        res(fr.result as string);
                    }
                    fr.onerror = rej;
                    fr.readAsDataURL(blob);
                });
            });
    }

}