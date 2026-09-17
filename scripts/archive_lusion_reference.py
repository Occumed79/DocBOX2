#!/usr/bin/env python3
"""Archive the public Lusion reference site and runtime assets into DocBOX2.

This is intentionally isolated from the application runtime. It crawls lusion.co and
lusion.dev, follows same-site HTML/JS/CSS/JSON references, downloads binary runtime
assets (including .buf/.webp/.ogg/fonts/etc.), and writes a reproducible manifest.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import sys
import time
from collections import deque
from pathlib import Path
from urllib.parse import urljoin, urlparse, urldefrag, unquote

import requests
from bs4 import BeautifulSoup

ROOT = Path("docs/research/lusion-reference/raw-site")
ROOT.mkdir(parents=True, exist_ok=True)

SEEDS = [
    "https://lusion.co/",
    "https://lusion.co/about",
    "https://lusion.co/robots.txt",
    "https://lusion.co/sitemap.xml",
]

ALLOWED_HOSTS = {
    "lusion.co",
    "www.lusion.co",
    "lusion.dev",
    "www.lusion.dev",
}

TEXT_TYPES = (
    "text/",
    "application/javascript",
    "application/x-javascript",
    "application/json",
    "application/xml",
    "application/xhtml+xml",
    "image/svg+xml",
)

ASSET_EXTS = {
    ".js", ".mjs", ".css", ".json", ".xml", ".txt", ".html", ".htm",
    ".buf", ".bin", ".wasm", ".glb", ".gltf",
    ".webp", ".png", ".jpg", ".jpeg", ".gif", ".avif", ".svg", ".ico",
    ".ogg", ".mp3", ".wav", ".m4a", ".mp4", ".webm",
    ".woff", ".woff2", ".ttf", ".otf", ".eot",
}

# Known About-scene assets recovered during the earlier investigation. These are
# seeded explicitly in addition to recursive discovery so the archive does not
# depend on a specific bundle traversal order.
KNOWN_ABOUT_ASSETS = [
    "bg_box.buf",
    "camera_spline.buf",
    "letter_placements.buf",
    "logo_text.buf",
    "person.buf",
    "person_idle.buf",
    "terrain.buf",
    "terrain_lines.buf",
]
for name in KNOWN_ABOUT_ASSETS:
    SEEDS.extend([
        f"https://lusion.co/assets/models/about/{name}",
        f"https://lusion.dev/assets/models/about/{name}",
    ])

MAX_URLS = int(os.environ.get("LUSION_MAX_URLS", "6000"))
MAX_TOTAL_BYTES = int(os.environ.get("LUSION_MAX_TOTAL_BYTES", str(750 * 1024 * 1024)))
MAX_FILE_BYTES = int(os.environ.get("LUSION_MAX_FILE_BYTES", str(95 * 1024 * 1024)))
REQUEST_TIMEOUT = int(os.environ.get("LUSION_REQUEST_TIMEOUT", "30"))

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36",
    "Accept": "*/*",
})

queue: deque[str] = deque(SEEDS)
seen: set[str] = set()
queued: set[str] = set(SEEDS)
manifest: list[dict] = []
failures: list[dict] = []
total_bytes = 0

ABS_URL_RE = re.compile(r"https?://[^\s\"'<>\\)]+", re.I)
ROOT_PATH_RE = re.compile(
    r"(?P<q>[\"'])(?P<path>/(?:_astro|assets|projects|about|work|api)/[^\"']+)(?P=q)",
    re.I,
)
ASSET_LITERAL_RE = re.compile(
    r"(?P<q>[\"'])(?P<path>(?:\.\.?/|/)?[^\"']+?\.(?:js|mjs|css|json|xml|buf|bin|wasm|glb|gltf|webp|png|jpe?g|gif|avif|svg|ico|ogg|mp3|wav|m4a|mp4|webm|woff2?|ttf|otf|eot)(?:\?[^\"']*)?)(?P=q)",
    re.I,
)
CSS_URL_RE = re.compile(r"url\((?:[\"']?)([^)\"']+)(?:[\"']?)\)", re.I)


def canonicalize(url: str, base: str | None = None) -> str | None:
    if base:
        url = urljoin(base, url)
    url, _ = urldefrag(url.strip())
    if not url.startswith(("http://", "https://")):
        return None
    parsed = urlparse(url)
    host = parsed.hostname.lower() if parsed.hostname else ""
    if host not in ALLOWED_HOSTS:
        return None
    # Normalize the host to reduce duplicate www/non-www captures while retaining
    # lusion.dev as a distinct origin.
    if host == "www.lusion.co":
        host = "lusion.co"
    elif host == "www.lusion.dev":
        host = "lusion.dev"
    netloc = host
    if parsed.port:
        netloc += f":{parsed.port}"
    path = parsed.path or "/"
    return parsed._replace(netloc=netloc, path=path, fragment="").geturl()


def enqueue(url: str, base: str | None = None) -> None:
    normalized = canonicalize(url, base)
    if not normalized or normalized in seen or normalized in queued:
        return
    if len(seen) + len(queue) >= MAX_URLS:
        return
    queued.add(normalized)
    queue.append(normalized)


def safe_path(url: str, content_type: str) -> Path:
    parsed = urlparse(url)
    host = parsed.hostname or "unknown-host"
    raw_path = unquote(parsed.path or "/")
    if raw_path.endswith("/"):
        raw_path += "index.html"
    elif not Path(raw_path).suffix and "text/html" in content_type:
        raw_path += "/index.html"
    rel = raw_path.lstrip("/") or "index.html"
    # Strip dangerous path segments and characters while preserving recognizable names.
    parts = []
    for part in Path(rel).parts:
        if part in ("", ".", ".."):
            continue
        parts.append(re.sub(r"[^A-Za-z0-9._@+()\[\] -]", "_", part)[:180])
    if not parts:
        parts = ["index.html"]
    target = ROOT / host / Path(*parts)
    if parsed.query:
        digest = hashlib.sha256(parsed.query.encode()).hexdigest()[:12]
        target = target.with_name(f"{target.stem}__q_{digest}{target.suffix}")
    return target


def discover(text: str, base_url: str, content_type: str) -> None:
    # HTML parser catches conventional links, script/module tags, preload assets, srcset, etc.
    if "html" in content_type or "xhtml" in content_type:
        try:
            soup = BeautifulSoup(text, "html.parser")
            for tag in soup.find_all(True):
                for attr in ("href", "src", "data-src", "data-url", "poster"):
                    val = tag.get(attr)
                    if isinstance(val, str):
                        enqueue(val, base_url)
                srcset = tag.get("srcset")
                if isinstance(srcset, str):
                    for item in srcset.split(","):
                        enqueue(item.strip().split(" ")[0], base_url)
        except Exception:
            pass

    for match in ABS_URL_RE.finditer(text):
        enqueue(match.group(0), base_url)
    for match in ROOT_PATH_RE.finditer(text):
        enqueue(match.group("path"), base_url)
    for match in ASSET_LITERAL_RE.finditer(text):
        enqueue(match.group("path"), base_url)
    for match in CSS_URL_RE.finditer(text):
        enqueue(match.group(1), base_url)

    # Extra broad sweep for Astro-generated root paths embedded without quotes that
    # still end in a known runtime extension.
    for token in re.findall(r"/(?:_astro|assets)/[^\s\"'<>`]+", text):
        cleaned = token.rstrip(",;)]}")
        suffix = Path(urlparse(cleaned).path).suffix.lower()
        if suffix in ASSET_EXTS or "/_astro/" in cleaned:
            enqueue(cleaned, base_url)


def write_failure(entry: dict) -> None:
    failures.append(entry)
    print(f"[MISS] {entry.get('url')} :: {entry.get('error') or entry.get('status')}")


while queue and len(seen) < MAX_URLS and total_bytes < MAX_TOTAL_BYTES:
    url = queue.popleft()
    queued.discard(url)
    if url in seen:
        continue
    seen.add(url)

    try:
        resp = session.get(url, timeout=REQUEST_TIMEOUT, allow_redirects=True, stream=True)
    except Exception as exc:
        write_failure({"url": url, "error": repr(exc)})
        continue

    final_url = canonicalize(resp.url) or url
    status = resp.status_code
    content_type = resp.headers.get("content-type", "application/octet-stream").split(";")[0].strip().lower()
    if status >= 400:
        write_failure({"url": url, "finalUrl": final_url, "status": status})
        continue

    chunks = []
    size = 0
    too_large = False
    try:
        for chunk in resp.iter_content(chunk_size=256 * 1024):
            if not chunk:
                continue
            size += len(chunk)
            if size > MAX_FILE_BYTES or total_bytes + size > MAX_TOTAL_BYTES:
                too_large = True
                break
            chunks.append(chunk)
    finally:
        resp.close()

    if too_large:
        write_failure({"url": url, "finalUrl": final_url, "error": "size-cap", "bytesRead": size})
        continue

    data = b"".join(chunks)
    target = safe_path(final_url, content_type)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    total_bytes += len(data)

    sha = hashlib.sha256(data).hexdigest()
    manifest.append({
        "url": url,
        "finalUrl": final_url,
        "path": str(target),
        "status": status,
        "contentType": content_type,
        "bytes": len(data),
        "sha256": sha,
    })
    print(f"[OK] {len(data):>9} {content_type:<32} {final_url}")

    if content_type.startswith(TEXT_TYPES) or Path(urlparse(final_url).path).suffix.lower() in {".js", ".mjs", ".css", ".json", ".xml", ".html", ".svg"}:
        try:
            text = data.decode(resp.encoding or "utf-8", errors="replace")
            discover(text, final_url, content_type)
        except Exception as exc:
            write_failure({"url": final_url, "error": f"discover-failed: {exc!r}"})

# Write deterministic indexes.
manifest.sort(key=lambda x: x["finalUrl"])
(ROOT / "archive-manifest.json").write_text(
    json.dumps({
        "generatedAtUtc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "resourceCount": len(manifest),
        "totalBytes": total_bytes,
        "hosts": sorted(ALLOWED_HOSTS),
        "resources": manifest,
        "failures": failures,
    }, indent=2),
    encoding="utf-8",
)
(ROOT / "resource-urls.txt").write_text(
    "\n".join(item["finalUrl"] for item in manifest) + "\n",
    encoding="utf-8",
)
(ROOT / "missing-or-blocked.txt").write_text(
    "\n".join(json.dumps(item, sort_keys=True) for item in failures) + ("\n" if failures else ""),
    encoding="utf-8",
)

print("\n=== LUSION ARCHIVE COMPLETE ===")
print(f"Resources: {len(manifest)}")
print(f"Bytes:     {total_bytes}")
print(f"Failures:  {len(failures)}")
print(f"Output:    {ROOT}")

# Treat an empty archive as a hard failure so GitHub Actions cannot falsely report success.
if not manifest:
    sys.exit(2)
