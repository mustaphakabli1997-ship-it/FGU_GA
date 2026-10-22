/**
 * YOUZ — réception des commandes dans Google Sheets
 *
 * Installation (5 minutes) :
 *  1. Créez un Google Sheet vide  →  Extensions  →  Apps Script.
 *  2. Collez ce fichier à la place du code existant, puis Enregistrer.
 *  3. (Optionnel) Renseignez NOTIFY_EMAIL pour recevoir un e-mail à chaque commande.
 *  4. Déployer  →  Nouveau déploiement  →  type « Application Web » :
 *        Exécuter en tant que : Moi
 *        Qui a accès         : Tout le monde
 *  5. Autorisez l'accès, copiez l'URL « …/exec » et collez-la dans
 *     js/config.js  →  orderEndpoint.
 *
 * ⚠ Après chaque modification de ce script : Déployer → Gérer les déploiements →
 *   Modifier → Nouvelle version.
 */

var SHEET_NAME = "Commandes";
var NOTIFY_EMAIL = "";   // ex. "vous@gmail.com" ("" = pas d'e-mail)

var HEADERS = [
  "Date", "N° commande", "Statut", "Nom", "Téléphone", "Wilaya", "Commune",
  "Livraison", "Adresse", "Modèle", "Pointure", "Couleur", "Qté",
  "Sous-total (DA)", "Frais livraison (DA)", "Total à encaisser (DA)", "Page"
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var d = JSON.parse(e.postData.contents);

    var sheet = getSheet_();
    sheet.appendRow([
      new Date(),
      safe_(d.orderId),
      "Nouvelle",
      safe_(d.name),
      "'" + safe_(d.phone),                 // l'apostrophe garde le 0 initial
      safe_(d.wilayaCode + " - " + d.wilaya),
      safe_(d.commune),
      safe_(d.deliveryType),
      safe_(d.address),
      safe_(d.productName),
      safe_(d.size),
      safe_(d.color),
      Number(d.qty) || 1,
      Number(d.subtotal) || 0,
      Number(d.deliveryFee) || 0,
      Number(d.total) || 0,
      safe_(d.page)
    ]);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(
        NOTIFY_EMAIL,
        "Nouvelle commande " + d.orderId + " — " + d.total + " DA",
        [
          d.name + " — " + d.phone,
          d.wilaya + " / " + d.commune + " (" + d.deliveryType + ")",
          d.productName + " · pointure " + d.size + " × " + d.qty,
          "Total à encaisser : " + d.total + " DA"
        ].join("\n")
      );
    }
    return json_({ ok: true, orderId: d.orderId });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

/** Test rapide : ouvrir l'URL /exec dans le navigateur doit afficher OK. */
function doGet() {
  return ContentService.createTextOutput("YOUZ orders endpoint — OK");
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#111111").setFontColor("#ffffff");
  }
  return sheet;
}

/** Neutralise l'injection de formules (=, +, -, @) dans les cellules. */
function safe_(v) {
  var s = String(v == null ? "" : v).slice(0, 300);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
