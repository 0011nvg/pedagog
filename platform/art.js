/* ПЕДАГОГ · графика (оригинальные SVG, без внешних изображений).
   Мотив — «маршрут ситуации»: пунктирная дорога, метки ролей, линии-траектории разных взглядов. */
(function(root){
'use strict';
const D=root.PEDAGOG_DATA;
const T=id=>D&&D.roleTypes.find(t=>t.id===id)||{abbr:'?',color:'#3B4A99',ink:'#fff'};
const star=(x,y,s,fill='#fff',cls='')=>`<path class="${cls}" fill="${fill}" d="M${x} ${y-s}C${x+s*.18} ${y-s*.18} ${x+s*.18} ${y-s*.18} ${x+s} ${y}C${x+s*.18} ${y+s*.18} ${x+s*.18} ${y+s*.18} ${x} ${y+s}C${x-s*.18} ${y+s*.18} ${x-s*.18} ${y+s*.18} ${x-s} ${y}C${x-s*.18} ${y-s*.18} ${x-s*.18} ${y-s*.18} ${x} ${y-s}Z"/>`;
/* Метка-пин: остриё в (x,y). */
function pin(x,y,typeId,{scale=1,delay=0,label}={}){const t=T(typeId);const k=scale;
  return `<g transform="translate(${x} ${y}) scale(${k})"><g class="pin-drop" style="animation-delay:${delay}s"><ellipse cx="0" cy="2" rx="9" ry="3" fill="#171D45" opacity=".18"/><path d="M0 0C-5 -9 -17 -17 -17 -30A17 17 0 1 1 17 -30C17 -17 5 -9 0 0Z" fill="${t.color}" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><circle cx="0" cy="-30" r="12" fill="#fff"/><text x="0" y="-26" text-anchor="middle" font-family="Montserrat,Onest,sans-serif" font-weight="800" font-size="10.5" fill="${t.color==='#F3A27A'||t.color==='#E0A64E'||t.color==='#62B9AF'?'#2A1D17':t.color}">${label||t.abbr}</text></g></g>`;}

function mark(size=44){return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true" focusable="false"><path d="M24 46C21 40 7 31 7 18.5A17 17 0 0 1 41 18.5C41 31 27 40 24 46Z" fill="#3B4A99"/><circle cx="24" cy="18.5" r="11.5" fill="#fff"/><path d="M18.6 13.2h10.8v11.4h-3.1v-8.6h-4.6v8.6h-3.1z" fill="#3B4A99"/><circle cx="38.5" cy="38" r="4.5" fill="#E8673F"/><circle cx="9" cy="39.5" r="3.4" fill="#2A958E"/></svg>`;}

/* Пейзаж главного экрана во всю ширину: небо, горы, школа на холме и маршрут с метками ролей. */
function heroScene(){
  const X=1020,Y=318;const win=[];for(let r=0;r<3;r++)for(let c=0;c<5;c++){if(r===2&&c===2)continue;win.push(`<rect x="${X+14+c*36}" y="${Y+24+r*30}" width="16" height="19" rx="3" fill="#8FA2E6"/>`);}
  const wing=[];for(let r=0;r<2;r++)for(let c=0;c<2;c++)wing.push(`<rect x="${X-34+c*22}" y="${Y+50+r*28}" width="11" height="15" rx="2.5" fill="#8FA2E6"/>`);
  const pins=[['Ро-01',150,596,.2],['Ро-03',390,566,.35],['Ро-05',640,566,.5],['Ро-08',860,526,.65],['Ро-06',1004,478,.8]];
  return `<svg class="hero-land" viewBox="0 0 1440 640" preserveAspectRatio="xMaxYMax slice" role="img" aria-label="Иллюстрация: к школе на холме ведёт маршрут, на нём метки пяти ролей">
  <circle cx="1124" cy="250" r="214" fill="#4352A3"/><circle cx="1124" cy="250" r="142" fill="#4D5CAC"/>
  ${star(800,120,15,'#fff','twinkle')}${star(1390,150,10,'#fff','twinkle')}${star(960,70,7,'#C9CCEB')}${star(1330,330,8,'#fff','twinkle')}${star(740,300,7,'#C9CCEB')}
  <path d="M430 640L560 470L640 430L690 452L770 380L840 438L900 404L980 446L1040 372L1100 420L1170 384L1250 430L1320 396L1440 430V640Z" fill="#4555A8"/>
  <path d="M0 540C220 500 420 520 620 506C820 492 960 440 1140 444C1260 447 1360 430 1440 432V640H0Z" fill="#6874C2"/>
  <g>
   <rect x="${X-44}" y="${Y+34}" width="64" height="88" fill="#C9CCEB"/>${wing.join('')}
   <rect x="${X}" y="${Y}" width="210" height="122" fill="#EEF0FA"/><rect x="${X}" y="${Y}" width="210" height="10" fill="#DCDDF2"/>
   ${win.join('')}
   <rect x="${X+80}" y="${Y-72}" width="50" height="80" fill="#fff"/>
   <path d="M${X+74} ${Y-68}Q${X+105} ${Y-118} ${X+136} ${Y-68}Z" fill="#2A958E"/>
   <rect x="${X+103.5}" y="${Y-136}" width="3" height="40" fill="#28336E"/><path d="M${X+106.5} ${Y-134}h22l-6 7 6 7h-22z" fill="#E8673F"/>
   <circle cx="${X+105}" cy="${Y-42}" r="11" fill="#8FA2E6"/><path d="M${X+105} ${Y-49}v7h5" stroke="#28336E" stroke-width="2" fill="none" stroke-linecap="round"/>
   <path d="M${X+91} ${Y+122}v-34a14 14 0 0 1 28 0v34z" fill="#3B4A99"/>
  </g>
  <g><rect x="${X-70}" y="${Y+84}" width="4" height="40" fill="#28336E"/><circle cx="${X-68}" cy="${Y+74}" r="26" fill="#2A958E"/>
   <rect x="${X+232}" y="${Y+84}" width="4" height="36" fill="#28336E"/><circle cx="${X+234}" cy="${Y+72}" r="20" fill="#8ED3CB"/>
   <path d="M${X-108} ${Y+128}L${X-92} ${Y+70}L${X-76} ${Y+128}Z" fill="#28336E"/><path d="M${X-124} ${Y+132}L${X-112} ${Y+88}L${X-100} ${Y+132}Z" fill="#28336E"/>
   <path d="M${X+262} ${Y+120}L${X+276} ${Y+66}L${X+290} ${Y+120}Z" fill="#28336E"/></g>
  <path d="M0 600C240 566 480 606 720 586C930 568 1150 548 1440 556V640H0Z" fill="#F4F4F9"/>
  <path d="M40 636C120 612 200 600 300 590S520 588 640 582S800 560 880 548S1000 486 1110 448" fill="none" stroke="#C9CCEB" stroke-width="5" stroke-dasharray="12 11" stroke-linecap="round"/>
  ${pins.map(([id,x,y,d])=>pin(x,y,id,{scale:1.25,delay:d})).join('')}
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
  ${pin(62,116,'Ро-03',{scale:.8})}${pin(122,118,'Ро-01',{scale:.8})}${pin(186,104,'Ро-05',{scale:.8})}${pin(246,96,'Ро-06',{scale:.8})}
  <rect x="50" y="138" width="90" height="8" rx="4" fill="#C9CCEB"/><rect x="50" y="48" width="120" height="10" rx="5" fill="#3B4A99"/>
  <rect x="130" y="180" width="40" height="22" fill="#28336E"/><rect x="100" y="198" width="100" height="8" rx="4" fill="#28336E"/></svg>`;}
function cardsArt(){const c=(x,y,r,id,title)=>{const t=T(id);return `<g transform="translate(${x} ${y}) rotate(${r})"><rect width="120" height="168" rx="12" fill="#fff"/><rect width="120" height="34" rx="12" fill="${t.color}"/><rect y="22" width="120" height="12" fill="${t.color}"/><circle cx="24" cy="17" r="10" fill="#fff"/><text x="24" y="21" text-anchor="middle" font-family="Montserrat,sans-serif" font-weight="800" font-size="8.5" fill="${t.color}">${t.abbr}</text><rect x="14" y="50" width="76" height="8" rx="4" fill="#1A1F45"/><rect x="14" y="68" width="92" height="5" rx="2.5" fill="#C9CCEB"/><rect x="14" y="80" width="84" height="5" rx="2.5" fill="#C9CCEB"/><rect x="14" y="92" width="88" height="5" rx="2.5" fill="#C9CCEB"/><rect x="14" y="128" width="92" height="26" rx="8" fill="#EEEFF8"/></g>`;};
  return `<svg viewBox="0 0 320 240" aria-hidden="true">${c(40,60,-14,'Ро-05')}${c(110,40,-2,'Ро-04')}${c(180,50,12,'Ро-01')}</svg>`;}

/* Декор для внутренних страниц: маршрут с тремя метками на холме. */
function pageDeco(ids=['Ро-03','Ро-01','Ро-05']){return `<svg viewBox="0 0 520 300" aria-hidden="true" focusable="false"><circle cx="360" cy="120" r="110" fill="rgba(255,255,255,.07)"/>
  <path d="M0 300V230C120 190 240 220 330 196C420 172 470 150 520 150V300Z" fill="rgba(255,255,255,.12)"/>
  <path d="M40 270C140 240 220 250 300 222S440 180 500 176" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="4" stroke-dasharray="10 9" stroke-linecap="round"/>
  ${pin(120,250,ids[0],{scale:1.1,delay:.1})}${pin(290,228,ids[1],{scale:1.1,delay:.25})}${pin(450,182,ids[2],{scale:1.1,delay:.4})}
  ${star(470,60,11,'#fff','twinkle')}${star(220,90,7,'rgba(255,255,255,.7)')}</svg>`;}

function badge(typeId,cls=''){const t=T(typeId);return `<span class="badge ${cls}" style="--c:${t.color};--i:${t.ink}" title="${t.title}">${t.abbr}</span>`;}

root.PEDAGOG_ART={mark,pin,star,heroScene,ribbons,ridge,screenArt,cardsArt,pageDeco,badge};
})(globalThis);
