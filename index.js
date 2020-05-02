const { createContext, SourceTextModule } = require('vm');
const { readFile } = require('fs/promises');
const { dirname, resolve } = require('path');
const { pathToFileURL } = require('url');
const { promisify } = require('util');

let completed = false

const timeout = promisify(setTimeout)

function wait() {
    // play with this number - around 2s makes both tests fail
    const randomNumberLowerThan1000 = Math.floor(Math.random() * 1000);

    return timeout(randomNumberLowerThan1000);
}

async function linker(specifier, ref) {
    const newName = resolve(dirname(ref.identifier), specifier);

    const fileContent = await readFile(newName, 'utf8');
    await wait();
    const module = new SourceTextModule(fileContent, {
        context: ref.context,
        identifier: newName,
        initializeImportMeta(meta) {
            meta.url = pathToFileURL(newName).href;
        },
        importModuleDynamically: linker,
    });

    await wait();
    await wait();

    await module.link(linker);
    await module.evaluate();
    if (completed) {
        throw new Error('we have completed, what is going on');
    }
    return module;
}

async function runTest(testName) {
    const context = createContext({});
    const fileContent = await readFile(testName, 'utf8');
    await wait();

    const module = new SourceTextModule(fileContent, {
        context,
        identifier: testName,
        initializeImportMeta(meta) {
            meta.url = pathToFileURL(testName).href;
        },
        importModuleDynamically: linker,
    });
    await wait();
    await module.link(linker);
    await wait();
    await module.evaluate();
}

Promise.all([
    runTest(resolve(__dirname, 'hello.js')),
    runTest(resolve(__dirname, 'goodbye.js')),
])
    .then(() => {
        completed = true;
        console.log('success!');
    })
    .catch(error => {
        console.error('Failed', error);
        process.exitCode = 1;
    });
