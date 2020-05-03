import echo from '../lib/index.js';

test('hello', async () => {
  const result = await echo('hello');

  if (result !== 'hello') {
    throw new Error('Does not match!');
  }
});
