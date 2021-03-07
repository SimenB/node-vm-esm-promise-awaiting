const tests = new Map();

globalThis.test = async function test(name, testFun) {
    tests.set(name, testFun);
};

globalThis.runTests = async function () {
    // this is injected into the context from the test runner
    const { testResults } = globalThis;

    for (const [testName, testFunc] of tests) {
        try {
            await testFunc();
            testResults.set(testName, 'success!');
        } catch (error) {
            testResults.set(testName, error);
        }
    }
};
