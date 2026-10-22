# YOUZ Streetwear — Thème Shopify (فورم COD بالفرنسية)

ثيم Shopify (Online Store 2.0) بنفس تصميم الموقع: هوية YOUZ، صفحة رئيسية، صفحة منتج مع **فورم الطلب بالدفع عند الاستلام**، و58 ولاية مع أسعار توصيل حية.
الملف الجاهز للرفع: **`youz-shopify-theme.zip`** (في جذر المستودع).

## كيف يعمل الفورم
الزبون يملأ الفورم (الاسم، الهاتف، الولاية، البلدية، النوع: domicile / stop desk، المقاس…) ← الثيم يفرغ السلة ثم يحوّله إلى **checkout الخاص بـ Shopify** عبر
[cart permalink](https://shopify.dev/docs/apps/build/checkout/create-cart-permalinks) يحتوي على:
- المتغيّر (variant) المختار + الكمية
- **منتج «Frais de livraison»** بالسعر المناسب للولاية (يظهر كسطر في الطلب)
- معلومات الزبون معبّأة مسبقًا في عنوان الشحن
- `attributes` و `note` تظهر داخل الطلب في لوحة Shopify (Nom, Téléphone, Wilaya, Commune, Livraison, Paiement)

الزبون يضغط مرة واحدة على «Compléter la commande» (الدفع: عند الاستلام) فيُنشأ الطلب في Shopify مباشرة مع المخزون والإشعارات وتطبيقات شركات التوصيل.

## التثبيت (≈ 15 دقيقة)

### 1) رفع الثيم
Shopify Admin ← **Boutique en ligne → Thèmes → Ajouter un thème → Importer un fichier zip** ← اختر `youz-shopify-theme.zip` ← **Personnaliser** ثم **Publier** (جرّب المعاينة أولًا).

### 2) إنشاء منتج «Frais de livraison» (ضروري لحساب التوصيل)
Produits ← Ajouter un produit:
- العنوان: `Frais de livraison` — الـ handle (رابط المنتج) يجب أن يكون **`frais-de-livraison`**
- Option: `Frais` — بقيم (variants) وبهذه الأسعار بالضبط: **300 · 400 · 450 · 500 · 600 · 800 · 900 · 1300 DA**
  (هي أسعار التوصيل الافتراضية في الثيم؛ إذا غيّرت سعرًا في إعدادات الثيم أنشئ variant بنفس السعر)
- ألغِ تتبّع المخزون، وألغِ خيار «Ce produit est un produit physique»
- يجب أن يكون **منشورًا في Boutique en ligne** (وإلا لا يمكن إضافته للسلة). لا تضعه في أي collection؛ الثيم يخفيه من الشبكات والبحث.

> إذا لم يوجد هذا المنتج: الفورم يعمل لكنه **لا يضيف** أي رسوم توصيل للطلب (ويكتب تحذيرًا في console المتصفح).

### 3) إعدادات المتجر (مرة واحدة)
- **Paramètres → Expédition et livraison**: أضف للجزائر سعر شحن واحد اسمه «Livraison» بقيمة **0 DA** (لأن الرسوم الفعلية موجودة كسطر منتج).
- **Paramètres → Paiements → Modes de paiement manuels**: فعّل **Paiement à la livraison (COD)**.
- **Paramètres → Paiement/Checkout**: اجعل رقم الهاتف في عنوان الشحن «Obligatoire»، وطريقة الاتصال «Numéro de téléphone ou e-mail» (حتى لا يُطلب البريد من الزبون).
- **Paramètres → Général**: عملة المتجر `DZD`.

### 4) المنتجات
- في كل منتج: Option باسم **`Pointure`** (39 … 45) واختياريًا Option ثانية **`Couleur`**. الثيم يتعرف على كلمات pointure / taille / size فيجبر الزبون على اختيار المقاس.
- Tags اختيارية لشارات البطاقة: `limited` ← Limited Edition، `new` أو `nouveau` ← Nouveau. المنتج غير المتوفر يظهر Sold out تلقائيًا.
- ضع السعر القديم في «Prix comparé» لإظهار التخفيض.

### 5) تخصيص الثيم (Personnaliser)
- **Paramètres du thème**: logo، favicon، رقم WhatsApp، الهاتف، روابط Instagram/TikTok/Facebook، **أسعار التوصيل لكل منطقة**، التوصيل المجاني من مبلغ معيّن.
  (الولايات الـ58 وتوزيعها على المناطق A/B/C/D داخل `assets/youz-wilayas.js`.)
- **الصفحة الرئيسية**: كل الأقسام قابلة للتعديل/الترتيب (Hero، Engagements، Grille de produits، Le drop، Comment commander، Tarifs، FAQ).
  في الـ Hero اختر «Produit vedette». صور قسم Le drop الافتراضية أمثلة — بدّلها.
- القوائم: Menu principal و Pied de page من Navigation.

## ما تم اختباره / ما لم يُختبر
- ✅ **Shopify Theme Check**: 0 أخطاء (تحذيرات RemoteAsset فقط بسبب خط Inter من Google Fonts).
- ✅ عرض كل القوالب بمحرك Liquid ببيانات تشبه Shopify، واختبار الفورم في متصفح: التحقق، المتغيّرات المتعددة (Pointure+Couleur)، حساب التوصيل، الكمية، Stop Desk، التوصيل المجاني، رابط الـ checkout الناتج.
- ⚠ **لم يُرفع إلى متجر Shopify حقيقي** من طرفي. جرّب بعد الرفع: افتح صفحة منتج، املأ الفورم، وتأكد في الـ checkout من: السطرين (المنتج + Frais de livraison)، تعبئة العنوان، طريقة الدفع COD.
- ⚠ الـ checkout يعبّأ مسبقًا بالاسم/العنوان/المدينة/البلد. حقل **الهاتف** غير مذكور رسميًا ضمن بارامترات cart permalink، فإن لم يُعبَّأ سيكتبه الزبون؛ وعلى أي حال يصل الهاتف دائمًا في `attributes` الطلب. وإن كان Shopify يطلب حقل «Province/Wilaya» للجزائر فسيختارها الزبون في الـ checkout (الولاية موجودة أيضًا في عنوان الشحن `address2` والـ attributes).
- ⚠ الطلب لا يُنشأ إلا بعد أن يكمل الزبون الـ checkout (خطوة نقر واحدة). مثل كل حلول COD بدون تطبيق خارجي، لا يمكن لثيم إنشاء طلب مباشرة دون خادم/تطبيق.
- ⚠ نصوص FAQ ومدة التوصيل وسياسة الاستبدال (7 أيام) وأسعار التوصيل أمثلة؛ عدّلها حسب شروطك.
