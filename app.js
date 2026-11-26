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

import {
  APP_CONFIG,
  DEFAULT_PRICING_CONFIG,
  GIFT_GIVER_OPTIONS,
  BABY_TRAITS_CONFIG,
  PET_TRAITS_CONFIG,
  COLLECTIONS_CATALOG,
  PAGES_BLUEPRINT,
  I18N_DICTIONARY
} from "./config.js";
import { adminService } from "./adminService.js";
import { odooService } from "./odooService.js";
import { AdminController } from "./admin.js";

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

  async _normalizeMobileImageFile(file) {
    // Resize & compress large phone photos (e.g. 8–15 MB portrait/HEIC) to <= 1600px JPEG cleanly
    const targetMaxDim = 1600;
    const drawToJpeg = (source, width, height) => {
      const scale = Math.min(1, targetMaxDim / Math.max(width || 1, height || 1));
      const w = Math.max(1, Math.round(width * scale));
      const h = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(source, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            const safeBase = (file.name || "photo").replace(/\.[^.]+$/, "");
            const normalizedFile = blob
              ? new File([blob], `${safeBase}.jpg`, { type: "image/jpeg" })
              : file;
            resolve({ dataUrl, file: normalizedFile, fileName: `${safeBase}.jpg` });
          },
          "image/jpeg",
          0.88
        );
      });
    };

    if (typeof createImageBitmap === "function") {
      try {
        const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
        const out = await drawToJpeg(bitmap, bitmap.width, bitmap.height);
        if (typeof bitmap.close === "function") bitmap.close();
        return out;
      } catch (_) {
        // Fallback to HTMLImageElement below
      }
    }

    const objUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Image decode failed"));
        el.src = objUrl;
      });
      return await drawToJpeg(img, img.naturalWidth || img.width, img.naturalHeight || img.height);
    } finally {
      URL.revokeObjectURL(objUrl);
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

    const setDropzoneBusy = (busy) => {
      if (!dropzone) return;
      dropzone.classList.toggle("opacity-60", busy);
    };

    const processFile = async (file) => {
      if (!file) return;
      const lowerName = String(file.name || "").toLowerCase();
      const mime = String(file.type || "").toLowerCase();
      const hasImageExt = /\.(jpe?g|png|webp|heic|heif|bmp|gif)$/i.test(lowerName);
      const isImageMime = mime.startsWith("image/") || mime === "";
      if (!isImageMime && !hasImageExt) {
        this.showToast(
          this.state.language === "en"
            ? "Unsupported format. Please choose an image from your gallery."
            : "Formato no válido. Elige una imagen de tu galería.",
          "error"
        );
        return;
      }

      const maxRawBytes = APP_CONFIG.maxPhotoSizeBytes || 25 * 1024 * 1024;
      if (file.size > maxRawBytes) {
        this.showToast(
          this.state.language === "en"
            ? "Photo exceeds 25 MB limit. Please pick a smaller image."
            : "La foto supera el límite máximo de 25 MB.",
          "error"
        );
        return;
      }

      setDropzoneBusy(true);
      try {
        const normalized = await this._normalizeMobileImageFile(file);
        onLoadSuccess(normalized.dataUrl, normalized.fileName, normalized.file);
      } catch (normErr) {
        // Fallback directly via FileReader if image is standard JPG/PNG/WEBP under 12 MB
        const readerSafe = /\.(jpe?g|png|webp)$/i.test(lowerName) || ["image/jpeg", "image/png", "image/webp"].includes(mime);
        if (readerSafe && file.size <= 12 * 1024 * 1024) {
          const reader = new FileReader();
          reader.onload = (ev) => onLoadSuccess(ev.target.result, file.name || "photo.jpg", file);
          reader.onerror = () => {
            this.showToast(
              this.state.language === "en"
                ? "Could not read this photo. Try taking a screenshot or choosing a JPG/PNG."
                : "No se pudo leer esta foto. Intenta con otra imagen JPG/PNG de tu galería.",
              "error"
            );
          };
          reader.readAsDataURL(file);
        } else {
          console.warn("[RoxyTales Upload] Mobile decode error:", normErr);
          this.showToast(
            this.state.language === "en"
              ? "Format not supported directly by this browser. Try JPG, PNG, or screenshot."
              : "Este formato HEIC no pudo procesarse en tu navegador. Intenta guardarla como JPG o captura de pantalla.",
            "error"
          );
        }
      } finally {
        setDropzoneBusy(false);
        if (fileInput) {
          try {
            fileInput.value = "";
          } catch (_) {}
        }
      }
    };

    if (dropzone && fileInput) {
      dropzone.addEventListener("click", (e) => {
        if (e.target !== fileInput) {
          fileInput.click();
        }
      });
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
    // Ensure uploaded baby & pet photos are persisted on backend before generating any PDF
    if (!this.state.profileId && (this.state.babyPhotoDataUrl || this.state.petPhotoDataUrl)) {
      await this._uploadPhotosToBackend();
    }

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
        // Genera y archiva automáticamente el PDF editorial 24p con los personajes reales
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
    toast.className = `pointer-events-auto px-4 py-3 rounded-xl shadow-xl border-l-4 text-xs sm:text-sm font-semibold flex items-center gap-2.5 transition-all duration-300 ${
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
