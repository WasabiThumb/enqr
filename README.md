# EnQR
A lightweight QR encoder for the browser & node loosely based on [zxing](https://github.com/zxing/zxing).
This is strictly a QR encoder & renderer, future updates should consist mainly of bug fixes.

## Usage
```js
// ES6
import enqr from "enqr";
// CJS
const enqr = require("enqr");

/*
QR codes can store a lot of data types, see:
https://github.com/zxing/zxing/wiki/Barcode-Contents

These types are non-standard, but commonly agreed upon.
For URLs, you can just enter the URL:
*/
const qr = enqr("https://wasabithumb.github.io/", {
    errorCorrectionLevel: "L",
    characterSet: "UTF_8"
});

/*
The QR object returned by enqr is very similar to the
QRCode class in zxing, but with some extra methods for
rendering
*/

qr.renderToImage({
    image: document.querySelector("img#qr"),
    background: "white",
    foreground: [255, 255, 255],
    quietZone: "20%",
    trySVG: true
}).then((image) => {
    // Image has loaded
});

qr.renderToBlob({
    targetSize: 512,
    quietZone: 0,
    trySVG: false
}).then((blob) => {
    // Blob containing QR code as a PNG
});

qr.renderToURL().then((url) => {
    // Either a data: or blob: URL
});

const dataURL = qr.renderToDataURLSync();
const dataURLSVG = qr.renderToDataURLSync({ trySVG: true });
const svg = qr.renderToSVG();

// And a few more! ;)
```

## Encode Hints
Options for the main function.
Closely matches the implementation of hints in zxing.

| Name | Type | Description |
| --:  | :-: | :--         |
| errorCorrection | `"L"` \| `"M"` \| `"Q"` \| `"H"` | The level of error correction to use, default is `L`. Each level offers about 7%, 15%, 25% and 30% correction respectively. |
| characterSet | `"US_ASCII"` \| `"UTF_16"` \| `"UTF_16LE"` \| `"UTF_16BE"` \| `"UTF_8"` \| `"ISO_8859_1"` \| `"GB2312"` \| `"SHIFT_JIS"` \| `"EUC_JP"` | The character set to use when encoding. In general the default is `ISO_8859_1`, but there are some implementation details to explore if you're feeling brave. `"SHIFT_JIS"` should be explicitly set for Kanji. |
| qrVersion | ``number`` (1-40) | The [version](https://www.qrcode.com/en/about/version.html) number of the QR code, correlating to the amount of data that it can store. If unset, the smallest version that can store the specified data will be used.  |
| qrMaskPattern | ``number`` (0-7) | The mask pattern of the QR code. If unspecified, the encoder tries all patterns and selects the one that satisfies all 4 readability criteria maximally. |
| qrCompact | ``boolean`` | Not currently supported. |
| gs1Format | ``boolean`` | Enables GS1 format (adds a few bits to the header) |

## Render Options
All options are optional.
Some render options are specific to certain functions,
but all functions inherit [Basic](basic) options.

### Basic
| Name |  Type | Description |
| --:  | :-: | :--         |
| background | `string` \| `number[]` | The color of the background, default is white. |
| foreground | `string` \| `number[]` | The color of the foreground, default is white. |
| quietZone | `string${"px"\|"%"}` \| `number` | The size of the quiet zone (border). Either a number of pixels or percentage of the outer size. |
| targetSize | `number` | The outer size of the QR code will be multiplied by the correct factor to best approximate the specified size |
| floatPrecision | `number` | Reserved for future use |

### SVG
This covers all methods that may return SVG data under any circumstances (`renderToBlob`, `renderToURL`, etc.)
| Name | Type | Description |
| --: | :-: | :-- |
| trySVG | `boolean` | If true, and SVGs are supported in the current environment, the render operation may return SVG (otherwise PNG). |
| svgNoWhitespace | `boolean` | If true, no whitespace will be included between SVG tags. |

### HTML Image
This applies only to `renderToImage`
| Name | Type | Description |
| --: | :-: | :-- |
| image | `HTMLImageElement` | If set, this image will be updated in-place instead of a new image being created. |
| imageNoRevoke | `boolean` | If true, and an object URL was used as the source of the image, the object URL will **NOT** be revoked after the image loads. |

### Canvas
This applies only to `renderToCanvas`
| Name | Type | Description |
| --: | :-: | :-- |
| tryOffscreen | `boolean` | If true, on browser, and the feature is supported, the render operation may return `OffscreenCanvas`. If you want to always render offscreen, use `renderToOffscreenCanvas`. |

## License
This project is licensed under the ``Apache-2.0`` license, as [zxing](https://github.com/zxing/zxing/blob/master/LICENSE) is also licensed
under it. Despite not containing any zxing source code per se (and the spec for QR codes being
generally available), I still found it an appropriate choice.
