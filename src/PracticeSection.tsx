import MultiFilter from './MultiFilter';
import {filterMatches,filterMatchesAny,filterValues,encodeFilter} from './filterSelection';
import {bank} from './data';
import {useState} from 'react';
import Practice from './Practice';
import Cases from './Cases';
import {useStudy} from './store';
import AssessmentFilters from './AssessmentFilters';
import {assessmentScope} from './assessmentScope';
export default function PracticeSection(){const {state}=useStudy();const [kind,setKind]=useState('mcq'),[difficulty,setDifficulty]=useState('');const scope=assessmentScope(state),ids=scope.ids,kinds=kind===''?['mcq','msq','numerical','subjective']:filterValues(kind),objectiveKinds=kinds.filter(k=>k!=='subjective');return <><h1>Practice</h1><AssessmentFilters/><MultiFilter label="Question types" value={kind} onChange={e=>setKind(e.target.value)} allLabel="All question types" options={[{value:'mcq',label:'MCQs — one answer'},{value:'msq',label:'MSQs — all correct answers'},{value:'numerical',label:'Numerical answers'},{value:'subjective',label:'Written cases'}]}/><MultiFilter label="Practice difficulty" value={difficulty} onChange={e=>setDifficulty(e.target.value)}><option value="">All difficulties</option>{['easy','medium','hard'].map(d=><option key={d}>{d}</option>)}</MultiFilter>{ids&&ids.length===0&&<p className="notice">No verified practice matches these selected topics. Unrelated course questions will not be substituted.</p>}<p className="notice">Objective answers are checked automatically. Written case practice is ungraded; timed tests use a criterion-by-criterion self-assessment.</p>{kinds.includes('subjective')&&<Cases key={JSON.stringify(state.assessmentSelection)} conceptIds={ids} allScope={ids===undefined} difficulty={difficulty}/>}
{objectiveKinds.length>0&&<Practice key={[kind,JSON.stringify(state.assessmentSelection),difficulty].join('|')} initialLevel={difficulty} initialType={encodeFilter(objectiveKinds)} classIds={scope.classIds} questionIds={ids===undefined?undefined:[...bank.questions,...state.imported].filter(scope.matches).map(q=>q.id)} conceptIds={ids}/>}
{!kinds.length&&<p role="status">Choose at least one question type.</p>}</>}
