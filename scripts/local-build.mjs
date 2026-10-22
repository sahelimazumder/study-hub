import {existsSync,readdirSync,statSync,readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
export const root=fileURLToPath(new URL('../',import.meta.url));
export function ensureLocalBuild(){
 const entries=[];function scan(path){if(!existsSync(path))return;const stat=statSync(path);if(stat.isDirectory())for(const name of readdirSync(path).sort())scan(resolve(path,name));else entries.push([path,stat.size,stat.mtimeMs])}
 for(const path of ['src','server','public','private-data','vite.config.ts','index.html','package-lock.json','.env','.env.local'])scan(resolve(root,path));
 const signature=createHash('sha256').update(JSON.stringify(entries)).digest('hex'),marker=resolve(root,'.runtime/build.json');
 let previous;try{previous=JSON.parse(readFileSync(marker,'utf8')).signature}catch{}
 if(previous===signature&&existsSync(resolve(root,'dist/index.html')))return false;
 for(const [script,args] of [['node_modules/typescript/bin/tsc',['-b']],['node_modules/vite/bin/vite.js',['build']]]){
  const result=spawnSync(process.execPath,[resolve(root,script),...args],{cwd:root,stdio:'inherit',windowsHide:true});if(result.status!==0)throw Error('Local build failed. Existing browser notes have not been changed.');
 }
 mkdirSync(resolve(root,'.runtime'),{recursive:true});writeFileSync(marker,JSON.stringify({signature,builtAt:new Date().toISOString()}));return true;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))ensureLocalBuild();
