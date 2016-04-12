export function camelToDash(str: string) {
  return str.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});
}

export function dashToCamel(str: string) {
  return str.replace(/\W+(.)/g, function (x: any, chr: string) {
    return chr.toUpperCase();
  });
}