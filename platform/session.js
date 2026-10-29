/* ПЕДАГОГ · интерфейс онлайн-игры. Один экран ведущего; текущая встреча сохраняется в localStorage этого браузера
   (после перезагрузки страницы открывается на том же этапе).
   Ситуация раскрывается по этапам: новые обстоятельства и роли не показываются раньше своего этапа. */
(function(){
'use strict';
const E=globalThis.PEDAGOG_SESSION,D=globalThis.PEDAGOG_DATA,A=globalThis.PEDAGOG_ART,app=document.getElementById('app');
if(!app||!E)return;
const KEY='pedagog-platform-session-v5',OLD_KEYS=['pedagog-platform-session-v4','pedagog-platform-session-v3'];
const query=new URLSearchParams(location.search);
const setup={people:6,duration:40,caseId:'С-01',theme:''};
{const d=Number(query.get('duration'));const mapped=({20:15,45:40,60:40,120:90})[d]||d;if(E.DURATIONS.includes(mapped))setup.duration=mapped;
 const c=query.get('case');if(E.by('situations',c))setup.caseId=c;}
let state=null,warning='',modal=null,lastTick=Date.now(),pauseOpen=false,announce='';

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mmss=sec=>{const n=Math.max(0,Math.ceil(sec));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');};
const word=(n,a,b,c)=>{const x=Math.abs(n)%100,y=x%10;return x>10&&x<20?c:y===1?a:y>1&&y<5?b:c;};
const T=id=>D.roleTypes.find(t=>t.id===id);
const badge=(type,cls='')=>A.badge(type,cls);
const roleOf=(c,key)=>c.cast.find(x=>x.key===key);
const enterLabel=n=>n===0?'с начала':`с обстоятельством ${n}`;
const host=()=>state&&state.view==='host';

/* ---------- Хранение ---------- */
/* Несовместимое или повреждённое сохранение (например, от другой версии игры) молча удаляется — встреча начинается заново. */
function load(){try{for(const k of OLD_KEYS)localStorage.removeItem(k);const raw=localStorage.getItem(KEY);if(raw)state=E.restore(raw);}catch{state=null;try{localStorage.removeItem(KEY);}catch{}}}
function save(){if(!state)return;try{localStorage.setItem(KEY,JSON.stringify(state));}catch{warning='Браузер не сохраняет данные (приватный режим?). Скачайте итоги вручную перед закрытием вкладки.';}}
function download(name,text,type='text/plain'){const url=URL.createObjectURL(new Blob([text],{type:type+';charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}

/* ---------- Экран настройки ---------- */
function stagePlan(minutes){return E.FORMATS[minutes].rounds.map((r,i)=>`<div class="table-wrap"><table><caption>${E.FORMATS[minutes].rounds.length>1?`Раунд ${i+1} · `:''}${r.reduce((a,x)=>a+x[1],0)} мин</caption><tbody>${r.map(([k,m],j)=>`<tr><td>${j+1}. ${esc(E.STAGES[k].title)}</td><td class="num">${m}</td></tr>`).join('')}</tbody></table></div>`).join('');}
function renderSetup(){
  document.body.classList.remove('participant');
  const c=E.by('situations',setup.caseId),teams=E.teamsFor(setup.people);
  const cases=D.situations.filter(x=>!setup.theme||x.theme===setup.theme);
  const themes=[...new Set(D.situations.map(x=>x.theme))];
  app.innerHTML=`<section class="page-hero" style="padding-bottom:clamp(40px,5vw,64px)"><div class="wrap"><p class="eyebrow">Онлайн-игра</p><h1><span class="dim">Подготовка</span> встречи</h1><p class="lead">Три шага: время, число участников и ситуация. Дальше сайт распределит роли и поведёт по этапам — новые обстоятельства откроются в нужный момент.</p></div><div class="hero-deco">${A.pageDeco(23)}</div></section>
  <div class="wrap game-shell">
  ${warning?`<p class="note-card" role="alert">${esc(warning)}</p>`:''}
  <form class="setup" id="setup-form" novalidate><div class="panel">
   <section class="setup-step"><h3><span>1</span>Сколько у вас времени?</h3><div class="dur" role="group" aria-label="Формат">${E.DURATIONS.map(m=>`<button type="button" id="preset-${m}" data-dur="${m}" aria-pressed="${m===setup.duration}"><b>${m}</b><span>${esc(E.FORMATS[m].title)}</span><small>${esc(E.FORMATS[m].people)}</small></button>`).join('')}</div></section>
   <section class="setup-step"><h3><span>2</span>Сколько участников?</h3><div class="stepper"><button type="button" id="ppl-minus" aria-label="Меньше участников">−</button><input id="people" inputmode="numeric" type="number" min="1" max="40" value="${setup.people}" aria-label="Число участников"><button type="button" id="ppl-plus" aria-label="Больше участников">+</button></div>
    <p class="small muted" style="margin:0">${setup.people===1?'Один участник: вы последовательно посмотрите на ситуацию глазами каждой роли.':teams>1?`${teams} ${word(teams,'команда','команды','команд')} по 4–6 человек, все разбирают одну ситуацию по общему таймеру. Нужен помощник у каждого стола.`:setup.people<c.cast.length?`Ролей в ситуации — ${c.cast.length}, участников меньше: кто-то поведёт две роли (вторую — с момента её входа). Можно выбрать режим «совет коллег».`:`Каждому — своя роль, остальные ${setup.people-c.cast.length>0?`(${setup.people-c.cast.length}) — наблюдатели`:'роли заняты все'}.`}</p></section>
   <section class="setup-step"><h3><span>3</span>Какую ситуацию разберём?</h3>
    <div class="chips" role="group" aria-label="Темы">${['',...themes].map(t=>`<button type="button" class="chip" data-theme="${esc(t)}" aria-pressed="${t===setup.theme}">${t?esc(t):'Все темы'}</button>`).join('')}</div>
    <label class="sr" for="case-select">Ситуация</label><select id="case-select" class="sr" tabindex="-1">${D.situations.map(x=>`<option value="${x.id}"${x.id===setup.caseId?' selected':''}>${x.id} ${esc(x.title)}</option>`).join('')}</select>
    <div class="case-pick" role="group" aria-label="Ситуации">${cases.map(x=>`<button type="button" data-case="${x.id}" aria-pressed="${x.id===setup.caseId}"><small>${x.id} · ${esc(x.theme)}</small><b>${esc(x.title)}</b><span class="badges">${E.castOrder(x).map(r=>badge(r.type,'sm')).join('')}</span></button>`).join('')}</div></section>
  </div>
  <aside class="setup-summary"><div class="situation-card"><p class="pill" style="color:#fff;border-color:rgba(255,255,255,.45)">${c.id} · ${esc(c.grade)}</p><h2 style="font-size:28px;margin-top:14px">${esc(c.title)}</h2><p>${esc(c.text)}</p><p class="opening">${esc(c.opening)}</p>
   <dl><dt>Роли по порядку входа</dt><dd><span class="badges">${E.castOrder(c).map(r=>badge(r.type,'sm')).join('')}</span><br><span class="small">${E.castOrder(c).filter(r=>r.enters===0).map(r=>esc(r.label)).join(', ')} — с начала; ещё ${c.cast.filter(r=>r.enters>0).length} войдут по ходу</span></dd><dt>Регламент · ${setup.duration} минут</dt><dd>${E.FORMATS[setup.duration].rounds.flat().map(([k,m])=>`${esc(E.STAGES[k].short)} ${m}`).join(' · ')}</dd></dl>
   <div class="actions"><button type="submit" class="btn white" id="start">Начать встречу →</button><a class="link-arrow" style="color:#fff" href="library.html?case=${encodeURIComponent(c.id)}">Паспорт ситуации</a></div></div>
   <p class="small muted" style="margin-top:14px">Записи хранятся только в этом браузере. Не вводите имена и узнаваемые подробности о детях и коллегах.</p></aside></form></div>`;
  bindSetup();
}
function bindSetup(){
  app.querySelectorAll('[data-dur]').forEach(b=>b.onclick=()=>{setup.duration=Number(b.dataset.dur);renderSetup();});
  app.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{setup.theme=b.dataset.theme;renderSetup();});
  app.querySelectorAll('[data-case]').forEach(b=>b.onclick=()=>{setup.caseId=b.dataset.case;renderSetup();const el=app.querySelector(`[data-case="${b.dataset.case}"]`);if(el)el.focus();});
  const ppl=v=>{setup.people=Math.min(40,Math.max(1,Math.round(Number(v))||1));renderSetup();$('people').focus();};
  $('ppl-minus').onclick=()=>ppl(setup.people-1);$('ppl-plus').onclick=()=>ppl(setup.people+1);$('people').onchange=e=>ppl(e.target.value);
  $('case-select').onchange=e=>{setup.caseId=e.target.value;renderSetup();};
  $('setup-form').onsubmit=e=>{e.preventDefault();const n=Number($('people').value);if(Number.isInteger(n)&&n>=1&&n<=40)setup.people=n;
    try{state=E.create({people:setup.people,duration:setup.duration,caseId:setup.caseId});warning='';save();render();window.scrollTo(0,0);}catch(err){warning=err.message;renderSetup();}};
}

/* ---------- Экран встречи ---------- */
function track(r){return `<div class="track" role="list" aria-label="Этапы раунда">${r.stages.map((k,i)=>{const s=E.STAGES[k];const ev=/^ev/.test(k);const cls=[i<r.stage?'done':'',i===r.stage?'current':'',ev?'ev':''].join(' ');
  return `<button type="button" role="listitem" class="${cls}" data-stage="${i}" ${host()?'':'tabindex="-1"'} aria-current="${i===r.stage?'step':'false'}" aria-label="${i+1}. ${esc(s.title)}, ${Math.round(r.plan[i]/60)} мин"><span class="dot"><span>${ev?'!':i+1}</span></span><span class="lbl">${esc(s.short)}</span><span class="min">${Math.round(r.plan[i]/60)} мин</span></button>`;}).join('')}</div>`;}

function castBoard(cur){const {team:t,situation:c,revealed,entering}=cur;const order=E.castOrder(c);const isHost=host();
  const ppl=t.size;const obs=E.observers(c,t);
  const playerSel=x=>isHost&&t.mode!=='solo'?`<label class="sr" for="as-${x.key}">Кто ведёт роль</label><select id="as-${x.key}" data-assign="${x.key}">${Array.from({length:ppl+1},(_,p)=>`<option value="${p}"${t.assign[x.key]===p?' selected':''}>${p===0?'Ведущий читает':'Участник '+p}</option>`).join('')}</select>`:'';
  const who=x=>t.mode==='solo'?'':t.assign[x.key]?`Участник ${t.assign[x.key]}`:'Ведущий читает';
  return `<aside class="cast" aria-label="Участники ситуации"><h3>Роли <small>${order.filter(x=>x.enters<=revealed).length} из ${order.length} в игре</small></h3>
  ${t.mode!=='solo'&&isHost?`<div class="mode-switch" role="group" aria-label="Режим"><button type="button" data-mode="scene" aria-pressed="${t.mode==='scene'}">Сцена</button><button type="button" data-mode="council" aria-pressed="${t.mode==='council'}">Совет коллег</button></div>`:''}
  ${order.map((x,i)=>{const typ=T(x.type);
    if(x.enters>revealed) return `<div class="cast-item waiting"><span class="badge">?</span><b>Роль ${i+1}</b><small>войдёт с обстоятельством ${x.enters}${isHost&&t.mode!=='solo'?' · '+who(x):''}</small></div>`;
    const isNew=entering.some(n=>n.key===x.key);
    return `<div class="cast-item${isNew?' entering':''}">${badge(x.type)}<b>${esc(x.label)}${isNew?' <span class="pill coral" style="padding:2px 8px;font-size:10.5px;margin-left:4px">входит</span>':''}</b><div class="row"><small>${typ.title!==x.label?esc(typ.title):''}${typ.title!==x.label&&who(x)?' · ':''}${who(x)}</small></div><div class="row">${playerSel(x)}${isHost?`<button type="button" class="open-role" data-role="${x.key}">Карточка роли</button>`:`<small style="color:#DADCF3;font-weight:500">${esc(x.position)}</small>`}</div></div>`;}).join('')}
  ${t.mode==='solo'?'<p class="obs">Один участник: все роли ваши — по очереди.</p>':obs.length?`<p class="obs">Наблюдатели: ${obs.map(p=>'участник '+p).join(', ')}. Задача — точная реплика, факт отдельно от догадки, один вопрос.</p>`:'<p class="obs">Свободных участников нет: наблюдение ведёт ведущий.</p>'}
  </aside>`;}

function situationBlock(c,compact){return `<article class="situation-card${compact?' compact':''}"><p class="pill" style="color:#fff;border-color:rgba(255,255,255,.45)">Исходная ситуация · ${c.id}</p><h3 style="margin-top:12px">${esc(c.title)}</h3><p class="text">${esc(c.text)}</p><p class="opening">${esc(c.opening)}</p>${compact?'':`<dl><dt>Дилемма</dt><dd>${esc(c.dilemma)}</dd><dt>Что нужно получить</dt><dd>${esc(c.goal)}</dd></dl>`}</article>`;}
function eventBlock(c,ev,n,isNew){return `<article class="event-card${isNew?' new':''}"><div class="num"><span>${n}</span></div><p class="pill coral" style="justify-self:start">${isNew?'Новое обстоятельство':'Обстоятельство '+n}</p><h3>${esc(ev.title)}</h3><p>${esc(ev.text)}</p><p class="enter">${ev.adds.map(k=>{const x=roleOf(c,k);return badge(x.type,'sm')+' '+esc(x.label);}).join(' · ')} — в игре</p><p class="q">${esc(ev.ask)}</p></article>`;}

function stageExtras(cur){const {team:t,situation:c,key}=cur;const out=[];
  if(key==='start'){out.push(`<div class="panel flat"><h3 style="margin-bottom:10px">Договорённости перед началом</h3><ul class="qs"><li>Можно наблюдать, сменить роль или попросить паузу — без объяснений.</li><li>Обсуждаем действия, а не людей. Реальных детей и коллег не называем.</li><li>Карточку роли читает только тот, кто её ведёт. Новые роли и обстоятельства появятся по ходу.</li></ul></div>`);}
  if(key==='solution'){out.push(`<div class="note-card frame"><b>Рамка решения.</b> ${esc(c.note)}</div>`);
    if(host()&&c.options)out.push(`<details class="acc host-hint"><summary>Подсказка ведущему: возможные подходы — откройте, если группа застряла</summary><div><ol class="options">${c.options.map(x=>`<li><b>${esc(x.title)}.</b> ${esc(x.step)} <span class="muted">${esc(x.result)}</span></li>`).join('')}</ol><p class="small muted" style="margin:0">Это не правильные ответы, а примеры. Группа может выбрать свой вариант — важно назвать последствия для каждой роли.</p></div></details>`);
    out.push(`<div class="panel flat"><h3>Ресурс <small class="muted" style="font-weight:500">— по желанию, как инструмент для решения</small></h3><div class="res-pick" role="group" aria-label="Ресурсы">${c.resourceIds.map(id=>{const r=E.by('resources',id);return `<button type="button" data-res="${id}" aria-pressed="${t.resource===id}"${host()?'':' disabled'}><b>${esc(r.title)}</b><small>${esc(r.text)}</small></button>`;}).join('')}</div></div>`);}
  if(key==='reflect'){const m=E.by('reflections',t.reflectCard);out.push(`<div class="panel flat"><h3>Вопросы для рефлексии</h3><ul class="qs">${c.debrief.map(q=>`<li>${esc(q)}</li>`).join('')}<li style="background:var(--teal-mist);color:var(--teal-900)">${esc(m.title)}: ${esc(m.text)}</li></ul></div>`);
    if(host()&&c.takeaways)out.push(`<details class="acc host-hint"><summary>Для итога ведущему: профессиональные выводы ситуации</summary><div><ul class="qs">${c.takeaways.map(t=>`<li>${esc(t)}</li>`).join('')}</ul><p class="small muted" style="margin:0">Сначала выслушайте выводы группы; эти — дополнение, если что-то не прозвучало.</p></div></details>`);}
  if(key==='break'){out.push(`<div class="panel flat"><h3>Ситуация второго раунда</h3><label for="next-case" class="small muted">Лучше из другой темы — чтобы сравнить, как работают разные роли.</label><select id="next-case">${D.situations.filter(x=>x.id!==c.id).map(x=>`<option value="${x.id}">${x.id} · ${esc(x.title)} (${esc(x.theme)})</option>`).join('')}</select></div>`);}
  return out.join('');}

const NOTE_HINT={positions:'Что прозвучало? Какой видится ситуация сейчас?',ev1:'Что изменилось в понимании? Что оказалось предположением?',ev2:'Что подтвердилось, а что пришлось пересмотреть?',ev3:'Какой стала полная картина?',decision:'Что делаем · кто · к какому сроку · как поймём, что получилось. Несогласие тоже можно записать.',reflection:'Общий вывод — только если группа согласна его записать.',meeting:'Что из двух раундов группа берёт в работу?'};
function noteField(cur,s){if(!s.note||!host())return '';const key=s.note;const val=key==='meeting'?state.meeting:cur.team.notes[key];
  return `<div class="note-box"><label for="note">${key==='meeting'?'Итог встречи':esc(E.NOTE_LABELS[key])}<small>сохраняется автоматически</small></label><textarea id="note" data-note="${key}" placeholder="${esc(NOTE_HINT[key])}">${esc(val)}</textarea></div>`;}

function renderSession(){
  const cur=E.current(state),r=cur.round,c=cur.situation,t=cur.team,s=E.stageCopy(state);const isHost=host();
  document.body.classList.toggle('participant',!isHost);
  const multiTeam=r.teams.length>1,multiRound=state.rounds.length>1;
  const last=r.stage===r.stages.length-1,planned=E.plannedRounds(state);
  const futureEvents=c.events.map((ev,i)=>i+1).filter(n=>n>cur.revealed);
  const opened=c.events.map((ev,i)=>({ev,n:i+1})).filter(o=>o.n<=cur.revealed).reverse();
  const newNums=cur.events.map(e=>e.number);
  app.innerHTML=`<div class="wrap game-shell">
  ${warning?`<p class="note-card" role="alert">${esc(warning)}</p>`:''}
  <div class="game-top"><div class="title"><small>${c.id} · раунд ${r.number}${planned>1?' из '+Math.max(planned,state.rounds.length):''}${multiTeam?` · команда ${t.number} (${t.size} ${word(t.size,'человек','человека','человек')})`:` · ${state.settings.people} ${word(state.settings.people,'участник','участника','участников')}`}</small><b>${esc(c.title)}</b></div>
   <div class="tools">${multiRound&&isHost?`<label class="sr" for="round-select">Раунд</label><select id="round-select">${state.rounds.map((x,i)=>`<option value="${i}"${i===state.currentRound?' selected':''}>Раунд ${x.number}</option>`).join('')}</select>`:''}
   ${multiTeam&&isHost?`<label class="sr" for="team-select">Команда</label><select id="team-select">${r.teams.map((x,i)=>`<option value="${i}"${i===state.currentTeam?' selected':''}>Команда ${x.number} · ${x.size} чел.</option>`).join('')}</select>`:''}
   <div class="timer${r.remaining<=0?' over':''}"><output id="clock" aria-live="off" aria-label="Осталось времени на этапе">${mmss(r.remaining)}</output>${isHost?`<button type="button" id="timer-toggle" aria-label="${r.running?'Пауза таймера':'Запустить таймер'}">${r.running?'❚❚':'▶'}</button><button type="button" id="timer-plus" class="wide" aria-label="Добавить минуту">+1</button>`:''}</div>
   <button type="button" class="btn small" id="toggle-view">${isHost?'Экран для всех':'Экран ведущего'}</button>${isHost?`<button type="button" class="btn small" id="group-pause">Пауза для группы</button>`:''}</div></div>
  ${track(r)}
  <div class="game-grid"><div style="display:grid;gap:16px;min-width:0">
   ${opened.filter(o=>newNums.includes(o.n)).map(o=>eventBlock(c,o.ev,o.n,true)).join('')}
   <section class="stage-panel" aria-labelledby="stage-title"><div class="stage-head"><div><p class="eyebrow" style="margin-bottom:8px">Этап ${r.stage+1} из ${r.stages.length} · ${s.minutes} мин</p><h2 id="stage-title">${esc(s.title)}</h2></div>${cur.entering.length?`<div class="badges" aria-label="Входят роли">${cur.entering.map(x=>badge(x.type,'lg')).join('')}</div>`:''}</div>
    <p class="do">${esc(s.do)}</p>
    ${cur.entering.length?`<p class="note-card" style="margin:0"><b>Входит в игру:</b> ${cur.entering.map(x=>esc(x.label)+(t.mode!=='solo'?` (${t.assign[x.key]?'участник '+t.assign[x.key]:'читает ведущий'})`:'')).join(', ')}. ${t.mode==='solo'?'Прочитайте карточку новой роли справа.':'Откройте карточку роли и передайте её участнику.'}</p>`:''}
    <div class="meta"><span><b>Кто:</b> ${esc(s.who)}</span><span><b>Итог этапа:</b> ${esc(s.result)}</span></div>
    ${stageExtras(cur)}${noteField(cur,s)}
    ${isHost?`<div class="game-nav"><button type="button" class="btn" id="prev-stage"${r.stage===0?' disabled':''}>← Назад</button><span class="status" id="status" role="status">${esc(announce)}</span>
     ${!last?`<button type="button" class="btn primary" id="next-stage">${/^ev/.test(r.stages[r.stage+1])?'Открыть обстоятельство →':'Далее →'}</button>`:r.number<planned?`<button type="button" class="btn primary" id="next-round">Начать раунд ${r.number+1} →</button>`:`<span style="display:flex;gap:10px;flex-wrap:wrap">${state.rounds.length<6?'<button type="button" class="btn" id="extra-round">Ещё раунд</button>':''}<button type="button" class="btn primary" id="finish">Завершить встречу →</button></span>`}</div>`:''}
   </section>
   <div class="feed">
    ${opened.filter(o=>!newNums.includes(o.n)).map(o=>eventBlock(c,o.ev,o.n,false)).join('')}
    ${situationBlock(c,cur.revealed>0)}
    ${futureEvents.length&&!['solution','reflect','break','summary'].includes(cur.key)?futureEvents.map(n=>`<div class="locked-card"><span class="lock"><span>${n}</span></span><span>Обстоятельство ${n} откроется на этапе «${esc(E.STAGES[r.stages.find(k=>E.STAGES[k].reveal>=n)].title)}»</span></div>`).join(''):''}
   </div></div>
   ${castBoard(cur)}</div>
   ${isHost?`<div class="actions" style="justify-content:flex-end"><button type="button" class="btn small" id="reset">Новая встреча</button></div>`:''}
  </div>
  <div class="modal" id="modal" hidden></div>`;
  bindSession(cur);announce='';
}

function roleModal(c,key){const x=roleOf(c,key),t=T(x.type);const m=$('modal');
  m.innerHTML=`<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="role-title"><p class="warn">Карточку читает только тот, кто ведёт роль. Остальным достаточно позиции, которую персонаж скажет сам.</p>
  <article class="role-card" style="--c:${t.color};box-shadow:none;padding:0;border-top:0"><header>${badge(x.type,'lg')}<div><b id="role-title">${esc(x.label)}</b><small>${esc(t.title)} · ${enterLabel(x.enters)}</small></div></header>
  <dl><dt>Позиция</dt><dd>${esc(x.position)}</dd><dt>Что знаете</dt><dd>${esc(x.knows)}</dd><dt>Чего хотите</dt><dd>${esc(x.wants)}</dd><dt>Переживаете</dt><dd>${esc(x.feels)}</dd><dt>Отвечаете за</dt><dd>${esc(x.zone)}</dd></dl><div class="ask">${esc(x.ask)}</div><p class="small muted" style="margin:0">${esc(t.text)}</p></article>
  <div class="actions"><button type="button" class="btn primary" id="modal-close">Закрыть</button></div></div>`;
  m.hidden=false;modal=key;$('modal-close').focus();$('modal-close').onclick=closeModal;m.onclick=e=>{if(e.target===m)closeModal();};}
function pauseModal(){const m=$('modal');pauseOpen=true;const r=E.current(state).round;r.running=false;save();
  m.innerHTML=`<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="pause-title" style="text-align:center"><p class="eyebrow" style="justify-content:center">Пауза для группы</p><h2 id="pause-title" style="font-size:32px">Остановимся</h2><p>Таймер стоит. Можно выйти из роли, поменяться ролями, перейти в наблюдатели или заменить ситуацию. Объяснять причину не нужно.</p><div class="actions" style="justify-content:center"><button type="button" class="btn primary" id="modal-close">Продолжить</button></div></div>`;
  m.hidden=false;$('modal-close').focus();$('modal-close').onclick=closeModal;}
function closeModal(){const m=$('modal');if(m){m.hidden=true;m.innerHTML='';}modal=null;pauseOpen=false;}

function act(fn){try{fn();warning='';save();render();}catch(e){announce=e.message;render();}}
function bindSession(cur){const r=cur.round;
  app.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{if(host())act(()=>E.move(state,Number(b.dataset.stage)));});
  if($('next-stage'))$('next-stage').onclick=()=>act(()=>E.move(state,r.stage+1));
  if($('prev-stage'))$('prev-stage').onclick=()=>act(()=>E.move(state,r.stage-1));
  if($('next-round'))$('next-round').onclick=()=>act(()=>{const sel=$('next-case');const id=sel?sel.value:pickNext(cur.situation);E.nextRound(state,id);});
  if($('extra-round'))$('extra-round').onclick=()=>act(()=>E.nextRound(state,pickNext(cur.situation)));
  if($('finish'))$('finish').onclick=()=>act(()=>E.finish(state));
  if($('timer-toggle'))$('timer-toggle').onclick=()=>{r.running=!r.running;lastTick=Date.now();save();render();};
  if($('timer-plus'))$('timer-plus').onclick=()=>{r.remaining+=60;save();render();};
  $('toggle-view').onclick=()=>{state.view=host()?'participant':'host';save();render();};
  if($('group-pause'))$('group-pause').onclick=pauseModal;
  if($('round-select'))$('round-select').onchange=e=>act(()=>{state.rounds.forEach(x=>x.running=false);state.currentRound=Number(e.target.value);state.currentTeam=0;});
  if($('team-select'))$('team-select').onchange=e=>act(()=>{state.currentTeam=Number(e.target.value);});
  app.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>act(()=>E.setMode(state,b.dataset.mode)));
  app.querySelectorAll('[data-assign]').forEach(s=>s.onchange=()=>act(()=>E.assign(state,s.dataset.assign,Number(s.value))));
  app.querySelectorAll('[data-res]').forEach(b=>b.onclick=()=>act(()=>E.resource(state,cur.team.resource===b.dataset.res?null:b.dataset.res)));
  app.querySelectorAll('[data-role]').forEach(b=>b.onclick=()=>roleModal(cur.situation,b.dataset.role));
  const note=$('note');if(note)note.oninput=()=>{if(note.dataset.note==='meeting')state.meeting=note.value.slice(0,12000);else cur.team.notes[note.dataset.note]=note.value.slice(0,12000);save();};
  if($('reset'))$('reset').onclick=()=>{if(confirm('Начать новую встречу? Текущие записи будут удалены из браузера.')){try{localStorage.removeItem(KEY);}catch{}state=null;render();window.scrollTo(0,0);}};
}
function pickNext(c){const other=D.situations.filter(x=>x.theme!==c.theme);return (other[Math.floor(Math.random()*other.length)]||D.situations[0]).id;}

/* ---------- Итоги ---------- */
function summaryText(){const L=[];L.push('ПЕДАГОГ · итоги встречи',`Дата: ${new Date(state.started).toLocaleDateString('ru-RU')} · формат ${state.settings.duration} мин · участников: ${state.settings.people}`,'');
  state.rounds.forEach(r=>r.teams.forEach(t=>{const c=E.by('situations',t.caseId);L.push(`Раунд ${r.number}${r.teams.length>1?' · команда '+t.number:''}: ${c.id} «${c.title}»`);
    if(t.resource)L.push('Ресурс: '+E.by('resources',t.resource).title);
    E.NOTE_KEYS.forEach(k=>{if(t.notes[k].trim())L.push(`${E.NOTE_LABELS[k]}:\n${t.notes[k].trim()}`);});L.push('');}));
  if(state.meeting.trim())L.push('Итог встречи:',state.meeting.trim());
  L.push('','Записи без имён и узнаваемых подробностей. Игра не используется для оценки сотрудников.');return L.join('\n');}
function renderSummary(){document.body.classList.remove('participant');
  app.innerHTML=`<section class="page-hero teal"><div class="wrap"><p class="eyebrow">Встреча завершена</p><h1><span class="dim">Итоги</span> встречи</h1><p class="lead">Решения команд и общий вывод. Личные шаги остаются у участников. Скачайте итоги — в браузере они хранятся только до новой встречи.</p>
  <div class="actions"><button class="btn white" id="dl-txt">Скачать итоги (.txt)</button><button class="btn ghost-light" id="print-sum">Распечатать</button></div></div><div class="hero-deco">${A.pageDeco(53)}</div></section>
  <section class="page-body"><div class="wrap">${state.rounds.map(r=>r.teams.map(t=>{const c=E.by('situations',t.caseId);return `<article class="panel summary-team"><p class="eyebrow">Раунд ${r.number}${r.teams.length>1?' · команда '+t.number:''}</p><h2 style="font-size:28px">${esc(c.title)}</h2>
   <dl>${t.resource?`<dt>Ресурс</dt><dd>${esc(E.by('resources',t.resource).title)}</dd>`:''}${E.NOTE_KEYS.map(k=>t.notes[k].trim()?`<dt>${esc(E.NOTE_LABELS[k])}</dt><dd>${esc(t.notes[k])}</dd>`:'').join('')||'<dt>Записи</dt><dd class="muted">Команда ничего не записала — это допустимо.</dd>'}</dl></article>`;}).join('')).join('')}
   ${state.meeting.trim()?`<article class="panel summary-team"><p class="eyebrow">Общий итог</p><dl><dt>Итог встречи</dt><dd>${esc(state.meeting)}</dd></dl></article>`:''}
   <div class="actions"><button class="btn" id="reopen">← Вернуться к встрече</button><button class="btn primary" id="new-meeting">Новая встреча</button></div></div></section>`;
  $('dl-txt').onclick=()=>download(`pedagog-itogi-${state.started.slice(0,10)}.txt`,summaryText());
  $('print-sum').onclick=()=>window.print();
  $('reopen').onclick=()=>act(()=>E.reopen(state));
  $('new-meeting').onclick=()=>{if(confirm('Начать новую встречу? Записи этой встречи будут удалены из браузера.')){try{localStorage.removeItem(KEY);}catch{}state=null;render();window.scrollTo(0,0);}};
}

function render(){if(!state)renderSetup();else if(state.completed)renderSummary();else renderSession();}

/* Таймер: тикает только у активного раунда; после перезагрузки стоит на паузе. */
setInterval(()=>{const now=Date.now(),dt=(now-lastTick)/1000;lastTick=now;if(!state||state.completed)return;const r=state.rounds[state.currentRound];if(!r.running)return;
  const before=r.remaining;r.remaining=Math.max(0,r.remaining-dt);const clock=$('clock');if(clock)clock.textContent=mmss(r.remaining);
  if(before>0&&r.remaining<=0){r.running=false;save();render();const st=$('status');if(st)st.textContent='Время этапа вышло. Можно добавить минуту или перейти дальше.';}
  else if(Math.floor(before)!==Math.floor(r.remaining))save();},250);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(modal||pauseOpen){closeModal();}else if(state&&state.view==='participant'){state.view='host';save();render();}}});

load();render();
})();
