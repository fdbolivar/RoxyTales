/**
 * @file odooService.js
 * @description Capa de sincronización con el backend FastAPI (/api/odoo/*) y respaldo local.
 * - Nunca almacena ni expone credenciales ni URLs internas de Odoo en el navegador.
 * - Identifica visitantes anónimos con `visitor_id` local sin crear registros remotos sin correo.
 * - Sincroniza leads, lista de espera, pedidos independientes por libro y estado inverso.
 */

import {
  APP_CONFIG,
  DEFAULT_PRICING_CONFIG,
  GIFT_GIVER_OPTIONS
} from "./config.js";
import { adminService } from "./adminService.js";

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

export const odooService = new OdooService();
