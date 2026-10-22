import type {IncomingMessage,ServerResponse} from 'node:http';
export function aiMiddleware(env:Record<string,string>):(req:IncomingMessage,res:ServerResponse,next:()=>void)=>Promise<void>;
export function generationEnabled(env:Record<string,string>):boolean;
export function parseGenerationRequest(value:unknown):any;
export function parseGenerated(value:unknown,input:any):any;
