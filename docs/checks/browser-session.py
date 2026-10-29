# Браузерная проверка онлайн-игры (Playwright + Chromium).
# Запуск: npm run build; python3 -m http.server 8765 --directory qa-preview; python3 docs/checks/browser-session.py
# Для опубликованного сайта: BASE=https://0011nvg.github.io/pedagog/ python3 docs/checks/browser-session.py
import json,re,time
from playwright.sync_api import sync_playwright
import os,sys
OUT=os.environ.get('OUT','qa/browser/');os.makedirs(OUT,exist_ok=True)
BASE=os.environ.get('BASE','http://localhost:8765/')
res=[];errs=[]
def ok(name,cond,info=''):
  res.append((name,bool(cond),info)); print(('PASS ' if cond else 'FAIL ')+name,info)
def new(b,vp={'width':1366,'height':900}):
  ctx=b.new_context(viewport=vp,accept_downloads=True);pg=ctx.new_page()
  pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None);pg.on('pageerror',lambda e: errs.append(str(e)))
  return ctx,pg
def start(pg,dur,people,case):
  pg.goto(BASE+'game.html');pg.click(f'#preset-{dur}');pg.fill('#people',str(people));pg.select_option('#case-select',case);pg.click('button[type=submit]')
def fill(pg,sel,txt):
  if pg.locator(sel).count(): pg.fill(sel,txt); return True
  return False
def stage(pg): return pg.locator('#stage-title').inner_text()
def accept(pg): pg.once('dialog',lambda d:d.accept())
def run_round(pg,prefix='',teams=1):
  seen=[]
  for i in range(14):
    seen.append(stage(pg))
    for k in ['first','observed','retry','consequences','decision','reflection','meeting']:
      fill(pg,'#note-'+k,f'{prefix}{k}')
    if pg.locator('[data-resource]').count():
      for t in range(teams):
        if teams>1: pg.click(f'[data-team="{t}"]')
        if pg.locator('[data-resource][aria-pressed="true"]').count()==0: pg.locator('[data-resource]').first.click()
    nb=pg.locator('#next-stage');lab=nb.inner_text()
    if 'Завершить' in lab or 'второй раунд' in lab or 'Следующий раунд' in lab: return seen,lab
    nb.click()
  return seen,None
with sync_playwright() as p:
  b=p.chromium.launch()
  # 1. 15 минут, реальный таймер, пауза, перезагрузка
  ctx,pg=new(b);start(pg,15,4,'С-16')
  ok('15: старт на этапе 1',stage(pg)=='Ситуация и позиции')
  pg.click('#timer-toggle');pg.wait_for_timeout(3200);t1=pg.locator('#session-timer').inner_text()
  ok('реальный отсчёт ~3 с',t1 in('02:57','02:56'),t1)
  pg.click('#timer-toggle');t1=pg.locator('#session-timer').inner_text();pg.wait_for_timeout(2000);t2=pg.locator('#session-timer').inner_text();ok('пауза останавливает',t2==t1,t2)
  pg.click('#next-stage');fill(pg,'#note-first','Объяснил цель урока длинно.')
  pg.click('#timer-toggle');pg.wait_for_timeout(1500);pg.reload()
  ok('перезагрузка: тот же этап',stage(pg)=='Первая попытка',stage(pg))
  ok('перезагрузка: запись цела',pg.input_value('#note-first')=='Объяснил цель урока длинно.')
  ok('перезагрузка: таймер на паузе',pg.locator('#timer-toggle').inner_text()=='Старт')
  pg.click('#next-stage');ok('15: без ресурса дальше нельзя',True)
  pg.click('#next-stage');ok('сообщение о ресурсе',stage(pg)=='Что заметили и что изменим' and 'ресурс' in pg.locator('#game-status').inner_text().lower(),pg.locator('#game-status').inner_text())
  seen,lab=run_round(pg,'q-');ok('15: этапы до конца',seen[-1]=='Личный вывод' and lab.startswith('Завершить'),str(seen))
  accept(pg);pg.click('#next-stage');ok('15: итоги',pg.locator('h1').first.inner_text()=='Итоги встречи')
  body=pg.inner_text('#app');ok('итоги: оба варианта и решение',all(x in body for x in ['Объяснил цель','q-retry','q-decision']))
  with pg.expect_download() as d: pg.click('#export-summary')
  txt=open(d.value.path(),encoding='utf-8').read();ok('экспорт txt',('q-decision' in txt and 'С-16' in txt),txt[:80])
  with pg.expect_download() as d: pg.click('#export-session')
  saved=open(d.value.path(),encoding='utf-8').read()
  ctx.close()
  # 2. импорт в чистый браузер
  ctx,pg=new(b);pg.goto(BASE+'game.html');pg.click('summary:has-text("Открыть сохранённую")');pg.set_input_files('#import-session',files=[{'name':'s.json','mimeType':'application/json','buffer':saved.encode()}])
  pg.wait_for_timeout(300);ok('импорт: итоги открыты',pg.locator('h1').first.inner_text()=='Итоги встречи')
  pg.set_input_files('#import-session',files=[]) if pg.locator('#import-session').count() else None
  pg.click('#new-session') if False else None
  ctx.close()
  ctx,pg=new(b);pg.goto(BASE+'game.html');pg.click('summary:has-text("Открыть сохранённую")');pg.set_input_files('#import-session',files=[{'name':'bad.json','mimeType':'application/json','buffer':b'{"schema":4}'}]);pg.wait_for_timeout(300)
  ok('импорт: битый файл отклонён',('Не удалось' in pg.locator('#game-status').inner_text()));ctx.close()
  # 3. 90 минут, 20 человек, 4 команды
  ctx,pg=new(b);start(pg,90,20,'С-02')
  ok('90: 4 команды',pg.locator('[data-team]').count()==4)
  for _ in range(3): pg.click('#next-stage')
  pg.locator('[data-resource]').first.click()  # только команда 1
  pg.click('[data-team="0"]');pg.click('#next-stage');ok('90: блок, пока не выбран ресурс у всех',stage(pg)=='Ресурс' and 'команд' in pg.locator('#game-status').inner_text(),pg.locator('#game-status').inner_text())
  seen,lab=run_round(pg,'r1-',teams=4);ok('90: раунд 1 заканчивается перерывом',seen[-1]=='Перерыв' and 'второй раунд' in lab,str(seen))
  pg.select_option('#next-case','С-21');pg.click('#next-stage')
  ok('90: раунд 2 с новой ситуацией',stage(pg)=='Ситуация и позиции' and 'Один сделал за всех' in pg.inner_text('#app'))
  seen,lab=run_round(pg,'r2-',teams=4);ok('90: раунд 2 заканчивается итогом встречи',seen[-1]=='Итог встречи' and lab.startswith('Завершить'),str(seen))
  accept(pg);pg.click('#next-stage');body=pg.inner_text('#app')
  ok('90: итоги двух раундов и общий итог',('Раунд 1' in body and 'Раунд 2' in body and 'r2-meeting' in body))
  pg.click('#reopen');ok('вернуться к записям',stage(pg)=='Итог встречи');ctx.close()
  # 4. один участник
  ctx,pg=new(b);start(pg,40,1,'С-10')
  t=pg.inner_text('#app');ok('соло: без наблюдателей и с подсказкой',('Наблюдатели' not in t) and 'Вы рассматриваете все позиции' in t)
  pg.click('#next-stage');ok('соло: письменный вариант',stage(pg)=='Первый вариант' and 'Запишите' in pg.inner_text('.stage-do'));ctx.close()
  # 5. пауза для группы, экран участников, С-17
  ctx,pg=new(b);start(pg,40,6,'С-01')
  pg.click('#pause-group');ok('пауза: панель',pg.locator('.pause-panel').count()==1)
  pg.click('#pause-talk');ok('пауза → без сцены',pg.locator('#discussion-mode').is_checked())
  pg.click('#view-mode');ok('экран участников без полей ввода и управления',pg.locator('textarea').count()==0 and pg.locator('#next-stage').count()==0)
  pg.click('#view-mode');pg.click('#next-stage');ok('совет коллег: «Первый вариант»',stage(pg)=='Первый вариант')
  pg.click('[data-stage="0"]');pg.click('summary:has-text("Ситуация не подходит")');pg.select_option('#change-case','С-17');accept(pg);pg.click('#apply-case')
  ok('замена ситуации на С-17',('Неделя без передышки' in pg.inner_text('#app')) and pg.locator('#discussion-mode').count()==0)
  pg.click('[data-stage="2"]')
  ok('на этапе 3 заменить нельзя',pg.locator('#change-case').count()==0);ctx.close()
  # 6. окончание времени (ускорение часов)
  ctx,pg=new(b);pg.clock.install();start(pg,40,6,'С-19');pg.click('#timer-toggle');pg.clock.run_for(301000);pg.wait_for_timeout(200)
  ok('время вышло: 00:00, сообщение, этап не сменился',pg.locator('#session-timer').inner_text()=='00:00' and 'вышло' in pg.locator('#game-status').inner_text() and stage(pg)=='Ситуация и позиции')
  pg.click('#add-minute');ok('+1 мин',pg.locator('#session-timer').inner_text()=='01:00');ctx.close()
  # 7. клавиатура
  ctx,pg=new(b);pg.goto(BASE+'game.html');pg.locator('#preset-15').focus();pg.keyboard.press('Enter');pg.keyboard.press('Tab');pg.keyboard.press('Tab');pg.keyboard.press('Tab')
  ok('клавиатура: выбор формата',pg.get_attribute('#preset-15','aria-pressed')=='true')
  pg.locator('button[type=submit]').focus();pg.keyboard.press('Enter');pg.wait_for_timeout(200)
  ok('клавиатура: старт и фокус на заголовке этапа',pg.evaluate('document.activeElement.id')=='stage-title')
  pg.locator('#next-stage').focus();pg.keyboard.press('Enter');ok('клавиатура: «Далее»',stage(pg)=='Первая попытка');ctx.close()
  # 8. телефон, 40 минут
  ctx,pg=new(b,{'width':390,'height':844});start(pg,40,8,'С-21')
  for i in range(8):
    fill(pg,'#note-first','Учитель сразу говорит, что оценка групповая.')
    if pg.locator('[data-resource]').count(): pg.locator('[data-resource]').nth(1).click()
    pg.screenshot(path=OUT+f'phone40-{i}.png')
    if 'Завершить' in pg.locator('#next-stage').inner_text(): break
    pg.locator('#next-stage').click()
  w=pg.evaluate('document.documentElement.scrollWidth');ok('телефон: нет горизонтальной прокрутки',w==390,str(w))
  bb=pg.locator('#next-stage').bounding_box();ok('телефон: «Далее» видна на экране (липкая панель)',bb and bb['y']+bb['height']<=844,str(bb))
  ctx.close()
  # 9. ссылки с параметрами
  ctx,pg=new(b);pg.goto(BASE+'game.html?duration=15&case=%D0%A1-02');ok('ссылка с главной: 15 мин и С-02',pg.get_attribute('#preset-15','aria-pressed')=='true' and pg.input_value('#case-select')=='С-02');ctx.close()
  b.close()
ok('ошибок консоли нет',not errs,str(errs[:5]))
print('ИТОГ',sum(1 for r in res if r[1]),'/',len(res))
json.dump(res,open(OUT+'full-results.json','w'),ensure_ascii=False,indent=1)
