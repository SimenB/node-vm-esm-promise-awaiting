const tests = new Map();

globalThis.test = async function test(name, testFun) {
    tests.set(name, testFun);
};

globalThis.runTests = async function () {
    const results = new Map();

    for (const [testName, testFunc] of tests) {
        try {
            await testFunc();
            results.set(testName, 'success!');
        } catch (error) {
            results.set(testName, error);
        }
    }

    return results;
};
