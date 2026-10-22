import {extractSummaryTopics} from './summaryTopics';
import {detectConcepts,currentClassText} from './concepts';
export function analyseSummary(text:string,selected:string[]){
 const clauses=currentClassText(text).split(/\n|(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean),supporting=new Set<string>(),core=new Set<string>();
 for(const clause of clauses){const ids=detectConcepts(clause);for(const id of ids)(/\b(example|e\.g\.|for instance|illustrat)/i.test(clause)?supporting:core).add(id)}
 const optional=clauses.filter(c=>/\b(next (?:week|class)|extension|optional|later|will study)\b/i.test(c));
 const unmatched=extractSummaryTopics(text).filter(t=>!t.conceptIds.length).map(t=>t.title);
 return {core:selected.filter(id=>core.has(id)||!supporting.has(id)),supporting:selected.filter(id=>supporting.has(id)&&!core.has(id)),optional,unmatched};
}
