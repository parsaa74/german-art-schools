/** Read-only structural / sensitivity audit. No embedding API calls or source-data edits.
 * Requires Python 3 + NumPy for cached-vector comparisons; not a browser dependency.
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {subjectGroupOf,degreeGroupOf} from '../src/lib/taxonomy'

type Program = {program_id:string;name:string;degree?:string;description?:string;language?:string;jointProgramId?:string;status?:{status:string};sources?:Record<string,string>;teachingAreas?:Array<{name:string;source?:string}>;details?:{programUrl?:string;faculty?:unknown[]};otherDeadlines?:unknown[];applicationDeadlines?:Record<string,{end?:string}>}
type School = {id:string;website?:string;programs:Program[]}
const paths = {data:'src/data/enhanced_german_art_schools.json',relations:'src/data/relations.json',embeddings:'data/program_embeddings.json'}
const data = JSON.parse(readFileSync(paths.data,'utf8')) as {universities:Record<string,School>}
const rows = Object.entries(data.universities).flatMap(([schoolName,u])=>u.programs.map(p=>({...p,schoolId:u.id,schoolName,subject:subjectGroupOf(p.name),degreeGroup:degreeGroupOf(p.degree),active:!['discontinued','not-matched'].includes(p.status?.status??'')})))
const active = rows.filter(p=>p.active)
const count = (fn:(p:typeof rows[number])=>boolean)=>active.filter(fn).length
const descriptions = new Map<string,string[]>()
for(const p of active){const text=p.description?.trim();if(text)descriptions.set(text,[...(descriptions.get(text)??[]),p.program_id])}
const input = {
 checked:new Date().toISOString().slice(0,10),paths,
 inputHashes:Object.fromEntries(Object.entries(paths).map(([key,path])=>[key,createHash('sha256').update(readFileSync(path)).digest('hex')])),
 schools:Object.entries(data.universities).map(([name,u])=>({id:u.id,name,website:u.website})),
 rows,
 coverage:{schools:Object.keys(data.universities).length,records:rows.length,activePrograms:active.length,teachingLanguage:count(p=>!!p.language?.trim()),knownDegreeGroup:count(p=>!!degreeGroupOf(p.degree)),withDescription:count(p=>!!p.description?.trim()),withProgramUrl:count(p=>!!p.details?.programUrl),withAnyFieldSources:count(p=>!!Object.keys(p.sources??{}).length),withSourcedTeachingAreas:count(p=>!!p.teachingAreas?.some(a=>!!a.source)),withFacultyRoster:count(p=>!!p.details?.faculty?.length),withJointProgramIdentity:count(p=>!!p.jointProgramId),withAnyApplicationDate:count(p=>!!Object.values(p.applicationDeadlines??{}).some(d=>!!d.end)||!!p.otherDeadlines?.length)},
 repeatedDescriptionGroups:[...descriptions.values()].filter(ids=>ids.length>1),
 documentedInstitutionAlias:{source:'data/research/degree-program-links.md',schools:['Kunsthochschule München','Akademie der Bildenden Künste München'].map(name=>({name,id:data.universities[name].id})),note:'The supplied review identifies these as one institution. Data/IDs are not merged by this audit.'},
}
mkdirSync('.dev',{recursive:true})
writeFileSync('.dev/network-audit-input.json',JSON.stringify(input))
console.log(execFileSync('python3',['-I','scripts/audit-program-network.py','.dev/network-audit-input.json'],{encoding:'utf8'}))
