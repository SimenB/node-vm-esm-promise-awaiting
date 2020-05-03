const { createContext, SourceTextModule } = require('vm');
const { readFile } = require('fs/promises');
const { dirname, resolve } = require('path');
const { pathToFileURL } = require('url');

class TestRuntime {
    constructor(testFile) {
        this.testFile = testFile;
        this.moduleCache = new Map();
        this.testHasCompleted = false;
        this.context = createContext({});
    }

    async loadTestFramework() {
        await this.entry('./testFramework.js', {
            identifier: __filename,
            context: this.context,
        });
    }

    async entry(specifier, ref) {
        const m = await this.load(specifier, ref);
        if (m.status === 'unlinked') {
            await m.link(this.load.bind(this));
        }
        if (m.status === 'linked') {
            const { result } = await m.evaluate();
            // lazy, but just make sure this always loads first
            if (!this.framework) {
                this.framework = result;
            }
        }
        return m;
    }

    async load(specifier, ref) {
        const filename = resolve(dirname(ref.identifier), specifier);

        if (this.moduleCache.has(filename)) {
            return this.moduleCache.get(filename);
        }

        const fileContent = await readFile(filename, 'utf8');
        if (this.testHasCompleted) {
            console.error(`Trying to load ${filename} from test ${this.testFile}`);
            throw new Error('test has already completed');
        }
        const module = new SourceTextModule(fileContent, {
            context: ref.context,
            identifier: filename,
            initializeImportMeta(meta) {
                meta.url = pathToFileURL(filename).href;
            },
            importModuleDynamically: this.entry.bind(this),
        });

        this.moduleCache.set(filename, module);

        return module;
    }

    async runTest() {
        await this.entry(this.testFile, {
            identifier: __filename,
            context: this.context,
        });

        const results = await this.framework();

        this.testHasCompleted = true;

        return results;
    }
}

async function runTest(testName) {
    const runtime = new TestRuntime(testName);

    await runtime.loadTestFramework();
    const results = await runtime.runTest();

    console.log(results);
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
