import type {State,Question} from './core';
import {selectedClassId,topicsForClass,classLabel} from './classScope';
import {extractSummaryTopics} from './summaryTopics';
import {questionMatches,detectConcepts} from './concepts';
export type AssessmentSelection={mode:'all'|'sessions';classIds:string[];topicKeys:string[]|null};
export function assessmentScope(state:State){
 const initial=selectedClassId(state),selection:AssessmentSelection=state.assessmentSelection||{mode:initial?'sessions':'all',classIds:initial?[initial]:[],topicKeys:null};
 const classes=state.classSummaries.filter(c=>selection.classIds.includes(c.id));
 const topics=classes.flatMap(c=>extractSummaryTopics(c.text).map(t=>({...t,key:c.id+'::'+t.id,classId:c.id,className:classLabel(c),label:t.originalTitle||t.title,conceptIds:(detectConcepts(t.originalTitle||t.title).length?detectConcepts(t.originalTitle||t.title):t.conceptIds).filter(id=>topicsForClass(state,c.id).includes(id))})));
 const chosen=selection.mode==='all'?[]:selection.topicKeys===null?topics:topics.filter(t=>selection.topicKeys!.includes(t.key));
 const ids=selection.mode==='all'?undefined:[...new Set(chosen.flatMap(t=>t.conceptIds))];
 function matches(q:Question){if(ids===undefined)return true;return chosen.some(t=>{if(!t.conceptIds.some(id=>questionMatches(q,id)))return false;const words=(t.label.toLowerCase().match(/[a-z]{3,}/g)||[]).filter(w=>!['and','the','for','with','from','business','data','python','pandas','sql','regression','introduction','basics','overview','understanding'].includes(w)).map(w=>w.replace(/s$/,''));const text=(q.stem+' '+q.topic).toLowerCase();return !words.length||words.some(w=>text.includes(w));});}
 return {selection,classes,topics,chosen,ids,matches,label:selection.mode==='all'?'All course content':classes.map(classLabel).join(' + ')||'No sessions selected',classIds:selection.mode==='all'?[]:classes.map(c=>c.id)};
}
