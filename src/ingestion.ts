import { type Material } from './core';
export async function ingestFile(file:File):Promise<Material>{
 if(file.size>20*1024*1024)throw Error('Limit 20 MB per local import. Split or export a smaller text file.');
 const bytes=await file.arrayBuffer(),sha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
 const base={id:`upload-${sha256}`,name:file.name,sha256,at:Date.now()};
 const ext=file.name.split('.').pop()?.toLowerCase();
 if(ext==='pdf'){
  const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc=new URL('pdfjs-dist/build/pdf.worker.min.mjs',import.meta.url).toString();
  const pdf=await pdfjs.getDocument({data:bytes}).promise,chunks=[];
  for(let p=1;p<=pdf.numPages;p++){const page=await pdf.getPage(p),content=await page.getTextContent();chunks.push({locator:`page ${p} · figures/tables require visual review`,text:content.items.map(x=>'str' in x?x.str:'').join(' ')})}
  return {...base,status:chunks.some(c=>!c.text.trim())?'partial · image/OCR review needed':'text extracted · figures need review',chunks};
 }
 if(ext==='docx'){
  const {unzipSync,strFromU8}=await import('fflate');const zip=unzipSync(new Uint8Array(bytes));if(!zip['word/document.xml'])throw Error('DOCX document.xml missing');
  const doc=new DOMParser().parseFromString(strFromU8(zip['word/document.xml']),'application/xml');if(doc.querySelector('parsererror'))throw Error('Invalid DOCX XML');
  const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main',body=doc.getElementsByTagNameNS(ns,'body')[0];
  const textOf=(el:Element)=>[...el.getElementsByTagNameNS(ns,'t')].map(t=>t.textContent||'').join('');
  const chunks=[...body.children].filter(el=>['p','tbl'].includes(el.localName)).map((el,i)=>({locator:`block ${i+1} (${el.localName})`,text:textOf(el),...(el.localName==='tbl'?{rows:[...el.getElementsByTagNameNS(ns,'tr')].map(r=>[...r.getElementsByTagNameNS(ns,'tc')].map(textOf))}:{})}));
  return {...base,status:'paragraphs and table rows extracted · figures/merged cells need review',chunks};
 }
 if(['txt','md','json'].includes(ext||'')){
  const text=new TextDecoder().decode(bytes);if(ext==='json')JSON.parse(text);
  return {...base,status:'extracted · content not automatically validated for exams',chunks:text.split(/(?=^#{1,4} )/m).map((text,i)=>({locator:`section ${i+1}`,text}))};
 }
 throw Error(ext==='pbix'?'PBIX requires local metadata extraction. Export CSV/screenshots/PBIP; the compressed model is not supported in the browser.':'Supported: PDF, DOCX, MD, TXT, JSON. Use Chart Lab for CSV.');
}
