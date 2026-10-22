import {useEffect,useState} from 'react';
import {BookOpen,Sun,Moon,Menu,X,Search,Settings,Home,LibraryBig,NotebookText} from 'lucide-react';
import {freshState,loadState,persist,recoverExpired,type State} from './core';
import {bank,isPublic} from './data';
import {StudyContext} from './store';
import {parseStudyLocation,sessionHref} from './studyEngine';
import Today from './Today';
import ClassScope from './StudyFocus';
import {selectedClassId,scopeTopics} from './classScope';
import {referencesFor} from './concepts';
import StudyWorkspace from './StudyWorkspace';
import {MyLearning,ReferenceLibrary} from './LearningLibrary';
import PracticeSection from './PracticeSection';
import ClassLibrary from './ClassLibrary';
import SavedCheatSheets from './SavedCheatSheets';
import GuidedCharts from './GuidedCharts';
import MockExams from './MockExams';
import ChartLab from './ChartLab';
import Cases from './Cases';
import Materials from './Materials';
import {Learn,CheatSheets,Flashcards,Mistakes,Progress} from './StudyTools';

const navigation=[{name:'Today',label:'Home',icon:Home},{name:'My Learning',label:'My Classes',icon:LibraryBig},{name:'Practice',label:'Practice',icon:BookOpen},{name:'Mock Exams',label:'Create a Test',icon:NotebookText},{name:'Cheat Sheets',label:'Cheat Sheets',icon:NotebookText},{name:'Charts',label:'Charts',icon:LibraryBig}];
const labels:Record<string,string>={'Today':'Home','My Learning':'My Classes','Mock Exams':'Create a Test','Cheat Sheets':'Cheat Sheets'};
const canonical=(p:string)=>({'Dashboard':'Today','Home':'Today','My Classes':'My Learning','Create a Test':'Mock Exams'}[p]||p);
const groupFor=(page:string)=>['Today','Dashboard'].includes(page)?'Today':['Practice','Case Studies'].includes(page)?'Practice':['Reference','Cheat Sheets'].includes(page)?'Cheat Sheets':page==='Mock Exams'?'Mock Exams':['Charts','Chart Lab'].includes(page)?'Charts':'My Learning';
export default function StudyApp(){
 const initial=parseStudyLocation(location.hash);
 const [state,setState]=useState<State>(freshState),[loaded,setLoaded]=useState(false),[error,setError]=useState('');
 const [page,setPage]=useState(canonical(initial.page)),[focusModule,setFocus]=useState(initial.sessionId);
 const [mobile,setMobile]=useState(false),[search,setSearch]=useState(''),[routeKey,setRouteKey]=useState(0);
 useEffect(()=>{loadState().then(s=>{setState(recoverExpired(s));setLoaded(true)}).catch(e=>setError(`Could not load browser storage: ${e.message}. Existing data have not been overwritten. Reload to retry.`))},[]);
 useEffect(()=>{if(loaded)persist(state).catch(e=>setError(`Storage write failed: ${e.message}. Export a backup from settings before closing this browser.`))},[state,loaded]);
 useEffect(()=>{document.title=(state.settings.displayName||(isPublic?'Learner':'Saheli'))+' · Business Analytics Study Hub';document.documentElement.dataset.theme=state.settings.theme},[state.settings.theme,state.settings.displayName]);
 useEffect(()=>{const timer=setInterval(()=>setState(s=>recoverExpired(s)),1000);return()=>clearInterval(timer)},[]);
 useEffect(()=>{const hash=()=>{const route=parseStudyLocation(location.hash);setPage(canonical(route.page));setFocus(route.sessionId);setRouteKey(k=>k+1);setMobile(false)};window.addEventListener('hashchange',hash);return()=>window.removeEventListener('hashchange',hash)},[]);
 function go(next:string,focus=''){
  const destination=canonical(next);
  const sessionId=destination==='Study'?(focus||state.currentSessionId||''):'';
  const linkedClass=destination==='Study'?state.studySessions.find(s=>s.id===sessionId)?.summaryId:state.classSummaries.find(c=>c.id===focus||'class:'+c.id===focus)?.id||state.savedSheets.find(sheet=>sheet.id===focus)?.classId;
  if(sessionId||linkedClass)setState(s=>({...s,...(sessionId?{currentSessionId:sessionId}:{}),...(linkedClass?{studyClassId:linkedClass}:{})}));
  history.pushState(null,'',sessionId?sessionHref(sessionId):'#'+encodeURIComponent(destination));
  setPage(destination);setFocus(sessionId||focus);setRouteKey(k=>k+1);setMobile(false);setSearch('');window.scrollTo(0,0);
  requestAnimationFrame(()=>document.getElementById('main-content')?.focus());
 }
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement)?.tagName)){e.preventDefault();document.querySelector<HTMLInputElement>('[aria-label="Search study materials"]')?.focus()}if(e.key==='Escape'){setSearch('');setMobile(false)}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[]);
 const activeTopics=scopeTopics(state);
 const results=search.trim().length>1?[...(activeTopics===undefined?bank.lessons:[]).map(l=>({label:l.title,page:'Learn',focus:l.module+'|'+l.id})),...(activeTopics===undefined?bank.sheets:referencesFor(activeTopics)).map(s=>({label:s.term+' · '+s.meaning,page:'Reference',focus:s.module+'|'+s.term}))].filter(r=>r.label.toLowerCase().includes(search.toLowerCase())).slice(0,5):[];
 const panels:Record<string,React.ReactNode>={'Today':<Today/>,'Study':<StudyWorkspace/>,'My Learning':<ClassLibrary/>,'Reference':<ReferenceLibrary/>,'Learn':<Learn/>,'Practice':<PracticeSection/>,'Mock Exams':<MockExams/>,'Case Studies':<Cases/>,'Charts':<GuidedCharts/>,'Chart Lab':<ChartLab/>,'Cheat Sheets':<SavedCheatSheets/>,'Flashcards':<Flashcards/>,'Mistakes':<Mistakes/>,'Progress':<Progress/>,'Materials/Settings':<Materials/>};
 if(!loaded)return <div className="boot"><BookOpen size={34}/><h1>Opening your study space…</h1>{error&&<p role="alert">{error}</p>}</div>;
 return <StudyContext.Provider value={{state,update:setState,go,focusModule}}><a className="skip-link" href="#main-content" onClick={e=>{e.preventDefault();document.getElementById('main-content')?.focus()}}>Skip to main content</a><div className="app-shell calm-shell"><aside className={`sidebar ${mobile?'mobile-open':''}`}><button className="brand" onClick={()=>go('Today')}><span className="brand-icon"><BookOpen size={23}/></span><span>the study hub<small>{state.settings.displayName||(isPublic?'Learner':'Saheli')}{state.settings.institution?' · '+state.settings.institution:''}</small></span></button><nav aria-label="Main navigation">{navigation.map(item=><button key={item.name} className={groupFor(page)===item.name?'active':''} aria-current={groupFor(page)===item.name?'page':undefined} onClick={()=>go(item.name)}><item.icon size={20}/><span>{item.label}</span></button>)}</nav><div className="sidebar-bottom"><p>Learn from your class.<br/>Practise and review.</p><button className="settings-control" onClick={()=>go('Materials/Settings')}><Settings size={18}/>Settings &amp; materials</button><span className="local-status"><i/>Local &amp; private</span></div></aside>{mobile&&<button className="sidebar-scrim" aria-label="Close menu" onClick={()=>setMobile(false)}/>}
 <div className="main-shell"><header className="topbar"><button className="icon-button mobile-menu" aria-label={mobile?'Close navigation':'Open menu'} onClick={()=>setMobile(!mobile)}>{mobile?<X size={22}/>:<Menu size={22}/>}</button><div className="calm-breadcrumb">{page==='Study'?'My Classes / Study session':page==='Materials/Settings'?'Settings & materials':(labels[page]||page)}</div><div className="topbar-right"><div className="global-search"><Search size={17}/><input aria-label="Search study materials" placeholder="Find a concept" value={search} onChange={e=>setSearch(e.target.value)}/>{search.length>1&&<div className="search-results">{results.length?results.map((r,i)=><button key={i} onClick={()=>go(r.page,r.focus)}><span>{r.label}</span><small>{r.page}</small></button>):<p>No matching lesson or reference term.</p>}</div>}</div><button className="icon-button" aria-label={state.settings.theme==='dark'?'Switch to light mode':'Switch to dark mode'} onClick={()=>setState(s=>({...s,settings:{...s.settings,theme:s.settings.theme==='dark'?'light':'dark'}}))}>{state.settings.theme==='dark'?<Sun size={19}/>:<Moon size={19}/>}</button><button className="icon-button" aria-label="Open settings" onClick={()=>go('Materials/Settings')}><Settings size={19}/></button></div></header>
 <main className={`main-content ${['Today','Study','My Learning','Reference','Cheat Sheets','Charts'].includes(page)?'focused-page':'advanced-page'}`} id="main-content" tabIndex={-1}>{error&&<p role="alert" className="error storage-error">{error}</p>}{!['Today','Study','My Learning','Reference','Cheat Sheets','Charts','Practice','Mock Exams','Materials/Settings'].includes(page)&&<button className="text-link back-to-library" onClick={()=>go(groupFor(page))}>← Back to {labels[groupFor(page)]||groupFor(page)}</button>}{page!=='Today'&&<ClassScope/>}<div key={routeKey+':'+(page==='Today'?'home':selectedClassId(state)||'all')}>{panels[page]||<Today/>}</div></main><footer className="app-footer"><span>Personal study · Your notes stay on this browser</span><span>{state.settings.timezone}</span></footer></div></div></StudyContext.Provider>
}
