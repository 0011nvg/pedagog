'use strict';
// Minimal DOM boundary for controller regressions. Visual/browser checks are separate.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture(){
 const nodes=new Map(),events={},storage=new Map();let document;
 const node=id=>{if(!nodes.has(id))nodes.set(id,{id,tagName:'DIV',value:'',checked:false,textContent:'',dataset:{},style:{},classList:{toggle(){}},focus(){document.activeElement=this;},scrollIntoView(){},querySelector(){return node('h1');},querySelectorAll(){return [];},set innerHTML(html){this.html=html;for(const m of html.matchAll(/<(input|select|textarea)[^>]*id="([^"]+)"[^>]*>/g)){const el=node(m[2]);el.tagName=m[1].toUpperCase();el.checked=/\bchecked\b/.test(m[0]);if(m[1]==='input')el.value=m[0].match(/value="([^"]*)"/)?.[1]||'';if(m[1]==='select'){const end=html.indexOf('</select>',m.index);const options=[...html.slice(m.index,end).matchAll(/<option value="([^"]*)"([^>]*)>/g)];el.value=(options.find(o=>/selected/.test(o[2]))||options[0])?.[1]||'';}}},get innerHTML(){return this.html||'';}});return nodes.get(id);};
 document={activeElement:null,getElementById:node,querySelector:()=>node('submit'),body:{classList:{toggle(){},contains(){return false;}}}};
 const ctx={document,location:{search:''},URLSearchParams,Date,console,setInterval(){},setTimeout(){},confirm:()=>true,alert(){},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}};
 ctx.window=ctx;ctx.addEventListener=(name,fn)=>events[name]=fn;vm.createContext(ctx);
 for(const f of ['src/deck.js','platform/metadata.js','platform/engine.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);
 const E=ctx.PEDAGOG_SESSION,s=E.create({people:6,teams:1,duration:20,caseId:'С-03',roleMode:'random',resourceMode:'choice',facilitator:true});
 const key='pedagog-platform-session-v3';storage.set(key,JSON.stringify(s));
 vm.runInContext(fs.readFileSync('platform/session.js','utf8'),ctx);node('restore-session').onclick();
 return {ctx,node,events,storage,key};
}
{
 const f=fixture();f.node('stage-select').value='5';f.node('stage-select').onchange();assert.equal(JSON.parse(f.storage.get(f.key)).rounds[0].stage,0);assert.match(f.node('game-status').textContent,/ресурс/);
 f.node('stage-select').value='4';f.node('stage-select').onchange();f.node('resource-select').value='Р-02';f.node('resource-select').onchange();f.node('next-stage').onclick();assert.equal(JSON.parse(f.storage.get(f.key)).rounds[0].stage,5);
}
{
 const f=fixture(),other=JSON.parse(f.storage.get(f.key));other.rounds[0].teams[0].notes.first='Запись из другой вкладки';const raw=JSON.stringify(other);f.storage.set(f.key,raw);
 // A delayed storage event must not let a stale tab overwrite a newer save.
 f.node('stage-select').value='1';f.node('stage-select').onchange();assert.equal(f.storage.get(f.key),raw);assert.match(f.node('app').innerHTML,/другой вкладке/);
 f.events.pagehide();assert.equal(f.storage.get(f.key),raw);
}
{
 const f=fixture();f.storage.delete(f.key);f.events.storage({key:f.key});f.events.pagehide();assert.equal(f.storage.has(f.key),false);assert.match(f.node('game-status').textContent,/другой вкладке/);
}
{
 const f=fixture();f.ctx.localStorage.setItem=()=>{throw Error('quota');};f.node('stage-select').value='1';f.node('stage-select').onchange();assert.match(f.node('app').innerHTML,/Автосохранение недоступно/);
}
console.log('Session controller: stage guard, concurrent save/delete protection, pagehide and quota warning passed.');
