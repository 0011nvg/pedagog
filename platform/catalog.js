/* ПЕДАГОГ · каталог ситуаций (library.html) и справочник ролей и ресурсов (cards.html). */
(function(){
'use strict';
const D=globalThis.PEDAGOG_DATA,M=globalThis.PEDAGOG_META,E=globalThis.PEDAGOG_SESSION,A=globalThis.PEDAGOG_ART;
const app=document.getElementById('app');if(!app||!D)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const T=id=>D.roleTypes.find(t=>t.id===id);
const accent=M.themeColors;
const page=document.body.dataset.page;
const enterLabel=n=>n===0?'С начала':`С обстоятельством ${n}`;
const sub=`<nav class="subnav" aria-label="Материалы игры"><a href="library.html"${page==='library'?' aria-current="page"':''}>Ситуации</a><a href="cards.html"${page==='cards'?' aria-current="page"':''}>Роли, ресурсы, рефлексия</a><a href="methods.html">Помощь ведущему</a></nav>`;

function roleCard(c,x){const t=T(x.type);return `<article class="role-card" style="--c:${t.color}"><header>${A.badge(x.type,'lg')}<div><b>${esc(x.label)}</b><small>${esc(t.title)} · ${enterLabel(x.enters)}</small></div></header>${x.traits&&x.traits.length?`<p class="traits" aria-label="Характер: ${esc(x.traits.join(', '))}">${x.traits.map(w=>`<span>${esc(w)}</span>`).join('')}</p>`:''}
<dl><dt>Позиция</dt><dd>${esc(x.position)}</dd><dt>Что знает</dt><dd>${esc(x.knows)}</dd><dt>Чего хочет</dt><dd>${esc(x.wants)}</dd><dt>Переживает</dt><dd>${esc(x.feels)}</dd><dt>Отвечает за</dt><dd>${esc(x.zone)}</dd></dl><div class="ask">${esc(x.ask)}</div></article>`;}
function eventCard(c,ev,n){return `<article class="event-card"><div class="num"><span>${n}</span></div><p class="pill coral" style="justify-self:start">Обстоятельство ${n}</p><h3>${esc(ev.title)}</h3><p>${esc(ev.text)}</p><p class="enter">${ev.adds.map(k=>{const x=c.cast.find(r=>r.key===k);return A.badge(x.type,'sm')+' '+esc(x.label);}).join(' · ')} — входит в игру</p><p class="q">${esc(ev.ask)}</p></article>`;}
function caseCard(c){const order=E.castOrder(c);return `<a class="case-card" id="${esc(c.id)}" href="library.html?case=${encodeURIComponent(c.id)}" style="--accent:${accent[c.theme]||'#3B4A99'}"><div class="meta"><span class="pill soft">${esc(c.theme)}</span><span class="id">${esc(c.id)}</span></div><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p><div class="foot"><span class="badges">${order.map(x=>A.badge(x.type,'sm')).join('')}</span><small>${order.length} ролей · ${esc(c.grade)}</small></div></a>`;}

function passport(c){
  const first=c.cast.filter(x=>x.enters===0),later=c.cast.filter(x=>x.enters>0);
  document.title=c.title+' — ПЕДАГОГ';
  app.innerHTML=`<section class="page-hero"><div class="wrap"><p class="eyebrow">${esc(c.id)} · ${esc(c.theme)} · ${esc(c.level)} уровень</p><h1>${esc(c.title)}</h1><p class="lead">${esc(c.grade)} · ${c.cast.length} ролей · 3 обстоятельства</p>
  <div class="actions"><a class="btn white" href="game.html?duration=40&amp;case=${encodeURIComponent(c.id)}">Играть 40 минут</a><a class="btn ghost-light" href="game.html?duration=15&amp;case=${encodeURIComponent(c.id)}">15 минут</a><a class="btn ghost-light" href="print.html?case=${encodeURIComponent(c.id)}">Печатный комплект</a></div>
  <nav class="subnav"><a href="library.html">← Все ситуации</a></nav></div><div class="hero-deco">${A.pageDeco(31)}</div></section>
  <section class="page-body"><div class="wrap passport">
   <div style="display:grid;gap:22px">
    <h2 style="font-size:28px;margin:0">Первые роли</h2>
    ${first.map(x=>roleCard(c,x)).join('')}
    <details class="spoiler"><summary>Для ведущего: как развивается ситуация — ${later.length} ролей и 3 обстоятельства. Не показывайте участникам заранее.</summary><div class="inner">
     ${c.events.map((ev,i)=>eventCard(c,ev,i+1)+later.filter(x=>x.enters===i+1).map(x=>roleCard(c,x)).join('')).join('')}
    </div></details>
    <details class="spoiler"><summary>Для ведущего: возможные подходы к решению и их последствия. Не показывайте до этапа «Поиск решения».</summary><div class="inner"><ol class="options">${(c.options||[]).map(x=>`<li><b>${esc(x.title)}.</b> ${esc(x.step)} <span class="muted">${esc(x.result)}</span></li>`).join('')}</ol><p class="small muted" style="margin:0">Это примеры, а не правильные ответы: группа может предложить свой вариант.</p></div></details>
    ${c.advice?`<details class="spoiler"><summary>Рекомендации педагогу: что важно понять, как поступить, чего избегать. Откройте после игры и обсуждения.</summary><div class="inner"><div class="advice-grid"><section><h4>Что важно понять?</h4><p>${esc(c.advice.understand)}</p></section><section><h4>Как лучше поступить?</h4><ol>${c.advice.actions.map(a=>`<li>${esc(a)}</li>`).join('')}</ol></section><section class="avoid"><h4>Чего лучше избегать?</h4><p>${esc(c.advice.avoid)}</p></section></div></div></details>`:''}
    <div class="panel flat"><h3>Вопросы для рефлексии</h3><ul class="qs">${c.debrief.map(q=>`<li>${esc(q)}</li>`).join('')}</ul></div>
    ${c.takeaways?`<div class="panel flat"><h3>Профессиональные выводы</h3><ul class="qs">${c.takeaways.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div>`:''}
    <div class="note-card"><h3>Границы ситуации</h3><p style="margin:0">${esc(c.note)}</p></div>
   </div>
   <aside style="display:grid;gap:18px;align-self:start" class="situation-aside">
    <div class="situation-card"><p class="pill" style="color:#fff;border-color:rgba(255,255,255,.45)">Исходная ситуация</p><h2 style="font-size:26px;margin-top:14px">${esc(c.title)}</h2><p>${esc(c.text)}</p><p class="opening">${esc(c.opening)}</p>
     <dl><dt>Дилемма</dt><dd>${esc(c.dilemma)}</dd><dt>Что нужно получить</dt><dd>${esc(c.goal)}</dd><dt>Роли по порядку входа</dt><dd><span class="badges">${E.castOrder(c).map(x=>A.badge(x.type,'sm')).join('')}</span></dd></dl></div>
    <div class="panel flat"><h3>Ресурсы для поиска решения</h3><div style="display:grid;gap:10px">${c.resourceIds.map(id=>{const r=D.resources.find(x=>x.id===id);return `<div class="res-card"><span class="id">${r.id}</span><h3>${esc(r.title)}</h3><p>${esc(r.text)}</p></div>`;}).join('')}</div></div>
   </aside></div></section>`;
}

function list(){
  const q=new URLSearchParams(location.search);
  const st={theme:q.get('theme')||'',level:'',role:'',text:''};
  app.innerHTML=`<section class="page-hero"><div class="wrap"><p class="eyebrow">Библиотека</p><h1><span class="dim">${D.situations.length} ситуаций</span> из школьной жизни</h1><p class="lead">В каждой — пять или шесть ролей, которые входят в разговор постепенно, три обстоятельства, меняющие картину, и несколько возможных подходов к решению. Откройте паспорт, чтобы подготовиться, или сразу начните игру.</p>${sub}</div><div class="hero-deco">${A.pageDeco(17)}</div></section>
  <section class="page-body"><div class="wrap">
   <div class="filters"><input type="search" id="q" placeholder="Поиск: отметка, чат, опоздания, форма…" aria-label="Поиск по ситуациям">
    <select id="lvl" aria-label="Уровень"><option value="">Любой уровень</option>${M.levels.map(l=>`<option>${l}</option>`).join('')}</select>
    <select id="role" aria-label="Роль в ситуации"><option value="">Любая роль</option>${D.roleTypes.map(t=>`<option value="${t.id}">${esc(t.title)}</option>`).join('')}</select></div>
   <div class="chips" role="group" aria-label="Темы" style="margin-bottom:26px">${['',...M.themes].map(t=>`<button class="chip" data-theme="${esc(t)}" aria-pressed="${t===st.theme}">${t?esc(t):'Все темы'}</button>`).join('')}</div>
   <p class="muted small" id="count" aria-live="polite"></p><div class="case-grid" id="grid"></div></div></section>`;
  const $=id=>document.getElementById(id);
  function draw(){const items=D.situations.filter(c=>(!st.theme||c.theme===st.theme)&&(!st.level||c.level===st.level)&&(!st.role||c.cast.some(x=>x.type===st.role))&&(!st.text||(c.title+' '+c.text+' '+c.cast.map(x=>x.label).join(' ')).toLocaleLowerCase('ru').includes(st.text)));
    $('grid').innerHTML=items.map(caseCard).join('')||'<p>Ничего не найдено. Сбросьте фильтры.</p>';$('count').textContent=`Показано ${items.length} из ${D.situations.length}`;}
  $('q').oninput=e=>{st.text=e.target.value.trim().toLocaleLowerCase('ru');draw();};
  $('lvl').onchange=e=>{st.level=e.target.value;draw();};$('role').onchange=e=>{st.role=e.target.value;draw();};
  app.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{st.theme=b.dataset.theme;app.querySelectorAll('.chip').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));draw();});
  draw();
  const legacy=location.hash.slice(1);if(legacy){const el=document.getElementById(decodeURIComponent(legacy));if(el)el.scrollIntoView();}
}

function cards(){
  const usage=id=>D.situations.filter(c=>c.cast.some(x=>x.type===id)).length;
  app.innerHTML=`<section class="page-hero teal"><div class="wrap"><p class="eyebrow">Справочник</p><h1><span class="dim">Роли,</span> ресурсы и рефлексия</h1><p class="lead">Одиннадцать допустимых ролей, карточка наблюдателя, пятнадцать ресурсов для поиска решения и десять вопросов рефлексии — общие для онлайн-игры и печатного комплекта.</p>${sub}</div><div class="hero-deco">${A.pageDeco(53)}</div></section>
  <section class="page-body"><div class="wrap">
   <div class="section-head"><p class="eyebrow">Роли</p><h2>Кто участвует в ситуациях</h2><p class="lead">В каждой ситуации — 5–6 ролей из этого списка. Тьютор, представитель родительского сообщества и педагог дополнительного образования в игру не входят. Медиатор появляется только там, где его участие обосновано.</p></div>
   <div class="grid two">${D.roleTypes.map(t=>`<article class="role-card" id="${t.id}" style="--c:${t.color}"><header>${A.badge(t.id,'lg')}<div><b>${esc(t.title)}</b><small>${t.id} · в ${usage(t.id)} ситуациях</small></div></header><p style="margin:0">${esc(t.text)}</p></article>`).join('')}
    <article class="role-card" id="${D.observer.id}" style="--c:#676C90"><header><span class="badge lg" style="--c:#fff;--i:#3B4A99;box-shadow:inset 0 0 0 2px #C9CCEB">НБ</span><div><b>${esc(D.observer.title)}</b><small>Для свободных участников</small></div></header><p style="margin:0">${esc(D.observer.text)}</p></article></div>
   <div class="section-head" style="margin-top:70px"><p class="eyebrow">Ресурсы</p><h2>Инструменты для поиска решения</h2><p class="lead">На этапе «Поиск решения» команда по желанию берёт одну карточку как инструмент. К каждой ситуации предложены подходящие.</p></div>
   <div class="grid three">${D.resources.map(r=>`<div class="res-card" id="${r.id}"><span class="id">${r.id}</span><h3>${esc(r.title)}</h3><p>${esc(r.text)}</p></div>`).join('')}</div>
   <div class="section-head" style="margin-top:70px"><p class="eyebrow">Рефлексия</p><h2>Вопросы после выхода из ролей</h2></div>
   <div class="grid three">${D.reflections.map(r=>`<div class="res-card refl" id="${r.id}"><span class="id">${r.id}</span><h3>${esc(r.title)}</h3><p>${esc(r.text)}</p></div>`).join('')}</div>
  </div></section>`;
}

if(page==='cards')cards();
else{const id=new URLSearchParams(location.search).get('case');const c=D.situations.find(x=>x.id===id);if(c)passport(c);else list();}
})();
