#!/usr/bin/env python3
"""Archive the public Lusion reference site and runtime assets into DocBOX2.

Isolated research tooling only: crawl lusion.co/lusion.dev, follow HTML/JS/CSS/JSON
references, download binary runtime assets, and write a reproducible manifest.
"""

from __future__ import annotations

import concurrent.futures
import hashlib
import json
import os
import re
import sys
import threading
import time
from collections import deque
from pathlib import Path
from urllib.parse import unquote, urldefrag, urljoin, urlparse

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

ALLOWED_HOSTS = {"lusion.co", "www.lusion.co", "lusion.dev", "www.lusion.dev"}
TEXT_TYPES = (
    "text/", "application/javascript", "application/x-javascript",
    "application/json", "application/xml", "application/xhtml+xml", "image/svg+xml",
)
ASSET_EXTS = {
    ".js", ".mjs", ".css", ".json", ".xml", ".txt", ".html", ".htm",
    ".buf", ".bin", ".wasm", ".glb", ".gltf",
    ".webp", ".png", ".jpg", ".jpeg", ".gif", ".avif", ".svg", ".ico",
    ".ogg", ".mp3", ".wav", ".m4a", ".mp4", ".webm",
    ".woff", ".woff2", ".ttf", ".otf", ".eot",
}
KNOWN_ABOUT_ASSETS = [
    "bg_box.buf", "camera_spline.buf", "letter_placements.buf", "logo_text.buf",
    "person.buf", "person_idle.buf", "terrain.buf", "terrain_lines.buf",
]
for name in KNOWN_ABOUT_ASSETS:
    SEEDS += [
        f"https://lusion.co/assets/models/about/{name}",
        f"https://lusion.dev/assets/models/about/{name}",
    ]

MAX_URLS = int(os.environ.get("LUSION_MAX_URLS", "6000"))
MAX_TOTAL_BYTES = int(os.environ.get("LUSION_MAX_TOTAL_BYTES", str(750 * 1024 * 1024)))
MAX_FILE_BYTES = int(os.environ.get("LUSION_MAX_FILE_BYTES", str(95 * 1024 * 1024)))
REQUEST_TIMEOUT = int(os.environ.get("LUSION_REQUEST_TIMEOUT", "15"))
WORKERS = int(os.environ.get("LUSION_WORKERS", "24"))

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36",
    "Accept": "*/*",
}
_tls = threading.local()

ABS_URL_RE = re.compile(r"https?://[^\s\"'<>\\)]+", re.I)
ROOT_PATH_RE = re.compile(r"(?P<q>[\"'])(?P<path>/(?:_astro|assets|projects|about|work|api)/[^\"']+)(?P=q)", re.I)
ASSET_LITERAL_RE = re.compile(
    r"(?P<q>[\"'])(?P<path>(?:\.\.?/|/)?[^\"']+?\.(?:js|mjs|css|json|xml|buf|bin|wasm|glb|gltf|webp|png|jpe?g|gif|avif|svg|ico|ogg|mp3|wav|m4a|mp4|webm|woff2?|ttf|otf|eot)(?:\?[^\"']*)?)(?P=q)",
    re.I,
)
CSS_URL_RE = re.compile(r"url\((?:[\"']?)([^)\"']+)(?:[\"']?)\)", re.I)


def get_session() -> requests.Session:
    if not hasattr(_tls, "session"):
        _tls.session = requests.Session()
        _tls.session.headers.update(HEADERS)
    return _tls.session


def canonicalize(url: str, base: str | None = None) -> str | None:
    if base:
        url = urljoin(base, url)
    url, _ = urldefrag(url.strip())
    if not url.startswith(("http://", "https://")):
        return None
    p = urlparse(url)
    host = (p.hostname or "").lower()
    if host not in ALLOWED_HOSTS:
        return None
    host = {"www.lusion.co": "lusion.co", "www.lusion.dev": "lusion.dev"}.get(host, host)
    netloc = host + (f":{p.port}" if p.port else "")
    return p._replace(netloc=netloc, path=p.path or "/", fragment="").geturl()


def safe_path(url: str, content_type: str) -> Path:
    p = urlparse(url)
    raw = unquote(p.path or "/")
    if raw.endswith("/"):
        raw += "index.html"
    elif not Path(raw).suffix and "text/html" in content_type:
        raw += "/index.html"
    parts = [re.sub(r"[^A-Za-z0-9._@+()\[\] -]", "_", x)[:180]
             for x in Path(raw.lstrip("/") or "index.html").parts if x not in ("", ".", "..")]
    target = ROOT / (p.hostname or "unknown-host") / Path(*(parts or ["index.html"]))
    if p.query:
        digest = hashlib.sha256(p.query.encode()).hexdigest()[:12]
        target = target.with_name(f"{target.stem}__q_{digest}{target.suffix}")
    return target


def extract_urls(text: str, base_url: str, content_type: str) -> set[str]:
    found: set[str] = set()

    def add(value: str) -> None:
        normalized = canonicalize(value, base_url)
        if normalized:
            found.add(normalized)

    if "html" in content_type or "xhtml" in content_type:
        try:
            soup = BeautifulSoup(text, "html.parser")
            for tag in soup.find_all(True):
                for attr in ("href", "src", "data-src", "data-url", "poster"):
                    val = tag.get(attr)
                    if isinstance(val, str):
                        add(val)
                srcset = tag.get("srcset")
                if isinstance(srcset, str):
                    for item in srcset.split(","):
                        add(item.strip().split(" ")[0])
        except Exception:
            pass

    for match in ABS_URL_RE.finditer(text):
        add(match.group(0))
    for match in ROOT_PATH_RE.finditer(text):
        add(match.group("path"))
    for match in ASSET_LITERAL_RE.finditer(text):
        add(match.group("path"))
    for match in CSS_URL_RE.finditer(text):
        add(match.group(1))
    for token in re.findall(r"/(?:_astro|assets)/[^\s\"'<>`]+", text):
        cleaned = token.rstrip(",;)]}")
        if Path(urlparse(cleaned).path).suffix.lower() in ASSET_EXTS or "/_astro/" in cleaned:
            add(cleaned)
    return found


def fetch_one(url: str) -> dict:
    try:
        response = get_session().get(url, timeout=REQUEST_TIMEOUT, allow_redirects=True)
        final_url = canonicalize(response.url) or url
        status = response.status_code
        ctype = response.headers.get("content-type", "application/octet-stream").split(";")[0].strip().lower()
        if status >= 400:
            return {"ok": False, "url": url, "finalUrl": final_url, "status": status}
        data = response.content
        if len(data) > MAX_FILE_BYTES:
            return {"ok": False, "url": url, "finalUrl": final_url, "error": "file-size-cap", "bytes": len(data)}
        return {
            "ok": True,
            "url": url,
            "finalUrl": final_url,
            "status": status,
            "contentType": ctype,
            "encoding": response.encoding or "utf-8",
            "data": data,
        }
    except Exception as exc:
        return {"ok": False, "url": url, "error": repr(exc)}


queue: deque[str] = deque()
queued: set[str] = set()
seen: set[str] = set()
manifest: list[dict] = []
failures: list[dict] = []
total_bytes = 0

for seed in SEEDS:
    normalized = canonicalize(seed)
    if normalized and normalized not in queued:
        queued.add(normalized)
        queue.append(normalized)

with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as pool:
    while queue and len(seen) < MAX_URLS and total_bytes < MAX_TOTAL_BYTES:
        batch: list[str] = []
        while queue and len(batch) < WORKERS and len(seen) + len(batch) < MAX_URLS:
            url = queue.popleft()
            queued.discard(url)
            if url not in seen:
                batch.append(url)
        if not batch:
            continue
        seen.update(batch)
        results = list(pool.map(fetch_one, batch))

        for result in results:
            if not result.get("ok"):
                failures.append(result)
                print(f"[MISS] {result.get('url')} :: {result.get('error') or result.get('status')}", flush=True)
                continue

            data: bytes = result.pop("data")
            if total_bytes + len(data) > MAX_TOTAL_BYTES:
                failures.append({"url": result["url"], "finalUrl": result["finalUrl"], "error": "archive-size-cap"})
                continue

            target = safe_path(result["finalUrl"], result["contentType"])
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            total_bytes += len(data)
            entry = {
                "url": result["url"], "finalUrl": result["finalUrl"],
                "path": str(target), "status": result["status"],
                "contentType": result["contentType"], "bytes": len(data),
                "sha256": hashlib.sha256(data).hexdigest(),
            }
            manifest.append(entry)
            print(f"[OK] {len(data):>9} {result['contentType']:<32} {result['finalUrl']}", flush=True)

            suffix = Path(urlparse(result["finalUrl"]).path).suffix.lower()
            if result["contentType"].startswith(TEXT_TYPES) or suffix in {".js", ".mjs", ".css", ".json", ".xml", ".html", ".svg"}:
                text = data.decode(result.get("encoding") or "utf-8", errors="replace")
                for discovered in extract_urls(text, result["finalUrl"], result["contentType"]):
                    if discovered not in seen and discovered not in queued and len(seen) + len(queued) < MAX_URLS:
                        queued.add(discovered)
                        queue.append(discovered)

manifest.sort(key=lambda item: item["finalUrl"])
(ROOT / "archive-manifest.json").write_text(json.dumps({
    "generatedAtUtc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "resourceCount": len(manifest), "totalBytes": total_bytes,
    "hosts": sorted(ALLOWED_HOSTS), "resources": manifest, "failures": failures,
}, indent=2), encoding="utf-8")
(ROOT / "resource-urls.txt").write_text("\n".join(x["finalUrl"] for x in manifest) + "\n", encoding="utf-8")
(ROOT / "missing-or-blocked.txt").write_text(
    "\n".join(json.dumps(x, sort_keys=True) for x in failures) + ("\n" if failures else ""),
    encoding="utf-8",
)

print("\n=== LUSION ARCHIVE COMPLETE ===", flush=True)
print(f"Resources: {len(manifest)}", flush=True)
print(f"Bytes:     {total_bytes}", flush=True)
print(f"Failures:  {len(failures)}", flush=True)
print(f"Output:    {ROOT}", flush=True)
if not manifest:
    sys.exit(2)
