import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import {resolve} from 'node:path';
import {existsSync} from 'node:fs';
import {aiMiddleware} from './server/ai.mjs';
export default defineConfig(({mode})=>{
 const env=loadEnv(mode,process.cwd(),'');
 const publicBuild=mode==='public';
 const requestedBase=process.env.PAGES_BASE||env.PAGES_BASE||'/';
 const base='/'+requestedBase.replace(/^\/+|\/+$/g,'')+(requestedBase.replace(/\//g,'')?'/':'');
 const privateBank=resolve('private-data/bank.json');
 return {
  base:publicBuild?base:'/',
  publicDir:publicBuild?false:'public',
  define:{'import.meta.env.VITE_PUBLIC_BUILD':JSON.stringify(String(publicBuild))},
  resolve:{alias:[{find:'./PrivateWorkbenches',replacement:!publicBuild&&existsSync(resolve('private-data/PrivateWorkbenches.tsx'))?resolve('private-data/PrivateWorkbenches.tsx'):resolve('src/PrivateWorkbenches.tsx')},{find:'./data/bank.json',replacement:!publicBuild&&existsSync(privateBank)?privateBank:resolve('src/data/public-bank.json')}]},
  plugins:[react(),{
   name:'local-optional-ai',
   configureServer(server){server.middlewares.use(aiMiddleware(env))},
   configurePreviewServer(server){server.middlewares.use(aiMiddleware(env))}
  }],
  server:{host:'127.0.0.1',port:5173,strictPort:true},
  build:{outDir:publicBuild?'dist-public':'dist',rollupOptions:{output:{manualChunks:{charts:['recharts'],react:['react','react-dom'],validation:['zod']}}}}
 };
});
