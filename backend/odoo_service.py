"""
Business logic layer for bidirectional RoxyTales <-> Odoo 20 Enterprise sync.
Enforces strict separation between buyer (`res.partner`) and book protagonist,
anonymous-visitor filtering, idempotent CRM updates, independent `sale.order` per book,
secure PDF vault uploads (`ir.attachment` + `documents.document`), and reverse portal/order queries.
"""

import base64
import json
import logging
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from backend.config import (
    BASE_DIR,
    ODOO_ENV,
    ODOO_TEST_PREFIX,
    ODOO_URL,
    PDFS_DIR,
)
from backend.db import get_odoo_idempotency, save_odoo_idempotency
from backend.odoo_client import OdooAPIError, OdooJSON2Client, odoo_client
from backend.setup_odoo_sandbox import (
    ensure_crm_tags,
    ensure_documents_folder,
    ensure_mail_template,
    ensure_products,
)

logger = logging.getLogger("roxytales.odoo_service")

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

TIER_TO_SKU = {
    "digital": "ROXY-DIG-8X8",
    "softcover": "ROXY-SOFT-8X8",
    "hardcover": "ROXY-HARD-8X8",
}

TIER_BASE_PRICES = {
    "digital": 9.99,
    "softcover": 34.99,
    "hardcover": 39.99,
}

COUPON_CATALOG = {
    "NAVIDAD20": ("percent", 20.0),
    "WAITLIST10": ("percent", 10.0),
    "ROXY5USD": ("fixed", 5.0),
}


def normalize_email(email: Optional[str]) -> str:
    return str(email or "").strip().lower()


def is_valid_email(email: Optional[str]) -> bool:
    return bool(_EMAIL_RE.match(normalize_email(email)))


def compute_volume_discount_pct(tier: str, quantity: int) -> float:
    if tier == "digital":
        return 0.0
    if quantity >= 4:
        return 20.0
    if quantity == 3:
        return 15.0
    if quantity == 2:
        return 10.0
    return 0.0


def _sandbox_prefix(label: str) -> str:
    if ODOO_ENV == "sandbox" and ODOO_TEST_PREFIX and not label.startswith(ODOO_TEST_PREFIX):
        return f"{ODOO_TEST_PREFIX} {label}"
    return label


class OdooIntegrationService:
    """High-level orchestrator between RoxyTales FastAPI and Odoo 20 Enterprise."""

    def __init__(self, client: Optional[OdooJSON2Client] = None):
        self.client = client or odoo_client
        self._product_cache: Dict[str, int] = {}
        self._tag_cache: Dict[str, int] = {}
        self._country_cache: Dict[str, int] = {}
        self._folder_id: Optional[int] = None
        self._mail_template_id: Optional[int] = None

    def _get_product_id(self, sku: str) -> int:
        if sku not in self._product_cache:
            self._product_cache = ensure_products(self.client)
        if sku not in self._product_cache:
            raise OdooAPIError(f"Product SKU {sku} could not be resolved in Odoo")
        return self._product_cache[sku]

    def _get_tag_ids(self, names: List[str]) -> List[int]:
        if not self._tag_cache:
            self._tag_cache = ensure_crm_tags(self.client)
        missing = [n for n in names if n not in self._tag_cache]
        if missing:
            for name in missing:
                existing = self.client.search_read("crm.tag", [["name", "=", name]], ["id"], limit=1)
                self._tag_cache[name] = int(existing[0]["id"]) if existing else self.client.create("crm.tag", {"name": name})
        return [self._tag_cache[n] for n in names if n in self._tag_cache]

    def _get_country_id(self, country_code: Optional[str]) -> Optional[int]:
        code = str(country_code or "").strip().upper()
        if not code:
            return None
        if code not in self._country_cache:
            rows = self.client.search_read("res.country", [["code", "=", code]], ["id", "code"], limit=1)
            if rows:
                self._country_cache[code] = int(rows[0]["id"])
        return self._country_cache.get(code)

    def _get_documents_folder_id(self) -> Optional[int]:
        if self._folder_id is None:
            self._folder_id = ensure_documents_folder(self.client)
        return self._folder_id

    def _get_mail_template_id(self) -> Optional[int]:
        if self._mail_template_id is None:
            self._mail_template_id = ensure_mail_template(self.client)
        return self._mail_template_id

    def ensure_partner(
        self,
        email: str,
        name: str = "",
        country_code: Optional[str] = None,
        shipping_address: Optional[Dict[str, Any]] = None,
    ) -> Tuple[int, bool]:
        """Finds an existing `res.partner` by normalized email or creates one. Returns `(partner_id, created)`."""
        norm_email = normalize_email(email)
        if not is_valid_email(norm_email):
            raise ValueError(f"Invalid email address: {email!r}")

        candidates = self.client.search_read(
            "res.partner",
            domain=[["email", "=", norm_email]],
            fields=["id", "name", "email", "is_company", "user_ids", "street", "city", "zip", "country_id"],
            order="id asc",
        )
        # Prefer active portal/user contact (`is_company=False` + linked `user_ids`), then any individual contact
        existing_row = None
        if candidates:
            ranked = sorted(
                candidates,
                key=lambda r: (
                    1 if (not r.get("is_company") and r.get("user_ids")) else 0,
                    1 if not r.get("is_company") else 0,
                    -int(r["id"]),
                ),
                reverse=True,
            )
            existing_row = ranked[0]
        existing = [existing_row] if existing_row else []
        country_id = self._get_country_id(
            (shipping_address or {}).get("country_code")
            or (shipping_address or {}).get("country")
            or country_code
        )

        if existing:
            partner_id = int(existing[0]["id"])
            updates: Dict[str, Any] = {}
            if shipping_address:
                if shipping_address.get("street") and not existing[0].get("street"):
                    updates["street"] = str(shipping_address["street"])
                if shipping_address.get("city") and not existing[0].get("city"):
                    updates["city"] = str(shipping_address["city"])
                if (shipping_address.get("postal_code") or shipping_address.get("zip")) and not existing[0].get("zip"):
                    updates["zip"] = str(shipping_address.get("postal_code") or shipping_address.get("zip"))
            if country_id and not existing[0].get("country_id"):
                updates["country_id"] = country_id
            if updates:
                self.client.write("res.partner", [partner_id], updates)
            return partner_id, False

        vals: Dict[str, Any] = {
            "name": (name or norm_email.split("@")[0]).strip(),
            "email": norm_email,
            "customer_rank": 1,
        }
        if shipping_address:
            if shipping_address.get("street"):
                vals["street"] = str(shipping_address["street"])
            if shipping_address.get("city"):
                vals["city"] = str(shipping_address["city"])
            if shipping_address.get("postal_code") or shipping_address.get("zip"):
                vals["zip"] = str(shipping_address.get("postal_code") or shipping_address.get("zip"))
        if country_id:
            vals["country_id"] = country_id

        partner_id = self.client.create("res.partner", vals)
        return partner_id, True

    def _find_open_lead(self, partner_id: int) -> Optional[Dict[str, Any]]:
        won_stages = self.client.search_read("crm.stage", [["is_won", "=", True]], ["id"])
        won_ids = {int(s["id"]) for s in won_stages}
        leads = self.client.search_read(
            "crm.lead",
            domain=[["partner_id", "=", partner_id], ["active", "=", True]],
            fields=["id", "name", "stage_id", "description", "tag_ids"],
            order="id desc",
            limit=10,
        )
        for ld in leads:
            st_val = ld.get("stage_id")
            st_id = int(st_val[0]) if isinstance(st_val, list) and st_val else None
            if st_id not in won_ids:
                return ld
        return None

    def sync_lead_event(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handles Rules 1, 2 & 3:
        - Anonymous without valid email -> `local_only`, zero Odoo writes.
        - First-time visitor with email -> single `res.partner` + `crm.lead`.
        - Returning visitor -> reuse `res.partner`, update open `crm.lead` cleanly.
        """
        raw_email = payload.get("email") or payload.get("buyer_email")
        if not is_valid_email(raw_email):
            return {
                "status": "local_only",
                "synced_to_odoo": False,
                "visitor_id": payload.get("visitor_id") or "",
                "reason": "anonymous_visitor_no_email",
            }

        idem_key = str(payload.get("idempotency_key") or "").strip()
        if idem_key:
            cached = get_odoo_idempotency(f"lead:{idem_key}")
            if cached:
                return json.loads(cached["response_json"])

        norm_email = normalize_email(raw_email)
        buyer_name = str(payload.get("name") or payload.get("buyer_name") or "").strip()
        country = str(payload.get("country") or "US").strip().upper()
        event_type = str(payload.get("event_type") or "lead_captured").strip()
        child_name = str(payload.get("child_name") or "Liam").strip()
        pet_name = str(payload.get("pet_name") or "Roxy").strip()
        collection_id = str(payload.get("collection_id") or "my_first_christmas_24p").strip()
        age_value = payload.get("age_value", 10)
        age_unit = str(payload.get("age_unit") or "months").strip()
        tier = str(payload.get("tier") or "hardcover").strip()

        partner_id, partner_created = self.ensure_partner(
            email=norm_email,
            name=buyer_name,
            country_code=country,
        )

        tag_names = ["RoxyTales"]
        if event_type in ("preview_generated", "lead_captured"):
            tag_names.append("Digital Preview")
        elif event_type == "free_sample_pdf":
            tag_names.append("Free Sample PDF")
        elif event_type == "international_print_pilot_lead":
            tag_names.append("International Pilot")
        elif event_type == "waitlist_entry":
            tag_names.append("Waitlist WAITLIST10")
        tag_ids = self._get_tag_ids(tag_names)

        note_html = (
            f"<p><strong>Evento RoxyTales ({event_type})</strong><br/>"
            f"Protagonista: {child_name} ({age_value} {age_unit}) &amp; {pet_name}<br/>"
            f"Colección: {collection_id} · Formato: {tier} · País: {country}</p>"
        )

        open_lead = self._find_open_lead(partner_id)
        if open_lead:
            lead_id = int(open_lead["id"])
            prev_desc = str(open_lead.get("description") or "")
            self.client.write(
                "crm.lead",
                [lead_id],
                {
                    "tag_ids": [(4, tid) for tid in tag_ids],
                    "description": f"{note_html}{prev_desc}",
                    "name": _sandbox_prefix(f"RoxyTales: {child_name} & {pet_name} ({norm_email})"),
                },
            )
            lead_action = "updated"
        else:
            lead_vals: Dict[str, Any] = {
                "name": _sandbox_prefix(f"RoxyTales: {child_name} & {pet_name} ({norm_email})"),
                "type": "opportunity",
                "partner_id": partner_id,
                "email_from": norm_email,
                "description": note_html,
                "tag_ids": [(6, 0, tag_ids)],
            }
            country_id = self._get_country_id(country)
            if country_id:
                lead_vals["country_id"] = country_id
            lead_id = self.client.create("crm.lead", lead_vals)
            lead_action = "created"

        result = {
            "status": "synced",
            "synced_to_odoo": True,
            "partner_id": partner_id,
            "partner_created": partner_created,
            "lead_id": lead_id,
            "lead_action": lead_action,
            "event_type": event_type,
            "email": norm_email,
        }
        if idem_key:
            save_odoo_idempotency(f"lead:{idem_key}", "crm.lead", lead_id, json.dumps(result))
        return result

    def sync_waitlist(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Registers or updates a waitlist entry (`WAITLIST10`) in Odoo CRM."""
        email = payload.get("email")
        if not is_valid_email(email):
            raise ValueError("A valid email is required for waitlist registration.")
        merged = {
            **payload,
            "event_type": "waitlist_entry",
            "collection_id": payload.get("product_id") or payload.get("collection_id") or "coming_soon",
            "child_name": payload.get("child_name") or payload.get("product_title") or "Colección Próximamente",
        }
        res = self.sync_lead_event(merged)
        res["assigned_coupon_code"] = "WAITLIST10"
        res["discount_percent"] = int(payload.get("discount_percent", 10))
        return res

    def create_sale_order(self, payload: Dict[str, Any], confirm_immediately: bool = True) -> Dict[str, Any]:
        """
        Rule 4: Reuses buyer `res.partner` by email, creates an independent `sale.order`
        for each personalized book (never overwriting previous orders/PDFs),
        applies volume discount + coupon + shipping, and confirms if requested.
        """
        idempotency_key = str(payload.get("idempotency_key") or "").strip()
        if not idempotency_key:
            raise ValueError("idempotency_key is required for sale.order creation")

        cached = get_odoo_idempotency(f"order:{idempotency_key}")
        if cached:
            return json.loads(cached["response_json"])

        # Check Odoo directly too (handles multi-worker or local DB wipe)
        existing_orders = self.client.search_read(
            "sale.order",
            domain=[["client_order_ref", "=", idempotency_key]],
            fields=["id", "name", "partner_id", "state", "amount_total", "access_url", "access_token"],
            limit=1,
        )
        if existing_orders:
            eo = existing_orders[0]
            portal_path = self.client.call("sale.order", "get_portal_url", {"ids": [int(eo["id"])]})
            res = {
                "status": "existing_idempotent",
                "order_id": int(eo["id"]),
                "order_name": eo["name"],
                "order_ref": idempotency_key,
                "partner_id": int(eo["partner_id"][0]) if isinstance(eo.get("partner_id"), list) else None,
                "state": eo["state"],
                "amount_total": float(eo.get("amount_total") or 0.0),
                "portal_url": f"{ODOO_URL}{portal_path}" if portal_path else "",
            }
            save_odoo_idempotency(f"order:{idempotency_key}", "sale.order", res["order_id"], json.dumps(res))
            return res

        buyer = payload.get("buyer") or {}
        protagonist = payload.get("protagonist") or {}
        order_cfg = payload.get("order") or {}

        buyer_email = normalize_email(buyer.get("email"))
        if not is_valid_email(buyer_email):
            raise ValueError("buyer.email must be a valid email address")

        shipping_address = order_cfg.get("shipping_address") or {}
        partner_id, partner_created = self.ensure_partner(
            email=buyer_email,
            name=str(buyer.get("name") or "").strip(),
            country_code=buyer.get("country") or shipping_address.get("country"),
            shipping_address=shipping_address,
        )

        tier = str(order_cfg.get("tier") or "hardcover").strip().lower()
        if tier not in TIER_TO_SKU:
            tier = "hardcover"
        sku = TIER_TO_SKU[tier]
        qty = 1 if tier == "digital" else max(1, int(order_cfg.get("quantity") or 1))
        unit_price = float(order_cfg.get("unit_price") or TIER_BASE_PRICES[tier])
        vol_disc_pct = (
            float(order_cfg["volume_discount_pct"])
            if order_cfg.get("volume_discount_pct") is not None
            else compute_volume_discount_pct(tier, qty)
        )

        subtotal_after_vol = round(unit_price * qty * (1.0 - vol_disc_pct / 100.0), 2)
        coupon_code = str(order_cfg.get("coupon_code") or "").strip().upper()
        coupon_discount_amount = 0.0
        if order_cfg.get("coupon_discount_amount") is not None:
            coupon_discount_amount = max(0.0, float(order_cfg["coupon_discount_amount"]))
        elif coupon_code in COUPON_CATALOG:
            ctype, cval = COUPON_CATALOG[coupon_code]
            coupon_discount_amount = (
                round(subtotal_after_vol * (cval / 100.0), 2)
                if ctype == "percent"
                else round(min(subtotal_after_vol, cval), 2)
            )

        shipping_fee = 0.0 if tier == "digital" else max(0.0, float(order_cfg.get("shipping_fee") or 0.0))

        child_name = str(protagonist.get("child_name") or "Liam").strip()
        pet_name = str(protagonist.get("pet_name") or "Roxy").strip()
        collection_id = str(protagonist.get("collection_id") or "my_first_christmas_24p").strip()

        book_product_id = self._get_product_id(sku)
        order_lines: List[Tuple[int, int, Dict[str, Any]]] = [
            (
                0,
                0,
                {
                    "product_id": book_product_id,
                    "name": f"RoxyTales {tier.title()} 8x8\" — {child_name} & {pet_name} ({collection_id})",
                    "product_uom_qty": qty,
                    "price_unit": unit_price,
                    "discount": vol_disc_pct,
                },
            )
        ]

        if coupon_discount_amount > 0:
            coupon_product_id = self._get_product_id("ROXY-COUPON-8X8")
            order_lines.append(
                (
                    0,
                    0,
                    {
                        "product_id": coupon_product_id,
                        "name": f"Cupón Promocional {coupon_code or 'ROXY'}",
                        "product_uom_qty": 1,
                        "price_unit": -coupon_discount_amount,
                    },
                )
            )

        if shipping_fee > 0:
            ship_product_id = self._get_product_id("ROXY-SHIP-8X8")
            dest_country = str(shipping_address.get("country") or buyer.get("country") or "US").upper()
            order_lines.append(
                (
                    0,
                    0,
                    {
                        "product_id": ship_product_id,
                        "name": f"Envío Impresión Editorial ({dest_country})",
                        "product_uom_qty": 1,
                        "price_unit": shipping_fee,
                    },
                )
            )

        dossier = {
            "idempotency_key": idempotency_key,
            "protagonist": protagonist,
            "tier": tier,
            "quantity": qty,
            "volume_discount_pct": vol_disc_pct,
            "coupon_code": coupon_code or "NONE",
            "coupon_discount_amount": coupon_discount_amount,
            "shipping_fee": shipping_fee,
        }
        note_html = (
            f"<p><strong>Dossier Editorial RoxyTales ({idempotency_key})</strong><br/>"
            f"Protagonista: <strong>{child_name}</strong> ({protagonist.get('age_value', 10)} "
            f"{protagonist.get('age_unit', 'months')}) · Compañero: <strong>{pet_name}</strong><br/>"
            f"Colección: {collection_id} · Edición: {tier} × {qty}<br/>"
            f"Dedicatoria: “{protagonist.get('dedication', '')}”<br/>"
            f"Assets: baby={protagonist.get('baby_asset_id', 'default')} · pet={protagonist.get('pet_asset_id', 'default')}</p>"
            f"<pre>{json.dumps(dossier, ensure_ascii=False)}</pre>"
        )

        order_id = self.client.create(
            "sale.order",
            {
                "partner_id": partner_id,
                "client_order_ref": idempotency_key,
                "note": note_html,
                "order_line": order_lines,
            },
        )

        if confirm_immediately:
            self.client.call("sale.order", "action_confirm", {"ids": [order_id]})

        # Close open CRM lead if buyer had one
        open_lead = self._find_open_lead(partner_id)
        if open_lead:
            try:
                self.client.call("crm.lead", "action_set_won", {"ids": [int(open_lead["id"])]})
            except OdooAPIError as exc:
                logger.warning(f"Could not mark lead {open_lead['id']} won: {exc}")

        portal_path = self.client.call("sale.order", "get_portal_url", {"ids": [order_id]})
        order_rows = self.client.search_read(
            "sale.order",
            [["id", "=", order_id]],
            ["id", "name", "state", "amount_total", "client_order_ref", "access_url", "access_token"],
            limit=1,
        )
        o_row = order_rows[0] if order_rows else {}

        result = {
            "status": "created",
            "order_id": order_id,
            "order_name": o_row.get("name", ""),
            "order_ref": idempotency_key,
            "partner_id": partner_id,
            "partner_created": partner_created,
            "state": o_row.get("state", "sale" if confirm_immediately else "draft"),
            "amount_total": float(o_row.get("amount_total") or 0.0),
            "portal_url": f"{ODOO_URL}{portal_path}" if portal_path else "",
            "payment_verified": True,
            "payment_mode": "simulated_test_approved",
            "payment_tx_id": f"TEST-PAY-{idempotency_key}",
            "protagonist": protagonist,
        }
        save_odoo_idempotency(f"order:{idempotency_key}", "sale.order", order_id, json.dumps(result))
        return result

    def _find_sale_order(self, order_ref: str) -> Optional[Dict[str, Any]]:
        rows = self.client.search_read(
            "sale.order",
            domain=["|", ["client_order_ref", "=", order_ref], ["name", "=", order_ref]],
            fields=[
                "id",
                "name",
                "client_order_ref",
                "partner_id",
                "state",
                "amount_total",
                "invoice_status",
                "invoice_ids",
                "picking_ids",
                "delivery_status",
                "access_url",
                "access_token",
                "note",
                "create_date",
            ],
            limit=1,
        )
        return rows[0] if rows else None

    def _resolve_local_pdf_bytes(self, pdf_path_or_url: str) -> bytes:
        raw = str(pdf_path_or_url or "").split("?")[0].strip()
        if not raw:
            raise FileNotFoundError("Missing pdf_path_or_url")
        if raw.startswith("/storage/pdfs/"):
            candidate = (PDFS_DIR / Path(raw).name).resolve()
        else:
            candidate = Path(raw).resolve()
            base_resolved = BASE_DIR.resolve()
            if not candidate.is_relative_to(base_resolved):
                raise ValueError("PDF path must remain inside workspace directory")
        if not candidate.exists() or not candidate.is_file():
            raise FileNotFoundError(f"PDF file not found on disk: {candidate}")
        return candidate.read_bytes()

    def attach_pdf_to_order(
        self,
        order_ref: str,
        pdf_base64: Optional[str] = None,
        pdf_path_or_url: Optional[str] = None,
        child_name: str = "Libro",
        filename: Optional[str] = None,
        trigger_digital_delivery: bool = True,
    ) -> Dict[str, Any]:
        """
        Uploads high-res PDF to Odoo `ir.attachment` (+ `documents.document` vault if installed),
        posts it to order chatter, and triggers digital delivery `mail.template.send_mail`.
        """
        order = self._find_sale_order(order_ref)
        if not order:
            raise OdooAPIError(f"Sale order {order_ref} not found in Odoo", status_code=404, model="sale.order")

        order_id = int(order["id"])
        partner_val = order.get("partner_id")
        partner_id = int(partner_val[0]) if isinstance(partner_val, list) and partner_val else None

        if pdf_base64:
            b64_payload = pdf_base64.strip()
        elif pdf_path_or_url:
            raw_bytes = self._resolve_local_pdf_bytes(pdf_path_or_url)
            b64_payload = base64.b64encode(raw_bytes).decode("ascii")
        else:
            raise ValueError("Provide either pdf_base64 or pdf_path_or_url")

        safe_child = re.sub(r"[^a-zA-Z0-9_-]+", "", child_name or "Libro") or "Libro"
        att_filename = filename or _sandbox_prefix(f"RoxyTales_{order_ref}_{safe_child}.pdf").replace(" ", "_")

        # Idempotent attachment check by filename + sale.order
        existing_att = self.client.search_read(
            "ir.attachment",
            domain=[
                ["res_model", "=", "sale.order"],
                ["res_id", "=", order_id],
                ["name", "=", att_filename],
            ],
            fields=["id", "name", "access_token", "file_size"],
            limit=1,
        )
        if existing_att:
            att_id = int(existing_att[0]["id"])
            att_created = False
        else:
            att_id = self.client.create(
                "ir.attachment",
                {
                    "name": att_filename,
                    "type": "binary",
                    "raw": b64_payload,
                    "res_model": "sale.order",
                    "res_id": order_id,
                    "mimetype": "application/pdf",
                },
            )
            att_created = True

        self.client.call("ir.attachment", "generate_access_token", {"ids": [att_id]})
        att_rows = self.client.search_read(
            "ir.attachment",
            [["id", "=", att_id]],
            ["id", "name", "access_token", "file_size", "local_url"],
            limit=1,
        )
        att_info = att_rows[0] if att_rows else {}

        # Optional Odoo Documents Vault (`documents.document`)
        doc_id: Optional[int] = None
        folder_id = self._get_documents_folder_id()
        if folder_id:
            existing_doc = self.client.search_read(
                "documents.document",
                domain=[
                    ["res_model", "=", "sale.order"],
                    ["res_id", "=", order_id],
                    ["attachment_id", "=", att_id],
                ],
                fields=["id"],
                limit=1,
            )
            if existing_doc:
                doc_id = int(existing_doc[0]["id"])
            else:
                doc_vals: Dict[str, Any] = {
                    "name": att_filename,
                    "type": "binary",
                    "folder_id": folder_id,
                    "attachment_id": att_id,
                    "res_model": "sale.order",
                    "res_id": order_id,
                }
                if partner_id:
                    doc_vals["partner_id"] = partner_id
                doc_id = self.client.create("documents.document", doc_vals)

        if att_created:
            self.client.call(
                "sale.order",
                "message_post",
                {
                    "ids": [order_id],
                    "body": f"Archivo editorial PDF de alta resolución guardado en bóveda: {att_filename}",
                    "attachment_ids": [att_id],
                },
            )

        mail_sent = False
        mail_id: Optional[int] = None
        if trigger_digital_delivery and order.get("state") in ("sale", "done"):
            tpl_id = self._get_mail_template_id()
            if tpl_id:
                partner_email = ""
                if partner_id:
                    p_rows = self.client.search_read("res.partner", [["id", "=", partner_id]], ["email"], limit=1)
                    partner_email = str((p_rows[0].get("email") if p_rows else "") or "").strip()
                email_vals: Dict[str, Any] = {"attachment_ids": [(4, att_id)]}
                if partner_email:
                    email_vals["email_to"] = partner_email
                try:
                    mail_res = self.client.call(
                        "mail.template",
                        "send_mail",
                        {
                            "ids": [tpl_id],
                            "res_id": order_id,
                            "force_send": True,
                            "email_values": email_vals,
                        },
                    )
                    mail_sent = True
                    if isinstance(mail_res, int):
                        mail_id = mail_res
                except OdooAPIError as exc:
                    logger.warning(f"Digital delivery send_mail skipped/failed for {order_ref}: {exc}")

        att_token = att_info.get("access_token") or ""
        return {
            "status": "attached",
            "order_id": order_id,
            "order_ref": order.get("client_order_ref") or order_ref,
            "order_name": order.get("name"),
            "attachment_id": att_id,
            "attachment_created": att_created,
            "attachment_name": att_filename,
            "file_size": att_info.get("file_size"),
            "download_url": f"{ODOO_URL}/web/content/{att_id}?access_token={att_token}&download=true" if att_token else "",
            "documents_id": doc_id,
            "documents_folder_id": folder_id,
            "digital_delivery_triggered": mail_sent,
            "mail_id": mail_id,
        }

    def get_order_status(self, order_ref: str) -> Dict[str, Any]:
        """Reverse Odoo -> RoxyTales lookup for order status, portal link, invoices, PDFs, and delivery."""
        order = self._find_sale_order(order_ref)
        if not order:
            raise OdooAPIError(f"Sale order {order_ref} not found", status_code=404, model="sale.order")

        order_id = int(order["id"])
        portal_path = self.client.call("sale.order", "get_portal_url", {"ids": [order_id]})

        attachments = self.client.search_read(
            "ir.attachment",
            domain=[["res_model", "=", "sale.order"], ["res_id", "=", order_id], ["mimetype", "=", "application/pdf"]],
            fields=["id", "name", "file_size", "access_token", "create_date"],
            order="id desc",
        )
        formatted_atts = []
        for a in attachments:
            tok = a.get("access_token") or ""
            formatted_atts.append({
                "id": int(a["id"]),
                "name": a["name"],
                "file_size": a.get("file_size"),
                "download_url": f"{ODOO_URL}/web/content/{a['id']}?access_token={tok}&download=true" if tok else "",
            })

        documents = []
        if self.client.model_exists("documents.document"):
            documents = self.client.search_read(
                "documents.document",
                domain=[["res_model", "=", "sale.order"], ["res_id", "=", order_id]],
                fields=["id", "name", "folder_id", "attachment_id", "access_token"],
            )

        invoice_ids = order.get("invoice_ids") or []
        invoices = []
        if invoice_ids:
            invoices = self.client.search_read(
                "account.move",
                domain=[["id", "in", invoice_ids]],
                fields=["id", "name", "state", "payment_state", "amount_total"],
            )

        picking_ids = order.get("picking_ids") or []
        pickings = []
        if picking_ids and self.client.model_exists("stock.picking"):
            pickings = self.client.search_read(
                "stock.picking",
                domain=[["id", "in", picking_ids]],
                fields=["id", "name", "state", "carrier_id", "carrier_tracking_ref", "scheduled_date"],
            )

        messages = self.client.search_read(
            "mail.message",
            domain=[["model", "=", "sale.order"], ["res_id", "=", order_id]],
            fields=["id", "subject", "message_type", "date", "attachment_ids"],
            order="id desc",
            limit=10,
        )

        mail_deliveries = []
        if self.client.model_exists("mail.mail"):
            mail_deliveries = self.client.search_read(
                "mail.mail",
                domain=[["model", "=", "sale.order"], ["res_id", "=", order_id]],
                fields=["id", "subject", "email_to", "state", "failure_reason"],
                order="id desc",
                limit=5,
            )

        return {
            "order_id": order_id,
            "order_name": order["name"],
            "order_ref": order.get("client_order_ref") or order["name"],
            "state": order["state"],
            "amount_total": float(order.get("amount_total") or 0.0),
            "invoice_status": order.get("invoice_status"),
            "delivery_status": order.get("delivery_status"),
            "invoices": invoices,
            "pickings": pickings,
            "portal_url": f"{ODOO_URL}{portal_path}" if portal_path else "",
            "attachments": formatted_atts,
            "documents": documents,
            "digital_delivery_sent": (
                any(m.get("state") in ("sent", "outgoing") for m in mail_deliveries)
                or any(att_id for m in messages for att_id in (m.get("attachment_ids") or []))
                or len(formatted_atts) > 0
            ),
            "mail_deliveries": mail_deliveries,
            "recent_messages": messages,
        }

    def fulfill_and_invoice_order(
        self,
        order_ref: str,
        carrier_tracking_ref: str = "",
        carrier_name: str = "Standard delivery",
        simulate_payment: bool = True,
        validate_picking: bool = True,
    ) -> Dict[str, Any]:
        """
        Executes full fulfillment on a confirmed `sale.order`:
        - Sets carrier + `carrier_tracking_ref` and validates any `stock.picking` transfers.
        - Marks service/manual lines delivered so invoice generates cleanly.
        - Creates + posts `account.move` invoice and registers simulated payment (`payment_state`).
        """
        order = self._find_sale_order(order_ref)
        if not order:
            raise OdooAPIError(f"Sale order {order_ref} not found", status_code=404, model="sale.order")

        order_id = int(order["id"])
        picking_ids = [int(pid) for pid in (order.get("picking_ids") or [])]

        # 1. Process physical shipment / carrier tracking on stock.picking (Hardcover/Softcover)
        carrier_id: Optional[int] = None
        if self.client.model_exists("delivery.carrier"):
            c_rows = self.client.search_read(
                "delivery.carrier",
                domain=[["name", "ilike", carrier_name]],
                fields=["id", "name"],
                limit=1,
            )
            if c_rows:
                carrier_id = int(c_rows[0]["id"])

        for pid in picking_ids:
            p_vals: Dict[str, Any] = {}
            if carrier_tracking_ref:
                p_vals["carrier_tracking_ref"] = carrier_tracking_ref
            if carrier_id:
                p_vals["carrier_id"] = carrier_id
            if p_vals:
                self.client.write("stock.picking", [pid], p_vals)
            if validate_picking:
                try:
                    self.client.call("stock.picking", "button_validate", {"ids": [pid]})
                except OdooAPIError as exc:
                    logger.warning(f"Picking validation warning for {pid}: {exc}")

        if carrier_tracking_ref:
            self.client.call(
                "sale.order",
                "message_post",
                {
                    "ids": [order_id],
                    "body": f"Envío preparado ({carrier_name}) · Número de rastreo: <strong>{carrier_tracking_ref}</strong>",
                },
            )

        # 2. Ensure delivered quantities on service/manual lines (e.g. Digital, Shipping, Coupon)
        lines = self.client.search_read(
            "sale.order.line",
            domain=[["order_id", "=", order_id]],
            fields=["id", "product_uom_qty", "qty_delivered"],
        )
        for ln in lines:
            qty_req = float(ln.get("product_uom_qty") or 0.0)
            if float(ln.get("qty_delivered") or 0.0) < qty_req:
                try:
                    self.client.write("sale.order.line", [int(ln["id"])], {"qty_delivered": qty_req})
                except OdooAPIError:
                    pass

        # 3. Create & post invoice + register simulated payment if no invoice exists yet
        invoice_ids = [int(i) for i in (order.get("invoice_ids") or [])]
        if not invoice_ids and self.client.model_exists("sale.advance.payment.inv"):
            try:
                wiz_res = self.client.call(
                    "sale.advance.payment.inv",
                    "create",
                    {
                        "vals_list": [{"advance_payment_method": "delivered", "sale_order_ids": [(6, 0, [order_id])]}],
                        "context": {"active_model": "sale.order", "active_ids": [order_id]},
                    },
                )
                wiz_id = int(wiz_res[0]) if isinstance(wiz_res, list) else int(wiz_res)
                self.client.call(
                    "sale.advance.payment.inv",
                    "create_invoices",
                    {"ids": [wiz_id], "context": {"active_model": "sale.order", "active_ids": [order_id]}},
                )
                refreshed = self._find_sale_order(order_ref)
                invoice_ids = [int(i) for i in ((refreshed or {}).get("invoice_ids") or [])]
            except OdooAPIError as exc:
                logger.warning(f"Invoice wizard warning for order {order_ref}: {exc}")

        for inv_id in invoice_ids:
            inv_rows = self.client.search_read("account.move", [["id", "=", inv_id]], ["id", "state", "payment_state"], limit=1)
            if not inv_rows:
                continue
            if inv_rows[0].get("state") == "draft":
                self.client.call("account.move", "action_post", {"ids": [inv_id]})
            if simulate_payment and inv_rows[0].get("payment_state") not in ("paid", "in_payment"):
                try:
                    pay_res = self.client.call(
                        "account.payment.register",
                        "create",
                        {
                            "vals_list": [{}],
                            "context": {"active_model": "account.move", "active_ids": [inv_id]},
                        },
                    )
                    pay_id = int(pay_res[0]) if isinstance(pay_res, list) else int(pay_res)
                    self.client.call(
                        "account.payment.register",
                        "action_create_payments",
                        {"ids": [pay_id], "context": {"active_model": "account.move", "active_ids": [inv_id]}},
                    )
                except OdooAPIError as exc:
                    logger.warning(f"Payment register warning for invoice {inv_id}: {exc}")

        return self.get_order_status(order_ref)

    def get_customer_orders(self, email: str) -> Dict[str, Any]:
        """Lists all independent orders owned by the resolved customer `res.partner`."""
        norm_email = normalize_email(email)
        if not is_valid_email(norm_email):
            raise ValueError("Invalid email address")
        partners = self.client.search_read(
            "res.partner",
            domain=[["email", "=", norm_email]],
            fields=["id", "name", "email", "is_company", "user_ids"],
            order="id asc",
        )
        if not partners:
            return {"email": norm_email, "partner_count": 0, "orders": []}
        ranked = sorted(
            partners,
            key=lambda r: (
                1 if (not r.get("is_company") and r.get("user_ids")) else 0,
                1 if not r.get("is_company") else 0,
                -int(r["id"]),
            ),
            reverse=True,
        )
        partner_id = int(ranked[0]["id"])
        orders = self.client.search_read(
            "sale.order",
            domain=[["partner_id", "=", partner_id]],
            fields=["id", "name", "client_order_ref", "state", "amount_total", "invoice_status", "delivery_status", "create_date"],
            order="id desc",
        )
        return {
            "email": norm_email,
            "partner_id": partner_id,
            "partner_count": len(partners),
            "orders": orders,
        }


odoo_service = OdooIntegrationService()
