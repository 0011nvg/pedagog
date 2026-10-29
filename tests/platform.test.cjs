'use strict';
/* Сайт и реестр: страницы, ссылки, якоря, инварианты ситуаций. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),cp=require('child_process');
const root=path.resolve(__dirname,'..');
const pages=['index','about','game','print','library','cards','rules','methods','author'];
const ctx={};vm.createContext(ctx);for(const f of ['src/deck.js','platform/metadata.js','platform/engine.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const D=ctx.PEDAGOG_DATA;
const ALLOWED=['Ученик','Одноклассник','Учитель-предметник','Классный руководитель','Родитель','Педагог-психолог','Социальный педагог','Заместитель директора','Директор школы','Советник директора по воспитанию','Школьный медиатор'];
assert.deepEqual(D.roleTypes.map(t=>t.title),ALLOWED,'допустимые роли');
const forbidden=/тьютор|педагог дополнительного образования|представител[ья] родительского|родительск(ий|ого) комитет/i;
assert(!forbidden.test(fs.readFileSync(path.join(root,'src/deck.js'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'')),'запрещённые роли не вернулись в реестр');
const ids=[...D.situations,...D.resources,...D.reflections,...D.roleTypes].map(c=>c.id);assert.equal(new Set(ids).size,ids.length,'уникальные id');
assert(D.situations.length>=35,'не меньше 35 ситуаций');assert(!D.situations.some(c=>c.id==='С-07'),'С-07 исключена автором');
const sequences=new Set();
for(const c of D.situations){
  assert(c.cast.length>=5,c.id+': не меньше пяти ролей');
  const keys=c.cast.map(x=>x.key);assert.equal(new Set(keys).size,keys.length,c.id+': ключи ролей');
  const first=c.cast.filter(x=>x.enters===0).length;assert(first>=2&&first<=3,c.id+': 2–3 первые роли');
  assert.equal(c.events.length,3,c.id+': три обстоятельства');
  c.events.forEach((ev,i)=>{assert(ev.adds.length>=1,c.id+': обстоятельство вводит роль');assert(ev.ask.endsWith('?'));ev.adds.forEach(k=>assert.equal(c.cast.find(x=>x.key===k).enters,i+1,c.id+': вход '+k));});
  for(const x of c.cast){assert(D.roleTypes.some(t=>t.id===x.type),c.id+' тип');for(const f of ['label','position','knows','wants','feels','zone','ask'])assert(x[f]&&x[f].length>3,`${c.id}/${x.key}: ${f}`);assert(x.ask.endsWith('?'));if(x.enters)assert(c.events[x.enters-1].adds.includes(x.key));}
  assert(new Set(c.cast.map(x=>x.type)).size>=3,c.id+': разные позиции');
  assert(c.dilemma.endsWith('?')&&c.debrief.length===3&&c.note&&c.goal&&c.opening,c.id);
  for(const id of c.resourceIds)assert(D.resources.some(r=>r.id===id));
  assert(Array.isArray(c.options)&&c.options.length>=2&&c.options.every(o=>o.title&&o.step&&o.result),c.id+': варианты решений с последствиями');
  assert(Array.isArray(c.takeaways)&&c.takeaways.length>=2,c.id+': профессиональные выводы');
  assert(D.situations.filter(x=>x.title===c.title).length===1,c.id+': уникальное название');
  sequences.add(c.cast.filter(x=>x.enters).sort((a,b)=>a.enters-b.enters).map(x=>x.type).join('>'));
}
assert(sequences.size>=D.situations.length-2,'порядок входа ролей не повторяется');
for(const p of pages){const html=fs.readFileSync(path.join(root,p+'.html'),'utf8');assert(/<html lang="ru"/.test(html));assert(html.includes('id="app"'));assert.equal((html.match(/<main\b/g)||[]).length,1);
  const tags=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(tags).size,tags.length,'duplicate IDs in '+p);
  for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){const u=m[1];if(/^(https?:|mailto:|tel:|#|data:)/.test(u))continue;const file=decodeURIComponent(u.split(/[?#]/)[0]);assert(fs.existsSync(path.join(root,file)),`${p}: missing ${file}`);}
  for(const m of html.matchAll(/href="([^"#]*)#([^" ]+)"/g)){if(/^https?:/.test(m[1]))continue;const target=(m[1].split('?')[0]||p+'.html');const content=fs.readFileSync(path.join(root,target),'utf8');assert(content.includes('id="'+decodeURIComponent(m[2])+'"')||['library.html','cards.html'].includes(target),p+': anchor '+target+'#'+m[2]);}}
for(const f of ['shared','metadata','catalog','engine','session','print','print-layout','art'])cp.execFileSync(process.execPath,['--check',path.join(root,'platform',f+'.js')]);
for(const p of ['about','rules','methods','author'])assert(fs.statSync(path.join(root,'platform/pages',p+'.html')).size>1000);
assert(fs.readFileSync(path.join(root,'rules.html'),'utf8').includes('id="usage"'));
assert(fs.readFileSync(path.join(root,'print.html'),'utf8').includes('src="print-pack.js'),'пакет доступа к печати подключён');
for(const f of fs.readdirSync(path.join(root,'platform/fonts')).filter(f=>f.endsWith('.woff2')))assert(fs.readFileSync(path.join(root,'platform/style.css'),'utf8').includes(f),'шрифт подключён: '+f);
const missing=fs.readFileSync(path.join(root,'404.html'),'utf8');for(const m of missing.matchAll(/(?:href|src)="([^"]+)"/g))assert(/^(#|https?:|data:|\/pedagog\/)/.test(m[1]),'relative 404 link: '+m[1]);
/* Удалённые по решению автора элементы не возвращаются в интерфейс. */
const gone=/Редакция \d|редакция \d|Карта школы|другом компьютере|Встреча прежней редакции|не тема игрового выбора|не тема для игрового|id="import-file"|id="map"|id="safety"/;
for(const f of [...pages.map(p=>p+'.html'),'404.html','platform/session.js','platform/print.js','platform/catalog.js'])assert(!gone.test(fs.readFileSync(path.join(root,f),'utf8')),'удалённый элемент вернулся: '+f);
assert(!fs.readFileSync(path.join(root,'platform/art.js'),'utf8').includes('M18.6 13.2h10.8'),'эмблема с буквой П удалена');
const art=fs.readFileSync(path.join(root,'index.html'),'utf8');assert(art.includes('>ШКОЛА</text>')&&art.includes('twinkle'),'школа с надписью и мерцающие звёзды на главной');
/* Об авторе: сдержанно и точно — порядок блоков, полные официальные названия, без стажа и без отдельного акцента на рецензии. */
{const a=fs.readFileSync(path.join(root,'author.html'),'utf8');
 const order=['Достижения','Экспертная деятельность','Выступления и мастер-классы','Методические разработки'].map(t=>a.indexOf('<h2>'+t+'</h2>'));assert(order.every(i=>i>0)&&order.every((x,i)=>!i||x>order[i-1]),'порядок блоков об авторе');
 const first=a.slice(order[0],order[1]);assert(first.indexOf('Победитель конкурсного трека «Наставничество» проекта «Флагманы образования»')<first.indexOf('Призёр'),'первым — «Флагманы образования»');
 ['Президентской платформы «Россия — страна возможностей»','краевого профессионального конкурса «Лучшие практики наставничества» в номинации «Практики из сферы образования»','краевого профессионального конкурса «Битва наставников»','квалификационную категорию «педагог-наставник»','русский язык как неродной'].forEach(t=>assert(a.includes(t),'автор: '+t));
 assert(!/14-летн|14 лет|переподготовк|Рецензия Кубанского государственного университета<\/h2>/.test(a),'убраны стаж, переподготовка, отдельный акцент на рецензии');}
assert(!/href="https?:\/\/(?!vk\.ru|vk\.com)/.test(fs.readFileSync(path.join(root,'about.html'),'utf8')),'в разделе «Об игре» нет ссылок на внешние сайты');
{const L2=(()=>{const c={};vm.createContext(c);for(const f of ['src/deck.js','platform/metadata.js','platform/engine.js','platform/print-layout.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);return c;})();
 const k=L2.PEDAGOG_PRINT_LAYOUT.kit(D.situations[0],L2.PEDAGOG_SESSION);k.filter(x=>x.kind==='role'||x.kind==='event').forEach(x=>{assert(x.back.includes('pc-emblem')&&/--a:#/.test(x.back),'цветная рубашка с эмблемой');assert(!/pc-badge xl|pc-pin xl/.test(x.back),'на рубашке нет буквенных кружков');});}
console.log(`PASS platform: ${D.situations.length} ситуаций, ${D.situations.reduce((n,c)=>n+c.cast.length,0)} ролей, ${sequences.size} разных порядков входа; 9 страниц, ссылки и якоря.`);
