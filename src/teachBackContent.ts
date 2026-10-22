import type {Question} from './core';
import type {StudySession} from './learningState';
import {extractSummaryTopics,type SummaryTopic} from './summaryTopics';
import {questionMatches} from './concepts';

export function teachBackTopics(session:StudySession){return extractSummaryTopics(session.summarySnapshot);}
const featuresModel='Useful features are inputs that help answer a business question and are available when a prediction is made. For example, past purchase counts can help predict whether a customer will buy next month. Leakage means using information from the future, such as next month’s actual purchase date. That makes a model look better in testing than it will work in real life.';
export const leakageCheck:Question={id:'teach-features-v1',version:1,module:'business',scope:'Guided understanding check',topic:'Useful features and leakage',type:'mcq',difficulty:'easy',max_marks:1,stem:'On 1 June, a shop predicts who will buy during June. Which input can it safely use at that moment?',choices:[{id:'past',text:'Number of purchases made before 1 June'},{id:'future',text:'The customer’s actual June purchase date'},{id:'outcome',text:'Whether the customer eventually bought in June'}],answer:{choice_ids:['past']},solution:'Past purchases are already known on 1 June. June’s purchase date and final buying outcome are future information: using them to predict June would leak the answer.',option_explanations:{past:'This information exists before the prediction is made.',future:'The actual June purchase date is not known on 1 June.',outcome:'This is the outcome being predicted, not an input available on 1 June.'},misconceptions:['Using future outcomes as predictors'],status:'validated',provenance_category:'newly_authored',source_references:[{source_id:'session-summary',locator:'Feature availability teaching check'}]};
export function teachBackLesson(topic:SummaryTopic,session:StudySession){
 const features=topic.conceptIds.includes('features')&&/features?|leakage|predictor/i.test(topic.title);
 const model=features?featuresModel:topic.lines.join(' ');
 const words=topic.title.toLowerCase().match(/[a-z]{3,}/g)?.filter(w=>!['and','the','with','for','python','business','data'].includes(w))||[];
 // Use only a frozen, validated question from this session and a direct topic match.
 const question=features?leakageCheck:session.questions.find(q=>q.type==='mcq'&&q.status==='validated'&&topic.conceptIds.some(id=>questionMatches(q,id))&&words.some(w=>(q.stem+' '+q.topic).toLowerCase().includes(w)));
 return {model,question,prompt:features?'Why can we use past purchases to predict a future purchase, but not the actual future purchase date?':`What does “${topic.title}” mean? Give one small example from your notes.`,starter:features?'A useful feature is… For example… We must avoid…':`${topic.title} means… For example…`,features};
}
export function explanationGuidance(topic:SummaryTopic,text:string,session:StudySession){
 const lesson=teachBackLesson(topic,session),lower=text.toLowerCase(),tips:string[]=[];
 if(lesson.features){
  if(!/predict|forecast|business question|input/.test(lower))tips.push('Make the purpose concrete: a feature is an input used to answer a business question or make a prediction.');
  if(!/before|already|available|known|at the time|past|histor/.test(lower))tips.push('Add the timing rule: the input must already be available when the prediction is made.');
  if(!/leak|future|outcome|after/.test(lower))tips.push('Explain leakage: using a future outcome, such as the actual next purchase date, gives away the answer.');
  if(!/purchas|order|customer|sales|example|e\.g\./.test(lower))tips.push('Try this example: use last month’s purchases to predict next month’s buying.');
 }else{
  if(text.trim().split(/\s+/).length<12)tips.push('Develop your sentence: say what the idea does, then describe one example.');
  if(!/example|e\.g\.|such as|for instance|\d|=/.test(lower))tips.push('Add a small example. Start with “For example…” and say what the result would be.');
  const titleWords=topic.title.toLowerCase().match(/[a-z]{4,}/g)||[];
  if(titleWords.length&&!titleWords.some(w=>lower.includes(w)))tips.push(`Connect your sentence to ${topic.title}. Use the class recap below to help.`);
 }
 return {tips,hasExample:/example|e\.g\.|such as|for instance|\d|=/.test(lower)};
}
