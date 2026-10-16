// ===== Edit this file only: salon info, services and prices =====
window.SALON = {
  name: "Melina Mode",
  tagline: "Coiffure & beauté pour femmes",
  whatsapp: "212600000000",        // international format, no + (bookings are sent here)
  address: "Votre adresse, Ville",
  currency: "DH",
  hours: { open: 10, close: 20, slotMinutes: 30, closedDays: [0] }, // 0 = Sunday
};

// price = DH, duration = minutes (placeholder values: replace with real ones)
window.SERVICES = [
  { cat: "Coiffure", items: [
    { id: "brushing-c", name: "Brushing cheveux courts", price: 60, duration: 30 },
    { id: "brushing-l", name: "Brushing cheveux longs", price: 100, duration: 45 },
    { id: "coupe", name: "Coupe", price: 120, duration: 45 },
    { id: "coiffure-soiree", name: "Coiffure de soirée", price: 250, duration: 60 },
  ]},
  { cat: "Couleur", items: [
    { id: "coloration", name: "Coloration racines", price: 250, duration: 90 },
    { id: "meches", name: "Mèches / Balayage", price: 600, duration: 150 },
  ]},
  { cat: "Soins", items: [
    { id: "keratine", name: "Lissage kératine", price: 800, duration: 180 },
    { id: "soin", name: "Soin profond", price: 150, duration: 45 },
    { id: "protéine", name: "Soin protéine", price: 200, duration: 60 },
  ]},
  { cat: "Beauté", items: [
    { id: "manucure", name: "Manucure", price: 100, duration: 45 },
    { id: "pedicure", name: "Pédicure", price: 120, duration: 60 },
    { id: "sourcils", name: "Épilation sourcils", price: 30, duration: 15 },
  ]},
];
