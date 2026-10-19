# Maison D'Arabie — ثيم Shopify لمتجر العطور الأصلية

ثيم Shopify (Online Store 2.0) بالهوية البصرية تاع **Maison D'Arabie Parfums**: أسود، ذهبي (من `#c9ab6f` للبرونزي)، عاجي ورملي،
شعار **MA** داخل النجمة الثمانية، وزخارف الأقواس والأرابيسك. مصمم لمتجر **عطور أصلية** (ماركة وحدة أو عدة ماركات).

> هذا المجلد هو **مصدر** الثيم. الملف اللي ترفعه لـShopify هو `maison-darabie-shopify-theme.zip`
> (ملفات الثيم في **جذر** الـzip: `layout/`, `sections/`, `templates/`… مباشرة، وليس داخل مجلد).

## 1) رفع الثيم
**Boutique en ligne ← Thèmes ← Importer ← Charger un fichier zip** ← اختر الملف ← **… ← Publier**
(أو **Personnaliser / Modifier le thème** لتجربته قبل النشر).

## 2) إضافة العطور (الأهم)
**Produits ← Ajouter un produit**:

| الحقل | شنو تكتب |
|---|---|
| Titre / Description / Photos | اسم العطر، وصفه، صور **مربعة 1:1** (فلاكون على خلفية بيضاء تعطي أحسن نتيجة) |
| **Variantes ← option `Contenance`** | القيم: `50 ml`، `100 ml`… ولكل واحدة سعرها. تظهر أزرار (pills) فوق «Ajouter au panier» |
| **Fournisseur** | اسم الماركة. إذا كان نفس اسم المتجر **ما يظهرش** (مثلا كل العطور Maison D'Arabie) |
| **Balises (Tags)** | بطاقة العطر: انظر الجدول الجاي |

### بطاقة العطر عبر الـTags (بدون أي إعداد)
اكتب هذه الـtags في خانة **Balises** (الفاصلة بين الواحد والآخر):

```
Genre:Homme, Famille:Oud, Concentration:Eau de parfum, Tête:Safran / Bergamote, Cœur:Rose / Oud, Fond:Ambre / Musc
```

| Tag | وين يظهر |
|---|---|
| `Genre:` (Homme / Femme / Mixte) | خانة «Pour» في صفحة المنتج + سطر صغير تحت الإسم في البطاقة |
| `Famille:` (Oud, Floral, Boisé, Ambré…) | خانة «Famille» + البطاقة |
| `Concentration:` | خانة «Concentration» |
| `Tête:` / `Cœur:` / `Fond:` | صندوق **Notes olfactives** (3 مراحل) في صفحة المنتج |

أي حاجة ما تكتبهاش ما تظهرش (ما كاين لا فراغات ولا أخطاء). تقدر بدل الـtags تستعمل **Metafields** بالأسماء
`custom.genre`, `custom.famille`, `custom.concentration`, `custom.notes_tete`, `custom.notes_coeur`, `custom.notes_fond`.

## 3) الأقسام (Collections)
- أنشئ collections: **Homme**, **Femme**, **Mixte**, **Oud & Ambré**… وضع لكل واحدة صورة.
- سهل: collection **Automatisée** بشرط «La balise du produit est égale à» `Genre:Homme` — وكل عطر جديد يدخل وحده.
- قسم **Univers (arches)** في الصفحة الرئيسية يعرضها في أقواس. بدون اختيار يستعمل أول 4 collections فيها منتجات.
- **فلاتر صفحة القسم** (الماركة، السعر، التوفر…): تنشأ من تطبيق **Search & Discovery** (مجاني من Shopify). الثيم يعرضها وحده.
- **Contenu ← Menus**: القائمة `main-menu` تظهر في الهيدر (وفي القائمة الجانبية للموبايل)، و`footer` في أسفل الصفحة.

## 4) الصفحة الرئيسية (Personnaliser)
كل قسم يتعدل ويتنقل ويتحذف بدون كود:
**Héro** (صورة عطر داخل قوس + ختم دوّار «100% Original») ← **Bandeau défilant** ← **Univers (arches)** ←
**Produits à la une** ← **Parfum signature** ← **Atouts** ← **Bannière image** ← **Questions fréquentes** ← **Citation** ← **Newsletter**.

- **Héro ← Photo du parfum**: ارفع صورة عمودية. بدونها تظهر رسمة فلاكونين Maison D'Arabie (مؤقتة).
- أقسام إضافية متوفرة من «Ajouter une section»: **Nos marques** (بلاطات الماركات، رابطها يعرض كل منتجات الـFournisseur)،
  **Avis clients**، **Applications**.
- **تنبيه الآراء**: ما تحطش إلا آراء **حقيقية** من زبائنك. نصوص الأسئلة الشائعة الافتراضية عامة، عدّلها حسب سياستك (التوصيل، الإرجاع…).
- الألوان والشعار وواتساب والسوشيال: **Paramètres du thème**. رقم واتساب يقبل `0550…` أو `+213550…` أو `00213550…` ويحوّله وحده لصيغة `wa.me` الصحيحة.

## 5) صفحة المنتج
الصفحة مبنية من **بلوكات** تقدر تعيد ترتيبها: العنوان، السعر، البطاقة، الوصف، اختيار الحجم، الشراء، Notes olfactives، الأتواتو،
أوراق قابلة للطي (Livraison / Authenticité…)، واتساب.
- **تطبيق نموذج الطلب COD** (مثل WEBI LeadForm وغيره): في صفحة المنتج داخل Personnaliser ← **Ajouter un bloc ← Applications** ← اختر التطبيق.
  إذا تحب النموذج وحده بدون زر السلة، احذف بلوك «Quantité et achat».
- **Cadrage de la photo**: `Flacon entier` لصور الفلاكون على خلفية بيضاء (تندمج مع الخلفية العاجية)، أو `Remplir le cadre` لصور الأجواء.
- ختم «100 % Original» على الصورة: يتعطل من **Paramètres du thème ← Produits**.

## 6) السلة وهدية العطر
- سلة جانبية (أو صفحة) فيها شريط التوصيل المجاني (الرقم من الإعدادات، للعرض فقط).
- **Emballage cadeau**: خانة + ملاحظة/رسالة هدية. تظهر في تفاصيل الطلب كـ«Emballage cadeau: Oui». يتعطل من الإعدادات.

## 7) العربية (RTL) والإيميل
- أضف العربية: **Paramètres ← Langues**. يظهر زر اللغة في الهيدر، والواجهة (السلة، المنتج، البحث…) جاهزة بالفرنسية والعربية.
  نصوص الأقسام (الهيرو…) تترجمها بتطبيق **Translate & Adapt**.
- **صفحة Contact**: أنشئ صفحة في **Contenu ← Pages** واختر لها القالب `page.contact`.
- النشرة اختيارية (قسم «Rejoignez la Maison» وأسفل الصفحات). المشترك يتسجل في **Clients** بوسم `newsletter`؛
  الإرسال يدوي من **Marketing ← Shopify Email**.

## 8) CSS للتطبيقات
**Paramètres du thème ← CSS personnalisé**: ألصق CSS لتنسيق أي تطبيق (مثل نموذج COD) بألوان الهوية:
الذهبي `#c9ab6f`، الأسود `#101010`، العاجي `#faf5ea`.

## ملاحظات صريحة
- **الفحص**: الثيم يعدي أداة Shopify الرسمية **Theme Check بـ0 أخطاء و0 تحذيرات**، وجرّبته محلياً بمحاكاة Liquid ببيانات وهمية
  (الرئيسية، المنتج واختيار الحجم، السلة الجانبية والهدية، القسم، العربية، الموبايل) مع اختبارات متصفح (22 اختبار نجحوا).
  **ما رفعتهوش على متجر Shopify حقيقي**، فراجع كل صفحة بعد الرفع، خاصة مع تطبيق COD تاعك.
- **الشعار** محوّل لـSVG من الصورة اللي بعثتها (نفس الرسمة). لأعلى دقة ارفع الملف الأصلي من **Paramètres du thème ← Logo**.
- **رسمة الفلاكونين** في الهيرو مجرد مكان مؤقت مبني على الملصق الموجود في لوحة الهوية. الصور الحقيقية لعطورك تعوضها.
- الألوان أخذتها من لوحة الهوية (`#101010` أسود، `#c9ab6f` ذهبي، `#b88c4b` برونز، `#deccb4` رملي) ويتبدلوا من الإعدادات.
- صفحات حسابات الزبائن (login/register) غير مضمّنة لأن الحسابات الجديدة تستضيفها Shopify نفسها.
- نصوص «توصيل 58 ولاية» و«الدفع عند الاستلام» نصوص افتراضية؛ عدّلها حسب سياسة المتجر الفعلية.
- لا تعرض شعارات الماركات الأخرى أو صور حملاتها بدون ترخيص.

## التطوير
```bash
npx @shopify/cli theme dev --store <متجرك>.myshopify.com    # معاينة مباشرة
npx @shopify/cli theme check                                # فحص الثيم
```
