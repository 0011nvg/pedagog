/* ПЕДАГОГ · модель онлайн-сессии (schema 4). Без DOM: используется в браузере и в тестах.
   Форматы 15 / 40 / 90 минут задаются здесь и только здесь: интерфейс, правила и печатная
   инструкция берут регламент из FORMATS. */
(function (root) {
  'use strict';
  const D = root.PEDAGOG_DATA;
  const VERSION = 4;
  const MAX_PEOPLE = 40, MAX_ROUNDS = 6;

  /* Этапы. note — ключ общей записи команды (или null). */
  const STAGES = {
    situation: {title:'Ситуация и позиции', note:null,
      do:'Прочитайте ситуацию вслух. Добровольцы выбирают места, остальные — наблюдатели. Напомните: можно наблюдать, сменить роль или попросить паузу без объяснений; реальных детей и коллег не называем.',
      who:'Все', result:'Все понимают, что произошло, кто есть кто и чего персонажи не знают.'},
    first: {title:'Первая попытка', note:'first',
      do:'Начните с начальной реплики и сыграйте 2–3 минуты так, как действовали бы сами. Не нужно решать всё — достаточно первого шага. Наблюдатели записывают точные слова.',
      who:'Участники сцены; наблюдатели записывают', result:'Есть первый вариант действий.'},
    observe: {title:'Что заметили', note:'observed',
      do:'Сначала говорят участники сцены: чего пытались добиться? Затем наблюдатели: одна точная реплика, что она изменила, какой вопрос остался. Обсуждаем действия, не людей.',
      who:'Сначала исполнители, затем наблюдатели', result:'Названы одна сработавшая и одна неудачная реплика, есть вопрос для второй попытки.'},
    resource: {title:'Ресурс', note:null,
      do:'Выберите карточку ресурса из подходящих к ситуации. Договоритесь, в какой момент разговора её применить и что именно изменится. Остальные условия остаются прежними.',
      who:'Вся команда', result:'Выбран ресурс и названо одно действие, которое меняем.'},
    retry: {title:'Вторая попытка', note:'retry',
      do:'Сыграйте ключевой момент ещё раз, применив ресурс. Можно поменяться ролями или передать место наблюдателю.',
      who:'Участники сцены (можно новые)', result:'Есть второй вариант, который можно сравнить с первым.'},
    compare: {title:'Сравнение последствий', note:'consequences',
      do:'Сравните два варианта: что каждый из них даст завтра и через месяц? Что изменилось для каждой стороны? Чего мы по-прежнему не знаем? По желанию проверьте решение карточкой поворота.',
      who:'Все', result:'Понятно, чем различаются варианты и где их пределы.'},
    decision: {title:'Решение', note:'decision',
      do:'Выберите действие, которое считаете обоснованным: что делаем, кто, к какому сроку и как поймём, что получилось. Несогласие можно записать — единогласие не обязательно.',
      who:'Все', result:'Записано действие, ответственный, срок и признак результата.'},
    reflect: {title:'Личный вывод', note:'reflection',
      do:'Выйдите из ролей: назовите своё имя. Обсудите вопросы ниже. Каждый для себя записывает один шаг, который попробует в работе. Делиться им не обязательно.',
      who:'Каждый за себя, затем по желанию — вслух', result:'У каждого есть личный шаг; у группы — общий вывод, если она согласна его записать.'},
    quickResource: {title:'Что заметили и что изменим', note:'observed',
      do:'Одна-две точные реплики от наблюдателей: что сработало, что нет. Затем выберите карточку ресурса и договоритесь, что измените во второй попытке.',
      who:'Все', result:'Выбран ресурс и названо одно изменение.'},
    quickDecision: {title:'Сравнение и решение', note:'decision',
      do:'Чем различались попытки? Какой вариант вы выбрали бы в реальной школе и почему? Запишите действие, срок и признак результата.',
      who:'Все', result:'Есть обоснованный выбор между двумя вариантами.'},
    break: {title:'Перерыв', note:null,
      do:'Пять минут перерыва. Перед ним выберите ситуацию второго раунда — лучше из другой темы, чтобы сравнить подходы.',
      who:'Ведущий', result:'Выбрана ситуация второго раунда.'},
    summary: {title:'Итог встречи', note:'meeting',
      do:'Сравните решения двух раундов: что в них общего? Какой приём или вопрос группа хочет использовать в работе? Запишите только то, с чем все согласны.',
      who:'Все', result:'Есть общий вывод встречи (по согласию группы).'}
  };
  const P40 = [['situation',5],['first',5],['observe',4],['resource',3],['retry',5],['compare',5],['decision',5],['reflect',8]];
  const FORMATS = {
    15: {title:'Знакомство', lead:'Одна ситуация, две короткие попытки, личный вывод.', people:'2–8 участников',
         rounds:[[['situation',3],['first',2],['quickResource',2],['retry',2],['quickDecision',3],['reflect',3]]]},
    40: {title:'Полный разбор', lead:'Одна ситуация: две попытки, наблюдения, ресурс, сравнение и решение.', people:'3–12 участников',
         rounds:[P40]},
    90: {title:'Командная встреча', lead:'Два полных раунда по разным ситуациям, перерыв и общий итог.', people:'6–40 участников, команды по 4–6',
         rounds:[[...P40,['break',5]],[...P40,['summary',5]]]}
  };
  const DURATIONS = [15, 40, 90];
  const NOTE_KEYS = ['first','observed','retry','consequences','decision','reflection'];

  const by = (kind,id) => (D[kind]||[]).find(c=>c.id===id);
  const copy = v => JSON.parse(JSON.stringify(v));
  const pick = (items,rng=Math.random) => items[Math.min(items.length-1,Math.floor(rng()*items.length))];
  const integer = (v,a,b) => Number.isInteger(v)&&v>=a&&v<=b;
  const text = (v,max=12000) => typeof v==='string'&&v.length<=max;

  function format(minutes){ const f=FORMATS[minutes]; if(!f) throw new Error('Неизвестный формат.'); return f; }
  function roundPlan(minutes,index){ const f=format(minutes); const r=f.rounds[Math.min(index,f.rounds.length-1)];
    /* Дополнительные раунды сверх плана идут по 40-минутной схеме без перерыва. */
    const plan = index<f.rounds.length ? r : (minutes===15 ? f.rounds[0] : P40);
    return {stages:plan.map(([k])=>k), plan:plan.map(([,m])=>m*60)}; }
  function totalMinutes(minutes){ return format(minutes).rounds.flat().reduce((a,[,m])=>a+m,0); }
  function teamsFor(people){ return people>12 ? Math.min(8,Math.ceil(people/6)) : 1; }

  function positions(c,roleSet=0){
    return c.roleSets[roleSet].map((roleId,i)=>({seat:i+1,roleId,who:c.seats[i].who,brief:c.seats[i].brief,ask:c.seats[i].ask}));
  }
  function seatCount(c,roleSet){ return c.roleSets[roleSet].length; }
  function team(c,number,size,rng){
    const roleSet=c.roleSets.indexOf(pick(c.roleSets,rng));
    return {number,size,caseId:c.id,roleSet,discussion:c.id==='С-17'||size<seatCount(c,roleSet),resource:null,turn:null,
      notes:{first:'',observed:'',retry:'',consequences:'',decision:'',reflection:''}};
  }
  function makeRound(s,number,caseId,rng){
    const c=by('situations',caseId); if(!c) throw new Error('Ситуация не найдена.');
    const {stages,plan}=roundPlan(s.settings.duration,number-1);
    const sizes=Array.from({length:s.settings.teams},(_,i)=>Math.floor(s.settings.people/s.settings.teams)+(i<s.settings.people%s.settings.teams?1:0));
    return {number,stage:0,remaining:plan[0],running:false,stages,plan,teams:sizes.map((size,i)=>team(c,i+1,size,rng))};
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
  function current(s){ const round=s.rounds[s.currentRound]; const t=round.teams[s.currentTeam]; return {round,team:t,situation:by('situations',t.caseId),key:round.stages[round.stage]}; }
  function plannedRounds(s){ return format(s.settings.duration).rounds.length; }
  function needsResource(round,index){ return round.stages.slice(0,index+1).includes('retry'); }
  function missingResources(round){ return round.teams.filter(t=>!t.resource).map(t=>t.number); }

  function setRoles(s,index,teamIndex=s.currentTeam){ const t=s.rounds[s.currentRound].teams[teamIndex],c=by('situations',t.caseId);
    if(!integer(index,0,c.roleSets.length-1)) throw new Error('Такого состава нет.');
    t.roleSet=index; if(t.size<seatCount(c,index)) t.discussion=true; if(t.turn&&!eligibleTurns(s).includes(t.turn)) t.turn=null; }
  function setDiscussion(s,on){ const {team:t,situation:c}=current(s); if(c.id==='С-17'||t.size<seatCount(c,t.roleSet)||s.settings.solo){t.discussion=true;return;} t.discussion=!!on; if(t.discussion&&t.turn==='К-02')t.turn=null; }
  function setCase(s,id,rng=Math.random){ const c=by('situations',id); if(!c) throw new Error('Ситуация не найдена.');
    const r=s.rounds[s.currentRound]; if(r.stage>1) throw new Error('Ситуацию можно заменить только на первых двух этапах раунда.');
    r.teams=r.teams.map(t=>team(c,t.number,t.size,rng)); if(s.currentRound===0) s.settings.caseId=id; }
  function resource(s,id,teamIndex=s.currentTeam){ const t=s.rounds[s.currentRound].teams[teamIndex],c=by('situations',t.caseId);
    if(id===null){t.resource=null;t.turn=null;return;}
    if(!c.resourceIds.includes(id)) throw new Error('Этот ресурс не подходит к ситуации.'); t.resource=id; }
  function eligibleTurns(s){ const {round:r,team:t,situation:c,key}=current(s);
    if(s.settings.duration===15||key!=='compare'||!t.resource) return [];
    return c.turnIds.filter(id=>{
      if(id==='К-02'&&(t.discussion||s.settings.solo)) return false;
      if(['К-05','К-06','К-07'].includes(id)&&!c.note.includes('Для '+id)) return false;
      if(id==='К-07'&&t.size<=seatCount(c,t.roleSet)) return false;
      return true; }); }
  function turn(s,id){ if(id===null){current(s).team.turn=null;return;} if(!eligibleTurns(s).includes(id)) throw new Error('Этот поворот сейчас недоступен.'); current(s).team.turn=id; }
  function move(s,index){ const r=current(s).round; if(!integer(index,0,r.stages.length-1)) throw new Error('Такого этапа нет.');
    if(index===r.stage) return;
    if(index>r.stage&&needsResource(r,index)){ const miss=missingResources(r); if(miss.length) throw new Error(r.teams.length>1?`Сначала выберите ресурс для команд: ${miss.join(', ')}.`:'Сначала выберите карточку ресурса — без неё вторая попытка не даст материала для сравнения.'); }
    r.stage=index; r.remaining=r.plan[index]; r.running=false; }
  function nextRound(s,caseId,rng=Math.random){ if(s.rounds.length>=MAX_ROUNDS) throw new Error('В одной встрече — не больше шести раундов.');
    if(!by('situations',caseId)) throw new Error('Ситуация не найдена.');
    s.rounds.forEach(r=>r.running=false); s.rounds.push(makeRound(s,s.rounds.length+1,caseId,rng)); s.currentRound=s.rounds.length-1; s.currentTeam=0; s.completed=false; }
  function finish(s){ s.rounds.forEach(r=>r.running=false); s.completed=true; }
  function reopen(s){ s.completed=false; }
  function remainingMeeting(s){ const r=s.rounds[s.currentRound]; let sec=r.remaining; for(let i=r.stage+1;i<r.plan.length;i++)sec+=r.plan[i];
    for(let ri=s.currentRound+1;ri<plannedRounds(s);ri++) sec+=roundPlan(s.settings.duration,ri).plan.reduce((a,b)=>a+b,0); return sec; }

  /* Подсказка этапа с учётом режима (совет коллег / один участник / С-17). */
  function stageCopy(s){ const {round:r,team:t,situation:c,key}=current(s); const d=STAGES[key];
    let {title,do:doText,who,result}=d;
    const solo=s.settings.solo, talk=t.discussion||solo;
    if(talk&&(key==='first'||key==='retry')){
      title=key==='first'?'Первый вариант':'Второй вариант';
      doText=solo?(key==='first'?'Запишите, что вы сказали бы в ответ на начальную реплику и что ответил бы собеседник. Посмотрите на ситуацию с каждого места по очереди.':'Перепишите ключевую реплику с учётом выбранного ресурса. Как ответил бы собеседник теперь?')
                 :(key==='first'?'Совет коллег: без инсценировки сформулируйте первый вариант — что и какими словами сказали бы. Учтите позицию каждого персонажа.':'Совет коллег: перескажите первый вариант с учётом ресурса. Что меняется в словах и последствиях?');
      who=solo?'Вы':'Вся группа';
    }
    if(solo&&key==='situation'){doText='Прочитайте ситуацию и карточки мест. Попробуйте коротко ответить на вопрос каждого персонажа — так вы увидите случай с разных сторон.';who='Вы';}
    if(solo&&key==='observe'){doText='Перечитайте первый вариант глазами каждого персонажа: какая фраза помогла бы ему, а какая — задела? Чего вы не знаете?';who='Вы';}
    if(solo&&key==='reflect'){doText='Ответьте себе на вопросы ниже и запишите один шаг, который попробуете в работе.';who='Вы';}
    if(c.id==='С-17'&&['situation','first','retry'].includes(key)) doText+=' Только обсуждение: состояние человека не изображают.';
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
      const retryAt=r.stages.indexOf('retry'); if(retryAt>=0&&r.stage>=retryAt&&missingResources(r).length) return false;
      return r.teams.every((t,ti)=>{ const c=t&&by('situations',t.caseId);
        if(!c||t.number!==ti+1||!integer(t.size,1,MAX_PEOPLE)||!integer(t.roleSet,0,c.roleSets.length-1)||typeof t.discussion!=='boolean') return false;
        if((c.id==='С-17'||t.size<seatCount(c,t.roleSet))&&!t.discussion) return false;
        if(!(t.resource===null||c.resourceIds.includes(t.resource))||!(t.turn===null||c.turnIds.includes(t.turn))) return false;
        if(t.turn&&!t.resource) return false;
        return t.notes&&NOTE_KEYS.every(k=>text(t.notes[k]))&&Object.keys(t.notes).length===NOTE_KEYS.length; });
    });
  }
  function restore(raw){ if(typeof raw!=='string'||raw.length>2000000) throw new Error('Файл слишком большой или повреждён.');
    let s; try{ s=JSON.parse(raw); }catch{ throw new Error('Это не файл сохранения игры.'); }
    if(s&&s.schema===3) throw new Error('Это сохранение прежней версии игры (до 29.10.2026). Его можно открыть как текст, но продолжить в новой версии нельзя.');
    if(!validate(s)) throw new Error('Файл не соответствует текущей версии игры.');
    s.rounds.forEach(r=>r.running=false); return s; }

  root.PEDAGOG_SESSION={VERSION,DURATIONS,FORMATS,STAGES,NOTE_KEYS,by,pick,positions,seatCount,roundPlan,totalMinutes,teamsFor,create,current,plannedRounds,missingResources,
    setRoles,setDiscussion,setCase,resource,eligibleTurns,turn,move,nextRound,finish,reopen,remainingMeeting,stageCopy,validate,restore};
  if(typeof module!=='undefined'&&module.exports) module.exports=root.PEDAGOG_SESSION;
})(globalThis);
