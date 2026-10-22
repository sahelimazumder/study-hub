import {createServer} from 'node:http';
import {createReadStream,existsSync,readFileSync,statSync} from 'node:fs';
import {resolve,relative,isAbsolute,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseEnv} from 'node:util';
import {aiMiddleware} from './ai.mjs';

export const projectRoot=fileURLToPath(new URL('../',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon','.pdf':'application/pdf','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.csv':'text/csv; charset=utf-8'};
export function createLocalServer({root=resolve(projectRoot,'dist'),env=process.env}={}){
 const ai=aiMiddleware(env),startedAt=new Date().toISOString();
 return createServer((req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  const fail=(code,message)=>{res.statusCode=code;res.setHeader('Cache-Control','no-store');res.end(message)};
  if(req.url==='/__study_health'){
   res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
   return res.end(JSON.stringify({app:'ranchi-study-hub',mode:'persistent',pid:process.pid,startedAt}));
  }
  Promise.resolve(ai(req,res,()=>{
   if(!['GET','HEAD'].includes(req.method))return fail(405,'Method not allowed');
   let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}catch{return fail(400,'Invalid path')}
   if(pathname.includes('\\')||pathname.includes('\0'))return fail(403,'Forbidden');
   let file=resolve(root,'.'+pathname),inside=relative(root,file);
   if(inside.startsWith('..')||isAbsolute(inside))return fail(403,'Forbidden');
   if(!existsSync(file)||statSync(file).isDirectory()){
    if(extname(pathname)&&pathname!=='/')return fail(404,'Not found');
    file=resolve(root,'index.html');
   }
   if(!existsSync(file))return fail(503,'Local build is not ready. Run START_STUDY_HUB.cmd.');
   const size=statSync(file).size;let start=0,end=size-1;
   res.setHeader('Content-Type',types[extname(file).toLowerCase()]||'application/octet-stream');
   res.setHeader('Cache-Control','no-cache');res.setHeader('Accept-Ranges','bytes');
   if(req.headers.range){
    const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
    if(!match||(start=Number(match[1]))>=size||(end=match[2]?Math.min(Number(match[2]),size-1):size-1)<start){res.setHeader('Content-Range',`bytes */${size}`);return fail(416,'Invalid range')}
    res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${size}`);
   }
   res.setHeader('Content-Length',Math.max(0,end-start+1));
   if(req.method==='HEAD'||!size)return res.end();
   const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
  })).catch(()=>{if(!res.headersSent)fail(500,'Local request failed');else res.destroy()});
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 let env={};for(const name of ['.env','.env.local']){const path=resolve(projectRoot,name);if(existsSync(path))env={...env,...parseEnv(readFileSync(path,'utf8'))}}
 const server=createLocalServer({env:{...env,...process.env}});
 server.on('error',error=>{console.error(`Local server could not start: ${error.code||error.message}`);process.exit(1)});
 server.listen(5173,'127.0.0.1',()=>console.log('Study Hub ready at http://127.0.0.1:5173/'));
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
}
