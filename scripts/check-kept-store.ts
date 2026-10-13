import assert from 'node:assert/strict'

async function main() {
  const previous = Object.getOwnPropertyDescriptor(globalThis,'localStorage')
  const memory = new Map<string,string>()
  let blocked = false
  const key = 'german-art-schools:shortlist'
  memory.set(key,JSON.stringify({state:{ids:['first','first'],profile:{certificate:'german',firstDegree:true}},version:0}))
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
    getItem:(key:string)=>memory.get(key)??null,
    setItem:(key:string,value:string)=>{if(blocked)throw new Error('quota');memory.set(key,value)},
    removeItem:(key:string)=>memory.delete(key),
  }})
  try {
    const {shortlist,canPersistShortlist} = await import('../src/stores/shortlistStore')
    assert.deepEqual(shortlist.getState().ids,['first'],'Legacy saved programs survive and deduplicate')
    assert.deepEqual(shortlist.getState().schoolIds,[],'New field defaults without resetting old storage')
    assert.equal(shortlist.getState().profile.certificate,'german')
    assert.equal(shortlist.getState().profile.firstDegree,true)
    shortlist.getState().toggleSchool('school')
    shortlist.getState().add(['second','second'])
    assert.deepEqual(shortlist.getState().ids,['first','second'])
    const persisted = JSON.parse(memory.get(key)!).state
    assert.deepEqual(persisted.schoolIds,['school'])
    assert.equal(persisted.profile.certificate,'german')
    assert(!('toggle' in persisted),'Only choices and profile persisted, not actions')
    await shortlist.persist.rehydrate()
    assert.deepEqual(shortlist.getState().schoolIds,['school'])
    shortlist.getState().clear()
    assert.deepEqual(shortlist.getState().ids,[])
    assert.deepEqual(shortlist.getState().schoolIds,['school'],'Old clear-programs action does not silently remove saved schools')
    assert.equal(shortlist.getState().profile.certificate,'german')
    shortlist.getState().removeSchool('school')
    assert.deepEqual(shortlist.getState().schoolIds,[])
    blocked=true
    assert.doesNotThrow(()=>shortlist.getState().toggle('session'))
    assert.deepEqual(shortlist.getState().ids,['session'])
    assert.equal(canPersistShortlist(),false,'Blocked storage reported as session-only')
    console.log('PASS: legacy keeps/profile migration, separate schools, deduplication, persistence, removal and blocked-storage fallback.')
  } finally {
    if(previous)Object.defineProperty(globalThis,'localStorage',previous)
    else Reflect.deleteProperty(globalThis,'localStorage')
  }
}
main().catch(error=>{console.error(error);process.exitCode=1})
