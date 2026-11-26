/**
 * @file admin.js
 * @description Controlador del Panel de Administración (Admin Mode / Role Switcher) para RoxyTales.
 * Permite configurar en tiempo real cupones de descuento, precios de venta del catálogo,
 * tarifas de referencia de Gelato POD, auditoría de leads en localStorage y visualización
 * del payload JSON de integración para Odoo ERP.
 */

import { adminService } from "./adminService.js";
import { odooService } from "./odooService.js";
import { GELATO_SHIPPING_MATRIX } from "./config.js";

export class AdminController {
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
