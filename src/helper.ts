export function getFunctionName(fn: Function): string {
  let name = fn.toString();
  let reg = /function ([^\(]*)/;
  return reg.exec(name)[1];
}
