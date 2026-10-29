'use strict';
/* Движок сессии: форматы, этапы, роли, ресурсы, сохранение и импорт. */
const assert=require('node:assert/strict');
require('../src/deck.js');require('../platform/metadata.js');
const E=require('../platform/engine.js'),D=globalThis.PEDAGOG_DATA;
let n=0;const test=(name,fn)=>{fn();n++;};
const seq=(...v)=>{let i=0;return()=>v[i++%v.length];};
const S=(o={})=>E.create({people:6,duration:40,caseId:'С-02',...o},seq(0));
function walk(s,write=true){const r=E.current(s).round;while(true){const {key,team}=E.current(s);
  if(['resource','quickResource'].includes(key))E.current(s).round.teams.forEach((t,i)=>E.resource(s,E.by('situations',t.caseId).resourceIds[0],i));
  if(write&&E.STAGES[key].note&&E.STAGES[key].note!=='meeting')team.notes[E.STAGES[key].note]='запись '+key;
  if(r.stage===r.stages.length-1)return;E.move(s,r.stage+1);}}

test('форматы ровно 15/40/90; сумма этапов совпадает с длительностью',()=>{
  assert.deepEqual(E.DURATIONS,[15,40,90]);for(const m of E.DURATIONS)assert.equal(E.totalMinutes(m),m);
  assert.equal(E.FORMATS[90].rounds.length,2);assert.equal(E.FORMATS[90].rounds[0].at(-1)[0],'break');assert.equal(E.FORMATS[90].rounds[1].at(-1)[0],'summary');
  for(const m of E.DURATIONS)for(const r of E.FORMATS[m].rounds){const keys=r.map(x=>x[0]);assert(keys.indexOf('first')<keys.indexOf('retry'));assert(keys.includes('reflect'));assert(r.every(([k,min])=>E.STAGES[k]&&min>=2));}
});
test('старые длительности и неверные настройки отклоняются до создания',()=>{
  for(const bad of [{duration:45},{duration:20},{people:0},{people:41},{people:2.5},{caseId:'С-07'},{caseId:'X'}])assert.throws(()=>S(bad));
});
test('команды формируются автоматически, размеры складываются в число участников',()=>{
  for(const people of [1,2,6,12,13,20,40]){const s=S({people});const r=s.rounds[0];assert.equal(r.teams.length,E.teamsFor(people));assert.equal(r.teams.reduce((a,t)=>a+t.size,0),people);assert(r.teams.every(t=>t.size>=1));}
  assert.equal(E.teamsFor(12),1);assert.equal(E.teamsFor(13),3);assert.equal(E.teamsFor(40),7);
});
test('каждый состав ролей совместим с местами ситуации; наблюдатели — сверх мест',()=>{
  for(const c of D.situations)c.roleSets.forEach((set,i)=>{const ps=E.positions(c,i);assert.equal(ps.length,set.length);ps.forEach((p,j)=>{assert.equal(p.who,c.seats[j].who);assert(E.by('roles',p.roleId));});});
  assert(D.roles.some(r=>r.id==='Ро-09'));assert(!D.situations.some(c=>c.roleSets.flat().includes('Ро-09')),'наблюдатель не занимает место в сцене');
  const c=E.by('situations','С-14');assert.notEqual(E.positions(c)[1].who,E.positions(c)[2].who);
});
test('алгоритм назначения выбирает только существующие составы',()=>{
  for(const c of D.situations)for(const k of [0,.5,.99]){const s=E.create({people:6,duration:40,caseId:c.id},()=>k);const t=s.rounds[0].teams[0];assert(E.by('situations',c.id).roleSets[t.roleSet]);}
});
test('мало людей или С-17 — совет коллег; один участник — без сцены',()=>{
  assert.equal(S({people:2,caseId:'С-02'}).rounds[0].teams[0].discussion,true);
  assert.equal(S({caseId:'С-17'}).rounds[0].teams[0].discussion,true);
  const solo=S({people:1});assert.equal(solo.settings.solo,true);assert.equal(solo.rounds[0].teams[0].discussion,true);
  E.setDiscussion(solo,false);assert.equal(E.current(solo).team.discussion,true);
  E.move(solo,1);assert.match(E.stageCopy(solo).do,/Запишите/);
});
test('без ресурса нельзя перейти ко второй попытке — для каждой команды',()=>{
  const s=S({people:20});E.move(s,3);assert.throws(()=>E.move(s,4),/команд/);
  E.resource(s,'Р-02',0);assert.throws(()=>E.move(s,4));for(let i=1;i<s.settings.teams;i++)E.resource(s,'Р-02',i);E.move(s,4);assert.equal(E.current(s).key,'retry');
  assert.throws(()=>E.resource(s,'Р-14'),/не подходит/);
});
test('переход назад разрешён; повторный выбор этапа не сбрасывает таймер',()=>{
  const s=S();E.move(s,2);const r=s.rounds[0];r.remaining=17;r.running=true;E.move(s,2);assert.equal(r.remaining,17);assert.equal(r.running,true);E.move(s,0);assert.equal(r.running,false);assert.equal(r.remaining,r.plan[0]);
});
test('повороты: только в сравнении 40/90 минут, после ресурса, с условиями карточки',()=>{
  const q=S({duration:15});walk(q);assert.deepEqual(E.eligibleTurns(q),[]);
  const s=S({caseId:'С-04'});E.move(s,3);E.resource(s,'Р-06');E.move(s,5);const ids=E.eligibleTurns(s);assert(ids.includes('К-05')&&ids.includes('К-06'));
  const talk=S({caseId:'С-02',people:2});E.move(talk,3);E.resource(talk,'Р-02');E.move(talk,5);assert(!E.eligibleTurns(talk).includes('К-02'));
  const few=S({caseId:'С-03',people:2});E.move(few,3);E.resource(few,'Р-02');E.move(few,5);assert(!E.eligibleTurns(few).includes('К-07'));
  const many=S({caseId:'С-03',people:6});E.move(many,3);E.resource(many,'Р-02');E.move(many,5);assert(E.eligibleTurns(many).includes('К-07'));E.turn(many,'К-07');assert(E.validate(many));
});
test('ситуацию можно заменить только на первых двух этапах',()=>{
  const s=S();E.setCase(s,'С-21');assert.equal(E.current(s).situation.id,'С-21');E.move(s,1);E.setCase(s,'С-01');E.move(s,2);assert.throws(()=>E.setCase(s,'С-02'));
});
test('90 минут: перерыв, второй раунд с новой ситуацией, общий итог',()=>{
  const s=S({duration:90,people:14});walk(s);assert.equal(E.current(s).key,'break');assert.equal(Math.round(E.remainingMeeting(s)/60),50);
  E.nextRound(s,'С-21');assert.equal(s.rounds.length,2);assert.equal(E.current(s).situation.id,'С-21');walk(s);assert.equal(E.current(s).key,'summary');
  s.meeting='Начинаем с уточняющего вопроса.';E.finish(s);assert(E.validate(s));
  const back=E.restore(JSON.stringify(s));assert.equal(back.rounds[0].teams[0].notes.decision,'запись decision');assert.equal(back.meeting,s.meeting);
});
test('полный путь 15 и 40 минут сохраняет записи через экспорт и восстановление',()=>{
  for(const d of [15,40]){const s=S({duration:d});walk(s);E.finish(s);const raw=JSON.stringify(s);const b=E.restore(raw);assert(b.completed);assert.equal(b.rounds[0].teams[0].notes.retry,'запись retry');assert.equal(b.rounds[0].teams[0].notes.decision,'запись '+(d===15?'quickDecision':'decision'));}
});
test('восстановление ставит таймер на паузу; дополнительные раунды ограничены',()=>{
  const s=S();s.rounds[0].running=true;const b=E.restore(JSON.stringify(s));assert.equal(b.rounds[0].running,false);
  for(let i=0;i<5;i++)E.nextRound(s,'С-01');assert.throws(()=>E.nextRound(s,'С-01'));assert(E.validate(s));
});
test('импорт отклоняет повреждённые и подделанные файлы целиком',()=>{
  const good=S();const bad=[x=>x.schema=3,x=>x.settings.duration=45,x=>x.rounds[0].plan[0]=1,x=>x.rounds[0].teams[0].size=99,x=>x.rounds[0].teams[0].resource='Р-14',
    x=>x.rounds[0].teams[0].turn='К-01',x=>x.rounds[0].teams[0].notes.first=1,x=>x.rounds[0].stage=4,x=>{x.completed=true;x.rounds[0].running=true;},x=>x.settings.teams=3,x=>x.rounds[0].teams[0].roleSet=7];
  for(const f of bad){const x=JSON.parse(JSON.stringify(good));f(x);assert.equal(E.validate(x),false,String(f));}
  assert.throws(()=>E.restore('{'),/не файл/);assert.throws(()=>E.restore(JSON.stringify({schema:3})),/прежней версии/);
});
test('тексты этапов отвечают на «что делать, кто, результат»',()=>{
  for(const [k,st] of Object.entries(E.STAGES))assert(st.title&&st.do.length>40&&st.who&&st.result,k);
  const c=S({caseId:'С-17'});E.move(c,1);assert.match(E.stageCopy(c).do,/без инсценировки|не изображают/);
});
console.log(`${n} групп проверок движка пройдены.`);
