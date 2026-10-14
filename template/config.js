/* ============================================================
   قالب متجر ملابس نسائية — ملف الإعداد الوحيد الذي تحتاج تعديله
   Women's fashion store template — the only file you need to edit
   ============================================================ */
window.STORE = {
  brand: { name: "Melina", sub: "MODE", tagline: { ar: "أناقة هادئة", en: "Quiet elegance" } },

  // الألوان (غيّرها لتغيير مظهر المتجر كله)
  colors: {
    primary: "#F8DDE3",   // اللون الأساسي (وردي)
    ink:     "#1A1A1A",   // النصوص والأزرار
    accent:  "#C4A78F",   // اللون المميز (بيج)
    bg:      "#FAF8F3",   // خلفية الصفحة
    white:   "#FFFFFF"
  },

  defaultLang: "ar",                 // "ar" أو "en"
  whatsapp: "213550000000",          // رقم واتساب بالصيغة الدولية بدون + (مثال: 213550000000)
  currency: { ar: "دج", en: "DZD" },
  instagram: "https://instagram.com/",
  ga4: "",                           // مثال: "G-XXXXXXXXXX" (اتركه فارغًا إن لم تستعمله)

  // اللغات: كل النصوص هنا
  i18n: {
    ar: {
      announce: "اطلبي الآن عبر واتساب — توصيل لكل الولايات",
      nav: ["الرئيسية", "المجموعات", "جديدنا", "تواصلي معنا"],
      heroTitle: "أناقة تلبسينها كل يوم",
      heroText: "قطع من الكتان والساتان بألوان هادئة، مفصّلة لتدوم.",
      heroCta: "تسوّقي الآن",
      collections: "المجموعات",
      arrivals: "وصل حديثًا",
      all: "الكل",
      add: "أضيفي للسلة",
      size: "المقاس",
      color: "اللون",
      cart: "السلة",
      empty: "سلتك فارغة",
      total: "المجموع",
      name: "الاسم",
      phone: "رقم الهاتف",
      address: "الولاية والعنوان",
      order: "أرسلي الطلب عبر واتساب",
      orderIntro: "سلام، حبيت نطلب:",
      features: [
        ["توصيل لكل الولايات", "يُضبط حسب متجرك"],
        ["الدفع عند الاستلام", "يُضبط حسب متجرك"],
        ["استبدال المقاس", "يُضبط حسب متجرك"]
      ],
      ctaTitle: "عندك سؤال؟ كلّمينا على واتساب",
      ctaBtn: "ابدئي المحادثة",
      rights: "جميع الحقوق محفوظة",
      required: "من فضلك املئي الاسم والهاتف والعنوان"
    },
    en: {
      announce: "Order now on WhatsApp — delivery nationwide",
      nav: ["Home", "Collections", "New in", "Contact"],
      heroTitle: "Elegance for every day",
      heroText: "Linen and satin pieces in soft tones, made to last.",
      heroCta: "Shop now",
      collections: "Collections",
      arrivals: "New arrivals",
      all: "All",
      add: "Add to bag",
      size: "Size",
      color: "Color",
      cart: "Your bag",
      empty: "Your bag is empty",
      total: "Total",
      name: "Name",
      phone: "Phone",
      address: "City & address",
      order: "Send order on WhatsApp",
      orderIntro: "Hello, I'd like to order:",
      features: [
        ["Nationwide delivery", "Edit to match your store"],
        ["Cash on delivery", "Edit to match your store"],
        ["Size exchange", "Edit to match your store"]
      ],
      ctaTitle: "Questions? Chat with us on WhatsApp",
      ctaBtn: "Start chat",
      rights: "All rights reserved",
      required: "Please fill in name, phone and address"
    }
  },

  // المجموعات
  categories: [
    { id: "linen", name: { ar: "كتان", en: "Linen" },  tone: "#C4A78F" },
    { id: "silk",  name: { ar: "ساتان", en: "Satin" }, tone: "#F3CBD5" },
    { id: "sets",  name: { ar: "أطقم", en: "Sets" },   tone: "#E4D6C8" }
  ],

  // المنتجات: أضيفي منتجاتك هنا. image اختياري (مثال: "images/p1.jpg")
  products: [
    { id: "p1", cat: "linen", name: { ar: "بنطلون كتان واسع", en: "Wide linen trousers" }, price: 4200, sizes: ["S","M","L","XL"], colors: ["#C4A78F","#EDE3D6"], tone: "#D9C5B0", image: "" },
    { id: "p2", cat: "silk",  name: { ar: "قميص ساتان", en: "Satin shirt" },                price: 3800, sizes: ["S","M","L"],      colors: ["#F3CBD5","#EFE6DA"], tone: "#F3CBD5", image: "" },
    { id: "p3", cat: "sets",  name: { ar: "طقم كتان قطعتين", en: "Two-piece linen set" },   price: 7500, sizes: ["M","L","XL"],     colors: ["#D9C5B0","#1A1A1A"], tone: "#E4D6C8", image: "" },
    { id: "p4", cat: "silk",  name: { ar: "فستان ساتان طويل", en: "Long satin dress" },     price: 6900, sizes: ["S","M","L"],      colors: ["#F8DDE3","#C4A78F"], tone: "#F8DDE3", image: "" },
    { id: "p5", cat: "linen", name: { ar: "جاكيت كتان خفيف", en: "Light linen jacket" },    price: 5600, sizes: ["M","L"],          colors: ["#C4A78F"],           tone: "#CDB59C", image: "" },
    { id: "p6", cat: "sets",  name: { ar: "طقم ساتان للمنزل", en: "Satin lounge set" },     price: 4900, sizes: ["S","M","L","XL"], colors: ["#F3CBD5","#FFFFFF"], tone: "#F6D5DC", image: "" }
  ]
};
