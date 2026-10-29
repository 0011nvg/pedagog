/* ПЕДАГОГ · интерфейс онлайн-игры. Один экран ведущего; состояние — в localStorage этого браузера. */
(function(){
'use strict';
const E=globalThis.PEDAGOG_SESSION,D=globalThis.PEDAGOG_DATA,app=document.getElementById('app');
if(!app||!E)return;
const KEY='pedagog-platform-session-v4',OLD_KEY='pedagog-platform-session-v3';
let stored=null,storageConflict=false,state=null,tick=Date.now(),warning='',pauseOpen=false,reflectCard=null;
const query=new URLSearchParams(location.search);
const setup={people:6,duration:40,caseId:'С-16'};
{const d=Number(query.get('duration'));const mapped=({20:15,45:40,60:40,120:90})[d]||d;if(E.DURATIONS.includes(mapped))setup.duration=mapped;
 const c=query.get('case');if(E.by('situations',c))setup.caseId=c;else if(setup.duration===15)setup.caseId='С-16';}

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const opt=(value,label,selected)=>`<option value="${esc(value)}"${String(value)===String(selected)?' selected':''}>${esc(label)}</option>`;
const btn=(id,label,cls='',extra='')=>`<button type="button" id="${id}" class="${cls}" ${extra}>${label}</button>`;
const mmss=sec=>{const n=Math.max(0,Math.ceil(sec));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');};
const minutesWord=n=>{const a=Math.abs(n)%100,b=a%10;return a>10&&a<20?'минут':b===1?'минута':b>1&&b<5?'минуты':'минут';};
const peopleWord=n=>{const a=n%100,b=n%10;return a>10&&a<20?'человек':b>1&&b<5?'человека':'человек';};
const LENS={'Ро-01':'наставник','Ро-02':'начинающий педагог','Ро-03':'родитель','Ро-04':'завуч','Ро-05':'классный руководитель','Ро-06':'опытный учитель','Ро-07':'школьный психолог','Ро-08':'ученик'};
function setLabel(c,i){const set=c.roleSets[i],lens=c.roleSets.map(x=>x.length);if(new Set(lens).size>1)return `${set.length} места: `+set.map((_,j)=>c.seats[j].who).join(', ');const diff=set.map((_,j)=>j).filter(j=>c.roleSets.some(x=>x[j]!==set[j]));return diff.map(j=>`${c.seats[j].who} — ${LENS[set[j]]}`).join(' · ');}
const NOTE_LABELS={first:'Первый вариант',observed:'Что заметили',retry:'Второй вариант',consequences:'Последствия',decision:'Решение',reflection:'Общий вывод'};
const NOTE_HINTS={first:'Ключевые слова первой попытки: что сказали и сделали',observed:'Одна точная реплика · что она изменила · вопрос ко второй попытке',retry:'Что изменили во второй попытке и как ответили',consequences:'Вариант 1: завтра / через месяц. Вариант 2: завтра / через месяц. Что неизвестно',decision:'Что делаем · кто · к какому сроку · как поймём, что получилось',reflection:'Общий вывод группы — только если все согласны его записать',meeting:'Что общего в решениях раундов? Что группа берёт в работу?'};

function say(message,focus=false){warning=message;const el=$('game-status');if(el){el.textContent=message;el.hidden=!message;if(focus){el.tabIndex=-1;el.focus({preventScroll:true});el.scrollIntoView({block:'nearest'});}}}
function conflict(){storageConflict=true;state?.rounds.forEach(r=>r.running=false);say('Эта встреча изменена в другой вкладке. Чтобы не затереть записи, эта вкладка больше не сохраняет. Скачайте итоги и обновите страницу.');clock();}
function save(){if(!state||storageConflict)return;try{if(localStorage.getItem(KEY)!==stored){conflict();return;}const next=JSON.stringify(state);localStorage.setItem(KEY,next);stored=next;}catch{say('Автосохранение недоступно в этом браузере. Перед закрытием страницы скачайте итоги.');}}
function download(content,name,type='application/json'){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild?.(a);a.click();a.remove?.();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function stamp(){const d=new Date();return d.toISOString().slice(0,10);}
function advanceClock(){const now=Date.now(),dt=Math.max(0,(now-tick)/1000);tick=now;if(!state||state.completed)return;const r=E.current(state).round;if(r.running){r.remaining=Math.max(0,r.remaining-dt);if(!r.remaining){r.running=false;say('Время этапа вышло. Дайте закончить мысль и переходите дальше — или добавьте минуту.');}}}

/* ---------- Итоги ---------- */
function teamReport(t){const c=E.by('situations',t.caseId),res=t.resource&&E.by('resources',t.resource),tu=t.turn&&E.by('turns',t.turn);
 return [`${c.id} «${c.title}»`,`Позиции: ${E.positions(c,t.roleSet).map(p=>p.who+(LENS[p.roleId]&&LENS[p.roleId]!==p.who.toLowerCase()?' — '+LENS[p.roleId]:'')).join('; ')}${t.discussion?' · совет коллег без сцены':''}`,
 `Ресурс: ${res?res.title:'не выбран'}${tu?` · поворот: ${tu.title}`:''}`,...E.NOTE_KEYS.map(k=>`${NOTE_LABELS[k]}: ${t.notes[k].trim()||'—'}`)].join('\n');}
function reportText(){const f=E.FORMATS[state.settings.duration];const lines=['ПЕДАГОГ · итоги встречи',`Дата: ${new Date(state.started).toLocaleDateString('ru-RU')}`,`Формат: ${state.settings.duration} минут — ${f.title.toLowerCase()} · участников: ${state.settings.people}${state.settings.teams>1?` · команд: ${state.settings.teams}`:''}`,''];
 state.rounds.forEach(r=>{lines.push(`РАУНД ${r.number}`);r.teams.forEach(t=>{if(state.settings.teams>1)lines.push(`Команда ${t.number} (${t.size} ${peopleWord(t.size)})`);lines.push(teamReport(t),'');});});
 if(state.meeting.trim())lines.push('ИТОГ ВСТРЕЧИ',state.meeting.trim(),'');
 lines.push('Записи обезличены и сделаны с согласия группы. Личные выводы участников остаются у них.');return lines.join('\n');}
function summaryHTML(){return `${state.rounds.map(r=>`<section class="panel results-round"><h2>Раунд ${r.number}</h2>${r.teams.map(t=>{const c=E.by('situations',t.caseId),res=t.resource&&E.by('resources',t.resource);const n=k=>esc(t.notes[k].trim())||'<span class="muted">не записано</span>';
 return `<article class="result-team">${state.settings.teams>1?`<p class="eyebrow">Команда ${t.number}</p>`:''}<h3>${esc(c.id)} · ${esc(c.title)}</h3><p class="muted">${esc(c.dilemma)}</p><div class="compare-grid"><div><h4>Первый вариант</h4><p>${n('first')}</p></div><div><h4>Второй вариант${res?` · ${esc(res.title)}`:''}</h4><p>${n('retry')}</p></div></div><dl class="result-list"><div><dt>Что заметили</dt><dd>${n('observed')}</dd></div><div><dt>Последствия</dt><dd>${n('consequences')}</dd></div><div><dt>Решение</dt><dd>${n('decision')}</dd></div><div><dt>Общий вывод</dt><dd>${n('reflection')}</dd></div></dl></article>`;}).join('')}</section>`).join('')}${state.meeting.trim()?`<section class="panel"><h2>Итог встречи</h2><p class="pre">${esc(state.meeting)}</p></section>`:''}`;}

/* ---------- Подготовка ---------- */
function themeOptions(selected){const groups={};for(const c of D.situations)(groups[c.theme||'Ситуации']??=[]).push(c);return Object.entries(groups).map(([t,list])=>`<optgroup label="${esc(t)}">${list.map(c=>opt(c.id,c.id+' · '+c.title,selected)).join('')}</optgroup>`).join('');}
function peopleHint(n){if(!Number.isInteger(n)||n<1||n>40)return 'Укажите число от 1 до 40.';if(n===1)return 'Один участник: вы по очереди посмотрите на ситуацию с каждой позиции и запишете два варианта. Сцены нет.';
 if(n<=12)return `Одна группа. 2–3 человека в сцене, остальные — наблюдатели с конкретной задачей. Ведущий — отдельно, если не играет.`;const t=E.teamsFor(n);return `${t} команды по 4–6 человек, все с одной ситуацией. Экран общий; у каждого стола — помощник с распечаткой карточек.`;}
function renderSetup(){
 const old=(()=>{try{return localStorage.getItem(OLD_KEY);}catch{return null;}})();
 const f=E.FORMATS;
 app.innerHTML=`<div class="game-intro"><p class="eyebrow">Онлайн-игра</p><h1>Провести игру</h1><p class="lead">Выберите время, число участников и ситуацию — остальное сайт подготовит сам: роли, этапы, таймер и подсказки на каждом шаге.</p></div>
 <p id="game-status" class="notice" role="status" ${warning?'':'hidden'}>${esc(warning)}</p>
 ${state?`<section class="panel resume"><h2>${state.completed?'Итоги прошлой встречи сохранены':'Есть незавершённая встреча'}</h2><p>${state.settings.duration} минут · ${state.settings.people} ${peopleWord(state.settings.people)} · ${esc(E.by('situations',state.rounds[0].teams[0].caseId).title)}. Таймер стоит на паузе.</p><div class="actions">${btn('restore-session',state.completed?'Открыть итоги':'Продолжить встречу','primary')}</div></section>`:''}
 ${old?`<section class="panel"><h2>Сохранение прежней версии</h2><p>В этом браузере осталась встреча из прежней версии игры. Продолжить её нельзя, но записи можно скачать файлом.</p><div class="actions">${btn('old-download','Скачать прежние записи')}${btn('old-forget','Удалить из браузера')}</div></section>`:''}
 <form id="session-form" class="setup" novalidate>
  <fieldset class="setup-step"><legend><span>1</span> Сколько у вас времени?</legend><div class="quick-presets">${E.DURATIONS.map(m=>`<button type="button" id="preset-${m}" aria-pressed="${setup.duration===m}"><strong>${m} минут</strong><b>${esc(f[m].title)}</b><span>${esc(f[m].lead)}</span><small>${esc(f[m].people)}</small></button>`).join('')}</div></fieldset>
  <fieldset class="setup-step"><legend><span>2</span> Сколько человек играет?</legend><label for="people" class="sr-only">Число участников без ведущего</label><input id="people" type="number" inputmode="numeric" min="1" max="40" value="${setup.people}" aria-describedby="people-hint"><p id="people-hint" class="muted">${esc(peopleHint(setup.people))}</p></fieldset>
  <fieldset class="setup-step"><legend><span>3</span> Какую ситуацию разберём?</legend><label for="case-select" class="sr-only">Ситуация</label><div class="case-pick"><select id="case-select">${themeOptions(setup.caseId)}</select>${btn('random-case','Случайная')}</div><div id="setup-preview"></div></fieldset>
  <div class="actions"><button class="primary big" type="submit">Начать игру →</button></div>
  <p class="muted small-print">Игра идёт с одного экрана: ведущий управляет, участники смотрят на экран в зале или через демонстрацию экрана в видеосвязи. Подключения с разных устройств нет. Записи хранятся только в этом браузере.</p>
 </form>
 <details class="panel"><summary>Открыть сохранённую встречу из файла</summary><label for="import-session">Файл .json, скачанный кнопкой «Сохранить файл встречи»</label><input id="import-session" type="file" accept=".json,application/json"></details>`;
 const preview=()=>{const c=E.by('situations',setup.caseId);$('setup-preview').innerHTML=`<article class="case-mini"><p class="tag">${esc(c.id)} · ${esc(c.theme||'')}</p><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p><p class="dilemma"><strong>Дилемма.</strong> ${esc(c.dilemma)}</p></article>`;};preview();
 for(const m of E.DURATIONS)$('preset-'+m).onclick=()=>{setup.duration=m;for(const x of E.DURATIONS)$('preset-'+x).setAttribute('aria-pressed',String(x===m));};
 $('people').oninput=()=>{setup.people=Number($('people').value);$('people-hint').textContent=peopleHint(setup.people);};
 $('case-select').onchange=()=>{setup.caseId=$('case-select').value;preview();};
 $('random-case').onclick=()=>{const pool=D.situations.filter(c=>c.id!==setup.caseId);setup.caseId=E.pick(pool).id;$('case-select').value=setup.caseId;preview();};
 $('session-form').onsubmit=e=>{e.preventDefault();setup.people=Number($('people').value);try{const candidate=E.create(setup);if(state&&!state.completed&&!confirm('Начать новую встречу? Незавершённая встреча будет заменена. Если записи нужны, сначала откройте её и скачайте итоги.'))return;state=candidate;reflectCard=null;save();render();focusTop();}catch(err){say(err.message,true);$('people').focus();}};
 if($('restore-session'))$('restore-session').onclick=()=>{render();focusTop();};
 if($('old-download'))$('old-download').onclick=()=>download(old,'PEDAGOG-old-session.json');
 if($('old-forget'))$('old-forget').onclick=()=>{if(confirm('Удалить прежнее сохранение из этого браузера?')){try{localStorage.removeItem(OLD_KEY);}catch{}renderSetup();}};
 $('import-session').onchange=async()=>{const file=$('import-session').files[0];if(!file)return;try{if(file.size>2000000)throw new Error('Файл больше 2 МБ.');const candidate=E.restore(await file.text());if(state&&!confirm('Заменить текущую встречу открытым файлом?'))return;state=candidate;save();render();focusTop();}catch(err){say('Не удалось открыть файл: '+err.message,true);}};
}
function focusTop(){const h=app.querySelector('h1');if(h){h.tabIndex=-1;h.focus({preventScroll:true});h.scrollIntoView?.({block:'start'});}}

/* ---------- Игра ---------- */
function seatsHTML(t,c,compact){const ps=E.positions(c,t.roleSet),obs=Math.max(0,t.size-ps.length);
 return `<div class="seats">${ps.map(p=>{const role=E.by('roles',p.roleId);return `<article class="seat"><p class="seat-num">Место ${p.seat}</p><h3>${esc(p.who)}</h3><p class="seat-role">Взгляд: ${esc(LENS[p.roleId])} · карточка ${esc(p.roleId)}</p>${compact?'':`<p>${esc(p.brief)}</p>`}<p class="seat-ask"><strong>Ваш вопрос:</strong> ${esc(p.ask)}</p>${compact?'':`<details><summary>Как играть эту роль</summary><p>${esc(role.text)}</p></details>`}</article>`;}).join('')}
 ${state.settings.solo?'':`<article class="seat observer"><p class="seat-num">${obs?`${obs} ${peopleWord(obs)}`:'Если есть желающие'}</p><h3>Наблюдатели</h3><p>${esc(E.by('roles','Ро-09').text)}</p><p class="muted">Удобно разделить фокусы: точные слова · интересы сторон · чего не знаем · последствия.</p></article>`}</div>`;}
function rolesPanel(t,c,host){const ps=E.positions(c,t.roleSet);
 return `<section class="panel"><h2>Кто есть кто</h2><p>${state.settings.solo?'Вы рассматриваете все позиции по очереди.':t.discussion?'<strong>Совет коллег:</strong> сцену не играем — обсуждаем, что и какими словами сказал бы каждый персонаж.':'Места занимают добровольцы. Отказаться или перейти в наблюдатели можно в любой момент — без объяснений.'}</p>
 ${host&&c.roleSets.length>1?`<label for="role-set">Состав сцены</label><select id="role-set">${c.roleSets.map((set,i)=>opt(i,setLabel(c,i),t.roleSet)).join('')}</select>`:''}
 ${seatsHTML(t,c,false)}
 ${host&&!state.settings.solo&&c.id!=='С-17'&&t.size>=ps.length?`<label class="check"><input id="discussion-mode" type="checkbox" ${t.discussion?'checked':''}> Без сцены — обсуждаем как совет коллег</label>`:''}</section>`;}
function situationHTML(c,open){const body=`<p>${esc(c.text)}</p><p class="opening"><strong>Начальная реплика.</strong> ${esc(c.opening)}</p><p class="dilemma"><strong>Дилемма.</strong> ${esc(c.dilemma)}</p><p><strong>Что нужно получить.</strong> ${esc(c.goal)}</p><p class="muted"><strong>Ведущему.</strong> ${esc(c.note)}</p>`;
 return open?`<section class="panel case-panel"><p class="tag">${esc(c.id)}</p><h2>${esc(c.title)}</h2>${body}</section>`:`<details class="panel case-panel"><summary><span class="tag">${esc(c.id)}</span> ${esc(c.title)} — открыть ситуацию</summary>${body}</details>`;}
function noteHTML(t,key,host){const label=key==='meeting'?'Итог встречи':NOTE_LABELS[key];const value=key==='meeting'?state.meeting:t.notes[key];
 if(!host)return value.trim()?`<div class="note-view"><h3>${label}</h3><p class="pre">${esc(value)}</p></div>`:'';
 return `<div class="note-box"><label for="note-${key}">${label}${state.settings.teams>1&&key!=='meeting'?` · команда ${t.number}`:''}</label><textarea id="note-${key}" data-note="${key}" rows="4" maxlength="12000" placeholder="${esc(NOTE_HINTS[key])}">${esc(value)}</textarea><p class="muted small-print">Сохраняется автоматически. Без имён и узнаваемых подробностей.</p></div>`;}
function resourcePanel(r,host){const t=E.current(state).team,c=E.by('situations',t.caseId);
 const list=c.resourceIds.map(id=>{const x=E.by('resources',id);const on=t.resource===id;return host?`<button type="button" class="resource-option" data-resource="${esc(id)}" aria-pressed="${on}"><span class="tag">${esc(id)}</span><strong>${esc(x.title)}</strong><span>${esc(x.text)}</span></button>`:on?`<article class="resource-option" aria-current="true"><strong>${esc(x.title)}</strong><span>${esc(x.text)}</span></article>`:'';}).join('');
 const status=r.teams.length>1?`<p class="muted">Выбрано: ${r.teams.map(x=>`команда ${x.number} — ${x.resource?esc(E.by('resources',x.resource).title):'<strong>нет</strong>'}`).join(' · ')}</p>`:'';
 return `<section class="panel"><h2>Карточка ресурса${r.teams.length>1?` · команда ${t.number}`:''}</h2><p>${host?'Выберите одну карточку, которая поможет во второй попытке. Не уверены — возьмите случайную.':'Ресурс для второй попытки:'}</p>${status}<div class="resource-grid">${list||'<p>Ресурс ещё не выбран.</p>'}</div>${host?`<div class="actions">${btn('random-resource','Случайная карточка')}</div>`:''}</section>`;}
function chosenResource(t){if(!t.resource)return '';const x=E.by('resources',t.resource);return `<section class="panel resource-chosen"><p class="eyebrow">Ресурс</p><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></section>`;}
function comparePanel(t){return `<section class="panel"><h2>Два варианта рядом</h2><div class="compare-grid"><div><h3>Первый вариант</h3><p class="pre">${esc(t.notes.first.trim())||'<span class="muted">не записан — восстановите устно</span>'}</p></div><div><h3>Второй вариант${t.resource?' · '+esc(E.by('resources',t.resource).title):''}</h3><p class="pre">${esc(t.notes.retry.trim())||'<span class="muted">не записан — восстановите устно</span>'}</p></div></div>${t.notes.observed.trim()?`<p><strong>Что заметили:</strong> ${esc(t.notes.observed)}</p>`:''}</section>`;}
function turnPanel(t,host){const ids=E.eligibleTurns(state);if(state.settings.duration===15)return '';
 const active=t.turn&&E.by('turns',t.turn);
 if(!host)return active?`<section class="panel"><p class="eyebrow">Поворот</p><h3>${esc(active.title)}</h3><p>${esc(active.text)}</p></section>`:'';
 if(!ids.length&&!active)return '';
 return `<details class="panel" ${active?'open':''}><summary>Проверить решение поворотом — по желанию</summary><p>Поворот меняет одно условие и показывает, насколько решение устойчиво. Берите его, только если группа согласна и осталось время.</p>${active?`<article class="turn-card"><p class="tag">${esc(active.id)}</p><h3>${esc(active.title)}</h3><p>${esc(active.text)}</p></article><div class="actions">${btn('clear-turn','Убрать поворот')}</div>`:`<div class="actions">${btn('draw-turn','Вытянуть карточку поворота')}</div><p class="muted">Подходят: ${ids.map(id=>esc(E.by('turns',id).title)).join(' · ')}.</p>`}</details>`;}
function reflectPanel(c){if(!reflectCard||!reflectCard.startsWith('М-'))reflectCard=E.pick(D.reflections).id;const m=E.by('reflections',reflectCard);
 return `<section class="panel"><h2>Вопросы для разговора</h2><ul class="questions">${c.debrief.map(q=>`<li>${esc(q)}</li>`).join('')}</ul><div class="turn-card"><p class="tag">${esc(m.id)} · ${esc(m.title)}</p><p>${esc(m.text)}</p></div><p class="personal"><strong>Личный шаг — на своём листе:</strong> «В похожей ситуации я попробую… Пойму, что получилось, если…» Зачитывать не обязательно.</p></section>`;}
function nextCaseSelect(c){const others=D.situations.filter(x=>x.theme!==c.theme&&x.id!==c.id);const sug=(others.length?E.pick(others):D.situations.find(x=>x.id!==c.id)).id;
 return `<label for="next-case">Ситуация следующего раунда</label><div class="case-pick"><select id="next-case">${themeOptions(sug)}</select></div>`;}

function render(){
 advanceClock();
 if(state.completed)return renderResults();
 const focusId=document.activeElement?.id;
 const {round:r,team:t,situation:c,key}=E.current(state),st=E.stageCopy(state),host=state.view==='host',planned=E.plannedRounds(state);
 const last=r.stage===r.stages.length-1,lastPlanned=state.currentRound>=planned-1;
 const teamTabs=state.settings.teams>1?`<div class="team-tabs" role="group" aria-label="Команда">${r.teams.map((x,i)=>`<button type="button" data-team="${i}" aria-pressed="${i===state.currentTeam}">Команда ${x.number}${x.resource&&['resource','quickResource'].includes(key)?' ✓':''}</button>`).join('')}</div>`:'';
 let body='';
 if(key==='situation')body=situationHTML(c,true)+rolesPanel(t,c,host)+(host?`<details class="panel"><summary>Ситуация не подходит группе?</summary><p>Замените её — роли и записи этого раунда начнутся заново.</p><div class="case-pick"><select id="change-case" aria-label="Другая ситуация">${themeOptions(c.id)}</select>${btn('apply-case','Заменить')}</div></details>`:'');
 else if(key==='first')body=situationHTML(c,false)+`<section class="panel"><h2>Места</h2>${seatsHTML(t,c,true)}</section>`+noteHTML(t,'first',host)+(host?`<details class="panel"><summary>Ситуация не подходит группе?</summary><p>Замените её — роли и записи этого раунда начнутся заново.</p><div class="case-pick"><select id="change-case" aria-label="Другая ситуация">${themeOptions(c.id)}</select>${btn('apply-case','Заменить')}</div></details>`:'');
 else if(key==='observe')body=situationHTML(c,false)+noteHTML(t,'first',false)+noteHTML(t,'observed',host);
 else if(key==='resource')body=situationHTML(c,false)+resourcePanel(r,host);
 else if(key==='quickResource')body=situationHTML(c,false)+noteHTML(t,'observed',host)+resourcePanel(r,host);
 else if(key==='retry')body=situationHTML(c,false)+chosenResource(t)+noteHTML(t,'first',false)+noteHTML(t,'retry',host);
 else if(key==='compare')body=comparePanel(t)+noteHTML(t,'consequences',host)+turnPanel(t,host)+situationHTML(c,false);
 else if(key==='decision')body=comparePanel(t)+noteHTML(t,'decision',host)+situationHTML(c,false);
 else if(key==='quickDecision')body=comparePanel(t)+noteHTML(t,'decision',host)+situationHTML(c,false);
 else if(key==='reflect')body=reflectPanel(c)+noteHTML(t,'reflection',host)+(host&&lastPlanned?`<details class="panel"><summary>Хотите разобрать ещё одну ситуацию?</summary><p>Добавит ещё ${state.settings.duration===15?15:40} минут. Записи этого раунда сохранятся.</p>${nextCaseSelect(c)}<div class="actions">${btn('extra-round','Начать ещё один раунд')}</div></details>`:'');
 else if(key==='break')body=`<section class="panel"><h2>Перерыв</h2><p>Время размяться. Записи первого раунда сохранены — их можно посмотреть в итогах.</p>${host?nextCaseSelect(c):''}</section>`;
 else if(key==='summary')body=`<section class="panel"><h2>Что получилось в раундах</h2>${state.rounds.filter(x=>x.number<r.number+1).map(x=>x.teams.map(tt=>`<p><strong>Раунд ${x.number}${state.settings.teams>1?`, команда ${tt.number}`:''} · ${esc(E.by('situations',tt.caseId).title)}.</strong> Решение: ${esc(tt.notes.decision.trim())||'<span class="muted">не записано</span>'}</p>`).join('')).join('')}</section>`+noteHTML(t,'meeting',host);
 const nextLabel=last?(key==='break'?'Начать второй раунд →':lastPlanned?'Завершить встречу →':'Следующий раунд →'):'Далее →';
 app.innerHTML=`<div class="game-head"><p class="eyebrow">${state.settings.duration} минут · ${esc(E.FORMATS[state.settings.duration].title)}${state.rounds.length>1||planned>1?` · раунд ${r.number} из ${Math.max(planned,state.rounds.length)}`:''}${host?'':' · экран участников'}</p>
 <ol class="stepper" aria-label="Этапы раунда">${r.stages.map((k,i)=>`<li${i===r.stage?' aria-current="step"':''}>${host?`<button type="button" data-stage="${i}" ${i===r.stage?'aria-current="step"':''}>${i+1}. ${esc(E.STAGES[k].title)}</button>`:`<span>${i+1}. ${esc(E.STAGES[k].title)}</span>`}</li>`).join('')}</ol></div>
 <p id="game-status" class="notice" role="status" ${warning?'':'hidden'}>${esc(warning)}</p>
 ${pauseOpen?`<section class="panel pause-panel" role="region" aria-label="Пауза"><h2>Пауза</h2><p>Таймер остановлен. Можно выйти из роли и назвать своё имя, перейти в наблюдатели, продолжить без сцены${r.stage<=1?' или заменить ситуацию':''}. Объяснять причины не нужно.</p><div class="actions">${btn('pause-continue','Продолжить','primary')}${!state.settings.solo&&c.id!=='С-17'&&!t.discussion?btn('pause-talk','Продолжить без сцены'):''}</div></section>`:''}
 <section class="stage-card" aria-labelledby="stage-title">${teamTabs}<p class="stage-count">Этап ${r.stage+1} из ${r.stages.length} · ${st.minutes} ${minutesWord(st.minutes)}</p><h1 id="stage-title">${esc(st.title)}</h1>
 <p class="stage-do">${esc(st.do)}</p><dl class="stage-meta"><div><dt>Кто</dt><dd>${esc(st.who)}</dd></div><div><dt>Результат</dt><dd>${esc(st.result)}</dd></div></dl></section>
 ${body}
 <div class="game-bar" role="group" aria-label="Управление этапом">
  <div class="timer${r.remaining<=0?' done':''}"><span id="session-timer" role="timer" aria-label="Осталось на этапе">${mmss(r.remaining)}</span>${host?btn('timer-toggle',r.running?'Пауза':'Старт','timer-btn','aria-live="polite"')+btn('add-minute','+1 мин','ghost'):''}</div>
  ${host?`<div class="bar-actions">${r.stage>0?btn('prev-stage','←','ghost','aria-label="Предыдущий этап"'):''}${btn('pause-group','Пауза для группы','ghost')}${btn('next-stage',nextLabel,'primary')}</div>`:''}
 </div>
 <p class="muted meeting-left">До конца встречи по плану: около ${Math.max(0,Math.round(E.remainingMeeting(state)/60))} ${minutesWord(Math.round(E.remainingMeeting(state)/60))}.</p>
 <section class="tools"><h2 class="sr-only">Инструменты встречи</h2><div class="actions">${btn('view-mode',host?'Экран для участников':'Вернуться к управлению')}${btn('large-screen',document.body.classList.contains('game-large')?'Обычный шрифт':'Крупный шрифт')}${host?btn('export-summary','Скачать итоги (.txt)')+btn('export-session','Сохранить файл встречи')+btn('new-session','Новая встреча'):''}</div><p class="muted small-print">Записи хранятся в этом браузере и не уходят на сервер. <a href="rules.html#safety">Когда это не дилемма →</a></p></section>`;
 bind(r,t,c,key,host,last,lastPlanned);
 clock();
 if(focusId&&$(focusId)&&focusId.startsWith('note-')){const el=$(focusId);el.focus({preventScroll:true});}
}
function goTo(index){try{advanceClock();E.move(state,index);pauseOpen=false;warning='';save();render();focusTop();}catch(err){say(err.message,true);}}
function bind(r,t,c,key,host,last,lastPlanned){
 app.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>goTo(Number(b.dataset.stage)));
 app.querySelectorAll('[data-team]').forEach(b=>b.onclick=()=>{state.currentTeam=Number(b.dataset.team);save();render();});
 app.querySelectorAll('[data-note]').forEach(el=>el.oninput=()=>{if(el.dataset.note==='meeting')state.meeting=el.value;else E.current(state).team.notes[el.dataset.note]=el.value;save();});
 app.querySelectorAll('[data-resource]').forEach(b=>b.onclick=()=>{const id=b.dataset.resource;E.resource(state,E.current(state).team.resource===id?null:id);if(state.settings.teams>1&&E.current(state).team.resource){const miss=r.teams.findIndex(x=>!x.resource);if(miss>=0)state.currentTeam=miss;}warning='';save();render();});
 if($('random-resource'))$('random-resource').onclick=()=>{const pool=c.resourceIds.filter(id=>id!==t.resource);E.resource(state,E.pick(pool));save();render();};
 if($('role-set'))$('role-set').onchange=()=>{E.setRoles(state,Number($('role-set').value));save();render();};
 if($('discussion-mode'))$('discussion-mode').onchange=()=>{E.setDiscussion(state,$('discussion-mode').checked);save();render();};
 if($('apply-case'))$('apply-case').onclick=()=>{const id=$('change-case').value;if(id===c.id)return;if(confirm('Заменить ситуацию? Роли и записи этого раунда начнутся заново.')){try{E.setCase(state,id);reflectCard=null;save();render();}catch(err){say(err.message,true);}}};
 if($('draw-turn'))$('draw-turn').onclick=()=>{const ids=E.eligibleTurns(state);if(ids.length){E.turn(state,E.pick(ids));save();render();}};
 if($('clear-turn'))$('clear-turn').onclick=()=>{E.turn(state,null);save();render();};
 if($('timer-toggle'))$('timer-toggle').onclick=()=>{advanceClock();if(r.remaining<=0){r.remaining=60;}r.running=!r.running;tick=Date.now();save();clock();};
 if($('add-minute'))$('add-minute').onclick=()=>{advanceClock();r.remaining=Math.min(86400,r.remaining+60);save();clock();};
 if($('prev-stage'))$('prev-stage').onclick=()=>goTo(r.stage-1);
 if($('pause-group'))$('pause-group').onclick=()=>{advanceClock();r.running=false;pauseOpen=true;save();render();$('pause-continue')?.focus();};
 if($('pause-continue'))$('pause-continue').onclick=()=>{pauseOpen=false;render();};
 if($('pause-talk'))$('pause-talk').onclick=()=>{E.setDiscussion(state,true);pauseOpen=false;save();render();};
 if($('next-stage'))$('next-stage').onclick=()=>{
  if(!last)return goTo(r.stage+1);
  advanceClock();
  if(key==='break'){try{E.nextRound(state,$('next-case')?.value||c.id);reflectCard=null;warning='';save();render();focusTop();}catch(err){say(err.message,true);}return;}
  if(!lastPlanned){try{E.nextRound(state,c.id);save();render();focusTop();}catch(err){say(err.message,true);}return;}
  if(confirm('Завершить встречу? Все вышли из ролей? Записи сохранятся, их можно будет скачать.')){E.finish(state);save();render();focusTop();}};
 if($('extra-round'))$('extra-round').onclick=()=>{try{E.nextRound(state,$('next-case').value);reflectCard=null;warning='';save();render();focusTop();}catch(err){say(err.message,true);}};
 common();
}
function common(){
 if($('view-mode'))$('view-mode').onclick=()=>{state.view=state.view==='host'?'participant':'host';save();render();$('view-mode')?.focus();};
 if($('large-screen'))$('large-screen').onclick=()=>{document.body.classList.toggle('game-large');render();$('large-screen')?.focus();};
 if($('export-summary'))$('export-summary').onclick=()=>download(reportText(),`PEDAGOG-итоги-${stamp()}.txt`,'text/plain;charset=utf-8');
 if($('export-session'))$('export-session').onclick=()=>download(JSON.stringify(state,null,2),`PEDAGOG-встреча-${stamp()}.json`);
 if($('new-session'))$('new-session').onclick=()=>{if(confirm('Начать новую встречу? Текущие записи будут удалены из браузера. Если они нужны, сначала скачайте итоги.')){if(state)state.rounds.forEach(r=>r.running=false);state=null;try{if(!storageConflict&&localStorage.getItem(KEY)===stored){localStorage.removeItem(KEY);stored=null;}}catch{}warning='';renderSetup();focusTop();}};
}
function renderResults(){
 app.innerHTML=`<div class="game-intro"><p class="eyebrow">Встреча завершена · ${state.settings.duration} минут</p><h1>Итоги встречи</h1><p class="lead">Два варианта, выбранное решение и выводы — по каждой ситуации. Скачайте или распечатайте, если группа согласна сохранить записи.</p></div>
 <p id="game-status" class="notice" role="status" ${warning?'':'hidden'}>${esc(warning)}</p>
 <div class="actions no-print">${btn('export-summary','Скачать итоги (.txt)','primary')}${btn('print-summary','Распечатать')}${btn('export-session','Сохранить файл встречи')}${btn('reopen','Вернуться к записям')}${btn('new-session','Новая встреча')}</div>
 ${summaryHTML()}
 <section class="panel no-print"><h2>После встречи</h2><p>Через одну-две недели можно коротко спросить коллег: удалось ли попробовать свой шаг и что помешало. Это не отчёт, а продолжение разговора.</p></section>`;
 if($('print-summary'))$('print-summary').onclick=()=>window.print();
 if($('reopen'))$('reopen').onclick=()=>{E.reopen(state);save();render();focusTop();};
 common();
}
function clock(){if(!state||!$('session-timer'))return;const r=E.current(state).round;$('session-timer').textContent=mmss(r.remaining);$('session-timer').parentElement.classList.toggle('done',r.remaining<=0);$('session-timer').parentElement.classList.toggle('running',r.running);if($('timer-toggle'))$('timer-toggle').textContent=r.running?'Пауза':r.remaining<=0?'+1 мин и старт':'Старт';}

/* ---------- Запуск ---------- */
try{stored=localStorage.getItem(KEY);if(stored)state=E.restore(stored);}catch(err){state=null;warning='Сохранённую встречу не удалось открыть: '+(err&&err.message||'файл повреждён')+' Можно начать новую.';}
setInterval(()=>{const was=state&&!state.completed&&E.current(state).round.running;advanceClock();if(was){save();clock();}},250);
window.addEventListener('storage',event=>{if(state&&(event.key===KEY||event.key===null))conflict();});
window.addEventListener('pageshow',event=>{if(state&&event&&event.persisted){state.rounds.forEach(r=>r.running=false);tick=Date.now();clock();}});
window.addEventListener('pagehide',()=>{if(state){advanceClock();state.rounds.forEach(r=>r.running=false);save();}});
if(state&&query.get('resume')!=='0'&&!query.get('case')&&!query.get('duration'))render();else renderSetup();
})();
