import echo from '../lib/index.js';


export async function goodbye() {
  let result = await echo("goodbye");

  if (result !== 'goodbye') {
    throw new Error('Does not match!');
  }
}
