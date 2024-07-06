/*
This is not a test, rather a utility used by other tests. All tests end in .test.ts

The purpose of this file is to adapt Jest to work a bit more like JUnit
 */

type UtilAnnotation = (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;

type UtilTest = {
    (name?: string): UtilAnnotation;
    fail(name?: string): UtilAnnotation;
    todo(name?: string): UtilAnnotation;
};

type Junit = {
    Test: UtilTest,
    runTests<T>(clazz: { new(): T }, name?: string): void;
    assertEquals<T>(a: T, b: T): void;
    assertSame<T>(a: T, b: T): void;
    assertTrue(v: any): void;
    assertFalse(v: any): void;
};

type Jest = {
    test: jest.It,
    describe: jest.Describe,
    expect: jest.Expect
};

const util: Junit = ((jest: Jest) => {

    const TestFunctionMagic = Symbol("TestFunctionMagic");
    enum TestType {
        BASIC = 0,
        FAIL = 1,
        TODO = 2
    }
    type TestFunction = Function & { _magic: symbol, _testName?: string, _testType: TestType };

    function TestFn(name?: string, type: TestType = TestType.BASIC): UtilAnnotation {
        // noinspection JSUnusedLocalSymbols
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            if (!(propertyKey in target)) return;
            let value: any = target[propertyKey];
            if (typeof value !== "function") throw new Error("@testFunc annotation applied to non-function");
            const func = value as unknown as TestFunction;
            func["_magic"] = TestFunctionMagic;
            func["_testName"] = name;
            func["_testType"] = type;
        };
    }

    let Test: UtilTest = TestFn as unknown as UtilTest;
    Test["fail"] = ((n) => TestFn(n, TestType.FAIL));
    Test["todo"] = ((n) => TestFn(n, TestType.TODO));

    function runTests<T>(clazz: { new(): T }, name?: string): void {
        if (typeof name !== "string") {
            name = clazz.name;
            if (name.endsWith("Test")) name = name.substring(0, name.length - 4);
        }
        jest.describe(name!, () => {
            const instance: T = new clazz();
            let v: any;
            for (let k of Object.getOwnPropertyNames(Object.getPrototypeOf(instance))) {
                v = instance[k as unknown as keyof T];
                if (typeof v !== "function") continue;
                const func: TestFunction = v as unknown as TestFunction;
                if (TestFunctionMagic === func["_magic"]) {
                    const name: string = func["_testName"] || k;
                    const type: TestType = func["_testType"];
                    const runner = (() => {
                        let out = func.apply(instance);
                        if (typeof out === "object" && "then" in out) {
                            return (out as unknown as Promise<unknown>).then<void>(() => {});
                        }
                    }) as unknown as jest.ProvidesCallback;

                    switch (type) {
                        case TestType.FAIL:
                            jest.test.failing(name, runner);
                            break;
                        case TestType.TODO:
                            jest.test.todo(name);
                            break;
                        default:
                            jest.test(name, runner);
                            break;
                    }
                }
            }
        });
    }

    function assertEquals<T>(a: T, b: T): void {
        jest.expect(a).toEqual(b);
    }

    function assertSame<T>(a: T, b: T): void {
        jest.expect(a).toBe(b);
    }

    function assertTrue(v: any): void {
        jest.expect(v).toBeTruthy();
    }

    function assertFalse(v: any): void {
        jest.expect(v).toBeFalsy();
    }

    const ret: Junit = {
        Test,
        runTests,
        assertEquals,
        assertSame,
        assertTrue,
        assertFalse
    };
    return ret;

})({ test, describe, expect });

export = util;
