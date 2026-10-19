const fs=require('fs'),path=require('path');
const root=__dirname;
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+fs.readFileSync(path.join(root,'style.css'),'utf8')+'</style>');
for(const name of ['deck.js','app.js'])html=html.replace(`<script src="${name}"></script>`,'<script>'+fs.readFileSync(path.join(root,name),'utf8').replace(/<\/script/gi,'<\\/script')+'</script>');
fs.writeFileSync(path.join(root,'PEDAGOG_v2.html'),html);
console.log('Standalone HTML generated: '+Buffer.byteLength(html)+' bytes');
