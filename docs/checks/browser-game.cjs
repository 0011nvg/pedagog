/* Браузерная проверка онлайн-игры (Playwright + Chromium).
   Запуск: npm run build; python3 -m http.server 8765; node docs/checks/browser-game.cjs [папка для снимков]
   Проходит все форматы на нескольких ситуациях, проверяет, что обстоятельства и роли не появляются раньше своего этапа,
   и сохраняет снимки экрана (рабочий стол и телефон). */
'use strict';
const path=require('path'),fs=require('fs');
let pw;try{pw=require('playwright');}catch{pw=require('/opt/npm-tools/node_modules/playwright');}
const BASE=process.env.BASE||'http://localhost:8765/';
const OUT=process.argv[2]||'qa/browser';fs.mkdirSync(OUT,{recursive:true});
const results=[];const ok=(name,cond,info='')=>{results.push([name,!!cond]);console.log((cond?'PASS ':'FAIL ')+name+(info?' — '+info:''));};
(async()=>{
 const b=await pw.chromium.launch();
 async function page(vp={width:1440,height:960}){const ctx=await b.newContext({viewport:vp,acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});return {p,errs,ctx};}
 const shot=(p,name,full=false)=>p.screenshot({path:path.join(OUT,name+'.png'),fullPage:full});
 // 1. Полный проход 40 минут, 4 участника, С-12 (6 ролей)
 {const {p,errs,ctx}=await page();await p.goto(BASE+'game.html');await p.click('#preset-40');await p.fill('#people','4');await p.dispatchEvent('#people','change');
  await p.click('[data-case="С-12"]');await shot(p,'01-setup');await p.click('#start');
  const titles=[];for(let i=0;i<7;i++){titles.push(await p.textContent('#stage-title'));
   const events=await p.locator('.event-card').count(),waiting=await p.locator('.cast-item.waiting').count(),active=await p.locator('.cast-item:not(.waiting)').count();
   const expected=[0,0,1,2,3,3,3][i];ok(`40 мин, этап ${i+1}: открыто обстоятельств ${expected}`,events===expected,`${events}`);
   ok(`40 мин, этап ${i+1}: ролей в игре + ожидающих = 6`,active+waiting===6);
   if(i===0)await shot(p,'02-start');if(i===2)await shot(p,'03-event1');if(i===4)await shot(p,'04-event3');
   if(await p.locator('#note').count())await p.fill('#note','Запись этапа '+(i+1));
   if(i===5){await p.click('[data-res="Р-02"]');await shot(p,'05-solution');}
   if(i===6){await shot(p,'06-reflect');break;}
   await p.click('#next-stage');}
  ok('40 мин: 7 этапов по порядку',titles.join('|')==='Исходная ситуация|Первые позиции|Обстоятельство 1|Обстоятельство 2|Обстоятельство 3|Поиск решения|Рефлексия',titles.join('|'));
  // участники: карточка роли, экран для всех
  await p.click('[data-role="teacher"]');ok('Карточка роли открывается',await p.isVisible('#role-title'));await shot(p,'07-role-modal');await p.click('#modal-close');
  await p.click('#toggle-view');ok('Экран для всех скрывает управление и личные карточки ролей',!(await p.locator('#next-stage, #finish, #note, .open-role').count()));await shot(p,'08-participant');await p.click('#toggle-view');
  // перезагрузка
  await p.reload();ok('После перезагрузки встреча на том же этапе',(await p.textContent('#stage-title'))==='Рефлексия');
  await p.click('#finish');ok('Итоги показывают записи',(await p.textContent('#app')).includes('Запись этапа 3'));await shot(p,'09-summary',true);
  ok('Без ошибок в консоли (40 мин)',!errs.length,errs.join('; '));await ctx.close();}
 // 2. 15 минут: обстоятельства 2 и 3 открываются вместе
 {const {p,errs,ctx}=await page();await p.goto(BASE+'game.html?duration=15&case=%D0%A1-01');await p.click('#start');
  for(let i=0;i<3;i++)await p.click('#next-stage');ok('15 мин: на 4-м этапе открыты все 3 обстоятельства',(await p.locator('.event-card').count())===3);
  ok('15 мин: все 5 ролей в игре',(await p.locator('.cast-item.waiting').count())===0);await p.click('#next-stage');await p.click('#next-stage');ok('15 мин: 6-й этап — рефлексия',(await p.textContent('#stage-title'))==='Рефлексия');
  ok('Без ошибок (15 мин)',!errs.length,errs.join('; '));await ctx.close();}
 // 3. 90 минут, 24 участника: команды и второй раунд
 {const {p,errs,ctx}=await page();await p.goto(BASE+'game.html?duration=90&case=%D0%A1-14');await p.fill('#people','24');await p.dispatchEvent('#people','change');await p.click('#start');
  ok('90 мин, 24 участника: 4 команды',(await p.locator('#team-select option').count())===4);
  for(let i=0;i<7;i++)await p.click('#next-stage');ok('Перерыв после 7 этапов',(await p.textContent('#stage-title'))==='Перерыв');
  await p.selectOption('#next-case','С-19');await p.click('#next-round');ok('Второй раунд с выбранной ситуацией',(await p.textContent('.game-top'))?.includes('Телефон на уроке'));
  ok('Без ошибок (90 мин)',!errs.length,errs.join('; '));await ctx.close();}
 // 4. Один участник; телефон
 {const {p,errs,ctx}=await page({width:390,height:844});await p.goto(BASE+'game.html?duration=40&case=%D0%A1-22');await p.fill('#people','1');await p.dispatchEvent('#people','change');await shot(p,'10-mobile-setup',true);await p.click('#start');
  ok('Один участник: режим без сцены',(await p.textContent('.cast')).includes('Один участник'));await p.click('#next-stage');await p.click('#next-stage');await shot(p,'11-mobile-event',true);
  const w=await p.evaluate(()=>document.documentElement.scrollWidth);ok('Телефон: нет горизонтальной прокрутки',w<=390,String(w));
  ok('Без ошибок (телефон)',!errs.length,errs.join('; '));await ctx.close();}
 await b.close();const fail=results.filter(r=>!r[1]).length;console.log(`\n${results.length-fail}/${results.length} проверок пройдено.`);process.exit(fail?1:0);
})();
