#!/usr/bin/env python3
"""Scrape study-program pages for schools missing program data.

For each school, fetch the homepage, find links that look like a
Studiengänge/Studienangebot listing, then save the page text into
"missing programs/<school>.txt" (same format as the manually saved pages).
"""
import json
import re
import sys
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "missing programs"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0",
    "Accept-Language": "de-DE,de;q=0.9,en;q=0.5",
}

# keywords ranked by how strongly they indicate a program-listing page
LINK_KEYWORDS = [
    ("studiengaenge", 10), ("studiengänge", 10), ("studienangebot", 10),
    ("studienangebote", 10), ("study-program", 9), ("studyprogram", 9),
    ("studiengang", 8), ("studienrichtungen", 8), ("lehrangebot", 7),
    ("studium", 5), ("studieren", 5), ("courses-of-study", 6),
    ("ausbildung", 3),
]


def fetch(url, timeout=25):
    return requests.get(url, headers=HEADERS, timeout=timeout, verify=True)


def normalize_base(url):
    url = url.strip()
    if not url.startswith("http"):
        url = "https://" + url
    return url


def candidate_links(base_url, html):
    soup = BeautifulSoup(html, "html.parser")
    seen = {}
    base_host = urlparse(base_url).netloc.replace("www.", "")
    for a in soup.find_all("a", href=True):
        href = urljoin(base_url, a["href"])
        p = urlparse(href)
        if p.netloc.replace("www.", "") != base_host:
            continue
        key = href.split("#")[0].rstrip("/")
        hay = (p.path + " " + a.get_text(" ", strip=True)).lower()
        score = sum(s for kw, s in LINK_KEYWORDS if kw in hay)
        # prefer shallow listing pages over deep detail pages
        depth = p.path.strip("/").count("/")
        score -= depth
        if score > 0 and (key not in seen or seen[key] < score):
            seen[key] = score
    return [u for u, s in sorted(seen.items(), key=lambda kv: -kv[1])]


def page_text(html):
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript", "svg", "iframe"]):
        tag.decompose()
    text = soup.get_text("\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n\n", text)
    return text.strip()


def scrape(name, website):
    base = normalize_base(website)
    r = fetch(base)
    r.raise_for_status()
    base = r.url  # after redirects
    links = candidate_links(base, r.text)[:3]
    best = None
    for link in links:
        try:
            pr = fetch(link)
            pr.raise_for_status()
        except Exception:
            continue
        txt = page_text(pr.text)
        if best is None or len(txt) > len(best[1]):
            best = (link, txt)
        time.sleep(0.5)
    if best is None:  # fall back to homepage text
        best = (base, page_text(r.text))
    return best


def main():
    data = json.load(open(ROOT / "src/data/enhanced_german_art_schools.json"))
    OUT_DIR.mkdir(exist_ok=True)
    results = []
    for name, u in data["universities"].items():
        if u.get("programs"):
            continue
        out = OUT_DIR / (name.replace("/", "-") + ".txt")
        if out.exists():
            results.append((name, "SKIP (already saved)", ""))
            continue
        try:
            url, txt = scrape(name, u["website"])
            header = f"Source: {url}\nScraped: {time.strftime('%Y-%m-%d')}\n\n"
            out.write_text(header + txt)
            results.append((name, f"OK ({len(txt)} chars)", url))
        except Exception as e:
            results.append((name, f"FAIL: {type(e).__name__}: {e}", ""))
        time.sleep(1)
    for name, status, url in results:
        print(f"{status:<40} {name}\n{'':<40} {url}" if url else f"{status:<40} {name}")


if __name__ == "__main__":
    main()
