// Read-only regression probes for the audited revision. These confirm defects, not fixes.
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=fs.existsSync(path.resolve(__dirname,'../../src/test.cjs'))?path.resolve(__dirname,'../../src'):path.resolve(__dirname,'../../pedagog-v2');
const fixture=fs.readFileSync(path.join(root,'test.cjs'),'utf8');
const checks=`
const probeResults=[];
vm.runInContext('state=null',ctx);els.format.value='90';els.people.value='12';els.caseSelect.value='С-17';els.consent.checked=true;els.start.onclick();els.next.onclick();els.next.onclick();
probeResults.push({id:'A01',case:'С-17',observed:els.stageTitle.textContent,defectConfirmed:els.stageTitle.textContent==='Первая попытка'});
vm.runInContext('state=null',ctx);els.caseSelect.value='С-04';els.start.onclick();
vm.runInContext('state.resource=by("situations",state.caseId).resourceIds[0];state.turn=by("situations",state.caseId).turnIds[0];advance(7)',ctx);
probeResults.push({id:'A05',observed:vm.runInContext('({stage:state.index,resource:state.resource,turn:state.turn})',ctx),defectConfirmed:vm.runInContext('Boolean(state.resource&&state.turn)',ctx)});
els.nextCase.value='С-16';els.applyCase.onclick();vm.runInContext('advance(-6)',ctx);
probeResults.push({id:'A06',observed:vm.runInContext('({stage:state.index,caseId:state.caseId})',ctx),defectConfirmed:vm.runInContext('state.index===1&&state.caseId==="С-16"',ctx)});
const doubles=d.situations.filter(c=>c.roleSets.some(rs=>new Set(rs).size!==rs.length)).map(c=>c.id);
probeResults.push({id:'A02',observed:doubles,defectConfirmed:doubles.length===3});
console.log(JSON.stringify(probeResults,null,2));
`;
vm.runInNewContext(fixture+checks,{require,console,__dirname:root,Blob,URL});
