import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {mkdtemp,writeFile,mkdir,unlink,rmdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createLocalServer} from '../server/local.mjs';
let server:ReturnType<typeof createLocalServer>,root:string,url:string;
beforeAll(async()=>{
 root=await mkdtemp(join(tmpdir(),'study-server-test-'));
 await mkdir(join(root,'assets'));
 await writeFile(join(root,'index.html'),'<html>Study test</html>');
 await writeFile(join(root,'assets/app.js'),'export const working=true;');
 await writeFile(join(root,'sample.pdf'),'0123456789');
 server=createLocalServer({root,env:{}});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 url=`http://127.0.0.1:${(server.address() as any).port}`;
});
afterAll(async()=>{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));await unlink(join(root,'assets/app.js'));await rmdir(join(root,'assets'));await unlink(join(root,'index.html'));await unlink(join(root,'sample.pdf'));await rmdir(root)});
describe('persistent local server',()=>{
 it('serves a stable health identity without keys or environment values',async()=>{const r=await fetch(url+'/__study_health'),health=await r.json();expect(health).toMatchObject({app:'ranchi-study-hub',mode:'persistent'});expect(health.pid).toBeGreaterThan(0);expect(r.headers.get('cache-control')).toBe('no-store');expect(health).not.toHaveProperty('env')});
 it('serves the application and reloads without a Vite development process',async()=>{expect(await(await fetch(url+'/')).text()).toContain('Study test');expect(await(await fetch(url+'/Practice')).text()).toContain('Study test');expect(await(await fetch(url+'/assets/app.js')).text()).toContain('working=true');expect((await fetch(url+'/assets/app.js')).headers.get('content-type')).toContain('javascript')});
 it('supports HEAD and PDF byte ranges',async()=>{const head=await fetch(url+'/sample.pdf',{method:'HEAD'});expect(head.headers.get('content-length')).toBe('10');expect(await head.text()).toBe('');const r=await fetch(url+'/sample.pdf',{headers:{Range:'bytes=2-5'}});expect(r.status).toBe(206);expect(r.headers.get('content-range')).toBe('bytes 2-5/10');expect(await r.text()).toBe('2345');expect((await fetch(url+'/sample.pdf',{headers:{Range:'bytes=99-100'}})).status).toBe(416)});
 it('rejects traversal, missing assets and unsupported writes',async()=>{expect((await fetch(url+'/%2e%2e%2fpackage.json')).status).toBe(403);expect((await fetch(url+'/%5c..%5c.env')).status).toBe(403);expect((await fetch(url+'/assets/not-here.js')).status).toBe(404);expect((await fetch(url+'/',{method:'POST'})).status).toBe(405)});
 it('preserves the optional local AI endpoint without enabling a provider',async()=>{const r=await fetch(url+'/api/ai/status'),body=await r.json();expect(r.status).toBe(200);expect(body.enabled).toBe(false);expect((await fetch(url+'/api/ai/generate',{method:'POST'})).status).toBe(503)});
});
