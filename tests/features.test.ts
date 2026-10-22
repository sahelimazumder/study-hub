import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import Today from '../src/Today';
import {StudyContext} from '../src/store';
import {describe,it,expect,vi,beforeEach,afterEach} from 'vitest';
import {freshState,parseBackup,mergeBackup,score,validateQuestion,createExam} from '../src/core';
import {proposeSession,putSession,planSession,startSession,stages} from '../src/studyEngine';
import TeachBack from '../src/TeachBack';
import {speechError,startDictation,type Recognition} from '../src/speechInput';
import {teachBackTopics,teachBackLesson,explanationGuidance,leakageCheck} from '../src/teachBackContent';
import {assembleSheet} from '../src/cheatContent';
import {chartLessons,checkChart,chartExpected,chartSteps,chartIssue,chartHelp,blankChartAnswer} from '../src/chartLessons';
import {aggregate} from '../src/chartMath';
import {analyseSummary} from '../src/summaryAnalysis';
import {detectConcepts,questionMatches,cardMatches} from '../src/concepts';
import {selectedClassId,scopeTopics,classTopicOptions,scopedSheetRows,caseMatchesTopics,chartIdsForTopics,chartStorageKey,scopedActivities} from '../src/classScope';
import {extractSummaryTopics} from '../src/summaryTopics';
import {nextChartId} from '../src/chartLessons';
import python from '../src/data/python-bank.json';
import additions from '../src/data/additions.json';
import {bank} from '../src/data';
describe('beginner workflows and preservation',()=>{
 it('migrates a four-stage backup without changing prior attempts or notes',()=>{const state=freshState(),s=proposeSession(state,{id:'class',title:'Keys',date:'',text:'Primary key',updatedAt:1});const old=JSON.parse(JSON.stringify(putSession(state,s)));delete old.savedSheets;delete old.guidedCharts;delete old.studySessions[0].teachBack;delete old.studySessions[0].explainIndex;delete old.settings.displayName;delete old.settings.institution;old.notes.original='Keep this';const next=parseBackup(old);expect(next.notes.original).toBe('Keep this');expect(next.studySessions[0].teachBack).toEqual({});expect(next.studySessions[0].stage).toBe('understand');expect(next.savedSheets).toEqual([]);expect(stages).toEqual(['understand','explain','practise','review','remember'])});
 it('round-trips chapter, editable profile, teach-back, saved sheets and chart choices',()=>{let state=freshState();const summary={id:'class',title:'Class',date:'2026-10-22',chapter:'Chapter 6',text:'SQL joins',updatedAt:1};state.classSummaries=[summary];const session=proposeSession(state,summary);session.stage='explain';session.teachBack={joins:{text:'A left join keeps unmatched left rows.',submittedAt:100,checks:['0']}};state=putSession(state,session);state.settings.displayName='Test learner';state.settings.institution='Test institution';state.savedSheets=[{id:'sheet',name:'Joins',topic:'SQL',prompt:'SQL joins',classId:'class',updatedAt:2,rows:assembleSheet('SQL joins','SQL').rows}];state.guidedCharts.monthly={...blankChartAnswer(),chart:'bar',x:'month',y:'sales',aggregation:'sum',accepted:true};expect(parseBackup(JSON.parse(JSON.stringify(state)))).toEqual(state);expect(mergeBackup(freshState(),state).savedSheets[0].id).toBe('sheet')});
 it('recovers saved test position and rejects out-of-range positions',()=>{const state=freshState(),exam=createExam(bank.questions,bank.cases,1,0,1,15);exam.currentIndex=1;state.exams=[exam];expect(parseBackup(JSON.parse(JSON.stringify(state))).exams[0].currentIndex).toBe(1);exam.currentIndex=2;expect(()=>parseBackup(state)).toThrow(/position/)});
 it('explains speech permission, silence, device and connection failures',()=>{expect(speechError('not-allowed')).toMatch(/denied.*typing/i);expect(speechError('no-speech')).toMatch(/No speech/);expect(speechError('audio-capture')).toMatch(/microphone/);expect(speechError('network')).toMatch(/could not connect/)});
 it('distinguishes core concepts, examples, future coverage and unmatched text',()=>{const a=analyseSummary('Today we studied primary keys. Example: composite keys in enrolment. Next week we will study regression. Quantum gravity.', ['primary','composite']);expect(a.core).toContain('primary');expect(a.supporting).toContain('composite');expect(a.optional).toHaveLength(1);expect(a.unmatched).not.toContain('Overview')});
});
describe('offline saved cheat sheets',()=>{
 it('assembles SQL support and supplementary tables with the requested seven fields',()=>{for(const [topic,prompt] of [['SQL','Help me remember SQL joins'],['Python','Explain list methods'],['pandas','Common grouping operations'],['Power BI','Measures and calculated columns'],['Tableau','Where do fields go?']]){const r=assembleSheet(prompt,topic);if(topic==='SQL')expect(r.rows.some(r=>r.item==='psql connection')).toBe(false);expect(r.rows.length,topic).toBeGreaterThan(0);for(const row of r.rows)expect(Object.keys(row)).toEqual(['item','kind','when','syntax','example','result','mistake'])}});
 it('rejects empty requests and avoids unsupported arbitrary generation',()=>{expect(()=>assembleSheet('','SQL')).toThrow();expect(assembleSheet('quantum chromodynamics','Other course topics').rows).toEqual([]);expect(assembleSheet('Write an async decorator API','Python').rows).toEqual([])});
 it('distinguishes Python in-place methods, group counts and DAX/Power Query',()=>{expect(assembleSheet('list methods','Python').rows.find(r=>r.item==='sort')?.result).toMatch(/None/);expect(assembleSheet('groupby','pandas').rows.find(r=>r.item==='count')?.mistake).toMatch(/missing/);expect(assembleSheet('measures','Power BI').rows.map(r=>r.kind)).toEqual(expect.arrayContaining(['DAX measure','DAX column','Power Query transformation','Visual configuration']))});
});
describe('guided chart reasoning and deterministic values',()=>{
 it('accepts each suitable preferred chart and defensible alternatives',()=>{for(const l of chartLessons)for(const chart of l.charts)expect(checkChart(l,{...blankChartAnswer(),chart,x:l.x,y:l.y,aggregation:chartExpected(l,{...blankChartAnswer(),chart},'aggregation'),group:chart==='pie'?'':l.group}),l.id+chart).toBe('')});
 it('explains chart, axis, aggregation and group errors without locking retry',()=>{const l=chartLessons[0],correct={...blankChartAnswer(),chart:'line',x:l.x,y:l.y,aggregation:'sum',group:''};expect(checkChart(l,{...correct,chart:'pie'})).toMatch(/does not fit/);expect(checkChart(l,{...correct,x:'sales'})).toMatch(/month/);expect(checkChart(l,{...correct,aggregation:'mean'})).toMatch(/total/);expect(checkChart(l,{...correct,group:'sales'})).toMatch(/wrong level/);expect(checkChart(l,correct)).toBe('')});
 it('computes totals rather than displaying invented chart values',()=>{const l=chartLessons[0];expect(aggregate(l.rows,'month','sales','sum',{month:'date'}).data.map(r=>r.value)).toEqual([40,48,44,55]);expect(aggregate(chartLessons[4].rows,'region','profit','sum').data.find(r=>r.name==='South')?.value).toBe(-9)});
});
describe('new scenario assessment checks',()=>{
 it('validates the six additions and every option explanation',()=>{for(const q of additions){expect(()=>validateQuestion(q,bank.sources.map(s=>s.id))).not.toThrow();expect(score(q as any,q.answer.choice_ids)).toBe(4)}});
 it('recomputes the join, interaction predictions and weighted margin',()=>{const patients=[1,2,3],visits=[{pid:1,fee:100},{pid:1,fee:200},{pid:2,fee:null}];const joined=patients.flatMap(pid=>visits.filter(v=>v.pid===pid).length?visits.filter(v=>v.pid===pid):[{pid,fee:null}]);expect(joined.length).toBe(4);expect(joined.filter(r=>r.fee!==null)).toHaveLength(2);expect(joined.reduce((n,r)=>n+(r.fee||0),0)).toBe(300);const occupied=new Set(['7|2026-10-22']);const inserts=[[7,'2026-10-23'],[8,'2026-10-22'],[7,'2026-10-22'],[null,'2026-10-24']];expect(inserts.map(([room,day])=>room!==null&&day!==null&&!occupied.has(`${room}|${day}`))).toEqual([true,true,false,false]);const predict=(a:number,h:number)=>10+2*a+3*h+a*h;expect(predict(4,1)-predict(4,0)).toBe(7);expect((8000+6000)/(80000+20000)).toBe(.14)});
 it('rejects insufficient test pools and retains pending subjective marks',()=>{expect(()=>createExam([],[],3,2,0,15)).toThrow();const e=createExam(bank.questions,bank.cases,1,0,1,15);expect(e.responses).toEqual({});expect(e.cases[0].subquestions.reduce((n,s)=>n+s.max_marks,0)).toBe(15)});
});


describe('current class scope',()=>{
 const notes=(text:string)=>({id:'new-class',title:'Today',date:'2026-10-22',text,updatedAt:1});
 it('excludes background headings, nested history and future topics from Markdown',()=>{
  const text='# Previously covered\nPrimary keys and regression\n## Examples\nProbability and governance\n# This session\nLEFT JOIN and unmatched rows\n# Next class\nComposite keys';
  expect(detectConcepts(text)).toEqual(['joins']);
 });
 it('separates inline earlier coverage from this class',()=>{expect(detectConcepts('Previously we covered primary keys. Today we studied joins. Next week we will study regression.')).toEqual(['joins'])});
 it('uses only the submitted summary despite earlier classes and manually supplied IDs',()=>{
  const state=freshState(),previous=proposeSession(state,notes('Regression, governance and primary keys'));
  previous.status='finished';state.studySessions=[previous];state.classSummaries=[notes('Regression and governance')];
  const s=proposeSession(state,notes('LEFT JOIN'),['joins','regression','primary']);
  expect(s.conceptIds).toEqual(['joins']);expect(s.includeRetention).toBe(false);expect(s.retentionQuestionIds).toEqual([]);
  expect(s.questions.length).toBeGreaterThan(0);expect(s.questions.every(q=>questionMatches(q,'joins'))).toBe(true);expect(s.cards.every(c=>cardMatches(c,'joins'))).toBe(true);
  expect(planSession(state,s,[],5).conceptIds).toEqual([]);
  expect(planSession(state,s,['joins'],5).conceptIds).toEqual(['joins']);
 });
 it('repairs an old unstarted plan before starting without modifying past attempts',()=>{
  let state=freshState();const s=proposeSession(state,notes('Primary keys'));
  const foreign=proposeSession(state,notes('Regression')).questions[0];
  s.conceptIds.push('regression');s.questions.push(foreign);s.includeRetention=true;s.retentionQuestionIds=[foreign.id];
  const history={...s,id:'completed',status:'finished' as const};state.studySessions=[s,history];
  const next=startSession(state,s.id),active=next.studySessions.find(x=>x.id===s.id)!;
  expect(active.conceptIds).toEqual(['primary']);expect(active.retentionQuestionIds).toEqual([]);expect(active.questions.every(q=>questionMatches(q,'primary'))).toBe(true);
  expect(next.studySessions.find(x=>x.id==='completed')).toBe(history);expect(s.conceptIds).toContain('regression');
 });
 it('does not substitute the course catalogue when a summary has no supported match',()=>{
  const state=freshState(),s=proposeSession(state,notes('Quantum gravity'),['primary','regression']);
  expect(s.conceptIds).toEqual([]);expect(s.questions).toEqual([]);expect(s.cards).toEqual([]);expect(s.chartKind).toBeNull();
  expect(startSession(putSession(state,s),s.id).studySessions[0].status).toBe('active');
 });
});


describe('shared class focus and source summary topics',()=>{
 it('keeps one explicit class selection across tools and backup reload',()=>{
  const state=freshState();state.classSummaries=[{id:'old',title:'Session 12',text:'Primary keys and regression',date:'',updatedAt:1},{id:'new',title:'Session 13',text:'# Session 13\n## Variables and Assignment\nVariables store values using =.\n## Python lists\nappend and extend were compared.\n## pandas grouping\nDataFrame groupby summaries.',date:'',updatedAt:2}];state.studyClassId='new';
  const next=parseBackup(JSON.parse(JSON.stringify(state)));expect(selectedClassId(next)).toBe('new');expect(scopeTopics(next)).toEqual(expect.arrayContaining(['python-basics','python-lists','pandas-grouping']));expect(scopeTopics(next)).not.toContain('primary');expect(classTopicOptions(next).map(t=>t.title)).toEqual(['Variables and Assignment','Python lists','pandas grouping']);
  next.studyClassId=null;expect(scopeTopics(next)).toBeUndefined();expect(classTopicOptions(next)).toEqual([]);
 });
 it('does not union old plans into class topics and respects explicit corrections',()=>{
  const state=freshState(),notes:{id:string;title:string;text:string;date:string;updatedAt:number;topicIds?:string[]}={id:'class',title:'Class 13',text:'Python lists and pandas groupby',date:'',updatedAt:1};state.classSummaries=[notes];state.studyClassId=notes.id;const old=proposeSession(state,notes);old.conceptIds=['primary','regression'];state.studySessions=[old];expect(scopeTopics(state)).not.toContain('primary');expect(scopeTopics(state)).toContain('python-lists');notes.topicIds=['python-lists'];expect(scopeTopics(state)).toEqual(['python-lists']);
 });
 it('extracts plain and Markdown topic headings in order without treating containers as missing topics',()=>{
  const text='# Faculty Session 13\n## Overview\nA Python class.\n## Main Topics\n### Variables and Assignment\nVariables serve as placeholders for storing values using the assignment operator (=).\n- Integer (int): Whole numbers.\n- String (str): Text data.\n# Previously covered\nPrimary keys and regression.';
  const topics=extractSummaryTopics(text);expect(topics.map(t=>t.title)).toEqual(['Variables and Assignment','Integer (int)','String (str)']);for(const t of topics){expect(t.lines).toHaveLength(4);expect(t.lines.every(line=>line.length>10)).toBe(true);expect(t.sourceText.length).toBeGreaterThan(0)}expect(topics[0].lines[0]).toMatch(/name.*value/);expect(topics[0].lines[1]).toMatch(/assignment operator/);expect(topics[1].lines[0]).toMatch(/whole number/);
 });
 it('retains unfamiliar summary topics for reading without inventing bank questions',()=>{
  const topics=extractSummaryTopics('## Service blueprints\nA service blueprint maps customer-facing steps and the supporting work.');expect(topics[0].title).toBe('Service blueprints');expect(topics[0].lines[0]).toMatch(/customer-facing/);expect(topics[0].conceptIds).toEqual([]);expect(topics[0].lines[2]).toMatch(/No worked example/);
 });
 it('restricts sheets, chart choices, cases and activity to the chosen class',()=>{
  const state=freshState();state.classSummaries=[{id:'p',title:'Session 13',text:'pandas groupby',date:'',updatedAt:1}];state.studyClassId='p';const ids=scopeTopics(state);expect(scopedSheetRows(state).map(r=>r.item)).toEqual(['pandas grouping','pandas size and count']);expect(scopedSheetRows(state,'primary keys')).toEqual([]);expect(chartIdsForTopics(ids)).toEqual([]);expect(bank.cases.filter(c=>caseMatchesTopics(c,ids)).map(c=>c.id)).toEqual(['PYCASE01']);
  const q=bank.questions.find(q=>q.id==='PY26-10')!;state.activities=[{id:'old',classId:'other',at:1,question:q,response:[],score:0,category:'',note:''},{id:'current',classId:'p',at:1,question:q,response:[],score:0,category:'',note:''}];expect(scopedActivities(state).map(a=>a.id)).toEqual(['current']);
 });
 it('starts chart inputs fresh per class and advances only within the available chart list',()=>{
  const state=freshState();state.studyClassId='13';expect(chartStorageKey(state,'monthly')).toBe('class:13:monthly');state.studyClassId='14';expect(chartStorageKey(state,'monthly')).toBe('class:14:monthly');state.studyClassId=null;expect(chartStorageKey(state,'monthly')).toBe('monthly');expect(nextChartId('spending',['spending','monthly'])).toBe('monthly');expect(nextChartId('monthly',['spending','monthly'])).toBe('spending');expect(nextChartId('spending',['spending'])).toBe('spending');expect(nextChartId('monthly',[])).toBeNull();expect(blankChartAnswer()).toMatchObject({chart:'',x:'',y:'',hint:0,attempts:0,accepted:false});
 });
 it('preserves completed chart runs and class metadata through backup/merge',()=>{
  const state=freshState();state.studyClassId='13';state.chartRuns=[{id:'run',classId:'13',lessonId:'monthly',at:1,answer:{...blankChartAnswer(),chart:'line',x:'month',y:'sales',aggregation:'sum',accepted:true}}];expect(parseBackup(JSON.parse(JSON.stringify(state))).chartRuns).toEqual(state.chartRuns);expect(mergeBackup(freshState(),state).studyClassId).toBe('13');expect(mergeBackup(freshState(),state).chartRuns).toEqual(state.chartRuns);
 });
 it('validates Python questions, definitions and criterion-level case totals',()=>{
  expect(python.questions).toHaveLength(12);for(const q of python.questions){expect(()=>validateQuestion(q,bank.sources.map(s=>s.id))).not.toThrow();expect(score(q as any,q.answer.choice_ids)).toBe(4);expect(q.python_check.code.length).toBeGreaterThan(10)}expect(python.sheets).toHaveLength(8);expect(python.cases[0].subquestions.reduce((n,s)=>n+s.rubric.reduce((m,r)=>m+r.max_marks,0),0)).toBe(15);
 });
});


describe('blank Home and explicit summary recovery',()=>{
 function saved(){const state=freshState();state.classSummaries=[{id:'old',title:'Class 13',chapter:'Chapter 13',text:'Previously saved Python notes',date:'',updatedAt:1},{id:'last',title:'Class 30',chapter:'Chapter 30',text:'Latest class summary about regression',date:'',updatedAt:2}];state.studyClassId='old';return state}
 function home(state:ReturnType<typeof freshState>,focusModule=''){return renderToStaticMarkup(createElement(StudyContext.Provider,{value:{state,focusModule,update:()=>{},go:()=>{}}},createElement(Today)))}
 it('opens with empty text and metadata despite a selected class and saved history',()=>{
  const state=saved(),snapshot=JSON.stringify(state),html=home(state);expect(html.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/)?.[1]).toBe('');expect(html).toContain('Start a new class');expect(html).toContain('Open last class summary');expect(html).toContain('Chapter 30');expect(html).not.toContain('Editing saved summary:');expect(JSON.stringify(state)).toBe(snapshot);
 });
 it('refreshing/revisiting Home does not restore an autosaved draft into the new composer',()=>{
  const state=saved();state.classSummaries.unshift({id:'draft',title:'New draft',text:'My unfinished pasted notes',date:'',updatedAt:3});state.studyClassId='draft';for(let i=0;i<2;i++){const html=home(state);expect(html.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/)?.[1]).toBe('');expect(html).toContain('New draft');expect(html).toContain('Open last class summary')}
 });
 it('loads old text only when a saved summary is explicitly requested',()=>{
  const state=saved(),html=home(state,'last');expect(html.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/)?.[1]).toBe('Latest class summary about regression');expect(html).toContain('Editing saved summary:');expect(html).toContain('Revisit your class summary');expect(html).toContain('Start a new blank summary');expect(home(state,'missing').match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/)?.[1]).toBe('');
 });
});


describe('guided explanations from this class',()=>{
 const session=()=>proposeSession(freshState(),{id:'lesson',title:'Session 30',date:'',text:'# Useful features and leakage\nUse past purchases as inputs; future purchase dates cause leakage.',updatedAt:1});
 it('gives concrete next steps for the beginner sentence in the reported bug',()=>{
  const s=session(),topic=teachBackTopics(s)[0],lesson=teachBackLesson(topic,s);
  expect(lesson.model).toMatch(/available when a prediction/);expect(lesson.model).toMatch(/Leakage/);
  const feedback=explanationGuidance(topic,'useful features are those which helps to identify business analysis',s);
  expect(feedback.tips.join(' ')).toMatch(/already be available/);expect(feedback.tips.join(' ')).toMatch(/future outcome/);
  expect(feedback).not.toHaveProperty('score');
 });
 it('adapts hints without claiming that matching words proves correctness',()=>{
  const s=session(),topic=teachBackTopics(s)[0];
  const feedback=explanationGuidance(topic,'For example past purchases are inputs known before prediction; the future outcome would leak the answer.',s);
  expect(feedback.tips).toEqual([]);expect(feedback).not.toHaveProperty('correct');
 });
 it('uses source topic names, excludes history and supports topics outside the bank',()=>{
  const s=session();s.summarySnapshot='# Previously covered\nRegression\n# This session\n## Variables and Assignment\nx = 4\n## Dictionaries\nKeys map to values.';
  expect(teachBackTopics(s).map(t=>t.title)).toEqual(['Variables and Assignment','Dictionaries']);
  expect(teachBackLesson(teachBackTopics(s)[1],s).model).toMatch(/dictionary/i);
  expect(teachBackLesson(teachBackTopics(s)[1],s).question).toBeUndefined();
 });
 it('validates every answer and distractor of the feature timing check',()=>{
  expect(()=>validateQuestion(leakageCheck,['session-summary'])).not.toThrow();
  expect(score(leakageCheck,['past'])).toBe(1);expect(score(leakageCheck,['future'])).toBe(0);expect(score(leakageCheck,['outcome'])).toBe(0);
 });
 it('renders submitted text with actionable help and preserves quick-check evidence in backups',()=>{
  const state=freshState(),s=session(),topic=teachBackTopics(s)[0];s.stage='explain';
  s.teachBack[topic.id]={text:'Useful features help business analysis.',submittedAt:1,checks:[],quickQuestion:leakageCheck,quickChoice:'future',quickChecked:true};
  state.studySessions=[s];
  expect(parseBackup(JSON.parse(JSON.stringify(state)))).toEqual(state);
  const html=renderToStaticMarkup(createElement(StudyContext.Provider,{value:{state,update:()=>{},go:()=>{},focusModule:''}},createElement(TeachBack,{session:s,onNext:()=>{}})));
  expect(html).toContain('Ideas to make clearer');expect(html).toContain('not known on 1 June');expect(html).toContain('Improve my answer');expect(html).not.toContain('No automatic meaning assessment');expect(html).not.toContain('What I understood correctly');
 });
});

describe('speech transcript lifecycle',()=>{
 beforeEach(()=>vi.useFakeTimers());afterEach(()=>{vi.clearAllTimers();vi.useRealTimers()});
 class FakeSpeech implements Recognition{
  lang='';continuous=false;interimResults=false;onstart:Recognition['onstart']=null;onresult:Recognition['onresult']=null;onerror:Recognition['onerror']=null;onend:Recognition['onend']=null;
  started=false;stopped=false;aborted=false;start(){this.started=true}stop(){this.stopped=true}abort(){this.aborted=true}
 }
 function setup(){let instance:FakeSpeech;class Speech extends FakeSpeech{constructor(){super();instance=this;}}const texts:string[]=[],statuses:string[]=[];const controller=startDictation(Speech,'My example:','en-IN',t=>texts.push(t),(state,message)=>statuses.push(state+':'+message));return {get r(){return instance!},texts,statuses,controller};}
 it('waits for actual start and replaces interim words without duplicates',()=>{
  const x=setup();expect(x.statuses[0]).toMatch(/^connecting/);expect(x.r.continuous&&x.r.interimResults).toBe(true);x.r.onstart?.();expect(x.statuses.at(-1)).toMatch(/^listening/);
  x.r.onresult?.({results:[{isFinal:false,0:{transcript:'past'}}]});
  x.r.onresult?.({results:[{isFinal:true,0:{transcript:'past purchases'}},{isFinal:false,0:{transcript:'are known'}}]});
  expect(x.texts).toEqual(['My example: past','My example: past purchases are known']);
  x.controller.stop();expect(x.r.stopped).toBe(true);x.r.onend?.();expect(x.statuses.at(-1)).toMatch(/^idle:Speech finished/);
 });
 it('keeps permission errors visible after end and allows a new attempt',()=>{
  const x=setup();x.r.onerror?.({error:'not-allowed'});x.r.onend?.();expect(x.statuses.at(-1)).toMatch(/denied/);expect(x.texts).toEqual([]);expect(setup().r.started).toBe(true);
 });
 it('reports silence and blocks late writes after leaving the topic',()=>{
  const x=setup();x.r.onend?.();expect(x.statuses.at(-1)).toMatch(/No words/);
  const y=setup(),late=y.r.onresult;y.controller.dispose();expect(y.r.aborted).toBe(true);late?.({results:[{isFinal:true,0:{transcript:'late'}}]});expect(y.texts).toEqual([]);
 });
 it('escapes stalled permission and stop states without losing the answer',()=>{const x=setup();vi.advanceTimersByTime(12000);expect(x.statuses.at(-1)).toMatch(/^idle:.*did not start/);expect(x.r.aborted).toBe(true);const y=setup();y.r.onstart?.();y.controller.stop();vi.advanceTimersByTime(2000);expect(y.statuses.at(-1)).toMatch(/^idle:Microphone stopped/);});
 it('recovers when the browser throws during startup',()=>{
  class Broken extends FakeSpeech{start(){throw Error('unavailable')}}const states:string[]=[];
  startDictation(Broken,'','hi-IN',()=>{},(s,m)=>states.push(s+':'+m));expect(states.at(-1)).toMatch(/^idle:.*could not start/);
 });
});


describe('easy chart help for the exact mistaken step',()=>{
 const right=(id:string,chart?:string)=>{const l=chartLessons.find(l=>l.id===id)!;const a={...blankChartAnswer(),chart:chart||l.charts[0],x:l.x,y:l.y,aggregation:l.aggregation,group:l.group};a.aggregation=chartExpected(l,a,'aggregation');if(a.chart==='pie')a.group='';return {l,a}};
 it('checks only the visible step instead of leaking a later error into Step 1',()=>{
  const {l,a}=right('spending');a.aggregation='sum';
  expect(chartIssue(l,a,'chart')).toBeNull();expect(chartIssue(l,a,'x')).toBeNull();
  const issue=chartIssue(l,a)!;expect(issue.field).toBe('aggregation');expect(issue.step).toBe(2);expect(issue.total).toBe(3);
  expect(issue.selected).toBe('Sum — total');expect(issue.choice).toBe('Frequency — count values in bins');expect(issue.reason).toMatch(/Sum adds rupees/);
  expect(checkChart(l,a)).toMatch(/Step 3 of 3 — Choose a calculation/);
 });
 it('tells a beginner exactly which field to choose for every axis or value mistake',()=>{
  for(const id of ['monthly','category','advertising','profit','spending']){
   const {l,a}=right(id),wrong={...a,x:id==='spending'?'customer':l.y};const issue=chartIssue(l,wrong)!;
   expect(issue.field).toBe('x');expect(issue.step).toBe(1);expect(issue.choice).toBe(l.x);expect(issue.reason.length).toBeGreaterThan(70);
   if(l.y){const y=chartIssue(l,{...a,y:l.x})!;expect(y.field).toBe('y');expect(y.step).toBe(2);expect(y.choice).toBe(l.y);}
  }
 });
 it('explains the actual wrong calculation differently for Sum, Average and Count',()=>{
  const {l,a}=right('spending');const sum=chartHelp(l,{...a,aggregation:'sum'},'aggregation'),mean=chartHelp(l,{...a,aggregation:'mean'},'aggregation'),count=chartHelp(l,{...a,aggregation:'count'},'aggregation');
  expect(sum.reason).toMatch(/adds rupees/);expect(mean.reason).toMatch(/average purchase/);expect(count.reason).toMatch(/overall count/);expect(new Set([sum.reason,mean.reason,count.reason]).size).toBe(3);
  const sales=right('monthly');expect(chartHelp(sales.l,{...sales.a,aggregation:'count'},'aggregation').reason).toMatch(/counts records/);
  const dots=right('advertising');expect(chartHelp(dots.l,{...dots.a,aggregation:'sum'},'aggregation').reason).toMatch(/combines stores/);
 });
 it('explains the wrong chart and recommends a suitable chart for each business question',()=>{
  for(const l of chartLessons){const bad=['line','bar','scatter','histogram','box','pie'].filter(c=>!l.charts.includes(c));const reasons=bad.map(chart=>chartHelp(l,{...blankChartAnswer(),chart},'chart'));
   expect(new Set(reasons.map(r=>r.reason)).size).toBe(bad.length);
   for(const hint of reasons){expect(hint.step).toBe(0);expect(hint.value).toBe(l.charts[0]);expect(hint.valid).toBe(false);expect(hint.reason).toMatch(/does not fit/);}
  }
 });
 it('keeps a suitable alternative and gives help for the requested field regardless of earlier hint count',()=>{
  const {l,a}=right('monthly','bar');a.hint=99;const help=chartHelp(l,a,'chart');expect(help.valid).toBe(true);expect(help.value).toBe('bar');
  expect(chartHelp(l,a,'aggregation').step).toBe(3);expect(chartHelp(l,a,'x').value).toBe('month');
  expect(chartHelp(l,{...a,group:'sales'},'group').step).toBe(4);expect(chartHelp(l,{...a,group:'sales'},'group').choice).toBe('channel');
 });
 it('uses three steps for distributions, four for pie, and five for axis charts',()=>{
  const spending=right('spending'),pie=right('category','pie'),line=right('monthly');
  expect(chartSteps(spending.l,spending.a).map(s=>s.field)).toEqual(['chart','x','aggregation']);
  expect(chartSteps(pie.l,pie.a).map(s=>s.field)).toEqual(['chart','x','y','aggregation']);expect(chartSteps(line.l,line.a)).toHaveLength(5);
 });
 it('keeps raw spending for a box plot and counts bins only for a histogram',()=>{
  const box=right('spending','box'),hist=right('spending','histogram');expect(box.a.aggregation).toBe('none');expect(checkChart(box.l,box.a)).toBe('');expect(hist.a.aggregation).toBe('frequency');
  expect(chartHelp(box.l,{...box.a,aggregation:'sum'},'aggregation').reason).toMatch(/median and spread/);
 });
});
