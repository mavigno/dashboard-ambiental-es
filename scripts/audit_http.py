#!/usr/bin/env python3
"""Registra uma consulta HTTP pequena sem persistir o corpo por padrão."""

from __future__ import annotations

import argparse
import hashlib
import json
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-id", required=True)
    parser.add_argument("--url", required=True)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--timeout", type=float, default=30.0)
    parser.add_argument("--max-bytes", type=int, default=5_000_000)
    parser.add_argument("--save-body", type=Path)
    args = parser.parse_args()

    started = utc_now()
    monotonic_started = time.monotonic()
    record: dict[str, object] = {
        "schema_version": 1,
        "source_id": args.source_id,
        "url": args.url,
        "method": "GET",
        "started_utc": started,
        "collector": "scripts/audit_http.py",
    }
    body = b""
    try:
        request = urllib.request.Request(
            args.url,
            headers={"User-Agent": "AuditoriaAmbientalES/0.1 (+public-data-research)"},
        )
        with urllib.request.urlopen(request, timeout=args.timeout) as response:
            body = response.read(args.max_bytes + 1)
            truncated = len(body) > args.max_bytes
            if truncated:
                body = body[: args.max_bytes]
            headers = response.headers
            record.update(
                status="ok",
                http_status=response.status,
                final_url=response.url,
                content_type=headers.get("Content-Type"),
                content_length_header=headers.get("Content-Length"),
                etag=headers.get("ETag"),
                last_modified=headers.get("Last-Modified"),
                retrieved_bytes=len(body),
                truncated=truncated,
                sha256=hashlib.sha256(body).hexdigest(),
            )
    except urllib.error.HTTPError as error:
        body = error.read(args.max_bytes)
        record.update(
            status="http_error",
            http_status=error.code,
            final_url=error.geturl(),
            content_type=error.headers.get("Content-Type"),
            retrieved_bytes=len(body),
            sha256=hashlib.sha256(body).hexdigest(),
            error=str(error),
        )
    except Exception as error:  # network and protocol errors are evidence
        record.update(status="request_error", error=f"{type(error).__name__}: {error}")

    record["finished_utc"] = utc_now()
    record["duration_ms"] = round((time.monotonic() - monotonic_started) * 1000, 1)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("a", encoding="utf-8") as stream:
        stream.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")

    if args.save_body and body:
        args.save_body.parent.mkdir(parents=True, exist_ok=True)
        args.save_body.write_bytes(body)
    print(json.dumps(record, ensure_ascii=False, indent=2, sort_keys=True))
    return 0 if record["status"] == "ok" else 1


if __name__ == "__main__":
    raise SystemExit(main())

