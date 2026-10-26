// Run: node --test tests/regression.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function app(seed={},override){
 const values={...seed},nodes={},timers=new Map();let next=0;
 const storage=override||{getItem:k=>values[k]??null,setItem:(k,v)=>values[k]=String(v)};
 const context={console,Map,localStorage:storage,document:{getElementById:id=>nodes[id]??={style:{},classList:{add(){}},addEventListener(){},focus(){}},querySelectorAll:()=>[],querySelector:()=>({prepend(){}}),createElement:()=>({setAttribute(){}})},window:{addEventListener(){}},navigator:{},setInterval:()=>1,clearInterval(){},setTimeout:f=>{timers.set(++next,f);return next},clearTimeout:id=>timers.delete(id)};
 vm.createContext(context);vm.runInContext(script,context);
 return {values,nodes,timers,run:code=>vm.runInContext(code,context)};
}
test('legacy misses/stats from both lessons migrate once; originals and stars survive',()=>{
 const seed={eng_stars:'17',eng_7_misses:'{"w0a":3,"spell1":2,"m0_0":1}',eng_7_stats:'{"w0a":{"seen":7,"correct":4}}',eng_8_misses:'{"w0b":2}'};
 const a=app(seed);
 assert.equal(a.run('getMisses()[DATA[7].words[0].id+":a"]'),3);
 assert.equal(a.run('getObject(keyStore("stats"))[DATA[7].words[0].id+":a"].seen'),7);
 assert.equal(a.values.eng_7_misses,seed.eng_7_misses);
 assert.equal(a.values.eng_stars,'17');
 a.run('healMiss(DATA[7].words[0].id+":a")');
 const b=app(a.values);
 assert.equal(b.run('getMisses()[DATA[7].words[0].id+":a"]'),2);
 b.run('chooseLesson("8")');assert.equal(b.run('getMisses()[DATA[8].words[0].id+":b"]'),2);
});
test('fixed IDs survive reordering; spelling misses stay typed in review',()=>{
 const a=app({eng_7_misses:'{"spell0":1}'});
 const id=a.run('DATA[7].words[0].id+":spell"');
 a.run('DATA[7].words.reverse();startWrong()');
 assert.equal(a.run('session[0].id'),id);assert.equal(a.run('session[0].w'),'actually');
 a.nodes.spellInput.value='wrong';a.run('checkSpell()');assert.equal(a.run(`getMisses()[${JSON.stringify(id)}]`),2);
 assert.equal(a.run('getObject(keyStore("stats"))[session[0].id].seen'),1);
 a.run('startWrong()');a.nodes.spellInput.value='actually';a.run('checkSpell()');assert.equal(a.run(`getMisses()[${JSON.stringify(id)}]`),1);
});
test('spelling submit is idempotent and switching lesson cancels delayed work',()=>{
 const a=app();a.run('startSpelling()');a.nodes.spellInput.value=a.run('session[0].w');
 a.run('checkSpell();checkSpell()');assert.equal(a.run('score'),1);assert.equal(a.values.eng_stars,'2');assert.equal(a.timers.size,1);
 const stale=[...a.timers.values()][0];a.run('chooseLesson("8")');stale();assert.equal(a.timers.size,0);assert.equal(a.run('qIndex'),0);assert.equal(a.run('lesson'),'8');
 a.run('startSpelling()');a.nodes.spellInput.value='wrong';a.run('checkSpell();showList()');assert.equal(a.timers.size,0);
});
test('null/corrupt saved values and blocked storage do not prevent startup',()=>{
 const a=app({eng_lesson:'99',eng_7_misses:'null',eng_7_stats:'[1]',eng_8_misses:'{'});assert.equal(a.run('lesson'),'7');assert.equal(a.run('Object.keys(getMisses()).length'),0);
 const b=app({}, {getItem(){throw Error('blocked')},setItem(){throw Error('quota')}});b.run('saveMiss("test");home()');assert.equal(b.run('getMisses().test'),1);
});
test('all question IDs are unique and all frozen legacy mappings resolve',()=>{
 const a=app();assert.equal(a.run(`Object.keys(DATA).every(l=>{lesson=l;const ids=reviewPool().map(q=>q.id);return new Set(ids).size===ids.length&&Object.values(LEGACY_IDS[l]).every(id=>ids.includes(id))})`),true);
});
test('English SW activation preserves science/unrelated caches and scopes requests',async()=>{
 const handlers={},deleted=[],handled=[];
 const c={URL,Response,console,self:{location:{href:'https://example.test/app/sw.js'},addEventListener:(n,f)=>handlers[n]=f,clients:{claim:async()=>{}},skipWaiting:async()=>{}},caches:{keys:async()=>['middle2-english-l7-l8-v3','science-study-offline-v2','other'],delete:async k=>deleted.push(k),open:async()=>({match:async()=>undefined,put:async()=>{}})},fetch:async()=>{throw Error('offline')}};
 vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'sw.js'),'utf8'),c);
 let work;handlers.activate({waitUntil:p=>work=p});await work;assert.deepEqual(deleted,['middle2-english-l7-l8-v3']);
 for(const [url,method] of [['https://example.test/app/science/','GET'],['https://else.test/a','GET'],['https://example.test/app/','POST']])handlers.fetch({request:{url,method},respondWith:()=>handled.push(url)});
 assert.equal(handled.length,0);
 let response;handlers.fetch({request:{url:'https://example.test/app/missing.png',method:'GET',mode:'no-cors'},respondWith:p=>response=p});assert.equal((await response).type,'error');
});
test('partial migration retries without replacing already-updated v2 records',()=>{
 const values={eng_7_misses:'{"w0a":3}',eng_7_stats:'{"w0a":{"seen":5,"correct":2}}'};let fail=true;
 const storage={getItem:k=>values[k]??null,setItem:(k,v)=>{if(k==='eng_7_v2_stats'&&fail)throw Error('quota');values[k]=String(v)}};
 const first=app({},storage);assert.equal(values.eng_7_v2_migrated,undefined);
 first.run('healMiss("l7-words-actually:a")');fail=false;
 const second=app({},storage);assert.equal(second.run('getMisses()["l7-words-actually:a"]'),2);assert.equal(values.eng_7_v2_migrated,'1');
});
test('science card buttons reveal each term via bound events',()=>{
 const code=fs.readFileSync(path.join(root,'science/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
 const nodes={},buttons=[0,1].map(i=>({dataset:{termIndex:String(i)}}));
 const c={console,Date,JSON,localStorage:{getItem:()=>null,setItem(){}},document:{querySelector:s=>nodes[s]??={},querySelectorAll:s=>s==='[data-term-index]'?buttons:[],getElementById:id=>nodes['#'+id]??={}},window:{scrollTo(){}},navigator:{}};
 vm.createContext(c);vm.runInContext(code,c);vm.runInContext('openDay("d1")',c);
 assert.doesNotMatch(nodes['#main'].innerHTML,/onclick="document.getElementById\('term/);
 buttons[0].onclick();buttons[1].onclick();assert.equal(nodes['#term0'].textContent,'주요 에너지원');assert.equal(nodes['#term1'].textContent,'근육·머리카락 등 몸 구성');
});
