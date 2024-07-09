import {TernaryValue} from "../collection/ternaryMatrix";

/*
 * Reference: https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/qrcode/encoder/MaskUtil.java
 */

export namespace MaskUtil {

    export const N1: number = 3;
    export const N2: number = 3;
    export const N3: number = 40;
    export const N4: number = 10;

    export function applyMaskPenaltyRule1(matrix: TernaryValue[][], width: number, height: number) {
        return applyMaskPenaltyRule1Internal(matrix, width, height, true)
            + applyMaskPenaltyRule1Internal(matrix, width, height, false);
    }

    export function applyMaskPenaltyRule2(matrix: TernaryValue[][], width: number, height: number) {
        let penalty: number = 0;
        let row: TernaryValue[];
        let value: TernaryValue;
        for (let y=0; y < height - 1; y++) {
            row = matrix[y];
            for (let x=0; x < width - 1; x++) {
                value = row[x];
                if (
                    value === row[x + 1] &&
                    value === matrix[y + 1][x] &&
                    value === matrix[y + 1][x + 1]
                ) penalty++;
            }
        }
        return N2 * penalty;
    }

    export function applyMaskPenaltyRule3(matrix: TernaryValue[][], width: number, height: number) {
        let numPenalties: number = 0;
        let arrayY: TernaryValue[];
        for (let y=0; y < height; y++) {
            arrayY = matrix[y];
            for (let x=0; x < width; x++) {
                if (x + 6 < width &&
                    arrayY[x] === 1 &&
                    arrayY[x + 1] == 0 &&
                    arrayY[x + 2] == 1 &&
                    arrayY[x + 3] == 1 &&
                    arrayY[x + 4] == 1 &&
                    arrayY[x + 5] == 0 &&
                    arrayY[x + 6] == 1 &&
                    (isWhiteHorizontal(arrayY, x - 4, x) || isWhiteHorizontal(arrayY, x + 7, x + 11))
                ) numPenalties++;
                if (y + 6 < height &&
                    matrix[y][x] == 1 &&
                    matrix[y + 1][x] == 0 &&
                    matrix[y + 2][x] == 1 &&
                    matrix[y + 3][x] == 1 &&
                    matrix[y + 4][x] == 1 &&
                    matrix[y + 5][x] == 0 &&
                    matrix[y + 6][x] == 1 &&
                    (isWhiteVertical(matrix, x, y - 4, y) || isWhiteVertical(matrix, x, y + 7, y + 11))
                ) numPenalties++;
            }
        }
        return numPenalties * N3;
    }

    export function applyMaskPenaltyRule4(matrix: TernaryValue[][], width: number, height: number) {
        let numDarkCells: number = 0;
        let numTotalCells: number = 0;
        for (let y=0; y < height; y++) {
            for (let x=0; x <width; x++) {
                if (matrix[y][x] === 1) numDarkCells++;
                numTotalCells++;
            }
        }
        const fivePercentVariances = Math.floor(Math.abs((numDarkCells * 2 - numTotalCells) * 10) / numTotalCells);
        return fivePercentVariances * N4;
    }

    function isWhiteHorizontal(rowArray: TernaryValue[], from: number, to: number) {
        if (from < 0 || rowArray.length < to) return false;
        for (let i=from; i < to; i++) {
            if (rowArray[i] === 1) return false;
        }
        return true;
    }

    function isWhiteVertical(array: TernaryValue[][], col: number, from: number, to: number) {
        if (from < 0 || array.length < to) return false;
        for (let i=from; i < to; i++) {
            if (array[i][col] === 1) return false;
        }
        return true;
    }

    function applyMaskPenaltyRule1Internal(matrix: TernaryValue[][], width: number, height: number, isHorizontal: boolean) {
        let penalty: number = 0;
        const iLimit: number = isHorizontal ? height : width;
        const jLimit: number = isHorizontal ? width : height;
        // JSPORT: Determined that it's probably not worth moving the matrix to an array here
        for (let i=0; i < iLimit; i++) {
            let numSameBitCells: number = 0;
            let prevBit: number = -1;
            for (let j=0; j < jLimit; j++) {
                let bit: TernaryValue = isHorizontal ? matrix[i][j] : matrix[j][i];
                if (bit === prevBit) {
                    numSameBitCells++;
                } else {
                    if (numSameBitCells >= 5) penalty += N1 + (numSameBitCells - 5);
                    numSameBitCells = 1;
                    prevBit = bit;
                }
            }
            if (numSameBitCells >= 5) penalty += N1 + (numSameBitCells - 5);
        }
        return penalty;
    }

    export function getDataMaskBit(maskPattern: number, x: number, y: number): boolean {
        let intermediate: number;
        let temp: number;
        switch (maskPattern) {
            case 0:
                intermediate = (y + x) & 0x1;
                break;
            case 1:
                intermediate = y & 0x1;
                break;
            case 2:
                intermediate = x % 3;
                break;
            case 3:
                intermediate = (y + x) % 3;
                break;
            case 4:
                intermediate = ((y >> 1) + Math.floor(x / 3)) & 0x1;
                break;
            case 5:
                temp = y * x;
                intermediate = (temp & 0x1) + (temp % 3);
                break;
            case 6:
                temp = y * x;
                intermediate = ((temp & 0x1) + (temp % 3)) & 0x1;
                break;
            case 7:
                temp = y * x;
                intermediate = ((temp % 3) + ((y + x) & 0x1)) & 0x1;
                break;
            default:
                throw new Error("Invalid mask pattern: " + maskPattern);
        }
        return intermediate === 0;
    }

}
