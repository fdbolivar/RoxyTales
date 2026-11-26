"""
End-to-End Integration Test Suite for RoxyTales <-> Odoo 20 Enterprise Sandbox.
Validates all 6 required customer & visitor lifecycle scenarios directly against
https://edu-fdba.odoo.com via FastAPI TestClient (real JSON-2 calls, zero mocks).
"""

import base64
import time
import unittest

from fastapi.testclient import TestClient

from backend.main import app
from backend.odoo_client import odoo_client
from backend.setup_odoo_sandbox import ensure_odoo_sandbox_ready


def _build_minimal_pdf_bytes(title: str) -> bytes:
    """Builds a minimal valid single-page PDF binary in memory for fast vault upload tests."""
    safe_txt = title.replace("(", "[").replace(")", "]")
    stream = f"BT /F1 14 Tf 72 720 Td ({safe_txt}) Tj ET".encode("latin-1", errors="replace")
    objs = [
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 576 576] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
        b"4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
        f"5 0 obj\n<< /Length {len(stream)} >>\nstream\n".encode("ascii") + stream + b"\nendstream\nendobj\n",
    ]
    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for obj in objs:
        offsets.append(len(out))
        out.extend(obj)
    xref_pos = len(out)
    out.extend(f"xref\n0 {len(objs) + 1}\n0000000000 65535 f \n".encode("ascii"))
    for off in offsets:
        out.extend(f"{off:010d} 00000 n \n".encode("ascii"))
    out.extend(
        f"trailer\n<< /Size {len(objs) + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode("ascii")
    )
    return bytes(out)


class OdooBidirectionalE2ETests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.run_id = str(int(time.time()))
        cls._tc_cm = TestClient(app)
        cls.client = cls._tc_cm.__enter__()
        cls.setup_info = ensure_odoo_sandbox_ready(odoo_client)
        cls.created_records = {}

        health_resp = cls.client.get("/api/odoo/health")
        assert health_resp.status_code == 200, health_resp.text
        health = health_resp.json()
        assert health["connected"] is True, f"Odoo health check failed: {health}"

    @classmethod
    def tearDownClass(cls):
        if hasattr(cls, "_tc_cm"):
            cls._tc_cm.__exit__(None, None, None)

    def test_01_anonymous_curious_visitor_no_odoo_records(self):
        visitor_id = f"vis_anon_{self.run_id}"
        anon_child = f"AnonChild_{self.run_id}"
        resp = self.client.post(
            "/api/odoo/lead-event",
            json={
                "visitor_id": visitor_id,
                "event_type": "preview_generated",
                "email": "",
                "child_name": anon_child,
                "pet_name": "Roxy",
                "collection_id": "my_first_christmas_24p",
            },
        )
        self.assertEqual(resp.status_code, 200, resp.text)
        data = resp.json()
        self.assertEqual(data["status"], "local_only")
        self.assertFalse(data["synced_to_odoo"])
        self.assertEqual(
            odoo_client.search_count("crm.lead", [["name", "ilike", anon_child]]),
            0,
        )

    def test_02_and_03_first_lead_and_returning_visitor_no_duplicates(self):
        email = f"rt.sandbox.lead.{self.run_id}@example.com"
        self.__class__.lead_email = email

        # Caso 2: Primer ingreso con intención (descarga muestra gratis)
        resp1 = self.client.post(
            "/api/odoo/lead-event",
            json={
                "visitor_id": f"vis_{self.run_id}",
                "event_type": "free_sample_pdf",
                "email": email,
                "name": f"[RT-SANDBOX] Elena Gómez {self.run_id}",
                "country": "US",
                "child_name": "Mateo",
                "age_value": 8,
                "age_unit": "months",
                "pet_name": "Roxy",
                "collection_id": "my_first_christmas_24p",
                "tier": "hardcover",
            },
        )
        self.assertEqual(resp1.status_code, 200, resp1.text)
        d1 = resp1.json()
        self.assertTrue(d1["synced_to_odoo"])
        self.assertTrue(d1["partner_created"])
        self.assertEqual(d1["lead_action"], "created")

        # Caso 3: Visitante recurrente con mayúsculas -> mismo res.partner y mismo crm.lead actualizado
        resp2 = self.client.post(
            "/api/odoo/lead-event",
            json={
                "visitor_id": f"vis_{self.run_id}",
                "event_type": "preview_generated",
                "email": email.upper(),
                "name": "Elena Gómez",
                "country": "US",
                "child_name": "Mateo",
                "age_value": 9,
                "age_unit": "months",
                "pet_name": "Roxy",
                "collection_id": "my_first_christmas_24p",
                "tier": "hardcover",
            },
        )
        self.assertEqual(resp2.status_code, 200, resp2.text)
        d2 = resp2.json()
        self.assertEqual(d2["partner_id"], d1["partner_id"])
        self.assertFalse(d2["partner_created"])
        self.assertEqual(d2["lead_id"], d1["lead_id"])
        self.assertEqual(d2["lead_action"], "updated")

        self.assertEqual(odoo_client.search_count("res.partner", [["email", "=", email]]), 1)
        self.assertEqual(odoo_client.search_count("crm.lead", [["partner_id", "=", d1["partner_id"]]]), 1)
        self.created_records["lead_partner_id"] = d1["partner_id"]
        self.created_records["lead_id"] = d1["lead_id"]

    def test_04_waitlist_registration(self):
        wait_email = f"rt.sandbox.waitlist.{self.run_id}@example.com"
        resp = self.client.post(
            "/api/odoo/waitlist",
            json={
                "email": wait_email,
                "name": f"[RT-SANDBOX] Carlos Ruiz {self.run_id}",
                "product_id": "galactic_mission_8x8",
                "product_title": "Misión galáctica con Roxy",
                "discount_percent": 10,
                "language": "es",
            },
        )
        self.assertEqual(resp.status_code, 200, resp.text)
        data = resp.json()
        self.assertTrue(data["synced_to_odoo"])
        self.assertEqual(data["assigned_coupon_code"], "WAITLIST10")
        leads = odoo_client.search_read("crm.lead", [["id", "=", data["lead_id"]]], ["id", "tag_ids", "name"])
        self.assertEqual(len(leads), 1)
        self.created_records["waitlist_lead_id"] = data["lead_id"]

    def test_05_and_06_two_independent_orders_same_buyer_with_pdf_vault_and_reverse_query(self):
        buyer_email = f"rt.sandbox.buyer.{self.run_id}@example.com"
        order_ref_1 = f"RT-SANDBOX-ORD1-{self.run_id}"
        order_ref_2 = f"RT-SANDBOX-ORD2-{self.run_id}"

        order1_payload = {
            "idempotency_key": order_ref_1,
            "buyer": {
                "name": f"[RT-SANDBOX] Carolina Martínez {self.run_id}",
                "email": buyer_email,
                "country": "US",
            },
            "protagonist": {
                "child_name": "Sofía",
                "age_value": 10,
                "age_unit": "months",
                "pet_name": "Roxy",
                "pet_sound": "Guau, guau",
                "collection_id": "my_first_christmas_24p",
                "dedication": "Para Sofía, tu primera Navidad.",
                "baby_asset_id": f"asset_sofia_{self.run_id}",
                "pet_asset_id": "roxy_official",
            },
            "order": {
                "tier": "hardcover",
                "quantity": 2,
                "volume_discount_pct": 10,
                "coupon_code": "WAITLIST10",
                "shipping_fee": 4.5,
                "currency": "USD",
                "shipping_address": {
                    "street": "742 Evergreen Terrace",
                    "city": "Miami",
                    "state": "FL",
                    "postal_code": "33101",
                    "country": "US",
                },
            },
            "confirm_immediately": True,
        }

        # Caso 5a: Creación de Primera Orden + verificación de idempotencia
        r1 = self.client.post("/api/odoo/sale-order", json=order1_payload)
        self.assertEqual(r1.status_code, 200, r1.text)
        o1 = r1.json()
        self.assertEqual(o1["state"], "sale")

        r1_dup = self.client.post("/api/odoo/sale-order", json=order1_payload)
        self.assertEqual(r1_dup.status_code, 200, r1_dup.text)
        self.assertEqual(r1_dup.json()["order_id"], o1["order_id"])

        # Caso 5b: Subida PDF de Sofía a bóveda (ir.attachment + documents.document + correo entrega)
        pdf1_b64 = base64.b64encode(_build_minimal_pdf_bytes(f"RoxyTales Sofia {order_ref_1}")).decode("ascii")
        att1_resp = self.client.post(
            f"/api/odoo/sale-order/{order_ref_1}/attach-pdf",
            json={
                "pdf_base64": pdf1_b64,
                "child_name": "Sofia",
                "trigger_digital_delivery": True,
            },
        )
        self.assertEqual(att1_resp.status_code, 200, att1_resp.text)
        att1 = att1_resp.json()
        self.assertGreater(att1["attachment_id"], 0)
        self.assertIsNotNone(att1["documents_id"])
        self.assertTrue(att1["digital_delivery_triggered"])

        # Caso 5c: Consulta inversa Odoo -> RoxyTales
        rev1_resp = self.client.get(f"/api/odoo/orders/{order_ref_1}")
        self.assertEqual(rev1_resp.status_code, 200, rev1_resp.text)
        rev1 = rev1_resp.json()
        self.assertEqual(rev1["state"], "sale")
        self.assertIn("access_token=", rev1["portal_url"])
        self.assertEqual(len(rev1["attachments"]), 1)
        self.assertTrue(rev1["digital_delivery_sent"])

        # Caso 6: Segundo libro del mismo comprador (distinto niño, tema, foto y tier)
        order2_payload = {
            "idempotency_key": order_ref_2,
            "buyer": {
                "name": f"[RT-SANDBOX] Carolina Martínez {self.run_id}",
                "email": buyer_email.upper(),
                "country": "US",
            },
            "protagonist": {
                "child_name": "Lucía",
                "age_value": 6,
                "age_unit": "years",
                "pet_name": "Max",
                "pet_sound": "Woof, woof",
                "collection_id": "galactic_mission_8x8",
                "dedication": "Para Lucía, rumbo a las estrellas.",
                "baby_asset_id": f"asset_lucia_{self.run_id}",
                "pet_asset_id": f"asset_max_{self.run_id}",
            },
            "order": {
                "tier": "digital",
                "quantity": 1,
                "volume_discount_pct": 0,
                "coupon_code": "",
                "shipping_fee": 0.0,
                "currency": "USD",
            },
            "confirm_immediately": True,
        }
        r2 = self.client.post("/api/odoo/sale-order", json=order2_payload)
        self.assertEqual(r2.status_code, 200, r2.text)
        o2 = r2.json()
        self.assertEqual(o2["partner_id"], o1["partner_id"])
        self.assertNotEqual(o2["order_id"], o1["order_id"])

        pdf2_b64 = base64.b64encode(_build_minimal_pdf_bytes(f"RoxyTales Lucia {order_ref_2}")).decode("ascii")
        att2_resp = self.client.post(
            f"/api/odoo/sale-order/{order_ref_2}/attach-pdf",
            json={
                "pdf_base64": pdf2_b64,
                "child_name": "Lucia",
                "trigger_digital_delivery": True,
            },
        )
        self.assertEqual(att2_resp.status_code, 200, att2_resp.text)
        att2 = att2_resp.json()
        self.assertNotEqual(att2["attachment_id"], att1["attachment_id"])

        # Verifica que el cliente sigue siendo 1 solo res.partner con 2 sale.order independientes
        cust_resp = self.client.get(f"/api/odoo/customers/{buyer_email}/orders")
        self.assertEqual(cust_resp.status_code, 200, cust_resp.text)
        cust = cust_resp.json()
        self.assertEqual(cust["partner_count"], 1)
        self.assertEqual(len(cust["orders"]), 2)

        # Verifica que la orden 1 conservó intacto su PDF original de Sofía
        rev1_after = self.client.get(f"/api/odoo/orders/{order_ref_1}").json()
        rev2_after = self.client.get(f"/api/odoo/orders/{order_ref_2}").json()
        self.assertEqual(len(rev1_after["attachments"]), 1)
        self.assertIn("Sofia", rev1_after["attachments"][0]["name"])
        self.assertEqual(len(rev2_after["attachments"]), 1)
        self.assertIn("Lucia", rev2_after["attachments"][0]["name"])

        self.created_records.update({
            "buyer_partner_id": o1["partner_id"],
            "order_1_id": o1["order_id"],
            "order_1_name": o1["order_name"],
            "order_1_att_id": att1["attachment_id"],
            "order_1_doc_id": att1["documents_id"],
            "order_2_id": o2["order_id"],
            "order_2_name": o2["order_name"],
            "order_2_att_id": att2["attachment_id"],
            "order_2_doc_id": att2["documents_id"],
        })
        print("E2E_SANDBOX_SUMMARY:", self.created_records)


if __name__ == "__main__":
    unittest.main(verbosity=2)
