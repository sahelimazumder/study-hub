import raw from './data/bank.json';
import additions from './data/additions.json';
import python from './data/python-bank.json';
import type {Question,Case,Card} from './core';
export const isPublic=import.meta.env.VITE_PUBLIC_BUILD==='true';
export const bank={...raw,modules:[...raw.modules,{id:'python',title:'Python and pandas',description:'Business calculations, lists, control flow and grouped analysis',source:'PYDOC'}],sources:[...raw.sources,python.source],sheets:[...raw.sheets,...python.sheets],questions:[...raw.questions,...additions,...python.questions] as unknown as Question[],cases:[...raw.cases,...python.cases] as unknown as Case[],cards:[...raw.cards,...python.cards] as Card[],quarantine:raw.quarantine as unknown as {id:string;source_id:string;locator:string;raw_text:string;status:string;reason:string}[],coffee_models:raw.coffee_models as unknown as {id:string;predictors:string[];coefficients:number[];standard_errors:number[];t_values:number[];p_values:number[];ci95:number[][];r2:number;adjusted_r2:number;F:number;overall_p:number;df_residual:number;sse:number;predictions:{food_court:number;high_street:number};fitted:number[];residuals:number[]}[]};
export const moduleName=(id:string)=>bank.modules.find(m=>m.id===id)?.title||id;
export const fmt=(v:number|null|undefined,d=2)=>v===null||v===undefined?'—':Number(v).toLocaleString('en-IN',{maximumFractionDigits:d});
