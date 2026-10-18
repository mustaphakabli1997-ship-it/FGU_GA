# Boutique Sekhri — Luxury Sportswear

متجر إلكتروني كامل لملابس الرجال (من 19 إلى 50 سنة) بالهوية البصرية تاع Boutique Sekhri:
أسود مات · فضي معدني · برتقالي نيون، خط Montserrat + Anton (بديل Impact) وشعار BS.

## وش كاين فيه

| | |
|---|---|
| **الواجهة** | صفحة رئيسية بهيرو متحرك، الأقسام، المنتجات، صفحة المنتج (ألوان/مقاسات)، السلة، الطلب، بحث، **فرنسي + عربي (RTL)** بزر واحد، موبايل أولاً |
| **الأقسام** | Ensembles · T-shirts & Polos · Sweats & Hoodies · Tricots · Vestes · Pantalons & Joggers · Shorts · Accessoires |
| **النشرة البريدية** | خانة الإيميل في 4 أماكن: نافذة تظهر للزائر الجديد، الصفحة الرئيسية، أسفل كل صفحة، وصفحة الطلب |
| **إيميل تلقائي** | كل ما تزيد منتج من لوحة التحكم → يوصل إيميل لكل المشتركين **بشعار Boutique Sekhri** + صورة المنتج + السعر + رابط مباشر، بلغة كل مشترك (FR/AR) |
| **الطلبات** | الدفع عند الاستلام، 58 ولاية، توصيل للمنزل أو نقطة استلام، إشعار إيميل للمالك |
| **لوحة التحكم** `/admin` | بالعربية: المنتجات (صور، ألوان، مقاسات، تخفيضات)، المشتركون (تصدير CSV)، الطلبات (تغيير الحالة)، الإيميلات (تجربة + سجل الحملات) |

## التشغيل

```bash
cd boutique-sekhri
npm install
cp .env.example .env      # ثم عدّل ADMIN_PASSWORD على الأقل
npm start                 # http://localhost:3000   —   الإدارة: http://localhost:3000/admin
```

بدون `ADMIN_PASSWORD` يولّد السيرفر كلمة سر مؤقتة ويكتبها في الـconsole (للتجربة فقط).
عند أول تشغيل تُنشأ **منتجات تجريبية** برسومات SVG؛ احذفها من لوحة التحكم أو ضع `SEED_DEMO=false`
قبل أول تشغيل. أول ما ترفع صور حقيقية للمنتج تعوّض الرسم تلقائياً.

## تفعيل الإيميل الحقيقي (مهم)

**بدون ضبط SMTP الإيميلات ما تتبعتش فعلياً.** يشتغل الموقع في «وضع المعاينة»: كل رسالة تتسجل في
`data/outbox/` (ملف `.html` تفتحه في المتصفح و`.eml`) وتشوفها من لوحة التحكم ← الإيميلات.
باش تبدأ الإرسال الحقيقي أضف في `.env`:

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
MAIL_FROM=Boutique Sekhri <contact@ton-domaine.dz>
SITE_URL=https://ton-domaine.dz
OWNER_EMAIL=ton@email.com
```

ثم أعد تشغيل السيرفر وأرسل **رسالة تجريبية** من لوحة التحكم ← الإيميلات.

- **اختيار الخدمة:** Gmail/Outlook يصلحوا للتجربة فقط (حدود يومية صغيرة ويدخلوا في السبام بسهولة).
  للإرسال الجدي استعمل خدمة إيميلات (Brevo, Mailjet, SendGrid, Amazon SES…) وفعّل SPF وDKIM على دومينك.
- كل إيميل فيه رابط **إلغاء الاشتراك** (وترويسة `List-Unsubscribe`)، والمُلغي ما يتبعتلوش بعد.
- الإرسال يتم واحد واحد مع فاصل `MAIL_DELAY_MS` وفي الخلفية، وتتابع التقدم من لوحة التحكم.
- الشعار يُرسل مدمجاً داخل الإيميل (CID) فيظهر حتى بدون رابط عام؛ صورة المنتج تُدمج إذا كانت JPG/PNG/WebP.

## كيفاش تزيد منتج

لوحة التحكم ← **المنتجات** ← «＋ منتج جديد» ← الاسم، الفئة، السعر (والسعر القديم للتخفيض)، المقاسات،
الألوان، الصور. خيار «📧 أرسل إيميل بالشعار لكل المشتركين» مفعّل افتراضياً عند الإضافة.
زر «📧 إرسال» في قائمة المنتجات يعيد إرسال إيميل عن منتج موجود.

## قبل ما تنشر — لازم تراجع

- **السياسات في النصوص:** «توصيل إلى 58 ولاية»، «الدفع عند الاستلام»، «توصيل مجاني ابتداءً من 15 000 دج»، وأسعار التوصيل
  700/450 دج هي **قيم افتراضية** (`SHIPPING_HOME`, `SHIPPING_DESK`, `FREE_SHIPPING_FROM` في `.env`). عدّلها حسب سياستك،
  وإذا ما توصّلش لكل الولايات عدّل النصوص في `public/js/i18n.js`.
- **المنتجات التجريبية** ووصفها وأسعارها مجرد مثال.
- **التواصل:** رقم واتساب/إنستغرام… يظهر في أسفل الموقع فقط إذا عمّرت `CONTACT_*`.
- **الخصوصية:** الموقع يجمع إيميلات وأرقام هواتف؛ أضف صفحة سياسة خصوصية حسب القانون الجزائري 18-07.

## النشر

أي استضافة Node.js (VPS، Render، Railway، Fly.io…):

1. `NODE_ENV=production` + `ADMIN_PASSWORD` + `SITE_URL=https://…` (+ `TRUST_PROXY=1` وراء proxy).
2. خلّي مجلد `data/` (أو `DATA_DIR`) على **قرص دائم** — فيه `db.json` (المنتجات، المشتركون، الطلبات) والصور المرفوعة.
   على الاستضافات اللي تمسح الملفات عند كل نشر، بدون قرص دائم تضيع البيانات.
3. `npm start` وراء HTTPS (nginx/Caddy/Cloudflare).
4. اعمل نسخة احتياطية دورية من `data/`.

قاعدة البيانات ملف JSON بسيط يكفي لمتجر صغير (آلاف المشتركين). إذا كبر المشروع انقل `lib/store.js` إلى SQLite/Postgres.

## الأمان (ملخص)

كلمة سر الإدارة تُقارن بـ`timingSafeEqual` وجلسة موقّعة بـHMAC في كوكي `HttpOnly` + `SameSite=Strict` (و`Secure` مع https)،
تحديد محاولات الدخول، فحص الأصل (Origin) لطلبات الكتابة، سياسة CSP صارمة، رفع الصور مفحوص بالـmagic bytes وبأسماء عشوائية،
الأسعار تُحسب في السيرفر دائماً (لا نثق في السلة)، الإيميلات تُهرَّب (escape)، وتصدير CSV يحمي من حقن الصيغ.

## بنية المشروع

```
server.js          نقطة التشغيل          app.js        مسارات Express (API + admin)
lib/store.js       قاعدة JSON             lib/mailer.js إرسال الإيميل + الحملات
lib/emails.js      قوالب الإيميل (FR/AR)  lib/validate.js التحقق من المدخلات
public/            الواجهة (index.html, admin.html, css/, js/, fonts/, assets/)
test/api.test.js   اختبارات API           npm test
```

## الاختبارات

```bash
npm test      # اشتراك، إيميل المنتج بالشعار، الطلبات، الأمان، رفع الصور…
```

---

### English summary

Node.js (Express) storefront + admin for *Boutique Sekhri*. Bilingual FR/AR (RTL), cash-on-delivery checkout for the 58
Algerian wilayas, newsletter signup in four places, and an **automatic branded email to every subscriber whenever a product
is added in `/admin`**. Emails are only actually delivered once `SMTP_HOST` (and credentials) are set; until then they are
written to `data/outbox` for preview. Run with `npm install && npm start`; see `.env.example` for all options.
