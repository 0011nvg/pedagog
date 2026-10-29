'use strict';
/* ПЕДАГОГ · смена или проверка кода автора для печатного конструктора (print.html).

   Как это работает: сайт статический, сервера нет. Код не хранится ни в репозитории, ни на сайте.
   В файле print-pack.js лежит небольшой контрольный пакет, зашифрованный ключом из кода
   (PBKDF2-SHA256, 250 000 итераций → AES-GCM-256). Конструктор открывается, только если введённый
   код расшифровывает пакет. Это барьер для интерфейса печати, а не серверная защита: тексты ситуаций
   и так открыты на сайте, а подготовленный человек может обойти проверку в инструментах браузера.

   Запуск (Node.js 18+), из папки репозитория:
     node scripts/set-author-code.cjs          — задать новый код (вводится дважды, на экране не виден)
     node scripts/set-author-code.cjs --check  — проверить, подходит ли код к текущему print-pack.js
   После смены кода: npm run build, затем commit и push — новый код начнёт действовать после публикации.
   Код не регистрозависим (приводится к верхнему регистру), пробелы по краям отбрасываются.
   Не вставляйте код в команду, коммит, issue или Pull Request. */
const fs=require('fs'),path=require('path'),readline=require('readline');
const {webcrypto:crypto}=require('crypto');
const PACK=path.resolve(__dirname,'..','print-pack.js');
const ITERATIONS=250000;
const b64=u=>Buffer.from(u).toString('base64'),unb64=s=>new Uint8Array(Buffer.from(s,'base64'));
const norm=code=>code.trim().toUpperCase();

let rl=null;const lines=[],waiting=[];
function ask(question){
  if(!rl){rl=readline.createInterface({input:process.stdin,output:process.stdout,terminal:!!process.stdin.isTTY});
    /* В терминале вместо символов кода печатаются звёздочки. */
    if(process.stdin.isTTY)rl._writeToOutput=s=>{rl.output.write(/^[\r\n]+$/.test(s)?s:'*'.repeat(s.length));};
    rl.on('line',l=>{const w=waiting.shift();if(w)w(l);else lines.push(l);});
    rl.on('close',()=>{while(waiting.length)waiting.shift()('');});}
  process.stdout.write(question);
  return new Promise(resolve=>{if(lines.length)resolve(lines.shift());else waiting.push(l=>{if(process.stdin.isTTY)process.stdout.write('\n');resolve(l);});});}
function done(){if(rl)rl.close();}
async function keyFor(code,salt,usage){
  const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(norm(code)),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:ITERATIONS,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,[usage]);}
function readPack(){const src=fs.readFileSync(PACK,'utf8');const json=src.slice(src.indexOf('{'),src.lastIndexOf('}')+1);return JSON.parse(json);}

(async()=>{
  if(process.argv.includes('--check')){
    const pack=readPack();const code=await ask('Код для проверки: ');
    try{await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(pack.iv)},await keyFor(code,unb64(pack.salt),'decrypt'),unb64(pack.data));console.log('\nКод подходит.');}
    catch{console.log('\nКод НЕ подходит к текущему print-pack.js.');process.exitCode=1;}
    done();return;}
  const code=await ask('Новый код автора (не короче 8 символов): ');
  if(norm(code).length<8){done();console.error('Слишком короткий код. Используйте не меньше 8 символов, лучше 12 и больше.');process.exit(1);}
  const again=await ask('Повторите код: ');done();
  if(norm(code)!==norm(again)){console.error('Коды не совпали. Ничего не изменено.');process.exit(1);}
  const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
  const token=new TextEncoder().encode(JSON.stringify({game:'ПЕДАГОГ',purpose:'print-access',created:new Date().toISOString().slice(0,10)}));
  const data=await crypto.subtle.encrypt({name:'AES-GCM',iv},await keyFor(code,salt,'encrypt'),token);
  fs.writeFileSync(PACK,`/* ПЕДАГОГ · контрольный пакет доступа к печати. Создан scripts/set-author-code.cjs. Код здесь не хранится. */\nglobalThis.PEDAGOG_PRINT_PACK=${JSON.stringify({salt:b64(salt),iv:b64(iv),iterations:ITERATIONS,data:b64(new Uint8Array(data))})};\n`);
  console.log('\nГотово: print-pack.js обновлён. Дальше: npm run build, git commit, git push. Старый код перестанет действовать после публикации.');
})();
