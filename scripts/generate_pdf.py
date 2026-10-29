#!/usr/bin/env python3
"""ПЕДАГОГ · печатный комплект (редакция колоды 3.0) для внутренней проверки.

Пишет PDF только в игнорируемую папку qa/print/. Публичный сайт по-прежнему отдаёт
готовые файлы прежней редакции только после ввода кода (print-pack.js) — этот скрипт
его не трогает и не публикует незашифрованные файлы.

Колода берётся из src/deck.js, регламент — из platform/engine.js (через node vm),
чтобы печать и онлайн-игра не расходились.
"""
from pathlib import Path
import json, subprocess, html, re
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (Paragraph, SimpleDocTemplate, Spacer, PageBreak, Table,
                                TableStyle, KeepTogether, ListFlowable, ListItem)
from reportlab.lib.styles import ParagraphStyle
from pypdf import PdfReader
import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'qa' / 'print'
OUT.mkdir(parents=True, exist_ok=True)
A4 = (210 * mm, 297 * mm)
SAFE = 8 * mm  # все символы должны лежать не ближе 8 мм к краю листа


def find_font(name):
    try:
        out = subprocess.check_output(['fc-list', '-f', '%{file}\n'], text=True)
        for line in out.splitlines():
            if line.endswith('/' + name):
                return line
    except Exception:
        pass
    p = Path('/usr/share/fonts/truetype/dejavu') / name
    if p.exists():
        return str(p)
    raise SystemExit(f'Не найден шрифт {name}: установите fonts-dejavu-core')


for n, f in [('DejaVu', 'DejaVuSans.ttf'), ('DejaVu-Bold', 'DejaVuSans-Bold.ttf'),
             ('DejaVu-Oblique', 'DejaVuSans-Oblique.ttf'), ('DejaVu-BoldOblique', 'DejaVuSans-BoldOblique.ttf')]:
    pdfmetrics.registerFont(TTFont(n, find_font(f)))
pdfmetrics.registerFontFamily('DejaVu', normal='DejaVu', bold='DejaVu-Bold', italic='DejaVu-Oblique',
                              boldItalic='DejaVu-BoldOblique')

LOADER = r"""
const fs=require('fs'),vm=require('vm'),ctx={};vm.createContext(ctx);
for(const f of ['src/deck.js','platform/engine.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);
const S=ctx.PEDAGOG_SESSION;
console.log(JSON.stringify({data:ctx.PEDAGOG_DATA,formats:S.FORMATS,stages:S.STAGES}));
"""
model = json.loads(subprocess.check_output(['node', '-e', LOADER], cwd=ROOT, text=True))
data, FORMATS, STAGES = model['data'], model['formats'], model['stages']
assert set(FORMATS) == {'15', '40', '90'}, FORMATS.keys()

labels = {'situations': 'Ситуации', 'roles': 'Роли', 'resources': 'Ресурсы', 'turns': 'Повороты',
          'reflections': 'Рефлексия'}
colors = {'situations': '#ad4b35', 'roles': '#203c52', 'resources': '#356e64', 'turns': '#794349',
          'reflections': '#6b602f'}
INK, MUTED, PAPER = HexColor('#25221e'), HexColor('#61594f'), HexColor('#f7f4ef')
EXTRA = {'Ро-03': 1, 'Ро-06': 1, 'Ро-08': 1, 'Ро-09': 3}
E = lambda s: html.escape(str(s), quote=False)

unique = [dict(c, kind=k) for k in labels for c in data[k]]
assert len(unique) == 64, len(unique)
cards = []
for c in unique:
    cards.append(c)
    cards += [c] * EXTRA.get(c['id'], 0)  # дополнительные экземпляры идут сразу за оригиналом

# ---------------------------------------------------------------- геометрия карточек
CARD_W, CARD_H = 190 * mm, 132 * mm
SLOT_X = 10 * mm
SLOT_Y = [152.5 * mm, 12.5 * mm]  # 0 — верхняя позиция, 1 — нижняя (нижний левый угол)
PAD = 7 * mm
assert abs(SLOT_X * 2 + CARD_W - A4[0]) < .01 and abs(SLOT_Y[1] * 2 + 2 * CARD_H + 8 * mm - A4[1]) < .01


def back_slot(slot, edge):
    """A4 portrait, одна колонка: длинный край зеркалит по X (колонка одна и центрована — позиция та же),
    короткий край меняет ряды местами."""
    return slot if edge == 'long' else 1 - slot


def seat_roles(c, i):
    out = []
    for s in c['roleSets']:
        if i < len(s) and s[i] not in out:
            out.append(s[i])
    return out


def sets_line(c):
    sets = c['roleSets']
    line = '; '.join((f'{i + 1}) ' if len(sets) > 1 else '') + ' + '.join(s) for i, s in enumerate(sets))
    if any(len(s) < len(c['seats']) for s in sets):
        line += '. Если ролей меньше, чем мест, свободное место озвучивает ведущий'
    return line


def situation_blocks(c):
    """[(kind, markup)]; kind 'seat' рисуется на подложке."""
    b = [('p', E(c['text'])),
         ('p', '<b>Начальная реплика:</b> ' + E(c['opening'])),
         ('p', '<b>Дилемма:</b> ' + E(c['dilemma'])),
         ('p', '<b>Что нужно получить:</b> ' + E(c['goal']))]
    for i, s in enumerate(c['seats']):
        roles = seat_roles(c, i)
        r = f' <font color="#61594f">({" / ".join(roles)})</font>' if roles else ''
        b.append(('seat', f'<b>{i + 1}. {E(s["who"])}</b>{r} {E(s["brief"])} <i>Вопрос: {E(s["ask"])}</i>'))
    b += [('p', '<b>Составы:</b> ' + E(sets_line(c)) + '. <b>Ресурсы:</b> ' + ', '.join(c['resourceIds'])
           + '. <b>Повороты:</b> ' + ', '.join(c['turnIds']) + '.'),
          ('p', '<b>Ведущему:</b> ' + E(c['note'])),
          ('p', '<b>Вопросы разбора:</b> ' + ' '.join(f'{i + 1}) {E(q)}' for i, q in enumerate(c['debrief'])))]
    return b


card_metrics = {}


def layout_card(c):
    """Подбирает самый крупный кегль (не меньше 9 pt), при котором текст помещается целиком."""
    col = HexColor(colors[c['kind']])
    inner_w = CARD_W - 2 * PAD
    sit = c['kind'] == 'situations'
    tsize = 14 if sit else 20
    title = Paragraph(E(c['title']), ParagraphStyle('t', fontName='DejaVu-Bold', fontSize=tsize,
                                                    leading=tsize * 1.2, textColor=col))
    _, th = title.wrap(inner_w, CARD_H)
    top_gap = 12 * mm  # строка категории
    avail = CARD_H - top_gap - th - (2.5 if sit else 6) * mm - 6 * mm
    sizes = [x / 10 for x in range(105, 89, -1)] if sit else [14, 13.5, 13, 12.5, 12]
    blocks = situation_blocks(c) if sit else [('p', E(c['text']))]
    for size in sizes:
        lead = size * (1.27 if sit else 1.4)
        gap = 1.5 * mm if sit else 3 * mm
        ps, need = [], 0
        for kind, t in blocks:
            st = ParagraphStyle('b', fontName='DejaVu', fontSize=size, leading=lead, textColor=INK,
                                leftIndent=(2.5 * mm if kind == 'seat' else 0))
            p = Paragraph(t, st)
            h = p.wrap(inner_w - (2.5 * mm if kind == 'seat' else 0), CARD_H)[1]
            ps.append((kind, p, h))
            need += h + (0.8 * mm if kind == 'seat' else gap)
        need += (0.7 * mm + gap) if sit else 0  # поля подложки мест (см. draw_front)
        if need <= avail:
            card_metrics[c['id']] = {'body_pt': size, 'title_pt': tsize, 'free_mm': round((avail - need) / mm, 1)}
            return title, th, ps, size, gap
    raise AssertionError(f'Текст карточки {c["id"]} не помещается даже при 9 pt')


def crop_marks(cv, x, y):
    cv.setStrokeColor(HexColor('#8b847b'))
    cv.setLineWidth(.3)
    for cx, cy, dx, dy in [(x, y, -1, -1), (x + CARD_W, y, 1, -1), (x, y + CARD_H, -1, 1), (x + CARD_W, y + CARD_H, 1, 1)]:
        cv.line(cx + dx * 1.5 * mm, cy, cx + dx * 5 * mm, cy)
        cv.line(cx, cy + dy * 1.5 * mm, cx, cy + dy * 3 * mm)


def frame(cv, x, y):
    cv.setStrokeColor(HexColor('#8b847b'))
    cv.setLineWidth(.4)
    cv.setDash(2, 2)
    cv.rect(x, y, CARD_W, CARD_H)
    cv.setDash()
    crop_marks(cv, x, y)


def draw_front(cv, c, x, y):
    col = HexColor(colors[c['kind']])
    frame(cv, x, y)
    cv.setFillColor(col)
    cv.setFont('DejaVu-Bold', 9)
    cv.drawString(x + PAD, y + CARD_H - 8 * mm, 'ПЕДАГОГ · ' + labels[c['kind']] + ' · ' + c['id'])
    title, th, ps, size, gap = layout_card(c)
    top = y + CARD_H - 12 * mm
    title.drawOn(cv, x + PAD, top - th)
    top -= th + (2.5 if c['kind'] == 'situations' else 6) * mm
    seats = [i for i, (k, _, _) in enumerate(ps) if k == 'seat']
    for i, (kind, p, h) in enumerate(ps):
        if seats and i == seats[0]:
            hh = sum(ps[j][2] + .8 * mm for j in seats) + 1.5 * mm
            cv.setFillColor(PAPER)
            cv.rect(x + PAD, top - hh, CARD_W - 2 * PAD, hh, stroke=0, fill=1)
            cv.setFillColor(col)
            cv.rect(x + PAD, top - hh, .8 * mm, hh, stroke=0, fill=1)
            top -= .75 * mm
        p.drawOn(cv, x + PAD + (2.5 * mm if kind == 'seat' else 0), top - h)
        top -= h + (.8 * mm if kind == 'seat' else gap)
        if seats and i == seats[-1]:
            top -= .75 * mm + gap - .8 * mm
    assert top >= y + 6 * mm - .01, (c['id'], (top - y) / mm)  # нижнее поле карточки не меньше 6 мм


def draw_back(cv, c, x, y):
    col = HexColor(colors[c['kind']])
    frame(cv, x, y)
    cv.setFillColor(HexColor('#faf8f4'))
    cv.rect(x + .3 * mm, y + .3 * mm, CARD_W - .6 * mm, CARD_H - .6 * mm, stroke=0, fill=1)
    cv.setFillColor(col)
    cv.setFont('DejaVu-Bold', 9)
    cv.drawString(x + PAD, y + CARD_H - 8 * mm, 'ПЕДАГОГ · ' + labels[c['kind']] + ' · ' + c['id'])
    cv.setFont('DejaVu-Bold', 46)
    cv.drawCentredString(x + CARD_W / 2, y + 80 * mm, 'П')
    cv.setFont('DejaVu-Bold', 24)
    cv.drawCentredString(x + CARD_W / 2, y + 62 * mm, labels[c['kind']])
    p = Paragraph(E(c['id'] + ' · ' + c['title']),
                  ParagraphStyle('bk', fontName='DejaVu', fontSize=12, leading=16, alignment=1, textColor=col))
    _, ph = p.wrap(CARD_W - 20 * mm, 40 * mm)
    p.drawOn(cv, x + 10 * mm, y + 50 * mm - ph)
    cv.setFont('DejaVu', 10)
    cv.drawCentredString(x + CARD_W / 2, y + 18 * mm, 'Ситуация. Диалог. Новый взгляд.')


def draw_test(cv, n, x, y, back, edge):
    frame(cv, x, y)
    cv.setFillColor(HexColor('#203c52'))
    cv.setFont('DejaVu-Bold', 9)
    cv.drawString(x + PAD, y + CARD_H - 8 * mm, f'ПЕДАГОГ · Пробный лист · ТЕСТ-{n}')
    cv.setFont('DejaVu-Bold', 90)
    cv.drawCentredString(x + CARD_W / 2, y + 52 * mm, str(n))
    cv.setFont('DejaVu-Bold', 14)
    cv.drawCentredString(x + CARD_W / 2, y + 38 * mm, f'Позиция {n} · {"оборот" if back else "лицевая сторона"}')
    p = Paragraph(('Цифра на обороте совпадает с цифрой на лицевой стороне — переворот выбран верно. '
                   'Посмотрите лист на просвет: рамки должны совпасть с точностью 1–2 мм.') if back else
                  (f'Печать: масштаб 100% («Фактический размер»), двусторонняя, переворот по '
                   f'{"длинному" if edge == "long" else "короткому"} краю. Затем посмотрите на оборот.'),
                  ParagraphStyle('tp', fontName='DejaVu', fontSize=10.5, leading=14, alignment=1, textColor=INK))
    _, ph = p.wrap(CARD_W - 30 * mm, 30 * mm)
    p.drawOn(cv, x + 15 * mm, y + 30 * mm - ph)
    # перекрестие в центре карточки — для проверки на просвет
    cv.setStrokeColor(HexColor('#ad4b35'))
    cv.setLineWidth(.4)
    cx, cy = x + CARD_W / 2, y + CARD_H - 22 * mm
    cv.line(cx - 6 * mm, cy, cx + 6 * mm, cy)
    cv.line(cx, cy - 6 * mm, cx, cy + 6 * mm)


def sheet_text(cv, text, top=True):
    # служебная строка листа (не текст карточки): 7 pt в 4,5-мм полосе между рамкой и безопасным полем 8 мм
    cv.setFont('DejaVu', 7)
    cv.setFillColor(HexColor('#655f56'))
    cv.drawCentredString(A4[0] / 2, (286.4 if top else 9.4) * mm, text)


def make_cards(edge):
    path = OUT / f'cards-{edge}-edge.pdf'
    cv = canvas.Canvas(str(path), pagesize=A4, initialFontName='DejaVu', initialFontSize=10)
    cv.setTitle('ПЕДАГОГ · Карточки · переворот по ' + ('длинному' if edge == 'long' else 'короткому') + ' краю')
    cv.setAuthor('ПЕДАГОГ · В. Г. Науменко')
    edge_ru = 'длинный край' if edge == 'long' else 'короткий край'
    layout = []  # [(sheet, back, [ids by slot])]
    # пробный лист
    for back in (False, True):
        sheet_text(cv, f'ПЕДАГОГ · ПРОБНЫЙ ЛИСТ · {"Оборот" if back else "Лицевая сторона"} · {edge_ru}')
        ids = [None, None]
        for slot, n in enumerate((1, 2)):
            s = back_slot(slot, edge) if back else slot
            draw_test(cv, n, SLOT_X, SLOT_Y[s], back, edge)
            ids[s] = f'ТЕСТ-{n}'
        layout.append((0, back, ids))
        sheet_text(cv, '190 × 132 мм · Масштаб 100% · ' + edge_ru + ' · напечатайте этот лист первым', top=False)
        cv.showPage()
    for i in range(0, len(cards), 2):
        pair = cards[i:i + 2] + [None] * (2 - len(cards[i:i + 2]))
        sheet = i // 2 + 1
        for back in (False, True):
            sheet_text(cv, f'ПЕДАГОГ · Лист {sheet} · {"Оборот" if back else "Лицевая сторона"} · {edge_ru}')
            ids = [None, None]
            for slot, c in enumerate(pair):
                if not c:
                    continue
                s = back_slot(slot, edge) if back else slot
                (draw_back if back else draw_front)(cv, c, SLOT_X, SLOT_Y[s])
                ids[s] = c['id']
            layout.append((sheet, back, ids))
            sheet_text(cv, f'190 × 132 мм · Масштаб 100% · {edge_ru} · Редакция {data["version"]}', top=False)
            cv.showPage()
    cv.save()
    return path, layout


# ---------------------------------------------------------------- проверки PDF
def norm(s):
    return re.sub(r'\s+', '', s)


def check_page_size_and_margins(path):
    out = {'pages': 0, 'a4': True, 'outside_safe_area': []}
    with pdfplumber.open(path) as pdf:
        out['pages'] = len(pdf.pages)
        for n, page in enumerate(pdf.pages, 1):
            if abs(page.width - A4[0]) > .01 or abs(page.height - A4[1]) > .01:
                out['a4'] = False
            for ch in page.chars:
                if ch['text'].isspace():
                    continue
                if ch['x0'] < SAFE - .01 or ch['x1'] > page.width - SAFE + .01 or ch['top'] < SAFE - .01 or ch['bottom'] > page.height - SAFE + .01:
                    out['outside_safe_area'].append({'page': n, 'char': ch['text'], 'x0': round(ch['x0'] / mm, 1),
                                                     'top': round(ch['top'] / mm, 1)})
    return out


def card_texts(c):
    t = [c['id'], c['title'], c['text']]
    if c['kind'] == 'situations':
        t += [c['opening'], c['dilemma'], c['goal'], c['note'], *c['debrief']]
        for s in c['seats']:
            t += [s['who'], s['brief'], s['ask']]
        t += c['resourceIds'] + c['turnIds'] + [r for s in c['roleSets'] for r in s]
    return t


def check_cards(path, layout, edge):
    res = check_page_size_and_margins(path)
    res['expected_pages'] = 2 + 2 * ((len(cards) + 1) // 2)
    assert res['a4'] and res['pages'] == res['expected_pages'], (path.name, res['pages'])
    assert not res['outside_safe_area'], res['outside_safe_area'][:5]
    missing, order, inside = [], [], []
    slot_top = {0: A4[1] - SLOT_Y[0] - CARD_H, 1: A4[1] - SLOT_Y[1] - CARD_H}  # pdfplumber top
    with pdfplumber.open(path) as pdf:
        for n, page in enumerate(pdf.pages):
            sheet, back, ids = layout[n]
            # где фактически стоит каждая карточка: по строке категории «ПЕДАГОГ · … · ID»
            found = [None, None]
            for slot in (0, 1):
                region = page.crop((SLOT_X, slot_top[slot], SLOT_X + CARD_W, slot_top[slot] + 12 * mm))
                txt = region.extract_text() or ''
                m = re.search(r'·\s*((?:С|Ро|Р|К|М)-\d\d|ТЕСТ-\d)\s*$', txt.split('\n')[0]) if txt else None
                found[slot] = m.group(1) if m else None
            if found != ids:
                order.append({'page': n + 1, 'expected': ids, 'found': found})
            # все символы карточек — внутри рамок (кроме колонтитулов листа)
            for ch in page.chars:
                if ch['text'].isspace() or ch['top'] < 12 * mm or ch['bottom'] > A4[1] - 12 * mm:
                    continue
                ok = any(SLOT_X + 1 * mm <= ch['x0'] and ch['x1'] <= SLOT_X + CARD_W - 1 * mm and
                         slot_top[s] + 1 * mm <= ch['top'] and ch['bottom'] <= slot_top[s] + CARD_H - 1 * mm
                         for s in (0, 1))
                if not ok:
                    inside.append({'page': n + 1, 'char': ch['text']})
            if not back and sheet > 0:
                full = norm(page.extract_text() or '')
                for slot in (0, 1):
                    cid = ids[slot]
                    if not cid:
                        continue
                    region = norm(page.crop((SLOT_X, slot_top[slot], SLOT_X + CARD_W, slot_top[slot] + CARD_H)).extract_text() or '')
                    c = next(x for x in unique if x['id'] == cid)
                    for t in card_texts(c):
                        if norm(t) not in region:
                            missing.append({'page': n + 1, 'card': cid, 'text': t[:60]})
        # пары лицо/оборот: для каждой позиции лица оборот стоит в отражённой позиции
        pairs = []
        for k in range(0, len(layout), 2):
            f, b = layout[k], layout[k + 1]
            for slot in (0, 1):
                if f[2][slot] and b[2][back_slot(slot, edge)] != f[2][slot]:
                    pairs.append({'sheet': f[0], 'slot': slot})
    res.update({'card_text_missing': missing, 'slot_mismatch': order, 'chars_outside_card_frames': inside[:20],
                'back_pairs_mismatch': pairs})
    assert not missing, missing[:5]
    assert not order, order[:5]
    assert not inside, inside[:5]
    assert not pairs, pairs
    printed = [i for _, b, ids in layout[2:] if not b for i in ids if i]
    res['cards_printed'] = len(printed)
    res['extra_copies'] = {k: printed.count(k) - 1 for k in EXTRA}
    assert res['cards_printed'] == 70 and len(set(printed)) == 64
    return res


# ---------------------------------------------------------------- документы A4
ST = {
    'h1': ParagraphStyle('h1', fontName='DejaVu-Bold', fontSize=21, leading=26, textColor=HexColor('#203c52'), spaceAfter=3 * mm),
    'h2': ParagraphStyle('h2', fontName='DejaVu-Bold', fontSize=13.5, leading=17, textColor=HexColor('#203c52'), spaceBefore=4 * mm, spaceAfter=1.5 * mm),
    'lead': ParagraphStyle('lead', fontName='DejaVu', fontSize=11.5, leading=16, textColor=INK, spaceAfter=2 * mm),
    'p': ParagraphStyle('p', fontName='DejaVu', fontSize=10.5, leading=14.5, textColor=INK, spaceAfter=1.8 * mm),
    'cell': ParagraphStyle('cell', fontName='DejaVu', fontSize=10, leading=13, textColor=INK),
    'cellb': ParagraphStyle('cellb', fontName='DejaVu-Bold', fontSize=10, leading=13, textColor=INK),
    'small': ParagraphStyle('small', fontName='DejaVu', fontSize=9.5, leading=13, textColor=MUTED, spaceAfter=1.5 * mm),
}
SAFETY = ('Сведения о насилии, жестоком обращении, угрозе жизни или здоровью ребёнка — не тема для игры. '
          'Остановите игру. Не расспрашивайте о подробностях в группе. Действуйте по установленному в школе '
          'порядку: сообщите администрации или ответственному специалисту; при непосредственной угрозе звоните 112.')
STAGE_ORDER = ['situation', 'first', 'quickResource', 'observe', 'resource', 'retry', 'compare', 'quickDecision',
               'decision', 'reflect', 'break', 'summary']


def P(t, s='p'):
    return Paragraph(t, ST[s])


def bullets(items, style='p'):
    return ListFlowable([ListItem(P(t, style), leftIndent=5 * mm, value='•') for t in items],
                        bulletType='bullet', start='•', leftIndent=5 * mm, bulletFontName='DejaVu', bulletFontSize=10)


def numbered(items, style='p'):
    return ListFlowable([ListItem(P(t, style), leftIndent=6 * mm) for t in items], bulletType='1',
                        leftIndent=6 * mm, bulletFontName='DejaVu-Bold', bulletFontSize=10.5, bulletFormat='%s.')


def minutes(d, r, key):
    rounds = FORMATS[d]['rounds']
    if r >= len(rounds):
        return None
    for k, m in rounds[r]:
        if k == key:
            return m
    return None


def schedule_rows():
    rows = []
    for k in STAGE_ORDER:
        m15, m40 = minutes('15', 0, k), minutes('40', 0, k)
        a, b = minutes('90', 0, k), minutes('90', 1, k)
        m90 = f'{a} + {b}' if a is not None and b is not None else (
            f'{a} (после 1-го раунда)' if a is not None else (f'{b} (в конце)' if b is not None else None))
        if any(v is not None for v in (m15, m40, m90)):
            rows.append((k, STAGES[k]['title'], m15, m40, m90))
    return rows


def total(d):
    return sum(m for r in FORMATS[d]['rounds'] for _, m in r)


def table(rows, widths, header=True, zebra=True):
    t = Table(rows, colWidths=widths, repeatRows=1 if header else 0)
    style = [('FONTNAME', (0, 0), (-1, -1), 'DejaVu'), ('FONTSIZE', (0, 0), (-1, -1), 10),
             ('GRID', (0, 0), (-1, -1), .4, HexColor('#c8cec8')), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
             ('TOPPADDING', (0, 0), (-1, -1), 3), ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
             ('LEFTPADDING', (0, 0), (-1, -1), 5), ('RIGHTPADDING', (0, 0), (-1, -1), 5)]
    if header:
        style += [('BACKGROUND', (0, 0), (-1, 0), HexColor('#e5eee8')), ('FONTNAME', (0, 0), (-1, 0), 'DejaVu-Bold')]
    t.setStyle(TableStyle(style))
    return t


def footer_factory(title):
    def footer(cv, doc):
        cv.saveState()
        cv.setFont('DejaVu', 8.5)
        cv.setFillColor(MUTED)
        cv.drawString(18 * mm, 11 * mm, f'ПЕДАГОГ · {title} · редакция колоды {data["version"]}')
        cv.drawRightString(A4[0] - 18 * mm, 11 * mm, str(doc.page))
        cv.restoreState()
    return footer


def build_doc(path, story, title, top=16 * mm, bottom=18 * mm):
    doc = SimpleDocTemplate(str(path), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=top,
                            bottomMargin=bottom, title='ПЕДАГОГ · ' + title, author='ПЕДАГОГ · В. Г. Науменко')
    f = footer_factory(title)
    doc.build(story, onFirstPage=f, onLaterPages=f, canvasmaker=lambda *a, **k: canvas.Canvas(*a, **dict(k, initialFontName='DejaVu', initialFontSize=10)))
    return path


def host_guide():
    s = []
    s.append(P('Руководство ведущего', 'h1'))
    s.append(P('«ПЕДАГОГ» — деловая игра для педагогических коллективов. Группа разбирает вымышленную школьную '
               'ситуацию: участники пробуют действие, меняют его с помощью карточки ресурса и сравнивают '
               'последствия двух вариантов. Единственно правильного ответа нет. Игра не оценивает людей и не '
               'используется для аттестации или кадровых решений.', 'lead'))
    s.append(P('Что в комплекте', 'h2'))
    s.append(bullets([
        f'<b>Ситуации</b> ({len(data["situations"])}): текст, начальная реплика, дилемма, что нужно получить, места '
        'персонажей с вопросом к каждому, подходящие составы ролей, ресурсы и повороты, заметка «Ведущему» и три вопроса разбора.',
        f'<b>Роли</b> ({len(data["roles"])}), включая Ро-09 «Наблюдатель» — для тех, кто не в сцене. '
        'Дополнительно напечатаны: Ро-03 (С-14, два родителя), Ро-06 (С-03 и С-20, два учителя), Ро-08 (С-21, два ученика) и ещё три Ро-09.',
        f'<b>Ресурсы</b> ({len(data["resources"])}) — способы изменить вторую попытку; '
        f'<b>повороты</b> ({len(data["turns"])}) — проверка решения; <b>рефлексия</b> ({len(data["reflections"])}) — вопросы на выход.',
        'Памятка участника, бланк результатов (по одному на команду) и это руководство.']))
    s.append(P('Подготовка', 'h2'))
    s.append(numbered([
        'Выберите формат (15, 40 или 90 минут) и ситуацию. Для первого знакомства подойдёт ситуация уровня «Базовый».',
        'Прочитайте карточку ситуации целиком, особенно строку «Ведущему»: там ограничения и подсказки.',
        'Выберите <b>один</b> состав ролей из строки «Составы». Номер в составе соответствует номеру места на карточке. '
        'Если карточек в составе меньше, чем мест, реплики свободного места читает ведущий.',
        'Разложите карточки ресурсов, перечисленные на карточке ситуации. Повороты держите у себя: они нужны на этапе сравнения в форматах 40 и 90 минут.',
        'Подготовьте памятки участникам, бланк результатов на каждую команду, карточки Ро-09 для наблюдателей и таймер.']))
    s.append(P('Открытие встречи (1 минута, входит в первый этап)', 'h2'))
    s.append(P('«Сегодня мы разберём вымышленный школьный случай и попробуем два способа действовать. Мы оцениваем '
               'действия, а не людей. Можно наблюдать вместо участия, попросить паузу, поменяться ролью или пропустить '
               'вопрос — без объяснений. Реальных детей, семьи и коллег не называем».'))
    # ---- расписание
    s.append(PageBreak())
    s.append(P('Расписание этапов', 'h1'))
    s.append(P('Минуты для каждого формата взяты из онлайн-игры на сайте: печатный и онлайн-регламент совпадают. '
               'В формате 90 минут два полных раунда по разным ситуациям: первое число — раунд 1, второе — раунд 2.', 'lead'))
    rows = [['Этап', '15 мин', '40 мин', '90 мин']]
    for _, title, m15, m40, m90 in schedule_rows():
        rows.append([P(E(title), 'cell')] + ['—' if v is None else str(v) for v in (m15, m40, m90)])
    rows.append([P('<b>Итого, минут</b>', 'cell'), str(total('15')), str(total('40')), str(total('90'))])
    t = table(rows, [72 * mm, 24 * mm, 24 * mm, 54 * mm])
    t.setStyle(TableStyle([('FONTNAME', (0, -1), (-1, -1), 'DejaVu-Bold'), ('BACKGROUND', (0, -1), (-1, -1), HexColor('#f3efe8'))]))
    s.append(t)
    s.append(Spacer(1, 3 * mm))
    frows = [['Формат', 'Для кого', 'Что происходит']]
    for d in ('15', '40', '90'):
        f = FORMATS[d]
        frows.append([P(f'<b>{d} мин</b><br/>{E(f["title"])}', 'cell'), P(E(f['people']), 'cell'), P(E(f['lead']), 'cell')])
    s.append(table(frows, [36 * mm, 50 * mm, 88 * mm]))
    s.append(P('Порядок этапов в каждом формате', 'h2'))
    for d in ('15', '40', '90'):
        rounds = FORMATS[d]['rounds']
        parts = []
        for ri, r in enumerate(rounds):
            seq = ' → '.join(f'{E(STAGES[k]["title"])} {m}' for k, m in r)
            parts.append((f'Раунд {ri + 1}: ' if len(rounds) > 1 else '') + seq)
        s.append(P(f'<b>{d} мин.</b> ' + '<br/>'.join(parts), 'p'))
    s.append(P('Таймер — ориентир, а не приговор. Если этап затянулся, сократите обсуждение, но сохраните личный вывод: '
               'без него игра превращается в спор о правильном ответе.', 'small'))
    # ---- что говорить
    s.append(PageBreak())
    s.append(P('Что говорить на каждом этапе', 'h1'))
    s.append(P('Текст «Что делать» можно читать группе дословно. «Итог» — признак того, что этап выполнен и можно идти дальше.', 'lead'))
    for k, title, m15, m40, m90 in schedule_rows():
        st = STAGES[k]
        where = ', '.join(x for x in [f'15 мин: {m15}' if m15 is not None else '', f'40 мин: {m40}' if m40 is not None else '',
                                       f'90 мин: {m90}' if m90 is not None else ''] if x)
        s.append(KeepTogether([
            P(f'{E(title)} <font size="9.5" color="#61594f">· {E(where)}</font>', 'h2'),
            P(f'<b>Что делать:</b> {E(st["do"])}'),
            P(f'<b>Кто:</b> {E(st["who"])}. <b>Итог:</b> {E(st["result"])}')]))
    # ---- безопасность и большие группы
    s.append(PageBreak())
    s.append(P('Безопасность', 'h1'))
    s.append(bullets([
        'Участие добровольное. Право наблюдать, взять паузу, поменяться ролью или пропустить вопрос действует всю встречу.',
        'Роль — не человек. В конце раунда каждый выходит из роли: называет своё имя.',
        'Обсуждаем слова и действия, а не способности и характер. Не называем реальных детей, семьи и коллег.',
        'Если разговор задел кого-то лично, остановите сцену, предложите перерыв или перейдите к обсуждению без инсценировки.',
        'Отдельные ситуации проводятся только как совет коллег — это указано в строке «Ведущему» на карточке.']))
    box = Table([[P('<b>Когда это не дилемма</b>', 'h2')], [P(E(SAFETY))]], colWidths=[174 * mm])
    box.setStyle(TableStyle([('BOX', (0, 0), (-1, -1), 1.2, HexColor('#ad4b35')), ('BACKGROUND', (0, 0), (-1, -1), HexColor('#fbf1ee')),
                             ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                             ('TOPPADDING', (0, 0), (0, 0), 2), ('BOTTOMPADDING', (0, -1), (-1, -1), 6)]))
    s.append(Spacer(1, 2 * mm))
    s.append(box)
    s.append(P('Большие группы', 'h2'))
    s.append(bullets([
        'До 12 человек — одна сцена, остальные наблюдатели с карточкой Ро-09.',
        'Больше 12 — команды по 4–6 человек, каждая за своим столом. Команды могут играть одну ситуацию или разные.',
        'За каждым столом — помощник ведущего с этим руководством: он следит за временем и правом на паузу.',
        'Ведущий объявляет этапы для всех столов сразу. На этапах «Что заметили» и «Решение» обходит столы, '
        'а в конце раунда просит одну команду рассказать о своём решении.',
        'Каждая команда заполняет один бланк результатов; личный шаг участник отрезает и оставляет себе.']))
    # ---- печать
    s.append(P('Двусторонняя печать карточек', 'h2'))
    s.append(numbered([
        'Выберите файл под свой принтер: <b>cards-long-edge.pdf</b> — переворот по длинному краю (обычная настройка «двусторонняя»), '
        '<b>cards-short-edge.pdf</b> — переворот по короткому краю.',
        'В диалоге печати: бумага A4, книжная ориентация, масштаб <b>100%</b> («Фактический размер»), '
        'не «Вписать в страницу». Колонтитулы и поля браузера отключите.',
        'Сначала напечатайте только страницы 1–2 — пробный лист. Цифры на лице и обороте должны совпасть, рамки на просвет — сойтись с точностью 1–2 мм. '
        'Если на обороте цифры поменялись местами, возьмите файл для другого края.',
        'Затем печатайте страницы 3 и далее. Режьте по пунктирной рамке, ориентируясь на угловые метки.',
        'Принтер без автоматической двусторонней печати: напечатайте нечётные страницы, переложите стопку по инструкции принтера и напечатайте чётные. '
        'Пробный лист особенно важен в этом режиме.']))
    return build_doc(OUT / 'host-guide.pdf', s, 'Руководство ведущего')


def participant_rules():
    s = [P('Памятка участника', 'h1'),
         P('Мы разбираем вымышленный школьный случай и пробуем два способа действовать. Правильного ответа нет, '
           'людей никто не оценивает.', 'lead'),
         P('Ваши права', 'h2'),
         bullets(['<b>Наблюдать</b> вместо участия в сцене.',
                  '<b>Попросить паузу</b> в любой момент, без объяснения причин.',
                  '<b>Поменяться ролью</b> или передать место наблюдателю между попытками.',
                  '<b>Пропустить</b> вопрос или этап. Личными выводами делиться не обязательно.']),
         P('Как идёт раунд', 'h2'),
         numbered(['<b>Ситуация.</b> Ведущий читает карточку. Добровольцы берут места и карточки ролей.',
                   '<b>Первая попытка.</b> Начните с начальной реплики и действуйте так, как действовали бы сами. Достаточно первого шага.',
                   '<b>Что заметили.</b> Сначала говорят участники сцены, затем наблюдатели: точные слова и что они изменили.',
                   '<b>Ресурс.</b> Команда выбирает карточку ресурса и договаривается, что изменит.',
                   '<b>Вторая попытка.</b> Ключевой момент ещё раз — с ресурсом. Можно сменить исполнителей.',
                   '<b>Сравнение и решение.</b> Что даст каждый вариант завтра и через месяц? Что делаем, кто, когда и как поймём, что получилось.',
                   '<b>Личный вывод.</b> Выйдите из роли: назовите своё имя. Запишите для себя один шаг.']),
         P('Задача наблюдателя', 'h2'),
         P(E(next(r for r in data['roles'] if r['id'] == 'Ро-09')['text'])),
         bullets(['Пишите дословно: «Вы сказали: …», а не «вы были резки».',
                  'Отделяйте увиденное («отвёл взгляд») от догадки («ему было неловко»).',
                  'Начинайте с того, что помогло разговору, затем — что можно попробовать иначе.']),
         P('Договорённости', 'h2'),
         P('Не называем реальных детей, семьи и коллег. Роль — не человек: после сцены каждый выходит из роли. '
           'Если ситуация задела лично, скажите ведущему или просто перейдите в наблюдатели.')]
    return build_doc(OUT / 'participant-rules.pdf', s, 'Памятка участника')


def results_sheet():
    path = OUT / 'results-sheet.pdf'
    cv = canvas.Canvas(str(path), pagesize=A4, initialFontName='DejaVu', initialFontSize=10)
    cv.setTitle('ПЕДАГОГ · Бланк результатов')
    cv.setAuthor('ПЕДАГОГ · В. Г. Науменко')
    L, R = 18 * mm, A4[0] - 18 * mm
    W = R - L
    y = A4[1] - 18 * mm
    blue = HexColor('#203c52')
    cv.setFillColor(blue)
    cv.setFont('DejaVu-Bold', 19)
    cv.drawString(L, y - 6 * mm, 'Бланк результатов команды')
    cv.setFont('DejaVu', 9.5)
    cv.setFillColor(MUTED)
    cv.drawRightString(R, y - 6 * mm, 'один бланк на команду')
    y -= 13 * mm

    def label(text, x, yy, size=10.5, bold=True):
        cv.setFillColor(INK)
        cv.setFont('DejaVu-Bold' if bold else 'DejaVu', size)
        cv.drawString(x, yy, text)

    def rules(x, yy, w, n, step=7.5 * mm):
        cv.setStrokeColor(HexColor('#b9b2a8'))
        cv.setLineWidth(.4)
        for k in range(n):
            cv.line(x, yy - k * step, x + w, yy - k * step)
        return yy - (n - 1) * step

    def field(title, hint, n, x=L, w=W):
        nonlocal y
        label(title, x, y)
        if hint:
            tw = pdfmetrics.stringWidth(title, 'DejaVu-Bold', 10.5)
            cv.setFont('DejaVu', 9.5)
            cv.setFillColor(MUTED)
            cv.drawString(x + tw + 2 * mm, y, hint)
        y = rules(x, y - 7.5 * mm, w, n) - 6.5 * mm

    # строка: ситуация и роли
    label('Ситуация:', L, y)
    rules(L + 23 * mm, y - 1 * mm, 50 * mm, 1)
    label('Роли (кто играл):', L + 78 * mm, y)
    rules(L + 113 * mm, y - 1 * mm, W - 113 * mm, 1)
    y -= 11 * mm
    field('1. Первый вариант', '— что сказали и сделали', 3)
    field('2. Ресурс', '— какая карточка и что изменили', 2)
    field('3. Второй вариант', '— что получилось иначе', 3)
    # последствия в две колонки
    label('4. Последствия', L, y)
    y -= 6.5 * mm
    half = (W - 8 * mm) / 2
    label('Завтра', L, y, 10, False)
    label('Через месяц', L + half + 8 * mm, y, 10, False)
    rules(L, y - 7.5 * mm, half, 3)
    y = rules(L + half + 8 * mm, y - 7.5 * mm, half, 3) - 6.5 * mm
    # решение: таблица 2×2
    label('5. Решение команды', L, y)
    y -= 6.5 * mm
    for a, b in [('Что делаем', 'Кто'), ('Когда', 'Как поймём, что получилось')]:
        label(a, L, y, 10, False)
        label(b, L + half + 8 * mm, y, 10, False)
        rules(L, y - 7.5 * mm, half, 1)
        y = rules(L + half + 8 * mm, y - 7.5 * mm, half, 1) - 6.5 * mm
    label('Что пока не знаем / несогласие', L, y, 10, False)
    y = rules(L, y - 7.5 * mm, W, 2) - 4 * mm
    # линия отреза
    cut = 64 * mm
    assert y > cut + 2 * mm, ('форма не помещается над линией отреза', y / mm)
    cv.setStrokeColor(HexColor('#79736c'))
    cv.setDash(4, 3)
    cv.setLineWidth(.6)
    cv.line(10 * mm, cut, A4[0] - 10 * mm, cut)
    cv.setDash()
    cv.setFont('DejaVu', 9)
    cv.setFillColor(MUTED)
    cv.drawString(L, cut + 1.8 * mm, '✂  отрежьте по линии')
    yy = cut - 9 * mm
    cv.setFillColor(HexColor('#356e64'))
    cv.setFont('DejaVu-Bold', 14)
    cv.drawString(L, yy, 'Мой шаг · оставьте себе')
    cv.setFont('DejaVu', 9.5)
    cv.setFillColor(MUTED)
    cv.drawRightString(R, yy, 'эту часть никому не сдают')
    yy -= 9 * mm
    for t in ['Что я попробую в работе:', 'Когда:', 'По какому признаку замечу результат:']:
        label(t, L, yy, 10.5, False)
        tw = pdfmetrics.stringWidth(t, 'DejaVu', 10.5)
        rules(L + tw + 3 * mm, yy - 1 * mm, W - tw - 3 * mm, 1)
        yy -= 11 * mm
    cv.setFont('DejaVu', 8.5)
    cv.setFillColor(MUTED)
    cv.drawString(L, 11 * mm, f'ПЕДАГОГ · Бланк результатов · редакция колоды {data["version"]} · не используется для оценки участников')
    cv.showPage()
    cv.save()
    return path


# ---------------------------------------------------------------- запуск
report = {'deck_version': data['version'], 'unique_cards': len(unique), 'printed_cards': len(cards),
          'extra_copies': EXTRA, 'page_mm': [210, 297], 'card_mm': [190, 132],
          'front_slots_mm': {'top': [10, 152.5], 'bottom': [10, 12.5]},
          'back_mapping': {'long': 'тот же ряд (зеркало по X; одна центрированная колонка)', 'short': 'ряды меняются местами'},
          'safe_margin_mm': 8, 'files': {}}
for edge in ('long', 'short'):
    path, layout = make_cards(edge)
    res = check_cards(path, layout, edge)
    res['bytes'] = path.stat().st_size
    res['calibration_pages'] = [1, 2]
    report['files'][path.name] = res
for fn, pages in [(host_guide, (3, 5)), (participant_rules, (1, 1)), (results_sheet, (1, 1))]:
    path = fn()
    res = check_page_size_and_margins(path)
    res['bytes'] = path.stat().st_size
    assert res['a4'] and pages[0] <= res['pages'] <= pages[1], (path.name, res['pages'])
    assert not res['outside_safe_area'], (path.name, res['outside_safe_area'][:5])
    report['files'][path.name] = res
# содержание руководства: все этапы движка, расписание и правило безопасности
with pdfplumber.open(OUT / 'host-guide.pdf') as pdf:
    guide = norm(''.join(p.extract_text() or '' for p in pdf.pages))
for k, st in STAGES.items():
    for f in ('title', 'do', 'who', 'result'):
        assert norm(st[f]) in guide, ('host-guide', k, f)
assert norm(SAFETY) in guide and norm('Когда это не дилемма') in guide
for bad in ('кризис', '20мин', '45мин', '60мин', '120мин'):
    assert bad not in guide.lower(), bad
report['host_guide'] = {'stages_present': len(STAGES), 'totals': {d: total(d) for d in ('15', '40', '90')}, 'safety_note': True}
with pdfplumber.open(OUT / 'results-sheet.pdf') as pdf:
    rs = norm(pdf.pages[0].extract_text())
for t in ['Ситуация', 'Роли', 'Первый вариант', 'Ресурс', 'Второй вариант', 'Завтра', 'Через месяц', 'Что делаем', 'Кто',
          'Когда', 'Как поймём, что получилось', 'оставьте себе']:
    assert norm(t) in rs, t
# шрифты: каждый символ набран встроенным DejaVu (ReportLab объявляет неиспользуемый Helvetica в ресурсах — его глифы не применяются)
for name in report['files']:
    used = set()
    with pdfplumber.open(OUT / name) as pdf:
        for page in pdf.pages:
            used |= {ch['fontname'] for ch in page.chars}
    report['files'][name]['fonts_used'] = sorted(used)
    assert used and all('DejaVu' in f for f in used), (name, used)
    for page in PdfReader(OUT / name).pages:
        for f in page['/Resources']['/Font'].values():
            f = f.get_object()
            if 'DejaVu' in str(f['/BaseFont']):
                desc = f['/DescendantFonts'][0].get_object()['/FontDescriptor'].get_object() if '/DescendantFonts' in f else f['/FontDescriptor'].get_object()
                assert '/FontFile2' in desc, (name, 'шрифт не встроен')
sizes = [m['body_pt'] for m in card_metrics.values()]
report['card_body_pt'] = {'min': min(sizes), 'max': max(sizes),
                          'situations_min': min(m['body_pt'] for k, m in card_metrics.items() if k.startswith('С-'))}
report['cards'] = card_metrics
assert min(sizes) >= 9
(OUT / 'geometry.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({n: {'pages': r['pages'], 'bytes': r['bytes']} for n, r in report['files'].items()}, ensure_ascii=False))
print(json.dumps(report['card_body_pt'], ensure_ascii=False))
