import {existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
const require=createRequire(import.meta.url);
const runner=join(dirname(require.resolve('vitest/package.json')),'vitest.mjs');
const args=[runner,'run','--exclude','release/**',...(existsSync('private-data/bank.json')?[]:['tests/public.test.ts','tests/features.test.ts','tests/ai.test.ts'])];
const result=spawnSync(process.execPath,args,{stdio:'inherit'});process.exit(result.status??1);
