const PREFIX='middle2-english-l7-l8-';
const CACHE=PREFIX+'v4';
const BASE=new URL('./',self.location.href);
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname)||url.pathname.startsWith(new URL('science/',BASE).pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const res=await fetch(req);
   if(res.ok){try{await cache.put(req,res.clone())}catch(error){console.warn('영어 캐시 저장 실패',error)}}
   return res;
  }catch(error){
   const hit=await cache.match(req);
   if(hit)return hit;
   if(req.mode==='navigate')return (await cache.match(new URL('index.html',BASE).href))||Response.error();
   return Response.error();
  }
 })());
});
