import assert from 'node:assert/strict';
import {nodes,edges,programs,schools,related,evaluate,emptyFilters,emptyExtras,classify,comparableTuition} from '../src/focus/focus-model.js';
import rel from '../src/data/relations.json';
const idSet=new Set(nodes.map(n=>n.id));
assert.equal(programs.length,767);
for(const e of edges){assert(idSet.has(e.source));assert(idSet.has(e.target));}
for(const e of edges.filter(e=>e.kind==='similarity')){
 const i=rel.ids.indexOf(e.source),j=rel.ids.indexOf(e.target);
 const original=[...(rel.programs[i]??[]).filter(([k])=>k===j),...(rel.programs[j]??[]).filter(([k])=>k===i)].map(([,w])=>w);
 assert.equal(e.weight,Math.max(...original),'No flattening of graph weights');
}
for(const e of edges.filter(e=>e.kind==='school-similarity')){
 assert(e.evidence.pairs.length>0);
 for(const [a,b] of e.evidence.pairs){assert(rel.ids.includes(a));assert(rel.ids.includes(b));}
 assert(e.evidence.total>=e.evidence.pairs.length,'Total includes sampled program-pair evidence');
}
const base={id:'fixture',name:'Interface Design',p:{name:'Interface Design',degree:'Master of Arts',language:'',details:{}},u:{id:'school',name:'Test school',state:'Berlin',type:'university',programs:[]}};
const f={...emptyFilters(),language:'English'};
assert.equal(evaluate(base,f).state,'unknown');
assert.equal(evaluate({...base,p:{...base.p,language:'German'}},f).state,'outside');
assert.equal(evaluate({...base,p:{...base.p,language:'English'}},f).state,'scope');
assert.equal(evaluate(base,{...f,state:'Bavaria'}).state,'outside','A known conflict cannot be rescued by an unknown language');
assert.equal(evaluate(base,emptyFilters(),{...emptyExtras(),portfolio:'yes'}).state,'unknown');
assert.equal(evaluate({...base,p:{...base.p,details:{portfolioRequired:false}}},emptyFilters(),{...emptyExtras(),portfolio:'yes'}).state,'outside');
assert.equal(comparableTuition({...base,p:{...base.p,fees:[{kind:'tuition',euros:250,period:'semester',appliesTo:'EU students'}]}}),null,'Scoped tuition is not universal');
assert.equal(comparableTuition({...base,p:{...base.p,details:{tuitionEuroPerSemester:0},fees:[{kind:'tuition',euros:250,period:'month',appliesTo:'all students'}]}}),null,'No guessed conversions or stale semester fallback');
assert.equal(comparableTuition({...base,p:{...base.p,fees:[{kind:'tuition',euros:250,period:'semester',appliesTo:'not all students'}]}}),null,'Negated universal scope stays unknown');
assert.equal(comparableTuition({...base,p:{...base.p,fees:[{kind:'tuition',euros:250,period:'semester',appliesTo:'all students'}]}}),250);
assert.equal(comparableTuition({...base,u:{...base.u,nonEuTuition:{perSemester:'€1,500'}},p:{...base.p,details:{tuitionEuroPerSemester:0}}}),null,'Non-EU tuition is not a universal €0');
assert(schools.filter(u=>u.founded).length>=90,'Founding years come from stats');
const hfbk=programs.find(n=>n.id==='hochschule-fur-bildende-kunste-hamburg--fine-arts--master-of-fine-arts');
assert.equal(evaluate(hfbk,{...emptyFilters(),program:'Film & Television',degree:'Master'}).state,'scope','Sourced teaching focus remains searchable');
for(const n of programs.filter(n=>!rel.ids.includes(n.id))) assert.equal(related(n.id).length,0,'No invented alternatives');
const cases=[emptyFilters(),{...emptyFilters(),program:'Film & Television',degree:'Master',language:'English'}, {...emptyFilters(),state:'Berlin',type:'music_academy',semester:'winter',method:'direct',nc:true}];
for(const f of cases){const c=classify(f,emptyExtras());assert.equal(c.size,nodes.length);}
console.log(`PASS: ${programs.length} programs; ${edges.filter(e=>e.kind==='similarity').length} original weighted similarity edges; unknowns, scope, sourced focuses, scoped fees, and empty graphs checked.`);
