'use strict';
/* ПЕДАГОГ · сборка статических страниц для GitHub Pages.
   Источники: src/deck.js (игровые данные), platform/engine.js (регламент), platform/art.js (графика),
   platform/pages/*.html (содержательные страницы). Сгенерированные HTML в корне вручную не правятся. */
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..'),ctx={};vm.createContext(ctx);
for(const f of ['src/deck.js','platform/metadata.js','platform/engine.js','platform/art.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const D=ctx.PEDAGOG_DATA,E=ctx.PEDAGOG_SESSION,A=ctx.PEDAGOG_ART;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const T=id=>D.roleTypes.find(t=>t.id===id);
const ASSET_VERSION=D.version+'-'+D.edition.replace(/\./g,'');

const routes=[['index','Главная'],['about','Об игре'],['game','Онлайн-игра'],['print','Печать'],['library','Ситуации'],['cards','Роли и ресурсы'],['rules','Правила'],['methods','Ведущему'],['author','Об авторе']];
const NAV=[['about','Об игре'],['library','Ситуации'],['rules','Правила'],['methods','Ведущему'],['print','Печать']];
const DESC='ПЕДАГОГ — деловая игра для педагогов: школьная ситуация раскрывается постепенно, в ней участвуют пять и больше ролей — ученик, учитель, родитель, классный руководитель, психолог, администрация. Онлайн на 15, 40 или 90 минут и печатный комплект.';

function shell(page,title,body,scripts=[]){
  const active=page==='cards'?'library':page;
  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${esc(DESC)}"><meta name="theme-color" content="#3B4A99"><title>${esc(title)} — ПЕДАГОГ</title>
<link rel="preload" href="platform/fonts/montserrat-cyrillic-800-normal.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="platform/fonts/onest-cyrillic-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(A.mark(48).replace(' aria-hidden="true" focusable="false"',' xmlns="http://www.w3.org/2000/svg"'))}">
<link rel="stylesheet" href="platform/style.css?v=${ASSET_VERSION}">${page==='print'?`<link rel="stylesheet" href="platform/print.css?v=${ASSET_VERSION}">`:''}</head>
<body data-page="${page}"><a class="skip" href="#app">К содержанию</a>
<header class="site-header"><div class="header-inner"><a class="brand" href="index.html" aria-label="ПЕДАГОГ — на главную">${A.mark(44)}<span><b>ПЕДАГОГ</b><small>деловая игра<br>для педагогов</small></span></a>
<button id="menuToggle" aria-controls="navigation" aria-expanded="false" aria-label="Открыть навигацию">Меню</button>
<nav id="navigation" class="site-nav" aria-label="Основная навигация">${NAV.map(([p,n])=>`<a href="${p}.html"${active===p?' aria-current="page"':''}>${n}</a>`).join('')}<a class="nav-cta" href="game.html"${page==='game'?' aria-current="page"':''}>Играть онлайн</a></nav></div></header>
<main><div id="app" tabindex="-1">${body}</div></main>
<footer class="site-footer"><div class="footer-inner"><div><strong>ПЕДАГОГ</strong><p>Авторская деловая игра Виктории Геннадьевны Науменко. Редакция ${esc(D.version)} от ${esc(D.edition)}.</p><p class="small">УДК 371.124 · ББК 74.04</p></div>
<div class="footer-links"><a href="game.html">Онлайн-игра</a><a href="print.html">Печатный комплект</a><a href="library.html">Ситуации</a><a href="cards.html">Роли и ресурсы</a></div>
<div class="footer-links"><a href="about.html">Об игре</a><a href="rules.html">Правила</a><a href="methods.html">Методический кабинет</a><a href="author.html">Об авторе</a><a href="rules.html#usage">Условия использования</a></div></div>
<p class="footer-note">© В. Г. Науменко, 2025–2026. Игра не используется для аттестации и оценки сотрудников. Шрифты Montserrat и Onest — SIL Open Font License 1.1.</p></footer>
<script src="platform/shared.js?v=${ASSET_VERSION}"></script>${scripts.map(s=>`<script src="${s}?v=${ASSET_VERSION}"></script>`).join('')}</body></html>`;}

/* ---------- Главная ---------- */
const example=[
  ['1','Ситуация','За две минуты до звонка ученик закрывает тетрадь: «Я это делать не буду».',['Ро-03','Ро-01'],''],
  ['2','Первые позиции','Учитель настаивает, ученик закрывается. Кажется — обычная дерзость.',[],''],
  ['3','Обстоятельство','Сосед по парте: утром его отчитали при всех, потом весь день дразнили.',['Ро-02'],'event'],
  ['4','Обстоятельство','Классный руководитель: за неделю это четвёртое замечание от разных учителей.',['Ро-04'],'event'],
  ['5','Обстоятельство','Мама вечером: «Сын говорит, что на него сегодня кричали все учителя».',['Ро-05'],'event'],
  ['6','Решение','Не наказание, а договорённость взрослых о том, как говорить с учеником.',[],'final']];
const featured=['С-12','С-22','С-06'].map(id=>D.situations.find(c=>c.id===id));
const accent={'Урок и мотивация':'#3B4A99','Оценивание':'#6874C2','Семья и школа':'#E0A64E','Поддержка ученика':'#2A958E','Отношения и воспитание':'#E8673F','Коллеги и наставничество':'#8366B0','Нагрузка и организация':'#28336E'};
function caseCard(c){const order=E.castOrder(c);return `<a class="case-card" href="library.html?case=${encodeURIComponent(c.id)}" style="--accent:${accent[c.theme]||'#3B4A99'}"><div class="meta"><span class="pill soft">${esc(c.theme)}</span><span class="id">${esc(c.id)}</span></div><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p><div class="foot"><span class="badges">${order.map(x=>A.badge(x.type,'sm')).join('')}</span><small>${order.length} ролей · ${esc(c.grade)}</small></div></a>`;}
function strip(rounds){return `<div class="stage-strip" aria-hidden="true">${rounds.flat().map(([k,m])=>`<span class="${/^ev/.test(k)?'ev':['solution','reflect','summary'].includes(k)?'fin':k==='break'?'brk':''}" style="flex:${m}"></span>`).join('')}</div>`;}
const pillars=[['П','Практика рефлексии','Замечать точку выбора: что повлияло на решение и что попробовать в следующий раз.'],['Е','Единое поле решений','Сопоставлять интересы участников и искать понятный всем следующий шаг.'],['Д','Диалог','Обсуждать сложную работу без соревнования в опыте, давать место разным взглядам.'],['А','Автономия','Видеть пространство собственного решения внутри профессиональных обязанностей.'],['Г','Готовность к неопределённости','Уточнять недостающее, брать паузу и выбирать посильный шаг.'],['О','Ответственность','Отвечать за свои слова, видеть пределы компетенции, вовремя просить поддержки.'],['Г','Горизонт роста','Переводить обсуждение в небольшой проверяемый шаг.']];

const homepage=`
<section class="hero"><div class="wrap hero-grid"><div>
 <span class="pill">Деловая игра для педагогов · редакция ${esc(D.version)}</span>
 <h1><span class="dim">Одна ситуация&nbsp;—</span>пять взглядов</h1>
 <p class="lead">Школьный случай раскрывается постепенно: сначала его видят учитель и ученик, потом в разговор входят одноклассник, классный руководитель, родитель, психолог, администрация. С каждым обстоятельством картина меняется — и решение находят вместе.</p>
 <div class="actions"><a class="btn white" href="game.html">Начать игру онлайн →</a><a class="btn ghost-light" href="print.html">Печатный комплект</a></div>
 <ul class="hero-facts"><li><b>${D.situations.length} ситуаций</b><span>из обычной школьной жизни</span></li><li><b>5–6 ролей</b><span>в каждой ситуации</span></li><li><b>15 · 40 · 90 мин</b><span>онлайн или за столом</span></li></ul>
</div></div>${A.heroScene()}</section>

<section class="band" id="how"><div class="wrap"><div class="section-head"><p class="eyebrow">Как раскрывается ситуация</p><h2>Маршрут одного случая</h2><p class="lead">Ситуация «Две минуты до звонка». Каждый этап добавляет новый факт и нового участника — и проверяет, насколько поспешным было первое впечатление.</p></div>
<ol class="route" aria-label="Этапы раскрытия ситуации">${example.map(([n,h,p,ids,cls])=>`<li class="stop ${cls}"><div class="pin"><span>${n}</span></div><h3>${h}</h3><p>${p}</p>${ids.length?`<div class="enter">${ids.map(id=>A.badge(id,'sm')).join('')}<span>${ids.length>1?'первые роли':'входит в игру'}</span></div>`:''}</li>`).join('')}</ol>
<div class="actions"><a class="btn primary" href="game.html?duration=15&amp;case=%D0%A1-01">Сыграть этот случай за 15 минут</a><a class="link-arrow" href="rules.html#round">Как устроен раунд</a></div></div></section>

<section class="band band-white ribbon-band"><div class="wrap"><div class="section-head"><p class="eyebrow">Роли</p><h2><span class="dim">Каждый видит</span> свою часть картины</h2><p class="lead">В игре только те участники, которые действительно есть в российской школе. Ни один персонаж не прав во всём и не виноват во всём, а администрация — не судья с готовым ответом.</p></div>
<div class="roles-legend">${D.roleTypes.map(t=>`<div class="role-chip">${A.badge(t.id)}<span>${esc(t.title)}</span></div>`).join('')}</div></div>
<div style="height:clamp(170px,20vw,280px);margin:30px 0 calc(clamp(64px,9vw,120px) * -0.6)">${A.ribbons()}</div></section>

<section class="band"><div class="wrap"><div class="section-head"><p class="eyebrow">Библиотека</p><h2><span class="dim">Жизненные ситуации,</span> а не чрезвычайные происшествия</h2><p class="lead">Отметки, домашние задания, школьные чаты, замены, конфликты детей, новенький в классе, разговор с родителями. Обычная школьная жизнь, в которой у каждого своя правда.</p></div>
<div class="case-grid">${featured.map(caseCard).join('')}</div><div class="actions"><a class="btn primary" href="library.html">Все ${D.situations.length} ситуаций</a></div></div></section>

<section class="band band-indigo"><div class="wrap"><div class="section-head"><p class="eyebrow">Время</p><h2><span class="dim">Три формата</span> на один регламент</h2><p class="lead">Онлайн и в печатной инструкции этапы одинаковы. Оранжевым показаны обстоятельства, бирюзовым — решение и рефлексия.</p></div>
<div class="format-tiles">${[15,40,90].map(m=>{const f=E.FORMATS[m];return `<article class="format-tile${m===40?' accent':''}"><div class="big">${m}<small>минут</small></div><h3>${esc(f.title)}</h3><p>${esc(f.lead)} <span class="muted">${esc(f.people)}.</span></p>${strip(f.rounds)}<a class="link-arrow" href="game.html?duration=${m}" style="${m===40?'color:#fff':''}">Начать</a></article>`;}).join('')}</div></div></section>

<section class="band"><div class="wrap"><div class="section-head"><p class="eyebrow">Два способа провести</p><h2>На экране или за столом</h2></div>
<div class="ways"><article class="way online"><h3>Онлайн-игра</h3><p>Сайт ведёт по этапам с таймером, распределяет роли между участниками, открывает обстоятельства в нужный момент и собирает решения. Работает с одного экрана — в зале или через демонстрацию экрана.</p><a class="btn white" href="game.html">Начать игру →</a><div class="way-art">${A.screenArt()}</div></article>
<article class="way table"><h3>Настольная игра</h3><p>Для каждой ситуации — комплект двусторонних карточек: ситуация, роли, закрытые обстоятельства, инструкция ведущего и рефлексия. Формат A4, удобно резать. Открывается по коду автора.</p><a class="btn white" href="print.html">Печатный комплект →</a><div class="way-art">${A.cardsArt()}</div></article></div></div></section>

<section class="band band-deep"><div class="wrap"><div class="section-head"><p class="eyebrow">Авторская концепция</p><h2><span class="dim">Семь опор</span> в слове «ПЕДАГОГ»</h2></div>
<div class="letters">${pillars.map(([l,h,p])=>`<article class="letter"><b>${l}</b><h3>${h}</h3><p>${p}</p></article>`).join('')}</div><div class="actions"><a class="link-arrow" href="about.html" style="color:#fff">Об игре и её основаниях</a></div></div></section>

<section class="cta-final"><div class="wrap"><p class="eyebrow">Для педсовета, МО, семинара</p><h2><span class="dim">Не экзамен на правильного учителя.</span> Практика профессионального выбора</h2><p class="lead">Здесь не оценивают педагогов и нет единственно верного ответа. Есть совместная задача: увидеть ситуацию глазами каждого и найти шаг, который учитывает достоинство всех участников.</p><div class="actions"><a class="btn white" href="game.html">Провести игру</a><a class="btn ghost-light" href="rules.html">Правила</a></div></div>${A.ridge()}</section>`;

/* ---------- Блоки для содержательных страниц ---------- */
function formatsHTML(){return `<div class="format-tiles">${[15,40,90].map(m=>{const f=E.FORMATS[m];return `<article class="format-tile${m===40?' accent':''}"><div class="big">${m}<small>минут</small></div><h3>${esc(f.title)}</h3><p>${esc(f.lead)} <span class="muted">${esc(f.people)}.</span></p>${f.rounds.map((r,i)=>`<div class="table-wrap"><table><caption>${f.rounds.length>1?`Раунд ${i+1}`:'Этапы'} · ${r.reduce((a,x)=>a+x[1],0)} мин</caption><tbody>${r.map(([k,min],j)=>`<tr><td>${j+1}. ${esc(E.STAGES[k].title)}</td><td class="num">${min}</td></tr>`).join('')}</tbody></table></div>`).join('')}</article>`;}).join('')}</div>`;}
function roundHTML(){const keys=['start','positions','ev1','ev2','ev3','solution','reflect'];return `<ol class="steps-list">${keys.map(k=>{const s=E.STAGES[k];return `<li class="${/^ev/.test(k)?'ev':['solution','reflect'].includes(k)?'fin':''}"><div><b>${esc(s.title)}</b>${esc(s.do)} <span class="muted">Итог: ${esc(s.result)}</span></div></li>`;}).join('')}</ol>`;}
function rolesHTML(){return `<div class="roles-legend">${D.roleTypes.map(t=>`<div class="role-chip">${A.badge(t.id)}<span>${esc(t.title)}</span></div>`).join('')}</div>`;}
function hero(page,{eyebrow,title,lead,teal=false,deco,sub=''}){return `<section class="page-hero${teal?' teal':''}"><div class="wrap"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1>${lead?`<p class="lead">${lead}</p>`:''}${sub}</div><div class="hero-deco">${A.pageDeco(deco)}</div></section>`;}
const HEROES={
  about:{eyebrow:'Об игре',title:'<span class="dim">Деловая игра</span> для педагогических коллективов',lead:'«ПЕДАГОГ» помогает рассматривать реальные школьные ситуации с разных сторон, понимать позиции участников и находить профессионально обоснованные решения.',deco:['Ро-04','Ро-01','Ро-08']},
  rules:{eyebrow:'Правила',title:'Как играть в «ПЕДАГОГ»',lead:'Одна ситуация, пять и больше ролей, три новых обстоятельства — и решение, которое учитывает всех. Правил немного: остальное подскажет сайт или карточка ведущего.',deco:['Ро-03','Ро-02','Ро-05']},
  methods:{eyebrow:'Методический кабинет',title:'<span class="dim">Ведущему:</span> подготовить встречу и удержать смысл',lead:'Опоры для ведущего — от выбора задачи до согласованных итогов. Начните с правил, затем используйте этот раздел при подготовке.',teal:true,deco:['Ро-06','Ро-10','Ро-04']},
  author:{eyebrow:'Об авторе',title:'<span class="dim">Науменко</span> Виктория Геннадьевна',lead:'Автор профессиональной деловой игры «ПЕДАГОГ».',deco:['Ро-03','Ро-04','Ро-09']}
};

/* ---------- Запись страниц ---------- */
for(const [page,title] of routes){let body,scripts=[];
  if(page==='index') body=homepage;
  else if(['game','print','library','cards'].includes(page)){
    body='<div class="wrap" style="padding:60px 0"><p>Загружаем…</p><noscript><div class="panel">Для интерактивных инструментов включите JavaScript. <a href="rules.html">Правила</a> и <a href="methods.html">методический кабинет</a> доступны без него.</div></noscript></div>';
    scripts=['src/deck.js','platform/metadata.js','platform/engine.js','platform/art.js'];
    if(page==='game')scripts.push('platform/session.js');else if(page==='print')scripts.push('print-pack.js','platform/print-layout.js','platform/print.js');else scripts.push('platform/catalog.js');
  } else {
    const file=path.join(root,'platform/pages',page+'.html');if(!fs.existsSync(file))throw new Error('Missing page source: '+page);
    body=hero(page,HEROES[page])+fs.readFileSync(file,'utf8').replace(/<!--FORMATS-->/g,formatsHTML()).replace(/<!--ROUND-->/g,roundHTML()).replace(/<!--ROLES-->/g,rolesHTML()).replace(/<!--COUNT-->/g,String(D.situations.length)).replace(/<!--RIDGE-->/g,A.ridge());
  }
  fs.writeFileSync(path.join(root,page+'.html'),shell(page,title,body,scripts));
}
fs.writeFileSync(path.join(root,'404.html'),shell('404','Страница не найдена',`<section class="page-hero"><div class="wrap"><p class="eyebrow">404</p><h1><span class="dim">Этой страницы</span> нет на маршруте</h1><p class="lead">Вернитесь к игре или выберите раздел в навигации.</p><div class="actions"><a class="btn white" href="index.html">На главную</a><a class="btn ghost-light" href="game.html">Начать игру</a></div></div><div class="hero-deco">${A.pageDeco()}</div></section>`).replace(/(href|src)="(?![a-z]+:|\/|#|data:)([^"]+)"/g,'$1="/pedagog/$2"').replace(/url\((fonts\/)/g,'url(/pedagog/platform/$1'));
console.log(`Built 9 pages + 404 from deck ${D.version} (${D.situations.length} situations).`);

// Копия для локальной браузерной проверки; HTML в корне — то, что публикует GitHub Pages.
const dist=path.join(root,'qa-preview');fs.rmSync(dist,{recursive:true,force:true});fs.mkdirSync(dist,{recursive:true});
for(const file of [...routes.map(([p])=>p+'.html'),'404.html','print-pack.js'])fs.copyFileSync(path.join(root,file),path.join(dist,file));
for(const dir of ['platform','src'])fs.cpSync(path.join(root,dir),path.join(dist,dir),{recursive:true});
