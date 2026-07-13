const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. إنشاء قاعدة بيانات SQLite تلقائياً في نفس المجلد
const db = new sqlite3.Database(process.env.NODE_ENV === 'production' ? '/data/novastyle.db' : './novastyle.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to Nova Style database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullname TEXT NOT NULL,
        phone TEXT NOT NULL,
        city TEXT NOT NULL,
        address TEXT NOT NULL,
        notes TEXT,
        status TEXT DEFAULT 'جديد',
        date TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
});

// 2. روابط التحكم وقاعدة البيانات (APIs)
app.post('/api/orders', (req, res) => {
    const { fullname, phone, city, address, notes } = req.body;
    const query = `INSERT INTO orders (fullname, phone, city, address, notes) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [fullname, phone, city, address, notes], function(err) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, orderId: this.lastID });
    });
});

app.get('/api/admin/orders', (req, res) => {
    const { search, city, status } = req.query;
    let query = `SELECT * FROM orders WHERE 1=1`;
    let params = [];
    if (search) { query += ` AND (fullname LIKE ? OR phone LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
    if (city) { query += ` AND city LIKE ?`; params.push(`%${city}%`); }
    if (status) { query += ` AND status = ?`; params.push(status); }
    query += ` ORDER BY id DESC`;
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.put('/api/admin/orders/:id', (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    db.run(`UPDATE orders SET status = ? WHERE id = ?`, [status, id], (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});

// 3. واجهة المتجر الرئيسية (مطابقة تماماً للصورة)
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nova Style | الرئيسية</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
    <style>body { font-family: 'Cairo', sans-serif; }</style>
</head>
<body class="bg-gray-50 text-gray-800">
    <div class="bg-purple-900 text-white text-center py-2 text-xs md:text-sm font-medium">🚚 التوصيل لجميع المدن في ليبيا والدفع عند الاستلام</div>
    <header class="bg-white shadow-sm sticky top-0 z-40 border-b">
        <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <div class="text-2xl font-black tracking-widest text-purple-950">NOVA <span class="text-gray-400 font-light text-xl">STYLE</span></div>
            <nav class="hidden md:flex space-x-6 space-x-reverse text-sm font-bold text-gray-600">
                <a href="/" class="text-purple-700 border-b-2 border-purple-700 pb-1">الرئيسية</a>
                <a href="#" class="hover:text-purple-700">المنتجات</a>
                <a href="#" class="hover:text-purple-700">العروض</a>
                <a href="/admin" class="text-red-500 font-bold hover:underline">⚠️ لوحة الإدارة</a>
            </nav>
            <div class="flex items-center space-x-4 space-x-reverse text-xl cursor-pointer">👤 ❤️ <span>👜</span></div>
        </div>
    </header>
    <section class="max-w-6xl mx-auto px-4 mt-6">
        <div class="bg-purple-50 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between border border-purple-100">
            <div class="space-y-4 max-w-lg text-center md:text-right">
                <span class="text-purple-700 font-bold text-lg block">أناقتك تميزك ♡</span>
                <h1 class="text-4xl md:text-6xl font-black text-purple-950">NOVA STYLE</h1>
                <p class="text-gray-600 text-sm">أحدث الأزياء النسائية وملايس الأطفال والإكسسوارات بافضل الأسعار وأعلى جودة</p>
                <button onclick="document.getElementById('products').scrollIntoView({ behavior: 'smooth' })" class="bg-purple-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg">تسوق الآن ❯</button>
            </div>
            <div class="w-full md:w-1/2 flex justify-center mt-6 md:mt-0">
                <div class="w-64 h-64 md:w-80 md:h-80 rounded-full bg-purple-200 border-4 border-white shadow-xl overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500" class="w-full h-full object-cover">
                </div>
            </div>
        </div>
    </section>
    <section class="max-w-6xl mx-auto px-4 mt-12">
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div class="bg-white border rounded-xl p-4 text-center"><div class="text-2xl mb-1">👗</div><span class="font-bold text-xs">ملابس نسائية</span></div>
            <div class="bg-white border rounded-xl p-4 text-center"><div class="text-2xl mb-1">👶</div><span class="font-bold text-xs">ملابس أطفال</span></div>
            <div class="bg-white border rounded-xl p-4 text-center"><div class="text-2xl mb-1">👜</div><span class="font-bold text-xs">حقائب</span></div>
            <div class="bg-white border rounded-xl p-4 text-center"><div class="text-2xl mb-1">💍</div><span class="font-bold text-xs">إكسسوارات</span></div>
            <div class="bg-white border rounded-xl p-4 text-center"><div class="text-2xl mb-1">👠</div><span class="font-bold text-xs">أحذية</span></div>
        </div>
    </section>
    <section id="products" class="max-w-6xl mx-auto px-4 mt-12 mb-12">
        <h2 class="text-xl font-bold text-gray-800 border-r-4 border-purple-700 pr-3 mb-6">الأكثر مبيعاً</h2>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div class="bg-white rounded-xl border p-3 flex flex-col justify-between">
                <img src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300" class="w-full h-40 object-cover rounded-lg">
                <h3 class="font-bold text-xs mt-2">فستان محتشم برباط خصر</h3>
                <div class="text-purple-950 font-black text-sm mt-1">120 د.ل</div>
                <button onclick="openModal('فستان محتشم')" class="w-full bg-purple-900 text-white text-xs py-1.5 rounded-md font-bold mt-2">🛒 اطلب الآن</button>
            </div>
            <div class="bg-white rounded-xl border p-3 flex flex-col justify-between">
                <img src="https://images.unsplash.com/photo-1622290319146-7b63df48a635?w=300" class="w-full h-40 object-cover rounded-lg">
                <h3 class="font-bold text-xs mt-2">فستان أطفال بناتي ناعم</h3>
                <div class="text-purple-950 font-black text-sm mt-1">85 د.ل</div>
                <button onclick="openModal('فستان أطفال')" class="w-full bg-purple-900 text-white text-xs py-1.5 rounded-md font-bold mt-2">🛒 اطلب الآن</button>
            </div>
            <div class="bg-white rounded-xl border p-3 flex flex-col justify-between">
                <img src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300" class="w-full h-40 object-cover rounded-lg">
                <h3 class="font-bold text-xs mt-2">شنطة كتف نسائية أنيقة</h3>
                <div class="text-purple-950 font-black text-sm mt-1">135 د.ل</div>
                <button onclick="openModal('شنطة كتف')" class="w-full bg-purple-900 text-white text-xs py-1.5 rounded-md font-bold mt-2">🛒 اطلب الآن</button>
            </div>
            <div class="bg-white rounded-xl border p-3 flex flex-col justify-between">
                <img src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300" class="w-full h-40 object-cover rounded-lg">
                <h3 class="font-bold text-xs mt-2">سوار ذهبي راقي</h3>
                <div class="text-purple-950 font-black text-sm mt-1">40 د.ل</div>
                <button onclick="openModal('سوار ذهبي')" class="w-full bg-purple-900 text-white text-xs py-1.5 rounded-md font-bold mt-2">🛒 اطلب الآن</button>
            </div>
            <div class="bg-white rounded-xl border p-3 flex flex-col justify-between">
                <img src="https://images.unsplash.com/photo-1622290319146-7b63df48a635?w=300" class="w-full h-40 object-cover rounded-lg">
                <h3 class="font-bold text-xs mt-2">طقم أولادي شتوي متكامل</h3>
                <div class="text-purple-950 font-black text-sm mt-1">110 د.ل</div>
                <button onclick="openModal('طقم شتوي')" class="w-full bg-purple-900 text-white text-xs py-1.5 rounded-md font-bold mt-2">🛒 اطلب الآن</button>
            </div>
        </div>
    </section>
    <div class="max-w-6xl mx-auto px-4 mb-8">
        <div class="bg-purple-800 text-white rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-center md:text-right">
            <div class="md:border-l border-purple-400 pb-4 md:pb-0 font-bold">🤝 الدفع عند الاستلام نقداً وعينياً</div>
            <div class="font-bold">🚚 توصيل سريع خلال 2-5 أيام لكل المدن</div>
        </div>
    </div>
    <div id="orderModal" class="fixed inset-0 bg-black bg-opacity-60 hidden flex items-center justify-center p-4 z-50">
        <div class="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl">
            <h3 class="text-lg font-bold text-purple-950 mb-3">✍️ نموذج الطلب المباشر السريع</h3>
            <form onsubmit="sendOrder(event)" class="space-y-3">
                <input type="text" id="fullname" placeholder="الاسم الكامل" required class="w-full border p-2.5 rounded-lg text-sm">
                <input type="tel" id="phone" placeholder="رقم الهاتف" required class="w-full border p-2.5 rounded-lg text-sm">
                <input type="text" id="city" placeholder="المدينة" required class="w-full border p-2.5 rounded-lg text-sm">
                <textarea id="address" placeholder="العنوان بالتفصيل" required class="w-full border p-2.5 rounded-lg text-sm h-16"></textarea>
                <div class="p-2.5 bg-green-50 text-green-800 text-xs font-bold rounded-lg">✅ الدفع عند الاستلام متاح فقط حالياً.</div>
                <div class="flex gap-2 pt-2">
                    <button type="submit" class="flex-1 bg-purple-900 text-white py-2 rounded-lg font-bold text-sm">تأكيد الطلب</button>
                    <button type="button" onclick="document.getElementById('orderModal').classList.add('hidden')" class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm">إلغاء</button>
                </div>
            </form>
        </div>
    </div>
    <script>
        let prod = "";
        function openModal(name) { prod = name; document.getElementById('orderModal').classList.remove('hidden'); }
        async function sendOrder(e) {
            e.preventDefault();
            const payload = { fullname: document.getElementById('fullname').value, phone: document.getElementById('phone').value, city: document.getElementById('city').value, address: document.getElementById('address').value, notes: "المنتج: " + prod };
            const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            if(data.success) { alert('🎉 تم إرسال طلبك بنجاح! رقم طلبك هو: #' + data.orderId); document.getElementById('orderModal').classList.add('hidden'); }
        }
    </script>
</body>
</html>
    `);
});

// 4. واجهة لوحة الإدارة الذكية للتتبع والبحث
app.get('/admin', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>لوحة التحكم | Nova Style</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-4 md:p-8">
    <div class="max-w-6xl mx-auto">
        <header class="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border"><h1 class="text-xl font-bold text-purple-900">📦 طلبات المتجر الحية</h1><a href="/" class="text-sm bg-gray-100 px-3 py-1.5 rounded-lg font-bold">❮ المتجر</a></header>
        <div class="bg-white p-4 rounded-xl border mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" id="search" oninput="load()" placeholder="بحث بالاسم أو الهاتف..." class="border p-2 rounded-lg text-sm outline-none">
            <input type="text" id="city" oninput="load()" placeholder="تصفية بالمدينة..." class="border p-2 rounded-lg text-sm outline-none">
            <select id="status" onchange="load()" class="border p-2 rounded-lg text-sm bg-white"><option value="">كل الطلبات</option><option value="جديد">جديد</option><option value="تم التأكيد">تم التأكيد</option><option value="تم التسليم">تم التسليم</option><option value="ملغي">ملغي</option></select>
        </div>
        <div class="bg-white rounded-xl border overflow-hidden"><table class="w-full text-right text-sm"><thead class="bg-gray-50 border-b"><tr><th class="p-4">رقم الطلب</th><th class="p-4">العميل</th><th class="p-4">الهاتف</th><th class="p-4">العنوان</th><th class="p-4">تفاصيل المنتج</th><th class="p-4">تغيير الحالة</th></tr></thead><tbody id="rows" class="divide-y"></tbody></table></div>
    </div>
    <script>
        async function load() {
            const res = await fetch(\`/api/admin/orders?search=\${document.getElementById('search').value}&city=\${document.getElementById('city').value}&status=\${document.getElementById('status').value}\`);
            const data = await res.json();
            const tbody = document.getElementById('rows'); tbody.innerHTML = '';
            data.forEach(o => {
                tbody.innerHTML += \`<tr><td class="p-4 font-bold">#\${o.id}</td><td class="p-4">\${o.fullname}</td><td class="p-4 font-mono">\${o.phone}</td><td class="p-4">\${o.city} - \${o.address}</td><td class="p-4 text-xs">\${o.notes}</td><td class="p-4"><select onchange="update(\${o.id}, this.value)" class="border p-1 rounded bg-purple-50 text-purple-900 font-bold text-xs"><option \${o.status==='جديد'?'selected':''} value="جديد">جديد</option><option \${o.status==='تم التأكيد'?'selected':''} value="تم التأكيد">تم التأكيد</option><option \${o.status==='تم التسليم'?'selected':''} value="تم التسليم">تم التسليم</option><option \${o.status==='ملغي'?'selected':''} value="ملغي">ملغي</option></select></td></tr>\`;
            });
        }
        async function update(id, status) { await fetch(\`/api/admin/orders/\${id}\`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); load(); }
        window.onload = load;
    </script>
</body>
</html>
    `);
});

app.listen(PORT, () => console.log(`Nova Style is fully operational on port ${PORT}`));
