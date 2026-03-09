const CACHE_NAME = 'oxygen-v3'; // غيّر الرقم مع كل إصدار جديد
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json'
];

// التثبيت: تخزين الملفات الأساسية
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting()) // تفعيل فوري بدون انتظار
    );
});

// التفعيل: حذف الـ Cache القديم
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim()) // تطبيق فوري على كل التبويبات
    );
});

// الطلبات: استراتيجية ذكية حسب نوع الملف
self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);

    // طلبات Supabase و Groq: الإنترنت دائماً (لا تُخزَّن)
    if (url.hostname.includes('supabase.co') || 
        url.hostname.includes('groq.com') ||
        url.hostname.includes('googleapis.com')) {
        e.respondWith(fetch(e.request));
        return;
    }

    // الملفات الثابتة: Cache أولاً، إنترنت للتحديث في الخلفية
    if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset.replace('/', '')))) {
        e.respondWith(
            caches.open(CACHE_NAME).then(async cache => {
                const cached = await cache.match(e.request);
                const fetchPromise = fetch(e.request).then(response => {
                    cache.put(e.request, response.clone()); // تحديث Cache في الخلفية
                    return response;
                }).catch(() => cached); // إذا فشل الإنترنت ارجع للـ Cache

                return cached || fetchPromise; // Cache للسرعة، تحديث في الخلفية
            })
        );
        return;
    }

    // باقي الطلبات: إنترنت أولاً، Cache كبديل
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
