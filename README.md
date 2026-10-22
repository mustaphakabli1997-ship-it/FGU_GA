# YOUZ Streetwear — Thème Shopify + import des produits

ثيم Shopify (Online Store 2.0) بالفرنسية لمتجر **YOUZ**: تصميم فخم بهوية اللوقو (أسود · فضي كروم · أبيض)، **الدفع عند الاستلام فقط (لا دفع بالبطاقة)**، وتوصيل بسعر ثابت لـ 58 ولاية.

الملفان الجاهزان:
| الملف | الدور |
|---|---|
| **`youz-shopify-theme.zip`** | الثيم — يُرفع من Boutique en ligne ← Thèmes |
| **`import/produits-youz.csv`** | منتجاتك الحقيقية (أسماء، أسعار، ألوان، مقاسات، صور) + منتج «Frais de livraison» — يُستورد من Produits ← Importer |

## ما الذي فيه
- **الصفحة الرئيسية**: Hero · شريط الالتزامات · شبكة المنتجات · قسم Le drop · شريط YOUZ الكبير · Comment commander ·
  **Passer commande** (فورم الطلب مباشرة في الرئيسية مع اختيار الموديل) · **Modes de paiement** · Livraison · FAQ.
- **صفحة المنتج**: معرض صور + اختيار اللون (تتغير الصورة حسب اللون) والمقاس + **فورم الطلب** (الاسم، الهاتف، الولاية الـ58، البلدية، domicile / Stop Desk، العنوان) مع ملخص حي للثمن.
- **الدفع**: يُذكر بوضوح في كل مكان: **«Paiement à la livraison uniquement — pas de paiement par carte»**، ولا دفع مسبق.
- **التوصيل (سعر ثابت لكل الولايات)**: **Stop Desk 400 DA · À domicile 600 DA**.
- نصوص FAQ مبنية على سياسات متجرك الحالي: الاتصال خلال 24 ساعة، التوصيل 2–7 أيام حسب الولاية، فاتورة موقّعة ومختومة، تعويض المنتج المعطوب.
- مكان الطلب في الرابط: الرئيسية `/#passer-commande` — صفحة المنتج `…/products/<handle>#commande` (هذا الرابط تضعه في الإعلانات) — اختيار موديل مسبق: `/?model=<handle>#passer-commande`.

## كيف يعمل الفورم
الزبون يملأ الفورم ← الثيم يفرغ السلة ويحوّله إلى **checkout Shopify** عبر
[cart permalink](https://shopify.dev/docs/apps/build/checkout/create-cart-permalinks) يحتوي على: المتغيّر المختار + **سطر «Frais de livraison»** (400 أو 600 DA) +
معلومات الزبون معبّأة مسبقًا + `attributes`/`note` (Nom, Téléphone, Wilaya, Commune, Livraison, Paiement) تظهر داخل الطلب في لوحة Shopify.
الزبون يضغط مرة واحدة على «Compléter la commande» (الدفع عند الاستلام) فيُنشأ الطلب في Shopify مع الإشعارات وتطبيقات شركات التوصيل.

## التثبيت (≈ 20 دقيقة)

### 1) استيراد المنتجات (يُنشئ أيضًا منتج «Frais de livraison»)
Shopify Admin ← **Produits → Importer** ← اختر `import/produits-youz.csv` ← **Importer**.
الملف يطابق موقعك الحالي **حرفيًا** (12 منتجًا من 12، بلا أي حذف أو تعديل): نفس الأسماء، الأسعار، الأسعار القديمة (Prix comparé)، المقاسات، الألوان، وكل الصور (كل لون بصورته):

| المنتج | السعر / القديم | المقاسات | الألوان | الحالة |
|---|---|---|---|---|
| Sabot | 1 600 / 2 300 | 40 → 44 | Noir, Beige | منشور |
| Trappeur Hermes | 2 700 / 3 500 | 39 → 44 | Noir, Beige, Tabac, Marron | منشور |
| Mind 001 | 2 200 / 4 200 | 37 → 42 | Noir, Blanc | منشور |
| Adidas Campus | 2 700 / 3 500 | 39 → 44 | Noir, Beige/blanc, Beige/noir, Gris | منشور |
| Sabot (الثاني) | 2 300 / 3 200 | 40 → 45 | Noir/Orange, Noir/Gris, Gris/Noir | منشور |
| Hermes Bouncing | 2 800 / 3 800 | 40 → 44 | Noir, Beige, Bleu | منشور |
| Nike Air Force | 3 000 / 4 200 | 40 → 44 | Gris | منشور |
| New Balance 740 | 2 600 / 3 500 | 36 → 44 | Noir, Bleu nuit, Rose | منشور |
| Mind 001 (الثاني) | 2 200 / 4 200 | 37 → 42 | Noir, Blanc | منشور |
| Sabot UGG | 2 200 / 3 200 | 36 → 40 | Noir, Vert, Camel, Beige, Marron | Brouillon (مخفي كما في موقعك) |
| ASICS GEL NYC | 5 500 / 7 000 | 40 → 44 | Noir, Vert, Gris | Brouillon (مخفي كما في موقعك) |
| NIKE DUNK | 2 200 / 4 200 | 35 → 40 | Noir, Beige, Marron, Gris | Brouillon (مخفي كما في موقعك) |

- المنتجات الثلاثة المخفية في موقعك الحالي تُستورد **كمسودة** (غير ظاهرة للزبائن) — انشرها من Shopify متى شئت.
- منتج **`frais-de-livraison`** (منشور) بـ variantين: Stop Desk = 400 DA و À domicile = 600 DA. **لا تحذفه ولا تغيّر handle ولا السعرين** — الفورم يعتمد عليه.
- الأوصاف: ترجمة فرنسية لوصفك العربي مع إبقاء النص العربي الأصلي تحتها.
- المخزون غير متتبَّع (المنتجات دائمًا متوفرة) لأن أرقام الكمية في موقعك القديم غير موثوقة (قيم سالبة). فعّل تتبع المخزون في كل منتج إن أردت.
- الصور تُجلب أثناء الاستيراد من روابط Foorweb ثم تُنسخ إلى Shopify: **استورد قبل أن تغلق/تحذف موقع Foorweb القديم**.
- يوجد منتجان باسم «Sabot» ومنتجان باسم «Mind 001» (كما في موقعك). إن أردت تمييزهما للزبون غيّر الاسم في Shopify.

### 2) رفع الثيم
**Boutique en ligne → Thèmes → Ajouter un thème → Importer un fichier zip** ← `youz-shopify-theme.zip` ← **Personnaliser** ← جرّب المعاينة ثم **Publier**.
في الـ Hero اختر «Produit vedette»، وفي «Passer commande» اختر الـ collection (الفارغ = كل المنتجات).

### 3) إعدادات المتجر (مرة واحدة) — لضمان «لا دفع بالبطاقة»
- **Paramètres → Paiements**: **لا تفعّل** Shopify Payments ولا PayPal ولا أي بوابة بطاقات. فعّل فقط **Modes de paiement manuels → Paiement à la livraison (COD)**،
  وسمّها «Paiement à la livraison (espèces)» مع التعليمات: «Payez en espèces à la réception de votre colis. Aucun paiement par carte.»
- **Paramètres → Expédition et livraison**: للجزائر أضف سعر شحن واحدًا اسمه «Livraison» بقيمة **0 DA** (الرسوم الفعلية 400/600 موجودة كسطر منتج).
- **Paramètres → Checkout**: رقم الهاتف في عنوان الشحن «Obligatoire»، وطريقة اتصال الزبون «Numéro de téléphone ou e-mail».
- **Paramètres → Général**: عملة المتجر `DZD`.

### 4) تخصيص الثيم (Personnaliser)
- **Paramètres du thème**: اللوقو، favicon، صورة المشاركة، **رقم WhatsApp** والهاتف و Instagram/TikTok/Facebook (فارغة عمدًا — لم أنسخ أرقام/روابط Foorweb لأنها ليست لك)، سعر التوصيل (400/600)، التوصيل المجاني من مبلغ معيّن.
- **الصفحة الرئيسية**: كل الأقسام قابلة للتعديل والترتيب. القوائم (Menu principal / Pied de page) من Navigation.
- شارات البطاقة اختيارية عبر Tags: `limited` ← Limited Edition · `new` أو `nouveau` ← Nouveau (غير مفعّلة افتراضيًا).

## ملاحظات
- **أسعار التوصيل**: طبّقت 400/600 لكل الولايات كما طلبت. في موقعك القديم بعض الولايات (الجنوب غالبًا) كانت أغلى (مثلاً 1000 DA للباب)؛ إن أردت تمييزها لا بد من تعديل بسيط في الثيم.
- **العلامات التجارية**: أسماء المنتجات تحمل علامات (Nike, Adidas, New Balance, Hermès, ASICS, UGG). Shopify قد يوقف المتاجر التي تستعمل علامات مسجَّلة دون ترخيص؛ تأكد من حقك في استعمالها.

## ما تم اختباره / ما لم يُختبر
- ✅ **Shopify Theme Check**: 0 أخطاء (تحذيرات RemoteAsset فقط بسبب خط Inter من Google Fonts).
- ✅ عرض كل القوالب بمحرك Liquid **ببياناتك الحقيقية** + اختبار الفورم في متصفح (ما يقارب 40 فحصًا): الموديلات، الألوان والمقاسات، تغيّر الصورة حسب اللون، 400/600 DA، Stop Desk، التوصيل المجاني، رابط الـ checkout الناتج، الجوال بدون scroll أفقي.
- ✅ ملف CSV: 201 سطر، لا تكرار في المتغيّرات (SKU/ألوان/مقاسات)، ترتيب الصور سليم، روابط الصور الـ68 تعمل.
- ⚠ **لم يُرفع/يُستورد في متجر Shopify حقيقي** من طرفي. بعد الاستيراد راجع منتجًا أو اثنين، ثم جرّب طلبًا تجريبيًا وتأكد في الـ checkout من: السطرين (المنتج + Frais de livraison)، تعبئة العنوان، وأن طريقة الدفع الوحيدة هي COD.
- ⚠ الـ checkout يعبّأ مسبقًا بالاسم/العنوان/المدينة/البلد. حقل **الهاتف** غير مذكور رسميًا ضمن بارامترات cart permalink فقد لا يُعبَّأ، لكنه يصل دائمًا في `attributes` الطلب. وإن طلب Shopify حقل «Province» للجزائر فسيختارها الزبون (الولاية موجودة أيضًا في `address2` والـ attributes).
- ⚠ الطلب لا يُنشأ إلا بعد أن يكمل الزبون الـ checkout (نقرة واحدة): ثيم بدون تطبيق/خادم لا يستطيع إنشاء طلب مباشرة.
