import {openSync,closeSync,existsSync,readFileSync,writeFileSync,unlinkSync,mkdirSync,statSync,copyFileSync,truncateSync} from 'node:fs';
import {resolve} from 'node:path';
import {uptime} from 'node:os';
import {spawn} from 'node:child_process';
import {ensureLocalBuild,root} from '../scripts/local-build.mjs';
const runtime=resolve(root,'.runtime');mkdirSync(runtime,{recursive:true});
const lock=resolve(runtime,'supervisor.json'),bootedAt=Date.now()-uptime()*1000;
if(existsSync(lock)){try{const old=JSON.parse(readFileSync(lock,'utf8'));if(Math.abs(old.bootedAt-bootedAt)<120000){process.kill(old.pid,0);process.exit(0)}}catch{}try{unlinkSync(lock)}catch{}}
try{const fd=openSync(lock,'wx');writeFileSync(fd,JSON.stringify({pid:process.pid,bootedAt}));closeSync(fd)}catch{process.exit(0)}
const logPath=resolve(runtime,'server.log');if(existsSync(logPath)&&statSync(logPath).size>5000000){copyFileSync(logPath,logPath+'.previous');truncateSync(logPath)}
const log=openSync(logPath,'a');const record=message=>writeFileSync(log,`${new Date().toISOString()} ${message}\n`);
let child,stopping=false,retry;
process.on('exit',()=>{try{if(JSON.parse(readFileSync(lock,'utf8')).pid===process.pid)unlinkSync(lock)}catch{}});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{stopping=true;clearTimeout(retry);child?.kill();process.exit(0)});
try{ensureLocalBuild()}catch(error){record(error.message);process.exit(1)}
async function launch(){
 if(stopping)return;
 try{const response=await fetch('http://127.0.0.1:5173/__study_health',{signal:AbortSignal.timeout(2500)});const health=await response.json();if(health.app==='ranchi-study-hub'&&health.mode==='persistent'){retry=setTimeout(launch,5000);return}}catch{}
 record('Starting persistent loopback server.');child=spawn(process.execPath,[resolve(root,'server/local.mjs')],{cwd:root,stdio:['ignore',log,log],windowsHide:true});
 child.on('error',error=>record(`Could not launch local server: ${error.code||error.message}`));
 child.on('exit',(code)=>{record(`Local server exited (${code}); retrying in 2 seconds.`);child=undefined;if(!stopping)retry=setTimeout(launch,2000)});
}
launch();
setInterval(async()=>{if(!child)return;try{const response=await fetch('http://127.0.0.1:5173/__study_health',{signal:AbortSignal.timeout(4000)});if(!response.ok)throw Error('Unhealthy')}catch{record('Server health check failed; restarting owned child.');child?.kill()}},30000).unref();
