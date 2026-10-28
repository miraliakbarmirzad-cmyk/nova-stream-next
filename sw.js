const CACHE='nova-stream-next-shell-v1';
const SHELL=['./','./index.html','./config.js','./manifest.webmanifest','./icon.svg'];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(SHELL))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(
        keys.filter(key=>key.startsWith('nova-stream-next-shell-')&&key!==CACHE)
          .map(key=>caches.delete(key))
      ))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;

  const url=new URL(req.url);
  const isShell=['/','/index.html','/config.js','/manifest.webmanifest','/icon.svg']
    .some(path=>url.pathname.endsWith(path));
  if(!isShell)return;

  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const response=await fetch(req,{cache:'no-cache'});
      if(response.ok)await cache.put(req,response.clone());
      return response;
    }catch(error){
      const cached=await cache.match(req);
      if(cached)return cached;
      return new Response('Offline: reconnect to load NOVA STREAM.',{
        status:503,
        headers:{'Content-Type':'text/plain; charset=utf-8'}
      });
    }
  })());
});
