import {referencesFor} from './concepts';
import {BookmarkButton} from './components';

export default function SessionReference({ids}:{ids:string[]}){
 const rows=referencesFor(ids);
 return <details className="inline-reference"><summary>Terms &amp; quick reference <span>Open here without losing your answer</span></summary>
 {rows.length?rows.map(r=><details key={r.id} className="reference-entry"><summary>{r.term}<span>{r.type}</span></summary><p>{r.meaning}. Use it for: {r.when}.</p><pre>{r.formula}</pre><p><strong>Example:</strong> {r.input} → {r.output}</p><p><strong>Watch for:</strong> {r.error}</p><div className="reference-source"><span>Source support: {r.source}</span><BookmarkButton id={r.id}/></div></details>):<p>No matching reference entry is available yet.</p>}

 </details>
}
