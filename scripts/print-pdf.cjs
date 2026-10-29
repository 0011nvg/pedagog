'use strict';
/* ПЕДАГОГ · сборка печатных PDF из общего реестра (src/deck.js) той же раскладкой, что и конструктор на сайте.
   PDF пишутся в игнорируемую папку qa/print/ и не публикуются: открытый доступ к печати — только по коду автора.
   Запуск: node scripts/print-pdf.cjs [--png]   (нужен Playwright с Chromium) */
const fs=require('fs'),path=require('path'),vm=require('vm');
let pw;try{pw=require('playwright');}catch{pw=require('/opt/npm-tools/node_modules/playwright');}
const root=path.resolve(__dirname,'..'),out=path.join(root,'qa/print');fs.mkdirSync(path.join(out,'cases'),{recursive:true});
const ctx={};vm.createContext(ctx);for(const f of ['src/deck.js','platform/metadata.js','platform/engine.js','platform/print-layout.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const D=ctx.PEDAGOG_DATA,S=ctx.PEDAGOG_SESSION,L=ctx.PEDAGOG_PRINT_LAYOUT;
const fontCSS=(fs.readFileSync(path.join(root,'platform/style.css'),'utf8').match(/@font-face\{[^}]+\}/g)||[]).join('\n').replace(/url\(fonts\//g,'url(file://'+path.join(root,'platform/fonts')+'/');
const css=fontCSS+'\nbody{margin:0}\n'+fs.readFileSync(path.join(root,'platform/print.css'),'utf8').replace(/@media screen\{[^}]*\{[^}]*\}\}/,'')+'\n.pc-sheet,.pc-a4{box-shadow:none;break-after:page}';
const doc=body=>`<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>${css}</style></head><body><div id="printOutput">${body}</div></body></html>`;
(async()=>{
  const b=await pw.chromium.launch();const page=await b.newPage();
  const tmp=path.join(out,'_render.html');const show=async body=>{fs.writeFileSync(tmp,doc(body));await page.goto('file://'+tmp,{waitUntil:'load'});};
  async function pdf(name,body){const file=path.join(out,name);await show(body);await page.evaluate(()=>document.fonts.ready);await page.pdf({path:file,format:'A4',printBackground:true,preferCSSPageSize:true});return file;}
  const allCards=[...D.situations.flatMap(c=>L.kit(c,S)),...L.common()];
  const made=[];
  made.push(await pdf('pedagog-4.0-kartochki-dlinnyi-kray.pdf',L.calibrationHTML({edge:'long'})+L.sheetsHTML(allCards,{edge:'long',label:'ПЕДАГОГ 4.0'})));
  made.push(await pdf('pedagog-4.0-kartochki-korotkiy-kray.pdf',L.calibrationHTML({edge:'short'})+L.sheetsHTML(allCards,{edge:'short',label:'ПЕДАГОГ 4.0'})));
  made.push(await pdf('pedagog-4.0-ekonomnaya-pechat.pdf',L.sheetsHTML(allCards,{edge:'long',eco:true,label:'ПЕДАГОГ 4.0 · экономная печать'})));
  made.push(await pdf('pedagog-4.0-materialy-vedushchego.pdf',L.worksheetsHTML(S)));
  for(const c of D.situations)made.push(await pdf(`cases/${c.id}-${c.title.replace(/[«»"?]/g,'').replace(/\s+/g,'-')}.pdf`,L.sheetsHTML(L.kit(c,S),{edge:'long',label:`${c.id} ${c.title}`})));
  made.push(await pdf('cases/obshchaya-koloda-resursy-refleksiya.pdf',L.sheetsHTML(L.common(),{edge:'long',label:'Ресурсы и рефлексия'})));
  if(process.argv.includes('--png')){fs.mkdirSync(path.join(out,'png'),{recursive:true});await page.setViewportSize({width:794,height:1123});
    const pick=[...L.kit(D.situations.find(c=>c.id==='С-12'),S),...L.common().slice(0,4)];await show(L.sheetsHTML(pick,{edge:'long'})+L.worksheetsHTML(S));await page.evaluate(()=>document.fonts.ready);
    const n=await page.locator('.pc-sheet,.pc-a4').count();for(let i=0;i<n;i++)await page.locator('.pc-sheet,.pc-a4').nth(i).screenshot({path:path.join(out,'png',`page-${String(i+1).padStart(2,'0')}.png`)});}
  /* Проверка переполнения: содержимое лицевых сторон должно помещаться в карточку. */
  await show(L.sheetsHTML(allCards,{edge:'long'}));await page.evaluate(()=>document.fonts.ready);
  const overflow=await page.evaluate(()=>[...document.querySelectorAll('.pc-sheet .pc-body')].filter(e=>e.scrollHeight>e.clientHeight+1).map(e=>e.closest('.pc-card').querySelector('.pc-head span').textContent+' / '+e.closest('.pc-card').querySelector('.pc-head b').textContent));
  const sheets=L.plan(allCards).length/2;
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({deck:D.version,situations:D.situations.length,cards:allCards.length,sheetsDuplex:sheets,overflow,files:made.map(f=>path.relative(out,f))},null,1));
  console.log(`PDF: ${made.length} файлов, ${allCards.length} карточек, ${sheets} листов A4 (двусторонних). Переполнение: ${overflow.length?overflow.join('; '):'нет'}.`);
  fs.rmSync(tmp,{force:true});await b.close();if(overflow.length)process.exitCode=1;
})();
