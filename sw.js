const cacheName = "flogo"
const appFiles = [
    "index.html",
    "pwa.js",
    "app.js",
    "flogo.js",
    "flogo-flowchart.js",
    "sw.js",
    "lib/jsep.iife.min.js",
    "lib/konva.min.js",
    "lib/svgcanvas.min.js",
    "style.css",
    "fonts/NotoSans-Bold.woff2",
    "fonts/NotoSans-Regular.woff2",
    "fonts/RobotoMono-Regular.woff2",
    "lib/material-design-icons/sharp.css",
    "lib/material-design-icons/material-icons-sharp.woff2",
    "images/favicon.png",
    "images/pwaicon.png",
    "images/pwaicon_mono.png",
    "images/logo_large.webp",
    "themes/default_dark.css",
    "themes/default_light.css",
    "themes/alchemy_dark.css",
    "themes/colorful_light.css",
    "themes/sakura_light.css",
    "themes/glass_dark.css",
    "themes/eink_light.css",
    "themes/colors.webp",
    "themes/blossoms.svg",
    "themes/alchemy.svg",
    "themes/Caveat-Regular.woff2",
    "themes/Cinzel-Medium.woff2",
    "LICENSE.txt",
    "manifest.json",
]

// Caches all the PWA shell files (appFiles array) when the app is launched
self.addEventListener("install", (e) => {
    console.log("[Service Worker] Install")
    const filesUpdate = (cache) => {
        const stack = []
        appFiles.forEach((file) => stack.push(cache.add(file).catch((_) => console.error(`can't load ${file} to cache`))))
        return Promise.all(stack)
    }
    e.waitUntil(caches.open(cacheName).then(filesUpdate))
})

// Called when the app fetches a resource like an image, caches it automatically except for pwaversion.txt, which is always fetched
self.addEventListener("fetch", (e) => {
    if (e.request.url.indexOf("pwaversion.txt") != -1) {
        e.respondWith(
            (async () => {
                const response = await fetch(e.request)
                return response
            })(),
        )
    } else {
        e.respondWith(
            (async () => {
                const r = await caches.match(e.request)
                console.log(`[Service Worker] Fetching resource: ${e.request.url}`)
                if (r) {
                    return r
                }
                const response = await fetch(e.request)
                const cache = await caches.open(cacheName)
                console.log(`[Service Worker] Caching new resource: ${e.request.url}`)
                cache.put(e.request, response.clone())
                return response
            })(),
        )
    }
})

// Called when the service worker is started
self.addEventListener("activate", (e) => {
    console.log("[Service Worker] Activated")
})
