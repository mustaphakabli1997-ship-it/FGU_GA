/* ============================================================
   قالب متجر ملابس نسائية — ملف الإعداد الوحيد الذي تحتاج تعديله
   Women's fashion store template — the only file you need to edit
   ============================================================ */
window.STORE = {
  brand: { name: "Melina", sub: "MODE", logo: "images/logo.png", tagline: "Élégance discrète" },

  // الألوان (غيّرها لتغيير مظهر المتجر كله)
  colors: {
    primary: "#F8DDE3",   // اللون الأساسي (وردي)
    ink:     "#1A1A1A",   // النصوص والأزرار
    accent:  "#C4A78F",   // اللون المميز (بيج)
    bg:      "#FAF8F3",   // خلفية الصفحة
    white:   "#FFFFFF"
  },

  whatsapp: "213550000000",          // رقم واتساب لاستقبال الطلبات (دولي بدون +) — غيّريه!
  currency: "DA",
  instagram: "https://instagram.com/",
  ga4: "",                           // مثال: "G-XXXXXXXXXX" (اتركه فارغًا إن لم تستعمله)

  // الطلب
  order: {
    deliveryFee: 600,                       // سعر التوصيل لباب المنزل (دج) لكل الولايات
    payment: "الدفع عند الاستلام"
  },

  // Tous les textes (français)
  lang: "fr", locale: "fr-FR", dir: "ltr",
  t: {
    announce: "Paiement à la livraison — Livraison à domicile 600 DA",
    heroTitle: "Choisissez votre modèle et commandez facilement",
    heroText: "Touchez un modèle, choisissez la couleur et la taille, puis remplissez vos informations. Paiement à la livraison.",
    all: "Tout",
    price: "Prix",
    color: "Couleur",
    size: "Taille",
    qty: "Quantité",
    orderNow: "Commander",
    orderTitle: "Informations de commande",
    name: "Nom complet",
    wilaya: "Wilaya",
    wilayaPick: "Choisissez la wilaya",
    commune: "Commune",
    phone: "Numéro de téléphone",
    phoneBad: "Entrez un numéro valide (ex : 0550123456)",
    required: "Veuillez remplir tous les champs",
    cod: "Paiement à la livraison",
    delivery: "Livraison à domicile",
    productsTotal: "Prix du produit",
    total: "Total",
    confirm: "Confirmer la commande",
    orderIntro: "Nouvelle commande :",
    openWa: "Si WhatsApp ne s'ouvre pas, touchez ici pour envoyer la commande",
    thanksTitle: "Votre commande est prête",
    thanksText: "Nous vous contacterons bientôt pour la confirmer.",
    close: "Fermer",
    contact: "Contactez-nous sur WhatsApp"
  },

  // أسماء الألوان (تظهر في رسالة الطلب). أضيفي لونك هنا إن أضفتِ لونًا جديدًا
  colorNames: {
    "#C4A78F": "Beige", "#EDE3D6": "Crème", "#F3CBD5": "Rose", "#D9C5B0": "Sable",
    "#1A1A1A": "Noir", "#F8DDE3": "Rose clair", "#FFFFFF": "Blanc"
  },

  // المجموعات
  categories: [
    { id: "linen", name: "Lin",  tone: "#C4A78F", image: "images/linen.jpg" },
    { id: "silk",  name: "Satin", tone: "#F3CBD5", image: "images/satin.jpg" },
    { id: "sets",  name: "Ensembles",   tone: "#E4D6C8" }
  ],

  // المنتجات: أضيفي منتجاتك هنا. image اختياري (مثال: "images/p1.jpg")
  products: [
    { id: "p1", cat: "linen", name: "Pantalon large en lin", price: 4200, sizes: ["S","M","L","XL"], colors: ["#C4A78F","#EDE3D6"], tone: "#D9C5B0", image: "" },
    { id: "p2", cat: "silk",  name: "Chemise en satin",                price: 3800, sizes: ["S","M","L"],      colors: ["#F3CBD5","#EFE6DA"], tone: "#F3CBD5", image: "" },
    { id: "p3", cat: "sets",  name: "Ensemble deux pièces en lin",   price: 7500, sizes: ["M","L","XL"],     colors: ["#D9C5B0","#1A1A1A"], tone: "#E4D6C8", image: "" },
    { id: "p4", cat: "silk",  name: "Robe longue en satin",     price: 6900, sizes: ["S","M","L"],      colors: ["#F8DDE3","#C4A78F"], tone: "#F8DDE3", image: "" },
    { id: "p5", cat: "linen", name: "Veste légère en lin",    price: 5600, sizes: ["M","L"],          colors: ["#C4A78F"],           tone: "#CDB59C", image: "" },
    { id: "p6", cat: "sets",  name: "Ensemble satin d'intérieur",     price: 4900, sizes: ["S","M","L","XL"], colors: ["#F3CBD5","#FFFFFF"], tone: "#F6D5DC", image: "" }
  ]

  ,
  wilayas: ["Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar", "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla", "Oran", "El Bayadh", "Illizi", "Bordj Bou Arréridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent", "Ghardaïa", "Relizane", "Timimoun", "Bordj Badji Mokhtar", "Ouled Djellal", "Béni Abbès", "In Salah", "In Guezzam", "Touggourt", "Djanet", "El M'Ghair", "El Meniaa"]
};
