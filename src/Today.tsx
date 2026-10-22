import {useState} from 'react';
import {inferClass,classLabel} from './classScope';
import {ArrowRight,Plus} from 'lucide-react';
import {useStudy} from './store';
import {readableError} from './core';
import type {ClassSummary} from './learningState';
import {MAX_SUMMARY_LENGTH,proposeSession,putSession} from './studyEngine';

export default function Today(){
 const {state,update,go,focusModule}=useStudy();
 // Home is a new composer. Only an explicit reopen action may load saved text.
 const requested=state.classSummaries.find(s=>s.id===focusModule);
 const [selected,setSelected]=useState(()=>requested?.id||crypto.randomUUID());
 const [reopened,setReopened]=useState(Boolean(requested));
 const [lastId]=useState(()=>[...state.classSummaries].filter(s=>s.text.trim()).sort((a,b)=>b.updatedAt-a.updatedAt)[0]?.id||null);
 const last=state.classSummaries.find(s=>s.id===lastId);
 const [error,setError]=useState('');
 const summary:ClassSummary=state.classSummaries.find(s=>s.id===selected)||{id:selected,title:'',date:'',chapter:'',text:'',updatedAt:Date.now()};
 const saved=state.classSummaries.some(s=>s.id===selected);
 function blank(){setSelected(crypto.randomUUID());setReopened(false);setError('')}
 function reopen(id:string){setSelected(id);setReopened(true);setError('');update(s=>({...s,studyClassId:id}))}
 function change(patch:Partial<ClassSummary>){
  if(patch.text&&patch.text.length>MAX_SUMMARY_LENGTH){setError('That text is longer than 50,000 characters. Please paste a shorter class summary; your saved notes have not changed.');return}
  const inferred=patch.text?inferClass(patch.text):null,previous=inferClass(summary.chapter+' '+summary.title);
  const different=inferred&&previous&&inferred.number!==previous.number;
  const base=different?{...summary,id:crypto.randomUUID(),title:inferred!.title,date:'',chapter:inferred!.chapter}:summary;
  if(different)setSelected(base.id);
  const next={...base,...(inferred&&!base.title?{title:inferred.title}:{}),...(inferred&&!base.chapter?{chapter:inferred.chapter}:{}),...patch,...(patch.text!==undefined?{topicIds:undefined}:{}),updatedAt:Date.now()};
  update(s=>({...s,studyClassId:next.id,classSummaries:[next,...s.classSummaries.filter(n=>n.id!==next.id)]}));setError('');
 }
 async function upload(file:File){try{if(!/\.(md|markdown|txt)$/i.test(file.name))throw Error('Choose a Markdown (.md) or text (.txt) file.');if(file.size>200000)throw Error('Use a file smaller than 200 KB and 50,000 characters.');const text=await file.text();if(text.length>MAX_SUMMARY_LENGTH)throw Error('Use 50,000 characters or fewer. Your earlier notes are unchanged.');change({text,...(!summary.title?{title:file.name.replace(/\.[^.]+$/,'').slice(0,160)}:{})})}catch(e){setError(readableError(e))}}
 function create(){try{const session=proposeSession(state,summary);update(s=>putSession(s,session));go('Study',session.id)}catch(e){setError(readableError(e))}}
 return <div className="today-page">
  <div className="today-intro"><span className="eyebrow">START WITH YOUR CLASS</span><h1>{reopened?'Revisit your class summary':'Start a new class'}</h1><p>{reopened?'Read or edit the saved notes you opened, or choose Start a new blank summary.':last?'Paste or upload your new class summary. To revisit a saved class, choose Open last class summary below.':'Paste or upload your new class summary, then choose Start learning from this class.'}</p></div>
  <section className="summary-composer" aria-label="Class summary">
   {reopened&&<div className="notice"><strong>Editing saved summary: {classLabel(summary)}</strong><p>Your saved notes are open because you chose to reopen them.</p><button className="secondary" onClick={blank}><Plus size={16}/>Start a new blank summary</button></div>}
   <label className="field summary-label">Paste your class summary or notes.<textarea value={summary.text} onChange={e=>change({text:e.target.value})} rows={7} placeholder="Paste the summary of this class here, or upload a Markdown/text file." aria-describedby="summary-help"/></label>
   <label className="upload-button secondary">Upload Markdown or text<input type="file" accept=".md,.markdown,.txt,text/plain,text/markdown" onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f);e.target.value=''}}/></label><div className="summary-undertext"><span id="summary-help">{saved?'Saved on this browser as you type.':'Your notes stay on this browser.'}</span><span>{summary.text.length.toLocaleString('en-IN')} / 50,000</span></div>
   <details className="summary-metadata"><summary>Add a title, date or chapter <span>Optional</span></summary><div className="form-grid"><label className="field">Class title<input value={summary.title} maxLength={160} onChange={e=>change({title:e.target.value})} placeholder="e.g. Database foundations"/></label><label className="field">Class date<input type="date" value={summary.date} onChange={e=>change({date:e.target.value})}/></label><label className="field">Chapter<input value={summary.chapter||''} maxLength={160} onChange={e=>change({chapter:e.target.value})} placeholder="e.g. Chapter 6 — Databases"/></label></div></details>
   {error&&<p className="error" role="alert">{error}</p>}
   <button className="primary create-session" disabled={!summary.text.trim()} onClick={create}>Start learning from this class<ArrowRight size={18}/></button>
   <p className="summary-privacy">Matches your notes to existing content locally. You can correct the topics before you begin.</p>
  </section>
  {last&&<section className="today-section last-class-card" aria-label="Last saved class summary"><span className="eyebrow">LAST SAVED CLASS</span><h2>{classLabel(last)}</h2><p>Your saved summary and progress are kept separately from the new form above.</p><div className="activity-actions"><button className="secondary" onClick={()=>reopen(last.id)}>Open last class summary<ArrowRight size={17}/></button><button className="text-link" onClick={()=>go('My Learning',last.id)}>View saved progress</button></div></section>}
   {state.classSummaries.length>0&&<details className="saved-summaries"><summary>Saved class summaries <span>{state.classSummaries.length}</span></summary><button className="text-link" onClick={blank}><Plus size={16}/>Write a new summary</button>{[...state.classSummaries].sort((a,b)=>b.updatedAt-a.updatedAt).map(n=><button key={n.id} className={`saved-summary-row ${n.id===selected?'selected':''}`} onClick={()=>reopen(n.id)}><div><strong>{n.title||'Untitled class summary'}</strong><span>{n.date||new Date(n.updatedAt).toLocaleDateString('en-IN',{timeZone:state.settings.timezone})} · {n.text.slice(0,85)}{n.text.length>85?'…':''}</span></div><span>{n.id===selected?'Editing':'Reopen'}</span></button>)}</details>}

 </div>
}
