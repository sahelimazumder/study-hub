import {extractSummaryTopics} from './summaryTopics';
import {bank} from './data';
import {concepts,concept,detectConcepts,questionMatches,cardMatches,prerequisiteIds} from './concepts';
import {eligible,score,shuffled,scheduleCard,type State,type Question,type Response,type Card} from './core';
import type {ClassSummary,StudySession,Stage,SessionReview} from './learningState';

export const MAX_SUMMARY_LENGTH=50000;
export const stages:Stage[]=['understand','explain','practise','review','remember'];
export function availableQuestions(state:State){return [...bank.questions,...state.imported].filter(eligible)}
export function availableCards(state:State):Card[]{return [...bank.cards,...state.customCards].map(c=>({...c,...state.cardEdits[c.id]}))}
export function matchedQuestions(state:State,ids:string[]){return availableQuestions(state).filter(q=>ids.some(id=>questionMatches(q,id)))}
export function recommendedPrerequisites(state:State,ids:string[]){return prerequisiteIds(ids).filter(id=>{const attempts=state.activities.filter(a=>questionMatches(a.question,id));return attempts.length<3||attempts.filter(a=>a.score===a.question.max_marks).length/attempts.length<.8})}

function rankQuestions(state:State,pool:Question[],seed:string){
 const exposed=new Set(state.activities.map(a=>a.question.id));
 const difficulty:Record<string,number>={easy:0,medium:1,hard:2};
 return shuffled(pool,seed).sort((a,b)=>Number(exposed.has(a.id))-Number(exposed.has(b.id))||difficulty[a.difficulty]-difficulty[b.difficulty]);
}
function balancedQuestions(state:State,ids:string[],count:number,seed:string){
 const ranked=rankQuestions(state,matchedQuestions(state,ids),seed),chosen:Question[]=[],seen=new Set<string>();
 for(const id of ids){const q=ranked.find(q=>!seen.has(q.id)&&questionMatches(q,id));if(q&&chosen.length<count){chosen.push(q);seen.add(q.id)}}
 for(const q of ranked)if(chosen.length<count&&!seen.has(q.id)){chosen.push(q);seen.add(q.id)}
 return chosen.sort((a,b)=>({easy:0,medium:1,hard:2}[a.difficulty as 'easy'|'medium'|'hard']??1)-({easy:0,medium:1,hard:2}[b.difficulty as 'easy'|'medium'|'hard']??1));
}
export function planSession(state:State,session:StudySession,ids:string[],count:number,_includeRetention=false):StudySession{
 if(session.status!=='proposed')throw Error('Create a new session to change topics after starting. Existing attempts stay unchanged.');
 if(!Number.isInteger(count)||count<0||count>10)throw Error('Choose between 0 and 10 questions.');
 const allowed=new Set(detectConcepts(session.summarySnapshot));
 const selected=[...new Set(ids)].filter(id=>allowed.has(id));
 const questions=balancedQuestions(state,selected,count,session.id),retentionQuestionIds:string[]=[];
 const cards=availableCards(state).filter(c=>selected.some(id=>cardMatches(c,id))).sort((a,b)=>(state.schedules[a.id]?.due||0)-(state.schedules[b.id]?.due||0)).slice(0,3);
 return {...session,conceptIds:selected,requestedCount:count,includeRetention:false,questions:structuredClone(questions),retentionQuestionIds,cards:structuredClone(cards),chartKind:selected.map(id=>concept(id)?.chart).find(Boolean)||null,updatedAt:Date.now()};
}
export function proposeSession(state:State,summary:ClassSummary,ids=summary.topicIds??detectConcepts(summary.text),count=5):StudySession{
 if(!summary.text.trim())throw Error('Paste a few notes from class before creating a session.');
 if(summary.text.length>MAX_SUMMARY_LENGTH)throw Error('Please use a summary of 50,000 characters or fewer. Your existing notes are unchanged.');
 const now=Date.now();const session:StudySession={id:crypto.randomUUID(),summaryId:summary.id||null,title:summary.title.trim()||'Class revision',summarySnapshot:summary.text,conceptIds:[],createdAt:now,updatedAt:now,status:'proposed',stage:'understand',requestedCount:count,includeRetention:false,retentionQuestionIds:[],questions:[],cards:[],reviews:[],attempts:[],responses:{},hints:{},conceptIndex:0,questionIndex:0,reviewIndex:0,cardIndex:0,revealedCardIds:[],cardReviews:[],chartKind:null,chartAnswer:'',chartRevealed:false,chartDone:false,teachBack:{},explainIndex:0,scrollY:0};
 return planSession(state,session,ids,count);
}
export function putSession(state:State,session:StudySession):State{return {...state,...(session.summaryId?{studyClassId:session.summaryId}:{}),studySessions:[session,...state.studySessions.filter(s=>s.id!==session.id)],currentSessionId:session.id}}
export function patchSession(state:State,id:string,patch:Partial<StudySession>):State{return {...state,studySessions:state.studySessions.map(s=>s.id===id?{...s,...patch,updatedAt:Date.now()}:s)}}
export function startSession(state:State,id:string):State{
 const session=state.studySessions.find(s=>s.id===id);if(!session)throw Error('Session not found.');
 if(session.status!=='proposed')return state;
 const scoped=planSession(state,session,session.conceptIds,session.requestedCount);
 if(!scoped.conceptIds.length&&!extractSummaryTopics(scoped.summarySnapshot).length)throw Error('No supported topics were found in this class summary. Edit the summary to describe what was taught.');
 return patchSession(putSession(state,scoped),id,{status:'active',stage:'understand',scrollY:0});
}
export function recordSessionAnswer(state:State,id:string,qid:string,phase:'practice'|'retry',now=Date.now()):State{
 const session=state.studySessions.find(s=>s.id===id);if(!session||session.status!=='active')return state;
 const q=phase==='practice'?session.questions.find(q=>q.id===qid):session.reviews.find(r=>r.question?.id===qid)?.question;
 if(!q||session.attempts.some(a=>a.questionId===qid&&a.phase===phase))return state;
 const response=structuredClone(session.responses[qid]??''),marks=score(q,response);if(marks===null)throw Error('This session needs an objectively checked question.');
 const attempt={id:`${id}:${phase}:${qid}`,questionId:qid,response,score:marks,at:now,phase};
 const next=patchSession(state,id,{attempts:[...session.attempts,attempt]});
 return {...next,activities:[...state.activities,{id:attempt.id,classId:session.summaryId,at:now,question:structuredClone(q),response,score:marks,category:'concept',note:`${session.title} · ${phase==='retry'?'fresh retry':'class practice'}`} ]};
}
function freshEnough(a:string,b:string){const tokens=(s:string)=>new Set(s.toLowerCase().match(/\w+/g)||[]);const A=tokens(a),B=tokens(b);return [...A].filter(w=>B.has(w)).length/new Set([...A,...B]).size<.72}
export function buildReviews(state:State,session:StudySession):SessionReview[]{
 const wrong=session.attempts.filter(a=>a.phase==='practice'&&a.score<(session.questions.find(q=>q.id===a.questionId)?.max_marks||0));
 const groups=new Map<string,string[]>();
 for(const a of wrong){const q=session.questions.find(q=>q.id===a.questionId)!;const id=session.conceptIds.find(id=>questionMatches(q,id))||concepts.find(c=>questionMatches(q,c.id))?.id;if(id)groups.set(id,[...(groups.get(id)||[]),q.id])}
 const used=new Set([...session.questions.map(q=>q.id),...state.activities.map(a=>a.question.id),...session.reviews.flatMap(r=>r.question?[r.question.id]:[])]);
 return [...groups].map(([conceptId,missedQuestionIds])=>{const existing=session.reviews.find(r=>r.conceptId===conceptId);if(existing?.question)return {...existing,missedQuestionIds};const originals=session.questions.filter(q=>missedQuestionIds.includes(q.id));const q=rankQuestions(state,matchedQuestions(state,[conceptId]).filter(q=>!used.has(q.id)&&originals.every(old=>freshEnough(old.stem,q.stem))),session.id+conceptId)[0];if(q)used.add(q.id);return {conceptId,missedQuestionIds,question:q?structuredClone(q):null}});
}
export function moveToReview(state:State,id:string):State{const session=state.studySessions.find(s=>s.id===id);if(!session)return state;return patchSession(state,id,{stage:'review',reviews:buildReviews(state,session),reviewIndex:0,scrollY:0})}
export function revealSessionCard(state:State,id:string,cardId:string){const s=state.studySessions.find(s=>s.id===id);if(!s||!s.cards.some(c=>c.id===cardId))return state;return patchSession(state,id,{revealedCardIds:[...new Set([...s.revealedCardIds,cardId])]})}
export function rateSessionCard(state:State,id:string,cardId:string,rating:string,now=Date.now()):State{
 const session=state.studySessions.find(s=>s.id===id);if(!session||session.status!=='active'||!session.cards.some(c=>c.id===cardId)||!session.revealedCardIds.includes(cardId)||session.cardReviews.some(r=>r.cardId===cardId)||!['Again','Hard','Good','Easy'].includes(rating))return state;
 const schedule=scheduleCard(state.schedules[cardId],rating,now);
 const next=patchSession(state,id,{cardReviews:[...session.cardReviews,{cardId,rating,at:now,due:schedule.due}],cardIndex:session.cardIndex+1});
 return {...next,schedules:{...next.schedules,[cardId]:schedule}};
}
export function finishSession(state:State,id:string){return patchSession(state,id,{status:'finished',scrollY:0})}
export function sessionResults(s:StudySession){
 const main=s.attempts.filter(a=>a.phase==='practice'),correct=main.filter(a=>a.score===s.questions.find(q=>q.id===a.questionId)?.max_marks).length;
 const missed=new Set(main.filter(a=>a.score!==s.questions.find(q=>q.id===a.questionId)?.max_marks).flatMap(a=>{const q=s.questions.find(q=>q.id===a.questionId)!;const id=s.conceptIds.find(id=>questionMatches(q,id))||concepts.find(c=>questionMatches(q,c.id))?.id;return id?[id]:[]}));
 const needsReview=[...missed].filter(id=>{const review=s.reviews.find(r=>r.conceptId===id);const retry=s.attempts.find(a=>a.phase==='retry'&&a.questionId===review?.question?.id);return !retry||retry.score!==review?.question?.max_marks});
 return {answered:main.length,correct,retries:s.attempts.filter(a=>a.phase==='retry').length,needsReview:[...new Set(needsReview)],scheduled:s.cardReviews.length};
}
export function sessionHref(id:string){return `#Study?session=${encodeURIComponent(id)}`}
export function parseStudyLocation(hash:string){const [page,query='']=decodeURIComponent(hash.replace(/^#/,'' )).split('?');const params=new URLSearchParams(query);return {page:page||'Today',sessionId:params.get('session')||''}}
