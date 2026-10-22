import {extractSummaryTopics} from './summaryTopics';
import type {State,Case} from './core';
import {concept,detectConcepts,referencesFor} from './concepts';
import type {ClassSummary} from './learningState';
export function selectedClassId(state:State):string|null{
 if(state.studyClassId!==undefined)return state.studyClassId;
 const current=state.studySessions.find(s=>s.id===state.currentSessionId)?.summaryId;
 return current||[...state.classSummaries].sort((a,b)=>b.updatedAt-a.updatedAt)[0]?.id||null;
}
export function selectedClass(state:State){return state.classSummaries.find(c=>c.id===selectedClassId(state))}
export function classLabel(c:ClassSummary){const number=c.title.match(/(?:session|chapter|class)\s*[:#-]?\s*(\d+)/i);return [c.chapter|| (number?`Session ${number[1]}`:''),c.title||'Untitled class'].filter(Boolean).join(' · ')}
export function topicsForClass(state:State,id:string){
 const item=state.classSummaries.find(c=>c.id===id);if(!item)return [];
 const detected=detectConcepts(item.text);
 return item.topicIds===undefined?detected:detected.filter(id=>item.topicIds!.includes(id));
}
export function scopeTopics(state:State):string[]|undefined{const id=selectedClassId(state);return id===null?undefined:topicsForClass(state,id)}
export function caseMatchesTopics(c:Case,ids:string[]|undefined){if(!ids)return true;const covered=detectConcepts([c.title,c.context,...c.subquestions.map(s=>s.prompt)].join('\n')).filter(id=>concept(id)?.module===c.module);return covered.length>0&&covered.every(id=>ids.includes(id))}
export function scopedSheetRows(state:State,request=''){
 const ids=scopeTopics(state);if(ids===undefined)return [];
 const requested=detectConcepts(request),selected=requested.length?ids.filter(id=>requested.includes(id)):ids;
 return referencesFor(selected).map(r=>({item:r.term,kind:r.type,when:r.when,syntax:r.formula,example:r.input,result:r.output,mistake:r.error}));
}
export function chartIdsForTopics(ids:string[]|undefined){if(ids===undefined||ids.includes('charts'))return ['monthly','category','advertising','spending','profit'];return [...new Set(ids.flatMap(id=>id==='trends'?['monthly']:['regression','model-fit','interaction'].includes(id)?['advertising']:['centre','spread'].includes(id)?['spending']:id==='dashboard'?['category','profit']:[]))]}

export function scopedActivities(state:State){const id=selectedClassId(state);if(id===null)return state.activities;const linked=new Set(state.studySessions.filter(s=>s.summaryId===id).flatMap(s=>s.attempts.map(a=>a.id)));return state.activities.filter(a=>a.classId===id||linked.has(a.id))}
export function inferClass(text:string){const match=text.match(/(?:faculty\s+)?(?:session|chapter|class)\s*[:#-]?\s*(\d+)\b/i);if(!match)return null;const title=text.split('\n').find(line=>line.includes(match[0]))?.replace(/^#+\s*/,'').trim().slice(0,160);return {number:match[1],chapter:`Session ${match[1]}`,title:title||`Session ${match[1]}`}}

export function classTopicOptions(state:State){const item=selectedClass(state);return item?extractSummaryTopics(item.text):[]}
export function chartStorageKey(state:State,id:string){const classId=selectedClassId(state);return classId?`class:${classId}:${id}`:id}
