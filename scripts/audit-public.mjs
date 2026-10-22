import {readFile,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const bank=JSON.parse(await readFile('src/data/public-bank.json','utf8'));
const extra=JSON.parse(await readFile('src/data/python-bank.json','utf8'));
const additions=[...JSON.parse(await readFile('src/data/additions.json','utf8')),...extra.questions];
assert([...bank.questions,...additions].every(q=>q.provenance_category==='authored_aligned_practice'&&q.status==='validated'&&!q.raw_text));
assert.equal(bank.coffee_models.length,0);assert.equal(bank.quarantine.length,0);
const forbidden=[/07-Exam-dump-docs/i,/11-Pasted-markdown-5-/i,/50f7ef7bbc3876d500f3146f812f47b190c679a02fd8be5cb124b6ccf26ff242/,/Merge Myntra \+ Jabong/,/sk-proj-[a-zA-Z0-9_-]{12,}/,/D:\\Downloads\\IIM_Ranchi/i];
async function files(dir){const result=[];for(const e of await readdir(dir,{withFileTypes:true})){const path=dir+'/'+e.name;if(e.isDirectory())result.push(...await files(path));else result.push(path)}return result}
const built=await files('dist-public');
for(const path of built){assert(!/\.(pdf|docx|pbix|md|txt)$/i.test(path),`Private/unexpected document in deployment: ${path}`);assert(!/\/(course|data|kit|private-data)\//.test(path));if(/\.(html|js|css|json)$/.test(path)){const text=await readFile(path,'utf8');for(const pattern of forbidden)assert(!pattern.test(text),`Private source or secret marker in ${path}`)}}
let tracked=[];try{tracked=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean)}catch{}
for(const path of tracked)assert(!/^(kit\/|private-data\/|public\/(?:course|data)\/|src\/data\/style_profile\.json$|artifacts\/|\.env$)/.test(path),`Private path is tracked: ${path}`);
console.log(`Public audit passed: ${bank.questions.length+additions.length} independently authored questions; ${bank.cases.length+extra.cases.length} cases; ${built.length} deployable files. No private attachment/extract paths or known source/secret markers. ${tracked.length} tracked paths checked.`);
