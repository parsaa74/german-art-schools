import raw from '../data/enhanced_german_art_schools.json';
import relations from '../data/relations.json';
import { matchingPrograms, passesFilters } from '../lib/glass/filter.ts';
import { normalizeSchoolType, fold, degreeGroupOf, admissionOf, programSearchMatch } from '../lib/taxonomy.ts';
import { getNextDeadline } from '../utils/deadlineUtils.ts';

export const emptyFilters = () => ({search:'',state:null,program:null,type:null,semester:null,nc:null,method:null,language:null,degree:null,timeline:null});
export const emptyExtras = () => ({portfolio:'',tuition:'',window:''});
export const schools = Object.entries(raw.universities).map(([name,u]) => ({...u,name,type:normalizeSchoolType(u.type),founded:u.stats?.founded?String(u.stats.founded):undefined}));
export const programs = schools.flatMap(u => matchingPrograms(u,emptyFilters()).map(p => ({id:p.program_id,name:p.name,kind:'program',p,u})));
export const programById = new Map(programs.map(p=>[p.id,p]));
export const schoolNodes = schools.map(u=>({id:`school:${u.id}`,name:u.name,kind:'school',u}));
export const nodes = [...schoolNodes,...programs];
export const nodeById = new Map(nodes.map(n=>[n.id,n]));

// Undirected evidence edges. Scores stay untouched; missing embeddings get no invented alternatives.
const dedup = new Map();
function add(a,b,kind,weight,evidence) {
  if(!nodeById.has(a)||!nodeById.has(b)||a===b) return;
  const key=[a,b].sort().join('|')+'|'+kind;
  if(!dedup.has(key)||dedup.get(key).weight<weight) dedup.set(key,{source:a,target:b,kind,weight,evidence});
}
for(const n of programs) add(n.id,`school:${n.u.id}`,'membership',1,null);
relations.ids.forEach((id,i)=>(relations.programs[i]??[]).forEach(([j,w])=>add(id,relations.ids[j],'similarity',w,{method:relations.method})));
for(const [id,links] of Object.entries(relations.schools)) for(const r of links) add(`school:${id}`,`school:${r.s}`,'school-similarity',r.t,{pairs:r.p.map(([a,b])=>[relations.ids[a],relations.ids[b]]),total:r.total??r.p.length,method:relations.method});
export const edges=[...dedup.values()];
export const adjacency=new Map(nodes.map(n=>[n.id,[]]));
for(const e of edges) {adjacency.get(e.source).push({id:e.target,...e});adjacency.get(e.target).push({id:e.source,...e});}

export function comparableTuition(n) {
  // Don't convert monthly/annual fees or collapse citizenship-specific rates into a universal price.
  if(n.u.nonEuTuition) return null;
  const entries=[...(n.p.fees??[]),...(n.u.fees??[])];
  const tuition=entries.filter(f=>f.kind==='tuition');
  if(tuition.some(f=>!/^(?:all (?:students|applicants)|everyone)$/i.test((f.appliesTo??'').trim())||f.period!=='semester'||typeof f.euros!=='number')) return null;
  const amounts=tuition.map(f=>f.euros);
  if(amounts.length) return Math.max(...amounts);
  const amount=n.p.details?.tuitionEuroPerSemester;
  return typeof amount==='number'&&!entries.some(f=>f.kind==='non-eu-tuition') ? amount : null;
}

export function evaluate(n,filters,extras=emptyExtras()) {
  // One program must satisfy all constraints. Uncertainty isn't a fraction of "fit".
  const p=n.p,u=n.u,f={...filters};
  const gaps=[];
  if(f.language&&!p.language) {gaps.push('teaching language');f.language=null;}
  if(f.degree&&!degreeGroupOf(p.degree)) {gaps.push('degree');f.degree=null;}
  if(f.method&&!(p.applicationMethods?.length||u.applicationMethod)) {gaps.push('application route');f.method=null;}
  if(f.semester&&!(p.intakes?.length||p.applicationDeadlines?.winter||p.applicationDeadlines?.summer||p.otherDeadlines?.some(d=>d.kind==='application'))) {gaps.push('intake');f.semester=null;}
  if(f.nc&&!p.admission&&!admissionOf(p,u.type)) {gaps.push('admission');f.nc=null;}
  if(f.timeline&&!u.founded) {gaps.push('founding year');f.timeline=null;}
  // Exact same shared predicate as the app; use a singleton to avoid matching sibling programmes.
  const single={...u,programs:[p]};
  if(!passesFilters(single,f)||!matchingPrograms(single,f).length) return {state:'outside',gaps};
  if(f.search) {
    const schoolText=fold([u.name,u.city,u.state].join(' '));
    if(!schoolText.includes(fold(f.search))&&!programSearchMatch(p,f.search).score) return {state:'outside',gaps};
  }
  if(extras.portfolio) {
    const required=p.details?.portfolioRequired;
    if(required==null) gaps.push('portfolio');
    else if(required!==(extras.portfolio==='yes')) return {state:'outside',gaps};
  }
  if(extras.tuition!=='') {
    const cost=comparableTuition(n);
    if(cost==null) gaps.push('comparable tuition');
    else if(cost>Number(extras.tuition)) return {state:'outside',gaps};
  }
  if(extras.window) {
    const next=getNextDeadline(p.applicationDeadlines??{});
    if(!next) gaps.push('application window');
    else if(next.status.status==='closed'||(next.status.status==='upcoming'&&next.status.daysRemaining>Number(extras.window))) return {state:'outside',gaps};
  }
  return {state:gaps.length?'unknown':'scope',gaps};
}

export function classify(filters,extras) {
  const result=new Map(programs.map(n=>[n.id,evaluate(n,filters,extras)]));
  for(const school of schoolNodes) {
    const children=programs.filter(n=>n.u.id===school.u.id).map(n=>result.get(n.id));
    result.set(school.id,{state:children.some(x=>x.state==='scope')?'scope':children.some(x=>x.state==='unknown')?'unknown':'outside',gaps:[]});
  }
  return result;
}

export function related(id) {
  return (adjacency.get(id)??[]).filter(e=>e.kind==='similarity'||e.kind==='school-similarity');
}
