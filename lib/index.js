export default async function echo(importPath) {
  let { default: echoFn } = await import(`./${importPath}.js`);

  return echoFn();
}