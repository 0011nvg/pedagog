/* ПЕДАГОГ · графика (оригинальные SVG, без внешних изображений).
   Мотив — «маршрут ситуации»: волнистая дорога к школе с маркерами этапов, звёзды, горы;
   буквенные метки ролей — только там, где речь о ролях (лента взглядов, бейджи). */
(function(root){
'use strict';
const D=root.PEDAGOG_DATA;
const T=id=>D&&D.roleTypes.find(t=>t.id===id)||{abbr:'?',color:'#3B4A99',ink:'#fff'};
const star=(x,y,s,fill='#fff',cls='')=>`<path class="${cls}" fill="${fill}" d="M${x} ${y-s}C${x+s*.18} ${y-s*.18} ${x+s*.18} ${y-s*.18} ${x+s} ${y}C${x+s*.18} ${y+s*.18} ${x+s*.18} ${y+s*.18} ${x} ${y+s}C${x-s*.18} ${y+s*.18} ${x-s*.18} ${y+s*.18} ${x-s} ${y}C${x-s*.18} ${y-s*.18} ${x-s*.18} ${y-s*.18} ${x} ${y-s}Z"/>`;
/* Метка-пин: остриё в (x,y). */
function pin(x,y,typeId,{scale=1,delay=0,label}={}){const t=T(typeId);const k=scale;
  return `<g transform="translate(${x} ${y}) scale(${k})"><g class="pin-drop" style="animation-delay:${delay}s"><ellipse cx="0" cy="2" rx="9" ry="3" fill="#171D45" opacity=".18"/><path d="M0 0C-5 -9 -17 -17 -17 -30A17 17 0 1 1 17 -30C17 -17 5 -9 0 0Z" fill="${t.color}" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><circle cx="0" cy="-30" r="12" fill="#fff"/><text x="0" y="-26" text-anchor="middle" font-family="Montserrat,Onest,sans-serif" font-weight="800" font-size="10.5" fill="${t.color==='#F3A27A'||t.color==='#E0A64E'||t.color==='#62B9AF'?'#2A1D17':t.color}">${label||t.abbr}</text></g></g>`;}

/* Знак игры — стилизованное здание школы (без букв): корпус, центральный вход с табличкой, звезда. */
function mark(size=44){return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true" focusable="false"><path d="M3 43h42" stroke="#C9CCEB" stroke-width="2.4" stroke-linecap="round"/><rect x="4" y="20" width="40" height="23" rx="2.5" fill="#3B4A99"/><rect x="16.5" y="11" width="15" height="32" rx="2" fill="#2A958E"/><rect x="19" y="14.5" width="10" height="4" rx="1.2" fill="#fff"/><rect x="21" y="32" width="6" height="11" rx="1.5" fill="#FFD98A"/><g fill="#fff"><rect x="7.5" y="24.5" width="3.6" height="4.2" rx=".8"/><rect x="12" y="24.5" width="3.6" height="4.2" rx=".8"/><rect x="7.5" y="32.5" width="3.6" height="4.2" rx=".8"/><rect x="12" y="32.5" width="3.6" height="4.2" rx=".8"/><rect x="32.4" y="24.5" width="3.6" height="4.2" rx=".8"/><rect x="36.9" y="24.5" width="3.6" height="4.2" rx=".8"/><rect x="32.4" y="32.5" width="3.6" height="4.2" rx=".8"/><rect x="36.9" y="32.5" width="3.6" height="4.2" rx=".8"/><rect x="20.6" y="22.5" width="6.8" height="5" rx=".8"/></g>${star(41,9,5.2,'#E8673F')}</svg>`;}

/* Маркер остановки на маршруте: без букв, цвет показывает этап (начало, новое обстоятельство, решение). */
function marker(x,y,color='#C9CCEB',{delay=0,size=1}={}){return `<g transform="translate(${x} ${y}) scale(${size})"><g class="marker-pop" style="animation-delay:${delay}s"><circle class="marker-halo" r="15" fill="${color}" opacity=".28" style="animation-delay:${delay+.6}s"/><circle r="8.5" fill="${color}" stroke="#fff" stroke-width="2.6"/><circle r="2.8" fill="#fff"/></g></g>`;}
function fir(x,base,h,fill='#28336E'){const w=h*.42;return `<path d="M${x} ${base-h}L${x+w*.62} ${base-h*.45}H${x+w*.32}L${x+w} ${base}H${x-w}L${x-w*.32} ${base-h*.45}H${x-w*.62}Z" fill="${fill}"/>`;}
function tree(x,base,r,fill){return `<rect x="${x-2}" y="${base-r*1.3}" width="4" height="${r*1.3}" fill="#28336E"/><circle cx="${x}" cy="${base-r*1.5}" r="${r}" fill="${fill}"/>`;}

/* Здание школы: корпус в три этажа, два крыла, выступающий центральный вход с табличкой «ШКОЛА».
   Окна частью светятся — вечер, в школе ещё идёт работа. Основание здания — линия G. */
function school(G=448){
  const win=(x,y,w,h,lit)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${lit?'#FFD98A':'#8FA2E6'}"/><path d="M${x+w/2} ${y+1}V${y+h-1}M${x+1} ${y+h*.42}H${x+w-1}" stroke="${lit?'#F6C266':'#B9C4F0'}" stroke-width="1.4"/>`;
  const lit=new Set(['m0-1','m1-2','m2-0','m0-3','m2-3','w0-1','w1-0','r1']);
  const out=[];
  /* мягкий свет от окон и входа на земле */
  out.push(`<ellipse cx="1110" cy="${G+4}" rx="230" ry="12" fill="#7581C9"/><ellipse cx="1110" cy="${G+6}" rx="70" ry="9" fill="#FFD98A" opacity=".22"/>`);
  /* крылья */
  [[934,'w0'],[1210,'w1']].forEach(([x,k])=>{out.push(`<rect x="${x}" y="${G-76}" width="78" height="76" fill="#DADDF3"/><rect x="${x-3}" y="${G-80}" width="84" height="7" rx="2" fill="#C3C7EA"/>`);
    [0,1].forEach(r=>[0,1].forEach(c=>out.push(win(x+14+c*32,G-62+r*30,18,21,lit.has(`${k}-${r*2+c}`)))));});
  /* основной корпус */
  out.push(`<rect x="1004" y="${G-112}" width="212" height="112" fill="#EEF0FA"/><rect x="1000" y="${G-117}" width="220" height="9" rx="2" fill="#D3D6EF"/><rect x="1004" y="${G-10}" width="212" height="10" fill="#C9CCEB"/>`);
  [1014,1044,1156,1186].forEach((x,c)=>[0,1,2].forEach(r=>out.push(win(x,G-98+r*30,20,22,lit.has(`m${r}-${c}`)))));
  /* центральный вход */
  out.push(`<rect x="1072" y="${G-138}" width="76" height="138" fill="#F8F9FE"/><rect x="1067" y="${G-143}" width="86" height="9" rx="2" fill="#D3D6EF"/>
   <rect x="1081" y="${G-126}" width="58" height="19" rx="4" fill="#2A958E"/><text x="1110" y="${G-112.2}" text-anchor="middle" font-family="Montserrat,Onest,sans-serif" font-weight="800" font-size="11.5" letter-spacing="1.6" fill="#fff">ШКОЛА</text>
   ${win(1092,G-98,36,22,false)}${win(1092,G-68,36,22,lit.has('r1'))}
   <rect x="1084" y="${G-41}" width="52" height="6" rx="3" fill="#2A958E"/>
   <rect x="1095" y="${G-35}" width="30" height="35" rx="3" fill="#3B4A99"/><rect x="1098.5" y="${G-31}" width="10.5" height="20" rx="1.5" fill="#FFD98A" opacity=".92"/><rect x="1111" y="${G-31}" width="10.5" height="20" rx="1.5" fill="#FFD98A" opacity=".92"/>
   <rect x="1088" y="${G-2}" width="44" height="4" rx="1.5" fill="#C9CCEB"/><rect x="1083" y="${G+1.5}" width="54" height="3.5" rx="1.5" fill="#B9BEE5"/>`);
  return `<g class="school" aria-hidden="true">${out.join('')}</g>`;}

/* Дорога-волна от края экрана к дверям школы: цепочка кубических сегментов, на ней маркеры этапов. */
const ROAD=[[[24,636],[150,606],[230,560],[340,566]],[[340,566],[450,572],[500,618],[620,600]],[[620,600],[740,582],[760,520],[870,524]],[[870,524],[960,527],[990,486],[1060,470]],[[1060,470],[1086,464],[1102,459],[1110,452]]];
function roadPath(segs){return 'M'+segs[0][0].join(' ')+segs.map(s=>'C'+s.slice(1).map(p=>p.join(' ')).join(' ')).join('');}

/* Пейзаж главного экрана во всю ширину: небо со звёздами, горы, школа на холме и дорога к ней. */
function heroScene(){
  const stars=[[930,96,14,0],[1390,150,10,1.1],[1060,52,8,2],[1330,330,8,.5],[1236,58,9,.8],[960,250,6,1.9],[1032,170,5,2.9],[1188,196,5,1.3],[1410,62,6,2.3],[1290,256,4.5,.3],[1400,420,6,1.6],[1160,120,4,2.6]];
  const dots=[[905,40],[1100,92],[1290,128],[1350,30],[1365,250],[1010,236],[990,330]];
  const at=(i,t)=>cubic(...ROAD[i],t).map(Math.round);
  const marks=[[0,.2,'#C9CCEB',.1],[1,.55,'#C9CCEB',.25],[2,.38,'#E8673F',.4],[2,.92,'#E8673F',.55],[3,.62,'#2A958E',.7]];
  const d=roadPath(ROAD);
  return `<svg class="hero-land" viewBox="0 0 1440 640" preserveAspectRatio="xMaxYMax slice" role="img" aria-label="Иллюстрация: вечер, звёзды, горы и ёлки; извилистая дорога ведёт к дверям школы">
  <circle cx="1124" cy="250" r="214" fill="#4352A3"/><circle cx="1124" cy="250" r="142" fill="#4D5CAC"/>
  <defs><filter id="starGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
   <radialGradient id="starHalo"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
   <radialGradient id="roadLight"><stop offset="0" stop-color="#FFE8B0"/><stop offset=".45" stop-color="#FFD98A" stop-opacity=".75"/><stop offset="1" stop-color="#FFD98A" stop-opacity="0"/></radialGradient></defs>
  ${stars.filter(([,,s])=>s>=9).map(([x,y,s,dl])=>`<circle class="star-halo" style="animation-delay:${dl}s" cx="${x}" cy="${y}" r="${s*2.6}" fill="url(#starHalo)"/>`).join('')}
  <g filter="url(#starGlow)">${stars.map(([x,y,s,dl],i)=>star(x,y,s,'#fff','twinkle').replace('<path ',`<path style="animation-delay:${dl}s;animation-duration:${[3.2,4.4,2.8,5.2][i%4]}s" `)).join('')}</g>
  ${dots.map(([x,y],i)=>`<circle class="twinkle" style="animation-delay:${(i*.7)%3}s" cx="${x}" cy="${y}" r="1.8" fill="#DADCF3"/>`).join('')}
  <path d="M300 640L420 520L500 470L560 500L640 430L720 480L790 420L860 470L930 410L1010 452L1080 400L1160 446L1240 404L1330 450L1440 418V640Z" fill="#4250A3"/>
  <path d="M640 430L662 448L652 446L646 456L636 446L622 450Z M930 410L952 428L942 426L936 436L926 426L912 430Z M1240 404L1262 422L1252 420L1246 430L1236 420L1222 424Z" fill="#6573C0"/>
  <path d="M430 640L560 470L640 430L690 452L770 380L840 438L900 404L980 446L1040 372L1100 420L1170 384L1250 430L1320 396L1440 430V640Z" fill="#4555A8"/>
  <path d="M770 380L796 402L784 400L776 412L764 400L748 404Z M1040 372L1066 394L1054 392L1046 404L1034 392L1018 396Z M1170 384L1192 402L1182 400L1176 410L1166 400L1152 404Z" fill="#7684C9"/>
  ${[[590,482,22],[608,486,16],[712,470,20],[1288,436,18]].map(([x,b,h])=>fir(x,b,h,'#3A479A')).join('')}
  <path d="M0 540C220 500 420 520 620 506C820 492 960 440 1140 444C1260 447 1360 430 1440 432V640H0Z" fill="#6874C2"/>
  ${tree(862,448,21,'#2A958E')}${fir(898,452,58)}${fir(920,452,40)}
  ${school(448)}
  ${tree(1316,446,17,'#8ED3CB')}${fir(1346,452,54)}${fir(1368,452,36)}
  <path d="M0 600C240 566 480 606 720 586C930 568 1150 548 1440 556V640H0Z" fill="#F4F4F9"/>
  <path d="${d}" fill="none" stroke="#AEB6E8" stroke-opacity=".55" stroke-width="15" stroke-linecap="round"/>
  <path class="road-dash" d="${d}" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="10 11" stroke-linecap="round"/>
  <g class="road-light" style="offset-path:path('${d}')"><circle r="16" fill="url(#roadLight)"/><circle r="3.2" fill="#FFF6DD"/></g>
  ${marks.map(([i,t,c,dl])=>{const [x,y]=at(i,t);return marker(x,y-1,c,{delay:dl,size:1.1});}).join('')}
  </svg>`;}

/* Линии-траектории (две пересекающиеся ленты) с метками ролей на них. */
function cubic(p0,p1,p2,p3,t){const u=1-t;return [u*u*u*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t*t*t*p3[0],u*u*u*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t*t*t*p3[1]];}
function ribbons(){
  const A=[[-20,250],[360,300],[560,40],[860,120]],A2=[[860,120],[1120,190],[1250,330],[1460,250]];
  const B=[[-20,90],[300,10],[600,330],[900,250]],B2=[[900,250],[1140,190],[1260,40],[1460,90]];
  const path=(s1,s2)=>`M${s1[0]}C${s1[1]} ${s1[2]} ${s1[3]}C${s2[1]} ${s2[2]} ${s2[3]}`.replace(/,/g,' ');
  const on=(seg,t,id,d)=>{const [x,y]=cubic(...seg,t);return pin(Math.round(x),Math.round(y-2),id,{scale:1.15,delay:d});};
  return `<svg viewBox="0 0 1440 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" style="width:100%;height:100%">
  <path d="${path(A,A2)}" fill="none" stroke="#22253A" stroke-width="20" stroke-linecap="round"/>
  <path d="${path(B,B2)}" fill="none" stroke="#3B4A99" stroke-width="20" stroke-linecap="round"/>
  ${on(A,.22,'Ро-01',.1)}${on(A,.62,'Ро-04',.3)}${on(A2,.45,'Ро-08',.5)}${on(B,.35,'Ро-05',.2)}${on(B,.82,'Ро-06',.4)}${on(B2,.55,'Ро-10',.6)}
  ${star(1010,40,12,'#3B4A99')}${star(330,330,9,'#2A958E')}${star(1330,320,8,'#E8673F')}
  </svg>`;}

/* Горы для финального призыва (бирюзовый фон). */
function ridge(){return `<svg viewBox="0 0 1440 260" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false" style="display:block;width:100%;height:auto;margin-top:40px">
  <path d="M0 260V150L120 96L210 140L330 40L430 120L520 88L640 170L760 60L860 130L980 72L1100 150L1220 90L1330 140L1440 100V260Z" fill="#4FA9A1"/>
  <path d="M330 40L364 68L348 64L338 76L326 64L308 70Z M760 60L794 88L778 84L768 96L756 84L738 90Z M980 72L1014 100L998 96L988 108L976 96L958 102Z" fill="#B7E3DD"/>
  <path d="M0 260V200L160 150L280 196L420 130L560 210L700 150L840 214L980 160L1120 220L1260 170L1440 214V260Z" fill="#1C6E69"/>
  ${star(240,40,12,'#fff','twinkle')}${star(1180,30,10,'#fff','twinkle')}${star(640,24,7,'#E1F1EF')}
  </svg>`;}

/* Иллюстрации для двух способов провести игру. */
function screenArt(){return `<svg viewBox="0 0 300 220" aria-hidden="true"><rect x="20" y="20" width="260" height="160" rx="16" fill="#28336E"/><rect x="34" y="34" width="232" height="132" rx="8" fill="#EEF0FA"/>
  <path d="M56 118C96 96 120 132 160 112S230 84 248 96" fill="none" stroke="#C9CCEB" stroke-width="4" stroke-dasharray="8 7" stroke-linecap="round"/>
  ${marker(62,116,'#C9CCEB',{size:.8})}${marker(122,118,'#C9CCEB',{size:.8})}${marker(186,104,'#E8673F',{size:.8})}${marker(246,96,'#2A958E',{size:.8})}
  <rect x="50" y="138" width="90" height="8" rx="4" fill="#C9CCEB"/><rect x="50" y="48" width="120" height="10" rx="5" fill="#3B4A99"/>
  <rect x="130" y="180" width="40" height="22" fill="#28336E"/><rect x="100" y="198" width="100" height="8" rx="4" fill="#28336E"/></svg>`;}
function cardsArt(){const c=(x,y,r,id,title)=>{const t=T(id);return `<g transform="translate(${x} ${y}) rotate(${r})"><rect width="120" height="168" rx="12" fill="#fff"/><rect width="120" height="34" rx="12" fill="${t.color}"/><rect y="22" width="120" height="12" fill="${t.color}"/><circle cx="24" cy="17" r="10" fill="#fff"/><circle cx="24" cy="17" r="4" fill="${t.color}"/><rect x="14" y="50" width="76" height="8" rx="4" fill="#1A1F45"/><rect x="14" y="68" width="92" height="5" rx="2.5" fill="#C9CCEB"/><rect x="14" y="80" width="84" height="5" rx="2.5" fill="#C9CCEB"/><rect x="14" y="92" width="88" height="5" rx="2.5" fill="#C9CCEB"/><rect x="14" y="128" width="92" height="26" rx="8" fill="#EEEFF8"/></g>`;};
  return `<svg viewBox="0 0 320 240" aria-hidden="true">${c(40,60,-14,'Ро-05')}${c(110,40,-2,'Ро-04')}${c(180,50,12,'Ро-01')}</svg>`;}

/* Фон внутренних страниц: звёздное небо поверх синей подложки — много мелких звёзд, немного средних и несколько
   крупных, белые и мягкие жёлтые, мягкое медленное мерцание. Без зданий, кругов и ореолов. Слева, где текст,
   звёзды реже и тусклее. Расположение псевдослучайное, но одинаковое при каждой сборке. */
function starfield(seed=7,{w=1440,h=560,count=380}={}){let x=seed>>>0||1;const rnd=()=>(x=(x*1664525+1013904223)>>>0)/4294967296;
  const out=[],cols=['#FFFFFF','#FFFFFF','#FFFFFF','#FFF4CC','#FFE7A3'];
  for(let i=0;i<count;i++){const px=rnd()*w,py=rnd()*h,left=px<w*.74,r=rnd(),c=cols[Math.floor(rnd()*cols.length)];
    const dur=(6+rnd()*5).toFixed(1),dl=(rnd()*8).toFixed(1),op=(left?.78:.9)*(0.65+rnd()*0.35);
    if(left&&rnd()<.25)continue;
    if(r<.7||left){out.push(`<circle class="tw" style="animation-duration:${dur}s;animation-delay:-${dl}s" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(left?1+rnd()*0.8:0.9+rnd()*1.3).toFixed(2)}" fill="${c}" fill-opacity="${op.toFixed(2)}"/>`);}
    else{const big=r>.94&&!left,sz=big?7.5+rnd()*3.5:3.2+rnd()*3;
      out.push(star(+px.toFixed(1),+py.toFixed(1),+sz.toFixed(1),c,'tw').replace('<path ',`<path ${big?'filter="url(#sfGlow)" ':''}fill-opacity="${Math.min(1,op+.15).toFixed(2)}" style="animation-duration:${dur}s;animation-delay:-${dl}s" `));}}
  return `<svg class="starfield" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs><filter id="sfGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${out.join('')}</svg>`;}
function pageDeco(seed=7){return starfield(seed);}

function badge(typeId,cls=''){const t=T(typeId);return `<span class="badge ${cls}" style="--c:${t.color};--i:${t.ink}" title="${t.title}">${t.abbr}</span>`;}

root.PEDAGOG_ART={mark,pin,marker,school,star,starfield,heroScene,ribbons,ridge,screenArt,cardsArt,pageDeco,badge};
})(globalThis);
