/* ПЕДАГОГ · модель онлайн-сессии (schema 5, редакция 4.0). Без DOM: используется в браузере, в тестах и при сборке.
   Ситуация раскрывается постепенно: исходные обстоятельства и первые роли → три новых обстоятельства,
   с каждым входят новые участники → поиск решения → рефлексия.
   Форматы 15 / 40 / 90 минут задаются здесь и только здесь: интерфейс, правила и печатная
   инструкция берут регламент из FORMATS. */
(function (root) {
  'use strict';
  const D = root.PEDAGOG_DATA;
  const VERSION = 5;
  const MAX_PEOPLE = 40, MAX_ROUNDS = 6;

  /* reveal — сколько обстоятельств открыто к началу этапа. note — ключ записи команды. */
  const STAGES = {
    start: {title:'Исходная ситуация', short:'Ситуация', reveal:0, note:null,
      do:'Прочитайте ситуацию вслух. Распределите роли: на экране видно, кто вступает сразу, а кто — позже. Свободные участники — наблюдатели. Напомните: можно наблюдать, сменить роль или попросить паузу без объяснений; реальных детей и коллег не называем.',
      who:'Ведущий, затем все', result:'Все понимают, что произошло, и знают, кто какую роль ведёт.'},
    positions: {title:'Первые позиции', short:'Позиции', reveal:0, note:'positions',
      do:'Первые роли читают свои карточки про себя и начинают с исходной реплики. 2–3 минуты разговора — так, как действовали бы сами. Не нужно решать всё: важно услышать позиции. Наблюдатели записывают точные слова.',
      who:'Первые роли; наблюдатели записывают', result:'Позиции первых участников прозвучали; понятно, как ситуация выглядит сейчас.'},
    ev1: {title:'Обстоятельство 1', short:'Обст. 1', reveal:1, note:'ev1',
      do:'Ведущий открывает карточку обстоятельства и читает её вслух. В разговор входит новая роль: она называет свою позицию одной-двумя фразами. Короткий обмен репликами, затем ответ на вопрос карточки.',
      who:'Ведущий открывает; новая роль входит', result:'Записано, что изменилось в понимании ситуации.'},
    ev2: {title:'Обстоятельство 2', short:'Обст. 2', reveal:2, note:'ev2',
      do:'Откройте второе обстоятельство. Новая роль вступает в разговор. Проверьте прежние выводы: что подтвердилось, а что оказалось предположением?',
      who:'Ведущий открывает; новая роль входит', result:'Названо, что подтвердилось и что пришлось пересмотреть.'},
    ev3: {title:'Обстоятельство 3', short:'Обст. 3', reveal:3, note:'ev3',
      do:'Откройте последнее обстоятельство. Теперь в ситуации участвуют все роли. Каждая коротко говорит, чего хочет и за что отвечает. Обсуждение ещё не поиск решения — сначала увидьте всю картину.',
      who:'Все роли', result:'Видна вся картина: позиции, интересы и границы ответственности.'},
    ev23: {title:'Обстоятельства 2 и 3', short:'Обст. 2–3', reveal:3, note:'ev2',
      do:'Откройте два последних обстоятельства подряд. Новые роли называют свои позиции одной фразой. Что теперь выглядит иначе, чем в начале?',
      who:'Ведущий открывает; новые роли входят', result:'Все роли в игре; названо главное изменение картины.'},
    solution: {title:'Поиск решения', short:'Решение', reveal:3, note:'decision',
      do:'Назовите два-три варианта действий и их последствия для каждой роли — завтра и через месяц. По желанию возьмите карточку ресурса как инструмент. Выберите обоснованный вариант: что делаем, кто, к какому сроку и как поймём, что получилось. Несогласие можно записать.',
      who:'Все, роли остаются в своих позициях', result:'Записано действие, ответственные, срок и признак результата.'},
    reflect: {title:'Рефлексия', short:'Рефлексия', reveal:3, note:'reflection',
      do:'Выйдите из ролей: назовите своё имя. Как менялось ваше понимание ситуации с каждым обстоятельством? Обсудите вопросы ниже. Каждый для себя записывает один шаг, который попробует в работе. Делиться им не обязательно.',
      who:'Каждый за себя, затем по желанию — вслух', result:'У каждого есть личный шаг; у группы — общий вывод, если она согласна его записать.'},
    break: {title:'Перерыв', short:'Перерыв', reveal:3, note:null,
      do:'Пять минут перерыва. Перед ним выберите ситуацию второго раунда — лучше из другой темы, чтобы сравнить, как работают разные роли.',
      who:'Ведущий', result:'Выбрана ситуация второго раунда.'},
    summary: {title:'Итог встречи', short:'Итог', reveal:3, note:'meeting',
      do:'Сравните два раунда: какие роли чаще всего меняли картину? Какой вопрос или приём группа возьмёт в работу? Запишите только то, с чем все согласны.',
      who:'Все', result:'Есть общий вывод встречи (по согласию группы).'}
  };
  const P40 = [['start',4],['positions',5],['ev1',5],['ev2',5],['ev3',5],['solution',10],['reflect',6]];
  const FORMATS = {
    15: {title:'Знакомство', lead:'Одна ситуация в сжатом темпе: все роли и обстоятельства, короткое решение и вывод.', people:'2–8 участников',
         rounds:[[['start',2],['positions',2],['ev1',2],['ev23',3],['solution',4],['reflect',2]]]},
    40: {title:'Полный разбор', lead:'Одна ситуация: роли входят по очереди, три обстоятельства, поиск решения и рефлексия.', people:'3–12 участников',
         rounds:[P40]},
    90: {title:'Командная встреча', lead:'Два полных раунда по разным ситуациям, перерыв и общий итог.', people:'6–40 участников, команды по 4–6',
         rounds:[[...P40,['break',5]],[...P40,['summary',5]]]}
  };
  const DURATIONS = [15, 40, 90];
  const NOTE_KEYS = ['positions','ev1','ev2','ev3','decision','reflection'];
  const NOTE_LABELS = {positions:'Первые позиции',ev1:'Обстоятельство 1: что изменилось',ev2:'Обстоятельство 2: что изменилось',ev3:'Обстоятельство 3: что изменилось',decision:'Решение',reflection:'Общий вывод'};

  const by = (kind,id) => (D[kind]||[]).find(c=>c.id===id);
  const roleType = id => D.roleTypes.find(t=>t.id===id);
  const pick = (items,rng=Math.random) => items[Math.min(items.length-1,Math.floor(rng()*items.length))];
  const integer = (v,a,b) => Number.isInteger(v)&&v>=a&&v<=b;
  const text = (v,max=12000) => typeof v==='string'&&v.length<=max;

  function format(minutes){ const f=FORMATS[minutes]; if(!f) throw new Error('Неизвестный формат.'); return f; }
  function roundPlan(minutes,index){ const f=format(minutes);
    /* Дополнительные раунды сверх плана идут по 40-минутной схеме (в 15-минутном формате — по своей). */
    const plan = index<f.rounds.length ? f.rounds[index] : (minutes===15 ? f.rounds[0] : P40);
    return {stages:plan.map(([k])=>k), plan:plan.map(([,m])=>m*60)}; }
  function totalMinutes(minutes){ return format(minutes).rounds.flat().reduce((a,[,m])=>a+m,0); }
  function teamsFor(people){ return people>12 ? Math.min(8,Math.ceil(people/6)) : 1; }

  /* Роли в порядке входа. */
  function castOrder(c){ return c.cast.map((x,i)=>({x,i})).sort((a,b)=>a.x.enters-b.x.enters||a.i-b.i).map(o=>o.x); }
  /* Сколько обстоятельств открыто на этапе index (с учётом всех предыдущих этапов). */
  function revealedAt(stages,index){ return Math.max(0,...stages.slice(0,index+1).map(k=>STAGES[k].reveal)); }
  function activeCast(c,revealed){ return castOrder(c).filter(x=>x.enters<=revealed); }
  function enteringAt(c,stages,index){ const now=revealedAt(stages,index), before=index>0?revealedAt(stages,index-1):0;
    return index===0?[]:castOrder(c).filter(x=>x.enters>before&&x.enters<=now&&x.enters>0); }
  function eventsAt(c,stages,index){ const now=revealedAt(stages,index), before=index>0?revealedAt(stages,index-1):0;
    return c.events.map((ev,i)=>({...ev,number:i+1})).filter(ev=>ev.number>before&&ev.number<=now); }

  /* Распределение ролей между игроками команды. Ролей обычно больше, чем людей: первые роли получают разные игроки,
     вступающие позже — по кругу, так что игрок может вести две роли (вторую — с момента её входа).
     0 — роль зачитывает ведущий. Игроки без ролей — наблюдатели. */
  function defaultAssign(c,size,solo){ const a={}; const order=castOrder(c);
    if(solo){ order.forEach(x=>a[x.key]=1); return a; }
    order.forEach((x,i)=>{ a[x.key]=(i%size)+1; }); return a; }
  function observers(c,t){ const used=new Set(Object.values(t.assign)); const out=[]; for(let p=1;p<=t.size;p++) if(!used.has(p)) out.push(p); return out; }

  function team(c,number,size,solo,rng){
    return {number,size,caseId:c.id,mode:solo?'solo':(size<3?'council':'scene'),assign:defaultAssign(c,size,solo),
      resource:null,reflectCard:pick(D.reflections,rng).id,
      notes:{positions:'',ev1:'',ev2:'',ev3:'',decision:'',reflection:''}};
  }
  function makeRound(s,number,caseId,rng){
    const c=by('situations',caseId); if(!c) throw new Error('Ситуация не найдена.');
    const {stages,plan}=roundPlan(s.settings.duration,number-1);
    const n=s.settings.teams, sizes=Array.from({length:n},(_,i)=>Math.floor(s.settings.people/n)+(i<s.settings.people%n?1:0));
    return {number,stage:0,remaining:plan[0],running:false,stages,plan,teams:sizes.map((size,i)=>team(c,i+1,size,s.settings.solo,rng))};
  }
  function create(settings,rng=Math.random){
    const people=settings&&settings.people, duration=settings&&settings.duration, caseId=settings&&settings.caseId;
    if(!integer(people,1,MAX_PEOPLE)) throw new Error('Укажите число участников от 1 до 40.');
    if(!DURATIONS.includes(duration)) throw new Error('Выберите формат: 15, 40 или 90 минут.');
    if(!by('situations',caseId)) throw new Error('Выберите ситуацию из списка.');
    const s={schema:VERSION,deckVersion:D.version,settings:{people,duration,caseId,teams:teamsFor(people),solo:people===1},
      started:new Date().toISOString(),currentRound:0,currentTeam:0,view:'host',completed:false,meeting:'',rounds:[]};
    s.rounds.push(makeRound(s,1,caseId,rng));
    return s;
  }
  function current(s){ const round=s.rounds[s.currentRound]; const t=round.teams[s.currentTeam]; const situation=by('situations',t.caseId);
    const revealed=revealedAt(round.stages,round.stage);
    return {round,team:t,situation,key:round.stages[round.stage],revealed,active:activeCast(situation,revealed),
      entering:enteringAt(situation,round.stages,round.stage),events:eventsAt(situation,round.stages,round.stage)}; }
  function plannedRounds(s){ return format(s.settings.duration).rounds.length; }

  function assign(s,key,player,teamIndex=s.currentTeam){ const t=s.rounds[s.currentRound].teams[teamIndex],c=by('situations',t.caseId);
    if(!c.cast.some(x=>x.key===key)) throw new Error('Такой роли в ситуации нет.');
    if(!integer(player,0,t.size)) throw new Error('Такого участника нет.');
    t.assign[key]=player; }
  function setMode(s,mode,teamIndex=s.currentTeam){ const t=s.rounds[s.currentRound].teams[teamIndex];
    if(s.settings.solo){ t.mode='solo'; return; }
    if(!['scene','council'].includes(mode)) throw new Error('Неизвестный режим.'); t.mode=mode; }
  function setCase(s,id,rng=Math.random){ const c=by('situations',id); if(!c) throw new Error('Ситуация не найдена.');
    const r=s.rounds[s.currentRound]; if(r.stage>1) throw new Error('Ситуацию можно заменить только до первого обстоятельства.');
    r.teams=r.teams.map(t=>team(c,t.number,t.size,s.settings.solo,rng)); if(s.currentRound===0) s.settings.caseId=id; }
  function resource(s,id,teamIndex=s.currentTeam){ const t=s.rounds[s.currentRound].teams[teamIndex],c=by('situations',t.caseId);
    if(id===null){t.resource=null;return;}
    if(!c.resourceIds.includes(id)) throw new Error('Этот ресурс не предлагается к ситуации.'); t.resource=id; }
  function move(s,index){ const r=s.rounds[s.currentRound]; if(!integer(index,0,r.stages.length-1)) throw new Error('Такого этапа нет.');
    if(index===r.stage) return; r.stage=index; r.remaining=r.plan[index]; r.running=false; }
  function nextRound(s,caseId,rng=Math.random){ if(s.rounds.length>=MAX_ROUNDS) throw new Error('В одной встрече — не больше шести раундов.');
    if(!by('situations',caseId)) throw new Error('Ситуация не найдена.');
    s.rounds.forEach(r=>r.running=false); s.rounds.push(makeRound(s,s.rounds.length+1,caseId,rng)); s.currentRound=s.rounds.length-1; s.currentTeam=0; s.completed=false; }
  function finish(s){ s.rounds.forEach(r=>r.running=false); s.completed=true; }
  function reopen(s){ s.completed=false; }
  function remainingMeeting(s){ const r=s.rounds[s.currentRound]; let sec=r.remaining; for(let i=r.stage+1;i<r.plan.length;i++)sec+=r.plan[i];
    for(let ri=s.currentRound+1;ri<plannedRounds(s);ri++) sec+=roundPlan(s.settings.duration,ri).plan.reduce((a,b)=>a+b,0); return sec; }

  /* Подсказка этапа с учётом режима: сцена / совет коллег / один участник. */
  function stageCopy(s){ const {round:r,team:t,key}=current(s); const d=STAGES[key];
    let {title,do:doText,who,result}=d;
    if(t.mode==='council'&&['positions','ev1','ev2','ev3','ev23'].includes(key)){
      doText=key==='positions'
        ?'Совет коллег: без инсценировки. Зачитайте позиции первых ролей и обсудите, что и какими словами сказал бы каждый персонаж в ответ на исходную реплику.'
        :'Совет коллег: зачитайте обстоятельство и карточку вступающей роли. Обсудите, что она скажет и как это меняет картину.';
      who='Вся группа';
    }
    if(t.mode==='solo'){
      who='Вы';
      if(key==='start') doText='Прочитайте ситуацию. Вы будете последовательно смотреть на неё глазами каждой роли — по мере того как они появляются.';
      if(key==='positions') doText='Прочитайте карточки первых ролей. Запишите, что сказал бы каждый персонаж в ответ на исходную реплику.';
      if(['ev1','ev2','ev3','ev23'].includes(key)) doText='Откройте обстоятельство и карточку новой роли. Что она знает такого, чего не знали остальные? Что изменилось в вашем понимании?';
      if(key==='solution') doText='Сформулируйте два варианта действий и проверьте каждый глазами всех ролей. Выберите вариант и запишите: что, кто, срок, признак результата.';
      if(key==='reflect') doText='Вспомните, как менялась ваша первая версия событий. Ответьте себе на вопросы ниже и запишите один шаг для работы.';
    }
    return {key,title,do:doText,who,result,minutes:Math.round(r.plan[r.stage]/60),note:d.note};
  }

  function validate(s){
    if(!s||typeof s!=='object'||s.schema!==VERSION||s.deckVersion!==D.version||!s.settings) return false;
    const st=s.settings;
    if(!integer(st.people,1,MAX_PEOPLE)||!DURATIONS.includes(st.duration)||!by('situations',st.caseId)||st.teams!==teamsFor(st.people)||st.solo!==(st.people===1)) return false;
    if(!['host','participant'].includes(s.view)||typeof s.completed!=='boolean'||!text(s.started,40)||!Number.isFinite(Date.parse(s.started))||!text(s.meeting)) return false;
    if(!Array.isArray(s.rounds)||!integer(s.rounds.length,1,MAX_ROUNDS)||!integer(s.currentRound,0,s.rounds.length-1)||!integer(s.currentTeam,0,st.teams-1)) return false;
    return s.rounds.every((r,ri)=>{
      if(!r||r.number!==ri+1) return false;
      const exp=roundPlan(st.duration,ri);
      if(JSON.stringify(r.stages)!==JSON.stringify(exp.stages)||JSON.stringify(r.plan)!==JSON.stringify(exp.plan)) return false;
      if(!integer(r.stage,0,r.stages.length-1)||!Number.isFinite(r.remaining)||r.remaining<0||r.remaining>86400||typeof r.running!=='boolean') return false;
      if(r.running&&(s.completed||ri!==s.currentRound)) return false;
      if(!Array.isArray(r.teams)||r.teams.length!==st.teams||r.teams.reduce((n,t)=>n+(t&&t.size||0),0)!==st.people) return false;
      return r.teams.every((t,ti)=>{ const c=t&&by('situations',t.caseId);
        if(!c||t.number!==ti+1||!integer(t.size,1,MAX_PEOPLE)||!['scene','council','solo'].includes(t.mode)) return false;
        if((t.mode==='solo')!==st.solo) return false;
        if(!t.assign||typeof t.assign!=='object'||Object.keys(t.assign).length!==c.cast.length) return false;
        if(!c.cast.every(x=>integer(t.assign[x.key],0,t.size))) return false;
        if(!(t.resource===null||c.resourceIds.includes(t.resource))||!by('reflections',t.reflectCard)) return false;
        return t.notes&&NOTE_KEYS.every(k=>text(t.notes[k]))&&Object.keys(t.notes).length===NOTE_KEYS.length; });
    });
  }
  function restore(raw){ if(typeof raw!=='string'||raw.length>2000000) throw new Error('Файл слишком большой или повреждён.');
    let s; try{ s=JSON.parse(raw); }catch{ throw new Error('Это не файл сохранения игры.'); }
    if(s&&(s.schema===3||s.schema===4)) throw new Error('Это сохранение прежней редакции игры (до 30.10.2026). Его можно скачать как текст, но продолжить в новой редакции нельзя: изменились роли и ход раунда.');
    if(!validate(s)) throw new Error('Файл не соответствует текущей версии игры.');
    s.rounds.forEach(r=>r.running=false); return s; }

  root.PEDAGOG_SESSION={VERSION,DURATIONS,FORMATS,STAGES,NOTE_KEYS,NOTE_LABELS,by,roleType,pick,roundPlan,totalMinutes,teamsFor,
    castOrder,revealedAt,activeCast,enteringAt,eventsAt,defaultAssign,observers,create,current,plannedRounds,
    assign,setMode,setCase,resource,move,nextRound,finish,reopen,remainingMeeting,stageCopy,validate,restore};
  if(typeof module!=='undefined'&&module.exports) module.exports=root.PEDAGOG_SESSION;
})(globalThis);
