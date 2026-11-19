'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..');const ctx={};vm.createContext(ctx);
for(const f of ['src/deck.js','platform/metadata.js','platform/engine.js','platform/print-layout.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const L=ctx.PEDAGOG_PRINT_LAYOUT,D=ctx.PEDAGOG_DATA,S=ctx.PEDAGOG_SESSION;
assert.equal(L.PER,8);
assert(Math.abs(L.WIDTH/L.HEIGHT-99/140)<1e-9);
const positions={long:[1,0,3,2,5,4,7,6],short:[6,7,4,5,2,3,0,1]};
for(const [edge,expected] of Object.entries(positions)){
  assert.deepEqual(Array.from({length:L.PER},(_,i)=>L.backIndex(i,edge)),expected);
  for(const count of [0,1,7,8,9,15,16,17]){
    const cards=Array.from({length:count},(_,i)=>({i}));
    const full=L.plan(cards,{edge});
    assert.equal(full.length,2*Math.ceil(count/L.PER));
    assert.deepEqual(L.plan(cards,{edge,side:'front'}),full.filter(p=>!p.back));
    assert.deepEqual(L.plan(cards,{edge,side:'back'}),full.filter(p=>p.back));
    full.filter(p=>!p.back).forEach(({cards:front},i)=>{
      assert.equal(front.length,L.PER);
      const back=full[2*i+1].cards;
      front.forEach((card,j)=>assert.strictEqual(back[expected[j]],card));
    });
  }
  const trial=L.calibrationHTML({edge});
  const numbers=[...trial.matchAll(/pc-cal"><b>(\d+)<\/b>/g)].map(m=>Number(m[1]));
  assert.deepEqual(numbers,[1,2,3,4,5,6,7,8,...expected.map(i=>i+1)]);
}
for(const c of D.situations){const kit=L.kit(c,S);
  const kinds=kit.map(k=>k.kind);assert.equal(kinds.filter(k=>k==='role').length,c.cast.length,c.id+': все роли из реестра');assert.equal(kinds.filter(k=>k==='event').length,3);['situation','host','reflect','observer'].forEach(k=>assert(kinds.includes(k),c.id+' '+k));
  const html=L.sheetsHTML(kit,{});for(const x of c.cast){assert(html.includes(x.position.replace(/"/g,'&quot;').replace(/«|»/g,m=>m))||html.includes(x.label),c.id+' '+x.key);}
  c.events.forEach(ev=>assert(html.includes(ev.title.replace(/"/g,'&quot;')),c.id+' обстоятельство в печати'));
  const situationFront=kit[0].front;c.cast.filter(x=>x.enters>0).forEach(x=>assert(!situationFront.includes(x.label),c.id+': карточка ситуации не раскрывает поздние роли'));
  kit.filter(k=>k.kind==='event').forEach(k=>assert(/Не открывать до сигнала ведущего/.test(k.back)));
  kit.filter(k=>k.kind==='role').forEach(k=>{const r=c.cast.find(x=>k.front.includes(x.position.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')));assert(r&&k.front.includes('Характер:')&&r.traits.every(w=>k.front.includes(w)),c.id+': характер на карточке роли');});
  {const adv=kit.filter(k=>k.kind==='advice');assert.equal(adv.length,1,c.id+': карточка рекомендаций');assert(/Что важно понять/.test(adv[0].front)&&/Как лучше поступить/.test(adv[0].front)&&/Чего лучше избегать/.test(adv[0].front));assert(/после проигрывания/.test(adv[0].back),c.id+': рубашка рекомендаций');}
  const p=L.plan(kit,{edge:'long'});assert.equal(p.length,2*Math.ceil(kit.length/L.PER));p.filter(s=>s.back).forEach((s,i)=>{const front=p[i*2];front.cards.forEach((c2,j)=>assert.equal(s.cards[L.backIndex(j,'long')],c2));});}
assert.equal(L.plan(L.common(),{side:'front'}).length,Math.ceil(L.common().length/L.PER));assert(L.worksheetsHTML(S).includes('Маршрут ведущего'));assert(L.calibrationHTML({}).includes('Пробный лист'));
const js=fs.readFileSync(path.join(root,'platform/print.js'),'utf8');assert(/PBKDF2/.test(js)&&/AES-GCM/.test(js),'доступ по коду сохранён');assert(!/localStorage/.test(js),'код не сохраняется');
console.log(`PASS print: ${D.situations.length} комплектов, совмещение сторон, закрытые обстоятельства, доступ по коду.`);
