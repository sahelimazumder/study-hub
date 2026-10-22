import type {Server} from 'node:http';
export const projectRoot:string;
export function createLocalServer(options?:{root?:string;env?:Record<string,string|undefined>}):Server;
