// import {GenericGF, GenericGFPoly} from "./gf";

/**
 * @deprecated This class works, but it's commented out as it's currently unused.
 *
 * Reference: https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/common/reedsolomon/ReedSolomonDecoder.java
 */
export class ReedSolomonDecoder {

    /*
    private readonly field: GenericGF;

    constructor(field: GenericGF) {
        this.field = field;
    }

    decodeWithECCount(received: Int32Array, twoS: number): number {
        const poly = new GenericGFPoly(this.field, received);
        const syndromeCoefficients = new Int32Array(twoS);
        let noError: boolean = true;

        for (let i=0; i < twoS; i++) {
            const eVal = poly.evaluateAt(this.field.exp(i + this.field.generatorBase));
            syndromeCoefficients[twoS - 1 - i] = eVal;
            if (eVal !== 0) noError = false;
        }
        if (noError) return 0;

        const syndrome = new GenericGFPoly(this.field, syndromeCoefficients);
        const [ sigma, omega ] = this.runEuclideanAlgorithm(this.field.buildMonomial(twoS, 1), syndrome, twoS);
        const errorLocations = this.findErrorLocations(sigma);
        const errorMagnitudes = this.findErrorMagnitudes(omega, errorLocations);
        for (let i=0; i < errorLocations.length; i++) {
            const position: number = received.length - 1 - this.field.log(errorLocations[i]);
            if (position < 0) throw new Error("Bad error location");
            received[position] ^= errorMagnitudes[i];
        }
        return errorLocations.length;
    }

    readonly decode = this.decodeWithECCount;

    private runEuclideanAlgorithm(a: GenericGFPoly, b: GenericGFPoly, R: number): [ GenericGFPoly, GenericGFPoly ] {
        if (a.degree < b.degree) {
            const temp: GenericGFPoly = a;
            a = b;
            b = temp;
        }

        let rLast: GenericGFPoly = a;
        let r: GenericGFPoly = b;
        let tLast: GenericGFPoly = this.field.zero;
        let t: GenericGFPoly = this.field.one;

        while (2 * r.degree >= R) {
            const rLastLast: GenericGFPoly = rLast;
            const tLastLast: GenericGFPoly = tLast;
            rLast = r;
            tLast = t;

            if (rLast.isZero()) throw new Error("r_{i-1} was zero");
            r = rLastLast;
            let q: GenericGFPoly = this.field.zero;
            const dlt: number = rLast.getCoefficient(rLast.degree);
            const dltInverse: number = this.field.inverse(dlt);
            while (r.degree >= rLast.degree && !r.isZero()) {
                const degreeDiff: number = r.degree - rLast.degree;
                const scale: number = this.field.multiply(r.getCoefficient(r.degree), dltInverse);
                q = q.addOrSubtract(this.field.buildMonomial(degreeDiff, scale));
                r = r.addOrSubtract(rLast.multiplyByMonomial(degreeDiff, scale));
            }

            t = q.multiply(tLast).addOrSubtract(tLastLast);

            if (r.degree >= rLast.degree)
                throw new Error(`Division algorithm failed to reduce polynomial? r: ${r.toString()}, rLast: ${rLast.toString()}`);
        }

        const sigmaTildeAtZero = t.getCoefficient(0);
        if (sigmaTildeAtZero === 0) throw new Error("sigmaTilde(0) was zero");

        const inverse = this.field.inverse(sigmaTildeAtZero);
        return [
            t.multiply(inverse),
            r.multiply(inverse)
        ];
    }

    private findErrorLocations(errorLocator: GenericGFPoly): ArrayLike<number> {
        const numErrors: number = errorLocator.degree;
        if (numErrors === 1) {
            return [ errorLocator.getCoefficient(1) ];
        }
        const result = new Int32Array(numErrors);
        let e: number = 0;
        for (let i=1; i < this.field.size && e < numErrors; i++) {
            if (errorLocator.evaluateAt(i) === 0) {
                result[e] = this.field.inverse(i);
                e++;
            }
        }
        if (e !== numErrors) {
            throw new Error("Error locator degree does not match number of roots");
        }
        return result;
    }

    private findErrorMagnitudes(errorEvaluator: GenericGFPoly, errorLocations: ArrayLike<number>): Int32Array {
        const s: number = errorLocations.length;
        const result = new Int32Array(s);
        for (let i=0; i < s; i++) {
            const xiInverse: number = this.field.inverse(errorLocations[i]);
            let denominator: number = 1;
            for (let j=0; j < s; j++) {
                if (i === j) continue;
                let term = this.field.multiply(errorLocations[j], xiInverse);
                let termPlus1 = (term & 0x1) === 0 ? term | 1 : term & ~1;
                denominator = this.field.multiply(denominator, termPlus1);
            }
            result[i] = this.field.multiply(errorEvaluator.evaluateAt(xiInverse), this.field.inverse(denominator));
            if (this.field.generatorBase !== 0) result[i] = this.field.multiply(result[i], xiInverse);
        }
        return result;
    }
     */

}
