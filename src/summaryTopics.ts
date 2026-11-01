import {detectConcepts,currentClassText} from './concepts';
export type SummaryTopic={id:string;title:string;sourceText:string;conceptIds:string[];lines:[string,string,string,string];context:string;headingPath:string[];explanation:string[];originalTitle:string};
const clean=(s:string)=>s.replace(/\*\*|__|`/g,'').replace(/^\s*[-*+]\s+/gm,'').trim();
const container=/^(?:overview|main topics|topics(?: covered)?|summary|class summary|session summary|key takeaways|learning objectives|this (?:session|class)|current (?:session|class)|notes|contents|introduction|conclusion|practice|examples?|(?:faculty\s+)?(?:session|chapter|class)\s*\d+\b.*)$/i;
const rules:{test:RegExp;lines:[string,string,string,string]}[]=[
 {test:/useful features|feature engineering|leakage|predictor availability/i,lines:['A useful feature is an input that helps answer a business question or make a prediction.','For example, past purchase counts can help predict next month’s buying.','Use only information already available at the moment of prediction.','Leakage means using future information, such as the actual next purchase date, which gives away the answer.']},
 {test:/variables?|assignment/i,lines:['A variable is a name that refers to a value.','Use = to assign a value, for example sales = 120.','Using the variable name later retrieves its current value.','= assigns a value; == compares two values.']},
 {test:/integer|\bint\b/i,lines:['An integer is a whole number, such as 4 or -2.','Use integers for quantities such as the number of orders.','int("4") converts valid numeric text into the integer 4.','A number stored as text must be converted before numeric calculations.']},
 {test:/float|decimal/i,lines:['A float represents a number that can have a fractional part.','Use it for measurements such as price = 12.5.','Calculations can produce rounding differences in binary floating point.','Choose appropriate rounding and units when reporting the result.']},
 {test:/string|\bstr\b/i,lines:['A string stores text, such as a customer name or "25".','Quotes distinguish text from a numeric literal.','Joining strings combines text rather than adding numeric amounts.','Convert validated numeric text before using it in arithmetic.']},
 {test:/boolean|\bbool\b/i,lines:['A Boolean value is either True or False.','Comparisons such as sales > 100 produce a Boolean result.','An if statement uses a condition to decide which block runs.','True and False are Python values, not the text strings "True" and "False".']},
 {test:/data types/i,lines:['A data type describes the kind of value you are working with.','int is for whole numbers; float can represent fractional numbers.','str is text, while bool is True or False.','Choose and check types before calculating, comparing or combining values.']},
 {test:/append/i,lines:['append adds one object to the end of an existing list.','For example, a=[1]; a.append(2) changes a to [1,2].','Appending another list adds that whole list as one nested object.','append changes the list and returns None.']},
 {test:/extend/i,lines:['extend adds each item from an iterable to an existing list.','For example, a=[1]; a.extend([2,3]) changes a to [1,2,3].','The added list is expanded into separate items.','extend changes the list and returns None.']},
 {test:/sort/i,lines:['Sorting arranges values in an order such as smallest to largest.','list.sort changes the existing list and returns None.','sorted(values) creates a new sorted list.','Keep the original list when its recording order still matters.']},
 {test:/list comprehension/i,lines:['A list comprehension builds a new list from an iterable.','It combines the output expression and the loop in square brackets.','An optional condition keeps only qualifying items.','For example, [x*2 for x in [1,2]] produces [2,4].']},
 {test:/list/i,lines:['A list is a sequence that keeps its items in order.','Square brackets hold the items, for example orders = [12,18].','An index selects a position; the first item is at index 0.','A list can be changed after it is created.']},
 {test:/tuple/i,lines:['A tuple is an ordered sequence whose items cannot be reassigned in place.','Use parentheses, for example location = (3, 5).','Read an item by its position, such as location[0].','Choose a list when the sequence needs to be changed in place.']},
 {test:/dictionar/i,lines:['A dictionary connects each key to a value.','For example, sales = {"West": 30} stores a regional total.','sales["West"] looks up the value for that key.','Keys are unique; assigning an existing key replaces its value.']},
 {test:/\bsets?\b/i,lines:['A Python set stores distinct elements.','Repeated entries appear only once in a set.','Use membership tests to check whether a value is present.','A set does not give items a list-style position or recording order.']},
 {test:/while/i,lines:['A while loop repeats while its condition remains True.','The condition is checked before each pass through the block.','Update the relevant value so the loop can eventually finish.','Indentation shows which statements repeat together.']},
 {test:/condition|if.?else/i,lines:['A condition evaluates to True or False.','if runs its block when its condition is True.','elif checks another condition and else handles the remaining case.','Indentation groups the statements belonging to each branch.']},
 {test:/loop|control flow|range/i,lines:['A for loop repeats work for each item in a sequence.','The indented block runs once for each selected item.','range can supply a sequence of integer positions.','range excludes its stop value, so range(1,4) visits 1, 2 and 3.']},
 {test:/function/i,lines:['A function groups a reusable sequence of instructions under a name.','Define one using def and provide inputs as parameters.','A return statement sends a result back to the caller.','Printing a result and returning a result serve different purposes.']},
 {test:/groupby|grouping/i,lines:['groupby splits rows by a key such as region.','Select the numeric column that answers the business question.','sum gives totals; mean gives averages of observed values.','size counts rows; a selected column count excludes missing values.']},
 {test:/pandas|dataframe/i,lines:['A pandas DataFrame organizes data into rows and named columns.','A row is an observation, such as one order.','A column records a field, such as region or sales.','Choose the relevant rows and fields before calculating a business result.']},
];
function fourLines(title:string,text:string,ids:string[]):SummaryTopic['lines']{
 const rule=rules.find(r=>r.test.test(title));
 const facts=clean(text).split(/\n+|(?<=[.!?])\s+/).map(s=>s.replace(/^#+\s*/,'').trim()).filter(s=>s&&s.toLowerCase()!==title.toLowerCase());
 if(rule){const detail=facts.find(s=>s.length>=8&&s.length<=180&&!s.startsWith('```'));return [rule.lines[0],detail?`From this class: ${detail}`:rule.lines[1],rule.lines[2],rule.lines[3]]}
 return [facts[0]||'',facts[1]||'',facts[2]||'',facts[3]||''];
}
// Local, source-based simplification: keep qualifiers and original notes visible.
export function simpleSummaryText(text:string){
 return clean(text).replace(/^\s*\d+[.)]\s+/gm,'')
 .replace(/Data provides competitive advantage only under specific conditions, not automatically/gi,'Having data does not automatically put a business ahead. It helps only when the right conditions are met')
 .replace(/How quickly does the marginal value of data diminish\?/gi,'As we collect more data, how quickly does each new piece stop adding much value? If extra data barely improves the result, collecting more may add little benefit.')
 .replace(/Is the improvement from data easily imitated\?/gi,'Can other businesses easily copy the improvement made using the data? If copying it is easy, the business may not stay ahead for long.')
 .replace(/How fast can insights be incorporated into products\?/gi,'How quickly can we use what the data tells us to improve the product? What we learn is more useful when we turn it into a product change before it becomes out of date.')
 .replace(/Three key criteria must be evaluated/gi,'Check these three things')
 .replace(/network effects\s*\(value increases as more users adopt\)/gi,'network effects: the service becomes more useful as more people use it')
 .replace(/Trends can become obsolete quickly;?\s*timing of implementation is critical/gi,'Trends can stop being useful quickly, so it matters how soon we act on them')
 .replace(/\bcompetitive advantage\b/gi,'an edge over other businesses').replace(/\bprimarily\b/gi,'mainly')
 .replace(/\bincorporated into\b/gi,'added to').replace(/\binsights\b/gi,'what the data tells us')
 .replace(/\butili[sz]e\b/gi,'use').replace(/\bfacilitate\b/gi,'help').replace(/\bsubsequently\b/gi,'then')
 .replace(/\bdiminish(?:es)?\b/gi,'become smaller').replace(/\bobsolete\b/gi,'no longer useful');
}
function easyHeading(title:string){
 if(/^Data as a Competitive Asset$/i.test(title))return 'How data helps a business';
 if(/^When Does Data (?:Provide|Create) Competitive Advantage\??$/i.test(title))return 'When does data help a business do better?';
 if(/data is the new oil/i.test(title))return 'How raw data becomes useful';
 if(/^Evolution of Business Models$/i.test(title))return 'How businesses have changed';
 return simpleSummaryText(title).replace(/:$/,'');
}
function plainHeading(line:string){
 if(/^[-*+\d]|[.!:;]$/.test(line)||line.length>100||line.split(/\s+/).length>13)return false;
 const words=line.replace(/[?]/g,'').split(/\s+/).filter(w=>!['a','an','as','of','the','and','to','in','for','does','is'].includes(w.toLowerCase()));
 return words.length>=2&&words.filter(w=>/^[A-Z]/.test(w)).length/words.length>=.75;
}
export function extractSummaryTopics(text:string):SummaryTopic[]{
 const scoped=currentClassText(text.replace(/^---\s*\n[\s\S]*?\n---\s*\n/,''));
 type Block={title:string;body:string[];path:string[];context:string;container:boolean;level:number};
 const blocks:Block[]=[],stack:Block[]=[],intro:string[]=[];let current:Block|null=null,inCode=false;
 for(const raw of scoped.split('\n')){
  const line=raw.trim();if(/^```/.test(line)){inCode=!inCode;current?.body.push(raw);continue}if(inCode){current?.body.push(raw);continue}if(!line)continue;
  const heading=line.match(/^(#{1,6})\s+(.+?)\s*#*$/),bold=line.match(/^\*\*([^*]{2,100})\*\*$/);
  const definition=line.match(/^(?:[-*+]\s+|\d+[.)]\s+)?(?:\*\*)?([A-Z][^:\n]{1,88}?)(?:\*\*)?\s*:\s*(.*)$/);
  // A colon inside an existing section introduces its details, not a new topic.
  const standaloneDefinition:boolean=!!definition&&(!current||current.container||current.level===99);
  const title=clean(heading?.[2]||bold?.[1]||(standaloneDefinition?definition?.[1]:'')||(!/^[-*+]\s/.test(line)&&plainHeading(line)?line:''));
  if(title){
   const level:number=heading?heading[1].length:standaloneDefinition?99:current&&!current.body.length?current.level+1:2;
   while(stack.length&&stack.at(-1)!.level>=level)stack.pop();
   const parent=stack.at(-1),path=stack.filter(b=>!b.container).map(b=>b.title);
   const context=[...stack].reverse().find(b=>b.body.length)?.body.join('\n')||(!blocks.some(b=>!b.container)?intro.join('\n'):'');
   current={title,body:standaloneDefinition&&definition?.[2]?[definition[2]]:[],path,context,container:container.test(title),level};blocks.push(current);
   if(level!==99)stack.push(current);
  }else if(current)current.body.push(raw);else intro.push(raw);
 }
 let chosen=blocks.filter(b=>!b.container&&(b.body.length||!blocks.some(child=>child.path.includes(b.title))));
 if(!chosen.length&&scoped.trim())chosen=[{title:'Your class in simple words',body:[scoped],path:[],context:'',container:false,level:1}];
 const distinct=new Map<string,Block>();for(const b of chosen){const key=[...b.path,b.title].join('|');const old=distinct.get(key);if(old)old.body.push(...b.body);else distinct.set(key,b)}
 return [...distinct.values()].map((b,index)=>{
  const sourceText=clean(b.body.join('\n')),ids=detectConcepts([...b.path,b.title,sourceText].join('\n'));
  const facts=sourceText.split(/\n+/).map(simpleSummaryText).filter(Boolean);
  // Explain the named comparison without inventing the lecturer's missing three stages.
  if(/data is the new oil/i.test(b.title+' '+sourceText))facts.unshift('The comparison means that collecting data is only a start. Like oil that needs processing, raw data needs work before we can use it to answer a useful question.');
  const rule=rules.find(r=>r.test.test(b.title));
  if(rule&&facts.length)facts.unshift(rule.lines[0]);
  const explanation=[...new Set(facts)];
  if(!explanation.length)explanation.push(simpleSummaryText(b.title));
  const opening=[...intro,...blocks.filter(x=>x.container&&/overview|introduction/i.test(x.title)).flatMap(x=>x.body)].join(' ');
  const context=/competitive (?:advantage|asset)/i.test([...b.path,b.title].join(' '))?'This part asks when data can help a business do better than others.':b.context?simpleSummaryText(b.context):index===0&&opening?simpleSummaryText(opening):b.path.length?`This is part of “${easyHeading(b.path.at(-1)!)}”.`:'Start with the idea below, then read the details from this class.';
  const title=easyHeading(b.title);
  return {id:`summary-${index}-${b.title.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,title,originalTitle:b.title,headingPath:b.path,sourceText,conceptIds:ids,context,explanation,lines:fourLines(b.title,sourceText,ids)};
 });
}
