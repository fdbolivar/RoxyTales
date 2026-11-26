"""
Idempotent Odoo 20 Enterprise Sandbox / Production Provisioning Script for RoxyTales.
Creates/verifies base products by `default_code`, CRM tags, Documents PDF folder,
digital delivery `mail.template`, and (when installed) `base.automation` trigger rule.
Safe to run multiple times without creating duplicates or hardcoding IDs.
"""

import logging
from typing import Any, Dict, List, Optional

from backend.config import (
    ODOO_DOCUMENTS_FOLDER_NAME,
    ODOO_ENV,
    ODOO_MAIL_TEMPLATE_NAME,
)
from backend.odoo_client import OdooAPIError, OdooJSON2Client, odoo_client

logger = logging.getLogger("roxytales.setup_odoo")

PRODUCT_SPECS: List[Dict[str, Any]] = [
    {
        "default_code": "ROXY-DIG-8X8",
        "name": "RoxyTales Digital Edition 8x8 (PDF High-Res)",
        "type": "service",
        "list_price": 9.99,
        "sale_ok": True,
    },
    {
        "default_code": "ROXY-SOFT-8X8",
        "name": "RoxyTales Softcover Edition 8x8 (24 Pages)",
        "type": "consu",
        "is_storable": True,
        "list_price": 34.99,
        "sale_ok": True,
    },
    {
        "default_code": "ROXY-HARD-8X8",
        "name": "RoxyTales Luxury Hardcover Edition 8x8 (24 Pages)",
        "type": "consu",
        "is_storable": True,
        "list_price": 39.99,
        "sale_ok": True,
    },
    {
        "default_code": "ROXY-SHIP-8X8",
        "name": "RoxyTales Print Shipping & Handling",
        "type": "service",
        "list_price": 4.50,
        "sale_ok": True,
    },
    {
        "default_code": "ROXY-COUPON-8X8",
        "name": "RoxyTales Promotional Coupon Discount",
        "type": "service",
        "list_price": 0.0,
        "sale_ok": True,
    },
]

CRM_TAGS: List[str] = [
    "RoxyTales",
    "Digital Preview",
    "Free Sample PDF",
    "Waitlist WAITLIST10",
    "International Pilot",
]


def ensure_products(client: OdooJSON2Client) -> Dict[str, int]:
    """Resolves or creates all RoxyTales products by `default_code` in batch."""
    codes = [spec["default_code"] for spec in PRODUCT_SPECS]
    existing_rows = client.search_read(
        "product.product",
        domain=[["default_code", "in", codes]],
        fields=["id", "product_tmpl_id", "default_code"],
    )
    result: Dict[str, int] = {
        row["default_code"]: int(row["id"])
        for row in existing_rows
        if row.get("default_code")
    }
    for spec in PRODUCT_SPECS:
        code = spec["default_code"]
        if code in result:
            if spec.get("is_storable"):
                rows = existing_rows
                for r in rows:
                    if r.get("default_code") == code and r.get("product_tmpl_id"):
                        client.write("product.template", [int(r["product_tmpl_id"][0])], {"is_storable": True})
            continue

        tmpl_vals: Dict[str, Any] = {
            "name": spec["name"],
            "default_code": code,
            "type": spec["type"],
            "list_price": spec["list_price"],
            "sale_ok": spec["sale_ok"],
            "taxes_id": [(5, 0, 0)],
        }
        if spec.get("is_storable"):
            tmpl_vals["is_storable"] = True
        tmpl_id = client.create("product.template", tmpl_vals)
        variant = client.search_read(
            "product.product",
            domain=[["product_tmpl_id", "=", tmpl_id]],
            fields=["id"],
            limit=1,
        )
        if variant:
            client.write("product.product", [int(variant[0]["id"])], {"default_code": code})
            result[code] = int(variant[0]["id"])
    return result


def ensure_crm_tags(client: OdooJSON2Client) -> Dict[str, int]:
    existing_rows = client.search_read(
        "crm.tag",
        domain=[["name", "in", CRM_TAGS]],
        fields=["id", "name"],
    )
    tags: Dict[str, int] = {row["name"]: int(row["id"]) for row in existing_rows if row.get("name")}
    for tag_name in CRM_TAGS:
        if tag_name not in tags:
            tags[tag_name] = client.create("crm.tag", {"name": tag_name})
    return tags


def ensure_documents_folder(client: OdooJSON2Client) -> Optional[int]:
    """Creates or retrieves the Documents folder (`documents.document` with `type='folder'` in Odoo 20)."""
    if not client.model_exists("documents.document"):
        return None
    existing = client.search_read(
        "documents.document",
        domain=[["type", "=", "folder"], ["name", "=", ODOO_DOCUMENTS_FOLDER_NAME]],
        fields=["id", "name", "folder_id"],
        limit=1,
    )
    if existing:
        return int(existing[0]["id"])

    parent_folder = client.search_read(
        "documents.document",
        domain=[["type", "=", "folder"], ["name", "=", "Libros POD"]],
        fields=["id"],
        limit=1,
    )
    vals: Dict[str, Any] = {
        "name": ODOO_DOCUMENTS_FOLDER_NAME,
        "type": "folder",
    }
    if parent_folder:
        vals["folder_id"] = int(parent_folder[0]["id"])
    return client.create("documents.document", vals)


def ensure_mail_template(client: OdooJSON2Client) -> Optional[int]:
    """Creates or retrieves the digital delivery email template on `sale.order`."""
    sale_models = client.search_read(
        "ir.model",
        domain=[["model", "=", "sale.order"]],
        fields=["id"],
        limit=1,
    )
    if not sale_models:
        return None
    sale_model_id = int(sale_models[0]["id"])

    existing = client.search_read(
        "mail.template",
        domain=[["name", "=", ODOO_MAIL_TEMPLATE_NAME], ["model", "=", "sale.order"]],
        fields=["id", "name"],
        limit=1,
    )
    body_html = """
<div style="font-family: Georgia, serif; color: #1A1715; max-width: 600px; margin: auto; padding: 24px; background: #FAF8F5; border: 1px solid #E8E2D9; border-radius: 12px;">
  <h2 style="color: #991B1B; margin-top: 0;">¡Tu tesoro ilustrado RoxyTales está listo!</h2>
  <p>Hola <t t-out="object.partner_id.name or 'familia'"/>,</p>
  <p>Confirmamos tu pedido <strong><t t-out="object.client_order_ref or object.name"/></strong>. Hemos preparado tu archivo editorial de colección en alta resolución y lo hemos adjuntado en tu expediente de pedido.</p>
  <p style="margin: 20px 0;">
    <a t-att-href="object.get_portal_url()" style="display: inline-block; padding: 12px 22px; background-color: #991B1B; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: bold;">
      Ver mi pedido y descargar edición
    </a>
  </p>
  <p style="font-size: 12px; color: #786F66;">RoxyTales Publishing Imprint · Edición de Colección 8×8"</p>
</div>
""".strip()

    vals = {
        "name": ODOO_MAIL_TEMPLATE_NAME,
        "model_id": sale_model_id,
        "subject": "✨ Tu tesoro ilustrado RoxyTales está listo ({{ object.client_order_ref or object.name }})",
        "email_to": "{{ object.partner_id.email or '' }}",
        "partner_to": "{{ object.partner_id.id }}",
        "auto_delete": False,
        "body_html": body_html,
    }
    if existing:
        tpl_id = int(existing[0]["id"])
        client.write("mail.template", [tpl_id], vals)
        return tpl_id
    return client.create("mail.template", vals)


def ensure_base_automation(client: OdooJSON2Client, mail_template_id: Optional[int]) -> Dict[str, Any]:
    """Configures automated email action if `base.automation` is installed; degrades cleanly if absent."""
    if not mail_template_id:
        return {"installed": False, "configured": False, "reason": "No mail template available"}
    if not client.model_exists("base.automation"):
        return {
            "installed": False,
            "configured": False,
            "reason": "base_automation module not installed on target Odoo; backend triggers mail.template.send_mail directly",
        }

    rule_name = "RoxyTales: Auto-Send Digital Keepsake on Confirmation"
    existing = client.search_read(
        "base.automation",
        domain=[["name", "=", rule_name]],
        fields=["id", "name"],
        limit=1,
    )
    if existing:
        return {"installed": True, "configured": True, "automation_id": int(existing[0]["id"])}

    sale_models = client.search_read("ir.model", domain=[["model", "=", "sale.order"]], fields=["id"], limit=1)
    if not sale_models:
        return {"installed": True, "configured": False, "reason": "sale.order model lookup failed"}

    try:
        action_id = client.create(
            "ir.actions.server",
            {
                "name": "RoxyTales: Send Digital Keepsake Email",
                "model_id": int(sale_models[0]["id"]),
                "state": "mail_post",
                "template_id": mail_template_id,
            },
        )
        auto_id = client.create(
            "base.automation",
            {
                "name": rule_name,
                "model_id": int(sale_models[0]["id"]),
                "trigger": "on_state_set",
                "action_server_ids": [(4, action_id)],
            },
        )
        return {"installed": True, "configured": True, "automation_id": auto_id}
    except OdooAPIError as exc:
        return {"installed": True, "configured": False, "reason": str(exc)}


def ensure_odoo_sandbox_ready(client: Optional[OdooJSON2Client] = None) -> Dict[str, Any]:
    c = client or odoo_client
    products = ensure_products(c)
    crm_tags = ensure_crm_tags(c)
    folder_id = ensure_documents_folder(c)
    mail_template_id = ensure_mail_template(c)
    automation = ensure_base_automation(c, mail_template_id)
    summary = {
        "environment": ODOO_ENV,
        "products": products,
        "crm_tags": crm_tags,
        "documents_folder_id": folder_id,
        "documents_folder_name": ODOO_DOCUMENTS_FOLDER_NAME if folder_id else None,
        "mail_template_id": mail_template_id,
        "mail_template_name": ODOO_MAIL_TEMPLATE_NAME,
        "automation": automation,
    }
    logger.info(f"Odoo sandbox setup verified: {summary}")
    return summary


if __name__ == "__main__":
    import json

    logging.basicConfig(level=logging.INFO)
    print(json.dumps(ensure_odoo_sandbox_ready(), indent=2, ensure_ascii=False))
