"""
Dedicated Odoo 20 Enterprise JSON-2 API client for RoxyTales.
Uses strictly POST {ODOO_URL}/json/2/{model}/{method} with Bearer auth.
Never embeds secrets or numeric record IDs.
"""

import json
import logging
import time
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional

from backend.config import ODOO_API_KEY, ODOO_ENV, ODOO_TIMEOUT_SECONDS, ODOO_URL

logger = logging.getLogger("roxytales.odoo_client")


class OdooAPIError(RuntimeError):
    """Explicit error raised on Odoo HTTP/JSON-2 failures (with secrets redacted)."""

    def __init__(self, message: str, status_code: Optional[int] = None, model: str = "", method: str = ""):
        super().__init__(message)
        self.status_code = status_code
        self.model = model
        self.method = method


class OdooJSON2Client:
    """Thread-safe stateless HTTP client for Odoo 20 Enterprise `/json/2/` endpoints."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: float = ODOO_TIMEOUT_SECONDS,
    ):
        self.base_url = (base_url if base_url is not None else ODOO_URL).rstrip("/")
        self.api_key = (api_key if api_key is not None else ODOO_API_KEY).strip()
        self.timeout = timeout

    @property
    def is_configured(self) -> bool:
        return bool(self.base_url and self.api_key)

    def _require_configured(self) -> None:
        if not self.is_configured:
            raise OdooAPIError("Odoo integration is not configured (missing ODOO_URL or ODOO_API_KEY).")

    def call(
        self,
        model: str,
        method: str,
        payload: Optional[Dict[str, Any]] = None,
        timeout: Optional[float] = None,
    ) -> Any:
        self._require_configured()
        endpoint = f"{self.base_url}/json/2/{model}/{method}"
        body = json.dumps(payload or {}).encode("utf-8")
        req = urllib.request.Request(
            endpoint,
            data=body,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        req_timeout = timeout or self.timeout
        max_attempts = 2 if method in ("search_read", "search_count", "read", "fields_get") else 1
        for attempt in range(1, max_attempts + 1):
            try:
                with urllib.request.urlopen(req, timeout=req_timeout) as resp:
                    raw = resp.read().decode("utf-8")
                    return json.loads(raw) if raw else None
            except urllib.error.HTTPError as exc:
                err_body = exc.read().decode("utf-8", errors="replace")
                msg = err_body[:400]
                try:
                    parsed = json.loads(err_body)
                    if isinstance(parsed, dict) and parsed.get("message"):
                        msg = str(parsed["message"])
                except Exception:
                    pass
                logger.warning(f"Odoo JSON-2 error on {model}.{method} -> HTTP {exc.code}: {msg}")
                raise OdooAPIError(msg, status_code=exc.code, model=model, method=method) from exc
            except urllib.error.URLError as exc:
                if attempt < max_attempts:
                    time.sleep(1.0)
                    continue
                logger.warning(f"Odoo network error on {model}.{method}: {exc.reason}")
                raise OdooAPIError(f"Network error contacting Odoo: {exc.reason}", model=model, method=method) from exc
            except TimeoutError as exc:
                if attempt < max_attempts:
                    time.sleep(1.0)
                    continue
                logger.warning(f"Odoo timeout on {model}.{method}")
                raise OdooAPIError("Timeout contacting Odoo", model=model, method=method) from exc

    def server_version(self) -> Dict[str, Any]:
        """Queries public Odoo /jsonrpc common.version."""
        if not self.base_url:
            raise OdooAPIError("Missing ODOO_URL")
        req = urllib.request.Request(
            f"{self.base_url}/jsonrpc",
            data=json.dumps({
                "jsonrpc": "2.0",
                "method": "call",
                "params": {"service": "common", "method": "version", "args": []},
                "id": 1,
            }).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                parsed = json.loads(resp.read().decode("utf-8"))
                return parsed.get("result") or {}
        except Exception as exc:
            raise OdooAPIError(f"Failed to query Odoo version: {exc}") from exc

    def search_read(
        self,
        model: str,
        domain: Optional[List[Any]] = None,
        fields: Optional[List[str]] = None,
        limit: Optional[int] = None,
        order: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        payload: Dict[str, Any] = {"domain": domain or []}
        if fields is not None:
            payload["fields"] = fields
        if limit is not None:
            payload["limit"] = limit
        if order:
            payload["order"] = order
        res = self.call(model, "search_read", payload)
        return res if isinstance(res, list) else []

    def search_count(self, model: str, domain: Optional[List[Any]] = None) -> int:
        res = self.call(model, "search_count", {"domain": domain or []})
        return int(res or 0)

    def create(self, model: str, vals: Dict[str, Any]) -> int:
        res = self.call(model, "create", {"vals_list": [vals]})
        if isinstance(res, list) and res:
            return int(res[0])
        if isinstance(res, int):
            return res
        raise OdooAPIError(f"Unexpected create return for {model}: {res!r}", model=model, method="create")

    def write(self, model: str, ids: List[int], vals: Dict[str, Any]) -> bool:
        if not ids:
            return True
        res = self.call(model, "write", {"ids": [int(i) for i in ids], "vals": vals})
        return bool(res)

    def model_exists(self, model: str) -> bool:
        try:
            self.search_count(model, [])
            return True
        except OdooAPIError as exc:
            if exc.status_code == 404:
                return False
            raise

    def health_check(self) -> Dict[str, Any]:
        if not self.is_configured:
            return {
                "connected": False,
                "configured": False,
                "environment": ODOO_ENV,
                "error": "ODOO_URL or ODOO_API_KEY missing in server environment.",
            }
        try:
            ver = self.server_version()
            partner_count = self.search_count("res.partner", [])
            modules = {
                "crm": self.model_exists("crm.lead"),
                "sale": self.model_exists("sale.order"),
                "account": self.model_exists("account.move"),
                "documents": self.model_exists("documents.document"),
                "mail_template": self.model_exists("mail.template"),
                "base_automation": self.model_exists("base.automation"),
            }
            return {
                "connected": True,
                "configured": True,
                "environment": ODOO_ENV,
                "url": self.base_url,
                "server_version": ver.get("server_version", "unknown"),
                "partner_count": partner_count,
                "modules": modules,
            }
        except OdooAPIError as exc:
            return {
                "connected": False,
                "configured": True,
                "environment": ODOO_ENV,
                "url": self.base_url,
                "status_code": exc.status_code,
                "error": str(exc),
            }


odoo_client = OdooJSON2Client()
