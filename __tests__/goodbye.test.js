import echo from '../lib/index.js';

test('goodbye', async () => {
  const result = await echo('goodbye');

  if (result !== 'goodbye') {
    throw new Error('Does not match!');
  }
});
