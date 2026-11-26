/* Universal bundle from modular ES6 sources (config.js, adminService.js, odooService.js, admin.js, app.js) */
(function() {
"use strict";

// === SOURCE: config.js ===
/**
 * @file config.js
 * @description Configuración maestra, constantes de impresión Gelato 8x8",
 * semillas de prompts (Master Style Lock), reglas de precios/envíos,
 * diccionario bilingüe (ES/EN) y estructura de las 8 páginas de RoxyTales.
 */

const STORY_ASSETS_REGISTRY = {
  my_first_christmas_24p: {
    slug: "my_first_christmas_24p",
    layoutsBasePath: "./assets/stories/my_first_christmas_24p/layouts",
    spritesBasePath: "./assets/sprites",
    babyTestSprite: "./assets/sprites/baby_test_sprite.png",
    roxyOfficialSprite: "./assets/sprites/roxy_official_sprite.png",
    pageCount: 24,
    getLayoutPath(pageNumber) {
      const padded = String(Math.max(1, Math.min(24, pageNumber))).padStart(2, "0");
      return `${this.layoutsBasePath}/page_${padded}.jpg`;
    }
  }
};

const APP_CONFIG = {
  brandName: "RoxyTales",
  activeStorySlug: "my_first_christmas_24p",
  imprintSealPath: "./PublishingImprint/PublishingImprint.jpg",
  roxyCharacterPath: STORY_ASSETS_REGISTRY.my_first_christmas_24p.roxyOfficialSprite,
  babyTestSpritePath: STORY_ASSETS_REGISTRY.my_first_christmas_24p.babyTestSprite,
  roxySheetPath: "./RoxyCharacterSheet.jpg",
  defaultLanguage: "es",
  defaultCurrency: "USD",
  maxChildNameLength: 18,
  maxPhotoSizeBytes: 5 * 1024 * 1024, // 5 MB
  previewRenderDurationMs: 2500,
  simulatedApiLatencyMs: { min: 350, max: 950 },

  storageKeys: {
    crmLeads: "roxytales_crm_leads",
    waitlistLeads: "waitlist_leads",
    orders: "roxytales_orders",
    lastOdooPayload: "roxytales_last_odoo_payload",
    adminPricing: "roxytales_admin_pricing",
    adminCoupons: "roxytales_admin_coupons",
    adminShipping: "roxytales_admin_shipping",
    draftState: "roxytales_studio_draft"
  },

  printSpecifications: {
    format: "8x8_square_200x200mm",
    trimWidthMm: 200,
    trimHeightMm: 200,
    pageCount: 24,
    targetDpi: 300,
    minPixelResolution: "2400x2400",
    bleedMm: 3.0,
    safeMarginMm: 6.0,
    colorProfile: "CMYK - ISO Coated v2"
  },

  masterStyleLock: `Modern 3D fairy tale storybook illustration style, warm high-end studio animation aesthetic, soft tactile clay-like render with velvet textures, rounded friendly geometry, glowing volumetric holiday lighting, warm golden tones and festive crimson accents, uncluttered minimalist background with high visual contrast for infant acuity, clean square 1:1 composition, 300 DPI print fidelity, wide negative space reserved for typography.`,

  negativePromptLock: `--no text, letters, words, typography, logo, watermark, signature, extra limbs, mutated anatomy, deformed hands, sharp edges, dark menacing shadows, hyper-realistic uncanny human skin, cluttered room, tiny distracting background objects`
};

/**
 * Configuraciones iniciales de precios y SKUs de Odoo / Gelato
 */
const DEFAULT_PRICING_CONFIG = {
  pricingVersion: 4,
  tiers: {
    digital: {
      id: "digital",
      price: 9.99,
      odooSku: "ROXY-DIG-8X8",
      gelatoUid: "digital_pdf_highres_200x200",
      requiresShipping: false,
      badgeKey: "tierBadgeInstant"
    },
    softcover: {
      id: "softcover",
      price: 34.99,
      odooSku: "ROXY-SOFT-8X8",
      gelatoUid: "apparel_children_softcover_200x200",
      requiresShipping: true,
      badgeKey: "tierBadgePopular"
    },
    hardcover: {
      id: "hardcover",
      price: 39.99,
      odooSku: "ROXY-HARD-8X8",
      gelatoUid: "apparel_children_hardcover_200x200",
      requiresShipping: true,
      isFeatured: true,
      badgeKey: "tierBadgeStar"
    }
  },
  petUpsells: {
    tier_a_default: {
      id: "tier_a_default",
      price: 0.00,
      odooSku: "ROXY-PET-DEFAULT",
      labelEs: "Roxy incluida (sin costo adicional)",
      labelEn: "Roxy included (no extra charge)"
    },
    tier_b_photo: {
      id: "tier_b_photo",
      price: 0.00,
      odooSku: "ROXY-PET-PHOTO-3D",
      labelEs: "Mascota desde foto (incluido sin costo)",
      labelEn: "Custom Pet from Photo (included free)"
    },
    tier_c_traits: {
      id: "tier_c_traits",
      price: 0.00,
      odooSku: "ROXY-PET-TRAITS-3D",
      labelEs: "Mascota personalizada (incluido sin costo)",
      labelEn: "Custom Pet (included free)"
    }
  },
  referenceShippingFee: 4.50
};

/**
 * Tabla de tarifas de envío simuladas de Gelato POD por país destino.
 * El valor base de referencia ($4.50 USD) se aplica como estándar local en US
 * y se recalcula proporcionalmente o mediante override del Admin.
 */
const GELATO_SHIPPING_MATRIX = {
  US: { countryName: "United States", baseFee: 4.50, hub: "Gelato Chicago Print Hub", transitDays: "3–5" },
  CO: { countryName: "Colombia", baseFee: 6.50, hub: "Gelato Bogota Partner Hub", transitDays: "4–7" },
  ES: { countryName: "España", baseFee: 4.80, hub: "Gelato Madrid Print Hub", transitDays: "2–4" },
  MX: { countryName: "México", baseFee: 5.40, hub: "Gelato Monterrey Hub", transitDays: "3–6" },
  CA: { countryName: "Canada", baseFee: 5.90, hub: "Gelato Toronto Hub", transitDays: "3–5" },
  GB: { countryName: "United Kingdom", baseFee: 4.75, hub: "Gelato London Hub", transitDays: "2–4" }
};

/**
 * Cupones promocionales por defecto en el sistema
 */
const DEFAULT_COUPONS = [
  {
    code: "NAVIDAD20",
    type: "percent",
    value: 20,
    active: true,
    descriptionEs: "20% OFF Especial Mi Primera Navidad",
    descriptionEn: "20% OFF My First Christmas Special"
  },
  {
    code: "WAITLIST10",
    type: "percent",
    value: 10,
    active: true,
    descriptionEs: "10% OFF Miembro Lista de Espera",
    descriptionEn: "10% OFF Waitlist Early Access"
  },
  {
    code: "ROXY5USD",
    type: "fixed",
    value: 5.00,
    active: true,
    descriptionEs: "$5.00 USD de descuento directo",
    descriptionEn: "$5.00 USD instant discount"
  }
];

/**
 * Opciones de parentesco (Gift Giver) con firmas y sugerencias de dedicatoria
 */
const GIFT_GIVER_OPTIONS = [
  {
    id: "parents",
    odooValue: "Padres",
    labelEs: "Padres (Mamá y Papá)",
    labelEn: "Parents (Mommy & Daddy)",
    page6LabelEs: "Mamá y Papá",
    page6LabelEn: "Mommy and Daddy",
    signatureEs: "Con amor infinito, Mamá y Papá",
    signatureEn: "With endless love, Mommy and Daddy",
    suggestionsEs: [
      "Eres la luz más brillante de nuestras vidas. Que tu camino siempre esté guiado por el amor, el asombro y la lealtad.",
      "Nuestra primera Navidad contigo es el regalo más hermoso que jamás soñamos. Te amamos hasta las estrellas.",
      "Cada sonrisa tuya ilumina nuestro hogar. Que este cuento guarde para siempre la magia de tu primer diciembre."
    ],
    suggestionsEn: [
      "You are the brightest light of our lives. May your path always be guided by love, wonder, and loyalty.",
      "Our first Christmas with you is the greatest gift we could ever dream of. We love you to the stars and back.",
      "Every smile of yours lights up our home. May this book forever hold the magic of your very first December."
    ]
  },
  {
    id: "mother",
    odooValue: "Madre",
    labelEs: "Madre (Mamá)",
    labelEn: "Mother (Mommy)",
    page6LabelEs: "Mamá",
    page6LabelEn: "Mommy",
    signatureEs: "Con todo el amor de mi corazón, Mamá",
    signatureEn: "With all the love in my heart, Mommy",
    suggestionsEs: [
      "Desde el primer latido supe que serías mi mayor aventura. ¡Feliz primera Navidad, mi pequeño tesoro!",
      "Abrazarte en esta Navidad es mi lugar favorito en el mundo. Que siempre crezcas rodeado de magia y ternura."
    ],
    suggestionsEn: [
      "From your very first heartbeat I knew you would be my greatest adventure. Happy First Christmas, my little treasure!",
      "Holding you close this Christmas is my favorite place in the world. May you always grow surrounded by magic and warmth."
    ]
  },
  {
    id: "father",
    odooValue: "Padre",
    labelEs: "Padre (Papá)",
    labelEn: "Father (Daddy)",
    page6LabelEs: "Papá",
    page6LabelEn: "Daddy",
    signatureEs: "Siempre a tu lado con orgullo y amor, Papá",
    signatureEn: "Always by your side with pride and love, Daddy",
    suggestionsEs: [
      "Prometo contarte historias mágicas cada noche y cuidar tus sueños siempre. ¡Feliz primera Navidad, campeón!",
      "Verte descubrir las luces de Navidad es el mejor regalo de mi vida. Te quiere con toda el alma, Papá."
    ],
    suggestionsEn: [
      "I promise to read you magical stories every night and guard your dreams forever. Happy First Christmas, little one!",
      "Watching you discover the Christmas lights is the greatest gift of my life. Loved forever and always by Daddy."
    ]
  },
  {
    id: "grandparents",
    odooValue: "Abuelos",
    labelEs: "Abuelo/a (Abuelos)",
    labelEn: "Grandparent(s)",
    page6LabelEs: "tus Abuelos",
    page6LabelEn: "Grandma and Grandpa",
    signatureEs: "Con amor eterno de tus Abuelos",
    signatureEn: "With eternal love from your Grandparents",
    suggestionsEs: [
      "Un nieto llena el corazón de una luz nueva y maravillosa. Que la magia de tus primeros pasos nos acompañe siempre.",
      "Para nuestro pequeño milagro navideño: nuestros brazos y nuestro corazón serán siempre tu refugio seguro."
    ],
    suggestionsEn: [
      "A grandchild fills the heart with a brand new wonderful light. May the magic of your first Christmas stay with us forever.",
      "To our little holiday miracle: our arms and hearts will always be your warmest, safest haven."
    ]
  },
  {
    id: "uncle_aunt",
    odooValue: "Tíos",
    labelEs: "Tío/a (Tíos)",
    labelEn: "Uncle / Aunt",
    page6LabelEs: "tus Tíos",
    page6LabelEn: "your Aunt and Uncle",
    signatureEs: "Con muchísimo cariño y complicidad, tus Tíos",
    signatureEn: "With endless hugs and joy, your Aunt & Uncle",
    suggestionsEs: [
      "Estamos listos para mil aventuras, risas y travesuras junto a ti y Roxy. ¡Feliz primera Navidad!",
      "Llegaste para multiplicar la alegría de toda la familia. Que nunca dejes de brillar y soñar en grande."
    ],
    suggestionsEn: [
      "We are ready for a thousand adventures, giggles, and games with you and Roxy. Happy First Christmas!",
      "You arrived to multiply the joy of our whole family. Never stop shining and dreaming big."
    ]
  },
  {
    id: "godparents",
    odooValue: "Padrinos",
    labelEs: "Padrino / Madrina",
    labelEn: "Godparent(s)",
    page6LabelEs: "tus Padrinos",
    page6LabelEn: "your Godparents",
    signatureEs: "Bendiciones y amor siempre, tus Padrinos",
    signatureEn: "Blessings and love always, your Godparents",
    suggestionsEs: [
      "Es un honor acompañar tus pasos hoy y siempre. Que la estrella de esta primera Navidad guíe toda tu vida.",
      "Para nuestro ahijado más especial: que cada página de tu vida esté llena de bondad, magia y fieles amigos."
    ],
    suggestionsEn: [
      "It is an honor to walk beside you today and always. May the star of your first Christmas guide your whole life.",
      "To our precious godchild: may every page of your life be filled with kindness, magic, and loyal friends."
    ]
  },
  {
    id: "relative",
    odooValue: "Familiar",
    labelEs: "Familiar",
    labelEn: "Family Member",
    page6LabelEs: "toda tu Familia",
    page6LabelEn: "your whole Family",
    signatureEs: "Con todo el cariño de tu familia que te adora",
    signatureEn: "With all the warmth of your loving family",
    suggestionsEs: [
      "Bienvenido a una familia que te ama con locura. ¡Que esta primera Navidad sea el inicio de recuerdos inolvidables!"
    ],
    suggestionsEn: [
      "Welcome to a family that loves you beyond words. May this first Christmas be the start of unforgettable memories!"
    ]
  },
  {
    id: "friend",
    odooValue: "Familiar",
    labelEs: "Amigo/a de la familia",
    labelEn: "Family Friend",
    page6LabelEs: "quienes te quieren tanto",
    page6LabelEn: "friends who love you dearly",
    signatureEs: "Con inmenso cariño en tu primera Navidad",
    signatureEn: "With warmest wishes on your First Christmas",
    suggestionsEs: [
      "Ver crecer tu luz junto a tu maravillosa familia es una alegría inmensa. ¡Felices fiestas, pequeñito!"
    ],
    suggestionsEn: [
      "Watching your light grow alongside your wonderful family is a true joy. Happy Holidays, little star!"
    ]
  }
];

/**
 * Rasgos visuales del bebé (Modo Atributos) alineados con RoxyMasterPlan.md
 */
const BABY_TRAITS_CONFIG = {
  skinTones: [
    {
      id: "fair_peach",
      hex: "#FCD7BE",
      cheekHex: "#F4978E",
      labelEs: "Durazno claro (Fair peach)",
      labelEn: "Fair peach",
      promptToken: "fair warm peach undertone"
    },
    {
      id: "warm_tan",
      hex: "#E2AF88",
      cheekHex: "#D97B6C",
      labelEs: "Bronceado cálido (Warm tan)",
      labelEn: "Warm tan",
      promptToken: "warm golden-tan"
    },
    {
      id: "olive",
      hex: "#C9966B",
      cheekHex: "#C26D5E",
      labelEs: "Oliva suave (Olive)",
      labelEn: "Olive",
      promptToken: "soft Mediterranean olive"
    },
    {
      id: "rich_deep",
      hex: "#7F4B2B",
      cheekHex: "#9A4C40",
      labelEs: "Ébano cálido (Rich deep)",
      labelEn: "Rich deep",
      promptToken: "rich deep warm cocoa"
    }
  ],
  hairStyles: [
    {
      id: "wispy_curls",
      hex: "#6B4423",
      labelEs: "Rizos suaves castaños (Wispy baby curls)",
      labelEn: "Wispy baby curls",
      promptToken: "wispy soft light-brown baby curls"
    },
    {
      id: "straight_brown",
      hex: "#4A2E1B",
      labelEs: "Castaño lacio (Straight brown)",
      labelEn: "Straight brown",
      promptToken: "fine straight warm chestnut-brown hair"
    },
    {
      id: "blonde_tufts",
      hex: "#DCA85E",
      labelEs: "Mechones rubios (Blonde tufts)",
      labelEn: "Blonde tufts",
      promptToken: "fluffy golden-blonde baby tufts"
    },
    {
      id: "black_coils",
      hex: "#1E1916",
      labelEs: "Rulitos negros (Black coils)",
      labelEn: "Black coils",
      promptToken: "soft textured jet-black baby coils"
    }
  ],
  eyeColors: [
    {
      id: "hazel_brown",
      hex: "#8A5A2B",
      labelEs: "Avellana cálido (Hazel-brown)",
      labelEn: "Hazel-brown",
      promptToken: "big warm hazel-brown"
    },
    {
      id: "deep_brown",
      hex: "#3B2314",
      labelEs: "Café profundo (Deep brown)",
      labelEn: "Deep brown",
      promptToken: "deep expressive dark-brown"
    },
    {
      id: "baby_blue",
      hex: "#4D8FAC",
      labelEs: "Azul cielo (Baby blue)",
      labelEn: "Baby blue",
      promptToken: "bright crystal baby-blue"
    },
    {
      id: "forest_green",
      hex: "#4A7C59",
      labelEs: "Verde bosque (Forest green)",
      labelEn: "Forest green",
      promptToken: "emerald forest-green"
    }
  ]
};

/**
 * Rasgos del motor de mascotas para la Opción C (Personalización por Atributos)
 */
const PET_TRAITS_CONFIG = {
  species: [
    {
      id: "dog",
      labelEs: "Perro",
      labelEn: "Dog",
      defaultSoundEs: "Guau, guau",
      defaultSoundEn: "Woof, woof",
      breeds: [
        { id: "shih_tzu", labelEs: "Shih Tzu", labelEn: "Shih Tzu" },
        { id: "golden_retriever", labelEs: "Golden Retriever", labelEn: "Golden Retriever" },
        { id: "french_bulldog", labelEs: "Bulldog Francés", labelEn: "French Bulldog" },
        { id: "poodle", labelEs: "Poodle / Caniche", labelEn: "Toy Poodle" },
        { id: "dachshund", labelEs: "Teckel / Salchicha", labelEn: "Dachshund" },
        { id: "mixed_pup", labelEs: "Mestizo adorable", labelEn: "Lovable Mixed Pup" }
      ]
    },
    {
      id: "cat",
      labelEs: "Gato",
      labelEn: "Cat",
      defaultSoundEs: "Miau, ronrón",
      defaultSoundEn: "Purr, meow",
      breeds: [
        { id: "tabby_cat", labelEs: "Gato Atigrado", labelEn: "Tabby Shorthair" },
        { id: "persian_cat", labelEs: "Gato Persa esponjoso", labelEn: "Fluffy Persian" },
        { id: "siamese_cat", labelEs: "Gato Siamés", labelEn: "Siamese Cat" },
        { id: "tuxedo_cat", labelEs: "Gato Esmoquin (Blanco/Negro)", labelEn: "Tuxedo Cat" }
      ]
    }
  ],
  coatColors: [
    { id: "honey_white", hex: "#D99B52", secondaryHex: "#FAF6F0", labelEs: "Miel dorado y blanco", labelEn: "Golden-honey & white", promptToken: "silky tricolor coat with warm golden-honey patches and snow-white chest" },
    { id: "cream_gold", hex: "#EED09D", secondaryHex: "#FFFDF9", labelEs: "Crema champaña", labelEn: "Champagne cream", promptToken: "plush warm cream-gold fur" },
    { id: "chocolate", hex: "#6E4023", secondaryHex: "#9C6B49", labelEs: "Chocolate cálido", labelEn: "Warm chocolate", promptToken: "velvety rich chocolate-brown coat" },
    { id: "charcoal", hex: "#2A2B2E", secondaryHex: "#FFFFFF", labelEs: "Azabache con pecho blanco", labelEn: "Jet black & white", promptToken: "glossy midnight-black fur with a snowy chest patch" },
    { id: "ginger_orange", hex: "#D96B27", secondaryHex: "#FBE5C8", labelEs: "Canela / Naranja dulce", labelEn: "Cinnamon ginger", promptToken: "warm ginger-marmalade striped coat" }
  ],
  earShapes: [
    { id: "floppy", labelEs: "Orejas caídas suaves", labelEn: "Soft floppy ears", promptToken: "softly draped floppy ears" },
    { id: "perky", labelEs: "Orejas puntiagudas", labelEn: "Perky upright ears", promptToken: "perky alert triangular ears" },
    { id: "rounded", labelEs: "Orejas redondeadas", labelEn: "Rounded button ears", promptToken: "cute rounded teddy-bear ears" }
  ]
};

/**
 * Colecciones del estudio y tarjetas "Coming Soon" del catálogo secundario.
 * Define la unidad reactiva de edad: "months" para 0-2 años, "years" para >2 años.
 */
const COLLECTIONS_CATALOG = [
  {
    id: "christmas_first_year_8x8",
    isActiveStudio: true,
    ageRangeLabelEs: "0 a 2 años (Bebés)",
    ageRangeLabelEn: "0 to 2 years (Infants)",
    titleEs: "0 a 2 años: Mi Primera Navidad con [Nombre] y Roxy",
    titleEn: "0 to 2 years: My First Christmas with [Name] and Roxy",
    ageUnit: "months",
    minAge: 0,
    maxAge: 24,
    defaultAge: 10
  },
  {
    id: "magic_habits_potty_8x8",
    isActiveStudio: false,
    isComingSoon: true,
    categoryBadgeEs: "Colección 2 a 4 años",
    categoryBadgeEn: "Ages 2 to 4 Collection",
    ageRangeLabelEs: "2 a 4 años (Primera infancia)",
    ageRangeLabelEn: "2 to 4 years (Toddlers)",
    titleEs: "Hábitos mágicos y el adiós al pañal con Roxy",
    titleEn: "Magical Habits & Bye-Bye Diapers with Roxy",
    descriptionEs: "Refuerzo positivo y rutinas divertidas para celebrar la autonomía de tu pequeño paso a paso.",
    descriptionEn: "Positive reinforcement and playful routines to celebrate your toddler's growing independence.",
    ageUnit: "years",
    minAge: 2,
    maxAge: 4,
    defaultAge: 3,
    accentColor: "#D97706",
    iconType: "sparkles"
  },
  {
    id: "galactic_mission_8x8",
    isActiveStudio: false,
    isComingSoon: true,
    categoryBadgeEs: "Colección 5 a 8 años",
    categoryBadgeEn: "Ages 5 to 8 Collection",
    ageRangeLabelEs: "5 a 8 años (Exploradores)",
    ageRangeLabelEn: "5 to 8 years (Explorers)",
    titleEs: "Misión galáctica: El gran viaje estelar de [Nombre] y Roxy",
    titleEn: "Galactic Mission: [Name] & Roxy's Star Voyage",
    descriptionEs: "Una aventura interplanetaria sobre curiosidad científica, valentía y trabajo en equipo.",
    descriptionEn: "An interplanetary adventure sparking scientific curiosity, courage, and teamwork.",
    ageUnit: "years",
    minAge: 5,
    maxAge: 8,
    defaultAge: 6,
    accentColor: "#2563EB",
    iconType: "rocket"
  },
  {
    id: "coloring_book_8x8",
    isActiveStudio: false,
    isComingSoon: true,
    isSpecialFormat: true,
    categoryBadgeEs: "Formato Especial · Motricidad",
    categoryBadgeEn: "Special Format · Fine Motor",
    ageRangeLabelEs: "3 a 7 años",
    ageRangeLabelEn: "3 to 7 years",
    titleEs: "Libro para colorear personalizado",
    titleEn: "Personalized Fine-Motor Coloring Book",
    descriptionEs: "Páginas de líneas gruesas de alto contraste diseñadas para desarrollar la motricidad fina junto a Roxy.",
    descriptionEn: "Bold-line high-contrast pages crafted to develop fine motor skills alongside Roxy.",
    ageUnit: "years",
    minAge: 3,
    maxAge: 7,
    defaultAge: 4,
    accentColor: "#E11D48",
    iconType: "palette"
  },
  {
    id: "family_recipe_book",
    isActiveStudio: false,
    isComingSoon: true,
    isSpecialFormat: true,
    categoryBadgeEs: "Formato Especial · Familia",
    categoryBadgeEn: "Special Format · Family Keepsake",
    ageRangeLabelEs: "Todas las edades",
    ageRangeLabelEn: "All Ages",
    titleEs: "El recetario secreto de la familia y Roxy",
    titleEn: "The Secret Family & Roxy Recipe Keepsake",
    descriptionEs: "Un tesoro gastronómico ilustrado para cocinar galletas, postres festivos y memorias en familia.",
    descriptionEn: "An illustrated culinary keepsake for baking holiday cookies, treats, and family memories.",
    ageUnit: "years",
    minAge: 3,
    maxAge: 10,
    defaultAge: 5,
    accentColor: "#059669",
    iconType: "ChefHat"
  },
  {
    id: "luxury_holiday_cards",
    isActiveStudio: false,
    isComingSoon: true,
    isSpecialFormat: true,
    categoryBadgeEs: "Edición Festiva · Papelería",
    categoryBadgeEn: "Holiday Edition · Stationery",
    ageRangeLabelEs: "Pack de 12 tarjetas",
    ageRangeLabelEn: "12-Card Keepsake Pack",
    titleEs: "Tarjetas de felicitación navideña de lujo",
    titleEn: "Luxury Custom 3D Holiday Greeting Cards",
    descriptionEs: "Tarjetas en papel algodón de 350 gsm con acabado dorado e ilustración 3D de tu bebé y su fiel compañero.",
    descriptionEn: "350 gsm cotton-press cards with gold foil accents and custom 3D art of your child and pet.",
    ageUnit: "months",
    minAge: 0,
    maxAge: 24,
    defaultAge: 10,
    accentColor: "#9333EA",
    iconType: "gift"
  }
];

/**
 * Blueprint maestro de las 8 páginas (Gelato 8x8") según SKILLS/RoxyMasterPlan.md
 */
const PAGES_BLUEPRINT = [
  {
    pageNumber: 1,
    id: "cover",
    roleEs: "Portada Principal",
    roleEn: "Front Cover",
    layoutReservePercent: 35,
    layoutZoneLabelEs: "35% superior libre para tipografía",
    layoutZoneLabelEn: "Upper 35% reserved for title typography",
    bgImage: STORY_ASSETS_REGISTRY.my_first_christmas_24p.getLayoutPath(1),
    themeMode: "warm-day",
    scenePose: "cover_tree",
    textTemplateEs: "¡Mi Primera Navidad con {childName} y {petName}!",
    textTemplateEn: "My First Christmas with {childName} and {petName}!",
    sensoryCueEs: "Señala directamente el rostro del bebé en la portada y luego a {petName}, usando una voz alegre y melodiosa para estimular el autorreconocimiento.",
    sensoryCueEn: "Point directly to the baby's face on the cover, then to {petName}, using a cheerful, melodious voice to introduce self-recognition.",
    promptBody: "{babySeed}, sitting safely on a thick, cloud-soft ivory fleece rug right next to {petSeed}, who sits upright with a cheerful, affectionate posture. Behind them stands the bottom section of a softly lit Christmas tree adorned with oversized, glowing golden globes. Frontal eye-level shot. Upper 35% of the frame is completely smooth and empty with soft ambient wall lighting for title placement."
  },
  {
    pageNumber: 2,
    id: "title_opening",
    roleEs: "Portadilla Ilustrada",
    roleEn: "Illustrated Title Page",
    layoutReservePercent: 35,
    layoutZoneLabelEs: "35% superior libre",
    layoutZoneLabelEn: "Upper 35% clean negative space",
    bgImage: STORY_ASSETS_REGISTRY.my_first_christmas_24p.getLayoutPath(2),
    themeMode: "parchment-seal",
    scenePose: "cover_tree",
    textTemplateEs: "Edición de Colección para {childName} y {petName} · {customYear}",
    textTemplateEn: "Collector's Edition for {childName} & {petName} · {customYear}",
    sensoryCueEs: "Abre la historia señalando con ternura los nombres de {childName} y {petName}.",
    sensoryCueEn: "Open the story by gently pointing to {childName} and {petName}'s names.",
    promptBody: "Minimalist warm parchment cream background with delicate pine sprigs and golden stars."
  },
  {
    pageNumber: 3,
    id: "shiny_ornament",
    isScenePage: true,
    roleEs: "El primer destello",
    roleEn: "The First Sparkle",
    layoutReservePercent: 30,
    layoutZoneLabelEs: "30% superior libre",
    layoutZoneLabelEn: "Upper 30% clean negative space",
    bgImage: STORY_ASSETS_REGISTRY.my_first_christmas_24p.getLayoutPath(3),
    themeMode: "warm-gold",
    scenePose: "reaching_ornament",
    textTemplateEs: "¡Mira, {childName}! ¡Brilla, brilla la esfera dorada!",
    textTemplateEn: "Look, {childName}! Shine, shine goes the golden bauble!",
    ageVariants: {
      "0_6": { es: "Mira qué luz tan suave brilla para ti, {childName}.", en: "Look at the gentle light shining just for you, {childName}." },
      "7_12": { es: "¡Mira, {childName}! ¡Brilla, brilla la esfera dorada!", en: "Look, {childName}! Shine, shine goes the golden bauble!" },
      "13_24": { es: "¡Señala la estrella, {childName}! ¡Mira qué alto brilla!", en: "Point to the star, {childName}! Look how high it shines!" }
    },
    sensoryCueEs: "Toca suavemente la esfera dorada al ritmo de tu voz.",
    sensoryCueEn: "Gently tap the golden bauble rhythmically with your voice.",
    promptBody: "Close-up of a low emerald pine branch holding a large glossy golden ornament."
  },
  {
    pageNumber: 4,
    id: "warm_light_support",
    roleEs: "Luz cálida",
    roleEn: "Warm Light",
    layoutReservePercent: 30,
    layoutZoneLabelEs: "30% superior libre",
    layoutZoneLabelEn: "Upper 30% clean negative space",
    bgImage: STORY_ASSETS_REGISTRY.my_first_christmas_24p.getLayoutPath(4),
    themeMode: "warm-gold",
    scenePose: "reaching_ornament",
    textTemplateEs: "Un destello mágico que ilumina tus ojos curiosos.",
    textTemplateEn: "A magical sparkle lighting up your curious eyes.",
    ageVariants: {
      "0_6": { es: "Escucha nuestra voz... estás seguro y muy amado.", en: "Listen to our voice... you are safe and deeply loved." },
      "7_12": { es: "Un destello mágico que ilumina tus ojos curiosos.", en: "A magical sparkle lighting up your curious eyes." },
      "13_24": { es: "«¡Luz, luz!», dices con tu voz llena de emoción.", en: "“Light, light!” you say with a voice full of wonder." }
    },
    sensoryCueEs: "Señala las luces suaves para estimular el seguimiento visual.",
    sensoryCueEn: "Point to the soft light orbs to encourage visual tracking.",
    promptBody: "Minimalist warm cream and soft gold bokeh background."
  },
  {
    pageNumber: 5,
    id: "joyful_pet",
    isScenePage: true,
    roleEs: "El sonido alegre",
    roleEn: "The Joyful Sound",
    layoutReservePercent: 30,
    layoutZoneLabelEs: "30% superior libre",
    layoutZoneLabelEn: "Upper 30% neutral wall",
    bgImage: STORY_ASSETS_REGISTRY.my_first_christmas_24p.getLayoutPath(5),
    themeMode: "neutral-cream",
    scenePose: "solo_pet_bell",
    textTemplateEs: "«{petSound}», dice {petName} moviendo su colita feliz.",
    textTemplateEn: "“{petSound}”, says {petName} wagging happily.",
    ageVariants: {
      "0_6": { es: "{petSound}, susurra {petName} muy cerquita de ti.", en: "{petSound}, whispers {petName} right beside you." },
      "7_12": { es: "«{petSound}», dice {petName} moviendo su colita feliz.", en: "“{petSound}”, says {petName} wagging happily." },
      "13_24": { es: "«{petSound}», ladra {petName} invitándote a jugar.", en: "“{petSound}”, calls {petName}, inviting you to play!" }
    },
    sensoryCueEs: "Imita el sonido de su fiel compañero con alegría.",
    sensoryCueEn: "Playfully imitate their faithful companion's sound.",
    promptBody: "Oversized smooth golden jingle bell tied with a crimson velvet bow on ivory rug."
  },
  {
    pageNumber: 6,
    id: "rhythm_and_echo",
    roleEs: "Ritmo y eco",
    roleEn: "Rhythm and Echo",
    layoutReservePercent: 30,
    layoutZoneLabelEs: "30% superior libre",
    layoutZoneLabelEn: "Upper 30% clean negative space",
    bgImage: STORY_ASSETS_REGISTRY.my_first_christmas_24p.getLayoutPath(6),
    themeMode: "warm-day",
    scenePose: "solo_pet_bell",
    textTemplateEs: "¡Toca el cascabel! ¡Tilín, tilín suena la Navidad!",
    textTemplateEn: "Tap the bell! Jingle, jingle sounds Christmas!",
    ageVariants: {
      "0_6": { es: "Un sonido dulce que hace florecer tu primera sonrisa.", en: "A sweet sound that brings out your very first smile." },
      "7_12": { es: "¡Toca el cascabel! ¡Tilín, tilín suena la Navidad!", en: "Tap the bell! Jingle, jingle sounds Christmas!" },
      "13_24": { es: "¿Cómo hace {petName}? ¡Lo repites con una gran sonrisa!", en: "What does {petName} say? You repeat it with a big smile!" }
    },
    sensoryCueEs: "Repite el sonido rítmico suavemente junto a tu bebé.",
    sensoryCueEn: "Repeat the rhythmic sound gently beside your baby.",
    promptBody: "Clean warm ivory background with subtle musical sparkle waves in soft gold."
  },
  {
    pageNumber: 7,
    id: "tactile_pine",
    isScenePage: true,
    roleEs: "Ramas suaves de pino",
    roleEn: "Soft Pine Branches",
    layoutReservePercent: 25,
    layoutZoneLabelEs: "25% superior libre",
    layoutZoneLabelEn: "Upper 25% smooth space",
    bgImage: STORY_ASSETS_REGISTRY.my_first_christmas_24p.getLayoutPath(7),
    themeMode: "emerald-pine",
    scenePose: "touching_pine",
    textTemplateEs: "Suave, suave... tus deditos exploran el pino nevado.",
    textTemplateEn: "Soft, soft... little fingers explore the snowy pine.",
    ageVariants: {
      "0_6": { es: "Suave, suave... el pino huele a invierno y hogar.", en: "Soft, soft... fresh pine smells like winter and home." },
      "7_12": { es: "Suave, suave... tus deditos exploran el pino nevado.", en: "Soft, soft... little fingers explore the snowy pine." },
      "13_24": { es: "Pasito a pasito nos acercamos al árbol de Navidad.", en: "Step by step we walk up to the Christmas tree." }
    },
    sensoryCueEs: "Desliza los deditos del bebé mientras susurras 'suave, suave'.",
    sensoryCueEn: "Gently stroke baby's fingers while whispering 'soft, soft'.",
    promptBody: "Low lush green pine branches dusted with soft snow."
  },
  {
    pageNumber: 8,
    id: "forest_textures",
    roleEs: "Texturas del bosque",
    roleEn: "Forest Textures",
    layoutReservePercent: 30,
    layoutZoneLabelEs: "30% superior libre",
    layoutZoneLabelEn: "Upper 30% clean negative space",
    bgImage: STORY_ASSETS_REGISTRY.my_first_christmas_24p.getLayoutPath(8),
    themeMode: "emerald-pine",
    scenePose: "touching_pine",
    textTemplateEs: "¡Qué textura tan fresca y qué aroma tan especial!",
    textTemplateEn: "Such fresh textures and such a cozy winter scent!",
    ageVariants: {
      "0_6": { es: "Caricias tiernas en tus manitas mientras descubres el mundo.", en: "Gentle touches on your little hands as you discover the world." },
      "7_12": { es: "¡Qué textura tan fresca y qué aroma tan especial!", en: "Such fresh textures and such a cozy winter scent!" },
      "13_24": { es: "Tocamos con cuidado las ramas verdes y suaves.", en: "We gently touch the soft green pine branches." }
    },
    sensoryCueEs: "Invita a tu bebé a explorar los colores del bosque invernal.",
    sensoryCueEn: "Invite your baby to explore the winter forest colors.",
    promptBody: "Minimalist soft sage-green and cream background with snow-kissed pine needles."
  },
  {
    pageNumber: 9,
    id: "surprise_box_detail",
    isScenePage: true,
    roleEs: "La caja sorpresa",
    roleEn: "The Surprise Box",
    layoutReservePercent: 30,
    layoutZoneLabelEs: "30% superior libre",
    layoutZoneLabelEn: "Upper 30% negative space",
    bgImage: STORY_ASSETS_REGISTRY.my_first_christmas_24p.getLayoutPath(9),
    themeMode: "magic-sparkles",
    scenePose: "peekaboo_box",
    textTemplateEs: "¿Qué se esconde en la caja sorpresa? ¡Cucú-tras de amor!",
    textTemplateEn: "What's hiding in the surprise box? Peek-a-boo of love!",
    ageVariants: {
      "0_6": { es: "¿Qué hay dentro de esta caja llena de luz?", en: "What is inside this box brimming with warm light?" },
      "7_12": { es: "¿Qué se esconde en la caja sorpresa? ¡Cucú-tras de amor!", en: "What's hiding in the surprise box? Peek-a-boo of love!" },
      "13_24": { es: "¡Abre la caja mágica con {petName}! ¿Qué habrá adentro?", en: "Open the magic box with {petName}! What could be inside?" }
    },
    sensoryCueEs: "Señala los destellos dorados junto a la caja mágica.",
    sensoryCueEn: "Point to the golden sparkles rising from the gift box.",
    promptBody: "Open cream and gold gift box with floating star sparkles."
  },
  {
    pageNumber: 10,
    id: "golden_wonder",
    roleEs: "Asombro dorado",
    roleEn: "Golden Wonder",
    layoutReservePercent: 30,
    layoutZoneLabelEs: "30% superior libre",
    layoutZoneLabelEn: "Upper 30% negative space",
    bgImage: STORY_ASSETS_REGISTRY.my_first_christmas_24p.getLayoutPath(10),
    themeMode: "warm-gold",
    scenePose: "reaching_ornament",
    textTemplateEs: "¡Estrellitas doradas vuelan por toda la habitación!",
    textTemplateEn: "Little golden stars drift all across the room!",
    ageVariants: {
      "0_6": { es: "¡Sorpresa! Un destello mágico que baila sobre tu cuna.", en: "Surprise! A magical shimmer dancing above your crib." },
      "7_12": { es: "¡Estrellitas doradas vuelan por toda la habitación!", en: "Little golden stars drift all across the room!" },
      "13_24": { es: "¡Un mundo de estrellas y abrazos para compartir!", en: "A whole world of stars and warm hugs to share!" }
    },
    sensoryCueEs: "Sigue con el dedo las estrellitas doradas.",
    sensoryCueEn: "Trace the floating golden stars gently with your finger.",
    promptBody: "Warm twilight-gold gradient with glowing stars."
  },
  {
    pageNumber: 11,
    id: "hearth_warmth",
    isScenePage: true,
    roleEs: "Calor de hogar",
    roleEn: "Warmth of Home",
    layoutReservePercent: 25,
    layoutZoneLabelEs: "25% superior libre",
    layoutZoneLabelEn: "Upper 25% negative space",
    bgImage: STORY_ASSETS_REGISTRY.my_first_christmas_24p.getLayoutPath(11),
    themeMode: "hearth-amber",
    scenePose: "hugging_star",
    textTemplateEs: "Un abrazo gigante junto al calor de la chimenea.",
    textTemplateEn: "A giant warm hug beside the glowing fireplace.",
    ageVariants: {
      "0_6": { es: "Junto al calor del hogar, nuestro abrazo te envuelve.", en: "By the warmth of home, our embrace wraps around you." },
      "7_12": { es: "Un abrazo gigante junto al calor de la chimenea.", en: "A giant warm hug beside the glowing fireplace." },
      "13_24": { es: "Un abrazo fuerte para {giftGiverLabel} frente al fuego cálido.", en: "A big warm hug for {giftGiverLabel} by the cozy hearth." }
    },
    sensoryCueEs: "Dale un abrazo cálido mientras le hablas con voz suave.",
    sensoryCueEn: "Share a warm hug while reading softly.",
    promptBody: "Warm stone fireplace and plush golden star pillow."
  },
  {
    pageNumber: 12,
    id: "loving_embrace",
    roleEs: "El abrazo",
    roleEn: "The Embrace",
    layoutReservePercent: 30,
    layoutZoneLabelEs: "30% superior libre",
    layoutZoneLabelEn: "Upper 30% negative space",
    bgImage: STORY_ASSETS_REGISTRY.my_first_christmas_24p.getLayoutPath(12),
    themeMode: "warm-day",
    scenePose: "hugging_star",
    textTemplateEs: "Tu risa contagiosa llena de alegría cada rincón.",
    textTemplateEn: "Your contagious laughter fills every corner with joy.",
    ageVariants: {
      "0_6": { es: "Latido a latido, crecemos juntos en esta Navidad.", en: "Heartbeat by heartbeat, we grow together this Christmas." },
      "7_12": { es: "Tu risa contagiosa llena de alegría cada rincón.", en: "Your contagious laughter fills every corner with joy." },
      "13_24": { es: "¡Qué felices somos celebrando juntos!", en: "How happy we are celebrating together!" }
    },
    sensoryCueEs: "Acaricia suavemente las manitas de tu bebé.",
    sensoryCueEn: "Gently stroke your baby's hands.",
    promptBody: "Minimalist warm peach and cream background with golden star."
  },
  {
    pageNumber: 13,
    id: "rug_footprints",
    isScenePage: true,
    roleEs: "Huellas en la alfombra",
    roleEn: "Footprints on the Rug",
    layoutReservePercent: 30,
    layoutZoneLabelEs: "30% superior libre",
    layoutZoneLabelEn: "Upper 30% negative space",
    bgImage: STORY_ASSETS_REGISTRY.my_first_christmas_24p.getLayoutPath(13),
    themeMode: "warm-day",
    scenePose: "cover_tree",
    textTemplateEs: "¡Mira cuántas sorpresas junto a la bota navideña!",
    textTemplateEn: "Look how many surprises wait beside the tree!",
    ageVariants: {
      "0_6": { es: "Mira los regalos que esperan al pie del árbol.", en: "Look at the gifts waiting beneath the glowing tree." },
      "7_12": { es: "¡Mira cuántas sorpresas junto a la bota navideña!", en: "Look how many surprises wait beside the tree!" },
      "13_24": { es: "Seguimos las huellas por la alfombra hasta los regalos.", en: "We follow the footprints across the rug to the gifts." }
    },
    sensoryCueEs: "Nombra a {childName} y a {petName} señalando la alfombra.",
    sensoryCueEn: "Name {childName} and {petName} as you point to the rug.",
    promptBody: "Sunlit living room floor with wide cream wool rug and tree."
  },
  {
    pageNumber: 14,
    id: "first_discoveries",
    roleEs: "Primeros descubrimientos",
    roleEn: "First Discoveries",
    layoutReservePercent: 30,
    layoutZoneLabelEs: "30% superior libre",
    layoutZoneLabelEn: "Upper 30% negative space",
    bgImage: STORY_ASSETS_REGISTRY.my_first_christmas_24p.getLayoutPath(14),
    themeMode: "warm-gold",
    scenePose: "touching_pine",
    textTemplateEs: "Sigue el rastro de estrellas brillantes por la alfombra.",
    textTemplateEn: "Follow the trail of bright stars across the rug.",
    ageVariants: {
      "0_6": { es: "El mejor regalo de todos eres tú en nuestros brazos.", en: "The greatest gift of all is holding you in our arms." },
      "7_12": { es: "Sigue el rastro de estrellas brillantes por la alfombra.", en: "Follow the trail of bright stars across the rug." },
      "13_24": { es: "Cada paso tuyo es una nueva aventura en familia.", en: "Every step you take is a new family adventure." }
    },
    sensoryCueEs: "Invita al bebé a tocar las hojas de acebo ilustradas.",
    sensoryCueEn: "Invite baby to touch the illustrated holly leaves.",
    promptBody: "Clean warm ivory background with golden stardust trail."
  },
  {
    pageNumber: 15,
    id: "christmas_eve_window",
    isScenePage: true,
    roleEs: "Ventana de Nochebuena",
    roleEn: "Christmas Eve Window",
    layoutReservePercent: 30,
    layoutZoneLabelEs: "30% superior libre",
    layoutZoneLabelEn: "Upper 30% negative space",
    bgImage: STORY_ASSETS_REGISTRY.my_first_christmas_24p.getLayoutPath(15),
    themeMode: "warm-day",
    scenePose: "cover_tree",
    textTemplateEs: "¡Mira por la ventana! Copos de nieve caen en silencio.",
    textTemplateEn: "Look out the window! Soft snowflakes fall in silence.",
    ageVariants: {
      "0_6": { es: "La luna se asoma por la ventana en Nochebuena.", en: "The moon peeks through the window on Christmas Eve." },
      "7_12": { es: "¡Mira por la ventana! Copos de nieve caen en silencio.", en: "Look out the window! Soft snowflakes fall in silence." },
      "13_24": { es: "Miramos juntos las estrellas por la ventana de Nochebuena.", en: "Together we gaze at the stars on Christmas Eve." }
    },
    sensoryCueEs: "Señala la ventana iluminada y susurra con calma.",
    sensoryCueEn: "Point to the glowing window and whisper calmly.",
    promptBody: "Cozy corner beside frosted window with warm lamp glow."
  },
  {
    pageNumber: 16,
    id: "star_whisper",
    roleEs: "Susurro de estrellas",
    roleEn: "Whisper of Stars",
    layoutReservePercent: 30,
    layoutZoneLabelEs: "30% superior libre",
    layoutZoneLabelEn: "Upper 30% negative space",
    bgImage: STORY_ASSETS_REGISTRY.my_first_christmas_24p.getLayoutPath(16),
    themeMode: "night-indigo",
    isDarkPage: true,
    scenePose: "sleeping_moon",
    textTemplateEs: "Una noche mágica llena de luces y colores.",
    textTemplateEn: "A magical night filled with gentle lights and colors.",
    ageVariants: {
      "0_6": { es: "Las estrellas titilan despacito para acompañarte.", en: "The stars twinkle softly to keep you company." },
      "7_12": { es: "Una noche mágica llena de luces y colores.", en: "A magical night filled with gentle lights and colors." },
      "13_24": { es: "¡Buenas noches, luna! ¡Buenas noches, Navidad!", en: "Goodnight, moon! Goodnight, Christmas!" }
    },
    sensoryCueEs: "Baja el ritmo de tu voz preparando el descanso.",
    sensoryCueEn: "Slow your voice gently for bedtime.",
    promptBody: "Deep twilight indigo with glowing stars and crescent moon."
  },
  {
    pageNumber: 17,
    id: "goodnight_lullaby",
    isScenePage: true,
    roleEs: "Arrullo de buenas noches",
    roleEn: "Goodnight Lullaby",
    layoutReservePercent: 35,
    layoutZoneLabelEs: "35% superior libre",
    layoutZoneLabelEn: "Upper 35% negative space",
    bgImage: STORY_ASSETS_REGISTRY.my_first_christmas_24p.getLayoutPath(17),
    themeMode: "night-indigo",
    isDarkPage: true,
    scenePose: "sleeping_moon",
    textTemplateEs: "Acurrucado junto a {petName}, llega la hora de descansar.",
    textTemplateEn: "Snuggled beside {petName}, it is time to rest.",
    ageVariants: {
      "0_6": { es: "Cierra tus ojitos, estrellita; {petName} cuida tu sueño.", en: "Close your little eyes, starlight; {petName} watches over your sleep." },
      "7_12": { es: "Acurrucado junto a {petName}, llega la hora de descansar.", en: "Snuggled beside {petName}, it is time to rest." },
      "13_24": { es: "Después de tanto jugar, {petName} se duerme a tu lado.", en: "After so much play, {petName} falls asleep beside you." }
    },
    sensoryCueEs: "Acaricia suavemente la frente del bebé al cerrar la escena.",
    sensoryCueEn: "Gently stroke baby's forehead as you close the scene.",
    promptBody: "Peaceful bedtime indigo scene with nightlight glow."
  },
  {
    pageNumber: 18,
    id: "sweet_dreams_close",
    roleEs: "Dulces sueños",
    roleEn: "Sweet Dreams",
    layoutReservePercent: 30,
    layoutZoneLabelEs: "30% superior libre",
    layoutZoneLabelEn: "Upper 30% negative space",
    bgImage: STORY_ASSETS_REGISTRY.my_first_christmas_24p.getLayoutPath(18),
    themeMode: "warm-day",
    scenePose: "sleeping_moon",
    textTemplateEs: "Dulces sueños, pequeño explorador.",
    textTemplateEn: "Sweet dreams, little explorer.",
    ageVariants: {
      "0_6": { es: "Buenas noches, mi amor. A soñar bonito.", en: "Goodnight, my love. Have the sweetest dreams." },
      "7_12": { es: "Dulces sueños, pequeño explorador.", en: "Sweet dreams, little explorer." },
      "13_24": { es: "Descansa, campeón; mañana seguiremos descubriendo el mundo.", en: "Rest well, little champion; tomorrow we discover more of the world." }
    },
    sensoryCueEs: "Respira profundo y sonríe junto a tu bebé.",
    sensoryCueEn: "Take a calm breath and smile together.",
    promptBody: "Serene dusky lavender and warm cream with lullaby sparkles."
  },
  {
    pageNumber: 19,
    id: "capsule_first_photo",
    isCapsulePage: true,
    roleEs: "Cápsula · Nuestra primera foto",
    roleEn: "Capsule · Our First Photo",
    layoutReservePercent: 30,
    layoutZoneLabelEs: "30% superior libre",
    layoutZoneLabelEn: "Upper 30% negative space",
    bgImage: STORY_ASSETS_REGISTRY.my_first_christmas_24p.getLayoutPath(19),
    themeMode: "parchment-seal",
    scenePose: "cover_tree",
    textTemplateEs: "Nuestra primera foto juntos",
    textTemplateEn: "Our First Photo Together",
    subtextEs: "Pega aquí nuestra foto favorita de esta Navidad para recordar siempre lo pequeñito que eras.",
    subtextEn: "Place our favorite photo from this Christmas here to always remember how tiny you were.",
    sensoryCueEs: "Espacio reservado para atesorar su primera fotografía juntos.",
    sensoryCueEn: "Space reserved to treasure your first photo together.",
    promptBody: "Ornate golden oval photo frame on archival cream."
  },
  {
    pageNumber: 20,
    id: "capsule_footprints",
    isCapsulePage: true,
    roleEs: "Cápsula · Huellas del primer año",
    roleEn: "Capsule · First-Year Prints",
    layoutReservePercent: 30,
    layoutZoneLabelEs: "30% superior libre",
    layoutZoneLabelEn: "Upper 30% negative space",
    bgImage: STORY_ASSETS_REGISTRY.my_first_christmas_24p.getLayoutPath(20),
    themeMode: "parchment-seal",
    scenePose: "solo_pet_bell",
    textTemplateEs: "Las huellas de tu primer año",
    textTemplateEn: "Prints of Your First Year",
    subtextEs: "Estampa aquí tu manita o tu piecito junto a la huella de {petName}.",
    subtextEn: "Stamp your tiny hand or footprint here beside {petName}'s paw print.",
    sensoryCueEs: "Medallones gemelos para conservar las huellas del primer año.",
    sensoryCueEn: "Twin medallions for first-year keepsake prints.",
    promptBody: "Twin recessed keepsake medallions on warm ivory."
  },
  {
    pageNumber: 21,
    id: "capsule_first_words",
    isCapsulePage: true,
    roleEs: "Cápsula · Primeras palabras y sonidos",
    roleEn: "Capsule · First Words & Sounds",
    layoutReservePercent: 30,
    layoutZoneLabelEs: "30% superior libre",
    layoutZoneLabelEn: "Upper 30% negative space",
    bgImage: STORY_ASSETS_REGISTRY.my_first_christmas_24p.getLayoutPath(21),
    themeMode: "warm-gold",
    scenePose: "solo_pet_bell",
    textTemplateEs: "Tus primeras palabras y sonidos",
    textTemplateEn: "Your First Words & Sounds",
    subtextEs: "Anotamos aquí los sonidos, risas y palabras con las que iluminaste nuestros días.",
    subtextEn: "We record here the sounds, giggles, and words that brightened our days.",
    sensoryCueEs: "Anota las primeras palabritas y sonidos favoritos.",
    sensoryCueEn: "Record their favorite first words and sounds.",
    promptBody: "Three floating cloud speech frames on soft gold."
  },
  {
    pageNumber: 22,
    id: "capsule_family_wishes",
    isCapsulePage: true,
    roleEs: "Cápsula · Deseos de la familia",
    roleEn: "Capsule · Family Wishes",
    layoutReservePercent: 30,
    layoutZoneLabelEs: "30% superior libre",
    layoutZoneLabelEn: "Upper 30% negative space",
    bgImage: STORY_ASSETS_REGISTRY.my_first_christmas_24p.getLayoutPath(22),
    themeMode: "parchment-seal",
    scenePose: "hugging_star",
    textTemplateEs: "Deseos de quienes te aman",
    textTemplateEn: "Wishes From Those Who Love You",
    subtextEs: "Un espacio guardado para las palabras de mamá, papá, abuelos y padrinos.",
    subtextEn: "A space saved for loving words from mom, dad, grandparents, and godparents.",
    sensoryCueEs: "Un espacio para que la familia escriba sus deseos.",
    sensoryCueEn: "A space for family members to write their wishes.",
    promptBody: "Heirloom stationery parchment framed by watercolor holly."
  },
  {
    pageNumber: 23,
    id: "official_certificate",
    isCapsulePage: true,
    roleEs: "Certificado Oficial",
    roleEn: "Official First Christmas Certificate",
    layoutReservePercent: 30,
    layoutZoneLabelEs: "30% superior libre",
    layoutZoneLabelEn: "Upper 30% negative space",
    bgImage: STORY_ASSETS_REGISTRY.my_first_christmas_24p.getLayoutPath(23),
    themeMode: "parchment-seal",
    scenePose: "cover_tree",
    textTemplateEs: "Certificado Oficial de Primera Navidad",
    textTemplateEn: "Official First Christmas Certificate",
    subtextEs: "Certificamos que {childName}, junto a su fiel compañero {petName}, celebró su Primera Navidad llena de amor, asombro y alegría.",
    subtextEn: "We certify that {childName}, alongside their faithful companion {petName}, celebrated their First Christmas full of love, wonder, and joy.",
    sensoryCueEs: "Certificado conmemorativo de su primera Navidad.",
    sensoryCueEn: "Commemorative certificate of their first Christmas.",
    promptBody: "Museum-grade cream background with golden laurel wreath."
  },
  {
    pageNumber: 24,
    id: "dedication_seal",
    roleEs: "Dedicatoria y Sello Oficial RoxyTales",
    roleEn: "Dedication & Official Keepsake Seal",
    layoutReservePercent: 60,
    isDedicationPage: true,
    layoutZoneLabelEs: "Medallón superior; 60% inferior pergamino libre",
    layoutZoneLabelEn: "Upper medallion seal; lower 60% parchment card",
    bgImage: STORY_ASSETS_REGISTRY.my_first_christmas_24p.getLayoutPath(24),
    themeMode: "parchment-seal",
    scenePose: "keepsake_seal",
    textTemplateEs: "Con amor eterno, para {childName}{ageStamp}.\nDiciembre {customYear}.\n\n“{dedicationText}”\n\n— {signatureText}",
    textTemplateEn: "With eternal love, for {childName}{ageStamp}.\nDecember {customYear}.\n\n“{dedicationText}”\n\n— {signatureText}",
    sensoryCueEs: "Lee la dedicatoria familiar en voz alta con tu tono natural y amoroso para que el bebé escuche su nombre tejido en los recuerdos de su familia.",
    sensoryCueEn: "Read the personalized family note aloud in your natural, loving voice so the child hears their name embedded in family memories.",
    promptBody: "Warm ivory fleece texture fading into golden bokeh glow."
  }
];

/**
 * Diccionario de Internacionalización (i18n) Español / Inglés
 */
const I18N_DICTIONARY = {
  es: {
    // Navbar
    navTagline: "Libros de recuerdos ilustrados de colección · Encuadernación de lujo",
    navStudioLink: "Estudio Editorial",
    navCatalogLink: "Colecciones",
    navPrintSpecsBadge: "Edición de Colección · Formato de Lujo",
    roleClient: "Modo Tienda",
    roleAdmin: "Acceso Editorial",
    roleSwitchTooltip: "Panel de Control Editorial (Ctrl + Shift + A)",

    // Hero Banner
    heroEyebrow: "EL REGALO MÁS EMOCIONANTE DE SU INFANCIA · EDICIÓN DE COLECCIÓN",
    heroTitle: "El primer tesoro ilustrado de su vida, donde tu bebé y su fiel compañero cobran vida",
    heroSubtitle: "Una obra de arte encuadernada para atesorar siempre. Personaliza la dedicatoria, inyecta su nombre y vive un ritual de lectura mágico en familia antes de dormir.",

    // Wizard Tabs / Steps
    step1Short: "1. Dedicatoria",
    step2Short: "2. Protagonista",
    step3Short: "3. Compañero",
    step4Short: "4. Tu Cuento",
    step5Short: "5. Edición",

    // Step 1: Gift Giver
    step1Title: "La Dedicatoria y el Vínculo Familiar",
    step1Desc: "Quién entrega este tesoro y las palabras que acompañarán a tu bebé para siempre.",
    buyerNameLabel: "Tu nombre completo (Remitente del regalo)",
    buyerNamePlaceholder: "Ej. Carolina Martínez",
    buyerEmailLabel: "Tu correo electrónico (Para enviarte tu muestra digital y confirmación)",
    buyerEmailPlaceholder: "ejemplo@familia.com",
    relationshipLabel: "¿Cuál es tu parentesco con el bebé?",
    dedicationLabel: "Dedicatoria especial",
    inspireBtnLabel: "✨ Inspirar dedicatoria",
    customYearLabel: "Año de edición",
    leadGateStatusLocked: "🔒 Ingresa tu nombre y correo válidos para desplegar la magia.",
    leadGateStatusUnlocked: "✅ Edición lista: Tu cuento personalizado está desplegado.",
    step1ValidationAlert: "Por favor ingresa tu nombre completo y un correo electrónico válido para continuar.",

    // Step 2: Protagonist & Reactive Age
    step2Title: "El Pequeño Gran Protagonista",
    step2Desc: "Elige el nombre y la edad para adaptar la historia al momento exacto de su crecimiento.",
    collectionSelectLabel: "Etapa de crecimiento y título del cuento",
    childNameLabel: "Nombre del bebé",
    childNamePlaceholder: "Ej. Liam",
    ageLabelMonths: "Edad del bebé (meses de vida · 0 a 24 meses)",
    ageLabelYears: "Edad del niño/a (años de vida · {min} a {max} años)",
    ageUnitMonths: "meses",
    ageUnitYears: "años",
    ageReactiveBadgeMonths: "Etapa activa: Primeros meses (0–2 años)",
    ageReactiveBadgeYears: "Etapa activa: Primeros años (>2 años)",
    babyModeAttributes: "🎨 Ilustración Artística 3D",
    babyModePhoto: "📸 Fotografía Real del Bebé",
    skinToneLabel: "Tono de piel",
    hairStyleLabel: "Color y estilo de cabello",
    eyeColorLabel: "Color de ojos",
    fixedOutfitLabel: "Atuendo festivo de la edición:",
    fixedOutfitValue: "Pijama navideño marfil y suave gorrito de terciopelo con pompón",
    babyPhotoDropLabel: "Sube una fotografía nítida del rostro de tu bebé",
    babyPhotoDropHint: "Retrato en primer plano (JPG o PNG, máx. 5 MB). Se proyecta en un medallón suave.",
    photoRemoveBtn: "Quitar fotografía y volver a ilustración 3D",

    // Step 3: Pet Engine
    step3Title: "Su Inseparable Compañero de Aventuras",
    step3Desc: "Sube la foto de tu fiel compañero o usa a Roxy.",
    petTierAPrice: "Incluido sin costo adicional",
    petTierADesc: "Roxy, la cachorrita blanca de ojos tiernos y lazo de terciopelo rojo rubí.",
    petTierBDesc: "Sube una fotografía de tu perro o gato para proyectar su retrato ilustrado en el cuento.",
    petTierCDesc: "Personaliza especie, raza, pelaje, orejas y sonido característico en nuestro motor 3D.",
    petNameLabel: "Nombre del fiel compañero",
    petSoundLabel: "Sonido o voz en la Página 3",
    petSpeciesLabel: "Especie",
    petBreedLabel: "Raza",
    petCoatLabel: "Color de pelaje",
    petEarsLabel: "Forma de orejas",
    petPhotoDropLabel: "Fotografía de tu fiel compañero",

    // Step 4: Generate & Viewer Action
    step4Title: "Edición de Colección de 24 Páginas",
    step4Desc: "8 escenas principales ilustradas a doble página + páginas de dedicatoria familiar y cápsula de recuerdos del primer año.",
    generatePreviewBtn: "✨ Crear vista previa mágica",
    regeneratePreviewBtn: "🔄 Actualizar escenas del cuento",
    downloadSamplePdfBtn: "📄 Descargar muestra digital gratuita",
    renderingModalTitle: "Tejiendo la magia de tu libro...",
    renderingStage1: "Escaneando la tierna sonrisa de {childName}...",
    renderingStage2: "Pintando el árbol y peinando el lazo de Roxy...",
    renderingStage3: "Preparando tu edición de colección de 24 páginas...",
    renderingStage4: "¡Tu magia está lista!",

    // Post-Reveal Conversion Trigger (Página 8)
    postRevealTitle: "¿Te enamoraste del resultado?",
    postRevealBody: "Descarga tu muestra digital gratis ingresando tu correo o recibe esta edición impresa de 24 páginas en pasta dura en la puerta de tu casa (3 a 5 días hábiles estimados).",
    postRevealFreePdfBtn: "📄 Descargar muestra digital gratis",
    postRevealOrderHardcoverBtn: "⭐ Pedir Edición Pasta Dura",
    hardcoverChosenBadge: "★ Edición de Colección",

    // Step 5: Product Tiers & Checkout
    step5Title: "Elige el Acabado de tu Edición de Colección (24 Páginas)",
    step5Desc: "Edición de Colección de 24 páginas: 8 escenas principales ilustradas a doble página + dedicatoria familiar y cápsula de recuerdos del primer año.",
    tierDigitalTitle: "Edición Digital Completa (PDF de Alta Definición)",
    tierDigitalDesc: "Entrega instantánea para leer juntos en iPad, tabletas o imprimir en casa.",
    tierSoftcoverTitle: "Edición Impresa en Pasta Blanda (+ Digital Gratis)",
    tierSoftcoverDesc: "24 páginas en papel artístico Silk 170 gsm con cubierta laminada mate sedosa (+ Edición Digital incluida).",
    tierHardcoverTitle: "Edición de Lujo en Tapa Dura (+ Digital Gratis)",
    tierHardcoverDesc: "24 páginas en papel Silk 170 gsm con encuadernación PUR de alta resistencia y cubierta rígida mate (+ Edición Digital incluida).",
    tierBadgeInstant: "Entrega Inmediata",
    tierBadgePopular: "Gran Elección",
    tierBadgeStar: "★ Edición de Colección",
    couponInputLabel: "Código de descuento familiar",
    couponPlaceholder: "Ej. NAVIDAD20 o WAITLIST10",
    couponApplyBtn: "Aplicar",
    couponSuccessMsg: "Cupón {code} aplicado: -{discount}",
    couponInvalidMsg: "El código ingresado no existe o no está activo.",
    summaryProductBase: "Edición seleccionada",
    summaryPetUpsell: "Personalización del compañero",
    summaryDiscount: "Descuento familiar",
    summaryShipping: "Envío con seguimiento a domicilio ({country})",
    summaryShippingFree: "Gratis (Entrega Inmediata)",
    summaryTotal: "Total a pagar",
    openCheckoutBtn: "💳 Proceder al Pago Seguro",

    // Viewer Controls (Right Column)
    viewerHeaderTitle: "Tu tesoro ilustrado cobra vida",
    viewerSafeMarginToggle: "Guías editoriales de maquetación",
    viewerPrevBtn: "← Anterior",
    viewerNextBtn: "Siguiente →",
    viewerPageIndicator: "Página {current} de 24",
    viewerLockedOverlayTitle: "Tu cuento personalizado está listo",
    viewerLockedOverlayDesc: "Ingresa tu nombre y correo para desplegar las 8 páginas ilustradas y recibir tu muestra digital gratuita.",
    viewerUnlockBtn: "Desplegar las 8 páginas del cuento",
    sensoryGuideTitle: "📖 Sugerencia de Lectura Afectiva",
    promptInspectorTitle: "🔒 Especificaciones Artísticas del Cuento",
    copyPromptBtn: "Copiar ficha",
    copiedPromptToast: "¡Ficha copiada al portapapeles!",

    // Secondary Catalog (Coming Soon)
    catalogEyebrow: "PRÓXIMAS EDICIONES · FONDO EDITORIAL ROXYTALES",
    catalogTitle: "Nuevas aventuras y etapas del crecimiento",
    catalogSubtitle: "Descubre las próximas historias para cada hito de la infancia o reserva tu acceso exclusivo con un 10% de beneficio.",
    comingSoonBadge: "Próxima Edición · En Ilustración",
    waitlistCtaBtn: "🔔 Reservar acceso anticipado (-10%)",
    tryAgeInStudioBtn: "⚡ Probar esta etapa",

    // Before/After Photo-to-Story Reveal Section
    revealEyebrow: "TRANSFORMACIÓN VISUAL EDITORIAL",
    revealTitle: "Una simple foto. Una obra de arte que atesorará toda su vida.",
    revealSubtitle: "Desliza para descubrir cómo convertimos una fotografía cotidiana en una ilustración 3D de estudio cinematográfico con acabado de libro físico.",
    revealLabelBefore: "📷 Foto Real del Móvil",
    revealLabelAfter: "✨ Tesoro Ilustrado 3D",
    revealCtaBtn: "✨ Personaliza su tesoro ilustrado",

    // Inspiration Gallery ("Pequeños Grandes Héroes de RoxyTales")
    galleryEyebrow: "HISTORIAS REALES QUE INSPIRAN",
    galleryTitle: "Pequeños Grandes Héroes de RoxyTales",
    gallerySubtitle: "Explora cómo otras familias personalizaron el cuento de su bebé con su fiel compañero y descubre el estilo perfecto para tu hogar.",
    galleryCase1Badge: "Vínculo Inseparable",
    galleryCase1Title: "Liam & Roxy (10 meses)",
    galleryCase1Desc: "Su primera Navidad juntos frente a la chimenea",
    galleryCase1Quote: "«Liam no paraba de señalar a Roxy en el libro diciendo 'guau'. Fue el momento más tierno de Nochebuena.»",
    galleryCase2Badge: "Estimulación Temprana",
    galleryCase2Title: "Sofía & Lucas (8 meses)",
    galleryCase2Desc: "El asombro de tocar su primera esfera brillante",
    galleryCase2Quote: "«Los contrastes visuales mantuvieron su atención desde el primer segundo. La textura del papel es divina.»",
    galleryCase3Badge: "Apego y Familia",
    galleryCase3Title: "Mateo & Misi (14 meses)",
    galleryCase3Desc: "El abrazo más cálido para mamá y papá",
    galleryCase3Quote: "«A mis padres se les llenaron los ojos de lágrimas al ver la dedicatoria en la última página. Un regalo eterno.»",
    galleryTryStyleBtn: "Probar este estilo con mi bebé →",

    // 3 Transformational Pillars (Decision Triggers)
    pillarsEyebrow: "EL VALOR DE UN RECUERDO ETERNO",
    pillarsTitle: "Más que un cuento: Un ritual que recordarán toda la vida",
    pillar1Title: "El Efecto Espejo (Autoestima Temprana)",
    pillar1Hook: "No es un dibujo genérico. Es tu bebé reconociéndose como el protagonista de su propio universo.",
    pillar1Desc: "Estudios en neurodesarrollo demuestran que verse a sí mismo en un cuento estimula el autoconcepto, la empatía y una relación amorosa con la lectura.",
    pillar2Title: "El Ritual Bedtime sin Pantallas",
    pillar2Hook: "Sustituye 10 minutos de pantallas por el momento más cálido del día: tu voz leyéndole un cuento donde él o ella es el héroe.",
    pillar2Desc: "Luz tenue, cercanía física y una historia creada a su medida para inducir un sueño profundo, sereno y lleno de seguridad afectiva.",
    pillar3Title: "Calidad de Museo para Guardar Décadas",
    pillar3Hook: "Encuadernación PUR de alta resistencia, cubierta rígida mate y 24 páginas en papel Silk 170 gsm diseñadas para resistir las manitas curiosas.",
    pillar3Desc: "Hecho para ser hojeado cientos de veces, manchado de amor y conservado intacto hasta que tu bebé crezca y se lo lea a sus propios hijos.",

    // Emotional Social Proof (Testimonios)
    testimonialsEyebrow: "PALABRAS DE FAMILIAS REALES",
    testimonialsTitle: "Momentos que se quedan en el corazón",
    testimonial1Text: "«A mi esposo se le salieron las lágrimas al leer la dedicatoria en la cena de Nochebuena. Liam tiene 11 meses y no suelta la página donde sale Roxy ladrando.»",
    testimonial1Author: "Valentina R. · Miami, FL · Edición en Pasta Dura",
    testimonial2Text: "«Es la primera vez que veo un libro personalizado que realmente parece un cuento de hadas de cine. La calidad de la pasta dura es insuperable y el parecido con mi hija es asombroso.»",
    testimonial2Author: "Andrés M. · Bogotá, Colombia · Edición en Pasta Dura",
    testimonial3Text: "«Buscaba un regalo que no fuera otro juguete de plástico que termina olvidado en un rincón. Este cuento es una joya familiar que guardaremos toda la vida.»",
    testimonial3Author: "Elena S. · Madrid, España · Edición en Pasta Dura",

    // Sticky Conversion Bar & Urgency
    stickyBarTitle: "Crea el tesoro ilustrado de tu bebé en 60 segundos",
    stickyBarSubtitle: "✨ Edición especial de colección · Entrega a domicilio asegurada",
    stickyBarBtn: "Personalizar ahora →",
    hardcoverHolidayBadge: "✨ Edición de Colección · Producción local rápida (3 a 5 días hábiles estimados)",

    // Modals: Lead Gate
    leadGateModalTitle: "Despliega la Vista Previa de 8 Escenas",
    leadGateModalDesc: "Para disfrutar el cuento completo de {childName} y {petName} y recibir tu muestra digital gratuita, ingresa tus datos familiares.",
    leadGateModalSubmit: "✨ Desplegar Historia Completa y Muestra",
    leadGatePrivacyNote: "Privacidad protegida. Guardaremos tu diseño para que nunca pierdas el cuento de {childName}.",

    // Modals: Waitlist
    waitlistModalTitle: "Acceso Exclusivo + 10% de Beneficio",
    waitlistModalLegend: "Estamos ilustrando esta edición con esmero. Déjanos tu correo para avisarte en cuanto abra la preventa.",
    waitlistProductLabel: "Colección de interés:",
    waitlistEmailPlaceholder: "tu@familia.com",
    waitlistNamePlaceholder: "Tu nombre",
    waitlistSubmitBtn: "Reservar mi beneficio del 10%",
    waitlistSuccessTitle: "¡Reserva confirmada!",
    waitlistSuccessMsg: "Te hemos reservado un lugar prioritario. Tu código de beneficio del 10% es: WAITLIST10.",

    // Modals: Stripe Checkout
    checkoutModalTitle: "Finalizar Pedido Seguro · RoxyTales Publishing",
    checkoutShippingSection: "Dirección de entrega a domicilio",
    shippingStreetLabel: "Calle y número de casa / apartamento",
    shippingCityLabel: "Ciudad",
    shippingStateLabel: "Estado / Departamento / Provincia",
    shippingCountryLabel: "País de entrega",
    shippingPostalLabel: "Código Postal",
    gelatoSyncBadge: "Entrega estimada en {days} días hábiles con seguimiento asegurado",
    stripeCardLabel: "Pago de prueba simulado (sin cobro real)",
    payNowBtn: "Confirmar Pedido Seguro ({total} USD)",
    orderSuccessTitle: "¡Tu libro personalizado ha sido encargado con éxito!",
    orderSuccessDesc: "Hemos recibido todos los detalles de tu cuento. Tu edición entrará a encuadernación artesanal y te notificaremos con el número de seguimiento de tu entrega.",
    downloadCleanPdfBtn: "📖 Descargar mi libro digital completo",
    viewOdooPayloadBtn: "📋 Registro de Auditoría Editorial",

    // Admin Panel
    adminHeaderTitle: "Panel de Control Editorial RoxyTales",
    adminHeaderSubtitle: "Gestión de cupones, precios base, tarifas de entrega y auditoría de pedidos familiares.",
    adminCloseBtn: "Volver a la tienda",
    adminTabPricing: "Precios y Envíos",
    adminTabCoupons: "Cupones Familiares",
    adminTabLeads: "Auditoría de Lectores",
    adminTabPayload: "Registro de Órdenes",
    adminSavePricingBtn: "Guardar Cambios",
    adminResetPricingBtn: "Restaurar Valores",
    adminNewCouponTitle: "Crear nuevo cupón promocional",
    adminCouponCodeLabel: "Código (Ej. NAVIDAD20)",
    adminCouponTypeLabel: "Tipo de descuento",
    adminCouponTypePercent: "Porcentaje (%)",
    adminCouponTypeFixed: "Monto fijo ($ USD)",
    adminCouponValueLabel: "Valor",
    adminAddCouponBtn: "+ Dar de alta cupón",
    adminLeadsTableTitle: "Embudo de Lectores en localStorage",
    adminWaitlistTableTitle: "Registros de Reserva Anticipada",
    adminClearLeadsBtn: "Limpiar registros de prueba",

    // Traducciones añadidas (Especificaciones, Confianza, Checkout y Carga)
    navCheckoutBtn: "💳 Finalizar Compra",
    tierHardcoverTag: "Edición de Colección",
    specSilkTitle: "Papel Silk 170 gsm",
    specSilkDesc: "Acabado mate sedoso y colores vibrantes",
    specHardcoverTitle: "Tapa Dura Rígida",
    specHardcoverDesc: "Encuadernación profesional de alta resistencia",
    specDigitalTitle: "Edición Digital Incluida",
    specDigitalDesc: "Descarga inmediata para leer hoy mismo",
    specGuaranteeTitle: "Garantía de Sonrisas 100%",
    specGuaranteeDesc: "Reimpresión sin costo ante cualquier defecto",
    trustSslBadge: "🔒 Cifrado SSL 256-bit",
    trustGuaranteeBadge: "🛡️ Garantía 100% de Sonrisas",
    trustShippingBadge: "📦 Envío Puerta a Puerta",
    trustPaymentsLine: "Pagos protegidos procesados con Stripe · Visa · Mastercard · Apple Pay · Google Pay",
    stickyBarBtn: "💳 Finalizar Compra",
    babyPhotoDropBoxText: "Haz clic o arrastra la foto aquí",
    petPhotoDropBoxText: "Haz clic o arrastra la foto aquí",
    photoDropHintShort: "JPG, PNG o WEBP · Máx. 5 MB",
    topBarBadge: "Edición Limitada para la Primera Infancia",
    topBarSub: "Encuadernación de museo en tapa dura 8×8\" · Muestra digital gratuita antes de comprar · Envío asegurado",
    navEditionsLink: "Formatos de Colección",
    heroFamiliesCount: "· Más de 1,200 familias felices",
    heroHardcoverLabel: "Edición Tapa Dura de Colección (24 págs.) ·",
    step1Eyebrow: "Paso 1 · El Protagonista",
    babyPhotoLoaded: "Foto del bebé cargada",
    step2Eyebrow: "Paso 2 · El Compañero",
    petPhotoLoaded: "Fiel compañero cargado",
    petRemovePhotoBtn: "Quitar foto",
    noPhotoHandyTitle: "¿No tienes foto a la mano?",
    noPhotoHandyDesc: "Usa a nuestra cachorrita Roxy (con su lazo rojo)",
    useRoxyBtn: "🐾 Usar a Roxy",
    step3Eyebrow: "Paso 3 · Dedicatoria Familiar",
    viewerEyebrow: "EDICIÓN DE COLECCIÓN · 24 PÁGINAS",
    verifiedPurchaseBadge: "Compra Verificada",
    step5Eyebrow: "Acabados de Colección",
    tierDigitalF1: "24 páginas (8 escenas + dedicatoria y cápsula de recuerdos)",
    tierDigitalF2: "Archivo PDF de alta definición para iPad/móvil",
    tierDigitalF3: "Entrega digital instantánea al correo",
    tierDigitalTag: "Lectura Digital",
    tierSoftcoverF1: "Formato físico cuadrado 8×8\" (200×200 mm)",
    tierSoftcoverF2: "24 páginas en papel Silk 170 gsm de colores vibrantes",
    tierSoftcoverF3: "Cubierta flexible con tacto sedoso mate",
    tierSoftcoverF4: "Edición digital HD incluida gratis",
    tierSoftcoverTag: "Impreso + Digital",
    tierHardcoverF1: "Tapa dura rígida de colección con acabado mate resistente a huellas",
    tierHardcoverF2: "24 páginas en papel artístico grueso (170 gsm Silk) de alta durabilidad",
    tierHardcoverF3: "Incluye 8 escenas ilustradas + álbum de recuerdos y huellas del bebé",
    tierHardcoverF4: "Edición digital HD inmediata incluida gratis para leer en cualquier pantalla",
    tierHardcoverF5: "Empaque protector reforzado para llegar impecable a tu puerta",
    summaryTitle: "Resumen de tu Edición de Colección",
    summaryProtectedBadge: "✓ Compra Protegida",
    couponToggleLabel: "¿Tienes un código de descuento familiar?",
    footerTagline: "Cuentos ilustrados de colección para la primera infancia · Encuadernación artesanal de lujo",
    footerCopyright: "© 2026 RoxyTales. Todos los derechos reservados.",
    footerAdminLink: "Acceso Editorial",
    summaryQuantityLabel: "Cantidad de ejemplares",
    checkoutCancelBtn: "Cancelar",
    comingSoonBtnText: "Próximamente",
    galleryCase1Age: "10 meses",
    galleryCase2Age: "8 meses",
    galleryCase3Age: "14 meses",
    qty1Label: "1 libro",
    qty2Label: "2 libros · -10%",
    qty2Hint: "Ideal para abuelos",
    qty3Label: "3 libros · -15%",
    qty3Hint: "Paquete familiar",
    qty4Label: "4+ libros · -20%",
    qtyDigitalLockedNote: "La Edición Digital es de descarga unitaria.",
    summaryVolumeDiscountLabel: "Descuento por cantidad ({percent}%)",
    pilotCountryLabel: "País de envío",
    pilotCountryNotice: "Tu edición digital está lista al instante. Además, recibirás una oferta especial en tu correo para recibir tu edición de colección impresa en {country}.",
    warmShippingNote: "Preparamos cada ejemplar cerca de tu destino para entregas ágiles y sin trámites complicados. El envío se calcula según tu dirección antes de confirmar.",
    warmCustomsNote: "Si tu país o dirección aplica impuestos locales o cargos de importación fuera de rutas cubiertas, se gestionan según la normativa local.",
    customRelationshipOption: "✍️ Otro / Personalizado...",
    customRelationshipPlaceholder: "Ej. Ann y Sam / Papá y tu tío Luis",
    dedicationPlaceholder: "Escribe aquí tu dedicatoria especial para la Página 8...",
    checkoutDigitalDeliveryNotice: "📧 Entrega digital instantánea a tu correo electrónico (no requiere dirección física)."
  },

  en: {
    // Navbar
    navTagline: "Heirloom illustrated children's storybooks · Luxury keepsake binding",
    navStudioLink: "Creation Studio",
    navCatalogLink: "Collections",
    navPrintSpecsBadge: "Collector's Edition · Archival Square Format",
    roleClient: "Store Mode",
    roleAdmin: "Editorial Access",
    roleSwitchTooltip: "Editorial Control Panel (Ctrl + Shift + A)",

    // Hero Banner
    heroEyebrow: "THE MOST CHERISHED GIFT OF CHILDHOOD · HEIRLOOM EDITION",
    heroTitle: "The first story of their life, where your baby and pet become the heroes",
    heroSubtitle: "A keepsake book to treasure forever. Personalize the dedication, add their name, and create an unforgettable bedtime reading ritual together.",

    // Wizard Tabs / Steps
    step1Short: "1. Dedication",
    step2Short: "2. Protagonist",
    step3Short: "3. Companion",
    step4Short: "4. Your Story",
    step5Short: "5. Edition",

    // Step 1: Gift Giver
    step1Title: "The Dedication & Family Keepsake",
    step1Desc: "Who gifts this treasure and the loving words that will stay with your child forever.",
    buyerNameLabel: "Your full name (Gift Giver)",
    buyerNamePlaceholder: "e.g. Sarah Jenkins",
    buyerEmailLabel: "Your email address (To deliver your digital keepsake sample)",
    buyerEmailPlaceholder: "sarah@family.com",
    relationshipLabel: "Your relationship to the child",
    dedicationLabel: "Special dedication",
    inspireBtnLabel: "✨ Inspire dedication",
    customYearLabel: "Edition Year",
    leadGateStatusLocked: "🔒 Enter your valid name and email to unlock the magic.",
    leadGateStatusUnlocked: "✅ Full edition ready: Your personalized story is now open.",
    step1ValidationAlert: "Please enter your full name and a valid email address to continue.",

    // Step 2: Protagonist & Reactive Age
    step2Title: "The Little Story Hero",
    step2Desc: "Set their name and milestone to tailor the story to their exact moment of wonder.",
    collectionSelectLabel: "Milestone collection & story title",
    childNameLabel: "Baby's first name",
    childNamePlaceholder: "e.g. Liam",
    ageLabelMonths: "Baby's age (in months · 0 to 24 months)",
    ageLabelYears: "Child's age (in years · {min} to {max} years)",
    ageUnitMonths: "months",
    ageUnitYears: "years",
    ageReactiveBadgeMonths: "Active milestone: First months (0–2 Years)",
    ageReactiveBadgeYears: "Active milestone: Early years (>2 Years)",
    babyModeAttributes: "🎨 Artistic 3D Portrait",
    babyModePhoto: "📸 Real Baby Photograph",
    skinToneLabel: "Skin tone",
    hairStyleLabel: "Hair color & style",
    eyeColorLabel: "Eye color",
    fixedOutfitLabel: "Keepsake edition outfit:",
    fixedOutfitValue: "Cream holiday footed pajamas + soft velvet hat with white pom-pom",
    babyPhotoDropLabel: "Upload a clear, happy portrait of your baby's face",
    babyPhotoDropHint: "Close-up portrait (JPG or PNG, max 5 MB). Displayed in an ornate soft cameo frame.",
    photoRemoveBtn: "Remove photo & switch back to 3D portrait",

    // Step 3: Pet Engine
    step3Title: "Their Inseparable Adventure Companion",
    step3Desc: "Upload your pet's photo or use Roxy.",
    petTierAPrice: "Included at no extra charge",
    petTierADesc: "Roxy, the joyful white puppy with warm eyes and a ruby-red velvet ribbon bow.",
    petTierBDesc: "Upload a photo of your family dog or cat to feature their illustrated portrait in the story.",
    petTierCDesc: "Customize your pet by choosing species, breed, coat color, ears, and custom sound.",
    petNameLabel: "Pet's name",
    petSoundLabel: "Bark or sound on Page 3",
    petSpeciesLabel: "Species",
    petBreedLabel: "Breed",
    petCoatLabel: "Coat color",
    petEarsLabel: "Ear shape",
    petPhotoDropLabel: "Upload your pet's photo",

    // Step 4: Generate & Viewer Action
    step4Title: "24-Page Collector's Edition",
    step4Desc: "8 main double-spread illustrated scenes + family dedication & baby's first-year keepsake capsule.",
    generatePreviewBtn: "✨ Create magical story preview",
    regeneratePreviewBtn: "🔄 Refresh story scenes",
    downloadSamplePdfBtn: "📄 Download free digital sample",
    renderingModalTitle: "Weaving your storybook magic...",
    renderingStage1: "Scanning {childName}'s joyful smile...",
    renderingStage2: "Painting the glowing tree and styling Roxy's ribbon...",
    renderingStage3: "Preparing your 24-page collector's edition...",
    renderingStage4: "Your storybook is ready!",

    // Post-Reveal Conversion Trigger (Page 8)
    postRevealTitle: "In love with the result?",
    postRevealBody: "Download your free digital sample with your email or receive this 24-page hardcover collector's edition delivered to your door (estimated 3 to 5 business days).",
    postRevealFreePdfBtn: "📄 Download Free Digital Sample",
    postRevealOrderHardcoverBtn: "⭐ Order Luxury Hardcover",
    hardcoverChosenBadge: "★ Collector's Edition",

    // Step 5: Product Tiers & Checkout
    step5Title: "Choose Your 24-Page Collector's Edition Finish",
    step5Desc: "24-Page Collector's Edition: 8 main double-spread illustrated scenes + family dedication & baby's first-year keepsake capsule.",
    tierDigitalTitle: "Complete Digital Edition (High-Definition PDF)",
    tierDigitalDesc: "Instant delivery for bedtime reading together on iPad, tablets, or home printing.",
    tierSoftcoverTitle: "Softcover Printed Book (+ Free Digital Edition)",
    tierSoftcoverDesc: "24 pages on silky 170 gsm Silk art paper with matte laminated cover (+ Free Digital Edition).",
    tierHardcoverTitle: "Luxury Keepsake Hardcover (+ Free Digital Edition)",
    tierHardcoverDesc: "24 pages on 170 gsm Silk paper with high-strength PUR binding and rigid matte cover (+ Free Digital Edition).",
    tierBadgeInstant: "Instant Delivery",
    tierBadgePopular: "Great Value",
    tierBadgeStar: "★ Collector's Edition",
    couponInputLabel: "Family discount code",
    couponPlaceholder: "e.g. NAVIDAD20 or WAITLIST10",
    couponApplyBtn: "Apply",
    couponSuccessMsg: "Coupon {code} applied: -{discount}",
    couponInvalidMsg: "The code entered does not exist or is inactive.",
    summaryProductBase: "Selected Edition",
    summaryPetUpsell: "Pet Customization",
    summaryDiscount: "Family Discount",
    summaryShipping: "Tracked home delivery ({country})",
    summaryShippingFree: "Free (Instant Delivery)",
    summaryTotal: "Total",
    openCheckoutBtn: "💳 Proceed to Secure Checkout",

    // Viewer Controls (Right Column)
    viewerHeaderTitle: "Your Illustrated Keepsake Comes to Life",
    viewerSafeMarginToggle: "Editorial layout trim guides",
    viewerPrevBtn: "← Previous",
    viewerNextBtn: "Next →",
    viewerPageIndicator: "Page {current} of 24",
    viewerLockedOverlayTitle: "Your personalized story is ready",
    viewerLockedOverlayDesc: "Enter your name and email to open all 8 illustrated pages and receive your free digital sample.",
    viewerUnlockBtn: "Open all 8 story pages",
    sensoryGuideTitle: "📖 Loving Bedtime Reading Cue",
    promptInspectorTitle: "🔒 Storybook Art Specifications",
    copyPromptBtn: "Copy info",
    copiedPromptToast: "Info copied to clipboard!",

    // Secondary Catalog (Coming Soon)
    catalogEyebrow: "UPCOMING EDITIONS · ROXYTALES PUBLISHING LAB",
    catalogTitle: "New developmental stages and keepsake formats",
    catalogSubtitle: "Discover upcoming milestone stories or reserve your exclusive early access with a 10% launch benefit.",
    comingSoonBadge: "Upcoming Edition · In Illustration",
    waitlistCtaBtn: "🔔 Claim early access (-10%)",
    tryAgeInStudioBtn: "⚡ Test this milestone",

    // Before/After Photo-to-Story Reveal Section
    revealEyebrow: "EDITORIAL VISUAL TRANSFORMATION",
    revealTitle: "One simple photo. A keepsake masterpiece they will treasure forever.",
    revealSubtitle: "Drag to discover how we transform an everyday photo into a high-end 3D animated storybook illustration with luxury keepsake binding.",
    revealLabelBefore: "📷 Everyday Mobile Photo",
    revealLabelAfter: "✨ Luxury 3D Storybook",
    revealCtaBtn: "✨ Personalize your baby's storybook",

    // Inspiration Gallery ("Pequeños Grandes Héroes de RoxyTales")
    galleryEyebrow: "REAL STORIES THAT INSPIRE",
    galleryTitle: "Little Big Heroes of RoxyTales",
    gallerySubtitle: "Explore how other families personalized their baby's story with their pet and discover the perfect style for your family.",
    galleryCase1Badge: "Family Pet Bond",
    galleryCase1Title: "Liam & Roxy (10 months)",
    galleryCase1Desc: "Their first Christmas together by the fireplace",
    galleryCase1Quote: "“Liam kept pointing at Roxy in the book shouting 'woof'. It was the sweetest moment of Christmas Eve.”",
    galleryCase2Badge: "Early Sensory Acuity",
    galleryCase2Title: "Sofía & Lucas (8 months)",
    galleryCase2Desc: "The wonder of touching her first sparkling bauble",
    galleryCase2Quote: "“The visual contrasts kept her attention from the first second. The paper texture is divine.”",
    galleryCase3Badge: "Family Attachment",
    galleryCase3Title: "Mateo & Misi (14 months)",
    galleryCase3Desc: "The warmest bedtime hug for Mommy and Daddy",
    galleryCase3Quote: "“My parents were moved to tears seeing the dedication on the final page. An eternal gift.”",
    galleryTryStyleBtn: "Try this style with my baby →",

    // 3 Transformational Pillars (Decision Triggers)
    pillarsEyebrow: "THE VALUE OF AN ETERNAL KEEPSAKE",
    pillarsTitle: "More Than a Book: A Ritual They Will Cherish Forever",
    pillar1Title: "The Mirror Effect (Early Self-Esteem)",
    pillar1Hook: "Not a generic cartoon. It is your baby recognizing themselves as the hero of their own universe.",
    pillar1Desc: "Neurodevelopmental studies show that seeing oneself in a storybook fosters self-concept, empathy, and a lifelong love for reading.",
    pillar2Title: "The Screen-Free Bedtime Ritual",
    pillar2Hook: "Replace 10 minutes of screen time with the warmest moment of the day: your voice reading a story where they are the hero.",
    pillar2Desc: "Soft lighting, physical closeness, and a tailored bedtime tale to induce deep, peaceful sleep filled with secure attachment.",
    pillar3Title: "Museum-Grade Archival Quality",
    pillar3Hook: "High-strength PUR binding, rigid matte hardcover, and 24 pages on 170 gsm Silk art paper designed to withstand curious little hands.",
    pillar3Desc: "Built to be read hundreds of times, touched with love, and kept pristine until your child grows up to read it to their own children.",

    // Emotional Social Proof (Testimonios)
    testimonialsEyebrow: "WORDS FROM REAL FAMILIES",
    testimonialsTitle: "Moments That Stay in the Heart",
    testimonial1Text: "“My husband was moved to tears reading the dedication on Christmas Eve dinner. Liam is 11 months old and won't let go of the page where Roxy barks.”",
    testimonial1Author: "Valentina R. · Miami, FL · Hardcover Edition",
    testimonial2Text: "“It's the first time I've seen a personalized book that truly looks like a cinematic animated fairy tale. The hardcover quality is unmatched and the resemblance is stunning.”",
    testimonial2Author: "Andrés M. · Bogotá, Colombia · Hardcover Edition",
    testimonial3Text: "“I was looking for a gift that wasn't another plastic toy that ends up forgotten in a corner. This book is a family treasure we will keep forever.”",
    testimonial3Author: "Elena S. · Madrid, Spain · Hardcover Edition",

    // Sticky Conversion Bar & Urgency
    stickyBarTitle: "Create your baby's storybook in 60 seconds",
    stickyBarSubtitle: "✨ Special Keepsake Edition · Tracked home delivery",
    stickyBarBtn: "Personalize now →",
    hardcoverHolidayBadge: "✨ Collector's Edition · Fast local production (est. 3 to 5 business days)",

    // Modals: Lead Gate
    leadGateModalTitle: "Unlock the 8-Scene Story Preview",
    leadGateModalDesc: "To experience {childName} & {petName}'s complete illustrated story and receive your free digital sample, please enter your details.",
    leadGateModalSubmit: "✨ Open Full Story & Sample",
    leadGatePrivacyNote: "Your privacy is respected. We save your progress so you never lose {childName}'s custom story.",

    // Modals: Waitlist
    waitlistModalTitle: "Exclusive Access + 10% Launch Benefit",
    waitlistModalLegend: "We are currently illustrating this storybook with care. Join the waitlist with your email to receive early access and a 10% discount.",
    waitlistProductLabel: "Selected collection:",
    waitlistEmailPlaceholder: "you@family.com",
    waitlistNamePlaceholder: "Your name",
    waitlistSubmitBtn: "Claim My 10% Launch Benefit",
    waitlistSuccessTitle: "You're on the Exclusive Priority List!",
    waitlistSuccessMsg: "Your reservation is confirmed. Your active 10% launch code is: WAITLIST10.",

    // Modals: Stripe Checkout
    checkoutModalTitle: "Finalize Secure Order · RoxyTales Publishing",
    checkoutShippingSection: "Home Delivery Address",
    shippingStreetLabel: "Street Address & Apartment/Unit",
    shippingCityLabel: "City",
    shippingStateLabel: "State / Province / Department",
    shippingCountryLabel: "Delivery Country",
    shippingPostalLabel: "Postal / ZIP Code",
    gelatoSyncBadge: "Estimated delivery in {days} business days with tracked shipping",
    stripeCardLabel: "Test Mode · Simulated checkout (no real charge)",
    payNowBtn: "Confirm Secure Order ({total} USD)",
    orderSuccessTitle: "Your personalized storybook has been successfully placed!",
    orderSuccessDesc: "We have received all your story details. Your edition is entering artisanal binding, and you will receive tracked delivery updates.",
    downloadCleanPdfBtn: "📖 Download My Complete Digital Book",
    viewOdooPayloadBtn: "📋 Editorial Order Log",

    // Admin Panel
    adminHeaderTitle: "RoxyTales Editorial Control Panel",
    adminHeaderSubtitle: "Manage discount coupons, catalog base prices, delivery fees, and order logs.",
    adminCloseBtn: "Back to Storefront",
    adminTabPricing: "Pricing & Delivery",
    adminTabCoupons: "Coupon Manager",
    adminTabLeads: "Reader Audit",
    adminTabPayload: "Order Records",
    adminSavePricingBtn: "Save Changes",
    adminResetPricingBtn: "Restore Defaults",
    adminNewCouponTitle: "Create new promotional coupon",
    adminCouponCodeLabel: "Code (e.g. NAVIDAD20)",
    adminCouponTypeLabel: "Discount type",
    adminCouponTypePercent: "Percentage (%)",
    adminCouponTypeFixed: "Fixed amount ($ USD)",
    adminCouponValueLabel: "Value",
    adminAddCouponBtn: "+ Create Coupon",
    adminLeadsTableTitle: "Reader Funnel Records in localStorage",
    adminWaitlistTableTitle: "Early Access Reservations",
    adminClearLeadsBtn: "Clear test records",

    // Added translations (Specs, Trust, Checkout & Upload)
    navCheckoutBtn: "💳 Checkout",
    tierHardcoverTag: "Collector's Edition",
    specSilkTitle: "170 gsm Silk Paper",
    specSilkDesc: "Silky matte finish and vibrant colors",
    specHardcoverTitle: "Rigid Hardcover",
    specHardcoverDesc: "Professional high-strength binding",
    specDigitalTitle: "Digital Edition Included",
    specDigitalDesc: "Instant download to read today",
    specGuaranteeTitle: "100% Smiles Guarantee",
    specGuaranteeDesc: "Free reprint for any defect",
    trustSslBadge: "🔒 256-bit SSL Encryption",
    trustGuaranteeBadge: "🛡️ 100% Smiles Guarantee",
    trustShippingBadge: "📦 Door-to-Door Delivery",
    trustPaymentsLine: "Protected payments processed by Stripe · Visa · Mastercard · Apple Pay · Google Pay",
    stickyBarBtn: "💳 Checkout Now",
    babyPhotoDropBoxText: "Click or drag photo here",
    petPhotoDropBoxText: "Click or drag photo here",
    photoDropHintShort: "JPG, PNG or WEBP · Max 5 MB",
    topBarBadge: "Limited First-Years Collector's Edition",
    topBarSub: "Museum-grade 8×8\" hardcover binding · Free digital sample before purchase · Insured shipping",
    navEditionsLink: "Editions",
    heroFamiliesCount: "· Over 1,200 happy families",
    heroHardcoverLabel: "Collector's Hardcover Edition (24 pp.) ·",
    step1Eyebrow: "Step 1 · The Protagonist",
    babyPhotoLoaded: "Baby photo uploaded",
    step2Eyebrow: "Step 2 · The Companion",
    petPhotoLoaded: "Custom pet uploaded",
    petRemovePhotoBtn: "Remove photo",
    noPhotoHandyTitle: "Don't have a photo handy?",
    noPhotoHandyDesc: "Use our puppy Roxy (with her red bow)",
    useRoxyBtn: "🐾 Use Roxy",
    step3Eyebrow: "Step 3 · Family Dedication",
    viewerEyebrow: "COLLECTOR'S EDITION · 24 PAGES",
    verifiedPurchaseBadge: "Verified Purchase",
    step5Eyebrow: "Collector's Finishes",
    tierDigitalF1: "24 pages (8 scenes + dedication & keepsake capsule)",
    tierDigitalF2: "High-definition PDF for iPad/mobile",
    tierDigitalF3: "Instant email digital delivery",
    tierDigitalTag: "Digital Reading",
    tierSoftcoverF1: "Physical square format 8×8\" (200×200 mm)",
    tierSoftcoverF2: "24 pages on vibrant 170 gsm Silk paper",
    tierSoftcoverF3: "Flexible matte silky-touch cover",
    tierSoftcoverF4: "Free HD digital edition included",
    tierSoftcoverTag: "Print + Digital",
    tierHardcoverF1: "Collector's rigid hardcover with fingerprint-resistant matte finish",
    tierHardcoverF2: "24 pages on thick archival-feel art paper (170 gsm Silk)",
    tierHardcoverF3: "Includes 8 illustrated scenes + baby's first-year keepsake album",
    tierHardcoverF4: "Free instant HD digital edition to read on any screen",
    tierHardcoverF5: "Reinforced protective packaging to arrive spotless at your door",
    summaryTitle: "Your Collector's Edition Summary",
    summaryProtectedBadge: "✓ Protected Purchase",
    couponToggleLabel: "Have a family discount code?",
    footerTagline: "Heirloom illustrated storybooks for early childhood · Luxury artisanal binding",
    footerCopyright: "© 2026 RoxyTales. All rights reserved.",
    footerAdminLink: "Editorial Access",
    summaryQuantityLabel: "Quantity",
    checkoutCancelBtn: "Cancel",
    comingSoonBtnText: "Coming Soon",
    galleryCase1Age: "10 months",
    galleryCase2Age: "8 months",
    galleryCase3Age: "14 months",
    qty1Label: "1 book",
    qty2Label: "2 books · -10%",
    qty2Hint: "Great for grandparents",
    qty3Label: "3 books · -15%",
    qty3Hint: "Family bundle",
    qty4Label: "4+ books · -20%",
    qtyDigitalLockedNote: "The Digital Edition is a single-copy download.",
    summaryVolumeDiscountLabel: "Volume discount ({percent}%)",
    pilotCountryLabel: "Shipping country",
    pilotCountryNotice: "Your digital edition is ready instantly. Plus, you'll receive a special offer in your email to get your collector's printed edition in {country}.",
    warmShippingNote: "Each copy is crafted close to your destination for smooth, timely delivery. Shipping is calculated by address before checkout.",
    warmCustomsNote: "Any applicable local taxes or import charges outside covered routes follow local regulations.",
    customRelationshipOption: "✍️ Other / Custom...",
    customRelationshipPlaceholder: "e.g. Ann & Sam / Mom & Uncle Luis",
    dedicationPlaceholder: "Write your special dedication for Page 8 here...",
    checkoutDigitalDeliveryNotice: "📧 Instant digital delivery to your email (no physical address required)."
  }
};


// === SOURCE: adminService.js ===
/**
 * @file adminService.js
 * @description Servicio centralizado de estado administrativo para RoxyTales:
 * gestiona reglas de precios base del catálogo, tarifas de referencia de envío Gelato,
 * cupones promocionales dinámicos y sincronización reactiva con la tienda.
 */


class AdminService {
  constructor() {
    this._ensureInitialized();
  }

  /**
   * Inicializa localStorage con valores por defecto si aún no existen.
   */
  _ensureInitialized() {
    try {
      if (!localStorage.getItem(APP_CONFIG.storageKeys.adminPricing)) {
        localStorage.setItem(
          APP_CONFIG.storageKeys.adminPricing,
          JSON.stringify(this._extractPricingState(DEFAULT_PRICING_CONFIG))
        );
      }
      if (!localStorage.getItem(APP_CONFIG.storageKeys.adminCoupons)) {
        localStorage.setItem(
          APP_CONFIG.storageKeys.adminCoupons,
          JSON.stringify(DEFAULT_COUPONS)
        );
      }
    } catch (err) {
      console.warn("[AdminService] Storage initialization fallback:", err);
    }
  }

  _extractPricingState(configObj) {
    return {
      pricingVersion: Number(configObj.pricingVersion || 4),
      digital: Number(configObj.tiers.digital.price),
      softcover: Number(configObj.tiers.softcover.price),
      hardcover: Number(configObj.tiers.hardcover.price),
      petPhotoUpsell: 0,
      petTraitsUpsell: 0,
      referenceShippingFee: Number(configObj.referenceShippingFee)
    };
  }

  /**
   * Obtiene los precios vigentes configurados en el sistema.
   * Migra automáticamente configuraciones antiguas o en cero al catálogo vigente.
   */
  getPricing() {
    try {
      const raw = localStorage.getItem(APP_CONFIG.storageKeys.adminPricing);
      if (raw) {
        const parsed = JSON.parse(raw);
        const isValidVersion = Number(parsed.pricingVersion || 0) >= 4;
        const hasValidPrices =
          Number(parsed.digital) > 0 &&
          Number(parsed.softcover) > 0 &&
          Number(parsed.hardcover) > 0;

        if (isValidVersion && hasValidPrices) {
          return {
            pricingVersion: 4,
            digital: Number(parsed.digital),
            softcover: Number(parsed.softcover),
            hardcover: Number(parsed.hardcover),
            petPhotoUpsell: 0,
            petTraitsUpsell: 0,
            referenceShippingFee: Number(parsed.referenceShippingFee ?? DEFAULT_PRICING_CONFIG.referenceShippingFee)
          };
        }
        const migrated = this._extractPricingState(DEFAULT_PRICING_CONFIG);
        localStorage.setItem(APP_CONFIG.storageKeys.adminPricing, JSON.stringify(migrated));
        return migrated;
      }
    } catch (e) {
      console.warn("[AdminService] Error reading pricing:", e);
    }
    return this._extractPricingState(DEFAULT_PRICING_CONFIG);
  }

  /**
   * Actualiza los precios de las variantes y envío de referencia.
   * Dispara un evento global para que la interfaz recalcule de inmediato.
   */
  updatePricing(newPricing) {
    const current = this.getPricing();
    const updated = {
      pricingVersion: 4,
      digital: Math.max(0.01, Number(newPricing.digital ?? current.digital) || DEFAULT_PRICING_CONFIG.tiers.digital.price),
      softcover: Math.max(0.01, Number(newPricing.softcover ?? current.softcover) || DEFAULT_PRICING_CONFIG.tiers.softcover.price),
      hardcover: Math.max(0.01, Number(newPricing.hardcover ?? current.hardcover) || DEFAULT_PRICING_CONFIG.tiers.hardcover.price),
      petPhotoUpsell: 0,
      petTraitsUpsell: 0,
      referenceShippingFee: Math.max(0, Number(newPricing.referenceShippingFee ?? current.referenceShippingFee))
    };

    localStorage.setItem(APP_CONFIG.storageKeys.adminPricing, JSON.stringify(updated));
    this._notifyChange("pricing_updated", updated);
    return updated;
  }

  /**
   * Restaura los precios a los valores originales del Master Blueprint.
   */
  resetPricingToDefault() {
    const defaults = this._extractPricingState(DEFAULT_PRICING_CONFIG);
    localStorage.setItem(APP_CONFIG.storageKeys.adminPricing, JSON.stringify(defaults));
    this._notifyChange("pricing_reset", defaults);
    return defaults;
  }

  /**
   * Devuelve el precio unitario de un tier de producto ('digital' | 'softcover' | 'hardcover')
   */
  getTierBasePrice(tierId) {
    const pricing = this.getPricing();
    if (tierId === "digital") return pricing.digital;
    if (tierId === "softcover") return pricing.softcover;
    return pricing.hardcover;
  }

  /**
   * Sin costo adicional por renderizar al bebé o la mascota (siempre $0.00).
   */
  getPetUpsellPrice(_petTierId) {
    return 0.00;
  }

  /**
   * Calcula la tarifa de envío de Gelato para un país y formato.
   * Si es Digital Edition, el envío es $0.00.
   * Para formatos físicos, toma la referencia configurada en Admin para US y escala según la matriz Gelato.
   */
  getGelatoShippingQuote(countryCode = "US", tierId = "hardcover") {
    const tierSpec = DEFAULT_PRICING_CONFIG.tiers[tierId] || DEFAULT_PRICING_CONFIG.tiers.hardcover;
    if (!tierSpec.requiresShipping) {
      return {
        fee: 0.00,
        countryCode,
        hub: "Digital Cloud Delivery (300 DPI PDF)",
        transitDays: "0"
      };
    }

    const pricing = this.getPricing();
    const matrixEntry = GELATO_SHIPPING_MATRIX[countryCode] || GELATO_SHIPPING_MATRIX.US;
    // Escala proporcionalmente respecto al valor base de referencia ($4.50 USD en US)
    const defaultUsBase = GELATO_SHIPPING_MATRIX.US.baseFee;
    const ratio = defaultUsBase > 0 ? matrixEntry.baseFee / defaultUsBase : 1;
    const computedFee = Number((pricing.referenceShippingFee * ratio).toFixed(2));

    return {
      fee: computedFee,
      countryCode,
      countryName: matrixEntry.countryName,
      hub: matrixEntry.hub,
      transitDays: matrixEntry.transitDays
    };
  }

  /**
   * Obtiene todos los cupones configurados.
   */
  getCoupons() {
    try {
      const raw = localStorage.getItem(APP_CONFIG.storageKeys.adminCoupons);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("[AdminService] Error reading coupons:", e);
    }
    return [...DEFAULT_COUPONS];
  }

  /**
   * Crea o actualiza un cupón promocional.
   */
  upsertCoupon({ code, type, value, active = true, descriptionEs = "", descriptionEn = "" }) {
    const normalizedCode = String(code || "").trim().toUpperCase();
    if (!normalizedCode) {
      throw new Error("Coupon code is required");
    }
    const numericVal = Math.max(0, Number(value) || 0);
    const validType = type === "fixed" ? "fixed" : "percent";
    const cappedVal = validType === "percent" ? Math.min(100, numericVal) : numericVal;

    const coupons = this.getCoupons();
    const existingIndex = coupons.findIndex((c) => c.code.toUpperCase() === normalizedCode);

    const newCoupon = {
      code: normalizedCode,
      type: validType,
      value: cappedVal,
      active: Boolean(active),
      descriptionEs: descriptionEs || (validType === "percent" ? `${cappedVal}% de descuento` : `$${cappedVal.toFixed(2)} USD de descuento`),
      descriptionEn: descriptionEn || (validType === "percent" ? `${cappedVal}% discount` : `$${cappedVal.toFixed(2)} USD discount`)
    };

    if (existingIndex >= 0) {
      coupons[existingIndex] = newCoupon;
    } else {
      coupons.unshift(newCoupon);
    }

    localStorage.setItem(APP_CONFIG.storageKeys.adminCoupons, JSON.stringify(coupons));
    this._notifyChange("coupons_updated", coupons);
    return newCoupon;
  }

  /**
   * Activa o desactiva un cupón existente por su código.
   */
  toggleCouponStatus(code) {
    const normalizedCode = String(code || "").trim().toUpperCase();
    const coupons = this.getCoupons();
    const target = coupons.find((c) => c.code.toUpperCase() === normalizedCode);
    if (target) {
      target.active = !target.active;
      localStorage.setItem(APP_CONFIG.storageKeys.adminCoupons, JSON.stringify(coupons));
      this._notifyChange("coupons_updated", coupons);
    }
    return coupons;
  }

  /**
   * Elimina un cupón por su código.
   */
  deleteCoupon(code) {
    const normalizedCode = String(code || "").trim().toUpperCase();
    const coupons = this.getCoupons().filter((c) => c.code.toUpperCase() !== normalizedCode);
    localStorage.setItem(APP_CONFIG.storageKeys.adminCoupons, JSON.stringify(coupons));
    this._notifyChange("coupons_updated", coupons);
    return coupons;
  }

  /**
   * Valida un código de cupón frente al subtotal (base + upsell mascota).
   */
  validateAndCalculateCoupon(code, subtotalAmount) {
    const normalizedCode = String(code || "").trim().toUpperCase();
    if (!normalizedCode) {
      return { valid: false, code: "", discountAmount: 0.00, coupon: null };
    }

    const coupons = this.getCoupons();
    const found = coupons.find(
      (c) => c.code.toUpperCase() === normalizedCode && c.active === true
    );

    if (!found) {
      return { valid: false, code: normalizedCode, discountAmount: 0.00, coupon: null };
    }

    let discountAmount = 0;
    if (found.type === "percent") {
      discountAmount = Number(((subtotalAmount * found.value) / 100).toFixed(2));
    } else {
      discountAmount = Number(Math.min(subtotalAmount, found.value).toFixed(2));
    }

    return {
      valid: true,
      code: found.code,
      discountAmount,
      coupon: found
    };
  }

  /**
   * Calcula el desglose financiero completo para la orden actual.
   */
  calculateOrderBreakdown({ tierId = "hardcover", petTierId = "tier_a_default", couponCode = "", countryCode = "US", quantity = 1 }) {
    const isDigital = tierId === "digital";
    const qty = isDigital ? 1 : Math.max(1, Math.min(20, Math.floor(Number(quantity) || 1)));
    const basePrice = Number(this.getTierBasePrice(tierId).toFixed(2));
    const petUpsellPrice = Number(this.getPetUpsellPrice(petTierId).toFixed(2));
    const lineSubtotal = Number((basePrice * qty).toFixed(2));
    const subtotalBeforeDiscount = Number(((basePrice + petUpsellPrice) * qty).toFixed(2));

    // Descuento escalonado por volumen solo para ediciones impresas: 1 -> 0%, 2 -> 10%, 3 -> 15%, 4+ -> 20%
    let volumeDiscountPercent = 0;
    if (!isDigital) {
      if (qty >= 4) volumeDiscountPercent = 20;
      else if (qty === 3) volumeDiscountPercent = 15;
      else if (qty === 2) volumeDiscountPercent = 10;
    }
    const volumeDiscountAmount = Number(((subtotalBeforeDiscount * volumeDiscountPercent) / 100).toFixed(2));
    const subtotalAfterVolume = Number(Math.max(0, subtotalBeforeDiscount - volumeDiscountAmount).toFixed(2));
    const effectiveUnitPrice = Number((subtotalAfterVolume / qty).toFixed(2));

    const couponResult = this.validateAndCalculateCoupon(couponCode, subtotalAfterVolume);
    const discountAmount = couponResult.valid ? couponResult.discountAmount : 0.00;

    const shippingQuote = this.getGelatoShippingQuote(countryCode, tierId);
    const shippingFee = shippingQuote.fee;

    const totalAmount = Number(
      Math.max(0, subtotalAfterVolume - discountAmount + shippingFee).toFixed(2)
    );

    return {
      selectedTier: tierId,
      isDigital,
      quantity: qty,
      basePrice,
      lineSubtotal,
      petTier: petTierId,
      petUpsellPrice,
      subtotalBeforeDiscount,
      volumeDiscountPercent,
      volumeDiscountAmount,
      subtotalAfterVolume,
      effectiveUnitPrice,
      discountCode: couponResult.valid ? couponResult.code : "",
      discountAmount,
      couponValid: couponResult.valid,
      couponObject: couponResult.coupon,
      shippingFee,
      shippingQuote,
      totalAmount,
      currency: APP_CONFIG.defaultCurrency
    };
  }

  _notifyChange(reason, detail) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("roxytales:admin-updated", {
          detail: { reason, data: detail }
        })
      );
    }
  }
}

const adminService = new AdminService();


// === SOURCE: odooService.js ===
/**
 * @file odooService.js
 * @description Capa de sincronización con el backend FastAPI (/api/odoo/*) y respaldo local.
 * - Nunca almacena ni expone credenciales ni URLs internas de Odoo en el navegador.
 * - Identifica visitantes anónimos con `visitor_id` local sin crear registros remotos sin correo.
 * - Sincroniza leads, lista de espera, pedidos independientes por libro y estado inverso.
 */



const VISITOR_STORAGE_KEY = "roxytales_visitor_id";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class OdooService {
  _getApiBaseUrl() {
    if (typeof window !== "undefined") {
      if (window.ROXY_API_URL) {
        return String(window.ROXY_API_URL).replace(/\/+$/, "");
      }
      const { hostname, port, origin } = window.location || {};
      if ((hostname === "127.0.0.1" || hostname === "localhost") && port === "4173") {
        return "http://127.0.0.1:8000";
      }
      if (origin && origin !== "null") {
        return origin.replace(/\/+$/, "");
      }
    }
    return "http://127.0.0.1:8000";
  }

  _simulateDelay(customMs = null) {
    const { min, max } = APP_CONFIG.simulatedApiLatencyMs;
    const ms = customMs ?? Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getVisitorId() {
    try {
      let id = localStorage.getItem(VISITOR_STORAGE_KEY);
      if (!id) {
        id = `vis_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        localStorage.setItem(VISITOR_STORAGE_KEY, id);
      }
      return id;
    } catch {
      return `vis_mem_${Date.now().toString(36)}`;
    }
  }

  _isValidEmail(email) {
    return EMAIL_REGEX.test(String(email || "").trim().toLowerCase());
  }

  async _requestBackend(path, method = "GET", body = null, timeoutMs = 8000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const opts = {
        method,
        headers: { "Content-Type": "application/json" },
        signal: controller.signal
      };
      if (body !== null) {
        opts.body = JSON.stringify(body);
      }
      const res = await fetch(`${this._getApiBaseUrl()}${path}`, opts);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  getCrmLeads() {
    try {
      const raw = localStorage.getItem(APP_CONFIG.storageKeys.crmLeads);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn("[OdooService] Error reading CRM leads:", e);
      return [];
    }
  }

  getWaitlistLeads() {
    try {
      const raw = localStorage.getItem(APP_CONFIG.storageKeys.waitlistLeads);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn("[OdooService] Error reading waitlist_leads:", e);
      return [];
    }
  }

  getCompletedOrders() {
    try {
      const raw = localStorage.getItem(APP_CONFIG.storageKeys.orders);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn("[OdooService] Error reading completed orders:", e);
      return [];
    }
  }

  getLastOdooPayload(currentStudioState = null) {
    try {
      const raw = localStorage.getItem(APP_CONFIG.storageKeys.lastOdooPayload);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("[OdooService] Error reading last payload:", e);
    }

    if (currentStudioState) {
      return this.buildOdooOrderPayload(currentStudioState, {
        street: "742 Evergreen Terrace",
        city: "Miami",
        state: "FL",
        country_code: "US",
        postal_code: "33101"
      }, "preview_draft");
    }

    return this.buildOdooOrderPayload();
  }

  /**
   * Registra evento de lead en respaldo local y sincroniza con el backend
   * únicamente cuando el visitante aporta un correo válido (regla anónimo vs. lead).
   */
  async create_crm_lead(studioState = {}, eventType = "lead_captured", syncImmediate = false) {
    if (!syncImmediate) {
      await this._simulateDelay(200);
    }

    const leads = this.getCrmLeads();
    const email = String(studioState.buyerEmail || "").trim().toLowerCase();
    const buyerName = String(studioState.buyerName || "").trim();
    const childName = String(studioState.childName || "Liam").trim();
    const visitorId = this.getVisitorId();
    const leadKey = email || `session_${visitorId}`;

    const relObj =
      GIFT_GIVER_OPTIONS.find((r) => r.id === studioState.relationshipId) ||
      GIFT_GIVER_OPTIONS[0];

    const stageLabelMap = {
      lead_abandonment: "Lead Abandonment (Oportunidad preventiva)",
      lead_captured: "Lead Capturado (Email Gate)",
      preview_generated: "Vista Previa Creada (24 Páginas)",
      free_sample_pdf: "Muestra Digital Descargada",
      international_print_pilot_lead: "Piloto Impresión Internacional",
      order_completed: "Pedido Completado"
    };

    const existingIdx = leads.findIndex((item) => item.lead_key === leadKey);
    const existingStage = existingIdx >= 0 ? leads[existingIdx].funnel_stage : null;
    const resolvedEvent = existingStage === "order_completed" ? "order_completed" : eventType;

    const leadRecord = {
      id: existingIdx >= 0 ? leads[existingIdx].id : `RT-LEAD-${Date.now().toString().slice(-6)}`,
      visitor_id: visitorId,
      lead_key: leadKey,
      event: resolvedEvent,
      funnel_stage: resolvedEvent,
      funnel_label: stageLabelMap[resolvedEvent] || stageLabelMap.lead_captured,
      timestamp: new Date().toISOString(),
      customer_name: buyerName || "Visitante en Estudio",
      email: email || "(visitante anónimo local)",
      relationship_to_child: relObj.odooValue,
      child_name: childName,
      age_value: Number(studioState.ageValue ?? 10),
      age_unit: studioState.ageUnit || "months",
      theme_id: studioState.collectionId || "my_first_christmas_24p",
      pet_tier: studioState.petTier || "tier_a_default",
      pet_name: studioState.petName || "Roxy",
      selected_tier: studioState.selectedProductTier || "hardcover",
      synced_remotely: false
    };

    // Solo sincroniza remotamente si hay correo válido (visitante anónimo permanece 100% local)
    if (this._isValidEmail(email)) {
      try {
        const remote = await this._requestBackend("/api/odoo/lead-event", "POST", {
          visitor_id: visitorId,
          event_type: resolvedEvent,
          email,
          name: buyerName,
          country: studioState.shippingCountry || "US",
          child_name: childName,
          age_value: Number(studioState.ageValue ?? 10),
          age_unit: studioState.ageUnit || "months",
          pet_name: studioState.petName || "Roxy",
          collection_id: studioState.collectionId || "my_first_christmas_24p",
          tier: studioState.selectedProductTier || "hardcover"
        });
        leadRecord.synced_remotely = Boolean(remote?.synced_to_odoo);
        leadRecord.remote_lead_id = remote?.lead_id || null;
        leadRecord.remote_partner_id = remote?.partner_id || null;
      } catch (err) {
        console.warn("[RoxyTales Sync] Lead fallback local:", err.message);
      }
    }

    if (existingIdx >= 0) {
      leads[existingIdx] = leadRecord;
    } else {
      leads.unshift(leadRecord);
    }

    localStorage.setItem(APP_CONFIG.storageKeys.crmLeads, JSON.stringify(leads));

    if (!localStorage.getItem(APP_CONFIG.storageKeys.lastOdooPayload)) {
      const draftPayload = this.buildOdooOrderPayload(studioState, null, resolvedEvent);
      localStorage.setItem(APP_CONFIG.storageKeys.lastOdooPayload, JSON.stringify(draftPayload));
    }

    this._emitServiceUpdate("crm_lead_recorded", leadRecord);
    return leadRecord;
  }

  /**
   * Captura unificada de eventos de embudo (incluyendo international_print_pilot_lead y free_sample_pdf).
   */
  async captureLeadEvent(eventType, details = {}) {
    const normalizedState = {
      buyerEmail: details.buyerEmail || details.email || "",
      buyerName: details.buyerName || details.name || "",
      childName: details.childName || "Liam",
      petName: details.petName || "Roxy",
      shippingCountry: details.country || details.countryCode || "US",
      selectedProductTier: details.desiredTier || details.tier || "hardcover",
      collectionId: details.collectionId || "my_first_christmas_24p",
      ageValue: details.ageValue ?? 10,
      ageUnit: details.ageUnit || "months",
      relationshipId: details.relationshipId || "parents"
    };
    return this.create_crm_lead(normalizedState, eventType, true);
  }

  /**
   * Registra un usuario en lista de espera (WAITLIST10) y sincroniza con el backend.
   */
  async register_waitlist_lead({ email, name = "", productId, productTitle, discountPercent = 10, language = "es" }) {
    const waitlist = this.getWaitlistLeads();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const record = {
      id: `WAIT-${Date.now().toString().slice(-6)}`,
      event: "waitlist_entry",
      timestamp: new Date().toISOString(),
      email: normalizedEmail,
      name: String(name || "").trim() || "Lector VIP",
      product_id: productId,
      product_title: productTitle,
      offered_discount_percent: discountPercent,
      assigned_coupon_code: "WAITLIST10",
      language,
      synced_remotely: false
    };

    if (this._isValidEmail(normalizedEmail)) {
      try {
        const remote = await this._requestBackend("/api/odoo/waitlist", "POST", {
          email: normalizedEmail,
          name: record.name,
          product_id: productId || "coming_soon",
          product_title: productTitle || "Colección",
          discount_percent: Number(discountPercent || 10),
          language: language || "es"
        });
        record.synced_remotely = Boolean(remote?.synced_to_odoo);
        record.remote_lead_id = remote?.lead_id || null;
      } catch (err) {
        console.warn("[RoxyTales Sync] Waitlist fallback local:", err.message);
      }
    }

    waitlist.unshift(record);
    localStorage.setItem(APP_CONFIG.storageKeys.waitlistLeads, JSON.stringify(waitlist));
    this._emitServiceUpdate("waitlist_recorded", record);
    return record;
  }

  async calculate_gelato_shipping(countryCode = "US", tierId = "hardcover") {
    await this._simulateDelay(220);
    return adminService.getGelatoShippingQuote(countryCode, tierId);
  }

  /**
   * Construye el payload maestro de orden separando comprador y protagonista del libro.
   */
  buildOdooOrderPayload(studioState = {}, shippingAddress = null, eventName = "checkout_completed") {
    const relObj =
      GIFT_GIVER_OPTIONS.find((r) => r.id === (studioState.relationshipId || "parents")) ||
      GIFT_GIVER_OPTIONS[0];

    const lang = studioState.language || "es";
    const selectedTier = studioState.selectedProductTier || "hardcover";
    const petTier = studioState.petTier || "tier_a_default";
    const qty = selectedTier === "digital" ? 1 : Math.max(1, Number(studioState.quantity || 1));
    const countryCode = shippingAddress?.country_code || studioState.shippingCountry || "US";
    const couponCode = studioState.appliedCouponCode || "";

    const breakdown = adminService.calculateOrderBreakdown({
      tierId: selectedTier,
      petTierId: petTier,
      couponCode,
      countryCode,
      quantity: qty
    });

    const tierConfig =
      DEFAULT_PRICING_CONFIG.tiers[selectedTier] || DEFAULT_PRICING_CONFIG.tiers.hardcover;

    const orderLines = [
      {
        odoo_product_sku: tierConfig.odooSku,
        gelato_uid: tierConfig.gelatoUid,
        quantity: breakdown.quantity,
        unit_price: breakdown.basePrice,
        volume_discount_pct: breakdown.volumeDiscountPercent
      }
    ];

    const addressObj = shippingAddress || {
      street: studioState.shippingStreet || "742 Evergreen Terrace",
      city: studioState.shippingCity || "Miami",
      state: studioState.shippingState || "FL",
      country_code: countryCode,
      postal_code: studioState.shippingPostal || "33101"
    };

    const giftGiverLabel = lang === "en" ? relObj.page6LabelEn : relObj.page6LabelEs;
    const idempotencyKey =
      studioState.pendingOrderRef ||
      `RT-ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString().slice(-4)}`;

    return {
      idempotency_key: idempotencyKey,
      event: eventName,
      timestamp: new Date().toISOString(),
      customer: {
        name: studioState.buyerName || "Carolina Martínez",
        email: studioState.buyerEmail || "carolina@ejemplo.com",
        relationship_to_child: relObj.odooValue,
        shipping_address: {
          street: addressObj.street,
          city: addressObj.city,
          state: addressObj.state,
          country_code: addressObj.country_code,
          postal_code: addressObj.postal_code
        }
      },
      story_data: {
        child_name: studioState.childName || "Liam",
        age_value: Number(studioState.ageValue ?? 10),
        age_unit: studioState.ageUnit || "months",
        theme_id: studioState.collectionId || "my_first_christmas_24p",
        pet_tier: petTier,
        pet_name: studioState.petName || "Roxy",
        pet_vocalization: studioState.petSound || (lang === "en" ? "Woof, woof" : "Guau, guau"),
        gift_giver_label: giftGiverLabel,
        dedication_text:
          studioState.dedicationText ||
          (lang === "en" ? relObj.suggestionsEn[0] : relObj.suggestionsEs[0]),
        custom_year: String(studioState.customYear || "2026"),
        baby_asset_id: studioState.profileId || "default_baby",
        pet_asset_id: studioState.petPhotoName || "default_roxy"
      },
      print_specifications: {
        format: APP_CONFIG.printSpecifications.format,
        page_count: APP_CONFIG.printSpecifications.pageCount,
        target_dpi: APP_CONFIG.printSpecifications.targetDpi,
        bleed_mm: APP_CONFIG.printSpecifications.bleedMm,
        safe_margin_mm: APP_CONFIG.printSpecifications.safeMarginMm,
        color_profile: APP_CONFIG.printSpecifications.colorProfile
      },
      pricing: {
        selected_tier: selectedTier,
        quantity: breakdown.quantity,
        base_price: breakdown.basePrice,
        volume_discount_pct: breakdown.volumeDiscountPercent,
        volume_discount_amount: breakdown.volumeDiscountAmount,
        pet_upsell_price: breakdown.petUpsellPrice,
        discount_code: breakdown.discountCode || "NONE",
        discount_amount: breakdown.discountAmount,
        shipping_fee: breakdown.shippingFee,
        total_amount: breakdown.totalAmount,
        currency: breakdown.currency
      },
      order_lines: orderLines
    };
  }

  /**
   * Crea un pedido independiente en el backend (sale.order) manteniendo idempotencia
   * y respaldo automático en localStorage si el servidor no responde.
   */
  async create_sale_order(studioState, shippingAddress) {
    const payload = this.buildOdooOrderPayload(
      studioState,
      shippingAddress,
      "checkout_completed"
    );

    let remoteOrder = null;
    if (this._isValidEmail(payload.customer.email)) {
      try {
        remoteOrder = await this._requestBackend("/api/odoo/sale-order", "POST", {
          idempotency_key: payload.idempotency_key,
          buyer: {
            name: payload.customer.name,
            email: payload.customer.email,
            country: payload.customer.shipping_address.country_code || "US"
          },
          protagonist: {
            child_name: payload.story_data.child_name,
            age_value: payload.story_data.age_value,
            age_unit: payload.story_data.age_unit,
            pet_name: payload.story_data.pet_name,
            pet_sound: payload.story_data.pet_vocalization,
            collection_id: payload.story_data.theme_id,
            dedication: payload.story_data.dedication_text,
            baby_asset_id: payload.story_data.baby_asset_id,
            pet_asset_id: payload.story_data.pet_asset_id
          },
          order: {
            tier: payload.pricing.selected_tier,
            quantity: payload.pricing.quantity,
            unit_price: payload.pricing.base_price,
            volume_discount_pct: payload.pricing.volume_discount_pct,
            coupon_code: payload.pricing.discount_code === "NONE" ? "" : payload.pricing.discount_code,
            coupon_discount_amount: payload.pricing.discount_amount,
            shipping_fee: payload.pricing.shipping_fee,
            currency: payload.pricing.currency,
            shipping_address: {
              street: payload.customer.shipping_address.street,
              city: payload.customer.shipping_address.city,
              state: payload.customer.shipping_address.state,
              postal_code: payload.customer.shipping_address.postal_code,
              country: payload.customer.shipping_address.country_code
            }
          },
          confirm_immediately: true
        }, 12000);
        payload.remote_order = remoteOrder;
      } catch (err) {
        console.warn("[RoxyTales Sync] Order fallback local:", err.message);
      }
    }

    localStorage.setItem(APP_CONFIG.storageKeys.lastOdooPayload, JSON.stringify(payload));
    const orders = this.getCompletedOrders();
    orders.unshift(payload);
    localStorage.setItem(APP_CONFIG.storageKeys.orders, JSON.stringify(orders));

    await this.create_crm_lead(studioState, "order_completed", true);
    const gelatoSync = await this.sync_gelato_order(payload);

    this._emitServiceUpdate("order_completed", { payload, gelatoSync, remoteOrder });
    return { payload, gelatoSync, remoteOrder };
  }

  async attachPdfToOrder(orderRef, pdfPathOrUrl, childName = "Libro") {
    return this._requestBackend(`/api/odoo/sale-order/${encodeURIComponent(orderRef)}/attach-pdf`, "POST", {
      pdf_path_or_url: pdfPathOrUrl,
      child_name: childName,
      trigger_digital_delivery: true
    }, 20000);
  }

  async fetchOrderStatus(orderRef) {
    return this._requestBackend(`/api/odoo/orders/${encodeURIComponent(orderRef)}`, "GET", null, 10000);
  }

  async fetchCustomerOrders(email) {
    return this._requestBackend(`/api/odoo/customers/${encodeURIComponent(email)}/orders`, "GET", null, 10000);
  }

  async sync_gelato_order(orderPayload) {
    await this._simulateDelay(150);
    const country = orderPayload?.customer?.shipping_address?.country_code || "US";
    const tier = orderPayload?.pricing?.selected_tier || "hardcover";
    const quote = adminService.getGelatoShippingQuote(country, tier);

    return {
      fulfillment_id: `RT-FUL-${Date.now().toString().slice(-7)}`,
      status: tier === "digital" ? "digital_ready_300dpi" : "queued_for_cmyk_press",
      fulfillment_hub: quote.hub,
      estimated_transit_days: quote.transitDays,
      preflight_check: "PASSED (200x200mm, 3mm bleed, 6mm safe zone, 300 DPI)"
    };
  }

  clearAllRecords() {
    localStorage.removeItem(APP_CONFIG.storageKeys.crmLeads);
    localStorage.removeItem(APP_CONFIG.storageKeys.waitlistLeads);
    localStorage.removeItem(APP_CONFIG.storageKeys.orders);
    localStorage.removeItem(APP_CONFIG.storageKeys.lastOdooPayload);
    this._emitServiceUpdate("records_cleared", {});
  }

  _emitServiceUpdate(action, payload) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("roxytales:odoo-updated", {
          detail: { action, payload }
        })
      );
    }
  }
}

const odooService = new OdooService();


// === SOURCE: admin.js ===
/**
 * @file admin.js
 * @description Controlador del Panel de Administración (Admin Mode / Role Switcher) para RoxyTales.
 * Permite configurar en tiempo real cupones de descuento, precios de venta del catálogo,
 * tarifas de referencia de Gelato POD, auditoría de leads en localStorage y visualización
 * del payload JSON de integración para Odoo ERP.
 */




class AdminController {
  constructor(getStudioStateCallback, showToastCallback) {
    this.getStudioState = getStudioStateCallback;
    this.showToast = showToastCallback;
    this.isAdminMode = false;
    this.activeTab = "pricing";
    this.payloadViewMode = "stored"; // 'stored' | 'live'
  }

  init() {
    this._bindEvents();
    this.renderAll();

    window.addEventListener("roxytales:admin-updated", () => this.renderAll());
    window.addEventListener("roxytales:odoo-updated", () => this.renderAll());
  }

  _bindEvents() {
    // Interruptor de rol en navbar
    const roleBtn = document.getElementById("roleSwitcherBtn");
    if (roleBtn) {
      roleBtn.addEventListener("click", () => this.toggleAdminMode());
    }

    const closeAdminBtn = document.getElementById("closeAdminPanelBtn");
    if (closeAdminBtn) {
      closeAdminBtn.addEventListener("click", () => this.toggleAdminMode(false));
    }

    // Atajo de teclado Ctrl + Shift + A
    window.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        this.toggleAdminMode();
      }
    });

    // Navegación de pestañas del Admin
    document.querySelectorAll("[data-admin-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-admin-tab");
        this.switchTab(tab);
      });
    });

    // Guardar Precios Base y Envío Gelato
    const pricingForm = document.getElementById("adminPricingForm");
    if (pricingForm) {
      pricingForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this._handleSavePricing();
      });
    }

    const resetPricingBtn = document.getElementById("adminResetPricingBtn");
    if (resetPricingBtn) {
      resetPricingBtn.addEventListener("click", () => {
        adminService.resetPricingToDefault();
        this.renderPricingSection();
        this.showToast(
          this._lang() === "en"
            ? "Default catalog prices restored"
            : "Precios por defecto restaurados en la tienda",
          "success"
        );
      });
    }

    // Crear nuevo cupón
    const couponForm = document.getElementById("adminCouponForm");
    if (couponForm) {
      couponForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this._handleCreateCoupon();
      });
    }

    // Limpiar registros de leads / waitlist
    const clearLeadsBtn = document.getElementById("adminClearLeadsBtn");
    if (clearLeadsBtn) {
      clearLeadsBtn.addEventListener("click", () => {
        odooService.clearAllRecords();
        this.renderAll();
        this.showToast(
          this._lang() === "en"
            ? "All test leads and waitlist records cleared"
            : "Registros de leads y lista de espera eliminados",
          "info"
        );
      });
    }

    // Botones del visor JSON de Odoo
    const copyJsonBtn = document.getElementById("adminCopyJsonBtn");
    if (copyJsonBtn) {
      copyJsonBtn.addEventListener("click", () => this._copyOdooPayload());
    }

    const downloadJsonBtn = document.getElementById("adminDownloadJsonBtn");
    if (downloadJsonBtn) {
      downloadJsonBtn.addEventListener("click", () => this._downloadOdooPayload());
    }

    const togglePayloadSourceBtn = document.getElementById("adminPayloadModeToggle");
    if (togglePayloadSourceBtn) {
      togglePayloadSourceBtn.addEventListener("click", () => {
        this.payloadViewMode = this.payloadViewMode === "stored" ? "live" : "stored";
        this.renderPayloadViewer();
      });
    }
  }

  _lang() {
    const state = this.getStudioState ? this.getStudioState() : null;
    return state?.language || "es";
  }

  /**
   * Activa o desactiva el panel de administración y sincroniza el indicador visual.
   */
  toggleAdminMode(forceState = null, initialTab = null) {
    this.isAdminMode = forceState !== null ? forceState : !this.isAdminMode;
    const adminDrawer = document.getElementById("adminPanelModal");
    const roleBtn = document.getElementById("roleSwitcherBtn");
    const roleDot = document.getElementById("roleStatusDot");

    if (initialTab) {
      this.activeTab = initialTab;
    }

    if (adminDrawer) {
      if (this.isAdminMode) {
        adminDrawer.classList.remove("hidden");
        document.body.classList.add("overflow-hidden");
        this.switchTab(this.activeTab);
        this.renderAll();
      } else {
        adminDrawer.classList.add("hidden");
        document.body.classList.remove("overflow-hidden");
      }
    }

    if (roleBtn) {
      roleBtn.setAttribute("aria-pressed", String(this.isAdminMode));
      roleBtn.classList.toggle("bg-rose-600", this.isAdminMode);
      roleBtn.classList.toggle("text-white", this.isAdminMode);
      roleBtn.classList.toggle("border-rose-600", this.isAdminMode);
    }

    if (roleDot) {
      roleDot.classList.toggle("bg-emerald-400", this.isAdminMode);
      roleDot.classList.toggle("bg-amber-500", !this.isAdminMode);
    }
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    document.querySelectorAll("[data-admin-tab]").forEach((btn) => {
      const isTarget = btn.getAttribute("data-admin-tab") === tabId;
      btn.classList.toggle("bg-slate-900", isTarget);
      btn.classList.toggle("text-white", isTarget);
      btn.classList.toggle("shadow-sm", isTarget);
      btn.classList.toggle("text-slate-600", !isTarget);
      btn.classList.toggle("hover:bg-slate-100", !isTarget);
    });

    document.querySelectorAll("[data-admin-panel]").forEach((panel) => {
      const isTarget = panel.getAttribute("data-admin-panel") === tabId;
      panel.classList.toggle("hidden", !isTarget);
    });

    if (tabId === "payload") {
      this.renderPayloadViewer();
    }
  }

  renderAll() {
    this.renderKpiSummary();
    this.renderPricingSection();
    this.renderCouponsSection();
    this.renderLeadsAndWaitlistSection();
    this.renderPayloadViewer();
  }

  /**
   * Renderiza las tarjetas de métricas rápidas en la cabecera del Admin
   */
  renderKpiSummary() {
    const leads = odooService.getCrmLeads();
    const waitlist = odooService.getWaitlistLeads();
    const orders = odooService.getCompletedOrders();
    const activeCoupons = adminService.getCoupons().filter((c) => c.active).length;

    const totalRevenue = orders.reduce(
      (sum, o) => sum + Number(o?.pricing?.total_amount || 0),
      0
    );

    const setElText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setElText("adminKpiLeadsCount", String(leads.length));
    setElText("adminKpiWaitlistCount", String(waitlist.length));
    setElText("adminKpiOrdersCount", String(orders.length));
    setElText("adminKpiRevenue", `$${totalRevenue.toFixed(2)} USD`);
    setElText("adminKpiActiveCoupons", String(activeCoupons));
  }

  /**
   * Renderiza los inputs de precios base y la matriz de envíos de Gelato POD
   */
  renderPricingSection() {
    const pricing = adminService.getPricing();
    const setVal = (id, val) => {
      const input = document.getElementById(id);
      if (input) input.value = Number(val).toFixed(2);
    };

    setVal("adminPriceDigital", pricing.digital);
    setVal("adminPriceSoftcover", pricing.softcover);
    setVal("adminPriceHardcover", pricing.hardcover);
    setVal("adminPricePetPhoto", pricing.petPhotoUpsell);
    setVal("adminPricePetTraits", pricing.petTraitsUpsell);
    setVal("adminPriceRefShipping", pricing.referenceShippingFee);

    // Tabla en vivo de tarifas Gelato escaladas
    const matrixBody = document.getElementById("adminGelatoMatrixBody");
    if (matrixBody) {
      matrixBody.innerHTML = Object.keys(GELATO_SHIPPING_MATRIX)
        .map((code) => {
          const quote = adminService.getGelatoShippingQuote(code, "hardcover");
          return `
            <tr class="border-b border-slate-100 text-xs">
              <td class="py-2 font-semibold text-slate-800">${code} · ${quote.countryName}</td>
              <td class="py-2 text-slate-600">${quote.hub}</td>
              <td class="py-2 text-slate-600">${quote.transitDays} d</td>
              <td class="py-2 text-right font-bold text-emerald-700">$${quote.fee.toFixed(2)} USD</td>
            </tr>
          `;
        })
        .join("");
    }
  }

  _handleSavePricing() {
    const getVal = (id) => parseFloat(document.getElementById(id)?.value || "0");
    adminService.updatePricing({
      digital: getVal("adminPriceDigital"),
      softcover: getVal("adminPriceSoftcover"),
      hardcover: getVal("adminPriceHardcover"),
      petPhotoUpsell: getVal("adminPricePetPhoto"),
      petTraitsUpsell: getVal("adminPricePetTraits"),
      referenceShippingFee: getVal("adminPriceRefShipping")
    });

    this.renderPricingSection();
    this.showToast(
      this._lang() === "en"
        ? "Catalog prices and Gelato reference rates updated!"
        : "¡Precios del catálogo y tarifas Gelato actualizados en vivo!",
      "success"
    );
  }

  /**
   * Renderiza la lista de cupones promocionales y sus controles
   */
  renderCouponsSection() {
    const container = document.getElementById("adminCouponsList");
    if (!container) return;

    const coupons = adminService.getCoupons();
    const lang = this._lang();

    if (coupons.length === 0) {
      container.innerHTML = `
        <div class="p-6 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          ${lang === "en" ? "No coupons registered." : "No hay cupones registrados."}
        </div>
      `;
      return;
    }

    container.innerHTML = coupons
      .map((c) => {
        const badgeText =
          c.type === "percent" ? `-${c.value}% OFF` : `-$${Number(c.value).toFixed(2)} USD`;
        const statusLabel = c.active
          ? lang === "en"
            ? "Active"
            : "Activo"
          : lang === "en"
            ? "Inactive"
            : "Inactivo";

        return `
          <div class="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border ${
            c.active
              ? "bg-white border-slate-200 shadow-sm"
              : "bg-slate-50 border-slate-200 opacity-70"
          }">
            <div class="flex items-center gap-3">
              <span class="px-3 py-1 rounded-lg font-mono font-bold text-sm tracking-wider ${
                c.active ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-slate-200 text-slate-600"
              }">
                ${this._escapeHtml(c.code)}
              </span>
              <div>
                <div class="text-sm font-bold text-slate-800">${badgeText}</div>
                <div class="text-xs text-slate-500">${this._escapeHtml(
                  lang === "en" ? c.descriptionEn : c.descriptionEs
                )}</div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                data-toggle-coupon="${this._escapeHtml(c.code)}"
                class="px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  c.active
                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }"
              >
                ${c.active ? "● " : "○ "}${statusLabel}
              </button>
              <button
                type="button"
                data-delete-coupon="${this._escapeHtml(c.code)}"
                class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                title="${lang === "en" ? "Delete coupon" : "Eliminar cupón"}"
              >
                ✕
              </button>
            </div>
          </div>
        `;
      })
      .join("");

    container.querySelectorAll("[data-toggle-coupon]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const code = btn.getAttribute("data-toggle-coupon");
        adminService.toggleCouponStatus(code);
      });
    });

    container.querySelectorAll("[data-delete-coupon]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const code = btn.getAttribute("data-delete-coupon");
        adminService.deleteCoupon(code);
      });
    });
  }

  _handleCreateCoupon() {
    const codeInput = document.getElementById("adminCouponCode");
    const typeInput = document.getElementById("adminCouponType");
    const valInput = document.getElementById("adminCouponValue");

    const code = String(codeInput?.value || "").trim().toUpperCase();
    const type = typeInput?.value || "percent";
    const value = parseFloat(valInput?.value || "0");

    if (!code || isNaN(value) || value <= 0) {
      this.showToast(
        this._lang() === "en"
          ? "Please enter a valid coupon code and positive value."
          : "Ingresa un código válido y un valor mayor a 0.",
        "error"
      );
      return;
    }

    adminService.upsertCoupon({
      code,
      type,
      value,
      active: true
    });

    if (codeInput) codeInput.value = "";
    if (valInput) valInput.value = "";

    this.renderCouponsSection();
    this.showToast(
      this._lang() === "en"
        ? `Coupon ${code} created and activated!`
        : `¡Cupón ${code} creado y activado!`,
      "success"
    );
  }

  /**
   * Renderiza la tabla de auditoría de Leads CRM y la tabla de Waitlist
   */
  renderLeadsAndWaitlistSection() {
    const leadsBody = document.getElementById("adminLeadsTableBody");
    const waitlistBody = document.getElementById("adminWaitlistTableBody");
    const lang = this._lang();

    if (leadsBody) {
      const leads = odooService.getCrmLeads();
      if (leads.length === 0) {
        leadsBody.innerHTML = `
          <tr>
            <td colspan="7" class="py-8 text-center text-sm text-slate-400">
              ${
                lang === "en"
                  ? "No CRM leads captured in localStorage yet. Interact with the customizer studio to generate leads."
                  : "Aún no hay leads capturados en localStorage. Interactúa con el estudio para registrar leads automáticamente."
              }
            </td>
          </tr>
        `;
      } else {
        leadsBody.innerHTML = leads
          .map((lead) => {
            const badgeStyle =
              lead.funnel_stage === "order_completed"
                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                : lead.funnel_stage === "preview_generated"
                  ? "bg-blue-100 text-blue-800 border-blue-200"
                  : lead.funnel_stage === "lead_captured"
                    ? "bg-amber-100 text-amber-800 border-amber-200"
                    : "bg-rose-100 text-rose-800 border-rose-200";

            const dateFormatted = new Date(lead.timestamp).toLocaleString(
              lang === "en" ? "en-US" : "es-ES",
              { dateStyle: "short", timeStyle: "short" }
            );

            return `
              <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition text-xs">
                <td class="py-3 px-3 font-medium text-slate-900">${this._escapeHtml(lead.email)}</td>
                <td class="py-3 px-3 text-slate-700">${this._escapeHtml(lead.customer_name)}</td>
                <td class="py-3 px-3 text-slate-600">${this._escapeHtml(lead.relationship_to_child)}</td>
                <td class="py-3 px-3 font-semibold text-slate-800">${this._escapeHtml(lead.child_name)}</td>
                <td class="py-3 px-3 text-slate-600">${lead.age_value} ${this._escapeHtml(lead.age_unit)}</td>
                <td class="py-3 px-3">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeStyle}">
                    ${this._escapeHtml(lead.funnel_label)}
                  </span>
                </td>
                <td class="py-3 px-3 text-slate-500 whitespace-nowrap">${dateFormatted}</td>
              </tr>
            `;
          })
          .join("");
      }
    }

    if (waitlistBody) {
      const waitlist = odooService.getWaitlistLeads();
      if (waitlist.length === 0) {
        waitlistBody.innerHTML = `
          <tr>
            <td colspan="5" class="py-6 text-center text-sm text-slate-400">
              ${
                lang === "en"
                  ? "No waitlist entries yet. Click any 'Coming Soon' card to test."
                  : "Sin registros en waitlist_leads. Haz clic en cualquier tarjeta 'Coming Soon' para probar."
              }
            </td>
          </tr>
        `;
      } else {
        waitlistBody.innerHTML = waitlist
          .map((item) => {
            const dateFormatted = new Date(item.timestamp).toLocaleString(
              lang === "en" ? "en-US" : "es-ES",
              { dateStyle: "short", timeStyle: "short" }
            );
            return `
              <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs">
                <td class="py-2.5 px-3 font-semibold text-slate-900">${this._escapeHtml(item.email)}</td>
                <td class="py-2.5 px-3 text-slate-700">${this._escapeHtml(item.product_title)}</td>
                <td class="py-2.5 px-3">
                  <span class="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-bold">
                    ${item.offered_discount_percent}% OFF (${item.assigned_coupon_code})
                  </span>
                </td>
                <td class="py-2.5 px-3 text-slate-500">${this._escapeHtml(item.id)}</td>
                <td class="py-2.5 px-3 text-slate-500">${dateFormatted}</td>
              </tr>
            `;
          })
          .join("");
      }
    }
  }

  /**
   * Renderiza el visor de payload JSON para Odoo ERP
   */
  renderPayloadViewer() {
    const codeEl = document.getElementById("adminOdooPayloadCode");
    const modeBadge = document.getElementById("adminPayloadModeBadge");
    if (!codeEl) return;

    const currentStudio = this.getStudioState ? this.getStudioState() : {};
    const payload =
      this.payloadViewMode === "live"
        ? odooService.buildOdooOrderPayload(currentStudio, null, "live_studio_inspection")
        : odooService.getLastOdooPayload(currentStudio);

    if (modeBadge) {
      const lang = this._lang();
      modeBadge.textContent =
        this.payloadViewMode === "live"
          ? lang === "en"
            ? "Showing: Live Studio State"
            : "Mostrando: Estado en Vivo del Estudio"
          : lang === "en"
            ? "Showing: Last Stored Payload in localStorage"
            : "Mostrando: Último Payload en localStorage";
    }

    codeEl.textContent = JSON.stringify(payload, null, 2);
  }

  _copyOdooPayload() {
    const codeEl = document.getElementById("adminOdooPayloadCode");
    if (!codeEl) return;
    navigator.clipboard.writeText(codeEl.textContent).then(() => {
      this.showToast(
        this._lang() === "en"
          ? "Odoo ERP JSON Payload copied to clipboard!"
          : "¡Payload JSON de Odoo ERP copiado al portapapeles!",
        "success"
      );
    });
  }

  _downloadOdooPayload() {
    const codeEl = document.getElementById("adminOdooPayloadCode");
    if (!codeEl) return;
    const blob = new Blob([codeEl.textContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roxytales_odoo_payload_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  _escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}


// === SOURCE: app.js ===
/**
 * @file app.js
 * @description Controlador principal del cliente RoxyTales:
 * - Motor reactivo bilingüe (ES | EN) sin recarga ni pérdida de estado/fotos.
 * - Flujo del Hero Book Customizer Studio (5 pasos) y Lead Gate con alerta visual.
 * - Captura preventiva de abandono ("lead_abandonment") en localStorage vía odooService.
 * - Unidad de edad reactiva (meses para 0–2 años; años para colecciones >2 años).
 * - Motor de personalización de bebé (Atributos 3D / Foto FileReader) y mascota (3 Niveles).
 * - Visor interactivo 8×8" (8 páginas maestras Gelato 300 DPI) + exportación PDF imprimible.
 * - Catálogo secundario "Coming soon" con Modal de Waitlist (10% OFF) y Checkout Stripe simulado.
 */





class RoxyTalesApp {
  constructor() {
    const defaultRel = GIFT_GIVER_OPTIONS.find((r) => r.id === "grandparents") || GIFT_GIVER_OPTIONS[0];
    this.state = {
      language: APP_CONFIG.defaultLanguage, // 'es' | 'en'
      activeStep: 1,
      leadUnlocked: false,
      orderCompleted: false,
      showPrintGuides: false,

      // Paso 1: Gift Giver
      buyerName: "",
      buyerEmail: "",
      relationshipId: defaultRel.id,
      dedicationText: defaultRel.suggestionsEs[0],
      dedicationCustomEdited: false,
      suggestionIdx: 0,
      customYear: "2026",

      // Paso 2: Protagonista & Edad reactiva
      collectionId: "christmas_first_year_8x8",
      childName: "Liam",
      ageValue: 10,
      ageUnit: "months", // 'months' (0-24) | 'years' (2-8)
      babyMode: "attributes", // 'attributes' | 'photo'
      babySkinTone: "fair_peach",
      babyHairStyle: "wispy_curls",
      babyEyeColor: "hazel_brown",
      babyPhotoDataUrl: null,
      babyPhotoName: "",

      // Paso 3: Motor de Mascotas (3 Niveles)
      petTier: "tier_a_default", // 'tier_a_default' | 'tier_b_photo' | 'tier_c_traits'
      petName: "Roxy",
      petSound: "Guau, guau",
      petSoundCustomEdited: false,
      petSpecies: "dog",
      petBreed: "shih_tzu",
      petCoatColor: "honey_white",
      petEarShape: "floppy",
      petPhotoDataUrl: null,
      petPhotoName: "",

      // Paso 4: Visor 8x8"
      currentPage: 1,
      isRenderingPreview: false,

      // Paso 5: Variantes y Checkout
      selectedProductTier: "hardcover",
      quantity: 1,
      appliedCouponCode: "",
      couponFeedback: null,

      // Dirección de envío en Checkout
      shippingStreet: "742 Evergreen Terrace",
      shippingCity: "Miami",
      shippingState: "FL",
      shippingCountry: "US",
      shippingPostal: "33101",

      // Modal de Waitlist activo
      activeWaitlistProduct: null,

      // Motor IA Generativa (FastAPI + Google GenAI + Caché SHA-256)
      profileId: null,
      renderedPages: {},
      backendAvailable: null,
      isUploadingAssets: false,
      babyPhotoFile: null,
      petPhotoFile: null
    };

    this._abandonmentTimer = null;
    this.adminController = new AdminController(
      () => this.state,
      (msg, type) => this.showToast(msg, type)
    );
  }

  init() {
    this._populateStaticSelectors();
    this._bindStudioEvents();
    this._bindViewerEvents();
    this._bindTouchSwipe();
    this._bindModalEvents();
    this._bindAbandonmentListeners();
    this._initBeforeAfterSlider();
    this._initInspirationGallery();
    this._initStickyConversionBar();

    this.adminController.init();

    // Escucha cambios desde el panel de administración (precios/cupones)
    window.addEventListener("roxytales:admin-updated", () => {
      this._renderProductTiersAndSummary();
      this._updateCheckoutModalBreakdown();
    });

    // Renderizado inicial completo
    this.applyLanguage(this.state.language);
    this._renderSecondaryCatalog();
    this._renderLeadGateBanner();
    this._renderBookViewer();
    this._renderProductTiersAndSummary();
    this._updateGeneratePreviewBtnState();
  }

  _updateGeneratePreviewBtnState() {
    const btn = document.getElementById("generateMagicPreviewBtn");
    if (!btn) return;
    const hasBabyPhoto = Boolean(this.state.babyPhotoDataUrl);
    const hasCompanion =
      this.state.petTier === "tier_a_default" || Boolean(this.state.petPhotoDataUrl);
    const ready = hasBabyPhoto && hasCompanion;
    btn.disabled = !ready;
    btn.classList.toggle("opacity-50", !ready);
    btn.classList.toggle("cursor-not-allowed", !ready);
  }

  /* ==========================================================================
     1. INTERNACIONALIZACIÓN REACTIVA (ES | EN) SIN PÉRDIDA DE ESTADO
     ========================================================================== */
  t(key, replacements = {}) {
    const dict = I18N_DICTIONARY[this.state.language] || I18N_DICTIONARY.es;
    let str = dict[key] ?? I18N_DICTIONARY.es[key] ?? key;
    Object.entries(replacements).forEach(([k, v]) => {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    });
    return str;
  }

  applyLanguage(lang) {
    const prevLang = this.state.language;
    this.state.language = lang === "en" ? "en" : "es";
    document.documentElement.lang = this.state.language;

    // Conmutadores visuales de idioma en navbar
    document.querySelectorAll("[data-lang-switch]").forEach((btn) => {
      const btnLang = btn.getAttribute("data-lang-switch");
      const active = btnLang === this.state.language;
      btn.classList.toggle("bg-slate-900", active);
      btn.classList.toggle("text-white", active);
      btn.classList.toggle("text-slate-600", !active);
    });

    // Si el usuario no editó manualmente la dedicatoria, traduce la sugerencia actual
    const relObj = this._getCurrentRelationship();
    if (!this.state.dedicationCustomEdited && relObj) {
      const list =
        this.state.language === "en" ? relObj.suggestionsEn : relObj.suggestionsEs;
      this.state.dedicationText = list[this.state.suggestionIdx % list.length];
      const dedInput = document.getElementById("dedicationInput");
      if (dedInput) dedInput.value = this.state.dedicationText;
    }

    // Si el usuario no editó manualmente la onomatopeya de la mascota, la traduce
    if (!this.state.petSoundCustomEdited) {
      if (this.state.petTier === "tier_a_default" || this.state.petSpecies === "dog") {
        this.state.petSound = this.state.language === "en" ? "Woof, woof" : "Guau, guau";
      } else {
        this.state.petSound = this.state.language === "en" ? "Purr, meow" : "Miau, ronrón";
      }
      const soundInput = document.getElementById("petSoundInput");
      if (soundInput) soundInput.value = this.state.petSound;
    }

    // Actualiza todos los nodos con atributo [data-i18n]
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      el.textContent = this.t(key);
    });

    // Actualiza todos los placeholders con [data-i18n-placeholder]
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      el.setAttribute("placeholder", this.t(key));
    });

    // Re-puebla opciones de selects preservando el valor seleccionado
    if (prevLang !== this.state.language) {
      this._populateStaticSelectors();
      this._renderSecondaryCatalog();
    }

    this._updateAgeControlUI();
    this._renderLeadGateBanner();
    this._renderBookViewer();
    this._renderProductTiersAndSummary();
    this.adminController.renderAll();
  }

  /* ==========================================================================
     2. POBLACIÓN DE SELECTORES Y SWATCHES CON VALORES POR DEFECTO
     ========================================================================== */
  _populateStaticSelectors() {
    const isEn = this.state.language === "en";

    // Selector de parentesco (Paso 1)
    const relSelect = document.getElementById("relationshipSelect");
    if (relSelect) {
      relSelect.innerHTML =
        `<option value="custom" ${
          this.state.relationshipId === "custom" ? "selected" : ""
        }>${this.t("customRelationshipOption")}</option>` +
        GIFT_GIVER_OPTIONS.map(
          (opt) =>
            `<option value="${opt.id}" ${
              opt.id === this.state.relationshipId ? "selected" : ""
            }>${isEn ? opt.labelEn : opt.labelEs}</option>`
        ).join("");
    }

    // Selector de Colección y rango de edad (Paso 2)
    const colSelect = document.getElementById("collectionSelect");
    if (colSelect) {
      const ageCollections = COLLECTIONS_CATALOG.filter((c) => !c.isSpecialFormat);
      colSelect.innerHTML = ageCollections
        .map((col) => {
          const statusTag = col.isActiveStudio
            ? isEn
              ? "★ Active · Months"
              : "★ Activa · Meses"
            : isEn
              ? "Preview · Years"
              : "Preview · Años";
          const rawTitle = (isEn ? col.titleEn : col.titleEs).replace(
            /\[Nombre\]|\[Name\]/g,
            this.state.childName || "Liam"
          );
          return `<option value="${col.id}" ${
            col.id === this.state.collectionId ? "selected" : ""
          }>[${statusTag}] ${rawTitle}</option>`;
        })
        .join("");
    }
  }

  /* ==========================================================================
     3. EVENTOS DEL WIZARD (PASOS 1 A 5) Y UNIDADES DE EDAD REACTIVAS
     ========================================================================== */
  _bindStudioEvents() {
    // Selector de idioma en navbar
    document.querySelectorAll("[data-lang-switch]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetLang = btn.getAttribute("data-lang-switch");
        this.applyLanguage(targetLang);
      });
    });

    // Pestañas de navegación rápida entre los 5 pasos del Wizard
    document.querySelectorAll("[data-wizard-step-btn]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const stepNum = parseInt(btn.getAttribute("data-wizard-step-btn"), 10);
        this.scrollToOrActivateStep(stepNum);
      });
    });

    // PASO 1: Nombre y Email del comprador + Parentesco + Dedicatoria
    const buyerNameInput = document.getElementById("buyerNameInput");
    const buyerEmailInput = document.getElementById("buyerEmailInput");

    if (buyerNameInput) {
      buyerNameInput.addEventListener("input", (e) => {
        this.state.buyerName = e.target.value;
        this._checkAndUnlockLeadGatePassively();
        this._schedulePreventiveLeadCapture();
      });
    }

    if (buyerEmailInput) {
      buyerEmailInput.addEventListener("input", (e) => {
        this.state.buyerEmail = e.target.value;
        this._checkAndUnlockLeadGatePassively();
        this._schedulePreventiveLeadCapture();
      });
    }

    const relSelect = document.getElementById("relationshipSelect");
    if (relSelect) {
      relSelect.addEventListener("change", (e) => {
        this.state.relationshipId = e.target.value;
        const customWrap = document.getElementById("customRelationshipWrapper");
        if (customWrap) {
          customWrap.classList.toggle("hidden", e.target.value !== "custom");
        }
        this.state.suggestionIdx = 0;
        const relObj = this._getCurrentRelationship();
        const suggestions =
          this.state.language === "en" ? relObj.suggestionsEn : relObj.suggestionsEs;
        this.state.dedicationText = suggestions[0];
        this.state.dedicationCustomEdited = false;

        const dedInput = document.getElementById("dedicationInput");
        if (dedInput) dedInput.value = this.state.dedicationText;
        this._updateActivePageTypographyInPlace();
        this._schedulePreventiveLeadCapture();
        this._renderBookViewer();
      });
    }

    const customRelInput = document.getElementById("customRelationshipInput");
    if (customRelInput) {
      customRelInput.addEventListener("input", (e) => {
        this.state.customRelationshipText = e.target.value;
        this._renderBookViewer();
      });
    }

    const dedInput = document.getElementById("dedicationInput");
    if (dedInput) {
      dedInput.addEventListener("input", (e) => {
        this.state.dedicationText = e.target.value;
        this.state.dedicationCustomEdited = true;
        this._updateActivePageTypographyInPlace();
      });
    }

    const inspireBtn = document.getElementById("inspireDedicationBtn");
    if (inspireBtn) {
      inspireBtn.addEventListener("click", () => {
        const relObj = this._getCurrentRelationship();
        const list =
          this.state.language === "en" ? relObj.suggestionsEn : relObj.suggestionsEs;
        this.state.suggestionIdx = (this.state.suggestionIdx + 1) % list.length;
        this.state.dedicationText = list[this.state.suggestionIdx];
        this.state.dedicationCustomEdited = false;

        const dedEl = document.getElementById("dedicationInput");
        if (dedEl) {
          dedEl.value = this.state.dedicationText;
          dedEl.classList.add("ring-2", "ring-amber-400");
          setTimeout(() => dedEl.classList.remove("ring-2", "ring-amber-400"), 500);
        }

        this._updateActivePageTypographyInPlace();
        this.showToast(
          this.state.language === "en"
            ? "New dedication suggestion injected into Page 8!"
            : "¡Nueva dedicatoria inspirada e inyectada en la Página 8!",
          "info"
        );
      });
    }

    const customYearInput = document.getElementById("customYearInput");
    if (customYearInput) {
      customYearInput.addEventListener("input", (e) => {
        this.state.customYear = e.target.value || "2026";
        this._updateActivePageTypographyInPlace();
      });
    }

    // PASO 2: Protagonista, Selector de Colección y Unidad de Edad Reactiva
    const childNameInput = document.getElementById("childNameInput");
    if (childNameInput) {
      childNameInput.addEventListener("input", (e) => {
        const raw = e.target.value.slice(0, APP_CONFIG.maxChildNameLength);
        e.target.value = raw;
        this.state.childName = raw.trim() || "Liam";
        const charCounter = document.getElementById("childNameCharCount");
        if (charCounter) {
          charCounter.textContent = `${raw.length}/${APP_CONFIG.maxChildNameLength}`;
        }
        this._populateStaticSelectors();
        this._renderSecondaryCatalog();
        this._updateActivePageTypographyInPlace();
        this._schedulePreventiveLeadCapture();
      });
    }

    const colSelect = document.getElementById("collectionSelect");
    if (colSelect) {
      colSelect.addEventListener("change", (e) => {
        const chosen = COLLECTIONS_CATALOG.find((c) => c.id === e.target.value);
        if (chosen && chosen.isComingSoon) {
          this.showToast(`⏳ ${this.t("comingSoonBtnText")}`, "info");
          colSelect.value = this.state.collectionId;
          return;
        }
        this.switchStudioCollection(e.target.value);
      });
    }

    const ageSlider = document.getElementById("ageRangeSlider");
    const ageNumberInput = document.getElementById("ageNumberInput");

    const handleAgeChange = (val) => {
      const col = this._getCurrentCollection();
      const parsed = parseInt(val, 10);
      const clamped = isNaN(parsed)
        ? col.defaultAge
        : Math.max(col.minAge, Math.min(col.maxAge, parsed));
      this.state.ageValue = clamped;
      if (ageSlider) ageSlider.value = String(clamped);
      if (ageNumberInput) ageNumberInput.value = String(clamped);
      this._updateAgeBadgeDisplay();
      this._renderBookViewer();
      this._schedulePreventiveLeadCapture();
    };

    if (ageSlider) {
      ageSlider.addEventListener("input", (e) => handleAgeChange(e.target.value));
    }
    if (ageNumberInput) {
      ageNumberInput.addEventListener("change", (e) => handleAgeChange(e.target.value));
    }

    // Dropzone Foto del Bebé (FileReader en memoria - ultra simplificado)
    this._setupPhotoDropzone({
      dropzoneId: "babyPhotoDropArea",
      fileInputId: "babyPhotoFileInput",
      removeBtnId: "removeBabyPhotoBtn",
      onLoadSuccess: (dataUrl, fileName, file) => {
        this.state.babyPhotoDataUrl = dataUrl;
        this.state.babyPhotoName = fileName;
        this.state.babyPhotoFile = file || null;
        this.state.profileId = null;
        this.state.renderedPages = {};
        this.state.babyMode = "photo";
        this._updateBabyModeToggleUI();
        this._renderBookViewer();
        this._updateGeneratePreviewBtnState();
        this.showToast(
          this.state.language === "en"
            ? "Baby photo projected into the 8×8\" book preview!"
            : "¡Fotografía del bebé proyectada en las páginas del cuento!",
          "success"
        );
      },
      onRemove: () => {
        this.state.babyPhotoDataUrl = null;
        this.state.babyPhotoName = "";
        this.state.babyPhotoFile = null;
        this.state.profileId = null;
        this.state.renderedPages = {};
        this.state.babyMode = "attributes";
        this._updateBabyModeToggleUI();
        this._renderBookViewer();
        this._updateGeneratePreviewBtnState();
      }
    });

    const petNameInput = document.getElementById("petNameInput");
    if (petNameInput) {
      petNameInput.addEventListener("input", (e) => {
        this.state.petName = e.target.value.trim() || "Roxy";
        this._updateActivePageTypographyInPlace();
      });
    }

    const petSoundInput = document.getElementById("petSoundInput");
    if (petSoundInput) {
      petSoundInput.addEventListener("input", (e) => {
        this.state.petSound = e.target.value.trim() || "Guau, guau";
        this.state.petSoundCustomEdited = true;
        this._updateActivePageTypographyInPlace();
      });
    }

    // Dropzone Foto de la Mascota (Ultra simplificado)
    this._setupPhotoDropzone({
      dropzoneId: "petPhotoDropArea",
      fileInputId: "petPhotoFileInput",
      removeBtnId: "removePetPhotoBtn",
      onLoadSuccess: (dataUrl, fileName, file) => {
        this.state.petPhotoDataUrl = dataUrl;
        this.state.petPhotoName = fileName;
        this.state.petPhotoFile = file || null;
        this.state.profileId = null;
        this.state.renderedPages = {};
        this.selectPetTier("tier_b_photo");
        this._updatePetPhotoPreviewUI();
        this._renderBookViewer();
        this._updateGeneratePreviewBtnState();
        this.showToast(
          this.state.language === "en"
            ? "Custom pet photo loaded into the storybook!"
            : "¡Foto de tu mascota cargada en el cuento!",
          "success"
        );
      },
      onRemove: () => {
        this.state.petPhotoDataUrl = null;
        this.state.petPhotoName = "";
        this.state.petPhotoFile = null;
        this.state.profileId = null;
        this.state.renderedPages = {};
        this._updatePetPhotoPreviewUI();
        this._renderBookViewer();
        this._updateGeneratePreviewBtnState();
      }
    });

    // Opción discreta de un clic: Usar a Roxy por defecto si no tienen foto a la mano (CRO)
    const useRoxyBtn = document.getElementById("useRoxyDefaultBtn");
    if (useRoxyBtn) {
      useRoxyBtn.addEventListener("click", () => {
        this.state.petPhotoDataUrl = null;
        this.state.petPhotoName = "";
        this.state.petPhotoFile = null;
        this.state.profileId = null;
        this.state.renderedPages = {};
        this.state.petName = "Roxy";
        this.state.petSound = this.state.language === "en" ? "Woof, woof" : "Guau, guau";
        this.selectPetTier("tier_a_default");
        this._updateGeneratePreviewBtnState();
        this._updatePetPhotoPreviewUI();
        const petNameInput = document.getElementById("petNameInput");
        const petSoundInput = document.getElementById("petSoundInput");
        if (petNameInput) petNameInput.value = "Roxy";
        if (petSoundInput) petSoundInput.value = this.state.petSound;
        this._renderBookViewer();
        this.showToast(
          this.state.language === "en"
            ? "Roxy selected as official story companion!"
            : "¡Roxy seleccionada como compañera oficial del cuento!",
          "info"
        );
      });
    }

    // PASO 4: Botón "Crear vista previa mágica" y "Descargar borrador PDF"
    const generateBtn = document.getElementById("generateMagicPreviewBtn");
    if (generateBtn) {
      generateBtn.addEventListener("click", () => this.handleGenerateMagicPreview());
    }

    const downloadSampleBtn = document.getElementById("downloadSamplePdfBtn");
    if (downloadSampleBtn) {
      downloadSampleBtn.addEventListener("click", () => this.handleDownloadPdfBook(true));
    }

    // PASO 5: Selección de formato Gelato POD, Cupón y Apertura de Checkout
    document.querySelectorAll("[data-product-tier]").forEach((card) => {
      card.addEventListener("click", () => {
        const tierId = card.getAttribute("data-product-tier");
        if (this.state.shippingCountry !== "US" && tierId !== "digital") {
          return;
        }
        this.state.selectedProductTier = tierId;
        if (tierId === "digital") {
          this.state.quantity = 1;
        }
        this._renderProductTiersAndSummary();
        this._updateCheckoutModalBreakdown();
      });
    });

    const applyCouponBtn = document.getElementById("applyCouponBtn");
    if (applyCouponBtn) {
      applyCouponBtn.addEventListener("click", () => this._handleApplyCoupon());
    }

    const couponInput = document.getElementById("couponCodeInput");
    if (couponInput) {
      couponInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this._handleApplyCoupon();
        }
      });
    }

    const openCheckoutBtn = document.getElementById("openCheckoutModalBtn");
    if (openCheckoutBtn) {
      openCheckoutBtn.addEventListener("click", () => this.openCheckoutModal());
    }

    const bindQtyControls = (decId, incId) => {
      const decBtn = document.getElementById(decId);
      const incBtn = document.getElementById(incId);
      if (decBtn) {
        decBtn.addEventListener("click", () => this.setOrderQuantity(this.state.quantity - 1));
      }
      if (incBtn) {
        incBtn.addEventListener("click", () => this.setOrderQuantity(this.state.quantity + 1));
      }
    };
    bindQtyControls("qtyDecreaseBtn", "qtyIncreaseBtn");
    bindQtyControls("checkoutQtyDecreaseBtn", "checkoutQtyIncreaseBtn");

    document.querySelectorAll("[data-qty-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (this.state.selectedProductTier === "digital") return;
        const preset = Number(btn.getAttribute("data-qty-preset")) || 1;
        this.setOrderQuantity(preset);
      });
    });

    const summaryCountrySelect = document.getElementById("summaryCountrySelect");
    if (summaryCountrySelect) {
      summaryCountrySelect.addEventListener("change", (e) => {
        this.handleCountryChange(e.target.value);
      });
    }
  }

  handleCountryChange(countryCode) {
    const normalized = String(countryCode || "US").toUpperCase();
    const prevTier = this.state.selectedProductTier;
    this.state.shippingCountry = normalized;

    const summarySelect = document.getElementById("summaryCountrySelect");
    const checkoutSelect = document.getElementById("checkoutCountrySelect");
    if (summarySelect && summarySelect.value !== normalized) summarySelect.value = normalized;
    if (checkoutSelect && checkoutSelect.value !== normalized) checkoutSelect.value = normalized;

    if (normalized !== "US") {
      const desiredPhysicalTier = prevTier !== "digital" ? prevTier : "hardcover";
      this._lastPhysicalTier = desiredPhysicalTier;
      this.state.selectedProductTier = "digital";
      this.state.quantity = 1;
      this._recordInternationalPilotLead(normalized, desiredPhysicalTier);
    } else if (this.state.selectedProductTier === "digital") {
      this.state.selectedProductTier = this._lastPhysicalTier || "hardcover";
    }

    this._renderProductTiersAndSummary();
    this._updateCheckoutModalBreakdown();
  }

  _recordInternationalPilotLead(countryCode, desiredTier) {
    try {
      const key = "roxytales_international_pilot_leads_v1";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      const entry = {
        type: "international_print_pilot_lead",
        country: countryCode,
        desiredTier,
        buyerName: this.state.buyerName || "",
        buyerEmail: this.state.buyerEmail || "",
        childName: this.state.childName || "",
        petName: this.state.petName || "",
        language: this.state.language || "es",
        createdAt: new Date().toISOString()
      };
      existing.unshift(entry);
      localStorage.setItem(key, JSON.stringify(existing.slice(0, 100)));
      if (typeof odooService?.captureLeadEvent === "function") {
        odooService.captureLeadEvent("international_print_pilot_lead", entry);
      }
    } catch (e) {
      console.warn("[RoxyTales] Could not save international pilot lead:", e);
    }
  }

  setOrderQuantity(nextQty) {
    if (this.state.selectedProductTier === "digital") {
      this.state.quantity = 1;
    } else {
      this.state.quantity = Math.max(1, Math.min(20, Math.floor(Number(nextQty) || 1)));
    }
    this._renderProductTiersAndSummary();
    this._updateCheckoutModalBreakdown();
  }

  /**
   * Conmuta la colección activa y actualiza reactivamente la etiqueta, límites
   * y unidad de edad (meses para 0-2 años; años para >2 años).
   */
  switchStudioCollection(collectionId) {
    const targetCol =
      COLLECTIONS_CATALOG.find((c) => c.id === collectionId) || COLLECTIONS_CATALOG[0];

    const previousUnit = this.state.ageUnit;
    this.state.collectionId = targetCol.id;
    this.state.ageUnit = targetCol.ageUnit; // 'months' | 'years'

    // Ajusta el valor de edad dentro de los nuevos límites sin romper la validación
    if (
      previousUnit !== targetCol.ageUnit ||
      this.state.ageValue < targetCol.minAge ||
      this.state.ageValue > targetCol.maxAge
    ) {
      this.state.ageValue = targetCol.defaultAge;
    }

    const colSelect = document.getElementById("collectionSelect");
    if (colSelect) colSelect.value = targetCol.id;

    this._updateAgeControlUI();
    this._renderBookViewer();

    if (previousUnit !== targetCol.ageUnit) {
      const unitMsg =
        targetCol.ageUnit === "years"
          ? this.state.language === "en"
            ? `Reactive unit switched to YEARS (${targetCol.minAge}–${targetCol.maxAge} yrs)`
            : `Unidad reactiva conmutada a AÑOS (${targetCol.minAge} a ${targetCol.maxAge} años)`
          : this.state.language === "en"
            ? "Reactive unit switched to MONTHS (0–24 mos)"
            : "Unidad reactiva conmutada a MESES (0 a 24 meses)";
      this.showToast(unitMsg, "info");
    }
  }

  _updateAgeControlUI() {
    const col = this._getCurrentCollection();
    const isMonths = col.ageUnit === "months";

    const labelEl = document.getElementById("ageDynamicLabel");
    const badgeEl = document.getElementById("ageUnitReactiveBadge");
    const slider = document.getElementById("ageRangeSlider");
    const numInput = document.getElementById("ageNumberInput");
    const minLabel = document.getElementById("ageSliderMinLabel");
    const maxLabel = document.getElementById("ageSliderMaxLabel");

    if (labelEl) {
      labelEl.textContent = isMonths
        ? this.t("ageLabelMonths")
        : this.t("ageLabelYears", { min: col.minAge, max: col.maxAge });
    }

    if (badgeEl) {
      badgeEl.textContent = isMonths
        ? this.t("ageReactiveBadgeMonths")
        : this.t("ageReactiveBadgeYears");
      badgeEl.className = `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition ${
        isMonths
          ? "bg-rose-50 text-rose-700 border-rose-200"
          : "bg-blue-50 text-blue-700 border-blue-200"
      }`;
    }

    if (slider) {
      slider.min = String(col.minAge);
      slider.max = String(col.maxAge);
      slider.value = String(this.state.ageValue);
    }

    if (numInput) {
      numInput.min = String(col.minAge);
      numInput.max = String(col.maxAge);
      numInput.value = String(this.state.ageValue);
    }

    const unitWord = isMonths ? this.t("ageUnitMonths") : this.t("ageUnitYears");
    if (minLabel) minLabel.textContent = `${col.minAge} ${unitWord}`;
    if (maxLabel) maxLabel.textContent = `${col.maxAge} ${unitWord}`;

    this._updateAgeBadgeDisplay();
  }

  _updateAgeBadgeDisplay() {
    const unitWord =
      this.state.ageUnit === "months" ? this.t("ageUnitMonths") : this.t("ageUnitYears");
    const unitSpan = document.getElementById("ageUnitInlineText");
    if (unitSpan) unitSpan.textContent = unitWord;
  }

  _updateBabyModeToggleUI() {
    const previewBox = document.getElementById("babyUploadedPreviewBox");
    const previewImg = document.getElementById("babyUploadedPreviewImg");
    const previewName = document.getElementById("babyUploadedFileName");
    if (previewBox && previewImg) {
      if (this.state.babyPhotoDataUrl) {
        previewBox.classList.remove("hidden");
        previewImg.src = this.state.babyPhotoDataUrl;
        if (previewName) previewName.textContent = this.state.babyPhotoName;
      } else {
        previewBox.classList.add("hidden");
      }
    }
  }

  selectPetTier(tierId) {
    this.state.petTier = tierId;
    if (tierId === "tier_a_default") {
      this.state.petPhotoFile = null;
      this.state.petPhotoDataUrl = null;
      this.state.profileId = null;
      this.state.renderedPages = {};
      this.state.petName = "Roxy";
      this.state.petSpecies = "dog";
      if (!this.state.petSoundCustomEdited) {
        this.state.petSound = this.state.language === "en" ? "Woof, woof" : "Guau, guau";
      }
    } else {
      const petNameInput = document.getElementById("petNameInput");
      const petSoundInput = document.getElementById("petSoundInput");
      if (petNameInput) petNameInput.value = this.state.petName;
      if (petSoundInput) petSoundInput.value = this.state.petSound;
    }

    this._renderBookViewer();
    this._renderProductTiersAndSummary();
    this._updateGeneratePreviewBtnState();
  }

  _updateGeneratePreviewBtnState() {
    const btn = document.getElementById("generateMagicPreviewBtn");
    if (!btn) return;
    const hasBabyPhoto = Boolean(this.state.babyPhotoDataUrl);
    const hasCompanion =
      this.state.petTier === "tier_a_default" || Boolean(this.state.petPhotoDataUrl);
    const ready = hasBabyPhoto && hasCompanion;
    btn.disabled = !ready;
    btn.classList.toggle("opacity-50", !ready);
    btn.classList.toggle("cursor-not-allowed", !ready);
  }

  _updatePetPhotoPreviewUI() {
    const box = document.getElementById("petUploadedPreviewBox");
    const img = document.getElementById("petUploadedPreviewImg");
    const nameEl = document.getElementById("petUploadedFileName");
    if (!box || !img) return;

    if (this.state.petPhotoDataUrl) {
      box.classList.remove("hidden");
      img.src = this.state.petPhotoDataUrl;
      if (nameEl) nameEl.textContent = this.state.petPhotoName;
    } else {
      box.classList.add("hidden");
    }
  }

  _setupPhotoDropzone({ dropzoneId, fileInputId, removeBtnId, onLoadSuccess, onRemove }) {
    const dropzone =
      document.getElementById(dropzoneId) ||
      document.getElementById(dropzoneId.replace("Dropzone", "DropArea")) ||
      document.getElementById(dropzoneId.replace("DropArea", "Dropzone"));
    const fileInput =
      document.getElementById(fileInputId) ||
      document.getElementById(fileInputId.replace("Input", "FileInput")) ||
      document.getElementById(fileInputId.replace("FileInput", "Input"));
    const removeBtn = document.getElementById(removeBtnId);

    const processFile = (file) => {
      if (!file) return;
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        this.showToast(
          this.state.language === "en"
            ? "Unsupported format. Please upload JPG, PNG, or WEBP."
            : "Formato no válido. Usa imágenes JPG, PNG o WEBP.",
          "error"
        );
        return;
      }
      if (file.size > APP_CONFIG.maxPhotoSizeBytes) {
        this.showToast(
          this.state.language === "en"
            ? "File exceeds 5 MB limit."
            : "La imagen supera el límite máximo de 5 MB.",
          "error"
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        onLoadSuccess(ev.target.result, file.name, file);
      };
      reader.readAsDataURL(file);
    };

    if (dropzone && fileInput) {
      dropzone.addEventListener("click", () => fileInput.click());
      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("border-rose-500", "bg-rose-50/50");
      });
      dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("border-rose-500", "bg-rose-50/50");
      });
      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("border-rose-500", "bg-rose-50/50");
        const file = e.dataTransfer?.files?.[0];
        processFile(file);
      });
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        processFile(file);
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (fileInput) fileInput.value = "";
        onRemove();
      });
    }
  }

  /* ==========================================================================
     4. LEAD GATE, VALIDACIÓN CON ALERTA VISUAL Y CAPTURA PREVENTIVA
     ========================================================================== */
  _isValidBuyerLead() {
    const name = String(this.state.buyerName || "").trim();
    const email = String(this.state.buyerEmail || "").trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return name.length >= 2 && emailRegex.test(email);
  }

  _checkAndUnlockLeadGatePassively() {
    if (this._isValidBuyerLead() && !this.state.leadUnlocked) {
      this.state.leadUnlocked = true;
      this._renderLeadGateBanner();
      this._renderBookViewer();
      odooService.create_crm_lead(this.state, "lead_captured");
    } else {
      this._renderLeadGateBanner();
    }
  }

  _renderLeadGateBanner() {
    const statusBox = document.getElementById("step1LeadGateBanner");
    const statusText = document.getElementById("step1LeadGateStatusText");
    if (!statusBox || !statusText) return;

    if (this.state.leadUnlocked) {
      statusBox.className =
        "mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2";
      statusText.textContent = this.t("leadGateStatusUnlocked");
    } else {
      statusBox.className =
        "mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between gap-2";
      statusText.textContent = this.t("leadGateStatusLocked");
    }
  }

  /**
   * Detiene el avance y aplica una animación de alerta visible sobre el bloque de captura
   * de lead del Paso 1 si el usuario intenta generar la previsualización sin diligenciar
   * nombre o correo, además de ofrecer el modal de desbloqueo rápido.
   */
  triggerLeadGateAlertAndModal(openModal = false) {
    const step1Card = document.getElementById("wizardStep1Card");
    const nameInput = document.getElementById("buyerNameInput");
    const emailInput = document.getElementById("buyerEmailInput");
    const alertMsg = document.getElementById("step1ValidationAlertBox");

    if (alertMsg) {
      alertMsg.classList.remove("hidden");
    }

    if (step1Card) {
      step1Card.scrollIntoView({ behavior: "smooth", block: "center" });
      step1Card.classList.remove("lead-alert-shake");
      void step1Card.offsetWidth; // reflow
      step1Card.classList.add("lead-alert-shake");
    }

    if (nameInput && String(this.state.buyerName || "").trim().length < 2) {
      nameInput.classList.add("border-rose-500", "ring-2", "ring-rose-500/20");
      nameInput.focus();
    } else if (emailInput) {
      emailInput.classList.add("border-rose-500", "ring-2", "ring-rose-500/20");
      emailInput.focus();
    }

    this.showToast(this.t("step1ValidationAlert"), "error");

    if (openModal) {
      this.openLeadGateModal();
    }
  }

  openLeadGateModal() {
    const modal = document.getElementById("leadGateModal");
    if (!modal) return;

    const modalDesc = document.getElementById("leadGateModalDynamicDesc");
    const modalNote = document.getElementById("leadGateModalDynamicNote");
    if (modalDesc) {
      modalDesc.textContent = this.t("leadGateModalDesc", {
        childName: this.state.childName || "Liam",
        petName: this.state.petName || "Roxy"
      });
    }
    if (modalNote) {
      modalNote.textContent = this.t("leadGatePrivacyNote", {
        childName: this.state.childName || "Liam"
      });
    }

    const modalName = document.getElementById("modalLeadNameInput");
    const modalEmail = document.getElementById("modalLeadEmailInput");
    if (modalName) modalName.value = this.state.buyerName || "";
    if (modalEmail) modalEmail.value = this.state.buyerEmail || "";

    modal.classList.remove("hidden");
  }

  /**
   * Captura preventiva de leads ("lead_abandonment"):
   * Registra automáticamente en localStorage cuando el usuario diligencia datos
   * o abandona la pestaña antes de completar el pago.
   */
  _bindAbandonmentListeners() {
    const recordAbandonmentIfIncomplete = () => {
      if (!this.state.orderCompleted) {
        odooService.create_crm_lead(this.state, "lead_abandonment", true);
      }
    };

    window.addEventListener("beforeunload", recordAbandonmentIfIncomplete);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        recordAbandonmentIfIncomplete();
      }
    });
  }

  _schedulePreventiveLeadCapture() {
    if (this._abandonmentTimer) {
      clearTimeout(this._abandonmentTimer);
    }
    this._abandonmentTimer = setTimeout(() => {
      if (!this.state.orderCompleted) {
        const eventType = this.state.leadUnlocked ? "lead_captured" : "lead_abandonment";
        odooService.create_crm_lead(this.state, eventType, true);
      }
    }, 650);
  }

  /* ==========================================================================
     MOTOR DE IA GENERATIVA (FastAPI + Google GenAI + Caché SHA-256)
     ========================================================================== */
  getApiBaseUrl() {
    if (typeof window !== "undefined") {
      if (window.ROXY_API_URL) {
        return String(window.ROXY_API_URL).replace(/\/+$/, "");
      }
      const { hostname, port, origin } = window.location || {};
      if ((hostname === "127.0.0.1" || hostname === "localhost") && port === "4173") {
        return "http://127.0.0.1:8000";
      }
      if (origin && origin !== "null") {
        return origin.replace(/\/+$/, "");
      }
    }
    return "http://127.0.0.1:8000";
  }

  async _checkBackendHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${this.getApiBaseUrl()}/api/health`, {
        method: "GET",
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        this.state.backendAvailable = true;
        return data;
      }
    } catch (e) {
      // Backend no disponible
    }
    this.state.backendAvailable = false;
    return null;
  }

  _dataUrlToBlob(dataUrl) {
    try {
      const arr = dataUrl.split(",");
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    } catch (e) {
      return null;
    }
  }

  async _uploadPhotosToBackend() {
    const formData = new FormData();

    if (this.state.babyPhotoFile) {
      formData.append("baby_photo", this.state.babyPhotoFile, this.state.babyPhotoName || "baby.jpg");
    } else if (this.state.babyPhotoDataUrl) {
      const blob = this._dataUrlToBlob(this.state.babyPhotoDataUrl);
      if (blob) {
        formData.append("baby_photo", blob, this.state.babyPhotoName || "baby.jpg");
      }
    }

    if (this.state.petPhotoFile) {
      formData.append("pet_photo", this.state.petPhotoFile, this.state.petPhotoName || "pet.jpg");
    } else if (this.state.petPhotoDataUrl) {
      const blob = this._dataUrlToBlob(this.state.petPhotoDataUrl);
      if (blob) {
        formData.append("pet_photo", blob, this.state.petPhotoName || "pet.jpg");
      }
    }

    try {
      const res = await fetch(`${this.getApiBaseUrl()}/api/assets/upload`, {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error(`Upload returned status ${res.status}`);
      const data = await res.json();
      this.state.profileId = data.profile_id;
      return data;
    } catch (err) {
      console.warn("[RoxyTales AI Engine] Upload notice:", err.message);
      return null;
    }
  }

  async _requestBackendRender(pageNumber = 1, tier = "preview", onProgress = null) {
    if (!this.state.profileId) {
      await this._uploadPhotosToBackend();
    }

    const payload = {
      profile_id: this.state.profileId,
      pages: [pageNumber],
      tier: tier,
      child_name: this.state.childName || "Liam",
      child_age: parseInt(this.state.ageValue, 10) || 10,
      pet_name: this.state.petName || "Roxy"
    };

    try {
      const res = await fetch(`${this.getApiBaseUrl()}/api/book/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Render endpoint returned ${res.status}`);
      const data = await res.json();
      const job = data.jobs && data.jobs[0];
      if (!job) throw new Error("No job returned by backend");

      if (job.status === "completed" && job.output_url) {
        const fullUrl = job.output_url.startsWith("http")
          ? job.output_url
          : `${this.getApiBaseUrl()}${job.output_url}`;
        this.state.renderedPages[pageNumber] = fullUrl;
        if (onProgress) onProgress(100, this.t("renderingStage4"));
        return fullUrl;
      }

      // Polling reactivo con micro-estados del backend (timeout generoso de 90s para generación 3D real)
      const jobId = job.job_id;
      const startTime = Date.now();
      let smoothPct = 28;
      while (Date.now() - startTime < 90000) {
        await new Promise((r) => setTimeout(r, 1000));
        const pollRes = await fetch(`${this.getApiBaseUrl()}/api/book/jobs/${jobId}`);
        if (!pollRes.ok) continue;
        const jobStatus = await pollRes.json();

        if (onProgress) {
          smoothPct = Math.min(92, Math.max(smoothPct + 2, jobStatus.progress || 30));
          const msg = smoothPct < 45
            ? this.t("renderingStage1", { childName: this.state.childName })
            : smoothPct < 75
            ? this.t("renderingStage2", { childName: this.state.childName, petName: this.state.petName })
            : this.t("renderingStage3");
          onProgress(smoothPct, msg);
        }

        if (jobStatus.status === "completed" && jobStatus.output_url) {
          const fullUrl = jobStatus.output_url.startsWith("http")
            ? jobStatus.output_url
            : `${this.getApiBaseUrl()}${jobStatus.output_url}`;
          this.state.renderedPages[pageNumber] = fullUrl;
          if (onProgress) onProgress(100, this.t("renderingStage4"));
          return fullUrl;
        }

        if (jobStatus.status === "failed") {
          throw new Error(jobStatus.error_message || "Render failed");
        }
      }
      throw new Error("Render timeout");
    } catch (err) {
      console.warn(`[RoxyTales AI Engine] Page ${pageNumber} render notice:`, err.message);
      return null;
    }
  }

  async _triggerBackgroundBatchRender(pages = [2, 3, 4, 5, 6, 7], tier = "preview") {
    try {
      if (!this.state.profileId) {
        await this._uploadPhotosToBackend();
      }
      if (!this.state.profileId) return;

      const payload = {
        profile_id: this.state.profileId,
        pages: pages,
        tier: tier,
        child_name: this.state.childName || "Liam",
        child_age: parseInt(this.state.ageValue, 10) || 10,
        pet_name: this.state.petName || "Roxy"
      };

      const res = await fetch(`${this.getApiBaseUrl()}/api/book/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) return;
      const data = await res.json();

      (data.jobs || []).forEach(async (job) => {
        if (job.status === "completed" && job.output_url) {
          const fullUrl = job.output_url.startsWith("http")
            ? job.output_url
            : `${this.getApiBaseUrl()}${job.output_url}`;
          this.state.renderedPages[job.page_number] = fullUrl;
          if (this.state.currentPage === job.page_number) this._renderBookViewer();
          return;
        }

        const jobId = job.job_id;
        const pNum = job.page_number;
        for (let i = 0; i < 90; i++) {
          await new Promise((r) => setTimeout(r, 1500));
          try {
            const pRes = await fetch(`${this.getApiBaseUrl()}/api/book/jobs/${jobId}`);
            if (pRes.ok) {
              const pData = await pRes.json();
              if (pData.status === "completed" && pData.output_url) {
                const fullUrl = pData.output_url.startsWith("http")
                  ? pData.output_url
                  : `${this.getApiBaseUrl()}${pData.output_url}`;
                this.state.renderedPages[pNum] = fullUrl;
                if (this.state.currentPage === pNum) this._renderBookViewer();
                break;
              }
              if (pData.status === "failed") break;
            }
          } catch (e) {
            break;
          }
        }
      });
    } catch (e) {
      console.warn("[RoxyTales AI Engine] Background batch notice:", e.message);
    }
  }

  /* ==========================================================================
     5. GENERACIÓN CINEMÁTICA ("TEJIENDO LA MAGIA") Y VISOR 8×8"
     ========================================================================== */
  async handleGenerateMagicPreview() {
    // Auditoría adversarial #1: detener avance y aplicar animación de alerta si faltan datos de lead
    if (!this._isValidBuyerLead()) {
      this.triggerLeadGateAlertAndModal(false);
      return;
    }

    const alertMsg = document.getElementById("step1ValidationAlertBox");
    if (alertMsg) alertMsg.classList.add("hidden");

    this.state.leadUnlocked = true;
    this.state.isRenderingPreview = true;
    this._renderLeadGateBanner();

    const renderOverlay = document.getElementById("viewerMagicRenderOverlay");
    const stageTextEl = document.getElementById("viewerRenderStageText");
    const progressBar = document.getElementById("viewerRenderProgressBar");
    const scannerBabyImg = document.getElementById("magicScannerBabyImg");
    const scannerAvatarFallback = document.getElementById("magicScannerAvatarFallback");

    if (this.state.babyPhotoDataUrl && scannerBabyImg) {
      scannerBabyImg.src = this.state.babyPhotoDataUrl;
      scannerBabyImg.classList.remove("hidden");
      if (scannerAvatarFallback) scannerAvatarFallback.classList.add("hidden");
    } else {
      if (scannerBabyImg) scannerBabyImg.classList.add("hidden");
      if (scannerAvatarFallback) scannerAvatarFallback.classList.remove("hidden");
    }

    if (renderOverlay) {
      renderOverlay.classList.remove("hidden");
    }

    // Inicia animación de partículas estelares doradas en canvas
    this._startMagicParticles();

    // Desplaza suavemente hacia el visor en móvil
    const viewerBox = document.getElementById("bookViewerColumn");
    if (viewerBox && window.innerWidth < 1024) {
      viewerBox.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Intento de renderizado real con motor backend FastAPI / Google GenAI
    let backendSuccess = false;
    try {
      const isHealthy = await this._checkBackendHealth();
      if (isHealthy) {
        if (stageTextEl) stageTextEl.textContent = this.t("renderingStage1", { childName: this.state.childName });
        if (progressBar) progressBar.style.width = "25%";

        const renderedUrl = await this._requestBackendRender(1, "preview", (pct, text) => {
          if (progressBar) progressBar.style.width = `${pct}%`;
          if (stageTextEl) stageTextEl.textContent = text;
        });

        if (renderedUrl) {
          backendSuccess = true;
        }
      }
    } catch (e) {
      console.warn("[RoxyTales] Fallback local tras error en backend:", e);
    }

    // Fallback cinematográfico fluido de 2.5s garantizado si el backend está offline o falló
    if (!backendSuccess) {
      const stages = [
        { progress: 28, duration: 750, text: this.t("renderingStage1", { childName: this.state.childName }) },
        { progress: 68, duration: 850, text: this.t("renderingStage2", { childName: this.state.childName, petName: this.state.petName }) },
        { progress: 96, duration: 650, text: this.t("renderingStage3") },
        { progress: 100, duration: 350, text: this.t("renderingStage4") }
      ];

      for (const st of stages) {
        if (stageTextEl) stageTextEl.textContent = st.text;
        if (progressBar) progressBar.style.width = `${st.progress}%`;
        await new Promise((r) => setTimeout(r, st.duration));
      }
    }

    this._stopMagicParticles();
    if (renderOverlay) {
      renderOverlay.classList.add("hidden");
    }
    this.state.isRenderingPreview = false;

    // Registra el evento en Odoo CRM
    await odooService.create_crm_lead(this.state, "preview_generated", true);

    // Animación de Unboxing de Tapa Dura en el libro 3D
    const canvas = document.getElementById("bookCanvas8x8");
    if (canvas) {
      canvas.classList.remove("book-unboxing-anim", "page-turn-animate", "page-turn-curvature");
      void canvas.offsetWidth;
      canvas.classList.add("book-unboxing-anim");
      setTimeout(() => canvas.classList.remove("book-unboxing-anim"), 1600);
    }

    // Revela la portada natural 3D (Control de costos Opción C: solo Página 1 en vista previa; Pág. 2-7 al comprar)
    this.goToPage(1);

    this.showToast(
      this.state.language === "en"
        ? "✨ Luxury 8×8\" Hardcover Storybook Unboxed!"
        : "✨ ¡Edición de Lujo en Pasta Dura 8×8\" Revelada!",
      "success"
    );
  }

  _startMagicParticles() {
    const canvas = document.getElementById("magicParticlesCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth || 500;
    canvas.height = canvas.offsetHeight || 500;

    const particles = [];
    const colors = ["#F59E0B", "#FEF08A", "#E11D48", "#FFFFFF", "#FBBF24"];
    for (let i = 0; i < 48; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2.6 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 1.2,
        vy: -Math.random() * 1.6 - 0.4,
        alpha: Math.random() * 0.7 + 0.3,
        pulseSpeed: Math.random() * 0.05 + 0.02
      });
    }

    let isRunning = true;
    this._particleAnimId = null;

    const loop = () => {
      if (!isRunning) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += Math.sin(Date.now() * p.pulseSpeed) * 0.03;
        p.alpha = Math.max(0.2, Math.min(1, p.alpha));

        if (p.y < -10) p.y = canvas.height + 10;
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      this._particleAnimId = requestAnimationFrame(loop);
    };

    loop();

    this._stopMagicParticles = () => {
      isRunning = false;
      if (this._particleAnimId) {
        cancelAnimationFrame(this._particleAnimId);
        this._particleAnimId = null;
      }
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }

  _bindTouchSwipe() {
    const canvas = document.getElementById("bookCanvas8x8");
    if (!canvas) return;

    let touchStartX = 0;
    let touchStartY = 0;

    canvas.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      },
      { passive: true }
    );

    canvas.addEventListener(
      "touchend",
      (e) => {
        if (touchStartX === 0) return;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
          if (diffX < 0) {
            // Swipe Left -> Next Page
            if (this.state.currentPage < PAGES_BLUEPRINT.length) this.goToPage(this.state.currentPage + 1);
          } else {
            // Swipe Right -> Prev Page
            if (this.state.currentPage > 1) this.goToPage(this.state.currentPage - 1);
          }
        }
        touchStartX = 0;
        touchStartY = 0;
      },
      { passive: true }
    );
  }

  _initBeforeAfterSlider() {
    const container = document.getElementById("photoRevealSliderContainer");
    const clipEl = document.getElementById("beforeAfterClip");
    const handleEl = document.getElementById("beforeAfterHandle");
    if (!container || !clipEl || !handleEl) return;

    const beforeImg = clipEl.querySelector("img");
    const syncImageWidth = () => {
      if (beforeImg) {
        beforeImg.style.width = container.offsetWidth + "px";
      }
    };

    syncImageWidth();
    window.addEventListener("resize", syncImageWidth);

    let isDragging = false;

    const updateSlider = (clientX) => {
      const rect = container.getBoundingClientRect();
      const offsetX = clientX - rect.left;
      let pct = (offsetX / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      clipEl.style.width = `${pct}%`;
      handleEl.style.left = `${pct}%`;
    };

    const onStart = (e) => {
      isDragging = true;
      const clientX = e.clientX ?? e.touches?.[0]?.clientX;
      if (clientX !== undefined) updateSlider(clientX);
    };

    const onMove = (e) => {
      if (!isDragging) return;
      const clientX = e.clientX ?? e.touches?.[0]?.clientX;
      if (clientX !== undefined) updateSlider(clientX);
    };

    const onEnd = () => {
      isDragging = false;
    };

    container.addEventListener("mousedown", onStart);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);

    container.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
  }

  _initInspirationGallery() {
    const presetButtons = document.querySelectorAll("[data-try-style]");
    presetButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const styleId = btn.getAttribute("data-try-style");
        if (styleId === "case1") {
          this.state.childName = "Liam";
          this.state.ageValue = 10;
          this.state.ageUnit = "months";
          this.state.petName = "Roxy";
          this.state.petSound = this.state.language === "en" ? "Woof, woof" : "Guau, guau";
          this.setPetTier("tier_a_default");
        } else if (styleId === "case2") {
          this.state.childName = "Sofía";
          this.state.ageValue = 8;
          this.state.ageUnit = "months";
          this.state.petName = "Lucas";
          this.state.petSound = this.state.language === "en" ? "Woof, woof" : "Guau, guau";
          this.setPetTier("tier_a_default");
        } else if (styleId === "case3") {
          this.state.childName = "Mateo";
          this.state.ageValue = 14;
          this.state.ageUnit = "months";
          this.state.petName = "Misi";
          this.state.petSpecies = "cat";
          this.state.petSound = "Miau, miau";
          this.setPetTier("tier_c_traits");
        }

        // Sincroniza campos en pantalla
        const nameInput = document.getElementById("childNameInput");
        if (nameInput) nameInput.value = this.state.childName;
        const charCount = document.getElementById("childNameCharCount");
        if (charCount) charCount.textContent = `${this.state.childName.length}/18`;

        const ageNum = document.getElementById("ageNumberInput");
        if (ageNum) ageNum.value = this.state.ageValue;
        const ageSlider = document.getElementById("ageRangeSlider");
        if (ageSlider) ageSlider.value = this.state.ageValue;

        const petInput = document.getElementById("petNameInput");
        if (petInput) petInput.value = this.state.petName;
        const petSoundInput = document.getElementById("petSoundInput");
        if (petSoundInput) petSoundInput.value = this.state.petSound;

        this._updateActivePageTypographyInPlace();
        this._renderBookViewer();

        const studioSection = document.getElementById("heroStudioSection");
        if (studioSection) {
          studioSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        this.showToast(
          this.state.language === "en"
            ? `✨ Style loaded for ${this.state.childName} & ${this.state.petName}!`
            : `✨ ¡Estilo cargado para ${this.state.childName} y ${this.state.petName}!`,
          "success"
        );
      });
    });
  }

  _initStickyConversionBar() {
    const bar = document.getElementById("stickyConversionBar");
    if (!bar) return;

    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            const hero = document.getElementById("heroStudioSection");
            const threshold = hero ? hero.offsetTop + 320 : 350;
            const shouldShow = scrollY > threshold;
            bar.classList.toggle("visible", shouldShow);
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );

    const ctaBtn = document.getElementById("stickyBarCtaBtn");
    if (ctaBtn) {
      ctaBtn.addEventListener("click", () => {
        this.openCheckoutModal();
      });
    }

    const navCheckoutBtn = document.getElementById("navCheckoutBtn");
    if (navCheckoutBtn) {
      navCheckoutBtn.addEventListener("click", () => {
        this.openCheckoutModal();
      });
    }
  }

  _bindViewerEvents() {
    const prevBtn = document.getElementById("viewerPrevPageBtn");
    const nextBtn = document.getElementById("viewerNextPageBtn");
    const floatingPrev = document.getElementById("floatingPrevBtn");
    const floatingNext = document.getElementById("floatingNextBtn");
    const guidesCheckbox = document.getElementById("togglePrintGuidesCheckbox");
    const unlockOverlayBtn = document.getElementById("viewerUnlockLeadGateBtn");
    const copyPromptBtn = document.getElementById("copyPagePromptBtn");
    const postRevealSamplePdfBtn = document.getElementById("postRevealSamplePdfBtn");
    const postRevealOrderHardcoverBtn = document.getElementById("postRevealOrderHardcoverBtn");

    const goPrev = () => {
      if (this.state.currentPage > 1) this.goToPage(this.state.currentPage - 1);
    };
    const goNext = () => {
      if (this.state.currentPage < PAGES_BLUEPRINT.length) this.goToPage(this.state.currentPage + 1);
    };

    if (prevBtn) prevBtn.addEventListener("click", goPrev);
    if (nextBtn) nextBtn.addEventListener("click", goNext);
    if (floatingPrev) floatingPrev.addEventListener("click", goPrev);
    if (floatingNext) floatingNext.addEventListener("click", goNext);

    if (guidesCheckbox) {
      guidesCheckbox.addEventListener("change", (e) => {
        this.state.showPrintGuides = e.target.checked;
        this._renderBookViewer();
      });
    }

    if (unlockOverlayBtn) {
      unlockOverlayBtn.addEventListener("click", () => {
        this.triggerLeadGateAlertAndModal(true);
      });
    }

    if (copyPromptBtn) {
      copyPromptBtn.addEventListener("click", () => {
        const promptEl = document.getElementById("viewerPromptText");
        if (promptEl) {
          navigator.clipboard.writeText(promptEl.textContent).then(() => {
            this.showToast(this.t("copiedPromptToast"), "success");
          });
        }
      });
    }

    if (postRevealSamplePdfBtn) {
      postRevealSamplePdfBtn.addEventListener("click", () => {
        this.handleDownloadPdfBook(true);
      });
    }

    if (postRevealOrderHardcoverBtn) {
      postRevealOrderHardcoverBtn.addEventListener("click", () => {
        this.selectProductTier("hardcover");
        const step5 = document.getElementById("wizardStep5Card");
        if (step5) {
          step5.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
  }

  selectProductTier(tierId) {
    if (["digital", "softcover", "hardcover"].includes(tierId)) {
      this.state.selectedProductTier = tierId;
      this._renderProductTiersAndSummary();
      this._updateCheckoutModalBreakdown();

      if (tierId === "hardcover") {
        const hcCard = document.querySelector('[data-product-tier="hardcover"]');
        if (hcCard) {
          hcCard.classList.remove("hardcover-highlight-glow");
          void hcCard.offsetWidth;
          hcCard.classList.add("hardcover-highlight-glow");
          setTimeout(() => hcCard.classList.remove("hardcover-highlight-glow"), 2500);
        }
      }
    }
  }

  _formatStoryTextWithGoldShimmer(text) {
    if (!text) return "";
    const childName = (this.state.childName || "").trim();
    if (!childName) {
      return this._escapeHtml(text);
    }
    const escapedSearch = childName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedSearch})`, "gi");
    const parts = String(text).split(regex);
    return parts
      .map((part) => {
        if (part.toLowerCase() === childName.toLowerCase()) {
          return `<span class="gold-shimmer-text font-bold">${this._escapeHtml(part)}</span>`;
        }
        return this._escapeHtml(part);
      })
      .join("");
  }

  _getPageTextParts(pageBlueprint) {
    const isEn = this.state.language === "en";
    const titleText = this._interpolateStoryTokens(this._getAgeAdaptivePageText(pageBlueprint));
    const subRaw = isEn ? pageBlueprint.subtextEn : pageBlueprint.subtextEs;
    const subtext = subRaw ? this._interpolateStoryTokens(subRaw) : "";
    return { titleText, subtext };
  }

  _syncClosingUpsellCard(pageBlueprint, isEn) {
    const upsellCard = document.getElementById("postRevealUpsellCard");
    if (!upsellCard) return;
    const isClosingReveal =
      Boolean(pageBlueprint.isDedicationPage) ||
      pageBlueprint.pageNumber === PAGES_BLUEPRINT.length;
    upsellCard.classList.toggle("hidden", !isClosingReveal);
    if (isClosingReveal) {
      const hcBtn = document.getElementById("postRevealOrderHardcoverBtn");
      if (hcBtn) {
        hcBtn.innerHTML = `⭐ ${isEn ? "Order Luxury Hardcover" : "Pedir Edición Pasta Dura"}`;
      }
    }
  }

  /**
   * Actualiza en tiempo real los textos tipográficos de la página activa
   * mediante una micro-animación de destello suave (.text-shimmer-flash) sin reiniciar el libro.
   */
  _updateActivePageTypographyInPlace() {
    const isEn = this.state.language === "en";
    const pageBlueprint =
      PAGES_BLUEPRINT.find((p) => p.pageNumber === this.state.currentPage) ||
      PAGES_BLUEPRINT[0];

    // Actualiza textos en la página activa
    if (pageBlueprint.isDedicationPage) {
      // Página 24: Dedicatoria
      const relObj = this._getCurrentRelationship();
      const signature = isEn ? relObj.signatureEn : relObj.signatureEs;
      const headerLine = isEn
        ? `With eternal love, for ${this.state.childName}.`
        : `Con amor eterno, para ${this.state.childName}.`;
      const dateLine = isEn
        ? `December ${this.state.customYear}`
        : `Diciembre ${this.state.customYear}`;

      const headEl = document.getElementById("dedicationHeaderLine");
      if (headEl) headEl.innerHTML = this._formatStoryTextWithGoldShimmer(headerLine);
      const dateEl = document.getElementById("dedicationDateLine");
      if (dateEl) dateEl.textContent = dateLine;
      const quoteEl = document.getElementById("dedicationQuoteLine");
      if (quoteEl) quoteEl.textContent = `“${this.state.dedicationText}”`;
      const sigEl = document.getElementById("dedicationSignatureLine");
      if (sigEl) sigEl.textContent = `— ${signature}`;

      const parchmentCard = document.getElementById("dedicationParchmentCard");
      if (parchmentCard) {
        parchmentCard.classList.remove("text-shimmer-flash");
        void parchmentCard.offsetWidth;
        parchmentCard.classList.add("text-shimmer-flash");
        setTimeout(() => parchmentCard.classList.remove("text-shimmer-flash"), 900);
      }
    } else {
      // Páginas 1 a 23
      const { titleText, subtext } = this._getPageTextParts(pageBlueprint);
      const textEl = document.getElementById("pageStoryTextEl");
      if (textEl) {
        textEl.innerHTML = this._formatStoryTextWithGoldShimmer(titleText);
      }
      const subEl = document.getElementById("pageSubtextEl");
      if (subEl && subtext) {
        subEl.textContent = subtext;
      }

      if (pageBlueprint.pageNumber === 1) {
        const ageBadge = document.getElementById("page1AgeBadge");
        if (ageBadge) {
          const editionSuffix = isEn ? '8×8" Edition' : 'Edición 8×8"';
          ageBadge.textContent = `${this.state.ageValue} ${
            this.state.ageUnit === "months"
              ? this.t("ageUnitMonths")
              : this.t("ageUnitYears")
          } · ${editionSuffix}`;
        }
      }

      const typoBox = document.getElementById("pageTypographyBox");
      if (typoBox) {
        typoBox.classList.remove("text-shimmer-flash");
        void typoBox.offsetWidth;
        typoBox.classList.add("text-shimmer-flash");
        setTimeout(() => typoBox.classList.remove("text-shimmer-flash"), 900);
      }
    }

    // Actualiza folio inferior en páginas 2..23
    const folioEl = document.getElementById("folioChildPetName");
    if (folioEl && pageBlueprint.pageNumber >= 2 && pageBlueprint.pageNumber <= 23) {
      folioEl.textContent = `${this.state.childName} & ${this.state.petName}`;
    }

    // Actualiza insignia de nombre en avatar/cameo del bebé si existe
    const babyBadge = document.querySelector(".baby-name-badge");
    if (babyBadge) {
      babyBadge.textContent = this.state.childName;
    }

    // Actualiza guía sensorial y prompt
    const sensoryTextEl = document.getElementById("viewerSensoryGuideText");
    if (sensoryTextEl) {
      const rawCue = isEn ? pageBlueprint.sensoryCueEn : pageBlueprint.sensoryCueEs;
      sensoryTextEl.textContent = this._interpolateStoryTokens(rawCue);
    }

    const promptTextEl = document.getElementById("viewerPromptText");
    if (promptTextEl) {
      promptTextEl.textContent = this._buildExecutablePrompt(pageBlueprint);
    }

    // Botones de navegación lateral flotante
    const floatPrev = document.getElementById("floatingPrevBtn");
    const floatNext = document.getElementById("floatingNextBtn");
    if (floatPrev) floatPrev.disabled = pageBlueprint.pageNumber <= 1;
    if (floatNext) floatNext.disabled = pageBlueprint.pageNumber >= PAGES_BLUEPRINT.length;

    // Gatillo de conversión post-revelación (Activo en Página 24)
    this._syncClosingUpsellCard(pageBlueprint, isEn);
  }

  goToPage(pageNumber) {
    const target = Math.max(1, Math.min(PAGES_BLUEPRINT.length, pageNumber));

    // Si intenta ir a las páginas 2-8 sin haber desbloqueado el Lead Gate,
    // muestra la página con el overlay de Lead Gate y alerta en Paso 1
    this.state.currentPage = target;
    const canvas = document.getElementById("bookCanvas8x8");
    if (canvas) {
      canvas.classList.remove("page-turn-animate", "page-turn-curvature");
      void canvas.offsetWidth;
      canvas.classList.add("page-turn-curvature");
      setTimeout(() => canvas.classList.remove("page-turn-curvature"), 500);
    }
    this._renderBookViewer();

    if (target > 1 && !this.state.leadUnlocked) {
      this.triggerLeadGateAlertAndModal(false);
    }
  }

  /**
   * Renderiza el visor 8×8" (aspect ratio 1:1), miniaturas de páginas 1 a 8,
   * guías de sangrado/seguridad, guía sensorial para padres y prompt IA.
   */
  _renderBookViewer() {
    const pageBlueprint =
      PAGES_BLUEPRINT.find((p) => p.pageNumber === this.state.currentPage) ||
      PAGES_BLUEPRINT[0];

    const isEn = this.state.language === "en";

    // Indicador de página y rol editorial
    const indicatorEl = document.getElementById("viewerPageCounter");
    const roleEl = document.getElementById("viewerPageRoleBadge");
    const reserveBadge = document.getElementById("viewerReserveZoneBadge");

    if (indicatorEl) {
      indicatorEl.textContent = this.t("viewerPageIndicator", {
        current: pageBlueprint.pageNumber
      });
    }
    if (roleEl) {
      roleEl.textContent = isEn ? pageBlueprint.roleEn : pageBlueprint.roleEs;
    }
    if (reserveBadge) {
      reserveBadge.textContent = isEn
        ? pageBlueprint.layoutZoneLabelEn
        : pageBlueprint.layoutZoneLabelEs;
    }

    // Estado de botones Anterior / Siguiente
    const prevBtn = document.getElementById("viewerPrevPageBtn");
    const nextBtn = document.getElementById("viewerNextPageBtn");
    if (prevBtn) prevBtn.disabled = pageBlueprint.pageNumber <= 1;
    if (nextBtn) nextBtn.disabled = pageBlueprint.pageNumber >= PAGES_BLUEPRINT.length;

    // Botones numerados de páginas 1 a 8
    const pillsContainer = document.getElementById("viewerPagePills");
    if (pillsContainer) {
      pillsContainer.innerHTML = PAGES_BLUEPRINT.map((p) => {
        const isCurrent = p.pageNumber === this.state.currentPage;
        const isLocked = p.pageNumber > 1 && !this.state.leadUnlocked;
        return `
          <button
            type="button"
            data-goto-page="${p.pageNumber}"
            class="w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center border transition ${
              isCurrent
                ? "bg-rose-600 text-white border-rose-600 shadow-md scale-105"
                : isLocked
                  ? "bg-slate-100 text-slate-400 border-slate-200 hover:border-amber-400"
                  : "bg-white text-slate-700 border-slate-200 hover:border-rose-300"
            }"
            title="Page ${p.pageNumber}"
          >
            ${isLocked ? `🔒` : p.pageNumber}
          </button>
        `;
      }).join("");

      pillsContainer.querySelectorAll("[data-goto-page]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const num = parseInt(btn.getAttribute("data-goto-page"), 10);
          this.goToPage(num);
        });
      });
    }

    // Renderiza el interior del lienzo 8x8"
    const stageEl = document.getElementById("bookPageInnerStage");
    if (stageEl) {
      stageEl.innerHTML = this._buildSinglePageHtml(pageBlueprint, false);
    }

    // Overlay de bloqueo en páginas 2 a 8 si el Lead Gate sigue cerrado
    const lockOverlay = document.getElementById("viewerLockedGateOverlay");
    if (lockOverlay) {
      const shouldLock = pageBlueprint.pageNumber > 1 && !this.state.leadUnlocked;
      lockOverlay.classList.toggle("hidden", !shouldLock);
    }

    // Guía sensorial para padres y Prompt IA
    const sensoryTextEl = document.getElementById("viewerSensoryGuideText");
    if (sensoryTextEl) {
      const rawCue = isEn ? pageBlueprint.sensoryCueEn : pageBlueprint.sensoryCueEs;
      sensoryTextEl.textContent = this._interpolateStoryTokens(rawCue);
    }

    const promptTextEl = document.getElementById("viewerPromptText");
    if (promptTextEl) {
      promptTextEl.textContent = this._buildExecutablePrompt(pageBlueprint);
    }

    // Botones de navegación lateral flotante
    const floatPrev = document.getElementById("floatingPrevBtn");
    const floatNext = document.getElementById("floatingNextBtn");
    if (floatPrev) floatPrev.disabled = pageBlueprint.pageNumber <= 1;
    if (floatNext) floatNext.disabled = pageBlueprint.pageNumber >= PAGES_BLUEPRINT.length;

    // Gatillo de conversión post-revelación (Activo en Página 24)
    this._syncClosingUpsellCard(pageBlueprint, isEn);
  }

  /**
   * Construye el HTML de una página 8×8" combinando:
   * - Ilustración base 3D (`assets/stories/my_first_christmas_24p/layouts/`) o Pergamino Oficial en Pág. 24
   * - Reserva tipográfica superior (25% a 35%) o inferior (60% en Pág. 24)
   * - Composición dinámica en capas del Bebé y Mascota
   * - Guías de sangrado (3mm) y margen seguro (6mm)
   */
  _buildSinglePageHtml(pageBlueprint, isPrintSheet = false) {
    const isEn = this.state.language === "en";
    const { titleText: interpolatedText, subtext: interpolatedSubtext } =
      this._getPageTextParts(pageBlueprint);

    const guidesHtml =
      this.state.showPrintGuides && !isPrintSheet
        ? `
          <div class="print-bleed-guide" title="3mm Outer Bleed">
            <span class="absolute top-1 right-1.5 bg-rose-600 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">Bleed 3mm</span>
          </div>
          <div class="print-safe-guide" title="6mm Safe Margin">
            <span class="absolute bottom-1 left-1.5 bg-blue-600 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">Safe 6mm</span>
          </div>
          ${
            !pageBlueprint.isDedicationPage
              ? `<div class="print-typography-reserve-guide" style="height: ${pageBlueprint.layoutReservePercent}%">
                  <span class="absolute bottom-1 right-2 text-[9px] font-mono font-bold text-amber-800 bg-amber-100/90 px-1.5 rounded">
                    Typography Zone (${pageBlueprint.layoutReservePercent}%)
                  </span>
                </div>`
              : ""
          }
        `
        : "";

    // PÁGINA 8: DEDICATORIA Y SELLO OFICIAL ROXYTALES
    if (pageBlueprint.isDedicationPage) {
      const relObj = this._getCurrentRelationship();
      const signature = isEn ? relObj.signatureEn : relObj.signatureEs;
      const headerLine = isEn
        ? `With eternal love, for ${this._escapeHtml(this.state.childName)}.`
        : `Con amor eterno, para ${this._escapeHtml(this.state.childName)}.`;
      const dateLine = isEn
        ? `December ${this._escapeHtml(this.state.customYear)}`
        : `Diciembre ${this._escapeHtml(this.state.customYear)}`;

      return `
        <div class="relative w-full h-full parchment-page-surface flex flex-col justify-between p-[6%] select-none overflow-hidden">
          ${
            pageBlueprint.bgImage
              ? `<img src="${pageBlueprint.bgImage}" alt="Dedication Background" class="absolute inset-0 w-full h-full object-cover opacity-90 pointer-events-none" />`
              : ""
          }
          ${guidesHtml}
          <!-- Marcos dorados ornamentales de esquina -->
          <div class="absolute inset-[4%] border border-amber-700/25 rounded-lg pointer-events-none"></div>
          <div class="absolute inset-[5%] border border-amber-600/15 rounded pointer-events-none"></div>

          <!-- Tercio superior: Medallón circular oficial RoxyTales -->
          <div class="relative z-10 h-[36%] flex flex-col items-center justify-center pt-1">
            <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white p-1.5 shadow-md border-2 border-amber-500/40 flex items-center justify-center overflow-hidden">
              <img
                src="${APP_CONFIG.imprintSealPath}"
                alt="RoxyTales Official Medallion Seal"
                class="w-full h-full object-contain"
              />
            </div>
            <span class="mt-1 text-[10px] uppercase tracking-[0.2em] text-amber-900/70 font-semibold">
              Official Keepsake Edition · 8×8"
            </span>
          </div>

          <!-- 60% inferior: Pergamino libre para inyección de dedicatoria -->
          <div id="dedicationParchmentCard" class="relative z-10 h-[60%] flex flex-col items-center justify-center text-center px-4 sm:px-6 bg-white/60 backdrop-blur-[2px] rounded-xl border border-amber-900/10 shadow-inner transition-all">
            <p id="dedicationHeaderLine" class="font-dedication font-semibold text-sm sm:text-base text-[#3D3835]">
              ${headerLine}
            </p>
            <p id="dedicationDateLine" class="font-dedication text-xs uppercase tracking-widest text-amber-800/80 mt-0.5 mb-2.5">
              ${dateLine}
            </p>
            <blockquote id="dedicationQuoteLine" class="font-dedication italic text-xs sm:text-sm md:text-[15px] leading-relaxed text-[#3D3835] max-w-md mx-auto">
              “${this._escapeHtml(this.state.dedicationText)}”
            </blockquote>
            <p id="dedicationSignatureLine" class="font-dedication font-semibold text-xs sm:text-sm text-rose-800 mt-3">
              — ${this._escapeHtml(signature)}
            </p>
          </div>

          <div class="relative z-10 flex items-center justify-center text-[10px] text-amber-900/60 tracking-widest uppercase pt-1 px-2">
            <span>RoxyTales Publishing Imprint</span>
          </div>
        </div>
      `;
    }

    // PÁGINAS 1 A 7: ESCENA 3D + RESERVA DE TIPOGRAFÍA SUPERIOR + COMPOSICIÓN DINÁMICA DE PERSONAJES
    const isDark = Boolean(pageBlueprint.isDarkPage);
    const textColorHex = isDark ? "#FDFBF7" : "#2C2A29";
    const textBgClass = isDark
      ? "bg-slate-950/35 text-[#FDFBF7] border-white/15 shadow-lg"
      : "bg-white/75 text-[#2C2A29] border-amber-900/10 shadow-sm";

    const aiRenderUrl = this.state.renderedPages && this.state.renderedPages[pageBlueprint.pageNumber];
    const bgImageSrc = aiRenderUrl || pageBlueprint.bgImage;

    const subtextHtml = interpolatedSubtext
      ? `<p id="pageSubtextEl" class="mt-1.5 text-[11px] sm:text-xs font-medium leading-relaxed opacity-85" style="color: ${isDark ? "#E2E8F0" : "#5C5349"};">
           ${this._escapeHtml(interpolatedSubtext)}
         </p>`
      : "";
    const showCharacters = pageBlueprint.pageNumber === 1 || Boolean(pageBlueprint.isScenePage);
    const isInteriorNumbered = pageBlueprint.pageNumber >= 2 && pageBlueprint.pageNumber <= 23;
    const folioRowHtml = isInteriorNumbered
      ? `<div class="relative z-20 flex items-center justify-between px-[5%] pb-[2.5%] text-[10px] font-serif">
          <span id="folioChildPetName" class="text-[10px] font-medium" style="color: ${isDark ? "rgba(253,251,247,0.75)" : "#786F66"};">
            ${this._escapeHtml(this.state.childName)} &amp; ${this._escapeHtml(this.state.petName)}
          </span>
          <span class="text-[11px] font-medium" style="color: ${isDark ? "rgba(253,251,247,0.75)" : "#786F66"};">${pageBlueprint.pageNumber} / 24</span>
        </div>`
      : "";

    return `
      <div class="relative w-full h-full overflow-hidden flex flex-col justify-between select-none bg-[#F8F3E8]">
        ${guidesHtml}

        <!-- Capa 1: Escena 3D de fondo con espacio negativo superior -->
        <img
          src="${bgImageSrc}"
          alt="Page ${pageBlueprint.pageNumber} 3D Storybook Background"
          class="absolute inset-0 w-full h-full object-cover object-center"
        />

        ${
          aiRenderUrl
            ? `<div class="absolute top-2 right-2 z-30 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-600/90 text-white shadow-sm backdrop-blur-xs">
                ✨ 3D Keepsake Edition
              </div>`
            : ""
        }

        <!-- Gradiente superior sutil para garantizar legibilidad de tipografía a 300 DPI -->
        <div
          class="absolute top-0 left-0 right-0 pointer-events-none"
          style="height: ${pageBlueprint.layoutReservePercent + 8}%; background: ${
            isDark
              ? "linear-gradient(180deg, rgba(15,23,48,0.88) 0%, rgba(15,23,48,0.45) 75%, transparent 100%)"
              : "linear-gradient(180deg, rgba(250,245,235,0.92) 0%, rgba(250,245,235,0.55) 75%, transparent 100%)"
          };"
        ></div>

        <!-- Zona Superior Reservada (25% a 35%) para Tipografía del Cuento -->
        <div
          class="relative z-20 w-full flex items-center justify-center px-[6%] pt-[4%]"
          style="height: ${pageBlueprint.layoutReservePercent}%;"
        >
          <div id="pageTypographyBox" class="w-full text-center px-4 py-2.5 rounded-2xl backdrop-blur-[3px] border ${textBgClass} transition-all">
            <p
              id="pageStoryTextEl"
              class="font-story font-bold text-base sm:text-xl md:text-[22px] leading-snug tracking-tight"
              style="color: ${textColorHex};"
            >
              ${this._formatStoryTextWithGoldShimmer(interpolatedText)}
            </p>
            ${subtextHtml}
            ${
              pageBlueprint.pageNumber === 1
                ? `<span id="page1AgeBadge" class="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-rose-600 text-white shadow-sm">
                    ${
                      this.state.ageValue
                    } ${
                      this.state.ageUnit === "months"
                        ? this.t("ageUnitMonths")
                        : this.t("ageUnitYears")
                    } · ${isEn ? '8×8" Edition' : 'Edición 8×8"'}
                  </span>`
                : ""
            }
          </div>
        </div>

        <!-- Zona Inferior (65% a 75%): Composición Reactiva en Capas del Bebé y su Compañero -->
        <div class="relative z-20 flex-1 w-full flex items-end justify-center pb-[5%] px-[6%]">
          ${
            !showCharacters
              ? ""
              : aiRenderUrl
              ? (pageBlueprint.scenePose === "solo_pet_bell"
                  ? `<div class="mb-2 px-3.5 py-1.5 rounded-2xl bg-white/95 text-rose-700 font-story font-bold text-xs sm:text-sm shadow-lg border border-rose-200 animate-bounce">
                      🔊 “${this._escapeHtml(this.state.petSound)}!”
                    </div>`
                  : "")
              : this._renderSceneCharactersComposite(pageBlueprint)
          }
        </div>

        <!-- Folio inferior serif dentro del margen seguro (solo páginas 2..23) -->
        ${folioRowHtml}
      </div>
    `;
  }

  /**
   * Superpone de forma reactiva el avatar 3D/Foto del Bebé y de la Mascota
   * adaptados a la pose narrativa de cada página (1 a 7).
   */
  _renderSceneCharactersComposite(pageBlueprint) {
    const pose = pageBlueprint.scenePose;
    const isSleeping = pose === "sleeping_moon";
    const isSoloPet = pose === "solo_pet_bell";

    const babyVisualHtml = this._renderReactiveBabyCharacter(isSleeping, pose);
    const petVisualHtml = this._renderReactivePetCharacter(isSleeping, pose);

    if (isSoloPet) {
      // Página 3: Retrato focal de la mascota + burbuja de onomatopeya
      return `
        <div class="relative flex flex-col items-center justify-end">
          <div class="mb-2 px-3.5 py-1.5 rounded-2xl bg-white/95 text-rose-700 font-story font-bold text-xs sm:text-sm shadow-lg border border-rose-200 animate-bounce">
            🔊 “${this._escapeHtml(this.state.petSound)}!”
          </div>
          <div class="transform scale-110">
            ${petVisualHtml}
          </div>
        </div>
      `;
    }

    // Accesorios centrales interactivos según la página
    let centerPropHtml = "";
    if (pose === "reaching_ornament") {
      centerPropHtml = `
        <div class="mx-1 mb-8 flex flex-col items-center animate-pulse">
          <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-yellow-200 via-amber-400 to-amber-600 shadow-[0_0_28px_rgba(251,191,36,0.95)] border-2 border-white flex items-center justify-center text-lg">
            ✨
          </div>
        </div>
      `;
    } else if (pose === "peekaboo_box") {
      centerPropHtml = `
        <div class="mx-1 mb-2 flex flex-col items-center">
          <div class="text-amber-300 text-base animate-bounce">✨ ⭐ ✨</div>
          <div class="w-14 h-12 rounded-lg bg-gradient-to-b from-rose-600 to-rose-800 border-2 border-amber-300 shadow-lg flex items-center justify-center">
            <div class="w-3 h-full bg-amber-300"></div>
          </div>
        </div>
      `;
    } else if (pose === "hugging_star") {
      centerPropHtml = `
        <div class="-mx-2 mb-3 z-30 flex flex-col items-center">
          <div class="px-2.5 py-1 rounded-full bg-amber-400/95 text-slate-900 font-bold text-[10px] shadow border border-white">
            💛 ${this._escapeHtml(this._getGiftGiverLabel())}
          </div>
        </div>
      `;
    }

    return `
      <div class="flex items-end justify-center gap-2 sm:gap-4 w-full">
        <div class="relative z-20 transition-all duration-300">
          ${babyVisualHtml}
        </div>
        ${centerPropHtml}
        <div class="relative z-20 transition-all duration-300">
          ${petVisualHtml}
        </div>
      </div>
    `;
  }

  /**
   * Renderiza al bebé ya sea en Modo Foto (FileReader recortado con gorro navideño de terciopelo)
   * o en Modo Atributos (SVG 3D reactivo en capas que cambia piel, cabello, ojos y expresión).
   */
  _renderReactiveBabyCharacter(isSleeping = false) {
    const skinObj =
      BABY_TRAITS_CONFIG.skinTones.find((s) => s.id === this.state.babySkinTone) ||
      BABY_TRAITS_CONFIG.skinTones[0];
    const hairObj =
      BABY_TRAITS_CONFIG.hairStyles.find((h) => h.id === this.state.babyHairStyle) ||
      BABY_TRAITS_CONFIG.hairStyles[0];
    const eyeObj =
      BABY_TRAITS_CONFIG.eyeColors.find((e) => e.id === this.state.babyEyeColor) ||
      BABY_TRAITS_CONFIG.eyeColors[0];

    // MODO PREVISUALIZACIÓN / TEST CON SPRITE 3D CONSISTENTE (baby_test_render_1K.jpg)
    if (this.state.babyMode !== "photo" || !this.state.babyPhotoDataUrl) {
      return `
        <div class="relative flex flex-col items-center">
          <img
            src="${APP_CONFIG.babyTestSpritePath}"
            alt="${this._escapeHtml(this.state.childName)}"
            class="h-36 sm:h-44 w-auto object-contain drop-shadow-[0_12px_16px_rgba(28,18,12,0.42)] ${isSleeping ? "brightness-90" : ""}"
          />
        </div>
      `;
    }

    // MODO FOTO REAL SUBIDA POR EL USUARIO (ANTES DE RENDERIZAR EN BACKEND)
    if (this.state.babyMode === "photo" && this.state.babyPhotoDataUrl) {
      return `
        <div class="relative flex flex-col items-center w-28 sm:w-36">
          <!-- Gorrito de Santa de terciopelo superpuesto -->
          <svg viewBox="0 0 120 60" class="w-24 sm:w-28 -mb-5 z-20 drop-shadow-md">
            <path d="M20,50 C25,15 75,8 102,38 Z" fill="#E11D48" />
            <rect x="14" y="42" width="84" height="14" rx="7" fill="#FFFDF9" />
            <circle cx="104" cy="38" r="10" fill="#FFFDF9" />
          </svg>
          <!-- Rostro recortado y estilizado con marco suave dentro de la escena 3D navideña (Cameo Frame) -->
          <div class="baby-cameo-frame w-20 h-20 sm:w-24 sm:h-24 z-10">
            <img src="${this.state.babyPhotoDataUrl}" alt="${this._escapeHtml(this.state.childName)}" class="w-full h-full object-cover filter contrast-105" />
          </div>
          <!-- Pijama navideño marfil fijo del blueprint -->
          <div class="w-20 sm:w-24 h-11 -mt-2 rounded-t-2xl rounded-b-xl bg-[#FAF6EE] border-2 border-amber-200/80 shadow-md flex items-center justify-center">
            <span class="baby-name-badge px-2 py-0.5 rounded-full bg-rose-600/10 text-rose-800 font-story font-bold text-[10px]">
              ${this._escapeHtml(this.state.childName)}
            </span>
          </div>
        </div>
      `;
    }

    // MODO ATRIBUTOS 3D (SVG REACTIVO EN CAPAS)
    let hairSvgPath = "";
    if (hairObj.id === "wispy_curls") {
      hairSvgPath = `
        <path d="M32,46 Q45,28 60,36 Q75,28 88,46 Q78,36 60,39 Q42,36 32,46 Z" fill="${hairObj.hex}" />
        <circle cx="46" cy="38" r="6" fill="${hairObj.hex}" />
        <circle cx="60" cy="35" r="7" fill="${hairObj.hex}" />
        <circle cx="74" cy="38" r="6" fill="${hairObj.hex}" />
      `;
    } else if (hairObj.id === "straight_brown") {
      hairSvgPath = `
        <path d="M30,48 C34,30 86,30 90,48 L82,42 L70,46 L60,41 L50,46 L38,42 Z" fill="${hairObj.hex}" />
      `;
    } else if (hairObj.id === "blonde_tufts") {
      hairSvgPath = `
        <path d="M36,44 Q50,26 62,34 Q72,26 84,44 Z" fill="${hairObj.hex}" />
        <path d="M54,32 Q60,22 68,33" stroke="${hairObj.hex}" stroke-width="5" stroke-linecap="round" fill="none" />
      `;
    } else {
      // black_coils
      hairSvgPath = `
        <circle cx="38" cy="42" r="7" fill="${hairObj.hex}" />
        <circle cx="49" cy="37" r="8" fill="${hairObj.hex}" />
        <circle cx="61" cy="36" r="8" fill="${hairObj.hex}" />
        <circle cx="73" cy="37" r="8" fill="${hairObj.hex}" />
        <circle cx="82" cy="42" r="7" fill="${hairObj.hex}" />
      `;
    }

    const eyesSvg = isSleeping
      ? `
        <path d="M41,58 Q47,63 53,58" stroke="#3B2314" stroke-width="2.6" stroke-linecap="round" fill="none" />
        <path d="M67,58 Q73,63 79,58" stroke="#3B2314" stroke-width="2.6" stroke-linecap="round" fill="none" />
      `
      : `
        <circle cx="47" cy="57" r="6.5" fill="#FFFFFF" />
        <circle cx="47" cy="57" r="5" fill="${eyeObj.hex}" />
        <circle cx="47" cy="57" r="2.6" fill="#1E1916" />
        <circle cx="45" cy="55" r="1.6" fill="#FFFFFF" />

        <circle cx="73" cy="57" r="6.5" fill="#FFFFFF" />
        <circle cx="73" cy="57" r="5" fill="${eyeObj.hex}" />
        <circle cx="73" cy="57" r="2.6" fill="#1E1916" />
        <circle cx="71" cy="55" r="1.6" fill="#FFFFFF" />
      `;

    return `
      <div class="relative flex flex-col items-center w-28 sm:w-36 drop-shadow-[0_10px_14px_rgba(15,23,42,0.28)]">
        <svg viewBox="0 0 120 138" class="w-full h-auto overflow-visible">
          <defs>
            <radialGradient id="babyFaceGrad_${skinObj.id}" cx="45%" cy="38%" r="60%">
              <stop offset="0%" stop-color="${skinObj.hex}" />
              <stop offset="100%" stop-color="${skinObj.hex}" />
            </radialGradient>
          </defs>

          <!-- Pijama navideño marfil acanalado con piecitos -->
          <path d="M32,86 C32,76 88,76 88,86 L94,122 C94,129 84,132 76,132 L44,132 C36,132 26,129 26,122 Z" fill="#FAF6EE" stroke="#E5DEC9" stroke-width="2" />
          <circle cx="60" cy="98" r="2.2" fill="#D97706" />
          <circle cx="60" cy="109" r="2.2" fill="#D97706" />
          <ellipse cx="43" cy="131" rx="11" ry="6" fill="#F3EDE0" stroke="#E5DEC9" stroke-width="1.5" />
          <ellipse cx="77" cy="131" rx="11" ry="6" fill="#F3EDE0" stroke="#E5DEC9" stroke-width="1.5" />

          <!-- Manitas del bebé -->
          <circle cx="27" cy="103" r="6.5" fill="${skinObj.hex}" />
          <circle cx="93" cy="103" r="6.5" fill="${skinObj.hex}" />

          <!-- Orejitas y Rostro 3D redondeado -->
          <circle cx="29" cy="59" r="6.5" fill="${skinObj.hex}" />
          <circle cx="91" cy="59" r="6.5" fill="${skinObj.hex}" />
          <rect x="31" y="34" width="58" height="52" rx="26" fill="url(#babyFaceGrad_${skinObj.id})" />

          <!-- Mejillas sonrosadas -->
          <ellipse cx="39" cy="65" rx="5.5" ry="3.5" fill="${skinObj.cheekHex}" opacity="0.55" />
          <ellipse cx="81" cy="65" rx="5.5" ry="3.5" fill="${skinObj.cheekHex}" opacity="0.55" />

          <!-- Ojos expresivos o dormidos -->
          ${eyesSvg}

          <!-- Naricita y sonrisa tierna -->
          <ellipse cx="60" cy="63" rx="2.5" ry="1.8" fill="#000000" opacity="0.14" />
          <path d="M53,71 Q60,77 67,71" stroke="#7C2D12" stroke-width="2.2" stroke-linecap="round" fill="none" />

          <!-- Cabello seleccionado -->
          ${hairSvgPath}

          <!-- Gorrito navideño de terciopelo rojo con pompón blanco -->
          <path d="M27,36 C32,8 78,4 98,28 L88,36 Z" fill="#E11D48" />
          <rect x="24" y="29" width="72" height="11" rx="5.5" fill="#FFFDF9" />
          <circle cx="101" cy="27" r="8.5" fill="#FFFDF9" />
        </svg>
        <span class="-mt-2 px-2.5 py-0.5 rounded-full bg-white/90 text-slate-900 font-story font-bold text-[10px] shadow border border-amber-200">
          ${this._escapeHtml(this.state.childName)}
        </span>
      </div>
    `;
  }

  /**
   * Renderiza a la mascota según el nivel seleccionado:
   * - Opción A: Roxy oficial (`RoxyCharacter.jpg`)
   * - Opción B: Foto subida vía FileReader
   * - Opción C: Mascota 3D generada por atributos (Perro/Gato, Pelaje, Orejas)
   */
  _renderReactivePetCharacter(isSleeping = false) {
    // OPCIÓN A (POR DEFECTO): ROXY OFICIAL ORIGINAL (roxy_official_sprite.png)
    if (this.state.petTier === "tier_a_default") {
      return `
        <div class="relative flex flex-col items-center">
          <img
            src="./assets/sprites/roxy_official_sprite.png"
            alt="Roxy the Shih Tzu"
            class="h-28 sm:h-32 w-auto object-contain drop-shadow-[0_12px_16px_rgba(28,18,12,0.42)] ${isSleeping ? "brightness-90" : ""}"
          />
        </div>
      `;
    }

    // OPCIÓN B: MASCOTA DESDE FOTO SUBIDA
    if (this.state.petTier === "tier_b_photo" && this.state.petPhotoDataUrl) {
      return `
        <div class="relative flex flex-col items-center w-24 sm:w-32">
          <div class="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-rose-600 shadow-xl bg-amber-50">
            <img
              src="${this.state.petPhotoDataUrl}"
              alt="${this._escapeHtml(this.state.petName)}"
              class="w-full h-full object-cover"
            />
          </div>
          <span class="-mt-2 relative z-10 px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-story font-bold text-[10px] shadow">
            🎀 ${this._escapeHtml(this.state.petName)}
          </span>
        </div>
      `;
    }

    // OPCIÓN C (O OPCIÓN B SIN FOTO AÚN): MASCOTA 3D REACTIVA POR RASGOS
    const coatObj =
      PET_TRAITS_CONFIG.coatColors.find((c) => c.id === this.state.petCoatColor) ||
      PET_TRAITS_CONFIG.coatColors[0];
    const isCat = this.state.petSpecies === "cat";
    const earShape = this.state.petEarShape;

    let earsSvg = "";
    if (isCat || earShape === "perky") {
      earsSvg = `
        <polygon points="26,38 34,14 48,32" fill="${coatObj.hex}" />
        <polygon points="94,38 86,14 72,32" fill="${coatObj.hex}" />
      `;
    } else if (earShape === "rounded") {
      earsSvg = `
        <circle cx="32" cy="30" r="12" fill="${coatObj.hex}" />
        <circle cx="88" cy="30" r="12" fill="${coatObj.hex}" />
      `;
    } else {
      // floppy
      earsSvg = `
        <ellipse cx="25" cy="48" rx="9" ry="18" transform="rotate(14 25 48)" fill="${coatObj.hex}" />
        <ellipse cx="95" cy="48" rx="9" ry="18" transform="rotate(-14 95 48)" fill="${coatObj.hex}" />
      `;
    }

    const petEyesSvg = isSleeping
      ? `
        <path d="M42,48 Q47,52 52,48" stroke="#1E1916" stroke-width="2.4" fill="none" />
        <path d="M68,48 Q73,52 78,48" stroke="#1E1916" stroke-width="2.4" fill="none" />
      `
      : `
        <circle cx="47" cy="47" r="5.2" fill="#1E1916" />
        <circle cx="45.5" cy="45.5" r="1.6" fill="#FFFFFF" />
        <circle cx="73" cy="47" r="5.2" fill="#1E1916" />
        <circle cx="71.5" cy="45.5" r="1.6" fill="#FFFFFF" />
      `;

    return `
      <div class="relative flex flex-col items-center w-24 sm:w-32 drop-shadow-[0_10px_14px_rgba(15,23,42,0.28)]">
        <svg viewBox="0 0 120 120" class="w-full h-auto">
          <!-- Cuerpo y pecho blanco/secundario -->
          <ellipse cx="60" cy="88" rx="24" ry="22" fill="${coatObj.hex}" />
          <ellipse cx="60" cy="91" rx="15" ry="16" fill="${coatObj.secondaryHex}" />

          <!-- Patitas delanteras -->
          <ellipse cx="47" cy="107" rx="7" ry="5" fill="${coatObj.secondaryHex}" />
          <ellipse cx="73" cy="107" rx="7" ry="5" fill="${coatObj.secondaryHex}" />

          <!-- Orejas dinámicas -->
          ${earsSvg}

          <!-- Cabeza -->
          <circle cx="60" cy="48" r="24" fill="${coatObj.hex}" />
          <ellipse cx="60" cy="55" rx="14" ry="11" fill="${coatObj.secondaryHex}" />

          <!-- Ojos -->
          ${petEyesSvg}

          <!-- Hocico / Nariz -->
          <ellipse cx="60" cy="52" rx="4.5" ry="3.2" fill="${isCat ? "#F472B6" : "#1E1916"}" />
          <path d="M55,58 Q60,62 65,58" stroke="#1E1916" stroke-width="2" fill="none" />

          <!-- Collar navideño carmesí con cascabel dorado -->
          <rect x="42" y="68" width="36" height="6" rx="3" fill="#E11D48" />
          <circle cx="60" cy="73" r="4.5" fill="#F59E0B" />
        </svg>
        <span class="-mt-2 px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-story font-bold text-[10px] shadow">
          ${this._escapeHtml(this.state.petName)}
        </span>
      </div>
    `;
  }

  /**
   * Interpola las variables del niño, mascota, remitente, año y dedicatoria en los textos del cuento.
   */
  _getAgeAdaptivePageText(pageBlueprint) {
    const isEn = this.state.language === "en";
    const ageNum = parseInt(this.state.ageValue, 10) || 10;
    const isMonths = this.state.ageUnit === "months";

    if (pageBlueprint.ageVariants) {
      let stageKey = "7_12";
      if (isMonths && ageNum <= 6) stageKey = "0_6";
      else if (!isMonths || ageNum >= 13) stageKey = "13_24";
      const stageObj = pageBlueprint.ageVariants[stageKey];
      if (stageObj) {
        return isEn ? stageObj.en : stageObj.es;
      }
    }

    return isEn ? pageBlueprint.textTemplateEn : pageBlueprint.textTemplateEs;
  }

  _interpolateStoryTokens(templateStr) {
    const relObj = this._getCurrentRelationship();
    const isEn = this.state.language === "en";
    const giftGiverLabel = this._getGiftGiverLabel();
    const signatureText = isEn ? relObj.signatureEn : relObj.signatureEs;
    const ageNum = parseInt(this.state.ageValue, 10) || 10;
    const unitLabel =
      this.state.ageUnit === "months" ? this.t("ageUnitMonths") : this.t("ageUnitYears");
    const ageStamp = isEn
      ? ` (at ${ageNum} ${unitLabel})`
      : ` (a sus ${ageNum} ${unitLabel})`;

    return String(templateStr || "")
      .replace(/\{childName\}/g, this.state.childName || "Liam")
      .replace(/\{ageStamp\}/g, ageStamp)
      .replace(/\{petName\}/g, this.state.petName || "Roxy")
      .replace(/\{petSound\}/g, this.state.petSound || (isEn ? "Woof, woof" : "Guau, guau"))
      .replace(/\{giftGiverLabel\}/g, giftGiverLabel)
      .replace(/\{customYear\}/g, this.state.customYear || "2026")
      .replace(/\{dedicationText\}/g, this.state.dedicationText || "")
      .replace(/\{signatureText\}/g, signatureText);
  }

  /**
   * Construye el Prompt Ejecutable de IA de la página combinando:
   * - Master Style Lock Snippet (Layer 1)
   * - Baby Character Seed
   * - Pet Character Seed (Tier A / B / C)
   * - Page Blueprint Body + Negative Prompt Lock
   */
  _buildExecutablePrompt(pageBlueprint) {
    const skinObj =
      BABY_TRAITS_CONFIG.skinTones.find((s) => s.id === this.state.babySkinTone) ||
      BABY_TRAITS_CONFIG.skinTones[0];
    const hairObj =
      BABY_TRAITS_CONFIG.hairStyles.find((h) => h.id === this.state.babyHairStyle) ||
      BABY_TRAITS_CONFIG.hairStyles[0];
    const eyeObj =
      BABY_TRAITS_CONFIG.eyeColors.find((e) => e.id === this.state.babyEyeColor) ||
      BABY_TRAITS_CONFIG.eyeColors[0];

    const ageUnitToken = this.state.ageUnit === "months" ? "month-old baby" : "year-old child";
    const babySeed = `${this.state.childName}, adorable ${this.state.ageValue}-${ageUnitToken}, ${skinObj.promptToken} complexion, chubby rosy cheeks, large sparkling ${eyeObj.promptToken} eyes full of pure innocent wonder, ${hairObj.promptToken}, wearing plush cream-colored holiday footed pajamas and a tiny soft velvet Santa hat with a fluffy white pom-pom`;

    let petSeed = "";
    if (this.state.petTier === "tier_a_default") {
      petSeed = `Roxy, miniature Shih Tzu puppy, silky tricolor coat with warm golden-honey patches and pure snow-white chest and paws, head fur styled into a neat fountain ponytail with a ruby-red velvet ribbon bow, large dark round expressive eyes, short button snout, joyful and gentle protective posture`;
    } else if (this.state.petTier === "tier_b_photo") {
      petSeed = `${this.state.petName}, custom stylized 3D ${this.state.petSpecies} matching uploaded reference photo [${this.state.petPhotoName || "custom_pet_ref"}], wearing a festive holiday ribbon collar, rendered in soft friendly 3D proportions`;
    } else {
      const coatObj =
        PET_TRAITS_CONFIG.coatColors.find((c) => c.id === this.state.petCoatColor) ||
        PET_TRAITS_CONFIG.coatColors[0];
      const earObj =
        PET_TRAITS_CONFIG.earShapes.find((e) => e.id === this.state.petEarShape) ||
        PET_TRAITS_CONFIG.earShapes[0];
      petSeed = `${this.state.petName}, stylized 3D ${this.state.petBreed.replace(/_/g, " ")} (${this.state.petSpecies}), featuring ${coatObj.promptToken}, ${earObj.promptToken}, expressive warm eyes, wearing a small crimson festive collar, sweet and cuddly companion pose`;
    }

    const bodyInterpolated = pageBlueprint.promptBody
      .replace(/\{babySeed\}/g, babySeed)
      .replace(/\{petSeed\}/g, petSeed);

    return `${APP_CONFIG.masterStyleLock} ${bodyInterpolated} --ar 1:1 ${APP_CONFIG.negativePromptLock}`;
  }

  /* ==========================================================================
     6. DESCARGA / GENERACIÓN DE PDF EDITORIAL 8×8" (REPORTLAB 300 DPI + FALLBACK)
     ========================================================================== */
  async _triggerFileDownload(url, filename) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      return true;
    } catch (err) {
      console.warn("[RoxyTales PDF] Direct blob download fallback:", err);
      window.open(url, "_blank", "noopener");
      return true;
    }
  }

  async _requestBackendPdfGeneration(isSampleDraft = true) {
    const isEn = this.state.language === "en";
    const relObj = this._getCurrentRelationship();
    const senderSignature = isEn ? relObj.signatureEn : relObj.signatureEs;
    const ageUnitLabel =
      this.state.ageUnit === "months" ? this.t("ageUnitMonths") : this.t("ageUnitYears");
    const ageLabel = `${this.state.ageValue} ${ageUnitLabel}`;

    // Map rendered pages to relative backend paths (zero GenAI re-calls)
    const renderedPagesMap = {};
    Object.entries(this.state.renderedPages || {}).forEach(([pageNum, url]) => {
      if (url) renderedPagesMap[parseInt(pageNum, 10)] = String(url);
    });

    const customPageTextsMap = {};
    PAGES_BLUEPRINT.forEach((bp) => {
      if (bp.pageNumber >= 1 && bp.pageNumber <= 23) {
        const { titleText, subtext } = this._getPageTextParts(bp);
        customPageTextsMap[bp.pageNumber] = subtext ? `${titleText}\n${subtext}` : titleText;
      }
    });

    const payload = {
      profile_id: this.state.profileId || "anonymous",
      edition: this.state.selectedProductTier || "hardcover",
      trim_preset: "8x8_in",
      language: this.state.language || "es",
      child_name: this.state.childName || "Liam",
      age_label: ageLabel,
      pet_name: this.state.petName || "Roxy",
      pet_sound: this.state.petSound || (isEn ? "Woof, woof" : "Guau, guau"),
      dedication_text: this.state.dedicationText || "",
      sender_signature: senderSignature,
      custom_year: this.state.customYear || "2026",
      is_sample: Boolean(isSampleDraft && !this.state.orderCompleted),
      include_crop_marks: true,
      order_ref: (!isSampleDraft || this.state.orderCompleted) ? (this.state.lastOrderRef || null) : null,
      rendered_pages: renderedPagesMap,
      custom_page_texts: customPageTextsMap,
    };

    const res = await fetch(`${this.getApiBaseUrl()}/api/book/generate-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`PDF dispatch failed (${res.status})`);
    const startData = await res.json();
    const jobId = startData.job_id;

    // Poll asynchronous ReportLab PDF job (max 45s)
    const startTime = Date.now();
    while (Date.now() - startTime < 45000) {
      await new Promise((r) => setTimeout(r, 550));
      const pollRes = await fetch(`${this.getApiBaseUrl()}/api/book/pdf-jobs/${jobId}`);
      if (!pollRes.ok) continue;
      const job = await pollRes.json();

      if (job.status === "completed" && job.interior_pdf_url) {
        const base = this.getApiBaseUrl();
        const interiorUrl = job.interior_pdf_url.startsWith("http")
          ? job.interior_pdf_url
          : `${base}${job.interior_pdf_url}`;
        const coverUrl = job.cover_pdf_url
          ? (job.cover_pdf_url.startsWith("http") ? job.cover_pdf_url : `${base}${job.cover_pdf_url}`)
          : null;
        this.state.lastGeneratedPdfs = {
          interiorUrl,
          coverUrl,
          prepressReport: job.prepress_report || null,
        };
        return this.state.lastGeneratedPdfs;
      }
      if (job.status === "failed") {
        throw new Error(job.error_message || "ReportLab PDF generation failed");
      }
    }
    throw new Error("PDF generation timed out");
  }

  async handleDownloadPdfBook(isSampleDraft = true) {
    const isEn = this.state.language === "en";

    // Momento correcto #1: Si la vista previa IA aún se está generando, evitar descarga prematura
    if (this.state.isRenderingPreview) {
      this.showToast(
        isEn
          ? "Please wait a moment while we finish illustrating your 3D cover..."
          : "Espera un momento mientras terminamos de ilustrar tu portada 3D...",
        "info"
      );
      return;
    }

    // Momento correcto #2: Si falta el Lead Gate, solicitarlo y recordar la descarga pendiente
    if (isSampleDraft && !this.state.leadUnlocked) {
      if (!this._isValidBuyerLead()) {
        this._pendingSamplePdfDownload = true;
        this.triggerLeadGateAlertAndModal(true);
        return;
      }
      this.state.leadUnlocked = true;
      this._renderLeadGateBanner();
    }

    if (this._isGeneratingPdf) {
      return;
    }

    // Momento correcto #3: Si subió foto del bebé pero aún no generó su portada 3D, generarla primero
    const isHealthy = await this._checkBackendHealth();
    if (isHealthy && this.state.babyPhotoDataUrl && !this.state.renderedPages?.[1]) {
      await this.handleGenerateMagicPreview();
    }

    // Motor Editorial ReportLab (300 DPI + 3 mm bleed + lomo paramétrico)
    if (isHealthy) {
      this._isGeneratingPdf = true;
      const pdfButtons = [
        document.getElementById("downloadSamplePdfBtn"),
        document.getElementById("postRevealSamplePdfBtn"),
        document.getElementById("downloadFinalCleanPdfBtn"),
      ].filter(Boolean);
      pdfButtons.forEach((b) => (b.disabled = true));

      this.showToast(
        isEn
          ? "Composing 8×8\" 300 DPI ReportLab PDF (3mm bleed)..."
          : "Ensamblando tu PDF editorial 8×8\" a 300 DPI con sangrado de 3 mm...",
        "info"
      );

      try {
        const result = await this._requestBackendPdfGeneration(isSampleDraft);
        const safeChild = (this.state.childName || "RoxyTales").replace(/[^a-zA-Z0-9_-]/g, "");
        const suffix = isSampleDraft && !this.state.orderCompleted ? "Borrador" : "Edicion_300DPI";
        await this._triggerFileDownload(
          result.interiorUrl,
          `RoxyTales_${safeChild}_${suffix}_8x8.pdf`
        );
        if (isSampleDraft) {
          odooService.create_crm_lead(this.state, "free_sample_pdf", true);
        }
        if (result.prepressReport?.odoo_vault_sync) {
          this._renderOrderTrackingCard(result.prepressReport.odoo_vault_sync);
        }

        this.showToast(
          isEn
            ? "✅ 8×8\" Print-Ready PDF downloaded! (24 pages + 3mm bleed)"
            : "✅ ¡PDF editorial 8×8\" descargado! (24 páginas con sangrado de 3 mm)",
          "success"
        );
        return;
      } catch (err) {
        console.warn("[RoxyTales PDF] ReportLab backend error, falling back to browser print:", err);
      } finally {
        this._isGeneratingPdf = false;
        pdfButtons.forEach((b) => (b.disabled = false));
      }
    }

    // Fallback seguro de navegador si el backend local no está en ejecución
    const printContainer = document.getElementById("printableBookContainer");
    if (!printContainer) return;

    const showWatermark = isSampleDraft && !this.state.orderCompleted;
    const watermarkLabel = isEn
      ? "COMPLIMENTARY DIGITAL PREVIEW · ROXYTALES"
      : "MUESTRA DIGITAL DE CORTESÍA · ROXYTALES";

    printContainer.innerHTML = PAGES_BLUEPRINT.map((page) => {
      return `
        <div class="print-sheet-8x8">
          ${
            showWatermark
              ? `<div class="print-watermark-sample">${watermarkLabel}</div>`
              : ""
          }
          ${this._buildSinglePageHtml(page, true)}
        </div>
      `;
    }).join("");

    this.showToast(
      isEn
        ? "Preparing 8×8\" 24-page PDF layout for print/save..."
        : "Preparando maqueta 8×8\" de 24 páginas para guardar como PDF...",
      "info"
    );

    setTimeout(() => {
      window.print();
    }, 250);
  }

  /* ==========================================================================
     7. PASO 5: PRECIOS, CUPONES Y MODAL DE CHECKOUT SIMULADO DE STRIPE
     ========================================================================== */
  _renderProductTiersAndSummary() {
    const pricing = adminService.getPricing();

    // Actualiza precios en las 3 tarjetas de variantes
    const setPriceText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = `$${Number(val).toFixed(2)} USD`;
    };

    setPriceText("tierCardPrice_digital", pricing.digital);
    setPriceText("tierCardPrice_softcover", pricing.softcover);
    setPriceText("tierCardPrice_hardcover", pricing.hardcover);

    // Resalta la variante activa
    document.querySelectorAll("[data-product-tier]").forEach((card) => {
      const active = card.getAttribute("data-product-tier") === this.state.selectedProductTier;
      card.classList.toggle("border-rose-600", active);
      card.classList.toggle("bg-rose-50/40", active);
      card.classList.toggle("ring-2", active);
      card.classList.toggle("ring-rose-500/20", active);
      card.classList.toggle("border-slate-200", !active);
    });

    // Calcula el desglose matemático en vivo
    const isUsPilot = this.state.shippingCountry === "US";
    document.querySelectorAll("[data-product-tier]").forEach((card) => {
      const tid = card.getAttribute("data-product-tier");
      const disabled = !isUsPilot && tid !== "digital";
      if (disabled) {
        card.classList.add("tier-disabled-pilot");
        card.setAttribute("aria-disabled", "true");
      } else {
        card.classList.remove("tier-disabled-pilot");
        card.removeAttribute("aria-disabled");
      }
    });

    const pilotNotice = document.getElementById("pilotCountryNotice");
    if (pilotNotice) {
      pilotNotice.classList.toggle("hidden", isUsPilot);
      const noticeText = document.getElementById("pilotCountryNoticeText");
      if (noticeText && !isUsPilot) {
        const selectEl = document.getElementById("summaryCountrySelect");
        const selectedOption = selectEl?.options[selectEl.selectedIndex];
        const countryLabel = selectedOption ? selectedOption.text.replace(/^[^\w\s]+\s*/, "").trim() : this.state.shippingCountry;
        noticeText.textContent = this.t("pilotCountryNotice", { country: countryLabel });
      }
    }

    const breakdown = adminService.calculateOrderBreakdown({
      tierId: this.state.selectedProductTier,
      petTierId: this.state.petTier,
      couponCode: this.state.appliedCouponCode,
      countryCode: this.state.shippingCountry,
      quantity: this.state.quantity
    });

    const summaryQtyEl = document.getElementById("orderQuantityVal");
    if (summaryQtyEl) summaryQtyEl.textContent = String(breakdown.quantity);

    const qtyDec = document.getElementById("qtyDecreaseBtn");
    const qtyInc = document.getElementById("qtyIncreaseBtn");
    if (qtyDec) qtyDec.disabled = breakdown.isDigital || breakdown.quantity <= 1;
    if (qtyInc) qtyInc.disabled = breakdown.isDigital || breakdown.quantity >= 20;

    const qtyLockedNote = document.getElementById("qtyDigitalLockedNote");
    if (qtyLockedNote) qtyLockedNote.classList.toggle("hidden", !breakdown.isDigital);

    document.querySelectorAll("[data-qty-preset]").forEach((btn) => {
      const presetVal = Number(btn.getAttribute("data-qty-preset")) || 1;
      const isActive = !breakdown.isDigital && (presetVal === 4 ? breakdown.quantity >= 4 : breakdown.quantity === presetVal);
      btn.classList.toggle("active", isActive);
      btn.disabled = breakdown.isDigital;
    });

    const volRow = document.getElementById("summaryVolumeDiscountRow");
    const volLabel = document.getElementById("summaryVolumeDiscountLabel");
    const volVal = document.getElementById("summaryVolumeDiscountVal");
    if (volRow && volLabel && volVal) {
      if (breakdown.volumeDiscountAmount > 0) {
        volRow.classList.remove("hidden");
        volLabel.textContent = this.t("summaryVolumeDiscountLabel", { percent: breakdown.volumeDiscountPercent });
        volVal.textContent = `-$${breakdown.volumeDiscountAmount.toFixed(2)} USD`;
      } else {
        volRow.classList.add("hidden");
      }
    }

    const summaryBaseEl = document.getElementById("summaryBasePriceVal");
    if (summaryBaseEl) {
      summaryBaseEl.textContent =
        breakdown.quantity > 1
          ? `$${breakdown.lineSubtotal.toFixed(2)} USD (${breakdown.quantity} × $${breakdown.basePrice.toFixed(2)})`
          : `$${breakdown.lineSubtotal.toFixed(2)} USD`;
    }
    setPriceText("summaryPetUpsellVal", breakdown.petUpsellPrice);

    const discountRow = document.getElementById("summaryDiscountRow");
    const discountVal = document.getElementById("summaryDiscountVal");
    if (discountRow && discountVal) {
      if (breakdown.discountAmount > 0) {
        discountRow.classList.remove("hidden");
        discountVal.textContent = `-$${breakdown.discountAmount.toFixed(2)} USD (${breakdown.discountCode})`;
      } else {
        discountRow.classList.add("hidden");
      }
    }

    const shipLabel = document.getElementById("summaryShippingLabel");
    const shipVal = document.getElementById("summaryShippingVal");
    if (shipLabel) {
      shipLabel.textContent = this.t("summaryShipping", {
        country: this.state.shippingCountry
      });
    }
    if (shipVal) {
      shipVal.textContent =
        breakdown.shippingFee === 0
          ? this.t("summaryShippingFree")
          : `$${breakdown.shippingFee.toFixed(2)} USD`;
    }

    setPriceText("summaryTotalVal", breakdown.totalAmount);

    // Actualiza dinámicamente el precio en el botón principal de checkout (CRO uxpeak)
    const openCheckoutBtn = document.getElementById("openCheckoutModalBtn");
    if (openCheckoutBtn) {
      const isEn = this.state.language === "en";
      openCheckoutBtn.innerHTML = `💳 ${isEn ? "Proceed to Secure Checkout" : "Proceder al Pago Seguro"} · $${breakdown.totalAmount.toFixed(2)} USD`;
    }

    // Actualiza dinámicamente el botón y texto de la barra flotante inferior
    const stickyBtn = document.getElementById("stickyBarCtaBtn");
    if (stickyBtn) {
      const isEn = this.state.language === "en";
      stickyBtn.innerHTML = `💳 ${isEn ? "Checkout Now" : "Finalizar Compra"} · $${breakdown.totalAmount.toFixed(2)} USD`;
    }

    const stickyTitle = document.getElementById("stickyBarDynamicTitle");
    if (stickyTitle) {
      const isEn = this.state.language === "en";
      const tierName =
        this.state.selectedProductTier === "hardcover"
          ? isEn
            ? "Hardcover"
            : "Tapa Dura"
          : this.state.selectedProductTier === "softcover"
          ? isEn
            ? "Softcover"
            : "Tapa Blanda"
          : "Digital";
      stickyTitle.textContent = `${this.state.childName || "Liam"} & ${this.state.petName || "Roxy"} · ${tierName}`;
    }
  }

  _handleApplyCoupon() {
    const input = document.getElementById("couponCodeInput");
    const feedbackEl = document.getElementById("couponFeedbackMsg");
    const rawCode = String(input?.value || "").trim().toUpperCase();

    if (!rawCode) {
      this.state.appliedCouponCode = "";
      this._renderProductTiersAndSummary();
      return;
    }

    const subtotal =
      adminService.getTierBasePrice(this.state.selectedProductTier) +
      adminService.getPetUpsellPrice(this.state.petTier);

    const res = adminService.validateAndCalculateCoupon(rawCode, subtotal);
    if (res.valid) {
      this.state.appliedCouponCode = res.code;
      if (feedbackEl) {
        feedbackEl.className = "mt-2 text-xs font-semibold text-emerald-700";
        feedbackEl.textContent = this.t("couponSuccessMsg", {
          code: res.code,
          discount: `$${res.discountAmount.toFixed(2)} USD`
        });
        feedbackEl.classList.remove("hidden");
      }
      this.showToast(
        this.t("couponSuccessMsg", {
          code: res.code,
          discount: `$${res.discountAmount.toFixed(2)} USD`
        }),
        "success"
      );
    } else {
      this.state.appliedCouponCode = "";
      if (feedbackEl) {
        feedbackEl.className = "mt-2 text-xs font-semibold text-rose-600";
        feedbackEl.textContent = this.t("couponInvalidMsg");
        feedbackEl.classList.remove("hidden");
      }
      this.showToast(this.t("couponInvalidMsg"), "error");
    }

    this._renderProductTiersAndSummary();
    this._updateCheckoutModalBreakdown();
  }

  openCheckoutModal() {
    if (!this.state.babyPhotoDataUrl) {
      const isEn = this.state.language === "en";
      this.showToast(
        isEn
          ? "📸 Please upload your baby's photo first to personalize your storybook."
          : "📸 Sube primero la fotografía de tu bebé para personalizar tu cuento.",
        "error"
      );
      const step2Card = document.getElementById("wizardStep2Card");
      if (step2Card) {
        step2Card.scrollIntoView({ behavior: "smooth", block: "center" });
        step2Card.classList.add("ring-2", "ring-[#991B1B]");
        setTimeout(() => step2Card.classList.remove("ring-2", "ring-[#991B1B]"), 1400);
      }
      return;
    }

    if (!this._isValidBuyerLead()) {
      this.triggerLeadGateAlertAndModal(false);
      return;
    }

    const modal = document.getElementById("stripeCheckoutModal");
    const formView = document.getElementById("checkoutFormView");
    const successView = document.getElementById("checkoutSuccessView");
    if (!modal) return;

    if (formView) formView.classList.remove("hidden");
    if (successView) successView.classList.add("hidden");

    this._updateCheckoutModalBreakdown();
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  async _updateCheckoutModalBreakdown() {
    const breakdown = adminService.calculateOrderBreakdown({
      tierId: this.state.selectedProductTier,
      petTierId: this.state.petTier,
      couponCode: this.state.appliedCouponCode,
      countryCode: this.state.shippingCountry,
      quantity: this.state.quantity
    });

    const setEl = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setEl("checkoutChildAndPetLabel", `${this.state.childName} & ${this.state.petName}`);
    setEl("checkoutQuantityVal", String(breakdown.quantity));

    const shipWrapper = document.getElementById("checkoutShippingFieldsWrapper");
    const digNotice = document.getElementById("checkoutDigitalDeliveryNotice");
    if (shipWrapper) shipWrapper.classList.toggle("hidden", breakdown.isDigital);
    if (digNotice) digNotice.classList.toggle("hidden", !breakdown.isDigital);
    ["checkoutStreetInput", "checkoutCityInput", "checkoutStateInput", "checkoutPostalInput"].forEach((id) => {
      const inp = document.getElementById(id);
      if (inp) inp.required = !breakdown.isDigital;
    });

    const cQtyDec = document.getElementById("checkoutQtyDecreaseBtn");
    const cQtyInc = document.getElementById("checkoutQtyIncreaseBtn");
    if (cQtyDec) cQtyDec.disabled = breakdown.isDigital || breakdown.quantity <= 1;
    if (cQtyInc) cQtyInc.disabled = breakdown.isDigital || breakdown.quantity >= 20;

    const cVolRow = document.getElementById("checkoutVolumeDiscountRow");
    const cVolLabel = document.getElementById("checkoutVolumeDiscountLabel");
    const cVolVal = document.getElementById("checkoutVolumeDiscountVal");
    if (cVolRow && cVolLabel && cVolVal) {
      if (breakdown.volumeDiscountAmount > 0) {
        cVolRow.classList.remove("hidden");
        cVolLabel.textContent = this.t("summaryVolumeDiscountLabel", { percent: breakdown.volumeDiscountPercent });
        cVolVal.textContent = `-$${breakdown.volumeDiscountAmount.toFixed(2)} USD`;
      } else {
        cVolRow.classList.add("hidden");
      }
    }
    setEl(
      "checkoutBasePrice",
      breakdown.quantity > 1
        ? `$${breakdown.lineSubtotal.toFixed(2)} USD (${breakdown.quantity} × $${breakdown.basePrice.toFixed(2)})`
        : `$${breakdown.lineSubtotal.toFixed(2)} USD`
    );
    setEl("checkoutPetUpsellPrice", `+$${breakdown.petUpsellPrice.toFixed(2)} USD`);
    setEl(
      "checkoutDiscountAmount",
      breakdown.discountAmount > 0
        ? `-$${breakdown.discountAmount.toFixed(2)} USD (${breakdown.discountCode})`
        : "$0.00 USD"
    );
    setEl(
      "checkoutShippingFee",
      breakdown.shippingFee === 0
        ? this.t("summaryShippingFree")
        : `$${breakdown.shippingFee.toFixed(2)} USD`
    );
    setEl("checkoutTotalAmount", `$${breakdown.totalAmount.toFixed(2)} USD`);

    const gelatoBadge = document.getElementById("checkoutGelatoHubBadge");
    if (gelatoBadge) {
      gelatoBadge.textContent = this.t("gelatoSyncBadge", {
        hub: breakdown.shippingQuote.hub,
        days: breakdown.shippingQuote.transitDays
      });
    }

    const payBtn = document.getElementById("confirmStripePayBtn");
    if (payBtn) {
      payBtn.textContent = this.t("payNowBtn", {
        total: `$${breakdown.totalAmount.toFixed(2)}`
      });
    }
  }

  /* ==========================================================================
     8. CATÁLOGO SECUNDARIO "COMING SOON" Y MODAL DE WAITLIST
     ========================================================================== */
  _renderSecondaryCatalog() {
    const grid = document.getElementById("secondaryCatalogGrid");
    if (!grid) return;

    const isEn = this.state.language === "en";
    const comingSoonItems = COLLECTIONS_CATALOG.filter((c) => c.isComingSoon);

    grid.innerHTML = comingSoonItems
      .map((item) => {
        const title = (isEn ? item.titleEn : item.titleEs).replace(
          /\[Nombre\]|\[Name\]/g,
          this.state.childName || "Liam"
        );
        const desc = isEn ? item.descriptionEn : item.descriptionEs;
        const badge = isEn ? item.categoryBadgeEn : item.categoryBadgeEs;
        const ageRange = isEn ? item.ageRangeLabelEn : item.ageRangeLabelEs;
        const unitBadge =
          item.ageUnit === "years"
            ? isEn
              ? "Age calculated in YEARS"
              : "Edad calculada en AÑOS"
            : isEn
              ? "Age calculated in MONTHS"
              : "Edad calculada en MESES";

        return `
          <article
            class="coming-soon-card rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between overflow-hidden"
          >
            <!-- Cabecera visual con superposición translúcida (glassmorphism) -->
            <div
              class="relative h-44 p-5 flex flex-col justify-between overflow-hidden"
              style="background: linear-gradient(135deg, ${item.accentColor}18 0%, ${item.accentColor}38 100%);"
            >
              <div class="flex items-center justify-between gap-2 z-10">
                <span class="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-900/85 text-white backdrop-blur-xs">
                  ${this._escapeHtml(badge)}
                </span>
                <span class="glass-overlay-badge px-3 py-1 rounded-full text-[11px] font-extrabold text-rose-700 shadow-xs">
                  ⏳ ${this.t("comingSoonBadge")}
                </span>
              </div>

              <!-- Ilustración silueta de Roxy con desenfoque suave -->
              <div class="my-auto flex items-center justify-center relative">
                <img
                  src="${APP_CONFIG.roxyCharacterPath}"
                  alt="Roxy Preview"
                  class="w-24 h-24 rounded-2xl object-contain bg-white/95 p-1.5 shadow-md border-2 border-white"
                />
                <span class="glass-overlay-badge absolute -bottom-2 px-3 py-0.5 rounded-full text-[10px] font-bold text-slate-800">
                  ${this._escapeHtml(ageRange)} · ${unitBadge}
                </span>
              </div>
            </div>

            <!-- Cuerpo de la tarjeta -->
            <div class="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 class="font-story font-bold text-lg text-slate-900 leading-snug">
                  ${this._escapeHtml(title)}
                </h3>
                <p class="mt-2 text-xs text-slate-600 leading-relaxed">
                  ${this._escapeHtml(desc)}
                </p>
              </div>

              <div class="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  data-waitlist-open="${item.id}"
                  class="touch-target flex-1 px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-xs"
                >
                  ${this.t("waitlistCtaBtn")}
                </button>
                ${
                  !item.isSpecialFormat
                    ? `<button
                        type="button"
                        data-try-collection="${item.id}"
                        class="touch-target px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition"
                      >
                        ${this.t("tryAgeInStudioBtn")}
                      </button>`
                    : ""
                }
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    // Eventos de las tarjetas Coming Soon
    grid.querySelectorAll("[data-waitlist-open]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const prodId = btn.getAttribute("data-waitlist-open");
        this.openWaitlistModal(prodId);
      });
    });

    grid.querySelectorAll("[data-try-collection]").forEach((btn) => {
      btn.addEventListener("click", () => {
        btn.textContent = this.t("comingSoonBtnText");
        btn.disabled = true;
        btn.classList.remove("bg-slate-100", "hover:bg-slate-200", "text-slate-800");
        btn.classList.add("bg-amber-50", "text-amber-800", "border", "border-amber-200", "cursor-default", "opacity-90");
      });
    });
  }

  openWaitlistModal(productId) {
    const item = COLLECTIONS_CATALOG.find((c) => c.id === productId);
    if (!item) return;

    this.state.activeWaitlistProduct = item;
    const isEn = this.state.language === "en";
    const title = (isEn ? item.titleEn : item.titleEs).replace(
      /\[Nombre\]|\[Name\]/g,
      this.state.childName || "Liam"
    );

    const modal = document.getElementById("waitlistModal");
    const prodTitleEl = document.getElementById("waitlistModalProductTitle");
    const formBox = document.getElementById("waitlistFormContainer");
    const successBox = document.getElementById("waitlistSuccessContainer");
    const emailInput = document.getElementById("waitlistEmailInput");

    if (prodTitleEl) prodTitleEl.textContent = title;
    if (formBox) formBox.classList.remove("hidden");
    if (successBox) successBox.classList.add("hidden");
    if (emailInput && this.state.buyerEmail) {
      emailInput.value = this.state.buyerEmail;
    }

    if (modal) {
      modal.classList.remove("hidden");
      document.body.style.overflow = "hidden";
    }
  }

  _closeModalById(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("hidden");
    const anyOpen = ["leadGateModal", "waitlistModal", "stripeCheckoutModal", "adminPanelModal"].some((id) => {
      const el = document.getElementById(id);
      return el && !el.classList.contains("hidden");
    });
    if (!anyOpen) {
      document.body.style.overflow = "";
    }
  }

  /* ==========================================================================
     9. EVENTOS DE MODALES (LEAD GATE, WAITLIST Y STRIPE CHECKOUT)
     ========================================================================== */
  _bindModalEvents() {
    // Cerrar modales con atributo [data-close-modal]
    document.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const modalId = btn.getAttribute("data-close-modal");
        this._closeModalById(modalId);
      });
    });

    // Cerrar al hacer clic en el fondo oscuro del modal o presionar Escape
    ["leadGateModal", "waitlistModal", "stripeCheckoutModal"].forEach((modalId) => {
      const modalEl = document.getElementById(modalId);
      if (modalEl) {
        modalEl.addEventListener("click", (e) => {
          if (e.target === modalEl) {
            this._closeModalById(modalId);
          }
        });
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        ["leadGateModal", "waitlistModal", "stripeCheckoutModal"].forEach((modalId) => {
          const el = document.getElementById(modalId);
          if (el && !el.classList.contains("hidden")) {
            this._closeModalById(modalId);
          }
        });
      }
    });

    // Submit Modal de Lead Gate
    const leadGateForm = document.getElementById("leadGateModalForm");
    if (leadGateForm) {
      leadGateForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nameVal = String(document.getElementById("modalLeadNameInput")?.value || "").trim();
        const emailVal = String(document.getElementById("modalLeadEmailInput")?.value || "").trim();

        this.state.buyerName = nameVal;
        this.state.buyerEmail = emailVal;

        const step1Name = document.getElementById("buyerNameInput");
        const step1Email = document.getElementById("buyerEmailInput");
        if (step1Name) step1Name.value = nameVal;
        if (step1Email) step1Email.value = emailVal;

        if (!this._isValidBuyerLead()) {
          this.showToast(this.t("step1ValidationAlert"), "error");
          return;
        }

        this.state.leadUnlocked = true;
        document.getElementById("leadGateModal")?.classList.add("hidden");
        const alertMsg = document.getElementById("step1ValidationAlertBox");
        if (alertMsg) alertMsg.classList.add("hidden");

        this._renderLeadGateBanner();
        await this.handleGenerateMagicPreview();
        if (this._pendingSamplePdfDownload) {
          this._pendingSamplePdfDownload = false;
          await this.handleDownloadPdfBook(true);
        }
      });
    }

    // Submit Modal de Waitlist ("Coming soon")
    const waitlistForm = document.getElementById("waitlistModalForm");
    if (waitlistForm) {
      waitlistForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = String(document.getElementById("waitlistEmailInput")?.value || "").trim();
        const name = String(document.getElementById("waitlistNameInput")?.value || "").trim();
        const prod = this.state.activeWaitlistProduct;
        if (!email || !prod) return;

        const isEn = this.state.language === "en";
        const prodTitle = (isEn ? prod.titleEn : prod.titleEs).replace(
          /\[Nombre\]|\[Name\]/g,
          this.state.childName || "Liam"
        );

        await odooService.register_waitlist_lead({
          email,
          name,
          productId: prod.id,
          productTitle: prodTitle,
          discountPercent: 10,
          language: this.state.language
        });

        document.getElementById("waitlistFormContainer")?.classList.add("hidden");
        document.getElementById("waitlistSuccessContainer")?.classList.remove("hidden");

        // Aplica automáticamente el cupón WAITLIST10 al estudio
        this.state.appliedCouponCode = "WAITLIST10";
        const couponInput = document.getElementById("couponCodeInput");
        if (couponInput) couponInput.value = "WAITLIST10";
        this._renderProductTiersAndSummary();

        this.showToast(
          isEn
            ? "Added to priority waitlist! 10% coupon WAITLIST10 applied."
            : "¡Registrado en la lista de espera! Cupón 10% WAITLIST10 aplicado.",
          "success"
        );
      });
    }

    // Cambio de país en Checkout -> Recalcula tarifa de envío con Gelato POD en vivo
    const shippingCountrySelect = document.getElementById("checkoutCountrySelect");
    if (shippingCountrySelect) {
      shippingCountrySelect.addEventListener("change", async (e) => {
        this.handleCountryChange(e.target.value);
        await odooService.calculate_gelato_shipping(
          this.state.shippingCountry,
          this.state.selectedProductTier
        );
        this._renderProductTiersAndSummary();
        this._updateCheckoutModalBreakdown();
      });
    }

    // Submit Pago Simulado en Stripe Checkout
    const stripeForm = document.getElementById("stripeCheckoutForm");
    if (stripeForm) {
      stripeForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payBtn = document.getElementById("confirmStripePayBtn");
        if (payBtn) {
          payBtn.disabled = true;
          payBtn.textContent =
            this.state.language === "en"
              ? "Confirming secure order & editorial binding..."
              : "Confirmando pedido y encuadernación artesanal...";
        }

        const shippingAddress = {
          street: document.getElementById("checkoutStreetInput")?.value || "742 Evergreen Terrace",
          city: document.getElementById("checkoutCityInput")?.value || "Miami",
          state: document.getElementById("checkoutStateInput")?.value || "FL",
          country_code:
            document.getElementById("checkoutCountrySelect")?.value || this.state.shippingCountry,
          postal_code: document.getElementById("checkoutPostalInput")?.value || "33101"
        };

        if (!this.state.pendingOrderRef) {
          this.state.pendingOrderRef = `RT-ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString().slice(-4)}`;
        }
        const { payload, remoteOrder } = await odooService.create_sale_order(this.state, shippingAddress);
        this.state.lastOrderRef = remoteOrder?.order_ref || payload.idempotency_key;
        this.state.pendingOrderRef = null;
        this.state.orderCompleted = true;
        this.state.leadUnlocked = true;

        if (payBtn) {
          payBtn.disabled = false;
        }

        document.getElementById("checkoutFormView")?.classList.add("hidden");
        document.getElementById("checkoutSuccessView")?.classList.remove("hidden");

        this._renderOrderTrackingCard({
          order_ref: this.state.lastOrderRef,
          state: remoteOrder?.state || "confirmed_local",
          payment_verified: true,
          portal_url: remoteOrder?.portal_url || "",
          attachments: remoteOrder?.attachments || []
        });

        const payloadPreviewEl = document.getElementById("checkoutSuccessPayloadPreview");
        if (payloadPreviewEl) {
          payloadPreviewEl.textContent = JSON.stringify(payload, null, 2);
        }

        this._renderLeadGateBanner();
        this._renderBookViewer();
        this.showToast(this.t("orderSuccessTitle"), "success");
        // Dispara renderizado de producción + bóveda PDF segura de la orden confirmada
        this._triggerBackgroundBatchRender([1, 3, 5, 7], "final");
        this._syncConfirmedOrderPdfVault();
      });
    }

    const refreshTrackingBtn = document.getElementById("refreshOrderTrackingBtn");
    if (refreshTrackingBtn) {
      refreshTrackingBtn.addEventListener("click", async () => {
        if (!this.state.lastOrderRef) return;
        refreshTrackingBtn.disabled = true;
        try {
          const liveStatus = await odooService.fetchOrderStatus(this.state.lastOrderRef);
          this._renderOrderTrackingCard(liveStatus);
        } catch (err) {
          console.warn("[RoxyTales Tracking] Could not refresh live order status:", err.message);
        } finally {
          refreshTrackingBtn.disabled = false;
        }
      });
    }

    // Botones post-compra: Descargar libro limpio (sin marca de agua) y abrir Visor Odoo en Admin
    const cleanPdfBtn = document.getElementById("downloadFinalCleanPdfBtn");
    if (cleanPdfBtn) {
      cleanPdfBtn.addEventListener("click", () => {
        this.handleDownloadPdfBook(false);
      });
    }

    const inspectOdooBtn = document.getElementById("inspectOdooPayloadFromCheckoutBtn");
    if (inspectOdooBtn) {
      inspectOdooBtn.addEventListener("click", () => {
        document.getElementById("stripeCheckoutModal")?.classList.add("hidden");
        this.adminController.payloadViewMode = "stored";
        this.adminController.toggleAdminMode(true, "payload");
      });
    }
  }

  /* ==========================================================================
     10. UTILIDADES INTERNAS Y SEGUIMIENTO DEL TESORO
     ========================================================================== */
  _renderOrderTrackingCard(info = {}) {
    const card = document.getElementById("checkoutOrderTrackingCard");
    if (!card) return;
    card.classList.remove("hidden");
    const refEl = document.getElementById("checkoutTrackingRef");
    const badgeEl = document.getElementById("checkoutTrackingStatusBadge");
    const vaultEl = document.getElementById("checkoutTrackingVaultStatus");
    const portalLink = document.getElementById("checkoutTrackingPortalLink");

    if (refEl) {
      refEl.textContent = info.order_ref || info.order_name || this.state.lastOrderRef || "RT-ORD";
    }
    if (badgeEl) {
      const isEn = this.state.language === "en";
      const stateMapEs = {
        sale: "✅ Compra Comprobada (Modo Prueba)",
        done: "✅ Pedido Completado",
        draft: "Registrado (Modo Prueba)",
        confirmed_local: "✅ Compra Comprobada (Modo Prueba)"
      };
      const stateMapEn = {
        sale: "✅ Purchase Verified (Test Mode)",
        done: "✅ Order Completed",
        draft: "Recorded (Test Mode)",
        confirmed_local: "✅ Purchase Verified (Test Mode)"
      };
      const map = isEn ? stateMapEn : stateMapEs;
      badgeEl.textContent = map[info.state] || (isEn ? "✅ Purchase Verified (Test Mode)" : "✅ Compra Comprobada (Modo Prueba)");
    }
    if (vaultEl) {
      const isEn = this.state.language === "en";
      const attCount = Array.isArray(info.attachments) ? info.attachments.length : (info.attachment_id ? 1 : 0);
      vaultEl.textContent = attCount > 0
        ? (isEn
            ? "✅ Payment verified in test mode · 24-page collector PDF ready for download."
            : "✅ Compra comprobada en modo prueba · Edición digital de 24 páginas archivada y lista para descarga.")
        : (isEn
            ? "⏳ Purchase verified · Preparing your 24-page high-resolution edition..."
            : "⏳ Compra comprobada · Generando y archivando tu edición digital de colección en alta resolución...");
    }
    if (portalLink) {
      if (info.portal_url) {
        portalLink.href = info.portal_url;
        portalLink.classList.remove("hidden");
      } else {
        portalLink.classList.add("hidden");
      }
    }
  }

  async _syncConfirmedOrderPdfVault() {
    if (!this.state.lastOrderRef) return;
    try {
      const healthy = await this._checkBackendHealth();
      if (!healthy) return;
      const res = await this._requestBackendPdfGeneration(false);
      if (res?.prepressReport?.odoo_vault_sync) {
        this._renderOrderTrackingCard(res.prepressReport.odoo_vault_sync);
      } else if (res?.interiorUrl) {
        const vault = await odooService.attachPdfToOrder(
          this.state.lastOrderRef,
          res.interiorUrl.replace(this.getApiBaseUrl(), ""),
          this.state.childName || "Libro"
        );
        this._renderOrderTrackingCard(vault);
      }
    } catch (err) {
      console.warn("[RoxyTales Vault] Background PDF archive notice:", err.message);
    }
  }

  scrollToOrActivateStep(stepNum) {
    this.state.activeStep = stepNum;
    const card = document.getElementById(`wizardStep${stepNum}Card`);
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "start" });
      card.classList.remove("ring-4", "ring-[#991B1B]/15");
      void card.offsetWidth;
      card.classList.add("ring-4", "ring-[#991B1B]/15");
      setTimeout(() => card.classList.remove("ring-4", "ring-[#991B1B]/15"), 1500);
    }
    // Sincroniza clases visuales de la barra de pasos
    document.querySelectorAll("[data-wizard-step-btn]").forEach((btn) => {
      const num = parseInt(btn.getAttribute("data-wizard-step-btn"), 10);
      const isActive = num === stepNum;
      btn.classList.toggle("bg-[#1A1715]", isActive);
      btn.classList.toggle("text-white", isActive);
      btn.classList.toggle("shadow-xs", isActive);
      btn.classList.toggle("bg-[#FAF8F5]", !isActive && num === 1);
      btn.classList.toggle("text-[#1A1715]", !isActive && num === 1);
      btn.classList.toggle("text-[#615A52]", !isActive && num !== 1);
    });
  }

  _getCurrentRelationship() {
    return (
      GIFT_GIVER_OPTIONS.find((r) => r.id === this.state.relationshipId) ||
      GIFT_GIVER_OPTIONS[0]
    );
  }

  _getGiftGiverLabel() {
    if (this.state.relationshipId === "custom" && (this.state.customRelationshipText || "").trim()) {
      return this.state.customRelationshipText.trim();
    }
    const relObj = this._getCurrentRelationship();
    return this.state.language === "en" ? relObj.page6LabelEn : relObj.page6LabelEs;
  }

  _getCurrentCollection() {
    return (
      COLLECTIONS_CATALOG.find((c) => c.id === this.state.collectionId) ||
      COLLECTIONS_CATALOG[0]
    );
  }

  showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const colors = {
      success: "bg-emerald-900 text-white border-emerald-600",
      error: "bg-rose-900 text-white border-rose-500",
      info: "bg-slate-900 text-white border-amber-500"
    };

    const toast = document.createElement("div");
    toast.className = `px-4 py-3 rounded-xl shadow-xl border-l-4 text-xs sm:text-sm font-semibold flex items-center gap-2.5 transition-all duration-300 ${
      colors[type] || colors.info
    }`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
      setTimeout(() => toast.remove(), 300);
    }, 3400);
  }

  _escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.roxyTalesApp = new RoxyTalesApp();
  window.roxyTalesApp.init();
});


document.addEventListener("DOMContentLoaded", () => {
  window.roxyTalesApp = new RoxyTalesApp();
  window.roxyTalesApp.init();
});

})();
