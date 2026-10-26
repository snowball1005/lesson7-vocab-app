// Requires Playwright + Chromium. Run: node tests/browser.cjs
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.join(root,pathname.endsWith('/')?pathname+'index.html':pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(file)]||'text/plain'});res.end(err?'missing':data)})});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,channel:'chromium',args:['--no-sandbox']});
 try{
 const context=await browser.newContext();const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+'/science/');await page.evaluate(async()=>{await navigator.serviceWorker.ready;await caches.open('science-study-offline-v2')});
 await page.getByRole('button',{name:'공부 시작하기 →'}).click();
 await page.locator('[data-term-index="0"]').click();assert.equal(await page.locator('#term0').textContent(),'주요 에너지원');
 await page.goto(base+'/');await page.evaluate(async()=>{await navigator.serviceWorker.ready});
 assert.equal(await page.evaluate(async()=> (await caches.keys()).includes('science-study-offline-v2')),true);
 await page.evaluate(()=>{localStorage.setItem('eng_7_misses',JSON.stringify({spell0:2,w0a:3}));localStorage.removeItem('eng_7_v2_migrated');localStorage.removeItem('eng_7_v2_misses');localStorage.removeItem('eng_7_v2_stats')});
 await page.reload();await page.evaluate(()=>startWrong());
 // highest-priority old word miss first, then type-preserving spelling review directly.
 await page.evaluate(()=>begin([spellingQs().find(q=>q.w==='actually')],'오답 복습'));
 await page.locator('#spellInput').fill('actually');await page.locator('#spellConfirm').click();
 await page.evaluate(()=>checkSpell());assert.equal(await page.evaluate(()=>score),1);
 assert.equal(await page.evaluate(()=>getMisses()['l7-words-actually:spell']),1);
 await page.getByRole('button',{name:'Lesson 8',exact:false}).click();
 await page.waitForTimeout(1000);assert.match(await page.locator('#app').textContent(),/오늘 무엇을/);
 await context.setOffline(true);await page.reload();assert.match(await page.locator('#app').textContent(),/오늘 무엇을/);
 await page.locator('button[onclick="startMode(\'words\')"]').click();assert.equal(await page.locator('.opts button').count(),4);
 await page.goto(base+'/science/');assert.match(await page.locator('#main').textContent(),/영양소/);
 await page.locator('[data-term-index="0"]').click();assert.equal(await page.locator('#term0').textContent(),'주요 에너지원');
 assert.deepEqual(errors,[]);console.log('PASS: cards, migration, spelling lock, navigation cancellation, both offline apps, cache isolation; no page errors');
 await context.close();
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>server.close());
