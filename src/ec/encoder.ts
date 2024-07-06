import {GenericGF, GenericGFPoly} from "./gf";

/**
 * Reference: https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/common/reedsolomon/ReedSolomonEncoder.java
 */
export class ReedSolomonEncoder {

    private readonly field: GenericGF;
    private readonly cachedGenerators: GenericGFPoly[];

    constructor(field: GenericGF) {
        this.field = field;
        this.cachedGenerators = [ new GenericGFPoly(field, [1]) ];
    }

    private buildGenerator(degree: number): GenericGFPoly {
        const count: number = this.cachedGenerators.length;
        if (degree >= count) {
            let lastGenerator: GenericGFPoly = this.cachedGenerators[count - 1];
            let nextGenerator: GenericGFPoly;
            for (let d=count; d <= degree; d++) {
                nextGenerator = lastGenerator.multiply(
                    new GenericGFPoly(this.field, [ 1, this.field.exp(d - 1 + this.field.generatorBase) ]));
                this.cachedGenerators[d] = nextGenerator;
                lastGenerator = nextGenerator;
            }
        }
        return this.cachedGenerators[degree];
    }

    encode(toEncode: Int32Array, ecBytes: number) {
        if (ecBytes === 0) throw new Error("No error correction bytes");
        const dataBytes: number = toEncode.length - ecBytes;
        if (dataBytes <= 0) throw new Error("No data bytes provided");

        const generator = this.buildGenerator(ecBytes);
        let infoCoefficients = toEncode.subarray(0, dataBytes);
        let info: GenericGFPoly = new GenericGFPoly(this.field, infoCoefficients);
        info = info.multiplyByMonomial(ecBytes, 1);
        const remainder: GenericGFPoly = info.divide(generator)[1];

        const coefficients = remainder.coefficients;
        const numZeroCoefficients: number = ecBytes - coefficients.length;
        const sub = toEncode.subarray(dataBytes);
        sub.fill(0, 0, numZeroCoefficients);
        sub.set(coefficients, numZeroCoefficients);
    }

}
