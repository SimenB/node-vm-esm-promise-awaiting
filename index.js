const { createContext, SourceTextModule } = require('vm');
const { readFile } = require('fs/promises');
const { dirname, resolve } = require('path');
const { pathToFileURL } = require('url');
const { promisify } = require('util');

const timeout = promisify(setTimeout);

function wait() {
    // play with this number - around 2s makes both tests fail
    const randomNumberLowerThan1000 = Math.floor(Math.random() * 2500);

    return timeout(randomNumberLowerThan1000);
}

async function runTest(testName) {
    const moduleCache = new Map();
    const context = createContext({});
    let completed = false;

    let testFrameworkEval;

    async function load(specifier, ref) {
        const filename = resolve(dirname(ref.identifier), specifier);

        if (moduleCache.has(filename)) {
            return moduleCache.get(filename);
        }

        const fileContent = await readFile(filename, 'utf8');
        await wait();
        if (completed) {
            console.error(`Trying to load ${filename} from test ${testName}`);
            throw new Error('test has already completed');
        }
        const module = new SourceTextModule(fileContent, {
            context: ref.context,
            identifier: filename,
            initializeImportMeta(meta) {
                meta.url = pathToFileURL(filename).href;
            },
            importModuleDynamically: entry,
        });

        moduleCache.set(filename, module);

        await wait();
        await wait();

        return module;
    }

    async function entry(specifier, ref) {
        const m = await load(specifier, ref);
        if (m.status === 'unlinked') {
            await m.link(load);
        }
        if (m.status === 'linked') {
            const { result } = await m.evaluate();
            if (!testFrameworkEval) {
                testFrameworkEval = result;
            }
        }
        return m;
    }

    await entry('./testFramework.js', { identifier: __filename, context });

    await entry(testName, { identifier: __filename, context });

    const testResults = await testFrameworkEval();

    completed = true;

    console.log(testResults);
}

Promise.all([
    runTest('./__tests__/hello.test.js'),
    runTest('./__tests__/goodbye.test.js'),
])
    .then(() => {
        console.log('test run complete!');
    })
    .catch(error => {
        console.error('Failed', error);
        process.exitCode = 1;
    });
