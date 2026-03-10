const CACHE_NAME = 'oxygen-v1.2.0'; // 🔥 غيّر هذا الرقم مع كل تحديث
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json'
];

// ✅ التثبيت: تخزين الملفات الجديدة
self.addEventListener('install', e => {
    console.log('📦 Service Worker: تثبيت إصدار جديد...');
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// ✅ التفعيل: حذف Cache القديم وإرسال رسالة للمستخدم
self.addEventListener('activate', e => {
    console.log('🚀 Service Worker: تفعيل الإصدار الجديد...');
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log('🗑️ حذف Cache القديم:', key);
                        return caches.delete(key);
                    })
            )
        ).then(() => {
            self.clients.claim();
            // 🔔 إرسال رسالة لجميع الصفحات المفتوحة
            return self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'UPDATE_AVAILABLE',
                        version: CACHE_NAME
                    });
                });
            });
        })
    );
});

// ✅ الطلبات: نفس الكود السابق
self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);

    if (url.hostname.includes('supabase.co') || 
        url.hostname.includes('groq.com') ||
        url.hostname.includes('googleapis.com')) {
        e.respondWith(fetch(e.request));
        return;
    }

    if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset.replace('/', '')))) {
        e.respondWith(
            caches.open(CACHE_NAME).then(async cache => {
                const cached = await cache.match(e.request);
                const fetchPromise = fetch(e.request).then(response => {
                    cache.put(e.request, response.clone());
                    return response;
                }).catch(() => cached);

                return cached || fetchPromise;
            })
        );
        return;
    }

    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
