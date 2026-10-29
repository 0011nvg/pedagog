/* ПЕДАГОГ · конструктор печатного комплекта. Доступ — по коду автора: код проверяется расшифровкой контрольного пакета
   print-pack.js (PBKDF2-SHA256 + AES-GCM) в браузере, сам код нигде не хранится. Сменить код: node scripts/set-author-code.cjs.
   Это барьер для интерфейса печати на статическом хостинге, а не серверная защита: тексты ситуаций открыты на сайте.
   Раскладка — platform/print-layout.js, общая с PDF-сборкой; данные — общий реестр src/deck.js. */
(function(root){
'use strict';
const L=root.PEDAGOG_PRINT_LAYOUT,D=root.PEDAGOG_DATA,S=root.PEDAGOG_SESSION,A=root.PEDAGOG_ART;
const app=document.getElementById('app');if(!app||!L||!D)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
const requested=D.situations.find(c=>c.id===new URLSearchParams(location.search).get('case'));
const selected=new Set(requested?[requested.id]:D.situations.map(c=>c.id));
let unlocked=false,includeCommon=!requested;

app.innerHTML=`<section class="page-hero teal"><div class="wrap"><p class="eyebrow">Настольная версия</p><h1><span class="dim">Печатный</span> комплект</h1><p class="lead">Для каждой ситуации — двусторонние карточки 99 × 140 мм, по четыре на листе A4: исходная ситуация, 5–6 ролей, три закрытых обстоятельства, две карточки ведущего (ход игры и варианты решений), рефлексия, наблюдатель. Те же ситуации, роли и обстоятельства, что в онлайн-игре.</p></div><div class="hero-deco">${A.pageDeco(71)}</div></section>
<section class="page-body"><div class="wrap">
 <div class="panel gate" id="printGate"><h2 style="font-size:28px">Доступ по коду автора</h2><p>Конструктор печати открывается кодом, который выдаёт автор игры. Код проверяется в браузере и нигде не сохраняется.</p>
  <form id="printUnlock" autocomplete="off"><label class="sr" for="printCode">Код доступа</label><input id="printCode" type="password" placeholder="Код доступа" required><button class="btn primary" id="printUnlockButton">Открыть</button></form><p class="status" id="printAccessStatus" role="status"></p>
  <p class="small muted" style="margin:0">Тексты ситуаций открыты в разделе <a href="library.html">«Ситуации»</a>. Код — барьер для печатного конструктора, а не защита содержания: сайт работает на статическом хостинге.</p></div>
 <div id="printBuilder" hidden><div class="print-builder"><div>
   <div class="section-head" style="margin-bottom:20px"><p class="eyebrow">Шаг 1</p><h2 style="font-size:30px">Какие ситуации печатать</h2></div>
   <div class="actions" style="margin:0 0 14px"><button class="btn small" id="selAll" type="button">Выбрать все</button><button class="btn small" id="selNone" type="button">Снять выбор</button><label class="check" style="margin-left:6px"><input type="checkbox" id="optCommon"${includeCommon?' checked':''}> Общая колода: 15 ресурсов и 10 вопросов рефлексии</label></div>
   <div class="kit-list" id="kitList"></div>
  </div>
  <aside class="print-side"><div class="panel"><p class="eyebrow">Шаг 2 · печать</p>
   <div style="display:grid;gap:12px">
    <div class="field"><label for="printEdge">Переворот листа</label><select id="printEdge"><option value="long">По длинному краю (обычно)</option><option value="short">По короткому краю</option></select></div>
    <div class="field"><label for="printSide">Стороны</label><select id="printSide"><option value="both">Обе (двусторонняя печать)</option><option value="front">Только лицевые</option><option value="back">Только обороты</option></select></div>
    <div class="grid two" style="gap:10px"><div class="field"><label for="printCopies">Экземпляров</label><input id="printCopies" type="number" min="1" max="10" value="1"></div><div class="field"><label for="printObs">Наблюдателей</label><input id="printObs" type="number" min="0" max="4" value="1"></div></div>
    <div class="grid two" style="gap:10px"><div class="field"><label for="printDx">Сдвиг оборота X, мм</label><input id="printDx" type="number" min="-3" max="3" step="0.5" value="0"></div><div class="field"><label for="printDy">Сдвиг Y, мм</label><input id="printDy" type="number" min="-3" max="3" step="0.5" value="0"></div></div>
    <label class="check"><input type="checkbox" id="printEco"> Экономная печать: без цветных заливок</label>
    <p class="small muted" style="margin:0">Печатайте в масштабе 100 % («Фактический размер»). Сначала — пробный лист: номера на обороте должны совпасть с лицевой стороной на просвет. Если не совпали, задайте сдвиг. Рубашки цветные: если в окне печати есть пункт «Фоновые изображения» или «Печатать фон», включите его; для печати без заливок — «Экономная печать».</p>
    <button class="btn" type="button" id="printCalibration">Пробный лист</button>
    <button class="btn primary" type="button" id="printPrepare">Сформировать комплект</button>
    <button class="btn" type="button" id="printWorksheets">Листы ведущего A4</button>
    <button class="btn teal" type="button" id="printDo" disabled>Печать / сохранить PDF</button>
    <p class="status" id="printBuildStatus" role="status" style="color:var(--teal-700)"></p>
    <button class="btn small" type="button" id="printLock">Закрыть доступ</button></div></div></aside></div>
  <div class="pc-out" id="printOutput" aria-live="polite"></div></div>
</div></section>`;

function renderKits(){$('kitList').innerHTML=D.situations.map(c=>`<label><input type="checkbox" value="${c.id}"${selected.has(c.id)?' checked':''}><span><b>${c.id} · ${esc(c.title)}</b><small>${esc(c.theme)} · ${c.cast.length} ролей · ${L.kit(c,S).length/4} листа</small></span></label>`).join('');
  $('kitList').querySelectorAll('input').forEach(i=>i.onchange=()=>{i.checked?selected.add(i.value):selected.delete(i.value);clearOut();});}
function clearOut(){$('printOutput').innerHTML='';$('printDo').disabled=true;$('printBuildStatus').textContent='';}
function num(id,min,max){const n=Number($(id).value);if(!Number.isFinite(n)||n<min||n>max)throw Error(`Проверьте поле «${$(id).labels[0].textContent}»: от ${min} до ${max}.`);return n;}
function opts(){return {edge:$('printEdge').value,side:$('printSide').value,dx:num('printDx',-3,3),dy:num('printDy',-3,3),eco:$('printEco').checked};}
function zoom(){const w=$('printOutput').clientWidth||900;$('printOutput').style.setProperty('--preview-zoom',String(Math.min(1,Math.max(.3,(w-20)/794))));}
function show(html,msg){$('printOutput').innerHTML=html;zoom();$('printDo').disabled=false;$('printBuildStatus').textContent=msg;$('printOutput').scrollIntoView({behavior:'smooth',block:'start'});}
function lock(){unlocked=false;$('printBuilder').hidden=true;$('printGate').hidden=false;$('printCode').value='';clearOut();}

$('printUnlock').onsubmit=async e=>{e.preventDefault();const b=$('printUnlockButton');b.disabled=true;$('printAccessStatus').textContent='Проверяем код…';
  try{if(!root.crypto?.subtle)throw Error('https');const pack=root.PEDAGOG_PRINT_PACK;if(!pack)throw Error('missing');const decode=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
    const material=await crypto.subtle.importKey('raw',new TextEncoder().encode($('printCode').value.trim().toUpperCase()),'PBKDF2',false,['deriveKey']);
    const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:decode(pack.salt),iterations:pack.iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
    /* AES-GCM проверяет целостность: расшифровка удаётся только с верным кодом. Содержимое пакета дальше не используется. */
    await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(pack.iv)},key,decode(pack.data));
    lock();
    unlocked=true;$('printBuilder').hidden=false;$('printGate').hidden=true;$('printAccessStatus').textContent='';renderKits();$('printPrepare').focus();
  }catch(err){$('printCode').value='';$('printAccessStatus').textContent=err.message==='https'?'Откройте сайт по HTTPS в современном браузере.':err.message==='missing'?'Пакет не загрузился. Обновите страницу.':'Код не подошёл. Проверьте код, полученный от автора.';}
  finally{b.disabled=false;}};
$('printLock').onclick=()=>{lock();$('printCode').focus();};
$('selAll').onclick=()=>{D.situations.forEach(c=>selected.add(c.id));renderKits();clearOut();};
$('selNone').onclick=()=>{selected.clear();renderKits();clearOut();};
$('optCommon').onchange=e=>{includeCommon=e.target.checked;clearOut();};
['printEdge','printSide','printDx','printDy','printEco','printCopies','printObs'].forEach(id=>$(id).addEventListener('change',clearOut));
$('printCalibration').onclick=()=>{if(!unlocked)return;try{const o=opts();show(L.calibrationHTML(o),'Пробный лист: 1 лист A4 с двух сторон.');}catch(e){$('printBuildStatus').textContent=e.message;}};
$('printPrepare').onclick=()=>{if(!unlocked)return;try{const o=opts(),copies=num('printCopies',1,10),obs=num('printObs',0,4);
  const kits=D.situations.filter(c=>selected.has(c.id));if(!kits.length&&!includeCommon)throw Error('Выберите хотя бы одну ситуацию или общую колоду.');
  let cards=kits.flatMap(c=>L.kit(c,S,{observers:obs}));if(includeCommon)cards=cards.concat(L.common());
  cards=Array.from({length:copies},()=>cards).flat();const sheets=Math.ceil(cards.length/L.PER);
  show(L.sheetsHTML(cards,{...o,label:'ПЕДАГОГ'}),`Готово: ${cards.length} карточек, ${sheets} ${((n)=>{const a=n%100,b=n%10;return a>10&&a<20?'листов':b===1?'лист':b>1&&b<5?'листа':'листов';})(sheets)} A4${o.side==='both'?' с двух сторон':''}. Нажмите «Печать».`);}
  catch(e){$('printBuildStatus').textContent=e.message;}};
$('printWorksheets').onclick=()=>{if(!unlocked)return;show(L.worksheetsHTML(S),'Листы ведущего: маршрут и регламент, раскладка комплекта, бланк решения — 3 страницы A4.');};
$('printDo').onclick=()=>{if(unlocked&&$('printOutput').children.length)window.print();};
addEventListener('resize',zoom);
/* Для внутренней проверки вёрстки без кода: ?preview=1 работает только на локальном адресе. */
if(/^(localhost|127\.0\.0\.1)$/.test(location.hostname)&&new URLSearchParams(location.search).has('preview')){unlocked=true;$('printBuilder').hidden=false;$('printGate').hidden=true;renderKits();}
})(globalThis);
