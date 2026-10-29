/* ПЕДАГОГ · раскладка печатного комплекта.
   Один модуль для конструктора на сайте (после ввода кода) и для сборки PDF (scripts/print-pdf.cjs),
   поэтому печать и онлайн-игра берут ситуации, роли и обстоятельства из одного реестра src/deck.js.
   Карточка 99 × 140 мм, четыре на листе A4 (2 × 2, без зазоров — один рез на две кромки),
   оборот зеркалится по выбранному краю переворота. */
(function(root){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const COLS=2,ROWS=2,PER=COLS*ROWS;
const SAFETY='Если в разговоре прозвучит реальная история об угрозе жизни или здоровью ребёнка, остановите игру, не расспрашивайте о подробностях при группе и действуйте по порядку, установленному в школе.';
const ENTER=n=>n===0?'с начала':`с обстоятельством ${n}`;

function data(){return root.PEDAGOG_DATA;}
function T(id){return data().roleTypes.find(t=>t.id===id);}
function castOrder(c){return c.cast.map((x,i)=>({x,i})).sort((a,b)=>a.x.enters-b.x.enters||a.i-b.i).map(o=>o.x);}
function badge(typeId,size=''){const t=T(typeId);return `<span class="pc-badge ${size}" style="--c:${t.color};--i:${t.ink}">${t.abbr}</span>`;}

/* ---------- Лицевые стороны ---------- */
function head(kind,label,id,color){return `<header class="pc-head" style="--k:${color}"><span>ПЕДАГОГ · ${esc(id)}</span><b>${esc(label)}</b></header>`;}
function situationFront(c){const first=castOrder(c).filter(x=>x.enters===0),later=c.cast.length-first.length;
  return `${head('situation','Ситуация',c.id,'#3B4A99')}<div class="pc-body"><p class="pc-kicker">${esc(c.theme)} · ${esc(c.grade)}</p><h2 class="pc-title">${esc(c.title)}</h2><p>${esc(c.text)}</p><p class="pc-opening">${esc(c.opening)}</p><p><b>Дилемма.</b> ${esc(c.dilemma)}</p><p><b>Что нужно получить.</b> ${esc(c.goal)}</p>
  <div class="pc-foot"><span class="pc-badges">${first.map(x=>badge(x.type)).join('')}${Array.from({length:later},()=>'<span class="pc-badge q">?</span>').join('')}</span><span>Первые роли: ${first.map(x=>esc(x.label)).join(', ')}. Ещё ${later} войдут по ходу игры.</span></div></div>`;}
function roleFront(c,x){const t=T(x.type);
  return `${head('role','Роль',c.id,t.color)}<div class="pc-body"><div class="pc-rolehead">${badge(x.type,'lg')}<div><h2 class="pc-name">${esc(x.label)}</h2><p class="pc-kicker">${t.title!==x.label?esc(t.title)+' · ':''}входит ${ENTER(x.enters)}</p></div></div>
  <dl class="pc-fields"><dt>Ваша позиция</dt><dd>${esc(x.position)}</dd><dt>Что вы знаете</dt><dd>${esc(x.knows)}</dd><dt>Чего хотите</dt><dd>${esc(x.wants)}</dd><dt>Что переживаете</dt><dd>${esc(x.feels)}</dd><dt>За что отвечаете</dt><dd>${esc(x.zone)}</dd></dl>
  <p class="pc-ask">${esc(x.ask)}</p><p class="pc-fine">Карточку читаете только вы. Вслух называйте позицию своими словами.</p></div>`;}
function eventFront(c,ev,n){const adds=ev.adds.map(k=>c.cast.find(r=>r.key===k));
  return `${head('event','Обстоятельство',c.id,'#E8673F')}<div class="pc-body"><div class="pc-evhead"><span class="pc-pin"><span>${n}</span></span><div><p class="pc-kicker">Обстоятельство ${n} из 3</p><h2 class="pc-title">${esc(ev.title)}</h2></div></div><p class="pc-big">${esc(ev.text)}</p>
  <p class="pc-enter">${adds.map(x=>`<span class="pc-who">${badge(x.type)}<b>${esc(x.label)}</b></span>`).join('')}<span class="pc-note">${adds.length>1?'входят':'входит'} в игру</span></p><p class="pc-ask">${esc(ev.ask)}</p></div>`;}
function hostFront(c,S){const stages=['start','positions','ev1','ev2','ev3','solution','reflect'];const m15={start:2,positions:2,ev1:2,ev2:'3*',ev3:'',solution:4,reflect:2};
  const min40=Object.fromEntries(S?S.FORMATS[40].rounds[0]:[]);
  const what=k=>{if(/^ev/.test(k)){const n=Number(k.slice(2));const ev=c.events[n-1];return `Откройте «${esc(ev.title)}». Входит: ${ev.adds.map(a=>esc(c.cast.find(r=>r.key===a).label)).join(', ')}.`;}
    return {start:'Прочитайте ситуацию вслух, раздайте карточки первых ролей, договоритесь о правах участников.',positions:'Первые роли начинают с исходной реплики: 2–3 минуты разговора.',solution:'2–3 варианта и последствия для каждой роли; ресурс по желанию; решение: что, кто, срок, признак.',reflect:'Выход из ролей. Как менялось понимание? Карточка рефлексии, личный шаг.'}[k];};
  return `${head('host','Ведущему',c.id,'#171D45')}<div class="pc-body"><h2 class="pc-title sm">${esc(c.title)}: ход игры</h2><table class="pc-steps"><thead><tr><th>Этап</th><th>40</th><th>15</th></tr></thead><tbody>${stages.map((k,i)=>`<tr class="${/^ev/.test(k)?'ev':''}"><td><b>${i+1}. ${esc(S?S.STAGES[k].title:k)}.</b> ${what(k)}</td><td>${min40[k]??''}</td><td>${m15[k]}</td></tr>`).join('')}</tbody></table><p class="pc-fine">* В 15 минутах обстоятельства 2 и 3 открываются вместе. 90 минут — два раунда по 40 с перерывом и итогом.</p></div>`;}
function assignLines(c){const order=castOrder(c);const out=[];for(let n=2;n<Math.min(6,order.length);n++){const by={};order.forEach((x,i)=>{const p=(i%n)+1;(by[p]=by[p]||[]).push(x.label);});
  out.push(`<tr><td>${n}</td><td>${Object.entries(by).map(([p,l])=>`<b>${p}</b> — ${l.map(esc).join(' → ')}`).join('; ')}${n>order.length?`; остальные — наблюдатели`:''}</td></tr>`);}return out.join('');}
function hostBack(c){return `${head('host','Ведущему · оборот',c.id,'#171D45')}<div class="pc-body"><h2 class="pc-title sm">Кто ведёт роли</h2><p class="pc-fine" style="margin-top:0">Первые роли — разным участникам; вступающие позже — по кругу. Стрелка: вторую роль участник берёт с момента её входа. Свободные участники — наблюдатели.</p>
  <table class="pc-assign"><thead><tr><th>Игроков</th><th>Распределение</th></tr></thead><tbody>${assignLines(c)}<tr><td>${c.cast.length}+</td><td>У каждого своя роль, остальные — наблюдатели.</td></tr></tbody></table>
  ${c.options?'':`<p class="pc-fine"><b>Границы.</b> ${esc(c.note)}</p>`}<p class="pc-safety">${esc(SAFETY)}</p></div>`;}
function optionsFront(c){return `${head('host','Ведущему · решение',c.id,'#171D45')}<div class="pc-body"><h2 class="pc-title sm">Возможные подходы</h2><p class="pc-fine" style="margin-top:0">Откройте на этапе «Поиск решения», если группа застряла. Это примеры, а не правильные ответы.</p><ol class="pc-opts">${(c.options||[]).map(x=>`<li><b>${esc(x.title)}.</b> ${esc(x.step)}<span>${esc(x.result)}</span></li>`).join('')}</ol></div>`;}
function optionsBack(c){return `${head('host','Ведущему · итог',c.id,'#171D45')}<div class="pc-body"><h2 class="pc-title sm">Профессиональные выводы</h2><p class="pc-fine" style="margin-top:0">Сначала выслушайте выводы группы. Эти — дополнение, если что-то не прозвучало.</p><ul class="pc-checks">${(c.takeaways||[]).map(t=>`<li>${esc(t)}</li>`).join('')}</ul><p class="pc-frame"><b>Рамка решения.</b> ${esc(c.note)}</p></div>`;}
function reflectFront(c){return `${head('reflect','Рефлексия',c.id,'#2A958E')}<div class="pc-body"><h2 class="pc-title sm">После выхода из ролей</h2><p class="pc-fine" style="margin-top:0">Назовите своё имя: «Я выхожу из роли». Отвечайте по желанию.</p><ol class="pc-qs">${c.debrief.map(q=>`<li>${esc(q)}</li>`).join('')}<li>Какое ваше первое впечатление о ситуации оказалось предположением?</li><li>Чья позиция изменила картину сильнее всего?</li></ol></div>`;}
function reflectBack(c){return `${head('reflect','Рефлексия · мой шаг',c.id,'#2A958E')}<div class="pc-body"><h2 class="pc-title sm">Мой шаг в работе</h2><p class="pc-fine" style="margin-top:0">Один небольшой шаг, который я попробую. Делиться им не обязательно.</p><div class="pc-lines"></div><p class="pc-fine">По какому признаку пойму, что шаг нужно изменить?</p><div class="pc-lines short"></div></div>`;}
function observerFront(id){const O=data().observer;return `${head('observer','Наблюдатель',id,'#676C90')}<div class="pc-body"><div class="pc-rolehead"><span class="pc-badge lg" style="--c:#fff;--i:#3B4A99;box-shadow:inset 0 0 0 .5mm #C9CCEB">НБ</span><div><h2 class="pc-name">Наблюдатель</h2><p class="pc-kicker">Для участников без роли</p></div></div><p>${esc(O.text)}</p>
  <ul class="pc-checks"><li>Точная реплика, которая изменила разговор</li><li>Факт — отдельно от догадки</li><li>Как менялась картина после каждого обстоятельства</li><li>Один вопрос участникам</li></ul></div>`;}
function notesFront(id){return `${head('notes','Заметки',id,'#C9CCEB')}<div class="pc-body"><h2 class="pc-title sm">Заметки</h2><p class="pc-fine" style="margin-top:0">Без имён реальных детей и коллег.</p><div class="pc-lines tall"></div></div>`;}
function resourceFront(r){return `${head('resource','Ресурс',r.id,'#2A958E')}<div class="pc-body center"><p class="pc-kicker">Инструмент для поиска решения</p><h2 class="pc-title">${esc(r.title)}</h2><p class="pc-big">${esc(r.text)}</p></div>`;}
function refcardFront(r){return `${head('refcard','Вопрос рефлексии',r.id,'#6874C2')}<div class="pc-body center"><p class="pc-kicker">После выхода из ролей</p><h2 class="pc-title">${esc(r.title)}</h2><p class="pc-big">${esc(r.text)}</p></div>`;}

/* ---------- Обороты ---------- */
/* Рубашка карточки: цветной фон в цвет заголовка лицевой стороны, крупная фирменная эмблема школы из шапки сайта
   (белым контуром), несколько звёзд, категория и когда карточка вступает в игру. Цвет рисунка — currentColor,
   поэтому в экономной печати рубашка становится белой с цветным контуром. */
const LIGHT={'#F3A27A':'#2A1D17','#E0A64E':'#2A2010','#62B9AF':'#10302D','#C9CCEB':'#28336E'};
function emblem(){return `<svg class="pc-emblem" viewBox="0 0 64 56" aria-hidden="true">
  <path d="M5 50.5h54" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity=".55"/>
  <rect x="7" y="27" width="50" height="23.5" rx="2.4" fill="currentColor" fill-opacity=".14" stroke="currentColor" stroke-width="1.5"/>
  <rect x="22.5" y="15.5" width="19" height="35" rx="2" fill="currentColor" fill-opacity=".26" stroke="currentColor" stroke-width="1.5"/>
  <rect x="25.5" y="19.5" width="13" height="5" rx="1.2" fill="currentColor"/>
  <rect x="28.5" y="38.5" width="7" height="12" rx="1.4" fill="currentColor"/>
  <g fill="currentColor"><rect x="11" y="31.5" width="4.4" height="5" rx=".9"/><rect x="16.6" y="31.5" width="4.4" height="5" rx=".9"/><rect x="11" y="40.5" width="4.4" height="5" rx=".9"/><rect x="16.6" y="40.5" width="4.4" height="5" rx=".9"/>
   <rect x="43" y="31.5" width="4.4" height="5" rx=".9"/><rect x="48.6" y="31.5" width="4.4" height="5" rx=".9"/><rect x="43" y="40.5" width="4.4" height="5" rx=".9"/><rect x="48.6" y="40.5" width="4.4" height="5" rx=".9"/>
   <rect x="27" y="28.5" width="10" height="6" rx=".9"/></g>
  <path d="M53 6.5l1.5 4.3 4.3 1.5-4.3 1.5-1.5 4.3-1.5-4.3-4.3-1.5 4.3-1.5Z" fill="currentColor"/>
  <path d="M9 9l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9Z M60 27l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7Z" fill="currentColor" opacity=".55"/>
  </svg>`;}
function brandBack(label,id,sub='',accent='#3B4A99',title=''){const fg=LIGHT[accent]||'#FFFFFF',eco=LIGHT[accent]||accent;
  return `<div class="pc-back" style="--a:${accent};--fg:${fg};--eco:${eco}"><div class="pc-back-frame">
  <p class="pc-back-top"><span>ПЕДАГОГ</span><span>${esc(id)}</span></p>
  <div class="pc-back-art">${emblem()}</div>
  <div class="pc-back-text"><p class="pc-back-label">${esc(label)}</p>${title?`<p class="pc-back-title">${title}</p>`:''}${sub?`<p class="pc-back-sub">${sub}</p>`:''}</div>
  <p class="pc-back-foot">деловая игра для педагогов</p></div></div>`;}
function roleBack(c,x){const t=T(x.type);return brandBack('Роль',c.id,`Входит ${ENTER(x.enters)}`,t.color,esc(t.title));}
function eventBack(c,n){return brandBack('Обстоятельство',c.id,'Не открывать до сигнала ведущего','#E8673F',`${n} из 3`);}

/* ---------- Комплекты ---------- */
function card(kind,caseId,front,back){return {kind,caseId,front,back};}
function kit(c,S,{observers=1}={}){const cards=[card('situation',c.id,situationFront(c),brandBack('Исходная ситуация',c.id,'Читается вслух в начале игры','#3B4A99',esc(c.title)))];
  castOrder(c).forEach(x=>cards.push(card('role',c.id,roleFront(c,x),roleBack(c,x))));
  c.events.forEach((ev,i)=>cards.push(card('event',c.id,eventFront(c,ev,i+1),eventBack(c,i+1))));
  cards.push(card('host',c.id,hostFront(c,S),hostBack(c)));
  if(c.options)cards.push(card('options',c.id,optionsFront(c),optionsBack(c)));
  cards.push(card('reflect',c.id,reflectFront(c),reflectBack(c)));
  for(let i=0;i<observers;i++)cards.push(card('observer',c.id,observerFront(c.id),brandBack('Наблюдатель',c.id,'Точная реплика · факт и догадка · вопрос','#676C90','Для участника без роли')));
  while(cards.length%PER)cards.push(card('notes',c.id,notesFront(c.id),brandBack('Заметки',c.id,'','#C9CCEB')));
  return cards;}
function common(){const D=data();const cards=[...D.resources.map(r=>card('resource','Р',resourceFront(r),brandBack('Ресурс',r.id,'Инструмент для поиска решения','#2A958E',esc(r.title)))),...D.reflections.map(r=>card('refcard','М',refcardFront(r),brandBack('Вопрос рефлексии',r.id,'После выхода из ролей','#6874C2',esc(r.title))))];
  while(cards.length%PER)cards.push(card('notes','—',notesFront('Общие'),brandBack('Заметки','Общие','','#C9CCEB')));return cards;}

/* ---------- Листы ---------- */
/* Оборот: при перевороте по длинному краю (книжная A4) карточки зеркалятся по горизонтали, по короткому — по вертикали. */
function backIndex(i,edge){const x=i%COLS,y=Math.floor(i/COLS);return edge==='short'?(ROWS-1-y)*COLS+x:y*COLS+(COLS-1-x);}
function plan(cards,{edge='long',side='both'}={}){const out=[];for(let s=0;s<cards.length;s+=PER){const a=cards.slice(s,s+PER);while(a.length<PER)a.push(null);
  const b=Array(PER).fill(null);a.forEach((c,i)=>{b[backIndex(i,edge)]=c;});const n=s/PER+1;
  if(side!=='back')out.push({cards:a,back:false,sheet:n});if(side!=='front')out.push({cards:b,back:true,sheet:n});}return out;}
function marks(){const m=[];const xs=[6,105,204],ys=[8.5,148.5,288.5];xs.forEach(x=>{m.push(`<i class="cm v" style="left:${x}mm;top:0"></i><i class="cm v" style="left:${x}mm;bottom:0"></i>`);});ys.forEach(y=>{m.push(`<i class="cm h" style="top:${y}mm;left:0"></i><i class="cm h" style="top:${y}mm;right:0"></i>`);});return m.join('');}
function sheetsHTML(cards,{edge='long',side='both',dx=0,dy=0,eco=false,label='Комплект'}={}){
  return plan(cards,{edge,side}).map(p=>`<section class="pc-sheet${p.back?' is-back':''}${eco?' eco':''}" data-sheet="${p.sheet}" aria-label="Лист ${p.sheet}, ${p.back?'оборот':'лицевая сторона'}"><div class="pc-grid" style="${p.back?`transform:translate(${dx}mm,${dy}mm)`:''}">${p.cards.map(c=>`<article class="pc-card k-${c?c.kind:'empty'}">${c?(p.back?c.back:c.front):''}</article>`).join('')}</div>${marks()}<p class="pc-sheetnote">${esc(label)} · лист ${p.sheet} · ${p.back?'оборот':'лицевая'}</p></section>`).join('');}
function calibrationHTML({edge='long',dx=0,dy=0}={}){const cells=(back)=>Array.from({length:PER},(_,i)=>{const n=back?backIndex(i,edge)+1:i+1;return `<article class="pc-card k-cal"><div class="pc-cal"><b>${n}</b><span>${back?'Оборот':'Лицевая'}</span><i></i></div></article>`;}).join('');
  return `<section class="pc-sheet"><div class="pc-grid">${cells(false)}</div>${marks()}<p class="pc-sheetnote">Пробный лист · лицевая. Напечатайте в масштабе 100 % на двух сторонах.</p></section><section class="pc-sheet is-back"><div class="pc-grid" style="transform:translate(${dx}mm,${dy}mm)">${cells(true)}</div>${marks()}<p class="pc-sheetnote">Пробный лист · оборот. Номера должны совпасть с лицевой стороной на просвет.</p></section>`;}

/* ---------- Листы A4 для ведущего ---------- */
function worksheetsHTML(S){const D=data();const cell=v=>v==null?'—':v;const keys=['start','positions','ev1','ev2','ev3','ev23','solution','reflect','break','summary'];
  const mins=(d,r,k)=>{const round=S.FORMATS[d].rounds[r];const hit=round&&round.find(([x])=>x===k);return hit?hit[1]:null;};
  const rows=keys.map(k=>({k,t:S.STAGES[k].title,a:mins(15,0,k),b:mins(40,0,k),c:mins(90,0,k)!=null||mins(90,1,k)!=null?`${cell(mins(90,0,k))} + ${cell(mins(90,1,k))}`:null}));
  const page=(title,body,foot='Участие добровольное. Игра не используется для аттестации и кадровых решений.')=>`<section class="pc-a4"><p class="pc-kicker">ПЕДАГОГ · материалы для проведения</p><h1>${title}</h1>${body}<footer>${foot}</footer></section>`;
  return page('Маршрут ведущего',`<p>Ситуация раскрывается постепенно. Сначала её видят первые роли, затем ведущий открывает три обстоятельства — с каждым в разговор входят новые участники. Единственно правильного ответа нет, но есть действия, которые нельзя оправдать игрой: унижение, давление, нарушение безопасности ребёнка.</p>
   <table class="pc-table"><thead><tr><th>Этап</th><th>15 мин</th><th>40 мин</th><th>90 мин<br><small>раунд 1 + 2</small></th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.t)}</td><td>${cell(r.a)}</td><td>${cell(r.b)}</td><td>${cell(r.c)}</td></tr>`).join('')}<tr class="total"><td>Итого</td><td>15</td><td>40</td><td>90</td></tr></tbody></table>
   <dl class="pc-stages">${['start','positions','ev1','solution','reflect'].map(k=>`<dt>${esc(S.STAGES[k].title)}${k==='ev1'?' (и далее 2, 3)':''}</dt><dd>${esc(S.STAGES[k].do)} <i>Итог: ${esc(S.STAGES[k].result)}</i></dd>`).join('')}</dl>
`)
  +page('Как разложить комплект',`<ol class="pc-list"><li><b>Ситуация</b> — лицом вверх в центре стола.</li><li><b>Роли</b> — рубашкой вверх. На рубашке написано, когда роль входит: «с начала» или «с обстоятельством N». Первые роли раздайте сразу, остальные — в момент входа.</li><li><b>Обстоятельства 1–3</b> — стопкой рубашкой вверх по порядку. Ведущий открывает и читает вслух по одному.</li><li><b>Ведущему</b> — две карточки у ведущего. Первая: ход игры и распределение ролей для 2–5 игроков, границы ситуации. Вторая: возможные подходы к решению (открыть на этапе решения, если группа застряла) и профессиональные выводы для итога.</li><li><b>Рефлексия</b> — открывается после выхода из ролей; на обороте — место для личного шага.</li><li><b>Наблюдатель и заметки</b> — для участников без роли.</li><li><b>Ресурсы и вопросы рефлексии</b> — общая колода для всех ситуаций; на этапе решения команда по желанию берёт один ресурс.</li></ol>
   <h2>Если игроков меньше, чем ролей</h2><p>Первые роли получают разные участники, вступающие позже — по кругу: участник ведёт вторую роль с момента её входа. Таблица на обороте карточки «Ведущему» показывает распределение. Можно играть «советом коллег»: позиции зачитываются, а группа обсуждает, что сказал бы каждый персонаж.</p>
   <h2>Большая группа</h2><p>Команды по 4–6 человек, у каждой свой комплект и помощник. Все работают по общему таймеру. На итоге команды сравнивают решения.</p>
   <h2>Права участника</h2><p>Наблюдать вместо игры, сменить роль, попросить паузу, не соглашаться с решением группы — без объяснений. Реальных детей, родителей и коллег не называем.</p>
   <div class="pc-safety">${esc(SAFETY)}</div>`)
  +page('Бланк решения',`<p>Ситуация: ______________________________ Команда: ________ Дата: __________</p>${['Первые позиции: какой виделась ситуация','Обстоятельство 1: что изменилось','Обстоятельство 2: что подтвердилось, что пересмотрели','Обстоятельство 3: какой стала картина'].map(t=>`<h3>${t}</h3><div class="pc-wl" style="height:20mm"></div>`).join('')}
   <h3>Решение</h3><table class="pc-table form"><tr><td>Что делаем</td><td></td></tr><tr><td>Кто</td><td></td></tr><tr><td>Срок</td><td></td></tr><tr><td>Как поймём, что получилось</td><td></td></tr><tr><td>Несогласие (если есть)</td><td></td></tr></table>`,'Записи без имён и узнаваемых подробностей. В общий итог попадает только то, с чем согласна группа.');}

root.PEDAGOG_PRINT_LAYOUT={PER,SAFETY,backIndex,plan,kit,common,sheetsHTML,calibrationHTML,worksheetsHTML,castOrder};
if(typeof module!=='undefined'&&module.exports)module.exports=root.PEDAGOG_PRINT_LAYOUT;
})(globalThis);
