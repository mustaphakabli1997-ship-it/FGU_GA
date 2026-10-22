/* ==========================================================================
   YOUZ — configuration de la boutique
   Modifiez uniquement ce fichier pour : contact, réseaux, livraison, commandes.
   ========================================================================== */
window.YOUZ_CONFIG = {
  brand: "YOUZ Streetwear",

  /* --- Contact ------------------------------------------------------------
     whatsapp : numéro au format international, SANS "+" ni espaces
                ex. "213550123456"  (laissez "" pour masquer les boutons WhatsApp)
     phone    : numéro affiché dans le pied de page (ex. "0550 12 34 56")        */
  whatsapp: "",
  phone: "",

  /* --- Réseaux sociaux (URL complète, "" = masqué) ----------------------- */
  social: {
    instagram: "",
    tiktok: "",
    facebook: ""
  },

  /* --- Réception des commandes -------------------------------------------
     URL de votre Google Apps Script (voir google-apps-script/Code.gs et le
     README). Tant que ce champ est vide, le site est en MODE DÉMO : le
     formulaire fonctionne mais la commande n'est enregistrée nulle part.     */
  orderEndpoint: "",

  /* --- Livraison -----------------------------------------------------------
     Tarifs en DA par zone (voir js/wilayas.js pour la zone de chaque wilaya).
     home = à domicile · desk = Stop Desk (bureau du transporteur)
     ⚠ Tarifs indicatifs : alignez-les sur votre société de livraison.        */
  delivery: {
    A: { label: "Alger & environs",          home: 450,  desk: 300 },
    B: { label: "Nord du pays",              home: 600,  desk: 400 },
    C: { label: "Hauts-Plateaux & Sud proche", home: 800,  desk: 500 },
    D: { label: "Grand Sud",                 home: 1300, desk: 900 }
  },
  /* Livraison offerte à partir de X DA d'achat (0 = désactivé) */
  freeDeliveryOver: 0,

  /* Bandeau défilant en haut du site */
  announcement: [
    "Livraison dans les 58 wilayas",
    "Paiement à la livraison",
    "Confirmation par téléphone",
    "Stock limité · Drops exclusifs"
  ]
};
