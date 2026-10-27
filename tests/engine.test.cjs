'use strict';
const assert=require('node:assert/strict');
require('../src/deck.js');
const E=require('../platform/engine.js');
const D=globalThis.PEDAGOG_DATA;
const settings=(overrides={})=>({people:6,teams:1,duration:60,caseId:'С-03',roleMode:'random',resourceMode:'choice',facilitator:true,...overrides});
let tests=0;function test(name,fn){fn();tests++;console.log('✓ '+name);}
test('all cases, formats, team counts and roster sizes preserve compatibility',()=>{
 for(const c of D.situations)for(const duration of E.DURATIONS)for(const people of [1,4,6,12,40])for(const teams of [1,Math.min(4,people)]){
  const s=E.create(settings({caseId:c.id,duration,people,teams}));assert(E.validate(s));const r=s.rounds[0];assert.equal(r.teams.reduce((n,t)=>n+t.size,0),people);assert.equal(r.plan.reduce((a,b)=>a+b,0)*s.plannedRounds,duration*60);
  for(const t of r.teams)assert(c.roleSets.some(ids=>JSON.stringify(ids)===JSON.stringify(t.assignments.map(a=>a.roleId))));
 }
});
test('individual mode and С-17 never instruct an enactment',()=>{
 for(const id of ['С-01','С-17']){const s=E.create(settings({caseId:id,people:id==='С-17'?6:1}));for(const stage of [2,5]){E.move(s,stage);assert.match(E.stageCopy(s).prompt,/Совет коллег/);assert(!E.stageCopy(s).title.includes('попытка'));}}
 const s=E.create(settings({caseId:'С-17'}));s.rounds[0].teams[0].discussion=false;assert.equal(E.validate(s),false);
});
test('duplicate role IDs retain distinct situational positions',()=>{
 const c=E.by('situations','С-14'),p=E.positions(c);assert.equal(p[1].roleId,p[2].roleId);assert.notEqual(p[1].position,p[2].position);
 for(const id of ['С-03','С-20']){const c=E.by('situations',id),p=E.positions(c,2);assert.equal(p[0].roleId,p[1].roleId);assert.notEqual(p[0].position,p[1].position);}
});
test('two rounds preserve independent notes/resources and repeat case cleanly',()=>{
 const s=E.create(settings({duration:90,teams:2,people:8}));const t=E.current(s).team;t.notes.first='Первый вариант';E.resource(s,'Р-02');E.move(s,6);E.nextRound(s,'С-03');assert.equal(s.rounds[0].teams[0].notes.first,'Первый вариант');assert.equal(s.rounds[0].teams[0].resource,'Р-02');assert.equal(E.current(s).team.resource,null);assert.equal(E.current(s).team.notes.first,'');s.currentRound=0;assert.equal(E.current(s).team.notes.first,'Первый вариант');assert(E.validate(s));
});
test('team changes do not erase another team’s work',()=>{const s=E.create(settings({teams:2}));E.current(s).team.notes.decision='Согласовано';s.currentTeam=1;E.setCase(s,'С-04');assert.equal(s.rounds[0].teams[0].notes.decision,'Согласовано');assert.equal(E.current(s).team.caseId,'С-04');assert(E.validate(s));});
test('turns enforce conditions including tools, voluntary actor, accessibility and time',()=>{
 const s=E.create(settings({caseId:'С-04'}));E.move(s,6);E.resource(s,'Р-06');assert.deepEqual(E.eligibleTurns(s),[]);const f=E.current(s).team.conditions;f.consent=f.time=true;assert(!E.eligibleTurns(s).includes('К-06'));f.tool=true;assert(E.eligibleTurns(s).includes('К-06'));E.turn(s,'К-06');assert(E.validate(s));f.tool=false;assert(!E.validate(s));assert.throws(()=>E.turn(s,'К-06'));
 const q=E.create(settings({caseId:'С-03',people:2}));E.move(q,6);E.resource(q,'Р-02');Object.assign(E.current(q).team.conditions,{consent:true,time:true,volunteer:true});assert(!E.eligibleTurns(q).includes('К-07'));
 const u=E.create(settings({caseId:'С-03',people:6}));E.move(u,6);E.resource(u,'Р-02');Object.assign(E.current(u).team.conditions,{consent:true,time:true,volunteer:true,condition:true});assert(E.eligibleTurns(u).includes('К-07'));assert(E.eligibleTurns(u).includes('К-05'));
});
test('resources cannot escape the situation matrix',()=>{const s=E.create(settings({caseId:'С-01'}));assert.throws(()=>E.resource(s,'Р-15'));assert.throws(()=>E.turn(s,'К-07'));});
test('reload pauses the clock and preserves notes and current stage',()=>{const s=E.create(settings());E.move(s,5);E.current(s).round.running=true;E.current(s).round.remaining=47.5;E.current(s).team.notes.retry='Новый вопрос';const r=E.restore(JSON.stringify(s));assert.equal(E.current(r).round.running,false);assert.equal(E.current(r).round.remaining,47.5);assert.equal(E.current(r).team.notes.retry,'Новый вопрос');assert.equal(E.current(r).round.stage,5);});
test('malformed imports are rejected, not partially loaded',()=>{const s=E.create(settings());for(const mutate of [x=>x.schema=0,x=>x.currentRound=-1,x=>x.rounds[0].remaining=-2,x=>x.rounds[0].teams[0].resource='bad',x=>x.rounds[0].teams[0].assignments[0].roleId='bad',x=>x.rounds[0].teams[0].notes=null,x=>x.settings.teams=30,x=>x.rounds[0].teams[0].size=100]){const x=JSON.parse(JSON.stringify(s));mutate(x);assert.throws(()=>E.restore(JSON.stringify(x)));}assert.throws(()=>E.restore('{'));});
test('negative settings and nonexistent situations fail before session creation',()=>{for(const changes of [{people:0},{people:41},{teams:9},{people:1,teams:2},{duration:17},{caseId:'С-07'},{roleMode:'anything'}])assert.throws(()=>E.create(settings(changes)));});
console.log(`${tests} test groups passed.`);
