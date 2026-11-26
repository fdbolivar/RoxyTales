"""
Database layer for RoxyTales (SQLite with clean abstractions ready for PostgreSQL).
Manages profiles, sha-256 render caching, and asynchronous job states.
"""

import sqlite3
import time
from contextlib import contextmanager
from datetime import datetime
from typing import Optional, Dict, Any
from backend.config import DB_PATH


@contextmanager
def get_db():
    conn = sqlite3.connect(str(DB_PATH), timeout=15.0)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # User uploaded photo profiles
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY,
                baby_photo_path TEXT,
                baby_photo_hash TEXT,
                pet_photo_path TEXT,
                pet_photo_hash TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # SHA-256 Render Cache (Guarantees zero duplicate API spend)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS render_cache (
                cache_key TEXT PRIMARY KEY,
                template_id INTEGER,
                model_used TEXT,
                resolution TEXT,
                output_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Asynchronous Render Jobs
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS render_jobs (
                job_id TEXT PRIMARY KEY,
                profile_id TEXT,
                page_number INTEGER,
                tier TEXT,
                status TEXT,
                progress INTEGER DEFAULT 0,
                model_used TEXT,
                output_url TEXT,
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Persistent per-IP 24h free preview quota
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS preview_quota (
                ip_address TEXT NOT NULL,
                created_at REAL NOT NULL
            )
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_preview_quota_ip_ts
            ON preview_quota (ip_address, created_at)
        """)

        # Idempotency store for Odoo CRM / Sale Order / Attachment sync
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS odoo_idempotency (
                idempotency_key TEXT PRIMARY KEY,
                resource_type TEXT NOT NULL,
                odoo_id INTEGER,
                response_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Asynchronous ReportLab PDF Generation Jobs
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pdf_jobs (
                job_id TEXT PRIMARY KEY,
                profile_id TEXT,
                edition TEXT,
                is_sample INTEGER DEFAULT 1,
                status TEXT,
                progress INTEGER DEFAULT 0,
                interior_pdf_url TEXT,
                cover_pdf_url TEXT,
                prepress_report TEXT,
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Persistent per-IP 24h free preview quota
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS preview_quota (
                ip_address TEXT NOT NULL,
                created_at REAL NOT NULL
            )
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_preview_quota_ip_ts
            ON preview_quota (ip_address, created_at)
        """)

        # Idempotency store for Odoo CRM / Sale Order / Attachment sync
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS odoo_idempotency (
                idempotency_key TEXT PRIMARY KEY,
                resource_type TEXT NOT NULL,
                odoo_id INTEGER,
                response_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)


def create_profile(profile_id: str, baby_path: Optional[str], baby_hash: Optional[str],
                   pet_path: Optional[str], pet_hash: Optional[str]) -> Dict[str, Any]:
    with get_db() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO profiles (id, baby_photo_path, baby_photo_hash, pet_photo_path, pet_photo_hash)
            VALUES (?, ?, ?, ?, ?)
        """, (profile_id, baby_path, baby_hash, pet_path, pet_hash))
    return {
        "id": profile_id,
        "baby_photo_path": baby_path,
        "baby_photo_hash": baby_hash,
        "pet_photo_path": pet_path,
        "pet_photo_hash": pet_hash
    }


def get_profile(profile_id: str) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM profiles WHERE id = ?", (profile_id,)).fetchone()
        return dict(row) if row else None


def get_cached_render(cache_key: str) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM render_cache WHERE cache_key = ?", (cache_key,)).fetchone()
        return dict(row) if row else None


def save_render_cache(cache_key: str, template_id: int, model_used: str, resolution: str, output_path: str):
    with get_db() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO render_cache (cache_key, template_id, model_used, resolution, output_path)
            VALUES (?, ?, ?, ?, ?)
        """, (cache_key, template_id, model_used, resolution, output_path))


def create_job(job_id: str, profile_id: str, page_number: int, tier: str, model_used: str) -> Dict[str, Any]:
    with get_db() as conn:
        conn.execute("""
            INSERT INTO render_jobs (job_id, profile_id, page_number, tier, status, progress, model_used)
            VALUES (?, ?, ?, ?, 'queued', 10, ?)
        """, (job_id, profile_id, page_number, tier, model_used))
    return {
        "job_id": job_id,
        "profile_id": profile_id,
        "page_number": page_number,
        "tier": tier,
        "status": "queued",
        "progress": 10,
        "model_used": model_used
    }


def update_job(job_id: str, status: Optional[str] = None, progress: Optional[int] = None,
               output_url: Optional[str] = None, error_message: Optional[str] = None):
    fields = ["updated_at = CURRENT_TIMESTAMP"]
    params = []
    
    if status is not None:
        fields.append("status = ?")
        params.append(status)
    if progress is not None:
        fields.append("progress = ?")
        params.append(progress)
    if output_url is not None:
        fields.append("output_url = ?")
        params.append(output_url)
    if error_message is not None:
        fields.append("error_message = ?")
        params.append(error_message)
        
    params.append(job_id)
    query = f"UPDATE render_jobs SET {', '.join(fields)} WHERE job_id = ?"
    with get_db() as conn:
        conn.execute(query, params)


def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM render_jobs WHERE job_id = ?", (job_id,)).fetchone()
        return dict(row) if row else None


def create_pdf_job(job_id: str, profile_id: str, edition: str, is_sample: bool = True) -> Dict[str, Any]:
    with get_db() as conn:
        conn.execute("""
            INSERT INTO pdf_jobs (job_id, profile_id, edition, is_sample, status, progress)
            VALUES (?, ?, ?, ?, 'queued', 10)
        """, (job_id, profile_id, edition, 1 if is_sample else 0))
    return {
        "job_id": job_id,
        "profile_id": profile_id,
        "edition": edition,
        "is_sample": is_sample,
        "status": "queued",
        "progress": 10
    }


def update_pdf_job(
    job_id: str,
    status: Optional[str] = None,
    progress: Optional[int] = None,
    interior_pdf_url: Optional[str] = None,
    cover_pdf_url: Optional[str] = None,
    prepress_report: Optional[str] = None,
    error_message: Optional[str] = None
):
    fields = ["updated_at = CURRENT_TIMESTAMP"]
    params = []

    if status is not None:
        fields.append("status = ?")
        params.append(status)
    if progress is not None:
        fields.append("progress = ?")
        params.append(progress)
    if interior_pdf_url is not None:
        fields.append("interior_pdf_url = ?")
        params.append(interior_pdf_url)
    if cover_pdf_url is not None:
        fields.append("cover_pdf_url = ?")
        params.append(cover_pdf_url)
    if prepress_report is not None:
        fields.append("prepress_report = ?")
        params.append(prepress_report)
    if error_message is not None:
        fields.append("error_message = ?")
        params.append(error_message)

    params.append(job_id)
    query = f"UPDATE pdf_jobs SET {', '.join(fields)} WHERE job_id = ?"
    with get_db() as conn:
        conn.execute(query, params)


def get_pdf_job(job_id: str) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM pdf_jobs WHERE job_id = ?", (job_id,)).fetchone()
        return dict(row) if row else None


def check_and_record_preview_quota(client_ip: str, max_previews: int, window_seconds: int) -> bool:
    """Atomically checks and records a 24h free preview quota slot in SQLite."""
    now = time.time()
    cutoff = now - window_seconds
    with get_db() as conn:
        conn.execute("DELETE FROM preview_quota WHERE created_at <= ?", (cutoff,))
        row = conn.execute(
            "SELECT COUNT(*) AS cnt FROM preview_quota WHERE ip_address = ?",
            (client_ip,),
        ).fetchone()
        count = int(row["cnt"]) if row else 0
        if count >= max_previews:
            return False
        conn.execute(
            "INSERT INTO preview_quota (ip_address, created_at) VALUES (?, ?)",
            (client_ip, now),
        )
        return True


def get_odoo_idempotency(idempotency_key: str) -> Optional[Dict[str, Any]]:
    try:
        with get_db() as conn:
            row = conn.execute(
                "SELECT * FROM odoo_idempotency WHERE idempotency_key = ?",
                (idempotency_key,),
            ).fetchone()
            return dict(row) if row else None
    except sqlite3.OperationalError:
        init_db()
        return None


def save_odoo_idempotency(
    idempotency_key: str,
    resource_type: str,
    odoo_id: Optional[int],
    response_json: str,
) -> None:
    init_db()
    with get_db() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO odoo_idempotency (idempotency_key, resource_type, odoo_id, response_json)
            VALUES (?, ?, ?, ?)
            """,
            (idempotency_key, resource_type, odoo_id, response_json),
        )
