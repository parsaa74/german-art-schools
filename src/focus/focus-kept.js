import {shortlist,canPersistShortlist} from '../stores/shortlistStore.ts';
import {nodeById,programById,schools} from './focus-model.js';
import {planProgramCalendar,programCalendarFile} from '../utils/programCalendar.ts';
import {downloadICalFile} from '../utils/icalExport.ts';

const $=id=>document.getElementById(id);
const originalNames=new Map(schools.flatMap(u=>u.programs.map(p=>[p.program_id,p.name])));
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const keptNode = n => !!n && (n.kind==='school'?shortlist.getState().schoolIds.includes(n.u.id):shortlist.getState().ids.includes(n.id));

/** One quiet place to return to choices; no accounts, scores, notifications or planner. */
export function installKeeping({getSelected,showDetails,onChange}){
 let plan=null;
 function entries(){return shortlist.getState().ids.flatMap(id=>{const n=programById.get(id);return n?[{program:n.p,school:n.u}]:[];});}
 function refresh(){const state=shortlist.getState(),n=getSelected();$('kept-open').setAttribute('aria-label',`Kept programs and schools (${state.ids.length+state.schoolIds.length})`);
  $('keep').disabled=!n;$('keep').textContent=keptNode(n)?'Kept':'Keep';$('keep').setAttribute('aria-pressed',String(keptNode(n)));
  for(const b of document.querySelectorAll('[data-keep-node]')){const kept=keptNode(nodeById.get(b.dataset.keepNode));b.textContent=kept?'Kept':'Keep';b.setAttribute('aria-pressed',String(kept));}
  if($('kept-sheet').open)renderKept();if($('calendar-sheet').open)renderCalendar();
 }
 function toggle(n){if(!n)return;const state=shortlist.getState();n.kind==='school'?state.toggleSchool(n.u.id):state.toggle(n.id);refresh();}
 $('keep').onclick=()=>toggle(getSelected());
 $('details-sheet').addEventListener('click',e=>{const b=e.target.closest('[data-keep-node]');if(b)toggle(nodeById.get(b.dataset.keepNode));});
 function row(id,kind){const n=nodeById.get(kind==='school'?'school:'+id:id);const meta=n?(kind==='school'?[...new Set([n.u.city,n.u.state])]:[n.p.degree,n.u.name]):['No longer in the active catalogue; your saved choice is retained'];return `<div class="kept-row"><button data-kept-details="${esc(n?.id??'')}" ${n?'':'disabled'}><span>${esc(n?.name??originalNames.get(id)??'Saved choice (not in this catalogue)')}</span><small>${esc(meta.filter(Boolean).join(' · '))}</small></button><button data-remove-kept="${esc(id)}" data-kind="${kind}" aria-label="Remove ${esc(n?.name??originalNames.get(id)??'saved choice')} from kept choices">Remove</button></div>`;}
 function renderKept(){const state=shortlist.getState();$('kept-storage').textContent=canPersistShortlist()?'Kept in this browser. No account; nothing is sent to a server.':'Kept for this session only: this browser is not allowing storage.';
  $('kept-content').innerHTML=(state.ids.length?`<h3>Programs · ${state.ids.length}</h3>${state.ids.map(id=>row(id,'program')).join('')}`:'<p>No programs kept yet. Keep one from its name or details.</p>')+(state.schoolIds.length?`<h3>Schools · ${state.schoolIds.length}</h3>${state.schoolIds.map(id=>row(id,'school')).join('')}<p class="note">Keeping a school does not select all its programs or export all their dates.</p>`:'');
  $('calendar-open').disabled=!state.ids.length;
 }
 $('kept-open').onclick=()=>{renderKept();$('kept-sheet').showModal();};$('kept-close').onclick=()=>$('kept-sheet').close();
 $('kept-content').addEventListener('click',e=>{const remove=e.target.closest('[data-remove-kept]');if(remove){const state=shortlist.getState();remove.dataset.kind==='school'?state.removeSchool(remove.dataset.removeKept):state.remove(remove.dataset.removeKept);refresh();$('kept-close').focus();return;}
  const b=e.target.closest('[data-kept-details]');if(b?.dataset.keptDetails){$('kept-sheet').close();showDetails(nodeById.get(b.dataset.keptDetails));}
 });
 function renderCalendar(){const year=$('include-undated').checked?Number($('calendar-year').value):undefined;$('calendar-year-field').hidden=!$('include-undated').checked;plan=planProgramCalendar(entries(),{undatedYear:year});
  $('calendar-summary').textContent=`${plan.events.length} closing-date reminder${plan.events.length===1?'':'s'} for ${plan.programsWithDates} kept program${plan.programsWithDates===1?'':'s'}.`;
  $('undated-label').hidden=plan.undatedCount===0;
  $('calendar-dates').innerHTML=plan.events.map(e=>`<li><time>${esc(e.date)}</time><span>${esc(e.programName)}<small>${esc(e.schoolName)} · ${esc(e.kind)}${e.scope?' · '+esc(e.scope):''}${e.assumedYear?' · year assigned by you':''}</small></span></li>`).join('');
  const unavailable=shortlist.getState().ids.filter(id=>!programById.has(id));
  $('calendar-skipped').hidden=!plan.skipped.length&&!unavailable.length;
  $('calendar-skipped').querySelector('summary').textContent=`Not included · ${plan.skipped.length+unavailable.length}`;
  $('calendar-skipped-content').innerHTML=plan.skipped.map(s=>`<p>${esc(s.name)}<br><small>${esc(s.reason)}</small></p>`).join('')+unavailable.map(id=>`<p>${esc(id)}<br><small>No longer in the active catalogue.</small></p>`).join('');
  $('calendar-download').disabled=!plan.events.length;
 }
 $('calendar-year').value=String(new Date().getFullYear()+1);
 $('calendar-open').onclick=()=>{renderCalendar();$('calendar-sheet').showModal();};$('calendar-close').onclick=()=>$('calendar-sheet').close();
 $('include-undated').onchange=renderCalendar;$('calendar-year').oninput=renderCalendar;
 $('calendar-download').onclick=()=>{renderCalendar();if(plan.events.length)downloadICalFile(programCalendarFile(plan),'kept-program-deadlines.ics');};
 const unsubscribe=shortlist.subscribe((state,previous)=>{if(state.ids===previous.ids&&state.schoolIds===previous.schoolIds)return;refresh();onChange();});
 const storage=e=>{if(e.key==='german-art-schools:shortlist'||e.key===null){shortlist.persist.rehydrate();refresh();}};addEventListener('storage',storage);
 if(import.meta.hot)import.meta.hot.dispose(()=>{unsubscribe();removeEventListener('storage',storage);});
 refresh();
 return {refresh,snapshot:()=>({programs:[...shortlist.getState().ids],schools:[...shortlist.getState().schoolIds]})};
}
