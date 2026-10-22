export type SpeechResult={isFinal:boolean;[n:number]:{transcript:string}};
export type Recognition={lang:string;continuous:boolean;interimResults:boolean;onstart:(()=>void)|null;onresult:((e:{results:ArrayLike<SpeechResult>})=>void)|null;onerror:((e:{error:string})=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void;abort:()=>void};
export type SpeechConstructor=new()=>Recognition;
export function speechError(code:string){
 if(code==='not-allowed'||code==='service-not-allowed')return 'Microphone permission was denied. Keep typing, or allow the microphone in this site’s browser settings and try again.';
 if(code==='no-speech')return 'No speech was detected. Check that your microphone is unmuted, then try again or type your answer.';
 if(code==='audio-capture')return 'No working microphone was found. Check your device connection, or type your answer.';
 if(code==='network')return 'The browser’s speech service could not connect. Check your connection or use typing; your answer is saved.';
 if(code==='language-not-supported')return 'This speech language is unavailable. Try another language or type your answer.';
 return 'Speech input stopped. Your answer is saved; you can type or try the microphone again.';
}
// Replace interim hypotheses instead of repeatedly appending them to the saved answer.
export function startDictation(Speech:SpeechConstructor,base:string,lang:string,onText:(text:string)=>void,onStatus:(state:'connecting'|'listening'|'idle',message:string)=>void){
 const r=new Speech();let ended=false,failed=false,heard=false;
 let timeout:ReturnType<typeof setTimeout>|undefined;
 const clear=()=>clearTimeout(timeout);
 const fail=(message:string)=>{ended=true;clear();r.abort();onStatus('idle',message);};
 r.lang=lang;r.continuous=true;r.interimResults=true;
 onStatus('connecting','Connecting to the microphone… Allow access if your browser asks.');
 r.onstart=()=>{clear();if(!ended)onStatus('listening','Listening — speak now. Your words will appear in the answer box. Press Stop speaking when finished.');};
 r.onresult=e=>{if(ended||failed)return;const words=Array.from(e.results).map(result=>result[0].transcript).join(' ').trim();if(words){heard=true;onText((base.trim()+' '+words).trim().slice(0,50000));}};
 r.onerror=e=>{if(ended)return;failed=true;clear();onStatus('idle',speechError(e.error));};
 r.onend=()=>{if(ended)return;ended=true;clear();if(!failed)onStatus('idle',heard?'Speech finished. Read and correct your words before checking your answer.':'No words were received. Check your microphone or type your answer.');};
 try{r.start();if(!ended)timeout=setTimeout(()=>fail('The microphone did not start. Check the site’s microphone permission and your device, or type your answer.'),12000)}catch{failed=true;ended=true;onStatus('idle','The microphone could not start. Type your answer, or try again.');}
 return {stop:()=>{if(ended)return;clear();try{r.stop();if(!ended)timeout=setTimeout(()=>fail('Microphone stopped. Your received words are saved; you can edit them now.'),2000)}catch{fail('Microphone stopped. You can edit your answer now.');}},dispose:()=>{ended=true;clear();r.onstart=null;r.onresult=null;r.onerror=null;r.onend=null;r.abort();}};
}
