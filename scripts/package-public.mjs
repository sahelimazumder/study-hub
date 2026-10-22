import {mkdir,readdir,copyFile,access} from 'node:fs/promises';
import {join,dirname} from 'node:path';
const destination='release/github-pages-source';
try{await access(destination);throw Error('The source package already exists. Choose a new destination before rebuilding it.')}catch(e){if(e.code!=='ENOENT')throw e}
const files=['package.json','package-lock.json','index.html','tsconfig.json','vite.config.ts','.gitignore','.env.example','README.md','DEPLOYMENT.md','VALIDATION.md','START_STUDY_HUB.cmd','STOP_STUDY_HUB.cmd','scripts/local-build.mjs','scripts/manage-local.ps1','scripts/run-study-hub.vbs','tests/localServer.test.ts','.github/workflows/pages.yml','scripts/audit-public.mjs','scripts/run-tests.mjs','scripts/package-public.mjs','tests/features.test.ts','tests/public.test.ts','tests/ai.test.ts'];
async function collect(dir){for(const e of await readdir(dir,{withFileTypes:true})){const path=dir+'/'+e.name;if(e.isDirectory())await collect(path);else if(!['src/Dashboard.tsx','src/data/style_profile.json'].includes(path))files.push(path)}}
await collect('src');await collect('server');
for(const file of files){const target=join(destination,file);await mkdir(dirname(target),{recursive:true});await copyFile(file,target)}
console.log(`Prepared ${files.length} allowlisted source files in ${destination}. No private originals, extracts, workbenches, browser records, credentials or Git metadata were copied.`);
