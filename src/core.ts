import { z } from 'zod';
import { get, set } from 'idb-keyval';
import {learningStateShape,type ClassSummary,type StudySession,type SavedSheet,type ChartAnswer} from './learningState';
export type Option={id:string;text:string};
export type Criterion={criterion:string;max_marks:number};
export type Reference={source_id:string;locator:string;relationship?:string};
export type Question={id:string;version:number;module:string;scope:string;topic:string;type:'mcq'|'msq'|'numerical'|'short';difficulty:string;max_marks:number;stem:string;choices?:Option[];answer:{choice_ids?:string[];value?:number;unit?:string;absolute_tolerance?:number;relative_tolerance?:number;model?:string};solution:string;option_explanations?:Record<string,string>;source_references:Reference[];misconceptions:string[];status:string;provenance_category:string;rubric?:Criterion[];[key:string]:unknown};
export type Case={difficulty?:string;id:string;version:number;rubric_version:number;title:string;module:string;context:string;max_marks:number;source_references:Reference[];subquestions:{id:string;prompt:string;max_marks:number;rubric:Criterion[];model_answer:string;common_errors:string;acceptable_alternatives:string}[]};
export type Response=string|string[];
export type Policy={msq:'exact'|'partial';negative:number};
export const DEFAULT_POLICY:Policy={msq:'exact',negative:0};
export const questionSchema=z.object({id:z.string().min(1),version:z.number().int().positive(),module:z.string(),scope:z.string(),misconceptions:z.array(z.string()).min(1),topic:z.string(),type:z.enum(['mcq','msq','numerical','short']),difficulty:z.enum(['easy','medium','hard']),max_marks:z.number().positive(),stem:z.string().min(10),status:z.enum(['validated','draft','quarantined']),provenance_category:z.string(),choices:z.array(z.object({id:z.string(),text:z.string()})).optional(),answer:z.object({choice_ids:z.array(z.string()).optional(),value:z.number().finite().optional(),unit:z.string().optional(),absolute_tolerance:z.number().nonnegative().optional(),relative_tolerance:z.number().nonnegative().optional(),model:z.string().optional()}),source_references:z.array(z.object({source_id:z.string(),locator:z.string(),relationship:z.string().optional()}).passthrough()).min(1),solution:z.string().min(5),option_explanations:z.record(z.string(),z.string()).optional(),rubric:z.array(z.object({criterion:z.string(),max_marks:z.number().positive()})).optional()}).passthrough().superRefine((q,ctx)=>{
  if(q.type==='mcq'||q.type==='msq'){
    const ids=q.choices?.map(c=>c.id)||[],answers=q.answer.choice_ids||[];
    if(ids.length<2||new Set(ids).size!==ids.length||new Set(q.choices?.map(c=>c.text.trim())).size!==ids.length)ctx.addIssue({code:'custom',message:'Unique option IDs and texts required'});
    if(!answers.length||(q.type==='mcq'&&answers.length!==1)||new Set(answers).size!==answers.length||answers.some(x=>!ids.includes(x)))ctx.addIssue({code:'custom',message:'Invalid answer cardinality or option ID'});
    if(ids.some(id=>!q.option_explanations?.[id]))ctx.addIssue({code:'custom',message:'Every option needs an explanation'});
  }
  if(q.type==='short'&&(!q.answer.model||!q.rubric?.length||q.rubric.reduce((n,r)=>n+r.max_marks,0)!==q.max_marks))ctx.addIssue({code:'custom',message:'Short answer requires a model and a rubric summing to its marks'});
  if(q.type==='numerical'&&(q.answer.value===undefined||!q.answer.unit||q.answer.absolute_tolerance===undefined))ctx.addIssue({code:'custom',message:'Numerical value, units and tolerance required'});
});
export function validateQuestion(q:unknown,sourceIDs:string[]){const r=questionSchema.parse(q);if(r.source_references.some(s=>!sourceIDs.includes(s.source_id)))throw Error('Unresolved source reference');return r as Question}
export function eligible(q:Question){return q.status==='validated'&&q.type!=='short'}
export function score(q:Question,response:Response|undefined,policy:Policy=DEFAULT_POLICY):number|null {
  if(q.status!=='validated')throw Error('Unvalidated question cannot be scored');
  if(response===undefined||response===''||(Array.isArray(response)&&response.length===0))return 0;
  if(q.type==='short')return null;
  let correct=false;
  if(q.type==='numerical'){
    const v=typeof response==='string'&&response.trim()!==''?Number(response):NaN,expected=q.answer.value!;
    correct=Number.isFinite(v)&&Math.abs(v-expected)<=Math.max(q.answer.absolute_tolerance||0,Math.abs(expected)*(q.answer.relative_tolerance||0))+Number.EPSILON*10;
  }else{
    const selected=new Set(Array.isArray(response)?response:[]),key=new Set(q.answer.choice_ids||[]);
    correct=selected.size===key.size&&[...key].every(k=>selected.has(k));
    if(q.type==='msq'&&policy.msq==='partial'&&!correct){const all=new Set(q.choices?.map(o=>o.id));if([...selected].some(id=>!all.has(id)))return -policy.negative;const right=[...selected].filter(k=>key.has(k)).length,wrong=[...selected].filter(k=>!key.has(k)).length;return Math.max(-policy.negative,q.max_marks*(right/key.size-wrong/Math.max(1,all.size-key.size)));}
  }
  return correct?q.max_marks:policy.negative?-policy.negative:0;
}
export function shuffled<T extends {id:string}>(items:T[],seed:string){const out=[...items];let value=hash(seed)||1;for(let i=out.length-1;i>0;i--){value^=value<<13;value^=value>>>17;value^=value<<5;const j=(value>>>0)%(i+1);[out[i],out[j]]=[out[j],out[i]]}return out}
function hash(s:string){let n=2166136261;for(const c of s){n^=c.charCodeAt(0);n=Math.imul(n,16777619)}return n>>>0}
export type Award={marks:number;rationale:string};
export type Exam={classId?:string|null;classTitle?:string;topicIds?:string[];currentIndex?:number;id:string;title:string;startedAt:number;deadline:number;status:'active'|'submitted';submittedAt?:number;reason?:string;questions:Question[];cases:Case[];responses:Record<string,Response>;flags:string[];policy:Policy;review:Record<string,Award>;reviewHistory:{at:number;method:string;awards:Record<string,Award>}[]};
export function createExam(pool:Question[],casePool:Case[],mcqCount:number,msqCount:number,caseCount:number,minutes:number,seen:string[]=[],policy=DEFAULT_POLICY,numericalCount=0):Exam{
  if(!Number.isInteger(mcqCount)||!Number.isInteger(msqCount)||mcqCount<0||msqCount<0||!Number.isInteger(numericalCount)||numericalCount<0||mcqCount+msqCount+numericalCount<1||!Number.isFinite(minutes)||minutes<1||minutes>240||!Number.isInteger(caseCount)||caseCount<0||caseCount>casePool.length)throw Error('Invalid exam configuration');
  const id=crypto.randomUUID();
  function select(type:string,n:number){
    const available=shuffled(pool.filter(q=>eligible(q)&&q.type===type),id+type);
    if(available.length<n)throw Error(`Need ${n} ${type.toUpperCase()} items; only ${available.length} eligible. Reduce count or widen scope.`);
    const chosen:Question[]=[];
    for(const exposed of [false,true]){
      const buckets=new Map<string,Question[]>();
      for(const q of available.filter(q=>seen.includes(q.id)===exposed))buckets.set(q.module,[...(buckets.get(q.module)||[]),q]);
      while(chosen.length<n&&[...buckets.values()].some(b=>b.length))for(const b of buckets.values()){if(b.length&&chosen.length<n)chosen.push(b.shift()!)}
    }
    return chosen;
  }
  const now=Date.now();return {id,title:mcqCount===20&&msqCount===10&&caseCount===2&&numericalCount===0?'90-minute practice blueprint':'Custom mixed test',startedAt:now,deadline:now+minutes*60000,status:'active',questions:structuredClone(shuffled([...select('mcq',mcqCount),...select('msq',msqCount),...select('numerical',numericalCount)],id)),cases:structuredClone(shuffled(casePool,id).sort((a,b)=>Number(seen.includes(a.id))-Number(seen.includes(b.id))).slice(0,caseCount)),responses:{},flags:[],policy,review:{},reviewHistory:[]};
}
export function submitExam(exam:Exam,reason='manual',now=Date.now()):Exam{if(exam.status==='submitted')return exam;return {...exam,status:'submitted',submittedAt:now,reason:now>=exam.deadline?'expired':reason}}
export function expired(exam:Exam,now=Date.now()){return exam.status==='active'&&now>=exam.deadline}
export function reviewKey(caseId:string,subId:string,i:number){return `${caseId}:${subId}:${i}`}
export function grade(exam:Exam){
 const objective=exam.questions.reduce((n,q)=>n+(score(q,exam.responses[q.id],exam.policy)||0),0),objectiveMax=exam.questions.reduce((n,q)=>n+q.max_marks,0);
 let subjective=0,pending=false;
 for(const c of exam.cases)for(const sub of c.subquestions)sub.rubric.forEach((r,i)=>{const a=exam.review[reviewKey(c.id,sub.id,i)];if(!a||!a.rationale.trim()||a.marks<0||a.marks>r.max_marks)pending=true;else subjective+=a.marks});
 const subjectiveMax=exam.cases.reduce((n,c)=>n+c.max_marks,0);return {objective,objectiveMax,subjective:pending?null:subjective,subjectiveMax,total:pending?null:objective+subjective,max:objectiveMax+subjectiveMax};
}
export function saveReview(exam:Exam,awards:Record<string,Award>):Exam{
 for(const c of exam.cases)for(const sub of c.subquestions)sub.rubric.forEach((r,i)=>{const a=awards[reviewKey(c.id,sub.id,i)];if(!a||!Number.isFinite(a.marks)||a.marks<0||a.marks>r.max_marks||!a.rationale.trim())throw Error('Every criterion needs a bounded mark and evidence/rationale, including zero awards.')});
 return {...exam,review:structuredClone(awards),reviewHistory:[...exam.reviewHistory,{at:Date.now(),method:'rubric-guided self-assessment',awards:structuredClone(awards)}]};
}
export type Card={id:string;module:string;front:string;back:string;source:string;kind:string};
export type Schedule={due:number;interval:number;ease:number;reviews:number;lastRating:string};
export function scheduleCard(old:Schedule|undefined,rating:string,now=Date.now()):Schedule{
 const ease=Math.min(3,Math.max(1.3,(old?.ease||2.5)+({Again:-.2,Hard:-.15,Good:0,Easy:.15}[rating]||0)));
 const base=old?.interval||0,interval=rating==='Again'?10/1440:rating==='Hard'?Math.max(1,base*1.2):rating==='Easy'?Math.max(4,base*ease*1.3):Math.max(1,base?base*ease:1);
 return {due:now+interval*86400000,interval,ease,reviews:(old?.reviews||0)+1,lastRating:rating};
}
export type Activity={classId?:string|null;id:string;at:number;question:Question;response:Response;score:number|null;category:string;note:string;manual?:boolean};
export type Material={id:string;name:string;sha256:string;status:string;chunks:{locator:string;text:string;rows?:string[][]}[];at:number;error?:string};
export type State={version:1;studyClassId?:string|null;chartRuns?:{id:string;lessonId:string;at:number;classId:string|null;answer:ChartAnswer}[];savedSheets:SavedSheet[];guidedCharts:Record<string,ChartAnswer>;classSummaries:ClassSummary[];studySessions:StudySession[];currentSessionId:string|null;activities:Activity[];exams:Exam[];bookmarks:string[];notes:Record<string,string>;schedules:Record<string,Schedule>;customCards:Card[];cardEdits:Record<string,Partial<Card>>;lessonDone:string[];materials:Material[];imported:Question[];chartAttempts:{id:string;at:number;answer:string}[];settings:{theme:string;timezone:string;displayName?:string;institution?:string};};
export const freshState=():State=>({version:1,savedSheets:[],guidedCharts:{},classSummaries:[],studySessions:[],currentSessionId:null,activities:[],exams:[],bookmarks:[],notes:{},schedules:{},customCards:[],cardEdits:{},lessonDone:[],materials:[],imported:[],chartAttempts:[],settings:{theme:'light',timezone:'Asia/Kolkata',displayName:import.meta.env.VITE_PUBLIC_BUILD==='true'?'Learner':'Saheli',institution:''}});
export function finalizeExam(state:State,id:string,reason='manual',now=Date.now()):State{
 const old=state.exams.find(e=>e.id===id);if(!old||old.status==='submitted')return state;
 const exam=submitExam(old,reason,now);
 const events=exam.questions.map(q=>({classId:exam.classId,id:`${exam.id}:${q.id}`,at:now,question:structuredClone(q),response:structuredClone(exam.responses[q.id]??''),score:score(q,exam.responses[q.id],exam.policy),category:q.type==='numerical'?'calculation':'interpretation',note:`Mock attempt ${exam.id.slice(0,8)}; scoring policy ${exam.policy.msq}, negative penalty ${exam.policy.negative}.`}));
 return {...state,exams:state.exams.map(e=>e.id===id?exam:e),activities:[...state.activities,...events.filter(e=>!state.activities.some(a=>a.id===e.id))]};
}
export function recoverExpired(state:State,now=Date.now()):State{let next=state;for(const e of state.exams)if(expired(e,now))next=finalizeExam(next,e.id,'expired',now);return next}
const KEY='ranchi-study-hub-v1';
let pendingWrite=Promise.resolve();
export async function loadState(){const data=await get(KEY);return data?parseBackup(data):freshState()}
export function persist(s:State){pendingWrite=pendingWrite.catch(()=>{}).then(()=>set(KEY,s));return pendingWrite}
const responseSchema=z.union([z.string(),z.array(z.string())]);
const awardSchema=z.object({marks:z.number().finite().nonnegative(),rationale:z.string()});
const backupSchema=z.object({...learningStateShape(questionSchema,responseSchema),version:z.literal(1),activities:z.array(z.object({id:z.string(),at:z.number(),question:questionSchema,response:responseSchema,score:z.number().nullable(),category:z.string(),note:z.string()}).passthrough()),exams:z.array(z.object({currentIndex:z.number().int().nonnegative().optional(),id:z.string(),title:z.string(),startedAt:z.number(),deadline:z.number(),status:z.enum(['active','submitted']),questions:z.array(questionSchema),cases:z.array(z.object({id:z.string(),version:z.number(),title:z.string(),context:z.string(),max_marks:z.number(),subquestions:z.array(z.object({id:z.string(),prompt:z.string(),max_marks:z.number(),rubric:z.array(z.object({criterion:z.string(),max_marks:z.number()})),model_answer:z.string()}).passthrough())}).passthrough()),responses:z.record(z.string(),responseSchema),flags:z.array(z.string()),policy:z.object({msq:z.enum(['exact','partial']),negative:z.number().nonnegative()}),review:z.record(z.string(),awardSchema),reviewHistory:z.array(z.object({at:z.number(),method:z.string(),awards:z.record(z.string(),awardSchema)}))}).passthrough()),bookmarks:z.array(z.string()),notes:z.record(z.string(),z.string()),schedules:z.record(z.string(),z.object({due:z.number().finite(),interval:z.number().nonnegative(),ease:z.number().positive(),reviews:z.number().int().nonnegative(),lastRating:z.string()})),customCards:z.array(z.object({id:z.string(),module:z.string(),front:z.string(),back:z.string(),source:z.string(),kind:z.string()})),cardEdits:z.record(z.string(),z.object({front:z.string().optional(),back:z.string().optional()})),lessonDone:z.array(z.string()),materials:z.array(z.object({id:z.string(),name:z.string(),sha256:z.string(),status:z.string(),chunks:z.array(z.object({locator:z.string(),text:z.string(),rows:z.array(z.array(z.string())).optional()})),at:z.number(),error:z.string().optional()})),imported:z.array(questionSchema),chartAttempts:z.array(z.object({id:z.string(),at:z.number(),answer:z.string()})),settings:z.object({theme:z.enum(['light','dark']),timezone:z.string(),displayName:z.string().max(80).default(import.meta.env.VITE_PUBLIC_BUILD==='true'?'Learner':'Saheli'),institution:z.string().max(120).default('')})});
export function parseBackup(data:unknown):State{
 const parsed=backupSchema.parse(data) as unknown as State;
 try{new Intl.DateTimeFormat('en',{timeZone:parsed.settings.timezone})}catch{throw Error('Invalid backup time zone')}
 for(const e of parsed.exams){if(e.currentIndex!==undefined&&e.currentIndex>=e.questions.length+e.cases.length)throw Error('Invalid saved test position');if(e.deadline<e.startedAt)throw Error('Invalid exam deadline');for(const c of e.cases){if(c.subquestions.reduce((n,s)=>n+s.max_marks,0)!==c.max_marks||c.subquestions.some(s=>s.rubric.reduce((n,r)=>n+r.max_marks,0)!==s.max_marks))throw Error('Invalid rubric totals');}}
 for(const list of [parsed.activities,parsed.exams,parsed.customCards,parsed.materials,parsed.imported,parsed.classSummaries,parsed.studySessions,parsed.savedSheets])if(new Set(list.map(x=>x.id)).size!==list.length)throw Error('Duplicate IDs in backup');
 for(const session of parsed.studySessions){
  const questions=[...session.questions,...session.reviews.flatMap(r=>r.question?[r.question]:[])];
  if(new Set(questions.map(q=>q.id)).size!==questions.length||questions.some(q=>!eligible(q)))throw Error('Invalid study-session question snapshots');
  if(session.questionIndex>session.questions.length||session.reviewIndex>session.reviews.length||session.cardIndex>session.cards.length)throw Error('Invalid study-session position');
  if(new Set(session.attempts.map(a=>a.id)).size!==session.attempts.length||session.attempts.some(a=>!questions.some(q=>q.id===a.questionId)))throw Error('Invalid session attempt history');
 }
 if(parsed.currentSessionId&&!parsed.studySessions.some(s=>s.id===parsed.currentSessionId))throw Error('Current study session is missing');
 return parsed;
}
export function mergeBackup(current:State,incoming:State):State{
 function merge<T extends {id:string}>(a:T[],b:T[]){const map=new Map(b.map(x=>[x.id,x]));a.forEach(x=>map.set(x.id,x));return [...map.values()]}
 return {...current,studyClassId:current.studyClassId===undefined?incoming.studyClassId:current.studyClassId,chartRuns:merge(current.chartRuns||[],incoming.chartRuns||[]),savedSheets:merge(current.savedSheets,incoming.savedSheets),guidedCharts:{...incoming.guidedCharts,...current.guidedCharts},classSummaries:merge(current.classSummaries,incoming.classSummaries),studySessions:merge(current.studySessions,incoming.studySessions),currentSessionId:current.currentSessionId||incoming.currentSessionId,activities:merge(current.activities,incoming.activities),exams:merge(current.exams,incoming.exams),bookmarks:[...new Set([...current.bookmarks,...incoming.bookmarks])],notes:{...incoming.notes,...current.notes},schedules:{...incoming.schedules,...current.schedules},customCards:merge(current.customCards,incoming.customCards),cardEdits:{...incoming.cardEdits,...current.cardEdits},lessonDone:[...new Set([...current.lessonDone,...incoming.lessonDone])],materials:merge(current.materials,incoming.materials),imported:merge(current.imported,incoming.imported),chartAttempts:merge(current.chartAttempts,incoming.chartAttempts)};
}
export function generateVariant(family:string,parameter:number):Question{
 if(!Number.isInteger(parameter)||parameter<1||parameter>10)throw Error('Parameter must be an integer from 1 to 10');
 const probability=family==='poisson',rate=parameter,lambda=rate/2,value=probability?Math.exp(-lambda):rate*1.5;
 return {id:`GEN-${family}-${parameter}`,version:1,module:probability?'probability':'cases',scope:probability?'Statistics practice':'Database & business practice',topic:probability?'Poisson interval conversion':'Retention and units',type:'numerical',difficulty:'medium',max_marks:4,stem:probability?`A support queue follows a constant-rate Poisson process averaging ${rate} calls/hour. Find P(no calls in 30 minutes). Enter a decimal probability to four decimals.`:`A fictional brand has ${rate*2} million unique users. Under an explicitly assumed 75% migration rate, how many million unique users are retained? Enter millions.`,answer:{value,unit:probability?'probability':'million users',absolute_tolerance:.0001,relative_tolerance:0},solution:probability?`λ=${rate}×0.5=${lambda}; P(X=0)=e^−${lambda}=${value.toFixed(6)}.`:`${rate*2}×0.75=${value} million unique users retained.`,source_references:[{source_id:probability?'S08':'S01',locator:probability?'Q3–4; rate and time interval':'pages 6–7; explicit migration assumptions'}],misconceptions:[probability?'rate_time_units':'retention_vs_loss'],status:'validated',provenance_category:'authored_aligned_practice',generation_mode:'deterministic_template',validation:{schema_valid:true,deterministically_checked:true,editorially_reviewed:false,human_reviewed:false},parameter_domain:'integer 1..10; λ=rate×0.5; deterministic exponential or multiplication solver'};
}
export function download(name:string,data:string,type='application/json'){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000)}
export function readableError(error:unknown){if(error instanceof z.ZodError)return error.issues.slice(0,3).map(i=>`${i.path.join('.')||'Data'}: ${i.message}`).join('; ')+(error.issues.length>3?'; check the remaining required fields.':'');return error instanceof Error?error.message:String(error)}
export function dateKey(at:number,timezone='Asia/Kolkata'){return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(at)}
