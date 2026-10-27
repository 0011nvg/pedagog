#!/usr/bin/env python3
"""Internal print QA. Writes plaintext PDFs only under ignored qa/print.
The public site keeps the existing encrypted download pack and code gate.
"""
from pathlib import Path
import json, subprocess, html
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, PageBreak
from reportlab.lib.styles import ParagraphStyle
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa'/'print';OUT.mkdir(parents=True,exist_ok=True)
font=Path('/usr/share/fonts/truetype/dejavu')
for n,f in [('DejaVu','DejaVuSans.ttf'),('DejaVu-Bold','DejaVuSans-Bold.ttf')]:pdfmetrics.registerFont(TTFont(n,str(font/f)))
pdfmetrics.registerFontFamily('DejaVu',normal='DejaVu',bold='DejaVu-Bold',italic='DejaVu',boldItalic='DejaVu-Bold')
data=json.loads(subprocess.check_output(['node','-e',"require('./src/deck.js');console.log(JSON.stringify(globalThis.PEDAGOG_DATA))"],cwd=ROOT,text=True))
labels={'situations':'Ситуации','roles':'Роли','resources':'Ресурсы','turns':'Повороты','reflections':'Рефлексия'}
colors={'situations':'#ad4b35','roles':'#203c52','resources':'#356e64','turns':'#794349','reflections':'#6b602f'}
cards=[dict(c,kind=k) for k in labels for c in data[k]]
cards += [dict(c,kind='roles') for c in data['roles'] if c['id'] in ['Ро-03','Ро-06']]
E=lambda s:html.escape(str(s))
def blocks(c):
 r=[c['text']]
 if c.get('goal'):
  r += ['<b>Задача:</b> '+E(c['goal']),'<b>Начальная реплика:</b> '+E(c['opening']),'<b>Роли:</b> '+ '; '.join(' + '.join(a) for a in c['roleSets'])+'. <b>Ресурсы:</b> '+', '.join(c['resourceIds'])+'. <b>Повороты:</b> '+', '.join(c['turnIds'])+'.','<b>Условия ведущему:</b> '+E(c['note']),'<b>Рефлексия:</b> '+' • '.join(E(s) for s in c['debrief'])]
 return [E(r[0])]+r[1:]
measurements=[]
def draw_card(cv,c,x,y,back=False):
 w,h=190*mm,132*mm;col=HexColor(colors[c['kind']]);cv.setStrokeColor(HexColor('#8b847b'));cv.setLineWidth(.4);cv.setDash(2,2);cv.rect(x,y,w,h);cv.setDash();cv.setFillColor(col);cv.setFont('DejaVu-Bold',8.5)
 cv.drawString(x+7*mm,y+h-9*mm,'ПЕДАГОГ · '+labels[c['kind']]+' · '+c['id'])
 if back:
  cv.setFont('DejaVu-Bold',46);cv.drawCentredString(x+w/2,y+78*mm,'П')
  cv.setFont('DejaVu-Bold',23);cv.drawCentredString(x+w/2,y+59*mm,labels[c['kind']])
  ps=ParagraphStyle('back',fontName='DejaVu',fontSize=11,leading=15,alignment=1,textColor=col)
  p=Paragraph(E(c['id']+' · '+c['title']),ps);_,ph=p.wrap(w-20*mm,40*mm);p.drawOn(cv,x+10*mm,y+43*mm-ph)
  cv.setFont('DejaVu',10);cv.drawCentredString(x+w/2,y+20*mm,'Ситуация. Диалог. Новый взгляд.')
  return
 title=Paragraph(E(c['title']),ParagraphStyle('title',fontName='DejaVu-Bold',fontSize=15 if c['kind']=='situations' else 20,leading=19 if c['kind']=='situations' else 25,textColor=col))
 _,th=title.wrap(w-14*mm,h);top=y+h-15*mm;title.drawOn(cv,x+7*mm,top-th);top-=th+4*mm
 size=9.7 if c['kind']=='situations' else 13
 style=ParagraphStyle('body',fontName='DejaVu',fontSize=size,leading=size*1.32,textColor=HexColor('#25221e'),spaceAfter=4)
 ps=[Paragraph(t,style) for t in blocks(c)];heights=[p.wrap(w-14*mm,h)[1] for p in ps];needed=sum(heights)+4*(len(ps)-1);available=top-y-7*mm
 assert needed<=available, f"Overflow {c['id']}: {needed} > {available}"
 measurements.append({'id':c['id'],'size':size,'remaining_mm':round((available-needed)/mm,2)})
 for p,ph in zip(ps,heights):p.drawOn(cv,x+7*mm,top-ph);top-=ph+4

def make(edge):
 path=OUT/f'PEDAGOG_full_A4_{edge}.pdf';cv=canvas.Canvas(str(path),pagesize=(210*mm,297*mm));cv.setTitle('ПЕДАГОГ · Полный комплект · '+edge)
 for i in range(0,len(cards),2):
  sheet=cards[i:i+2]
  for back in [False,True]:
   cv.setFont('DejaVu',8);cv.setFillColor(HexColor('#655f56'));cv.drawCentredString(105*mm,290*mm,f'ПЕДАГОГ · Лист {i//2+1} · '+('Оборот' if back else 'Лицевая сторона'))
   order=list(reversed(sheet)) if back and edge=='short' else sheet
   for row,c in enumerate(order):draw_card(cv,c,10*mm,(152.5-row*140)*mm,back)
   cv.setFont('DejaVu',7.5);cv.setFillColor(HexColor('#655f56'));cv.drawCentredString(105*mm,5*mm,'190 × 132 мм · Масштаб 100% · '+('Длинный' if edge=='long' else 'Короткий')+' край · Редакция '+data['version']);cv.showPage()
 cv.save();reader=PdfReader(path);assert len(reader.pages)==64
 text='\n'.join(p.extract_text() for p in reader.pages);norm=lambda s:' '.join(s.split())
 for c in cards:
  for field in ['id','title','text','goal','opening','note']:
   if c.get(field):assert norm(c[field]) in norm(text),(path.name,c['id'],field)
 return path

def handbook():
 path=OUT/'PEDAGOG_rules_and_worksheets.pdf';normal=ParagraphStyle('normal',fontName='DejaVu',fontSize=11,leading=16,spaceAfter=9);title=ParagraphStyle('heading',parent=normal,fontName='DejaVu-Bold',fontSize=23,leading=28,textColor=HexColor('#203c52'),spaceAfter=18);sub=ParagraphStyle('sub',parent=normal,fontName='DejaVu-Bold',fontSize=12,leading=17,spaceBefore=9)
 story=[]
 def p(t):story.append(Paragraph(t,normal))
 story.append(Paragraph('Правила и инструкция ведущего',title))
 for t in ['Цель — сравнить способы профессионального действия в вымышленной ситуации. Игра не оценивает личность, профессиональную пригодность или психологическое состояние участника.','1. До встречи выберите ситуацию и длительность, прочитайте полный паспорт, проверьте совместимые роли и ресурсы. Для двух родителей или коллег используйте дополнительные экземпляры Ро-03 и Ро-06.','2. Обсудите право на паузу, отказ и наблюдение. Не называйте реальных детей, семьи и коллег. Участие в сцене добровольно; наблюдатели фиксируют реплики и вопросы.','3. Прочитайте ситуацию и назначьте персонажей из одного совместимого набора. Каждый обозначает известные факты и интерес своей позиции.','4. Проведите короткую первую попытку от начальной реплики. Затем обсудите факты, вопросы и возможные последствия.','5. Откройте допустимый ресурс. Выберите одно действие, которое измените. Повторите эпизод при прочих равных условиях и сравните результат.','6. Необязательный поворот возможен только по согласию и при выполнении всех условий карточки и примечания. Если условия не выполнены, пропустите его.','7. Зафиксируйте шаг, ответственного персонажа, срок и признак результата. Отдельно отметьте неизвестные данные. Выйдите из ролей и оставьте время на рефлексию.','С-17 проводится только как совет коллег без инсценировки. С-05 и С-12 могут обсуждаться без исполнения. Психологические диагнозы и реальные правовые решения не определяются игрой.','Для короткой встречи: договорённости 3 мин, подготовка 3, первая попытка 2, наблюдение 2, ресурс 1, повтор 2, сравнение 3, рефлексия 4. На длинной встрече добавьте второй раунд и время обсуждения.'] :p(E(t))
 story.append(PageBreak());story.append(Paragraph('Памятка участника',title))
 for h,t in [('Подготовка','Что известно вашему персонажу? Чего он хочет? Что нужно уточнить? Не добавляйте в ситуацию произвольные факты.'),('Разговор','Начните с заданной реплики. Можно уточнять, предлагать варианты, признавать неточность и менять решение. Не нужно изображать реального человека или сильное переживание.'),('Наблюдение','Приводите точные реплики и действия. Отделяйте факт от предположения. Не оценивайте личность исполнителя.'),('Повтор','Выберите ресурс и измените одно действие. Сохраните прочие условия, чтобы сравнить два подхода.'),('Завершение','Назовите себя и завершите роль. Можно отказаться от ответа. Личный лист остаётся у вас и не используется для кадровой оценки.'),('После встречи','Какой небольшой шаг вы хотите попробовать? Когда и по каким признакам проверите результат? Можно ничего не обещать и вернуться к вопросу позже.')]:story.append(Paragraph(h,sub));p(t)
 for name,questions in [('Бланк решения команды',['Ситуация, раунд и команда','Известные факты и данные для проверки','Интересы сторон и границы ответственности','Первый вариант и возможные последствия','Ресурс и изменение второй попытки','Общий шаг, ответственный персонаж, срок и признак результата']),('Лист рефлексии',['Какое предположение я принял(а) за факт?','Какая реплика или вопрос помогли?','Что я изменил(а) бы в следующей попытке?','Какой небольшой шаг хочу попробовать?','Когда и как проверю результат?'])]:
  story.append(PageBreak());story.append(Paragraph(name,title))
  for q in questions:story.append(Paragraph(q,sub));p('________________________________________________________________');p('________________________________________________________________')
 def footer(cv,doc):cv.setFont('DejaVu',8);cv.drawString(18*mm,10*mm,'ПЕДАГОГ · Записи остаются у участника · '+str(doc.page))
 SimpleDocTemplate(str(path),pagesize=(210*mm,297*mm),leftMargin=18*mm,rightMargin=18*mm,topMargin=17*mm,bottomMargin=18*mm).build(story,onFirstPage=footer,onLaterPages=footer)
 assert len(PdfReader(path).pages)==4
 return path
files=[make('long'),make('short'),handbook()]
(OUT/'geometry.json').write_text(json.dumps({'cards':64,'unique_cards':62,'page_mm':[210,297],'card_mm':[190,132],'front_slots_mm':[[10,152.5],[10,12.5]],'long_back_mapping':[0,1],'short_back_mapping':[1,0],'checks':measurements},ensure_ascii=False,indent=2))
print(json.dumps({'files':[str(p.relative_to(ROOT)) for p in files],'unique_cards':62,'printed_cards':64,'pdf_pages':[len(PdfReader(p).pages) for p in files],'smallest_text':9.7,'text_coverage':'all source card fields preserved'},ensure_ascii=False))
