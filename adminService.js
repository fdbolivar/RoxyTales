/**
 * @file adminService.js
 * @description Servicio centralizado de estado administrativo para RoxyTales:
 * gestiona reglas de precios base del catálogo, tarifas de referencia de envío Gelato,
 * cupones promocionales dinámicos y sincronización reactiva con la tienda.
 */

import {
  APP_CONFIG,
  DEFAULT_PRICING_CONFIG,
  DEFAULT_COUPONS,
  GELATO_SHIPPING_MATRIX
} from "./config.js";

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

export const adminService = new AdminService();
