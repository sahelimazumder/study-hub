import {bank} from './data';
import type {Question,Card} from './core';

type Concept={id:string;label:string;module:string;patterns:RegExp[];questionPatterns?:RegExp[];terms:string[];prerequisites:string[];chart?:'scatter'|'line'|'histogram'|'bar'};
const re=(...patterns:string[])=>patterns.map(p=>new RegExp(p,'i'));
export const concepts:Concept[]=[
 {id:'problem',label:'Defining the business problem',module:'business',patterns:re('problem (?:statement|definition|solving)','feature request','customer (?:feedback|need)','interviews?','observation','safepay'),terms:['Problem statement'],prerequisites:[]},
 {id:'features',label:'Useful features and leakage',module:'business',patterns:re('feature engineering','recency','leakage','days since','predictor availability'),terms:['Recency'],prerequisites:['problem']},
 {id:'overlap',label:'Customer overlap and migration',module:'cases',patterns:re('customer (?:overlap|sets?)','unique (?:users|customers)','retention','migrat','union','inclusion.exclusion'),terms:['Overlap union','Unique-user migration'],prerequisites:[]},
 {id:'decisions',label:'Costs and decision tradeoffs',module:'cases',patterns:re('decision matrix','weighted (?:scores?|matrix)','one.time','contribution','savings?','profitability'),terms:['Contribution','Weighted matrix','First-year net benefit','Sensitivity boundary'],prerequisites:['problem']},
 {id:'governance',label:'Governance and stewardship',module:'governance',patterns:re('governance','steward','access (?:policy|review|control)','policy (?:update|communication)','offboarding'),terms:['Governance','Stewardship'],prerequisites:[]},
 {id:'quality',label:'Data quality',module:'governance',patterns:re('data quality','completeness','accuracy','consistency','timeliness','missing (?:fields|values)','messy data','standardiz'),terms:['Completeness','Accuracy','Consistency','Timeliness'],prerequisites:[]},
 {id:'primary',label:'Primary keys and constraints',module:'sql',patterns:re('primary keys?','unique.{0,12}non.null','key constraint','id generation'),questionPatterns:re('primary key','not.null','automatically.{0,25}(?:id|integer)','candidate key'),terms:['Primary key'],prerequisites:[]},
 {id:'composite',label:'Composite keys',module:'sql',patterns:re('composite','primary key\\s*\\([^)]*,','uniqueness of.{0,20}(?:pair|combination)'),terms:['Composite key'],prerequisites:['primary']},
 {id:'inserts',label:'INSERT statements and tracing',module:'sql',patterns:re('\\binsert\\b','autocommit','duplicate (?:id|key)','statement sequence'),terms:['INSERT','Primary key','NULL'],prerequisites:['primary']},
 {id:'null',label:'NULL and aggregate results',module:'sql',patterns:re('\\bnull\\b','count\\s*\\(','avg\\s*\\(','nullable','count of rows'),terms:['NULL','COUNT(*)','COUNT(column)','AVG'],prerequisites:[]},
 {id:'joins',label:'Joins and unmatched rows',module:'sql',patterns:re('\\bjoins?\\b','unmatched rows','matching records'),terms:['LEFT JOIN'],prerequisites:['primary','null']},
 {id:'aliases',label:'SQL aliases',module:'sql',patterns:re('aliases','alias\\b','nicknames'),terms:['Aliases'],prerequisites:[]},
 {id:'queries',label:'Filtering, grouping and ordering',module:'sql',patterns:re('\\bwhere\\b','\\bhaving\\b','order by','group by','sql (?:filter|aggregation)','query output'),terms:['WHERE','HAVING','ORDER BY'],prerequisites:['null']},
 {id:'schema',label:'Database design and architecture',module:'sql',patterns:re('database design','logical (?:level|schema)','physical level','data types?','relational','dbms','create table'),terms:['CREATE TABLE','Primary key'],prerequisites:[]},
 {id:'psql',label:'psql and database connections',module:'sql',patterns:re('psql','meta.command','create database','database connection'),terms:['psql connection'],prerequisites:[]},
 {id:'etl',label:'Warehouses and ETL',module:'bi',patterns:re('warehouse','\\betl\\b','\\boltp\\b','\\bolap\\b','data mart','power query','source locale'),terms:['ETL','OLTP','OLAP','Data warehouse','Data mart','Power Query types'],prerequisites:['quality']},
 {id:'dashboard',label:'Dashboards, KPIs and margins',module:'bi',patterns:re('dashboard','\\bkpis?\\b','power bi','superstore','profit margin','ratio of sums','sales.{0,20}profit'),terms:['Profit margin','Refresh timestamp'],prerequisites:['quality'],chart:'bar'},
 {id:'centre',label:'Mean and median',module:'descriptive',patterns:re('\\bmean\\b','\\bmedian\\b','central tendency','typical (?:customer|value)','skew','outlier'),questionPatterns:re('median','typical.{0,30}(?:expenditure|spending|performance)','mean.{0,20}outlier','long tail'),terms:['Mean','Median'],prerequisites:[],chart:'histogram'},
 {id:'spread',label:'Spread and relative variability',module:'descriptive',patterns:re('standard deviation','\\bvariance\\b','coefficient of variation','\\bcv\\b','\\biqr\\b','relative variability','box plot'),terms:['Sample SD','CV','IQR','Outlier fence'],prerequisites:['centre'],chart:'histogram'},
 {id:'probability',label:'Probability and conditioning',module:'probability',patterns:re('conditional probability','\\bprobability\\b','independen','mutually exclusive','at least one','p\\([ab]'),questionPatterns:re('P\\(','conditional probability','at least one','mutually exclusive'),terms:['Union','Conditional probability'],prerequisites:[]},
 {id:'binomial',label:'Binomial distribution',module:'probability',patterns:re('binomial','bernoulli','fixed.{0,15}trials','exactly.{0,15}conversions'),terms:['Binomial','Binomial expectation'],prerequisites:['probability']},
 {id:'poisson',label:'Poisson distribution',module:'probability',patterns:re('poisson','calls?.{0,15}per hour','complaints?.{0,15}per hour','event rate'),terms:['Poisson'],prerequisites:['probability']},
 {id:'normal',label:'Normal distribution and tails',module:'probability',patterns:re('normally distributed','normal distribution','z.score','normal tail'),terms:['Normal z score'],prerequisites:['centre','spread']},
 {id:'sampling',label:'Sampling and the CLT',module:'inference',patterns:re('sampling','sample frame','sampled population','central limit','\\bclt\\b','stratified','cluster','systematic','coverage bias'),terms:['CLT','Stratified sampling','Cluster sampling'],prerequisites:[]},
 {id:'intervals',label:'Confidence intervals and standard error',module:'inference',patterns:re('confidence interval','margin of error','standard error','\\bCI\\b'),terms:['Confidence interval','Standard error'],prerequisites:['sampling']},
 {id:'testing',label:'Hypothesis tests and p-values',module:'inference',patterns:re('hypothesis','p.value','significance','fail to reject','null hypothesis','alpha','α'),terms:['p-value','One-sample t-test'],prerequisites:['sampling']},
 {id:'test-choice',label:'Paired tests, ANOVA and chi-square',module:'inference',patterns:re('paired','independent (?:samples|groups)','anova','chi.square','test selection','before and after'),terms:['Paired t-test','Independent means test','ANOVA','Chi-square independence'],prerequisites:['testing']},
 {id:'regression',label:'Regression and conditional slopes',module:'regression',patterns:re('regression','conditional slope','fitted (?:model|equation)','residual','correlation','association.{0,15}causation'),questionPatterns:re('regression','fitted slope','correlation','coefficient','holding.{0,25}(?:constant|fixed)'),terms:['OLS slope','Residual'],prerequisites:['centre','testing'],chart:'scatter'},
 {id:'model-fit',label:'R² and model comparison',module:'regression',patterns:re('r[²2]','r.squared','adjusted','model (?:fit|comparison)','overall f.test'),terms:['R²','Adjusted R²','Overall F-test'],prerequisites:['regression'],chart:'scatter'},
 {id:'interaction',label:'Dummy variables and interactions',module:'regression',patterns:re('dummy','interaction','moderat','centering','centring','reference category','format.{0,12}(?:gap|slope)'),terms:['Dummy variable','Interaction','Centering'],prerequisites:['regression'],chart:'scatter'},
 {id:'charts',label:'Reading and choosing charts',module:'charts',patterns:re('charts?','scatterplot','histogram','box plot','truncated (?:axis|baseline)','misleading ax','part.to.whole','pie chart','data visuali[sz]ation'),terms:['Bar chart','Line chart','Scatterplot','Histogram','Box plot','Part-to-whole'],prerequisites:[]},
 {id:'trends',label:'Trends over time',module:'charts',patterns:re('trends?','time series','line chart','chronolog','monthly (?:sales|revenue)'),questionPatterns:re('chronolog','line chart','date.{0,15}(?:sort|format)','trend'),terms:['Line chart'],prerequisites:[],chart:'line'},
 {id:'python-basics',label:'Python business calculations and types',module:'python',patterns:re('\\bpython\\b','variables? and assignment','assignment operator','integer.{0,8}int','float.{0,8}float','boolean.{0,8}bool','string.{0,8}str','arithmetic expressions','type conversion'),terms:['Python calculations','Python types'],prerequisites:[]},
 {id:'python-lists',label:'Python lists and list methods',module:'python',patterns:re('python lists?','list methods?','\\bappend\\b','\\bextend\\b','\\bsorted\\b','list sorting','list slicing'),terms:['List methods','List sorting'],prerequisites:[]},
 {id:'python-control',label:'Python loops and conditions',module:'python',patterns:re('\\bloops?\\b','control flow','if.?else','\\belif\\b','range\\s*\\(','for loop','while loop'),terms:['Loops and conditions','range boundaries'],prerequisites:[]},
 {id:'pandas-grouping',label:'pandas grouping and business summaries',module:'python',patterns:re('\\bpandas\\b','dataframe','\\bgroupby\\b','split.apply.combine'),terms:['pandas grouping','pandas size and count'],prerequisites:[]},
];

const normalize=(s:string)=>s.normalize('NFKC').toLowerCase().replaceAll('_',' ');
const sourceConcepts:Record<string,string[]>={
 'S08-Q01':['binomial'],'S08-Q02':['binomial'],'S08-Q03':['poisson'],'S08-Q04':['poisson'],'S08-Q05':['normal'],'S08-Q06':['normal'],
 'S09-Q01':['regression'],'S09-Q02':['spread'],'S09-Q03':['centre'],'S09-Q04':['probability'],'S09-Q05':['poisson'],'S09-Q06':['binomial'],
 'S09-Q07':['sampling'],'S09-Q08':['sampling'],'S09-Q09':['sampling'],'S09-Q10':['sampling'],'S09-Q11':['intervals'],'S09-Q12':['intervals'],
 'S09-Q13':['testing'],'S09-Q14':['testing'],'S09-Q15':['test-choice'],'S09-Q16':['test-choice'],'S09-Q17':['regression'],'S09-Q18':['model-fit'],
 'S09-Q19':['model-fit'],'S09-Q20':['interaction'],'S09-Q21':['centre','spread'],'S09-Q22':['centre'],'S09-Q23':['sampling'],'S09-Q24':['intervals'],
 'S09-Q25':['testing'],'S09-Q26':['test-choice'],'S09-Q27':['test-choice'],'S09-Q28':['regression'],'S09-Q29':['regression','model-fit'],
};
export function concept(id:string){return concepts.find(c=>c.id===id)}
// Only the current class contributes topics. Background sections remain in the saved notes.
export function currentClassText(summary:string){
 const previous=/\b(?:previously|previous (?:classes?|sessions?|topics?|learning)|earlier (?:classes?|sessions?|topics?)|prior (?:knowledge|classes?|sessions?)|last (?:class|session)|already (?:covered|studied)|course (?:history|background)|covered (?:so far|till (?:now|date)|to date)|background|for (?:your )?(?:understanding|reference))\b/i;
 const future=/\b(?:next (?:class|session|week)|future (?:topics?|coverage)|optional extensions?)\b/i;
 const current=/\b(?:today|this (?:class|session)|current (?:class|session)|new (?:class|session)|class summary|session summary)\b/i;
 let backgroundLevel:number|null=null;const kept:string[]=[];
 for(const line of summary.split('\n')){
  const heading=line.match(/^\s*(#{1,6})\s+(.+)/),label=(heading?.[2]||line).trim(),level=heading?.[1].length||0;
  if(heading){
   if(backgroundLevel!==null&&level>backgroundLevel)continue;
   backgroundLevel=previous.test(label)||future.test(label)?level:null;
   if(backgroundLevel!==null)continue;
  }else if(/^[^:]{1,100}:\s*$/.test(label)){
   if(previous.test(label)||future.test(label)){backgroundLevel=0;continue}
   if(current.test(label))backgroundLevel=null;
  }
  if(backgroundLevel!==null)continue;
  kept.push(...line.split(/(?<=[.!?;])\s+|;\s*/).filter(clause=>!previous.test(clause)||current.test(clause)));
 }
 return kept.join('\n');
}
export function detectConcepts(summary:string){
 const clauses=normalize(currentClassText(summary)).split(/[\n.!?;]+/).filter(s=>!/\b(?:next week|next class|not covered|did not (?:cover|study)|haven.t (?:covered|studied)|will (?:cover|study))\b/.test(s));
 const python=/\b(?:python|pandas|dataframe)\b/.test(normalize(currentClassText(summary)));
 return concepts.filter(c=>clauses.some(s=>{if(python&&c.module==='sql'&&!/\b(?:sql|postgres|database|primary key|foreign key)\b/.test(s))return false;return c.patterns.some(p=>p.test(s))})).map(c=>c.id);
}
export function questionMatches(q:Question,id:string){
 const c=concept(id);if(!c)return false;
 if(Array.isArray(q.concept_ids))return (q.concept_ids as string[]).includes(id);
 if(sourceConcepts[q.id])return sourceConcepts[q.id].includes(id);
 const moduleMatch=q.module===c.module||(c.id==='overlap'&&['business','probability'].includes(q.module))||(c.id==='decisions'&&q.module==='business')||(c.id==='regression'&&q.module==='charts')||(c.id==='charts'&&q.module==='bi')||(c.id==='trends'&&q.module==='bi');
 if(!moduleMatch)return false;
 const text=normalize([q.stem,q.topic,...q.misconceptions].join(' '));
 if(id==='primary'&&/composite|primary key\s*\([^)]*,/.test(text))return false;
 return (c.questionPatterns||c.patterns).some(p=>p.test(text));
}
export function referencesFor(ids:string[]){const terms=new Set(ids.flatMap(id=>concept(id)?.terms||[]));return bank.sheets.filter(r=>terms.has(r.term))}
export function lessonsFor(ids:string[]){const modules=new Set(ids.map(id=>concept(id)?.module));return bank.lessons.filter(l=>modules.has(l.module))}
export function cardMatches(card:Card,id:string){const c=concept(id);if(!c)return false;const front=normalize(card.front);return c.terms.some(term=>front.startsWith(normalize(term)+':'))||(card.module===c.module&&c.patterns.some(p=>p.test(front)))}
export function prerequisiteIds(ids:string[]){return [...new Set(ids.flatMap(id=>concept(id)?.prerequisites||[]))].filter(id=>!ids.includes(id)).slice(0,2)}
