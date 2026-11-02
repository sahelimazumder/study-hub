export function filterValues(value:string):string[]{if(!value)return [];if(value.startsWith('[')){try{const a=JSON.parse(value);return Array.isArray(a)?[...new Set(a.filter((v):v is string=>typeof v==='string'))]:[];}catch{return [];}}return [value];}
export function encodeFilter(values:string[]){const unique=[...new Set(values)];return unique.length===1?unique[0]:JSON.stringify(unique);}
export function filterMatches(value:string,item:string){return value===''||filterValues(value).includes(item);}
export function filterMatchesAny(value:string,items:string[]){return value===''||items.some(item=>filterValues(value).includes(item));}
