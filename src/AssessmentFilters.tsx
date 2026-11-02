import {useStudy} from './store';
import MultiFilter from './MultiFilter';
import {encodeFilter,filterValues} from './filterSelection';
import {assessmentScope,type AssessmentSelection} from './assessmentScope';
import {classLabel} from './classScope';
export default function AssessmentFilters(){
 const {state,update}=useStudy(),scope=assessmentScope(state),selection=scope.selection;
 function patch(p:Partial<AssessmentSelection>){update(s=>({...s,assessmentSelection:{...assessmentScope(s).selection,...p}}));}
 return <section className="assessment-filters panel" aria-label="Choose sessions and topics"><h2>Choose sessions and topics</h2><p>Open a dropdown, tick several choices, then close it. Practice and Create a Test keep the same selection.</p><div className="form-grid"><MultiFilter label="Sessions / module numbers" value={selection.mode==='all'?'':encodeFilter(selection.classIds)} allLabel="All course content" options={state.classSummaries.map(c=>({value:c.id,label:classLabel(c)}))} onChange={e=>patch({mode:e.target.value===''?'all':'sessions',classIds:filterValues(e.target.value),topicKeys:null})}/>
 {selection.mode==='sessions'&&<MultiFilter label="Topics from selected summaries" value={selection.topicKeys===null?'':encodeFilter(selection.topicKeys)} allLabel="All topics in selected sessions" options={scope.topics.map(t=>({value:t.key,label:t.label+(t.conceptIds.length?'':' — no verified practice yet'),group:t.className}))} onChange={e=>patch({topicKeys:e.target.value===''?null:filterValues(e.target.value)})}/>}</div>{!state.classSummaries.length&&<p>Save session summaries on Home to select them here.</p>}{selection.mode==='sessions'&&!scope.chosen.length&&<p role="status">No session topics selected. Open the dropdowns to choose sessions and topics.</p>}</section>;
}
