import {useEffect,useRef,useState} from 'react';
import type {StudySession} from './learningState';
import {useStudy} from './store';
import {patchSession} from './studyEngine';
import {teachBackTopics,teachBackLesson,explanationGuidance} from './teachBackContent';
import {startDictation,type SpeechConstructor} from './speechInput';
export {speechError} from './speechInput';

type SpeechWindow=Window&{SpeechRecognition?:SpeechConstructor;webkitSpeechRecognition?:SpeechConstructor};
export default function TeachBack({session,onNext}:{session:StudySession;onNext:()=>void}){
 const {update}=useStudy(),topics=teachBackTopics(session),topic=topics[session.explainIndex];
 const id=topic?.id||'',saved=session.teachBack[id]||{text:'',submittedAt:null,checks:[]};
 const [mic,setMic]=useState<'idle'|'connecting'|'listening'>('idle'),[message,setMessage]=useState(''),[language,setLanguage]=useState('en-IN'),[hint,setHint]=useState(false);
 const dictation=useRef<ReturnType<typeof startDictation>|null>(null);
 const Speech=typeof window==='undefined'?undefined:(window as SpeechWindow).SpeechRecognition||(window as SpeechWindow).webkitSpeechRecognition;
 useEffect(()=>()=>dictation.current?.dispose(),[id]);
 function save(p:Partial<typeof saved>){update(s=>{const current=s.studySessions.find(x=>x.id===session.id);if(!current)return s;return patchSession(s,session.id,{teachBack:{...current.teachBack,[id]:{...current.teachBack[id]||{text:'',submittedAt:null,checks:[]},...p}}})});}
 if(!topic)return <section className="session-activity"><h2>Your explanations are saved</h2><p>You have reached the end of the topics in this class summary.</p><button className="primary" onClick={onNext}>Continue to questions</button></section>;
 const lesson=teachBackLesson(topic,session),guidance=explanationGuidance(topic,saved.text,session),question=saved.quickQuestion||lesson.question;
 function speak(){if(!Speech)return;dictation.current?.dispose();dictation.current=startDictation(Speech,saved.text,language,text=>save({text,submittedAt:null}), (state,text)=>{setMic(state);setMessage(text)});}
 const busy=mic!=='idle';
 return <section className="session-activity teach-back"><span className="eyebrow">EXPLAIN IT BACK · {session.explainIndex+1} OF {topics.length}</span><h2>{topic.title}</h2>
 <p className="teach-prompt">{lesson.prompt}</p><p className="muted">One or two sentences is enough. Use your own words; perfect English is not needed.</p>
 <button className="text-link" onClick={()=>setHint(!hint)} aria-expanded={hint}>{hint?'Hide the help':'I’m not sure — help me start'}</button>
 {hint&&<div className="teach-hint"><strong>A sentence starter</strong><p>{lesson.starter}</p><strong>A simple explanation</strong><p>{lesson.model}</p></div>}
 <label className="field">Your explanation<textarea rows={3} value={saved.text} maxLength={50000} disabled={busy} onChange={e=>save({text:e.target.value,submittedAt:null})} placeholder={lesson.starter}/></label>
 <div className="speech-controls"><p className="small muted">You can also speak. Your browser may send audio to its speech provider. Only the text is saved here.</p>
 {Speech?<><div className="activity-actions"><label className="field">Speech language<select disabled={busy} value={language} onChange={e=>setLanguage(e.target.value)}><option value="en-IN">English (India)</option><option value="hi-IN">Hindi (India)</option></select></label><button className="secondary" onClick={busy?()=>{dictation.current?.stop();setMessage('Finishing your transcript…');}:speak}>{busy?'Stop speaking':'Speak my answer'}</button></div></>:<p className="small">Voice input is unavailable in this browser. Type your answer above, or use your device’s keyboard dictation.</p>}
 <p className={busy?'mic-status active':'mic-status'} role="status" aria-live="polite">{message}</p></div>
 {!saved.submittedAt?<button className="primary" disabled={!saved.text.trim()||busy} onClick={()=>save({submittedAt:Date.now(),quickQuestion:question})}>Help me improve my answer</button>:<div className="session-feedback">
 <h3>Let’s build your explanation</h3><p><strong>You wrote:</strong> {saved.text}</p>
 {guidance.tips.length?<><h4>Ideas to make clearer</h4><ul>{guidance.tips.map(tip=><li key={tip}>{tip}</li>)}</ul></>:<p>You have written enough to compare with the explanation below. Check that your example follows the same reasoning.</p>}
 <h4>A simple explanation of {topic.title}</h4><p>{lesson.model}</p>
 <p className="small muted">These writing suggestions use word cues, so different wording may be missed. Your paragraph is saved without an automatic correctness mark.</p>
 <button className="secondary" onClick={()=>save({submittedAt:null})}>Improve my answer</button>
 {question&&<fieldset className="teach-quick-check"><legend>Try one small check</legend><p>{question.stem}</p>{question.choices?.map(choice=><label className="check-label" key={choice.id}><input type="radio" name={id+'-quick'} checked={saved.quickChoice===choice.id} onChange={()=>save({quickQuestion:question,quickChoice:choice.id,quickChecked:false})}/>{choice.text}</label>)}<button className="secondary" disabled={!saved.quickChoice} onClick={()=>save({quickQuestion:question,quickChecked:true})}>Check this answer</button>
 {saved.quickChecked&&<div role="status"><h4>{question.answer.choice_ids?.includes(saved.quickChoice||'')?'Yes — that’s the key idea.':'Let’s look at the difference.'}</h4><p>{question.option_explanations?.[saved.quickChoice||'']}</p><p>{question.solution}</p><p className="small muted">This quick check is separate from your test marks. You can try again.</p></div>}</fieldset>}
 <div className="activity-actions"><button className="primary" onClick={onNext}>{session.explainIndex+1<topics.length?'Next topic':'Continue to practice'}</button></div></div>}
 <details><summary>Read this topic in my class notes</summary><p className="preserve-text">{topic.sourceText||topic.lines.join('\n')}</p></details>
 </section>;
}
