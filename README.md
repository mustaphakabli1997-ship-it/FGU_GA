# YOUZ Streetwear — Thème Shopify

ثيم Shopify (Online Store 2.0) بالفرنسية لمتجر **YOUZ** للأحذية: تصميم فخم بهوية اللوقو (أسود · فضي كروم · أبيض)، **الدفع عند الاستلام فقط (لا دفع بالبطاقة)**، وتوصيل بسعر ثابت لـ 58 ولاية.

الملف الجاهز للرفع: **`youz-shopify-theme.zip`**

## ما الذي فيه
- **الصفحة الرئيسية**: Hero · شريط الالتزامات · شبكة المنتجات · قسم Le drop · شريط YOUZ الكبير · Comment commander ·
  **Passer commande** (فورم الطلب مباشرة في الصفحة الرئيسية مع اختيار الموديل) · **Modes de paiement** · Livraison · FAQ.
- **صفحة المنتج**: معرض صور + اختيار المقاس/اللون + **فورم الطلب** (الاسم، الهاتف، الولاية الـ58، البلدية، domicile / Stop Desk، العنوان) مع ملخص حي للثمن.
- **الدفع**: يُذكر بوضوح في كل مكان (Hero، الفورم، قسم خاص، FAQ، الفوتر): **«Paiement à la livraison uniquement — pas de paiement par carte»**.
- **التوصيل (سعر ثابت لكل الولايات)**: **Stop Desk 400 DA · À domicile 600 DA**.
- مكان الطلب في الرابط: الرئيسية `/#passer-commande` — صفحة المنتج `…/products/<handle>#commande` (هذا الرابط تضعه في الإعلانات) — اختيار موديل مسبق: `/?model=<handle>#passer-commande`.

## كيف يعمل الفورم
الزبون يملأ الفورم ← الثيم يفرغ السلة ويحوّله إلى **checkout Shopify** عبر
[cart permalink](https://shopify.dev/docs/apps/build/checkout/create-cart-permalinks) يحتوي على: المتغيّر المختار + **سطر «Frais de livraison»** (400 أو 600 DA) +
معلومات الزبون معبّأة مسبقًا + `attributes`/`note` (Nom, Téléphone, Wilaya, Commune, Livraison, Paiement) تظهر داخل الطلب في لوحة Shopify.
الزبون يضغط مرة واحدة على «Compléter la commande» (الدفع عند الاستلام) فيُنشأ الطلب في Shopify مع المخزون والإشعارات وتطبيقات شركات التوصيل.

## التثبيت (≈ 15 دقيقة)

### 1) رفع الثيم
Shopify Admin ← **Boutique en ligne → Thèmes → Ajouter un thème → Importer un fichier zip** ← `youz-shopify-theme.zip` ← **Personnaliser** ← جرّب المعاينة ثم **Publier**.

### 2) إنشاء منتج «Frais de livraison» (ضروري)
Produits ← Ajouter un produit:
- العنوان: `Frais de livraison` — والـ handle (رابط المنتج) يجب أن يكون **`frais-de-livraison`**
- Option باسم `Frais` ولها **variantان فقط** بهذين السعرين بالضبط: **400 DA** و **600 DA**
- ألغِ تتبّع المخزون، وألغِ «Ce produit est un produit physique»
- يجب أن يكون **منشورًا في Boutique en ligne** (وإلا لا يمكن إضافته للسلة). لا تضعه في أي collection؛ الثيم يخفيه من الشبكات والبحث.

> إذا لم يوجد هذا المنتج: الفورم يعمل لكنه **لا يضيف** رسوم التوصيل للطلب (ويكتب تحذيرًا في console المتصفح).
> إذا غيّرت السعرين في *Paramètres du thème → Formulaire COD et livraison* أنشئ variants بنفس الأسعار الجديدة.

### 3) إعدادات المتجر (مرة واحدة) — لضمان «لا دفع بالبطاقة»
- **Paramètres → Paiements**: **لا تفعّل** Shopify Payments ولا PayPal ولا أي بوابة بطاقات. فعّل فقط **Modes de paiement manuels → Paiement à la livraison (COD)**،
  وسمّها «Paiement à la livraison (espèces)» مع التعليمات: «Payez en espèces à la réception de votre colis. Aucun paiement par carte.»
- **Paramètres → Expédition et livraison**: للجزائر أضف سعر شحن واحدًا اسمه «Livraison» بقيمة **0 DA** (الرسوم الفعلية 400/600 موجودة كسطر منتج).
- **Paramètres → Checkout**: رقم الهاتف في عنوان الشحن «Obligatoire»، وطريقة اتصال الزبون «Numéro de téléphone ou e-mail».
- **Paramètres → Général**: عملة المتجر `DZD`.

### 4) المنتجات
- في كل منتج: Option باسم **`Pointure`** (39 … 45) واختياريًا Option ثانية **`Couleur`**. الثيم يعتبر الخيارات التي اسمها pointure / taille / size خيار مقاس ويجبر الزبون على اختياره.
- Tags اختيارية لشارات البطاقة: `limited` ← Limited Edition · `new` أو `nouveau` ← Nouveau. المنتج غير المتوفر يظهر Sold out تلقائيًا ويختفي من فورم الرئيسية.
- أضف صورتين أو أكثر لكل منتج: الصورة الثانية تظهر عند مرور الماوس على البطاقة.
- السعر القديم في «Prix comparé» يُظهر التخفيض.

### 5) تخصيص الثيم (Personnaliser)
- **Paramètres du thème**: اللوقو، favicon، صورة المشاركة، رقم WhatsApp، الهاتف، Instagram/TikTok/Facebook، سعر التوصيل (400/600)، التوصيل المجاني من مبلغ معيّن.
- **الصفحة الرئيسية**: كل الأقسام قابلة للتعديل والترتيب. في الـ Hero اختر «Produit vedette»؛ وفي «Passer commande» اختر الـ collection التي تظهر موديلاتها في الفورم.
- صور قسم Le drop الافتراضية أمثلة — بدّلها بصور YOUZ الحقيقية. نص FAQ ومدة التوصيل وسياسة الاستبدال (7 أيام) أمثلة — عدّلها حسب شروطك.

## ما تم اختباره / ما لم يُختبر
- ✅ **Shopify Theme Check**: 0 أخطاء (تحذيرات RemoteAsset فقط بسبب خط Inter من Google Fonts).
- ✅ عرض كل القوالب بمحرك Liquid ببيانات تشبه Shopify + اختبار الفورم في متصفح (39 فحصًا): التحقق، الموديلات المتعددة، Pointure+Couleur، 400/600 DA، Stop Desk، التوصيل المجاني، رابط الـ checkout الناتج، الجوال بدون scroll أفقي.
- ⚠ **لم يُرفع إلى متجر Shopify حقيقي** من طرفي. بعد الرفع جرّب طلبًا تجريبيًا وتأكد في الـ checkout من: السطرين (المنتج + Frais de livraison)، تعبئة العنوان، وأن طريقة الدفع الوحيدة هي COD.
- ⚠ الـ checkout يعبّأ مسبقًا بالاسم/العنوان/المدينة/البلد. حقل **الهاتف** غير مذكور رسميًا ضمن بارامترات cart permalink فقد لا يُعبَّأ، لكنه يصل دائمًا في `attributes` الطلب. وإن كان Shopify يطلب حقل «Province» للجزائر فسيختارها الزبون في الـ checkout (الولاية موجودة أيضًا في `address2` والـ attributes).
- ⚠ الطلب لا يُنشأ إلا بعد أن يكمل الزبون الـ checkout (نقرة واحدة): ثيم بدون تطبيق/خادم لا يستطيع إنشاء طلب مباشرة.
- الصور والأسعار في المعاينة أمثلة؛ المنتجات الحقيقية تُنشأ من لوحة Shopify.
