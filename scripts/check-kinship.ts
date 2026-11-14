import assert from 'node:assert/strict';
import {programs,edges} from '../src/focus/focus-model.js';
import {build,short} from '../src/atlas/kinship.js';
const famOf=()=>'art';
const cross=edges.filter(e=>e.kind==='similarity').filter(e=>programs.find(n=>n.id===e.source)?.u.id!==programs.find(n=>n.id===e.target)?.u.id);
for(const order of ['kinship','north']){
 const k=build(programs,famOf,order);
 assert.equal(new Set(k.list.map(s=>s.u.id)).size,k.list.length,'Each school appears once');
 assert.equal(k.list.length,k.schools.size,'Ordering keeps every linked school');
 assert.equal([...k.pairs.values()].reduce((t,r)=>t+r.list.length,0),cross.length,'Every cross-school similarity edge counted once');
 for(const r of k.pairs.values()) assert(r.a.id<r.b.id&&r.list.every(([p,q])=>p.u.id===r.a.id&&q.u.id===r.b.id));
}
// Filtering drops pairs whose programs are hidden.
const film=programs.filter(n=>/film/i.test(n.name));
for(const r of build(film,famOf,'kinship').pairs.values()) assert(r.list.every(([p,q])=>film.includes(p)&&film.includes(q)));
assert.equal(short({name:'Hochschule für Künste Bremen'}),'HfK Bremen');
console.log('kinship ok');
// Chronology: sorted by founding year, undated schools named rather than dropped.
import {chronologyView} from '../src/atlas/plates.js';
const html=chronologyView({base:programs,famOf,city:null,W:1000});
const years=[...html.matchAll(/class="yr" dx="4">(\d+)</g)].map(m=>+m[1]);
assert.deepEqual(years,[...years].sort((a,b)=>a-b),'Rows run oldest to newest');
assert.match(html,/No founding year recorded: TU Chemnitz/);
console.log('chronology ok');
