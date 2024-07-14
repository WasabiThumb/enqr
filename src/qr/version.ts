
/*
 * Reference: https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/qrcode/decoder/Version.java
 */

import {ErrorCorrectionLevel} from "../ec/level";
import {TypedArrayUtil} from "../util/typedArray";

export interface ECB {
    readonly count: number,
    readonly dataCodewords: number
}
export function ECB(count: number, dataCodewords: number): ECB {
    return { count, dataCodewords };
}

export class ECBlocks {
    readonly ecCodewordsPerBlock: number;
    readonly ecBlocks: ECB[];

    constructor(ecCodewordsPerBlock: number, ...ecBlocks: ECB[]) {
        this.ecCodewordsPerBlock = ecCodewordsPerBlock;
        this.ecBlocks = ecBlocks;
    }

    get numBlocks(): number {
        let total: number = 0;
        for (let ecb of this.ecBlocks) {
            total += ecb.count;
        }
        return total;
    }

    get totalECCodewords(): number {
        return this.ecCodewordsPerBlock * this.numBlocks;
    }
}

export class Version {

    readonly versionNumber: number;
    readonly alignmentPatternCenters: number[];
    readonly ecBlocks: ECBlocks[];
    readonly totalCodewords: number;
    constructor(versionNumber: number, alignmentPatternCenters: number[], ...ecBlocks: ECBlocks[]) {
        this.versionNumber = versionNumber;
        this.alignmentPatternCenters = alignmentPatternCenters;
        this.ecBlocks = ecBlocks;

        let total: number = 0;
        let ecCodewords: number = ecBlocks[0].ecCodewordsPerBlock;
        const ecbArray: ECB[] = ecBlocks[0].ecBlocks;
        for (let ecBlock of ecbArray) {
            total += ecBlock.count * (ecBlock.dataCodewords + ecCodewords);
        }
        this.totalCodewords = total;
    }

    get dimensionForVersion(): number {
        return 17 + 4 * this.versionNumber;
    }

    getECBlocksForLevel(ecLevel: ErrorCorrectionLevel) {
        return this.ecBlocks[ErrorCorrectionLevel.getOrdinal(ecLevel)];
    }

    /*
    buildFunctionPattern(): BitMatrix {
        const dimension: number = this.dimensionForVersion;
        const bitMatrix = new BitMatrix(dimension, dimension);

        // Top left finder pattern + separator + format
        bitMatrix.setRegion(0, 0, 9, 9);
        // Top right finder pattern + separator + format
        bitMatrix.setRegion(dimension - 8, 0, 8, 9);
        // Bottom left finder pattern + separator + format
        bitMatrix.setRegion(0, dimension - 8, 9, 8);

        // Alignment patterns
        const max: number = this.alignmentPatternCenters.length;
        let i: number;
        for (let x=0; x < max; x++) {
            i = this.alignmentPatternCenters[x] - 2;
            for (let y=0; y < max; y++) {
                if ((x !== 0 || (y !== 0 && y !== max - 1)) && (x !== max - 1 || y !== 0)) {
                    bitMatrix.setRegion(this.alignmentPatternCenters[y] - 2, i, 5, 5);
                }
            }
        }

        // Vertical timing pattern
        bitMatrix.setRegion(6, 9, 1, dimension - 17);
        // Horizontal timing pattern
        bitMatrix.setRegion(9, 6, dimension - 17, 1);

        if (this.versionNumber > 6) {
            // Version info, top right
            bitMatrix.setRegion(dimension - 11, 0, 3, 6);
            // Version info, bottom left
            bitMatrix.setRegion(0, dimension - 11, 6, 3);
        }

        return bitMatrix;
    }
     */

}

export namespace Version {

    /*
    const VERSION_DECODE_INFO: Int32Array = new Int32Array([
        0x07C94, 0x085BC, 0x09A99, 0x0A4D3, 0x0BBF6,
        0x0C762, 0x0D847, 0x0E60D, 0x0F928, 0x10B78,
        0x1145D, 0x12A17, 0x13532, 0x149A6, 0x15683,
        0x168C9, 0x177EC, 0x18EC4, 0x191E1, 0x1AFAB,
        0x1B08E, 0x1CC1A, 0x1D33F, 0x1ED75, 0x1F250,
        0x209D5, 0x216F0, 0x228BA, 0x2379F, 0x24B0B,
        0x2542E, 0x26A64, 0x27541, 0x28C69
    ]);
     */

    // see buildVersions
    let VERSIONS: Version[] = [];

    export function getVersionForNumber(versionNumber: number): Version {
        if (versionNumber < 1 || versionNumber > 40) throw new Error(`Invalid version number ${versionNumber}`);
        return VERSIONS[versionNumber - 1];
    }

    /*
    export function getProvisionalVersionForDimension(dimension: number): Version {
        if (dimension % 4 !== 1) {
            throw new Error("Dimension is not 1 mod 4");
        }
        return getVersionForNumber((dimension - 17) >>> 2);
    }

    function decodeVersionInformation(versionBits: number): Version | null {
        let bestDifference: number = 0x7FFFFFFF;
        let bestVersion: number = 0;
        for (let i=0; i < VERSION_DECODE_INFO.length; i++) {
            const targetVersion: number = VERSION_DECODE_INFO[i];

            if (targetVersion === versionBits) return getVersionForNumber(i + 7);

            // https://stackoverflow.com/questions/43122082/efficiently-count-the-number-of-bits-in-an-integer-in-javascript
            let n: number = versionBits ^ targetVersion;
            n = n - ((n >> 1) & 0x55555555)
            n = (n & 0x33333333) + ((n >> 2) & 0x33333333)
            n = ((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;

            if (n < bestDifference) {
                bestVersion = i + 7;
                bestDifference = n;
            }
        }
        if (bestDifference <= 3) return getVersionForNumber(bestVersion);
        return null;
    }
    */

    //

    function buildVersions(): Version[] {
        const CWPB_MAP: number[] = [7,10,13,15,16,17,18,20,22,24,26,28,30];
        const dat = `AAElARMBEAENAQkCBhSLASIBHAEWARACCDpoATcBLAIRAg0CCnakAVACIAIYBAliDKloAWwCKwIPAhACCwIMAg5kmwJEBBsE` +
            `EwQPYwgQdmoCTgQfAg4EDwQNAQ5zCRKYigJhAiYCJwQSAhMEDgIPcwoUyHkCdAMkAiUEEAQRBAwEDXsLFmqbAkQCRQQrASwGEwIUBg8C` +
            `EHMMGHy5BFEBMgQzBBYEFwMMCA17DRqYqwJcAl0GJAIlBBQGFQcOBA9zDhyomARrCCUBJggUBBUMCwQMfAoUHsl5A3MBdAQoBSkLEAUR` +
            `CwwFDXwKFSCJyQVXAVgFKQUqBRgHGQsMBw18ChYim5wFYgFjBy0DLg8TAhQDDw0QfAwYJLu7AWsFbAouAS8BFg8XAg4RD3wMGSbKuwV4` +
            `AXkJKwQsERYBFwIOEw98DBoouqoDcQRyAywLLREVBBYJDRAOfA4cKrrLA2sFbAMpDSoPGAUZDw8KEG0LFiEsurwEdAR1ESoRFgYXExAG` +
            `ES0KFiIuu8kCbwdwES4HGBAZIg19DBgkMMvMBHkFegQvDjALGA4ZEA8OEH0LGCUyy8wGdQR2Bi0OLgsYEBkeEAIRfQ0aJzSrzAhqBGsI` +
            `Lw0wBxgWGRYPDRB9DBooNru8CnICcxMuBC8cFgYXIRAEEX0OHCo4y8wIegR7Fi0DLggXGhgMDxwQfgoWIi46y8wDdQp2Ay0XLgQYHxkL` +
            `Dx8QfgwYJDA8y8wHdAd1FS0HLgEXJRgTDxoQfgoXJDE+y8wFcwp0Ey8KMA8YGRkXDxkQfgwZJjNAy8wNcwN0Ai4dLyoYARkXDxwQdg4b` +
            `KDVCy8wRcwouFy8KGCMZEw8jEH4MGig2RMvMEXMBdA4uFS8dGBMZCw8uEH4OHCo4RsvMDXMGdA4uFy8sGAcZOxABEX8MGCQwPEjLzAx5` +
            `B3oMLxowJxgOGRYPKRB/CRYjMD1Ky8wGeQ56Bi8iMC4YChkCD0AQfwsYJTI/TMvMEXoEex0uDi8xGAoZGA8uEH8NGic0QU7LzAR6EnsN` +
            `LiAvMBgOGSoPIBB/ChgmNEJQy8wUdQR2KC8HMCsYFhkKD0MQfwwaKDZEUsvME3YGdxIvHzAiGCIZFA89EA==`;
        const bin: Uint8Array = TypedArrayUtil.fromBase64(dat);

        let i = 0;
        let version: number = 0;
        const versions: Version[] = new Array(40);

        while (i < bin.length && (version++) < 40) {
            let flag: number = bin[i++];
            const alignmentPatternCentersLength: number = flag & 7;
            flag >>= 3;

            const alignmentPatternCenters: number[] = new Array(alignmentPatternCentersLength);
            if (alignmentPatternCentersLength !== 0) alignmentPatternCenters[0] = 6;
            for (let z=1; z < alignmentPatternCentersLength; z++)
                alignmentPatternCenters[z] = (bin[i++] << 1) + 6;

            const codewordsPerBlockHi = bin[i++];
            const codewordsPerBlockLo = bin[i++];

            const ecBlocks: ECBlocks[] = new Array(4);
            for (let q=0; q < 4; q++) {
                const count: number = (flag & 1) ? 2 : 1;
                flag >>= 1;

                const ecbs: ECB[] = new Array(count);
                let tmp: number;
                for (let z=0; z < count; z++) {
                    tmp = bin[i++];
                    ecbs[z] = ECB(tmp, bin[i++]);
                }

                let cwpb = (q < 2) ? codewordsPerBlockHi : codewordsPerBlockLo;
                ecBlocks[q] = new ECBlocks(CWPB_MAP[(q & 1) ? (cwpb & 0xF) : (cwpb >> 4)], ...ecbs);
            }

            versions[version - 1] = new Version(version, alignmentPatternCenters, ...ecBlocks);
        }

        return versions;
    }
    VERSIONS = buildVersions();

}
