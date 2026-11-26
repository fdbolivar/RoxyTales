"""
FastAPI Server for RoxyTales Image Generation Pipeline.
Endpoints for asset upload, on-demand render orchestration, and async job polling.
"""

import hashlib
import json
import os
import uuid
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.config import (
    BASE_DIR,
    UPLOADS_DIR,
    STORAGE_DIR,
    RENDERS_DIR,
    PDFS_DIR,
    MAX_FILE_SIZE_BYTES,
    ALLOWED_MIME_TYPES,
    DEFAULT_ROXY_IMAGE,
    ROXY_PREVIEW_MODEL,
    ROXY_FINAL_MODEL,
    GEMINI_API_KEY,
    TEST_MODE,
    STRIPE_ENABLED,
    GELATO_ENABLED,
)
from backend.db import (
    init_db,
    create_profile,
    get_profile,
    create_job,
    update_job,
    get_job,
    get_cached_render,
    create_pdf_job,
    update_pdf_job,
    get_pdf_job,
    check_and_record_preview_quota,
    get_odoo_idempotency,
    save_odoo_idempotency,
)
from backend.image_engine import image_engine, compute_cache_key
from backend.model_router import ModelRouter
from backend.odoo_client import OdooAPIError, odoo_client
from backend.odoo_service import odoo_service
from backend.pdf_layout_engine import pdf_layout_engine, parse_age_months

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("roxytales.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info("RoxyTales Database initialized.")
    yield


app = FastAPI(
    title="RoxyTales AI Engine API",
    version="1.0.0",
    description="Asynchronous 3D Keepsake Illustration Generation Engine for RoxyTales",
    lifespan=lifespan
)

# Enable CORS for local and web previews
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount ONLY public render & PDF outputs (never expose SQLite DB or raw user uploads)
app.mount("/storage/renders", StaticFiles(directory=str(RENDERS_DIR)), name="storage_renders")
app.mount("/storage/pdfs", StaticFiles(directory=str(PDFS_DIR)), name="storage_pdfs")
if (BASE_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(BASE_DIR / "assets")), name="assets")
if (BASE_DIR / "PublishingImprint").exists():
    app.mount("/PublishingImprint", StaticFiles(directory=str(BASE_DIR / "PublishingImprint")), name="imprint")
if (BASE_DIR / "Roxy").exists():
    app.mount("/Roxy", StaticFiles(directory=str(BASE_DIR / "Roxy")), name="roxy_samples")
if (BASE_DIR / "Babies").exists():
    app.mount("/Babies", StaticFiles(directory=str(BASE_DIR / "Babies")), name="baby_samples")


class RenderRequest(BaseModel):
    profile_id: Optional[str] = None
    pages: List[int] = [1]
    tier: str = "preview"  # "preview" or "final"
    child_name: str = "Liam"
    child_age: int = 10
    pet_name: str = "Roxy"


def _hash_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _run_page_render_job(
    job_id: str,
    page_number: int,
    baby_photo_path: Optional[Path],
    baby_photo_hash: str,
    pet_photo_path: Optional[Path],
    pet_photo_hash: str,
    child_name: str,
    child_age: int,
    pet_name: str,
    tier: str
):
    try:
        update_job(job_id, status="processing", progress=30)
        output_url, was_cached, model_used = image_engine.render_page(
            page_number=page_number,
            baby_photo_path=baby_photo_path,
            baby_photo_hash=baby_photo_hash,
            pet_photo_path=pet_photo_path,
            pet_photo_hash=pet_photo_hash,
            child_name=child_name,
            child_age=child_age,
            pet_name=pet_name,
            tier=tier
        )
        update_job(job_id, status="completed", progress=100, output_url=output_url)
        logger.info(f"Job {job_id} completed successfully ({model_used}).")
    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}")
        update_job(job_id, status="failed", error_message=str(e))


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "preview_model": ROXY_PREVIEW_MODEL,
        "final_model": ROXY_FINAL_MODEL,
        "genai_configured": bool(GEMINI_API_KEY),
        "test_mode": TEST_MODE,
        "stripe_enabled": STRIPE_ENABLED,
        "gelato_enabled": GELATO_ENABLED,
        "odoo_configured": odoo_client.is_configured,
    }


@app.post("/api/assets/upload")
async def upload_assets(
    baby_photo: Optional[UploadFile] = File(None),
    pet_photo: Optional[UploadFile] = File(None)
):
    """
    Receives baby and pet photos, verifies size/MIME, calculates SHA-256 hashes,
    and returns a profile_id.
    """
    baby_path, baby_hash = None, "default_baby"
    pet_path, pet_hash = None, "default_roxy"

    def _save_upload_photo(upload_file: UploadFile, raw_bytes: bytes, prefix: str, label_es: str) -> Tuple[str, str]:
        if len(raw_bytes) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(400, f"La foto {label_es} supera el límite de 15 MB.")
        ctype = str(upload_file.content_type or "").lower().strip()
        ext = ALLOWED_MIME_TYPES.get(ctype)
        if not ext and upload_file.filename:
            suffix = Path(upload_file.filename).suffix.lower()
            if suffix in (".jpg", ".jpeg", ".png", ".webp"):
                ext = ".jpg" if suffix == ".jpeg" else suffix
        if not ext:
            raise HTTPException(400, f"Formato no permitido para foto {label_es}. Use JPG, PNG o WEBP.")
        digest = _hash_bytes(raw_bytes)
        saved_file = UPLOADS_DIR / f"{prefix}_{digest[:16]}{ext}"
        with open(saved_file, "wb") as f:
            f.write(raw_bytes)
        return str(saved_file), digest

    if baby_photo and baby_photo.filename:
        baby_bytes = await baby_photo.read()
        baby_path, baby_hash = _save_upload_photo(baby_photo, baby_bytes, "baby", "del bebé")

    if pet_photo and pet_photo.filename:
        pet_bytes = await pet_photo.read()
        pet_path, pet_hash = _save_upload_photo(pet_photo, pet_bytes, "pet", "de la mascota")
    else:
        # Default official Roxy Character reference
        if DEFAULT_ROXY_IMAGE.exists():
            pet_path = str(DEFAULT_ROXY_IMAGE)
            pet_hash = "official_roxy_shih_tzu"

    profile_id = str(uuid.uuid4())
    profile = create_profile(
        profile_id=profile_id,
        baby_path=baby_path,
        baby_hash=baby_hash,
        pet_path=pet_path,
        pet_hash=pet_hash
    )

    return {
        "profile_id": profile_id,
        "baby_photo_hash": baby_hash,
        "pet_photo_hash": pet_hash,
        "has_baby_photo": bool(baby_path),
        "has_pet_photo": bool(pet_photo and pet_photo.filename)
    }


MAX_FREE_PREVIEWS_PER_IP = int(os.getenv("ROXYTALES_MAX_FREE_PREVIEWS_PER_IP", "3"))
PREVIEW_WINDOW_SECONDS = 86400  # 24 hours


def _extract_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    if forwarded_for:
        first_ip = forwarded_for.split(",")[0].strip()
        if first_ip:
            return first_ip
    return request.client.host if request.client else "unknown"


def _enforce_preview_quota(request: Request) -> None:
    """Enforces a persistent 24-hour per-IP cap on uncached free preview generations."""
    client_ip = _extract_client_ip(request)
    if not check_and_record_preview_quota(client_ip, MAX_FREE_PREVIEWS_PER_IP, PREVIEW_WINDOW_SECONDS):
        raise HTTPException(
            status_code=429,
            detail="Has alcanzado el límite de 3 vistas previas gratuitas en 24 horas. Finaliza tu pedido para desbloquear la edición completa.",
        )


@app.post("/api/book/render")
async def render_book(req: RenderRequest, bg_tasks: BackgroundTasks, request: Request):
    """
    Renders requested 24p storybook scene pages.
    Checks cache first; if missing, charges at most one preview quota slot and dispatches async jobs.
    """
    profile = get_profile(req.profile_id) if req.profile_id else None

    baby_path = Path(profile["baby_photo_path"]) if (profile and profile["baby_photo_path"]) else None
    baby_hash = profile["baby_photo_hash"] if profile else "default_baby"

    pet_path = Path(profile["pet_photo_path"]) if (profile and profile["pet_photo_path"]) else None
    pet_hash = profile["pet_photo_hash"] if profile else "default_roxy"

    model_name, res_label, _ = ModelRouter.get_tier_config(req.tier)

    cached_lookup: Dict[int, Optional[dict]] = {}
    uncached_pages: List[int] = []
    for page in req.pages:
        cache_key = compute_cache_key(page, baby_hash, pet_hash, model_name, res_label)
        cached = get_cached_render(cache_key)
        is_fallback_cache = cached and cached["model_used"] == "roxy-artistic-composite-engine"
        if cached and Path(cached["output_path"]).exists() and not (is_fallback_cache and bool(GEMINI_API_KEY)):
            cached_lookup[page] = cached
        else:
            cached_lookup[page] = None
            uncached_pages.append(page)

    if uncached_pages and req.tier == "preview":
        _enforce_preview_quota(request)

    jobs_response = []
    for page in req.pages:
        job_id = str(uuid.uuid4())
        cached = cached_lookup[page]
        if cached:
            output_url = f"/storage/renders/{Path(cached['output_path']).name}"
            jobs_response.append({
                "job_id": job_id,
                "page_number": page,
                "status": "completed",
                "progress": 100,
                "cached": True,
                "model_used": cached["model_used"],
                "output_url": output_url
            })
        else:
            create_job(job_id, req.profile_id or "anonymous", page, req.tier, model_name)
            bg_tasks.add_task(
                _run_page_render_job,
                job_id=job_id,
                page_number=page,
                baby_photo_path=baby_path,
                baby_photo_hash=baby_hash,
                pet_photo_path=pet_path,
                pet_photo_hash=pet_hash,
                child_name=req.child_name,
                child_age=req.child_age,
                pet_name=req.pet_name,
                tier=req.tier
            )
            jobs_response.append({
                "job_id": job_id,
                "page_number": page,
                "status": "processing",
                "progress": 15,
                "cached": False,
                "model_used": model_name,
                "output_url": None
            })

    return {"jobs": jobs_response}


@app.get("/api/book/jobs/{job_id}")
def check_job_status(job_id: str):
    """Returns the live status, progress percentage, and output_url of a render job."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(404, "Job no encontrado.")
    return job


class PDFGenerateRequest(BaseModel):
    profile_id: Optional[str] = None
    edition: str = "hardcover"  # "hardcover" | "softcover" | "digital"
    trim_preset: str = "8x8_in"  # "8x8_in" | "200x200_mm"
    language: str = "es"
    child_name: str = "Liam"
    age_label: str = "10 meses"
    pet_name: str = "Roxy"
    pet_sound: str = "Guau, guau"
    dedication_text: str = "Que la magia de tu primera Navidad brille siempre en tu corazón."
    sender_signature: str = "Mamá y Papá"
    custom_year: str = "2026"
    is_sample: bool = True
    include_crop_marks: bool = True
    order_ref: Optional[str] = None
    rendered_pages: Dict[int, str] = {}
    custom_page_texts: Dict[int, str] = {}


def _run_pdf_generation_job(job_id: str, req: PDFGenerateRequest):
    try:
        update_pdf_job(job_id, status="processing", progress=25)

        # Ensure ALL 9 illustrated scene spreads (1, 3, 5, 7, 9, 11, 13, 15, 17) are ALWAYS composed
        # with the user's uploaded photos (when profile exists) or default character sprites.
        composed_pages: Dict[int, str] = {int(k): v for k, v in (req.rendered_pages or {}).items()}
        profile = get_profile(req.profile_id) if req.profile_id and req.profile_id != "anonymous" else None
        baby_path = Path(profile["baby_photo_path"]) if (profile and profile.get("baby_photo_path")) else None
        baby_hash = (profile.get("baby_photo_hash") if profile else None) or "default_baby_sprite"
        pet_path = Path(profile["pet_photo_path"]) if (profile and profile.get("pet_photo_path")) else None
        pet_hash = (profile.get("pet_photo_hash") if profile else None) or "default_roxy"
        tier = "preview" if req.is_sample else "final"
        child_age_months = parse_age_months(req.age_label)
        for p_num in (1, 3, 5, 7, 9, 11, 13, 15, 17):
            if p_num not in composed_pages:
                out_url, _, _ = image_engine.render_page(
                    page_number=p_num,
                    baby_photo_path=baby_path,
                    baby_photo_hash=baby_hash,
                    pet_photo_path=pet_path,
                    pet_photo_hash=pet_hash,
                    child_name=req.child_name,
                    child_age=child_age_months,
                    pet_name=req.pet_name,
                    tier=tier,
                    # Restrict live GenAI image synthesis strictly to Page 1 cover when uncached;
                    # remaining scene spreads reuse local high-res sprite compositing ($0.00 API cost).
                    force_fast_composite=bool(p_num > 1 or req.is_sample or not profile),
                )
                composed_pages[p_num] = out_url

        update_pdf_job(job_id, status="processing", progress=55)
        result = pdf_layout_engine.generate_book_pdfs(
            job_id=job_id,
            edition=req.edition if req.edition in ("hardcover", "softcover", "digital") else "hardcover",
            trim_preset=req.trim_preset,
            language=req.language,
            child_name=req.child_name,
            age_label=req.age_label,
            pet_name=req.pet_name,
            pet_sound=req.pet_sound,
            dedication_text=req.dedication_text,
            sender_signature=req.sender_signature,
            custom_year=req.custom_year,
            is_sample=req.is_sample,
            include_crop_marks=req.include_crop_marks,
            rendered_pages=composed_pages,
            custom_page_texts=req.custom_page_texts,
        )
        # Optional bidirectional vault upload when linked to a confirmed order_ref
        if req.order_ref and odoo_client.is_configured:
            try:
                vault_res = odoo_service.attach_pdf_to_order(
                    order_ref=req.order_ref,
                    pdf_path_or_url=result["interior_path"],
                    child_name=req.child_name,
                    trigger_digital_delivery=not req.is_sample,
                )
                result["prepress_report"]["odoo_vault_sync"] = vault_res
            except Exception as vault_exc:
                logger.warning(f"Odoo PDF vault sync failed for order {req.order_ref}: {vault_exc}")
                result["prepress_report"]["odoo_vault_error"] = str(vault_exc)
        elif req.order_ref and TEST_MODE:
            sim_row = get_odoo_idempotency(f"sim_order:{req.order_ref}")
            sim_data = json.loads(sim_row["response_json"]) if sim_row else {
                "status": "simulated_test_mode",
                "test_mode": True,
                "order_ref": req.order_ref,
                "state": "confirmed_local",
                "payment_verified": True,
                "payment_mode": "simulated_test_approved",
                "attachments": [],
                "pickings": [],
            }
            att_entry = {
                "id": 1,
                "name": Path(result["interior_path"]).name,
                "download_url": result["interior_pdf_url"],
            }
            sim_data["attachments"] = [att_entry]
            sim_data["digital_delivery_sent"] = True
            save_odoo_idempotency(f"sim_order:{req.order_ref}", "simulated_order", None, json.dumps(sim_data))
            result["prepress_report"]["odoo_vault_sync"] = {
                "status": "attached",
                "order_ref": req.order_ref,
                "attachment_id": 1,
                "download_url": result["interior_pdf_url"],
                "payment_verified": True,
                "attachments": [att_entry],
            }

        update_pdf_job(
            job_id,
            status="completed",
            progress=100,
            interior_pdf_url=result["interior_pdf_url"],
            cover_pdf_url=result["cover_pdf_url"],
            prepress_report=json.dumps(result["prepress_report"], ensure_ascii=False),
        )
        logger.info(f"PDF Job {job_id} completed ({result['interior_pdf_url']}).")
    except Exception as e:
        logger.error(f"PDF Job {job_id} failed: {e}")
        update_pdf_job(job_id, status="failed", error_message=str(e))


@app.post("/api/book/generate-pdf")
async def generate_book_pdf(req: PDFGenerateRequest, bg_tasks: BackgroundTasks):
    """
    Dispatches asynchronous ReportLab 300 DPI PDF generation (Interior 24-page + Full-Wrap Cover)
    without re-invoking the generative image API.
    """
    job_id = str(uuid.uuid4())
    create_pdf_job(job_id, req.profile_id or "anonymous", req.edition, req.is_sample)
    bg_tasks.add_task(_run_pdf_generation_job, job_id=job_id, req=req)
    return {
        "job_id": job_id,
        "status": "queued",
        "progress": 10,
        "edition": req.edition,
        "is_sample": req.is_sample,
    }


@app.get("/api/book/pdf-jobs/{job_id}")
def check_pdf_job_status(job_id: str):
    """Returns live status, progress, PDF download URLs, and prepress audit report."""
    job = get_pdf_job(job_id)
    if not job:
        raise HTTPException(404, "PDF job no encontrado.")
    if job.get("prepress_report"):
        try:
            job["prepress_report"] = json.loads(job["prepress_report"])
        except (json.JSONDecodeError, TypeError) as exc:
            logger.warning(f"Corrupt prepress_report JSON on PDF job {job_id}: {exc}")
            job["prepress_report_error"] = str(exc)
    return job


# ==============================================================================
# ODOO 20 ENTERPRISE BIDIRECTIONAL INTEGRATION ENDPOINTS (/api/odoo/*)
# ==============================================================================


class OdooLeadEventRequest(BaseModel):
    visitor_id: Optional[str] = None
    idempotency_key: Optional[str] = None
    event_type: str = "lead_captured"
    email: Optional[str] = None
    buyer_email: Optional[str] = None
    name: Optional[str] = None
    buyer_name: Optional[str] = None
    country: str = "US"
    child_name: str = "Liam"
    age_value: int = 10
    age_unit: str = "months"
    pet_name: str = "Roxy"
    collection_id: str = "my_first_christmas_24p"
    tier: str = "hardcover"


class OdooWaitlistRequest(BaseModel):
    email: str
    name: str = ""
    product_id: str = ""
    product_title: str = ""
    discount_percent: int = 10
    language: str = "es"
    idempotency_key: Optional[str] = None


class OdooBuyerPayload(BaseModel):
    name: str
    email: str
    country: str = "US"


class OdooProtagonistPayload(BaseModel):
    child_name: str = "Liam"
    age_value: int = 10
    age_unit: str = "months"
    pet_name: str = "Roxy"
    pet_sound: str = "Guau, guau"
    collection_id: str = "my_first_christmas_24p"
    dedication: str = ""
    baby_asset_id: str = "default"
    pet_asset_id: str = "default"


class OdooShippingAddressPayload(BaseModel):
    street: str = ""
    city: str = ""
    state: str = ""
    postal_code: str = ""
    country: str = "US"


class OdooOrderDetailsPayload(BaseModel):
    tier: str = "hardcover"
    quantity: int = 1
    unit_price: Optional[float] = None
    volume_discount_pct: Optional[float] = None
    coupon_code: str = ""
    coupon_discount_amount: Optional[float] = None
    shipping_fee: float = 0.0
    currency: str = "USD"
    shipping_address: Optional[OdooShippingAddressPayload] = None


class OdooSaleOrderRequest(BaseModel):
    idempotency_key: str
    buyer: OdooBuyerPayload
    protagonist: OdooProtagonistPayload
    order: OdooOrderDetailsPayload
    confirm_immediately: bool = True


class OdooAttachPdfRequest(BaseModel):
    pdf_base64: Optional[str] = None
    pdf_path_or_url: Optional[str] = None
    child_name: str = "Libro"
    filename: Optional[str] = None
    trigger_digital_delivery: bool = True


def _raise_odoo_http_error(exc: Exception) -> None:
    if isinstance(exc, ValueError):
        raise HTTPException(status_code=400, detail=str(exc))
    if isinstance(exc, FileNotFoundError):
        raise HTTPException(status_code=404, detail=str(exc))
    if isinstance(exc, OdooAPIError):
        status = exc.status_code if exc.status_code in (400, 401, 403, 404, 422) else 502
        raise HTTPException(status_code=status, detail=str(exc))
    raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/odoo/health")
def odoo_health():
    """Checks live connectivity, Odoo server version, and installed module support."""
    return odoo_client.health_check()


@app.post("/api/odoo/lead-event")
def odoo_lead_event(req: OdooLeadEventRequest):
    """Filters anonymous visitors (returns local_only) and idempotently syncs email leads."""
    if not odoo_client.is_configured and TEST_MODE:
        return {
            "status": "simulated_test_mode",
            "synced_to_odoo": False,
            "test_mode": True,
            "visitor_id": req.visitor_id or "",
            "event_type": req.event_type,
        }
    try:
        return odoo_service.sync_lead_event(req.model_dump())
    except Exception as exc:
        _raise_odoo_http_error(exc)


@app.post("/api/odoo/waitlist")
def odoo_waitlist(req: OdooWaitlistRequest):
    """Registers or updates a waitlist prospect with WAITLIST10 coupon tagging."""
    if not odoo_client.is_configured and TEST_MODE:
        return {
            "status": "simulated_test_mode",
            "synced_to_odoo": False,
            "test_mode": True,
            "assigned_coupon_code": "WAITLIST10",
            "discount_percent": req.discount_percent,
        }
    try:
        return odoo_service.sync_waitlist(req.model_dump())
    except Exception as exc:
        _raise_odoo_http_error(exc)


@app.post("/api/odoo/sale-order")
def odoo_create_sale_order(req: OdooSaleOrderRequest):
    """Creates an independent `sale.order` per personalized book under shared buyer `res.partner`."""
    if not odoo_client.is_configured and TEST_MODE:
        sim_key = f"sim_order:{req.idempotency_key}"
        cached = get_odoo_idempotency(sim_key)
        if cached:
            return json.loads(cached["response_json"])
        sim_res = {
            "status": "simulated_test_mode",
            "test_mode": True,
            "order_id": None,
            "order_name": req.idempotency_key,
            "order_ref": req.idempotency_key,
            "state": "confirmed_local",
            "payment_verified": True,
            "payment_mode": "simulated_test_approved",
            "payment_tx_id": f"TEST-PAY-{req.idempotency_key}",
            "portal_url": "",
            "attachments": [],
            "pickings": [],
            "protagonist": req.protagonist.model_dump(),
        }
        save_odoo_idempotency(sim_key, "simulated_order", None, json.dumps(sim_res))
        return sim_res
    try:
        return odoo_service.create_sale_order(
            req.model_dump(),
            confirm_immediately=req.confirm_immediately,
        )
    except Exception as exc:
        _raise_odoo_http_error(exc)


@app.post("/api/odoo/sale-order/{order_ref}/attach-pdf")
def odoo_attach_pdf(order_ref: str, req: OdooAttachPdfRequest):
    """Uploads high-res PDF into Odoo `ir.attachment` + Documents vault and triggers digital email delivery."""
    if not odoo_client.is_configured and TEST_MODE:
        sim_key = f"sim_order:{order_ref}"
        cached = get_odoo_idempotency(sim_key)
        sim_data = json.loads(cached["response_json"]) if cached else {
            "status": "simulated_test_mode",
            "test_mode": True,
            "order_ref": order_ref,
            "state": "confirmed_local",
            "payment_verified": True,
            "attachments": [],
        }
        dl_url = req.pdf_path_or_url or ""
        att_entry = {"id": 1, "name": req.filename or f"{order_ref}.pdf", "download_url": dl_url}
        sim_data["attachments"] = [att_entry]
        sim_data["digital_delivery_sent"] = True
        save_odoo_idempotency(sim_key, "simulated_order", None, json.dumps(sim_data))
        return {
            "status": "simulated_test_mode",
            "test_mode": True,
            "order_ref": order_ref,
            "attachment_id": 1,
            "download_url": dl_url,
            "attachments": [att_entry],
            "digital_delivery_triggered": True,
        }
    try:
        return odoo_service.attach_pdf_to_order(
            order_ref=order_ref,
            pdf_base64=req.pdf_base64,
            pdf_path_or_url=req.pdf_path_or_url,
            child_name=req.child_name,
            filename=req.filename,
            trigger_digital_delivery=req.trigger_digital_delivery,
        )
    except Exception as exc:
        _raise_odoo_http_error(exc)


class OdooFulfillRequest(BaseModel):
    carrier_tracking_ref: str = ""
    carrier_name: str = "Standard delivery"
    simulate_payment: bool = True
    validate_picking: bool = True


@app.post("/api/odoo/sale-order/{order_ref}/fulfill")
def odoo_fulfill_order(order_ref: str, req: OdooFulfillRequest):
    """Executes picking validation/tracking, invoice creation, and simulated payment in Odoo."""
    if not odoo_client.is_configured and TEST_MODE:
        return {
            "status": "simulated_test_mode",
            "test_mode": True,
            "order_ref": order_ref,
            "state": "confirmed_local",
            "payment_verified": True,
            "attachments": [],
            "pickings": [],
        }
    try:
        return odoo_service.fulfill_and_invoice_order(
            order_ref=order_ref,
            carrier_tracking_ref=req.carrier_tracking_ref,
            carrier_name=req.carrier_name,
            simulate_payment=req.simulate_payment,
            validate_picking=req.validate_picking,
        )
    except Exception as exc:
        _raise_odoo_http_error(exc)


@app.get("/api/odoo/orders/{order_ref}")
def odoo_get_order(order_ref: str):
    """Reverse lookup from Odoo for order status, portal link, invoices, PDFs, and delivery status."""
    if not odoo_client.is_configured and TEST_MODE:
        cached = get_odoo_idempotency(f"sim_order:{order_ref}")
        if cached:
            return json.loads(cached["response_json"])
        return {
            "status": "simulated_test_mode",
            "test_mode": True,
            "order_ref": order_ref,
            "state": "confirmed_local",
            "payment_verified": True,
            "portal_url": "",
            "attachments": [],
            "pickings": [],
        }
    try:
        return odoo_service.get_order_status(order_ref)
    except Exception as exc:
        _raise_odoo_http_error(exc)


@app.get("/api/odoo/customers/{email}/orders")
def odoo_get_customer_orders(email: str):
    """Lists all independent orders owned by a single customer email in Odoo."""
    if not odoo_client.is_configured and TEST_MODE:
        return {
            "status": "simulated_test_mode",
            "test_mode": True,
            "email": email.strip().lower(),
            "partner_count": 0,
            "orders": [],
        }
    try:
        return odoo_service.get_customer_orders(email)
    except Exception as exc:
        _raise_odoo_http_error(exc)


# ==============================================================================
# SAFE SINGLE-ORIGIN FRONTEND SERVING (Strictly allowlisted public web assets)
# ==============================================================================

PUBLIC_WEB_FILES = {
    "index.html",
    "styles.css",
    "roxytales.bundle.js",
    "config.js",
    "app.js",
    "odooService.js",
    "admin.js",
    "adminService.js",
    "RoxyCharacter.jpg",
    "RoxyCharacterSheet.jpg",
    "Example01.jpg",
    "Example02.jpg",
}


@app.get("/", include_in_schema=False)
def serve_frontend_root():
    return FileResponse(BASE_DIR / "index.html")


@app.get("/{filename}", include_in_schema=False)
def serve_public_web_file(filename: str):
    if filename not in PUBLIC_WEB_FILES:
        raise HTTPException(status_code=404, detail="Not found")
    target = BASE_DIR / filename
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(target)
