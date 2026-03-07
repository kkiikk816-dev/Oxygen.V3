const cacheName = 'oxygen-v1.1.1'; // <-- غير هذا الرقم (مثلاً v1.2) في كل تحديث جديد
const assets = [
    'index.html',
    'style.css',
    'script.js',
    'manifest.json'
];

// تثبيت الخدمة وتخزين الملفات
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(cacheName).then(cache => {
            return cache.addAll(assets);
        }).then(() => self.skipWaiting()) // إجبار النسخة الجديدة على التفعيل فوراً
    );
});

// تنظيف الكاش القديم (مهم جداً!)
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== cacheName)
                    .map(key => caches.delete(key))
            );
        })
    );
});

// الاستجابة للطلبات
self.addEventListener('fetch', e => {
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
