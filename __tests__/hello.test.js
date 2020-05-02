import echo from '../lib/index.js';


export async function hello() {
  let result = await echo("hello");

  if (result !== 'hello') {
    throw new Error('Does not match!');
  }
}
