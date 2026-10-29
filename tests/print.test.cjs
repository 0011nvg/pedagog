'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..');const ctx={};vm.createContext(ctx);
for(const f of ['src/deck.js','platform/metadata.js','platform/engine.js','platform/print-layout.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const L=ctx.PEDAGOG_PRINT_LAYOUT,D=ctx.PEDAGOG_DATA,S=ctx.PEDAGOG_SESSION;
for(const edge of ['long','short']){const seen=new Set();for(let i=0;i<4;i++){const b=L.backIndex(i,edge);seen.add(b);assert.equal(L.backIndex(b,edge),i,'оборот обратим');}assert.equal(seen.size,4);}
assert.deepEqual([0,1,2,3].map(i=>L.backIndex(i,'long')),[1,0,3,2]);assert.deepEqual([0,1,2,3].map(i=>L.backIndex(i,'short')),[2,3,0,1]);
for(const c of D.situations){const kit=L.kit(c,S);assert.equal(kit.length%4,0,c.id+': полные листы');
  const kinds=kit.map(k=>k.kind);assert.equal(kinds.filter(k=>k==='role').length,c.cast.length,c.id+': все роли из реестра');assert.equal(kinds.filter(k=>k==='event').length,3);['situation','host','reflect','observer'].forEach(k=>assert(kinds.includes(k),c.id+' '+k));
  const html=L.sheetsHTML(kit,{});for(const x of c.cast){assert(html.includes(x.position.replace(/"/g,'&quot;').replace(/«|»/g,m=>m))||html.includes(x.label),c.id+' '+x.key);}
  c.events.forEach(ev=>assert(html.includes(ev.title.replace(/"/g,'&quot;')),c.id+' обстоятельство в печати'));
  const situationFront=kit[0].front;c.cast.filter(x=>x.enters>0).forEach(x=>assert(!situationFront.includes(x.label),c.id+': карточка ситуации не раскрывает поздние роли'));
  kit.filter(k=>k.kind==='event').forEach(k=>assert(/Не открывать до сигнала ведущего/.test(k.back)));
  const p=L.plan(kit,{edge:'long'});assert.equal(p.length,kit.length/2);p.filter(s=>s.back).forEach((s,i)=>{const front=p[i*2];front.cards.forEach((c2,j)=>assert.equal(s.cards[L.backIndex(j,'long')],c2));});}
assert.equal(L.common().length%4,0);assert(L.worksheetsHTML(S).includes('Маршрут ведущего'));assert(L.calibrationHTML({}).includes('Пробный лист'));
const js=fs.readFileSync(path.join(root,'platform/print.js'),'utf8');assert(/PBKDF2/.test(js)&&/AES-GCM/.test(js),'доступ по коду сохранён');assert(!/localStorage/.test(js),'код не сохраняется');
console.log(`PASS print: ${D.situations.length} комплектов, совмещение сторон, закрытые обстоятельства, доступ по коду.`);
