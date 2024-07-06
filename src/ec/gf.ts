
/*
 * Galois fields
 * Reference: https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/common/reedsolomon/GenericGF.java
 * Reference: https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/common/reedsolomon/GenericGFPoly.java
 */

import {StringBuilder} from "../util/string";

export class GenericGF {

    private readonly expTable: Int32Array;
    private readonly logTable: Int32Array;
    readonly zero: GenericGFPoly;
    readonly one: GenericGFPoly;
    readonly size: number;
    private readonly primitive: number;
    readonly generatorBase: number;

    constructor(primitive: number, size: number, b: number) {
        this.primitive = primitive;
        this.size = size;
        this.generatorBase = b;

        this.expTable = new Int32Array(size);
        this.logTable = new Int32Array(size);
        let x: number = 1;
        for (let i=0; i < size; i++) {
            this.expTable[i] = x;
            x *= 2; // 2 (the polynomial x) is a primitive element
            if (x >= size) {
                x ^= primitive;
                x &= size - 1;
            }
        }
        for (let i=0; i < size - 1; i++) {
            this.logTable[this.expTable[i]] = i;
        }
        // logTable[0] == 0 but this should never be used
        this.zero = new GenericGFPoly(this, [ 0 ]);
        this.one = new GenericGFPoly(this, [ 1 ]);
    }

    /**
     * @return The monomial representing coefficient * x^degree
     */
    buildMonomial(degree: number, coefficient: number): GenericGFPoly {
        if (degree < 0) throw new Error(`Degree ${degree} is less than 0`);
        if (coefficient === 0) {
            return this.zero;
        }
        let coefficients = new Int32Array(degree + 1);
        coefficients[0] = coefficient;
        return new GenericGFPoly(this, coefficients);
    }

    exp(a: number): number {
        return this.expTable[a];
    }

    log(a: number): number {
        if (a === 0) throw new Error(`Cannot perform log on 0 value`);
        return this.logTable[a];
    }

    inverse(a: number): number {
        if (a === 0) throw new Error(`Cannot find inverse of 0 value`);
        return this.expTable[this.size - this.logTable[a] - 1];
    }

    multiply(a: number, b: number): number {
        if (a === 0 || b === 0) return 0;
        return this.expTable[(this.logTable[a] + this.logTable[b]) % (this.size - 1)];
    }

    toString(): string {
        return `GF(0x${this.primitive.toString(16)},${this.size})`;
    }

}

export class GenericGFPoly {

    private readonly field: GenericGF;
    readonly coefficients: ArrayLike<number>;

    constructor(field: GenericGF, coefficients: ArrayLike<number>) {
        if (coefficients.length === 0) throw new Error("Coefficients array is empty");
        this.field = field;

        const cl: number = coefficients.length;
        if (cl > 1 && coefficients[0] === 0) {
            let firstNonZero: number = 1;
            while (firstNonZero < coefficients.length && coefficients[firstNonZero] === 0) firstNonZero++;
            if (firstNonZero === cl) {
                this.coefficients = [];
            } else {
                const cpy = new Int32Array(cl - firstNonZero);
                for (let i=0; i < cpy.length; i++) cpy[i] = coefficients[i + firstNonZero];
                this.coefficients = cpy;
            }
        } else {
            this.coefficients = coefficients;
        }
    }

    get degree(): number {
        return this.coefficients.length - 1;
    }

    isZero(): boolean {
        return this.coefficients[0] === 0;
    }

    getCoefficient(degree: number): number {
        return this.coefficients[this.coefficients.length - 1 - degree];
    }

    evaluateAt(a: number): number {
        if (a === 0) return this.getCoefficient(0);
        if (a === 1) {
            let result: number = 0;
            for (let i=0; i < this.coefficients.length; i++) {
                result ^= this.coefficients[i];
            }
            return result;
        }
        let result: number = this.coefficients[0];
        for (let i=1; i < this.coefficients.length; i++) {
            result = this.field.multiply(a, result) ^ this.coefficients[i];
        }
        return result;
    }

    private _assertFieldEq(other: GenericGFPoly): void {
        if (this.field !== other.field) throw new Error("GenericGFPolys do not have same GenericGF field");
    }

    addOrSubtract(other: GenericGFPoly): GenericGFPoly {
        this._assertFieldEq(other);
        if (this.isZero()) return other;
        if (other.isZero()) return this;

        let smaller = this.coefficients;
        let larger = other.coefficients;
        if (smaller.length > larger.length) {
            let tmp = smaller;
            smaller = larger;
            larger = tmp;
        }

        const sumDiff = new Int32Array(larger.length);
        const lengthDiff = larger.length - smaller.length;
        for (let i=0; i < lengthDiff; i++) sumDiff[i] = larger[i];

        for (let i=lengthDiff; i < larger.length; i++) {
            sumDiff[i] = smaller[i - lengthDiff] ^ larger[i];
        }

        return new GenericGFPoly(this.field, sumDiff);
    }

    multiply(other: GenericGFPoly | number): GenericGFPoly {
        if (typeof other === "number") {
            return this.multiplyByScalar(other as number);
        }
        this._assertFieldEq(other);
        if (this.isZero() || other.isZero()) {
            return this.field.zero;
        }
        const aC = this.coefficients;
        const aL: number = aC.length;
        const bC = other.coefficients;
        const bL: number = bC.length;
        const product = new Int32Array(aL + bL - 1);
        for (let i=0; i < aL; i++) {
            let aCoeff: number = aC[i];
            for (let j=0; j < bL; j++) {
                product[i + j] = product[i + j] ^ this.field.multiply(aCoeff, bC[j]);
            }
        }
        return new GenericGFPoly(this.field, product);
    }

    multiplyByScalar(scalar: number): GenericGFPoly {
        if (scalar === 0) return this.field.zero;
        if (scalar === 1) return this;
        const size = this.coefficients.length;
        const product = new Int32Array(size);
        for (let i=0; i < size; i++) product[i] = this.field.multiply(this.coefficients[i], scalar);
        return new GenericGFPoly(this.field, product);
    }

    multiplyByMonomial(degree: number, coefficient: number): GenericGFPoly {
        if (degree < 0) throw new Error(`Degree ${degree} is negative`);
        if (coefficient === 0) return this.field.zero;

        const size: number = this.coefficients.length;
        const product = new Int32Array(size + degree);

        for (let i=0; i < size; i++) {
            product[i] = this.field.multiply(this.coefficients[i], coefficient);
        }

        return new GenericGFPoly(this.field, product);
    }

    divide(other: GenericGFPoly): [ GenericGFPoly, GenericGFPoly ] {
        this._assertFieldEq(other);
        if (other.isZero()) {
            throw new Error("Caught division by 0");
        }

        let quotient: GenericGFPoly = this.field.zero;
        let remainder: GenericGFPoly = this;

        const denominatorLeadingTerm: number = other.getCoefficient(other.degree);
        const inverseDenominatorLeadingTerm: number = this.field.inverse(denominatorLeadingTerm);

        while (remainder.degree >= other.degree && !remainder.isZero()) {
            const degreeDifference = remainder.degree - other.degree;
            const scale = this.field.multiply(remainder.getCoefficient(remainder.degree), inverseDenominatorLeadingTerm);
            const term: GenericGFPoly = other.multiplyByMonomial(degreeDifference, scale);
            const iterationQuotient: GenericGFPoly = this.field.buildMonomial(degreeDifference, scale);
            quotient = quotient.addOrSubtract(iterationQuotient);
            remainder = remainder.addOrSubtract(term);
        }

        return [ quotient, remainder ];
    }

    toString(): string {
        if (this.isZero()) return "0";
        const sb = new StringBuilder(8 * this.degree);
        for (let degree = this.degree; degree >= 0; degree--) {
            let coefficient: number = this.getCoefficient(degree);
            if (coefficient === 0) continue;
            if (coefficient < 0) {
                if (degree === this.degree) {
                    sb.appendChar(45); // MINUS
                } else {
                    sb.appendSpace();
                    sb.appendChar(45); // MINUS
                    sb.appendSpace();
                }
                coefficient = -coefficient;
            } else if (sb.length > 0) {
                sb.appendSpace();
                sb.appendChar(43); // PLUS
                sb.appendSpace();
            }
            if (degree === 0 || coefficient !== 1) {
                const alphaPower = this.field.log(coefficient);
                if (alphaPower === 0) {
                    sb.appendDigit(1);
                } else if (alphaPower === 1) {
                    sb.appendChar(97); // LOWERCASE A
                } else {
                    sb.appendChar(97); // LOWERCASE A
                    sb.appendChar(94); // CARAT
                    sb.append(alphaPower);
                }
            }
            if (degree !== 0) {
                if (degree === 1) {
                    sb.appendChar(120); // LOWERCASE X
                } else {
                    sb.appendChar(120); // LOWERCASE X
                    sb.appendChar(94); // CARAT
                    sb.append(degree);
                }
            }
        }
        return sb.toString();
    }

}

export namespace GenericGF {

    // JSPORT: Unused constants are commented out

    /*
    export const AZTEC_DATA_12 = new GenericGF(0b1000001101001, 4096, 1); // x^12 + x^6 + x^5 + x^3 + 1

    export const AZTEC_DATA_10 = new GenericGF(0b10000001001, 1024, 1); // x^10 + x^3 + 1

    export const AZTEC_DATA_8 = new GenericGF(0b100101101, 256, 1); // x^8 + x^5 + x^3 + x^2 + 1

    export const AZTEC_DATA_6 = new GenericGF(0b1000011, 64, 1); // x^6 + x + 1

    export const AZTEC_PARAM = new GenericGF(0b10011, 16, 1); // x^4 + x + 1
     */

    export const QR_CODE_FIELD_256 = new GenericGF(0b100011101, 256, 0); // x^8 + x^4 + x^3 + x^2 + 1

    /*
    export const DATA_MATRIX_FIELD_256 = AZTEC_DATA_8; // x^8 + x^5 + x^3 + x^2 + 1

    export const MAXICODE_FIELD_64 = AZTEC_DATA_6;
     */

}