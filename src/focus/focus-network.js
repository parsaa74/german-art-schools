import { forceSimulation, forceManyBody, forceLink, forceCollide, forceX, forceY } from 'd3-force';
import {nodes,edges,programs,schools,nodeById,adjacency,related,emptyFilters,emptyExtras,classify} from './focus-model.js';
import { SUBJECT_GROUPS,DEGREE_GROUPS,LANGUAGES,SCHOOL_TYPES,typeLabel,degreeAbbrev,feeLine,admissionOf,ADMISSION_LABELS } from '../lib/taxonomy.ts';
import { getNextDeadline } from '../utils/deadlineUtils.ts';
import { programLinks } from '../lib/programLinks.ts';
import { installKeeping,keptNode } from './focus-kept.js';

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const motion=matchMedia('(prefers-reduced-motion: reduce)');
let filters=emptyFilters(),extras=emptyExtras(),states=classify(filters,extras),mode='program',selected=null,hovered=null,listOpen=false;
let highlight=new Map(),drag=null,pointers=new Map(),pinch=null,labelTargets=[];
const fonts=['Apfel','Redaction','Bagnard'];let font=0;
const canvas=$('field'),ctx=canvas.getContext('2d');
let W=innerWidth,H=innerHeight,top=190,bottom=H-100,last=0,needsDraw=true,initialFit=true;
const camera={x:0,y:0,k:1},tilt={x:0,y:0,tx:0,ty:0};
const keeping=installKeeping({getSelected:()=>selected,showDetails:openDetails,onChange:()=>{needsDraw=true;if(listOpen)renderList();}});
const seeded=id=>{let h=2166136261;for(const c of id)h=Math.imul(h^c.charCodeAt(0),16777619);return(h>>>0)/4294967296;};
// Seeds only initialise physics; membership and the existing edges determine the shape, never a fit score.
for(const n of nodes){n.z=(seeded(n.id+'z')-.5)*2;n.phase=seeded(n.id)*6.28;n.anchorX=(seeded(n.u.id+'x')-.5)*1300;n.anchorY=(seeded(n.u.id+'y')-.5)*1100;
 n.x=n.anchorX+(seeded(n.id+'dx')-.5)*110;n.y=n.anchorY+(seeded(n.id+'dy')-.5)*110;}
const physicsEdges=edges.map(e=>({...e}));
const simulation=forceSimulation(nodes).stop().alphaDecay(.033).velocityDecay(.42)
 .force('charge',forceManyBody().strength(n=>n.kind==='school'?-85:-16))
 .force('links',forceLink(physicsEdges).id(n=>n.id)
   .distance(e=>e.kind==='membership'?36:e.kind==='similarity'?70+110*(1-e.weight):180)
   .strength(e=>e.kind==='membership'?.3:e.kind==='similarity'?.07*e.weight:.006*e.weight))
 .force('collision',forceCollide(n=>n.kind==='school'?13:7).iterations(1))
 .force('x',forceX(n=>n.anchorX).strength(n=>n.kind==='school'?.018:.001))
 .force('y',forceY(n=>n.anchorY).strength(n=>n.kind==='school'?.018:.001));

function layout(){W=innerWidth;H=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
 const header=$('header').getBoundingClientRect().bottom;$('map-controls').style.top=`${header+6}px`;top=header+105;$('legend').style.top=`${header+54}px`;
 bottom=H-$('footer').offsetHeight-8;$('list').style.top=`${header+8}px`;needsDraw=true;}
function project(n){const s=1/(1+n.z*.13);return{x:W/2+(n.x-camera.x)*camera.k*s+tilt.x*n.z*20,y:(top+bottom)/2+(n.y-camera.y)*camera.k*s+tilt.y*n.z*20};}
function world(x,y,n){const s=n?1/(1+n.z*.13):1;return{x:camera.x+(x-W/2-(n?tilt.x*n.z*20:0))/(camera.k*s),y:camera.y+(y-(top+bottom)/2-(n?tilt.y*n.z*20:0))/(camera.k*s)};}
function reframe(ns=nodes.filter(n=>n.kind===mode&&states.get(n.id).state!=='outside')){if(!ns.length)ns=nodes.filter(n=>n.kind===mode);const xs=ns.map(n=>n.x),ys=ns.map(n=>n.y);const l=Math.min(...xs),r=Math.max(...xs),t=Math.min(...ys),b=Math.max(...ys);
 camera.x=(l+r)/2;camera.y=(t+b)/2;camera.k=Math.min(2.5,(W-55)/Math.max(120,r-l),(bottom-top-36)/Math.max(120,b-t));camera.k=Math.max(.07,camera.k);needsDraw=true;}
function reframeThread(){const ns=[selected,...related(selected.id).map(e=>nodeById.get(e.id))];camera.x=selected.x;camera.y=selected.y;const rx=Math.max(60,...ns.map(n=>Math.abs(n.x-selected.x)/(1+n.z*.13))),ry=Math.max(60,...ns.map(n=>Math.abs(n.y-selected.y)/(1+n.z*.13)));camera.k=Math.max(.07,Math.min(2.5,(W-90)/(2*rx),(bottom-top-70)/(2*ry)));needsDraw=true;}
function zoom(factor,x=W/2,y=(top+bottom)/2){const before=world(x,y);camera.k=Math.max(.07,Math.min(5,camera.k*factor));const after=world(x,y);camera.x+=before.x-after.x;camera.y+=before.y-after.y;needsDraw=true;}
function visible(n){return n.kind===mode||selected===n||(selected?.kind==='school'&&n.kind==='program'&&n.u.id===selected.u.id)||(selected?.kind==='program'&&highlight.has(n.id));}
function refreshHighlight(){highlight=new Map();if(selected)for(const e of adjacency.get(selected.id)??[])highlight.set(e.id,e);}
function select(id){selected=nodeById.get(id)??null;refreshHighlight();renderPeek();if(selected){initialFit=false;reframeThread();}needsDraw=true;}
function renderPeek(){keeping.refresh();const peek=$('peek');peek.hidden=!selected;if(!selected){$('context').textContent='Explore a practice, not a verdict.';layout();return;}
 const state=states.get(selected.id);$('peek-kind').textContent=state.state==='outside'?'Outside your current constraints — still explorable':state.state==='unknown'?'Some facts are not confirmed':'Within the documented constraints — not a personal recommendation';
 $('peek-title').textContent=selected.name;$('peek-school').textContent=selected.kind==='program'?[degreeAbbrev(selected.p.degree),selected.u.name,selected.u.city].filter(Boolean).join(' · '):[selected.u.city,selected.u.state,typeLabel(selected.u.type)].filter(Boolean).join(' · ');
 const links=related(selected.id);$('peek-evidence').textContent=links.length?`${links.length} computational ${selected.kind==='school'?'text-overlap threads':'similarity threads'}. Not a claim of shared curriculum, affiliation or admission.`:'No similarity links recorded yet. That is a data gap, not evidence that this stands alone.';
 $('context').textContent='Follow a thread. Leave room for another possibility.';layout();}
$('details').onclick=()=>selected&&openDetails(selected);$('clear-selection').onclick=()=>select(null);
function setMode(value){mode=value;$('legend-meaning').textContent=mode==='school'?'Program-text overlap':'Textual resemblance';$('legend-detail').textContent=mode==='school'?'School threads come from computed program pairs, not partnerships.':'Tentative textual connections, not personal compatibility.';$('program-mode').setAttribute('aria-pressed',mode==='program');$('school-mode').setAttribute('aria-pressed',mode==='school');if(selected&&selected.kind!==mode)select(null);reframe();needsDraw=true;}
$('program-mode').onclick=()=>setMode('program');$('school-mode').onclick=()=>setMode('school');
$('zoom-in').onclick=()=>zoom(1.3);$('zoom-out').onclick=()=>zoom(1/1.3);$('reset-view').onclick=()=>selected?reframeThread():reframe();

// View uses fibers rather than a ring: program marks can move and stretch with the real network.
function render(time){ctx.globalAlpha=1;ctx.fillStyle='#121110';ctx.fillRect(0,0,W,H);
 const screen=new Map(nodes.map(n=>[n.id,project(n)]));
 const focus=hovered??selected;
 for(const e of edges){const a=nodeById.get(e.source),b=nodeById.get(e.target);const active=focus&&(e.source===focus.id||e.target===focus.id);
   const onMode=mode==='school'?e.kind==='school-similarity':e.kind==='similarity';
   if(!active&&!onMode)continue;if(!visible(a)||!visible(b))continue;
   const pa=screen.get(a.id),pb=screen.get(b.id);if(!active&&camera.k<.16)continue;
   const outside=states.get(a.id).state==='outside'||states.get(b.id).state==='outside';
   ctx.globalAlpha=active?.4+.5*(e.kind==='similarity'?e.weight:e.kind==='school-similarity'?e.weight/3:1):outside?.016:focus?.018:.075;
   ctx.strokeStyle=e.kind==='membership'?'#b2aaa0':'#c2d1b4';ctx.lineWidth=active?1.25:.65;ctx.setLineDash(e.kind==='membership'?[2,5]:[]);
   ctx.beginPath();ctx.moveTo(pa.x,pa.y);const bend=(a.z-b.z)*8;ctx.quadraticCurveTo((pa.x+pb.x)/2+bend,(pa.y+pb.y)/2-bend,pb.x,pb.y);ctx.stroke();
 }
 ctx.setLineDash([]);
 const ordered=nodes.filter(visible).sort((a,b)=>b.z-a.z);
 for(const n of ordered){const p=screen.get(n.id);n.screen=p;if(p.x<-40||p.x>W+40||p.y<top-35||p.y>bottom+20)continue;
   const state=states.get(n.id).state,important=n===selected||n===hovered,near=highlight.has(n.id);
   const r=important?11:n.kind==='school'?7:state==='scope'?3.5:2.6;
   ctx.globalAlpha=important?1:near?.9:focus?(state==='outside'?.04:.12):state==='outside'?.13:state==='unknown'?.48:.8;
   ctx.strokeStyle=state==='unknown'?'#c1a782':near||important?'#dce7ce':'#e6ded2';
   if(important||near){ctx.save();ctx.globalAlpha=important?.19:.07;ctx.fillStyle='#c2d1b4';ctx.beginPath();ctx.ellipse(p.x,p.y,r*3,r*1.8,n.phase,0,6.284);ctx.fill();ctx.restore();}
   ctx.lineWidth=important?1.8:n.kind==='school'?1.3:1.1;
   ctx.beginPath();if(n.kind==='school'){ctx.moveTo(p.x-r,p.y);ctx.bezierCurveTo(p.x-r,p.y-r*1.4,p.x+r*.7,p.y-r,p.x+r,p.y);ctx.bezierCurveTo(p.x+r*.4,p.y+r,p.x-r*.8,p.y+r*.7,p.x-r,p.y);}
   else{const a=n.phase;ctx.moveTo(p.x-Math.cos(a)*r,p.y-Math.sin(a)*r);ctx.quadraticCurveTo(p.x+Math.sin(a)*r*.6,p.y-Math.cos(a)*r*.6,p.x+Math.cos(a)*r,p.y+Math.sin(a)*r);}
   ctx.stroke();if(state==='unknown'){ctx.beginPath();ctx.moveTo(p.x+r+2,p.y-2);ctx.lineTo(p.x+r+2,p.y+2);ctx.stroke();}
 }
 ctx.globalAlpha=1;
 if(focus?.screen){const p=focus.screen;const neighbours=related(focus.id).filter(e=>visible(nodeById.get(e.id)));const marks=[];
  for(const e of neighbours.slice(0,6)){const n=nodeById.get(e.id),q=screen.get(n.id);const label=e.kind==='similarity'?e.weight.toFixed(2):`tier ${e.weight}`;const x=(p.x+q.x)/2,y=(p.y+q.y)/2;if(marks.some(m=>Math.hypot(x-m.x,y-m.y)<24))continue;marks.push({x,y});ctx.font='11px '+getComputedStyle(document.body).fontFamily;ctx.fillStyle='#121110';ctx.fillRect(x-13,y-9,36,15);ctx.fillStyle='#c2d1b4';ctx.fillText(label,x-9,y+2);}
 }
 if(selected)drawThreadLabels(screen);
}
function wrapLabel(text,width){const lines=[];let line='';for(const word of text.split(/\s+/)){const candidate=line?line+' '+word:word;if(ctx.measureText(candidate).width>width&&line){lines.push(line);line=word;}else line=candidate;}if(line)lines.push(line);return lines;}
function drawThreadLabels(screen){
 labelTargets=[];
 const fontFamily=getComputedStyle(document.body).fontFamily;
 const labelLimit=Math.max(2,Math.min(6,Math.floor((bottom-top)/66)*2));
 const threads=related(selected.id).filter(e=>visible(nodeById.get(e.id))).sort((a,b)=>b.weight-a.weight).slice(0,labelLimit);
 const width=Math.min(190,(W-80)/2),height=58;
 const used=[0,0],slots=Math.max(1,Math.floor((bottom-top-28)/66));
 const labels=threads.map(e=>{const n=nodeById.get(e.id),p=screen.get(n.id);return {n,p,side:p.x<W/2?0:1,y:Math.max(top+12,Math.min(bottom-height-8,p.y-20))};}).filter(l=>used[l.side]++<slots);
 for(const side of [0,1]){const column=labels.filter(l=>l.side===side).sort((a,b)=>a.y-b.y);for(let i=1;i<column.length;i++)column[i].y=Math.max(column[i].y,column[i-1].y+height+8);const overflow=column.length?Math.max(0,column.at(-1).y+height-(bottom-8)):0;for(const label of column)label.y=Math.max(top+10,label.y-overflow);}
 for(const {n,p,side,y} of labels){const x=side?W-width-18:18;labelTargets.push({id:n.id,x:x-4,y:y-4,width:width+8,height});ctx.globalAlpha=.65;ctx.strokeStyle='#b7c4ae';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(side?x:x+width,y+17);ctx.stroke();ctx.globalAlpha=.96;ctx.fillStyle='#121110';ctx.fillRect(x-4,y-4,width+8,height);ctx.globalAlpha=1;ctx.font='13px '+fontFamily;ctx.fillStyle='#e6ded2';const lines=wrapLabel(n.name,width);for(let i=0;i<Math.min(2,lines.length);i++)ctx.fillText(lines[i]+(i===1&&lines.length>2?'…':''),x,y+13+i*15,width);ctx.font='11px '+fontFamily;ctx.fillStyle='#a5a298';ctx.fillText(n.u.city||'School',x,y+46,width);}
}
function loop(now){requestAnimationFrame(loop);if(listOpen||document.hidden)return;
 const dt=Math.min(.05,(now-last)/1000||.016);last=now;
 if(simulation.alpha()>.012){simulation.tick(motion.matches?3:1);needsDraw=true;}
 if(initialFit&&simulation.alpha()<.17){reframe();initialFit=false;}
 const k=motion.matches?1:1-Math.exp(-dt*4);tilt.x+=(tilt.tx-tilt.x)*k;tilt.y+=(tilt.ty-tilt.y)*k;
 if(!motion.matches&&Math.abs(tilt.x-tilt.tx)+Math.abs(tilt.y-tilt.ty)>.003)needsDraw=true;
 if(needsDraw){render(now);needsDraw=false;}
}

function pick(x,y){if(selected){const label=labelTargets.find(l=>x>=l.x&&x<=l.x+l.width&&y>=l.y&&y<=l.y+l.height);if(label)return nodeById.get(label.id);}let closest=null,distance=27;for(const n of nodes){if(!visible(n))continue;const p=project(n);if(p.y<top-35||p.y>bottom+20)continue;const d=Math.hypot(p.x-x,p.y-y);if(d<distance){closest=n;distance=d;}}return closest;}
canvas.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);
 if(pointers.size===2){if(drag?.node){drag.node.fx=null;drag.node.fy=null;}drag=null;const ps=[...pointers.values()];pinch={distance:Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y)};return;}
 const n=pick(e.clientX,e.clientY);drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,node:n,moved:false};});
canvas.addEventListener('pointermove',e=>{if(pointers.has(e.pointerId))pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pinch&&pointers.size===2){const ps=[...pointers.values()],d=Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y);zoom(d/pinch.distance,(ps[0].x+ps[1].x)/2,(ps[0].y+ps[1].y)/2);pinch.distance=d;return;}
 if(drag){if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>7)drag.moved=true;
  if(drag.moved&&drag.node){const p=world(e.clientX,e.clientY,drag.node);drag.node.fx=p.x;drag.node.fy=p.y;simulation.alpha(.16);needsDraw=true;}
  else if(drag.moved){camera.x-=(e.clientX-drag.x)/camera.k;camera.y-=(e.clientY-drag.y)/camera.k;needsDraw=true;}
  drag.x=e.clientX;drag.y=e.clientY;return;}
 if(e.pointerType==='mouse'){const n=pick(e.clientX,e.clientY);if(n!==hovered){hovered=n;needsDraw=true;}$('hover-label').hidden=!n;if(n){$('hover-label').textContent=n.name;$('hover-label').style.left=`${Math.max(10,Math.min(W-245,e.clientX+15))}px`;$('hover-label').style.top=`${Math.max(top,e.clientY-45)}px`;}tilt.tx=(e.clientX/W-.5)*2;tilt.ty=(e.clientY/H-.5)*2;needsDraw=true;}});
function endDrag(e){pointers.delete(e.pointerId);if(pinch){if(pointers.size<2)pinch=null;drag=null;return;}if(drag?.node){drag.node.fx=null;drag.node.fy=null;if(e.type!=='pointercancel')select(drag.node.id);}else if(drag&&!drag.moved&&e.type!=='pointercancel')select(null);drag=null;}
canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);canvas.addEventListener('pointerleave',()=>{hovered=null;$('hover-label').hidden=true;needsDraw=true;});
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(-e.deltaY*.001),e.clientX,e.clientY);},{passive:false});
canvas.addEventListener('keydown',e=>{if(e.key==='+'||e.key==='=')zoom(1.15);else if(e.key==='-')zoom(1/1.15);else if(e.key==='Escape')select(null);else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();camera.x+=(e.key==='ArrowLeft'?-40:e.key==='ArrowRight'?40:0)/camera.k;camera.y+=(e.key==='ArrowUp'?-40:e.key==='ArrowDown'?40:0)/camera.k;needsDraw=true;}});

// All the existing constraints, plus explicitly scoped cost / portfolio / application timing.
const option=(value,label=value)=>({value,label});
const definitions=[
 ['search','Search programs or schools','search'],
 ['program','Subject',SUBJECT_GROUPS.map(v=>option(v))],['degree','Degree',DEGREE_GROUPS.map(v=>option(v))],
 ['language','Teaching language',LANGUAGES.map(v=>option(v,v==='English'?'English (including bilingual)':v))],
 ['state','State',[...new Set(schools.map(u=>u.state).filter(Boolean))].sort().map(v=>option(v))],
 ['type','Institution type',Object.keys(SCHOOL_TYPES).map(v=>option(v,typeLabel(v)))],
 ['semester','Intake',[option('winter','Winter'),option('summer','Summer')]],
 ['method','Application route',[option('direct','Direct — validation fees may apply'),option('uni-assist','uni-assist')]],
 ['nc','Admission',[option('yes','No grade cut-off: aptitude / portfolio / open')]],
 ['portfolio','Portfolio',[option('yes','Required'),option('no','Not required (when confirmed)')]],
 ['tuition','Tuition cap, €/semester','number'],['window','Application timing',[option('30','Open now or opens within 30 days'),option('90','Open now or opens within 90 days')]],
 ['founded-start','Founded from (optional)','number'],['founded-end','Founded until (optional)','number']
];
$('fields').innerHTML=definitions.map(([id,label,options])=>`<label for="filter-${id}">${label}${Array.isArray(options)?`<select id="filter-${id}"><option value="">Don't constrain</option>${options.map(o=>`<option value="${esc(o.value)}">${esc(o.label)}</option>`).join('')}</select>`:`<input type="${options}" id="filter-${id}" ${options==='number'?'min="0"':''}>`}</label>`).join('');
function readConstraints(){for(const k of ['search','program','degree','language','state','type','semester','method'])filters[k]=$('filter-'+k).value||(k==='search'?'':null);filters.nc=$('filter-nc').value?true:null;const from=$('filter-founded-start').value,to=$('filter-founded-end').value;filters.timeline=from||to?[Number(from||0),Number(to||3000)]:null;
 for(const k of ['portfolio','tuition','window'])extras[k]=$('filter-'+k).value;states=classify(filters,extras);renderCount();renderPeek();if(listOpen)renderList();needsDraw=true;}
$('filters-open').onclick=()=>$('constraints').showModal();$('filters-close').onclick=()=>$('constraints').close();
$('filter-form').addEventListener('submit',e=>{e.preventDefault();readConstraints();$('constraints').close();if(!listOpen)reframe();});
$('filter-form').addEventListener('change',readConstraints);
$('reset-filters').onclick=()=>{$('filter-form').reset();filters=emptyFilters();extras=emptyExtras();states=classify(filters,extras);renderCount();renderPeek();if(listOpen)renderList();needsDraw=true;};
function renderCount(){const c={scope:0,unknown:0,outside:0};for(const n of programs)c[states.get(n.id).state]++;$('count').textContent=`${c.scope} within constraints · ${c.unknown} not confirmed · ${c.outside} outside (still explorable)`;}
function renderList(){const ordering=$('list-order').value;const comparator=(a,b)=>ordering==='school'?a.u.name.localeCompare(b.u.name)||a.name.localeCompare(b.name):ordering==='deadline'?(getNextDeadline(a.p.applicationDeadlines??{})?.status.daysRemaining??Infinity)-(getNextDeadline(b.p.applicationDeadlines??{})?.status.daysRemaining??Infinity)||a.name.localeCompare(b.name):a.name.localeCompare(b.name)||a.u.name.localeCompare(b.u.name);
 const groups=[['scope','Within the documented constraints'],['unknown','Not confirmed — check the missing facts'],...($('outside-list').checked?[['outside','Outside these constraints']]:[])];
 $('list-content').innerHTML=groups.map(([state,title])=>{const ns=programs.filter(n=>states.get(n.id).state===state).sort(comparator);return `<h2>${title} · ${ns.length}</h2>${ns.map(n=>`<button data-program="${esc(n.id)}"><span class="name">${esc(n.name)}</span><span class="meta">${esc([degreeAbbrev(n.p.degree),n.u.name,n.u.city].filter(Boolean).join(' · '))}${keptNode(n)?' · kept':''}${states.get(n.id).gaps.length?' · Not confirmed: '+esc(states.get(n.id).gaps.join(', ')):''}</span></button>`).join('')||'<p>No programs in this group.</p>'}`;}).join('');}
$('list-content').addEventListener('click',e=>{const b=e.target.closest('button[data-program]');if(b)openDetails(nodeById.get(b.dataset.program));});$('list-order').onchange=renderList;$('outside-list').onchange=renderList;
function setView(list){listOpen=list;$('list').hidden=!list;$('mirror').hidden=list;$('view').textContent=list?'Mirror':'List';$('view').setAttribute('aria-pressed',list);document.body.classList.toggle('listing',list);if(list)renderList();else{last=performance.now();needsDraw=true;}layout();}
$('view').onclick=()=>setView(!listOpen);$('font').onclick=()=>{font=(font+1)%fonts.length;document.body.style.setProperty('--font',fonts[font]);$('font').title=fonts[font];layout();};

function link(url,label){if(!/^https?:\/\//i.test(url??''))return '';return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`;}
function section(title,body){return body?`<h3>${title}</h3>${body}`:'';}
function feeBody(fs){return (fs??[]).map(f=>`<p>${esc(feeLine(f))}${f.notes?' — '+esc(f.notes):''}</p>`).join('');}
function nonEuBody(u){const t=u.nonEuTuition;return t?`<p>${t.perSemester?`Tuition for non-EU students: ${esc(t.perSemester)} per semester (exemptions exist).`:'Charges tuition for non-EU students — see the school’s fee page.'} ${link(t.source,'Source')}</p>`:'';}
function schoolRoute(u){const r=u.applicationRoute;return `<p>${u.applicationMethod==='uni-assist'?'International applicants may need to go through uni-assist (€75 first program, €30 each extra) — check the program page.':u.applicationMethod==='direct'?'Direct application route — programme-specific foreign-qualification validation and handling fees may still apply.':'Application route unknown.'} ${link(u.applicationMethodSource?.url,'Source')}</p>`+(r?.notes?`<p>${esc(r.notes)}${r.scope&&r.scope!=='all applicants'?` (${esc(r.scope)})`:''} ${link(r.url??u.sources?.applicationRoute,'Application instructions')}</p>`:'');}
function sourceList(sources){return [...new Set(Object.values(sources??{}).filter(v=>typeof v==='string'&&/^https?:/.test(v)))].map(s=>`<p>${link(s,esc(new URL(s).hostname+new URL(s).pathname))}</p>`).join('');}
function openDetails(n){const {u}=n;let body='';
 if(n.kind==='school'){const c=u.contact??{};
  body=`<p>${esc([u.city,u.state,typeLabel(u.type),u.founded&&`founded ${u.founded}`].filter(Boolean).join(' · '))}</p><p>${esc(u.description)}</p>`+section('Programs',programs.filter(p=>p.u.id===u.id).map(p=>`<button class="related-link" data-explore="${esc(p.id)}">${esc(p.name)}<small>${esc(p.p.degree)}</small></button>`).join(''))+section('Applying',schoolRoute(u))+section('Institution fees',feeBody(u.fees)+nonEuBody(u));
  body+=section('Contact',`<div class="link-row">${link(u.website,'School website')}${c.email?`<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`:''}${c.phone?`<a href="tel:${esc(c.phone.replace(/[^+\d]/g,''))}">${esc(c.phone)}</a>`:''}</div>${u.address?`<p>${esc([u.address.street,u.address.postalCode,u.address.city].filter(Boolean).join(', '))}</p>`:''}`);
  body+=section(`Sources${u.researched?` · checked ${esc(u.researched)}`:''}`,sourceList(u.sources));}
 else{const {p}=n;const d=p.details??{},status=states.get(n.id);const deadlines=Object.entries(p.applicationDeadlines??{}).map(([semester,w])=>`<p>${esc(semester)}: ${esc(w.start||'Opening date unknown')} — ${esc(w.end||'Closing date unknown')}</p>`).join('');
  const extraDeadlines=(p.otherDeadlines??[]).map(w=>`<p>${esc(w.kind)}: ${esc(w.start??'')} — ${esc(w.end)}${w.scope?' · '+esc(w.scope):''}</p>`).join('');
  body=`<p>${esc([u.name,u.city,p.degree,p.language||'Teaching language unknown',p.duration].filter(Boolean).join(' · '))}</p>${p.status?.status==='renamed'?`<p>Now offered under another name. ${esc(p.status.notes)}</p>`:''}<p>${esc(p.description)}</p>${status.gaps.length?`<p>Not confirmed: ${esc(status.gaps.join(', '))}. Missing information is not a rejection.</p>`:''}`;
  const admission=admissionOf(p,u.type),restricted=/restricted/.test(p.admission??'');
  body+=`<button class="related-link" data-explore="${esc('school:'+u.id)}">Explore this school's connections ↗</button>`;
  body+=section('Application windows',(p.intakes?.length?`<p>Intake: ${esc(p.intakes.join(' / '))} semester.</p>`:'')+deadlines+extraDeadlines)+section('Applying',(p.applicationRoute?`<p>${esc(p.applicationRoute.notes)} ${link(p.applicationRoute.url,'Application instructions')}</p>`:schoolRoute(u))+(admission||restricted?`<p>${admission?ADMISSION_LABELS[admission]:'Restricted admission — check the programme’s selection criteria'}${p.admission==='aptitude-and-restricted'?'; also requires artistic aptitude / work samples':''}. ${link(p.admissionSource,'Source')}</p>`:''));
  body+=section('Requirements',(d.portfolioRequired!=null?`<p>Portfolio: ${d.portfolioRequired?'required':'not required'}</p>`:'')+(d.capacity!=null?`<p>Places: ${esc(d.capacity)}</p>`:'')+(p.requirements??[]).map(r=>`<p>${esc(r.label)}: ${esc(r.text)}</p>`).join(''));
  const notes=d.languageNotes?(Array.isArray(d.languageNotes)?d.languageNotes:[d.languageNotes]):[];
  body+=section('Teaching language notes',notes.map(s=>`<p>${esc(s)}</p>`).join(''))+section('Language certificate requirements',d.languageRequirements?`<p>${esc(d.languageRequirements)}</p>`:'');
  body+=section('Costs',feeBody(p.fees)+feeBody(u.fees)+nonEuBody(u)+(d.tuitionEuroPerSemester!=null?`<p>Reported tuition: €${esc(d.tuitionEuroPerSemester)}/semester. Check applicant scope.</p>`:''));
  body+=section('Teaching areas',(p.teachingAreas??[]).map(a=>`<p>${link(a.source,esc(a.name))||esc(a.name)}</p>`).join(''))+section('Specializations',(p.specializations??[]).map(a=>`<p>${esc(a)}</p>`).join(''));
  body+=section('Faculty',(d.faculty??[]).map(f=>`<p>${esc(f.name)}${f.title?' · '+esc(f.title):''} ${link(f.profileUrl,'Profile')}</p>`).join(''));
  const partners=(p.jointWith??[]).map(id=>schools.find(s=>s.id===id)?.name).filter(Boolean);body+=section('Documented joint programme',partners.length?(p.jointProfile?`<p>This profile: ${esc(p.jointProfile)} · ${esc(p.degree)}</p>`:'')+partners.map(name=>`<p>${esc(name)}</p>`).join(''):'');
  const pe=related(n.id).filter(e=>e.kind==='similarity');body+=section('Threads to other programs',pe.map(e=>{const other=nodeById.get(e.id);return `<button class="related-link" data-explore="${esc(other.id)}">${esc(other.name)}<small>${esc(other.u.name)} · Recorded similarity ${e.weight.toFixed(2)} · ${esc(states.get(other.id).state==='outside'?'outside current constraints':states.get(other.id).state==='unknown'?'some facts unknown':'within constraints')}</small></button>`;}).join('')||'<p>No links recorded. New programs without embeddings have no invented alternatives.</p>');
  body+=section('Official links',`<div class="link-row">${programLinks(d,u.website).map(l=>link(l.url,esc(l.label))).join('')}</div>${d.programPageNotes?`<p class="note">${esc(d.programPageNotes)}</p>`:''}`);
  body+=section(`Sources${p.researched?` · checked ${esc(p.researched)}`:''}`,sourceList(p.sources));
 }
 if(n.kind==='school')body+=section('Why these school threads?',related(n.id).map(e=>{const other=nodeById.get(e.id),pairs=e.evidence.pairs.map(([a,b])=>[nodeById.get(a),nodeById.get(b)]).filter(([a,b])=>a&&b);const strength={1:'Some recorded text overlap',2:'Similar program text',3:'Stronger program-text overlap'}[e.weight];return `<details><summary>${esc(other.name)} · ${strength}</summary><p>${e.evidence.total} algorithmically matched program pairs, from cached text similarity. Examples:</p>${pairs.map(([a,b])=>`<p>${esc(a.u.name)}: ${esc(a.name)} (${esc(a.p.degree||'degree unknown')}) ↔ ${esc(b.u.name)}: ${esc(b.name)} (${esc(b.p.degree||'degree unknown')})</p>`).join('')}<button class="related-link" data-explore="${esc(other.id)}">Explore ${esc(other.name)}</button></details>`;}).join('')||'<p>No overlap edges recorded. This does not imply isolation.</p>');
 $('details-sheet').innerHTML=`<div class="dialog-heading"><h2 id="details-title">${esc(n.name)}</h2><button id="details-close" aria-label="Close details">×</button></div><div class="actions"><button data-keep-node="${esc(n.id)}" aria-pressed="false">Keep</button></div>${body}<p class="note">Threads come from cached program text and metadata, not a validated comparison of curricula. Shared books, theories, projects, staff, partnerships and career paths need separate evidence. Confirm requirements on official pages.</p>`;
 $('details-close').onclick=()=>$('details-sheet').close();keeping.refresh();$('details-sheet').showModal();}
$('details-sheet').addEventListener('click',e=>{const b=e.target.closest('button[data-explore]');if(!b)return;$('details-sheet').close();setView(false);const n=nodeById.get(b.dataset.explore);setMode(n.kind);select(n.id);});

export function snapshot(){const counts={scope:0,unknown:0,outside:0};for(const n of programs)counts[states.get(n.id).state]++;return{mode,selected:selected?.id??null,listOpen,kept:keeping.snapshot(),filters:{...filters},extras:{...extras},counts,nodes:nodes.length,programs:programs.length,edges:edges.length,similarities:edges.filter(e=>e.kind==='similarity').length,selectedEdges:related(selected?.id).map(e=>({id:e.id,kind:e.kind,weight:e.weight,state:states.get(e.id).state})),renderedNodes:nodes.filter(visible).map(n=>({id:n.id,x:project(n).x,y:project(n).y}))};}
export {select,setMode,setView};
addEventListener('resize',()=>{layout();selected?reframeThread():reframe();});motion.addEventListener('change',()=>{needsDraw=true;});
layout();renderCount();reframe();requestAnimationFrame(loop);
