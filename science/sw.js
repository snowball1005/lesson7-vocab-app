/* 중2 과학 공부방 offline cache — scope: /science/ only */
const CACHE = 'science-study-offline-v2';
const CORE = ['./','./index.html','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('science-study-offline-')&&k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin||!url.pathname.startsWith(new URL('./',self.location.href).pathname))return;
 if(req.mode==='navigate'){
  event.respondWith((async()=>{
   try{
    const res=await fetch(req);
    if(res.ok){const cache=await caches.open(CACHE);await cache.put('./index.html',res.clone());}
    return res;
   }catch(e){
    return (await caches.match('./index.html'))||Response.error();
   }
  })());
  return;
 }
 event.respondWith((async()=>{
  const hit=await caches.match(req);
  if(hit)return hit;
  try{const res=await fetch(req);if(res.ok){(await caches.open(CACHE)).put(req,res.clone());}return res;}catch(e){return Response.error();}
 })());
});
