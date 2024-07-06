
/**
 * Reference: https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/qrcode/decoder/ErrorCorrectionLevel.java
 */
export enum ErrorCorrectionLevel {
    /** L = ~7% correction */
    L = 0x01,
    /** M = ~15% correction */
    M = 0x00,
    /** Q = ~25% correction */
    Q = 0x03,
    /** H = ~30% correction */
    H = 0x02
}

/**
 * - **L** = ~7% correction
 * - **M** = ~15% correction
 * - **Q** = ~25% correction
 * - **H** = ~30% correction
 * @see ErrorCorrectionLevel
 */
export type ErrorCorrectionLevelID = "L" | "M" | "Q" | "H";


export namespace ErrorCorrectionLevel {

    const ORDINALS: [number, number, number, number] = [ 1, 0, 3, 2 ];

    export function getOrdinal(level: ErrorCorrectionLevel): number {
        return ORDINALS[level];
    }

    export function parse(level: number | string): ErrorCorrectionLevel {
        let term: number;
        if (typeof level === "string") {
            let exact: ErrorCorrectionLevel = ErrorCorrectionLevel[level as unknown as "L" | "M" | "Q" | "H"];
            if (typeof exact === "number") return exact;
            term = level.charCodeAt(0);
        } else {
            return forBits(level);
        }
        switch (term) {
            case 76: // Latin L
            case 108: // Latin l
                return ErrorCorrectionLevel.L;
            case 77: // Latin M
            case 109: // Latin m
                return ErrorCorrectionLevel.M;
            case 81: // Latin Q
            case 113: // Latin q
                return ErrorCorrectionLevel.Q;
            case 72: // Latin H
            case 104: // Latin h
                return ErrorCorrectionLevel.H;
        }
        throw new Error(`Invalid EC level name (${level})`);
    }

    /**
     * JSPORT: This is a validation function. ErrorCorrectionLevel is now an integer type instead of a class.
     */
    export function forBits(bits: number): ErrorCorrectionLevel {
        if (bits < 0x00 || bits > 0x03) {
            throw new Error("Invalid EC level bits (" + bits + ")");
        }
        return bits as ErrorCorrectionLevel;
    }

}