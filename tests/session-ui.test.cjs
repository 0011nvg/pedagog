'use strict';
// Минимальная DOM-граница для проверок контроллера. Визуальные проверки — отдельно (браузер).
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture({seed=true,old=null,stage=0}={}){
 const nodes=new Map(),events={},storage=new Map();let document,now=100000,interval;
 const node=id=>{if(!nodes.has(id))nodes.set(id,{id,tagName:'DIV',value:'',checked:false,textContent:'',dataset:{},style:{},hidden:false,parentElement:{classList:{toggle(){}}},classList:{toggle(){},contains(){return false;}},setAttribute(){},focus(){document.activeElement=this;},scrollIntoView(){},querySelector(){return node('h1');},querySelectorAll(){return [];},set innerHTML(html){this.html=html;for(const m of html.matchAll(/<(input|select|textarea|button)[^>]*id="([^"]+)"[^>]*>/g)){const el=node(m[2]);el.tagName=m[1].toUpperCase();if(m[1]==='input')el.value=m[0].match(/value="([^"]*)"/)?.[1]||'';if(m[1]==='select'){const end=html.indexOf('</select>',m.index);const options=[...html.slice(m.index,end).matchAll(/<option value="([^"]*)"([^>]*)>/g)];el.value=(options.find(o=>/selected/.test(o[2]))||options[0])?.[1]||'';}}},get innerHTML(){return this.html||'';}});return nodes.get(id);};
 document={activeElement:null,getElementById:node,querySelector:()=>node('submit'),body:{classList:{toggle(){},contains(){return false;}}}};
 const ctx={document,location:{search:''},URLSearchParams,Date:class extends Date{static now(){return now;}},console,setInterval(fn){interval=fn;},setTimeout(){},confirm:()=>true,alert(){},Blob:class{},URL:{createObjectURL(){return 'blob:';},revokeObjectURL(){}},
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}};
 ctx.window=ctx;ctx.addEventListener=(name,fn)=>events[name]=fn;vm.createContext(ctx);
 for(const f of ['src/deck.js','platform/metadata.js','platform/engine.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);
 const E=ctx.PEDAGOG_SESSION,key='pedagog-platform-session-v4';
 if(seed){const s=E.create({people:6,duration:40,caseId:'С-03'});if(stage){E.move(s,3);E.resource(s,'Р-02');E.move(s,stage);}storage.set(key,JSON.stringify(s));}
 if(old)storage.set('pedagog-platform-session-v3',old);
 vm.runInContext(fs.readFileSync('platform/session.js','utf8'),ctx);
 return {ctx,E,node,events,storage,key,saved:()=>JSON.parse(storage.get(key)),advance(ms){now+=ms;},pulse(){interval();}};
}
{ // Сохранённая встреча открывается сразу, таймер на паузе.
 const f=fixture();assert.match(f.node('app').innerHTML,/Ситуация и позиции/);assert.equal(f.saved().rounds[0].running,false);
 f.node('next-stage').onclick();assert.equal(f.saved().rounds[0].stage,1);f.node('prev-stage').onclick();assert.equal(f.saved().rounds[0].stage,0);
}
{ // Без ресурса «Далее» на этапе ресурса не пускает ко второй попытке.
 const f=fixture();for(let i=0;i<3;i++)f.node('next-stage').onclick();assert.equal(f.saved().rounds[0].stage,3);f.node('next-stage').onclick();assert.equal(f.saved().rounds[0].stage,3);assert.match(f.node('game-status').textContent,/ресурс/);
}
{ // Дробные секунды не теряются при перерисовке; уход со страницы ставит паузу.
 const f=fixture();f.node('timer-toggle').onclick();f.advance(375);f.node('view-mode').onclick();f.advance(625);f.pulse();assert.equal(f.saved().rounds[0].remaining,299);
 f.events.pagehide();f.events.pageshow({persisted:true});f.advance(5000);f.pulse();assert.equal(f.saved().rounds[0].remaining,299);assert.equal(f.saved().rounds[0].running,false);
}
{ // Окончание времени этапа: таймер останавливается, сообщение видно, переход не автоматический.
 const f=fixture();f.node('timer-toggle').onclick();f.advance(301000);f.pulse();const s=f.saved();assert.equal(s.rounds[0].remaining,0);assert.equal(s.rounds[0].running,false);assert.equal(s.rounds[0].stage,0);assert.match(f.node('game-status').textContent,/Время этапа вышло/);
}
{ // Другая вкладка изменила сохранение — эта вкладка его не затирает.
 const f=fixture(),other=f.saved();other.rounds[0].teams[0].notes.first='Из другой вкладки';const raw=JSON.stringify(other);f.storage.set(f.key,raw);
 f.node('next-stage').onclick();assert.equal(f.storage.get(f.key),raw);assert.match(f.node('game-status').textContent,/другой вкладке/);f.events.pagehide();assert.equal(f.storage.get(f.key),raw);
}
{ // Переполненное хранилище — честное предупреждение.
 const f=fixture();f.ctx.localStorage.setItem=()=>{throw Error('quota');};f.node('next-stage').onclick();assert.match(f.node('game-status').textContent,/Автосохранение недоступно/);
}
{ // Стартовая форма: только время, число участников, ситуация. Старое сохранение можно скачать.
 const f=fixture({seed:false,old:'{"schema":3}'});const html=f.node('app').innerHTML;
 for(const id of ['consent','teams','role-mode','resource-mode','facilitator','complexity'])assert(!html.includes('id="'+id+'"'),'лишнее поле: '+id);
 assert(html.includes('id="preset-15"')&&html.includes('id="preset-40"')&&html.includes('id="preset-90"')&&html.includes('id="people"')&&html.includes('id="case-select"'));
 assert(html.includes('id="old-download"'));assert.match(html,/Подключения с разных устройств нет/);
 f.node('preset-90').onclick();f.node('people').value='20';f.node('session-form').onsubmit({preventDefault(){}});const s=f.saved();assert.equal(s.settings.duration,90);assert.equal(s.settings.teams,4);
}
{ // Завершение встречи показывает итоги; к записям можно вернуться.
 const f=fixture({stage:7});f.node('next-stage').onclick();assert.equal(f.saved().completed,true);assert.match(f.node('app').innerHTML,/Итоги встречи/);f.node('reopen').onclick();assert.equal(f.saved().completed,false);
}
console.log('Интерфейс: восстановление, переходы, ресурс, таймер и окончание времени, вкладки, хранилище, стартовая форма, завершение — пройдены.');
