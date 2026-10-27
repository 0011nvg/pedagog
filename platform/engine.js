/* Pure session model. The card registry remains src/deck.js. */
(function (root) {
  'use strict';
  const D = root.PEDAGOG_DATA;
  const VERSION = 3;
  const DURATIONS = [20, 45, 60, 90, 120];
  const STAGES = [
    ['welcome','Договорённости','Назовите цель. Каждый вправе выбрать наблюдение, пропустить ответ или остановиться. Используйте вымышленные ситуации; не называйте реальных детей и коллег.'],
    ['prepare','Ситуация и позиции','Прочитайте ситуацию, цель и ограничения. Распределите места между добровольцами. Наблюдателям: отметьте точную реплику, возможное последствие и уточняющий вопрос.'],
    ['first','Первая попытка','Начните с заданной реплики и предложите один реалистичный шаг. Не добавляйте неизвестные факты.'],
    ['observe','Наблюдение','Назовите услышанные слова. Отделите наблюдение от предположения. Обсуждайте действия, а не личность участника.'],
    ['resource','Новая опора','Выберите совместимый ресурс. Назовите одно действие, которое попробуете изменить. Остальные условия остаются прежними.'],
    ['retry','Повторная попытка','Вернитесь к ключевой реплике и попробуйте выбранное действие. Сравните обе попытки: что изменилось, а что осталось трудным?'],
    ['consequence','Проверка решения','Обсудите возможные последствия завтра и через месяц. При согласии всех и наличии времени можно проверить решение одним разрешённым поворотом.'],
    ['decision','Решение и следующий шаг','Согласуйте действие, ответственного, срок и признак результата. Зафиксируйте, что требует уточнения. Разногласие можно сохранить; единогласие не обязательно.'],
    ['reflect','Рефлексия','Назовите своё имя и выйдите из роли. Обсудите вопросы ситуации. Личный вывод можно записать отдельно и не передавать группе.'],
    ['close','Завершение раунда','Каждый по желанию называет один посильный шаг. Проверьте, что все вышли из роли. Общий итог сохраняйте только с согласия группы.']
  ];
  const by = (kind,id) => D[kind].find(c=>c.id===id);
  const copy = v => JSON.parse(JSON.stringify(v));
  const pick = (items,rng=Math.random) => items[Math.min(items.length-1,Math.floor(rng()*items.length))];
  const integer = (v,a,b) => Number.isInteger(v)&&v>=a&&v<=b;
  const text = v => typeof v==='string'&&v.length<=12000;
  function budget(minutes){
    const weights=[.08,.12,.10,.08,.08,.10,.10,.12,.14,.08];
    const secs=weights.map(w=>Math.floor(minutes*60*w));
    secs[9]+=minutes*60-secs.reduce((a,b)=>a+b,0);return secs;
  }
  function positions(c,roleSetIndex=0){
    const ids=c.roleSets[roleSetIndex];
    return ids.map((roleId,index)=>{
      let position=by('roles',roleId).title;
      if(['С-03','С-20'].includes(c.id))position=index===0?'Автор предложения / задания':'Коллега, который высказывает возражение';
      if(c.id==='С-14')position=index===0?'Классный руководитель: организует процедуру выбора':index===1?'Первый родитель: ценит содержательную программу платной экскурсии':'Второй родитель: ценит доступность и добровольность участия';
      return {roleId,position,seat:index+1};
    });
  }
  function team(c,number,size,roleMode,rng){
    const set=roleMode==='manual'?0:c.roleSets.indexOf(pick(c.roleSets,rng));
    return {number,size,caseId:c.id,roleSet:set,assignments:positions(c,set),discussion:c.id==='С-17'||size<c.roleSets[set].length,resource:null,turn:null,conditions:{consent:false,time:false,swap:false,written:false,condition:false,tool:false,volunteer:false},notes:{first:'',observed:'',retry:'',consequences:'',decision:'',reflection:''}};
  }
  function create(settings,rng=Math.random){
    if(!integer(settings.people,1,40)||!integer(settings.teams,1,8)||settings.teams>settings.people||!DURATIONS.includes(settings.duration)||!by('situations',settings.caseId)||!['random','manual'].includes(settings.roleMode)||!['random','choice'].includes(settings.resourceMode)||typeof settings.facilitator!=='boolean')throw new Error('Проверьте количество участников, команд и настройки.');
    const count=settings.duration>=90?2:1;
    const plan=budget(settings.duration/count);
    const c=by('situations',settings.caseId);
    const teams=Array.from({length:settings.teams},(_,i)=>team(c,i+1,Math.floor(settings.people/settings.teams)+(i<settings.people%settings.teams?1:0),settings.roleMode,rng));
    return {schema:VERSION,deckVersion:D.version,settings:copy(settings),started:new Date().toISOString(),currentRound:0,currentTeam:0,plannedRounds:count,view:'host',completed:false,rounds:[{number:1,stage:0,remaining:plan[0],running:false,plan,teams}]};
  }
  function current(s){const round=s.rounds[s.currentRound];return {round,team:round.teams[s.currentTeam],situation:by('situations',round.teams[s.currentTeam].caseId)};}
  function setRoles(s,index){const {team:t,situation:c}=current(s);if(!integer(index,0,c.roleSets.length-1))throw new Error('Недопустимый состав ролей.');t.roleSet=index;t.assignments=positions(c,index);if(t.size<t.assignments.length)t.discussion=true;if(t.turn&&!eligibleTurns(s).includes(t.turn))t.turn=null;}
  function setCase(s,id){const c=by('situations',id);if(!c)throw new Error('Ситуация отсутствует.');const {round,team:t}=current(s);round.teams[s.currentTeam]=team(c,t.number,t.size,s.settings.roleMode,Math.random);}
  function resource(s,id){const {team:t,situation:c}=current(s);if(!c.resourceIds.includes(id))throw new Error('Ресурс несовместим.');t.resource=id;t.turn=null;t.conditions.tool=false;t.conditions.condition=false;}
  function eligibleTurns(s){const {team:t,situation:c,round:r}=current(s),f=t.conditions;if(!t.resource||!f.consent||!f.time||r.stage<5)return [];
    return c.turnIds.filter(id=>{
      if(id==='К-02'&&(!f.swap||t.discussion||t.size<t.assignments.length))return false;
      if(id==='К-03'&&!f.written)return false;
      if(id==='К-05'&&(!f.condition||!c.note.includes('Для К-05:')))return false;
      if(id==='К-06'&&(!f.tool||!c.note.includes('Для К-06:')))return false;
      if(id==='К-07'&&(!f.volunteer||t.size<=t.assignments.length||!c.note.includes('Для К-07:')))return false;
      return true;
    });
  }
  function turn(s,id){if(!eligibleTurns(s).includes(id))throw new Error('Условия поворота не выполнены.');current(s).team.turn=id;}
  function nextRound(s,caseId,rng=Math.random){const c=by('situations',caseId);if(!c)throw new Error('Неизвестная ситуация.');if(s.rounds.length>=20)throw new Error('Не более 20 раундов в одной сессии.');const plan=budget(s.settings.duration/s.plannedRounds);s.rounds.forEach(r=>r.running=false);s.rounds.push({number:s.rounds.length+1,stage:0,remaining:plan[0],running:false,plan,teams:s.rounds[0].teams.map(t=>team(c,t.number,t.size,s.settings.roleMode,rng))});s.currentRound=s.rounds.length-1;s.currentTeam=0;s.completed=false;}
  function move(s,index){if(!integer(index,0,STAGES.length-1))throw new Error('Неверный этап.');const r=current(s).round;r.stage=index;r.remaining=r.plan[index];r.running=false;}
  function stageCopy(s){const {round:r,team:t,situation:c}=current(s);let [key,title,prompt]=STAGES[r.stage];
    if(t.discussion){if(key==='first'){title='Первый вариант решения';prompt='Совет коллег: рассмотрите интересы всех персонажей и сформулируйте первый вариант решения. Инсценировка не проводится.';}if(key==='retry'){title='Пересмотр решения';prompt='Совет коллег: примените выбранный ресурс к первоначальному решению. Сравните два варианта и условия их применения.';}}
    if(c.id==='С-17'&&['prepare','observe','consequence'].includes(key))prompt+=' Только совет коллег; состояние человека не разыгрывается.';
    return {key,title,prompt};
  }
  function validate(s){
    if(!s||typeof s!=='object'||s.schema!==VERSION||s.deckVersion!==D.version||!s.settings)return false;
    try{create(s.settings);}catch{return false;}
    if(!['host','participant'].includes(s.view)||typeof s.completed!=='boolean'||!text(s.started)||!Number.isFinite(Date.parse(s.started))||![1,2].includes(s.plannedRounds)||!Array.isArray(s.rounds)||!integer(s.rounds.length,1,20)||!integer(s.currentRound,0,s.rounds.length-1)||!integer(s.currentTeam,0,s.settings.teams-1))return false;
    return s.rounds.every((r,ri)=>r&&r.number===ri+1&&integer(r.stage,0,9)&&Number.isFinite(r.remaining)&&r.remaining>=0&&r.remaining<=86400&&typeof r.running==='boolean'&&Array.isArray(r.plan)&&r.plan.length===10&&r.plan.every(v=>integer(v,1,7200))&&Array.isArray(r.teams)&&r.teams.length===s.settings.teams&&r.teams.reduce((n,t)=>n+(t?.size||0),0)===s.settings.people&&r.teams.every((t,ti)=>{
      const c=t&&by('situations',t.caseId);if(!c||t.number!==ti+1||!integer(t.size,1,40)||!integer(t.roleSet,0,c.roleSets.length-1)||JSON.stringify(t.assignments)!==JSON.stringify(positions(c,t.roleSet))||typeof t.discussion!=='boolean'||((c.id==='С-17'||t.size<t.assignments.length)&&!t.discussion)||!(t.resource===null||c.resourceIds.includes(t.resource))||!(t.turn===null||c.turnIds.includes(t.turn))||!t.notes||!['first','observed','retry','consequences','decision','reflection'].every(k=>text(t.notes[k]))||!t.conditions||!['consent','time','swap','written','condition','tool','volunteer'].every(k=>typeof t.conditions[k]==='boolean'))return false;
      if(t.turn){const probe=copy(s);probe.currentRound=ri;probe.currentTeam=ti;probe.rounds[ri].stage=6;if(!eligibleTurns(probe).includes(t.turn))return false;}return true;
    }));
  }
  function restore(raw){if(typeof raw!=='string'||raw.length>4000000)throw new Error('Файл слишком большой или повреждён.');const s=JSON.parse(raw);if(!validate(s))throw new Error('Файл не соответствует текущей версии игры.');s.rounds.forEach(r=>r.running=false);return s;}
  root.PEDAGOG_SESSION={VERSION,DURATIONS,STAGES,by,pick,positions,budget,create,current,setRoles,setCase,resource,eligibleTurns,turn,nextRound,move,stageCopy,validate,restore};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.PEDAGOG_SESSION;
})(globalThis);
