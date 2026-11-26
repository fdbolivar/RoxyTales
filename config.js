/**
 * @file config.js
 * @description Configuración maestra, constantes de impresión Gelato 8x8",
 * semillas de prompts (Master Style Lock), reglas de precios/envíos,
 * diccionario bilingüe (ES/EN) y estructura de las 8 páginas de RoxyTales.
 */

export const STORY_ASSETS_REGISTRY = {
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

export const APP_CONFIG = {
  brandName: "RoxyTales",
  activeStorySlug: "my_first_christmas_24p",
  imprintSealPath: "./PublishingImprint/PublishingImprint.jpg",
  roxyCharacterPath: STORY_ASSETS_REGISTRY.my_first_christmas_24p.roxyOfficialSprite,
  babyTestSpritePath: STORY_ASSETS_REGISTRY.my_first_christmas_24p.babyTestSprite,
  roxySheetPath: "./RoxyCharacterSheet.jpg",
  defaultLanguage: "es",
  defaultCurrency: "USD",
  maxChildNameLength: 18,
  maxPhotoSizeBytes: 25 * 1024 * 1024, // 25 MB raw mobile photo before client-side auto-compression
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
export const DEFAULT_PRICING_CONFIG = {
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
export const GELATO_SHIPPING_MATRIX = {
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
export const DEFAULT_COUPONS = [
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
export const GIFT_GIVER_OPTIONS = [
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
export const BABY_TRAITS_CONFIG = {
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
export const PET_TRAITS_CONFIG = {
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
export const COLLECTIONS_CATALOG = [
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
export const PAGES_BLUEPRINT = [
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
export const I18N_DICTIONARY = {
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
    babyPhotoDropBoxText: "Toca o arrastra la foto aquí",
    petPhotoDropBoxText: "Toca o arrastra la foto aquí",
    photoDropHintShort: "Foto de tu galería (JPG, PNG, WEBP, HEIC · optimización automática)",
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
    babyPhotoDropBoxText: "Tap or drag photo here",
    petPhotoDropBoxText: "Tap or drag photo here",
    photoDropHintShort: "Gallery photo (JPG, PNG, WEBP, HEIC · auto-optimized)",
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
