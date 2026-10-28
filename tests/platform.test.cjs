'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),cp=require('child_process');
const root=path.resolve(__dirname,'..');
const pages=['index','about','game','print','library','cards','rules','methods','author'];
const ctx={};vm.createContext(ctx);for(const f of ['src/deck.js','platform/metadata.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const d=ctx.PEDAGOG_DATA,ids=Object.values(d).filter(Array.isArray).flat().map(c=>c.id);
assert.equal(ids.length,62);assert.equal(new Set(ids).size,62);assert(!ids.includes('С-07'));
for(const c of d.situations){assert(c.theme&&c.difficulty&&c.competencies.length);for(const id of c.roleSets.flat())assert(d.roles.some(r=>r.id===id));for(const id of c.resourceIds)assert(d.resources.some(r=>r.id===id));for(const id of c.turnIds)assert(d.turns.some(r=>r.id===id));}
for(const p of pages){const html=fs.readFileSync(path.join(root,p+'.html'),'utf8');assert(/<html lang="ru"/.test(html));assert(html.includes('id="app"'));assert.equal((html.match(/<main\b/g)||[]).length,1);const tags=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(tags).size,tags.length,'duplicate IDs in '+p);for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){const u=m[1];if(/^(https?:|mailto:|tel:|#)/.test(u))continue;const file=decodeURIComponent(u.split(/[?#]/)[0]);assert(fs.existsSync(path.join(root,file)),`${p}: missing ${file}`);}assert(!html.includes('href="#session"'));}
for(const f of ['shared','metadata','catalog','engine','session','print'])cp.execFileSync(process.execPath,['--check',path.join(root,'platform',f+'.js')]);
const content=JSON.parse(fs.readFileSync(path.join(root,'platform/content.json'),'utf8'));
for(const p of ['about','rules','methods','author'])assert(content[p].length>1000);
assert(fs.readFileSync(path.join(root,'rules.html'),'utf8').includes('id="usage"'),'usage anchor');
assert(fs.readFileSync(path.join(root,'print.html'),'utf8').includes('src="print-pack.js"'));
console.log('PASS: 9 routes, local assets, unique anchors, metadata and 62 unchanged active card IDs, JS syntax.');

// All navigation on a nested 404 must resolve from the Pages project root.
const missing=fs.readFileSync(path.join(root,'404.html'),'utf8');
for(const m of missing.matchAll(/(?:href|src)="([^"]+)"/g))assert(/^(#|https?:|\/pedagog\/)/.test(m[1]),'relative 404 link: '+m[1]);
// Validate in-page destinations too, including cards rendered by JavaScript.
for(const page of pages){const html=fs.readFileSync(path.join(root,page+'.html'),'utf8');for(const m of html.matchAll(/href="([^"#]*)#([^" ]+)"/g)){if(/^https?:/.test(m[1]))continue;const target=(m[1].split('?')[0]||page+'.html');const id=decodeURIComponent(m[2]);const content=fs.readFileSync(path.join(root,target),'utf8');assert(content.includes('id="'+id+'"')||(['library.html','cards.html'].includes(target)&&ids.includes(id)),page+': missing anchor '+target+'#'+id);}}
console.log('Nested 404 navigation and all static cross-page anchors passed.');
