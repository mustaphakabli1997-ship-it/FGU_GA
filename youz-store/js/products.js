/* ==========================================================================
   YOUZ — catalogue produits
   Pour ajouter un modèle : copiez un bloc ci-dessous, changez l'id (unique,
   sans espaces), le nom, le prix et les images (dossier assets/products/).
   Lien direct d'un produit (pour vos pubs) :  produit.html?id=<id>

   ⚠ Les images et prix ci-dessous sont des EXEMPLES — remplacez-les par vos
     vraies photos et vos vrais prix.
   ========================================================================== */
(function () {
  var SIZES = [39, 40, 41, 42, 43, 44, 45];
  var FEATURES = [
    "Semelle épaisse amortissante",
    "Empiècements effet chrome",
    "Maille respirante, confort toute la journée",
    "Look streetwear signé YOUZ"
  ];
  var DESC =
    "Sneaker chunky aux empiècements argentés effet chrome. Semelle épaisse " +
    "ultra-amortissante, maille respirante et finitions soignées : le look " +
    "streetwear qui se remarque.";

  var NOIR = [{ name: "Noir / Argent", hex: "#141416" }];
  var GRIS = [{ name: "Gris / Argent", hex: "#8b8c93" }];

  window.YOUZ_PRODUCTS = [
    {
      id: "phantom-chrome", name: "YOUZ Phantom Chrome",
      price: 8900, oldPrice: 11900, badge: "limited", tags: ["limited", "new", "noir"],
      colors: NOIR, sizes: SIZES, soldOutSizes: [45],
      images: ["assets/products/main.jpg", "assets/products/look-1.jpg", "assets/products/look-2.jpg"],
      short: DESC, features: FEATURES
    },
    {
      id: "night-runner", name: "YOUZ Night Runner",
      price: 7900, oldPrice: 0, badge: "new", tags: ["new", "noir"],
      colors: NOIR, sizes: SIZES, soldOutSizes: [],
      images: ["assets/products/p1.jpg"], short: DESC, features: FEATURES
    },
    {
      id: "midnight-mesh", name: "YOUZ Midnight Mesh",
      price: 7500, oldPrice: 0, badge: "", tags: ["noir"],
      colors: NOIR, sizes: SIZES, soldOutSizes: [39],
      images: ["assets/products/p2.jpg"], short: DESC, features: FEATURES
    },
    {
      id: "ghost-grey", name: "YOUZ Ghost Grey",
      price: 7500, oldPrice: 8900, badge: "new", tags: ["new", "gris"],
      colors: GRIS, sizes: SIZES, soldOutSizes: [],
      images: ["assets/products/p3.jpg"], short: DESC, features: FEATURES
    },
    {
      id: "shadow-v2", name: "YOUZ Shadow V2",
      price: 8200, oldPrice: 0, badge: "limited", tags: ["limited", "noir"],
      colors: NOIR, sizes: SIZES, soldOutSizes: [40, 45],
      images: ["assets/products/p4.jpg"], short: DESC, features: FEATURES
    },
    {
      id: "steel-wave", name: "YOUZ Steel Wave",
      price: 6900, oldPrice: 0, badge: "", tags: ["noir"],
      colors: NOIR, sizes: SIZES, soldOutSizes: [],
      images: ["assets/products/p5.jpg"], short: DESC, features: FEATURES
    },
    {
      id: "titan-grey", name: "YOUZ Titan Grey",
      price: 6900, oldPrice: 0, badge: "", tags: ["gris"],
      colors: GRIS, sizes: SIZES, soldOutSizes: SIZES.slice(), soldOut: true,
      images: ["assets/products/p6.jpg"], short: DESC, features: FEATURES
    },
    {
      id: "dark-matter", name: "YOUZ Dark Matter",
      price: 7200, oldPrice: 0, badge: "new", tags: ["new", "noir"],
      colors: NOIR, sizes: SIZES, soldOutSizes: [],
      images: ["assets/products/p7.jpg"], short: DESC, features: FEATURES
    }
  ];
})();
