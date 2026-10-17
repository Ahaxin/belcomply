"""Validate the static site's discovery graph without third-party dependencies.

This checks source files, not live HTTP, crawler access, indexing or AI inclusion.
"""
import argparse
from collections import Counter, deque
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import unquote, urljoin, urlsplit
from urllib.robotparser import RobotFileParser
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://belcomply.com"


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.meta = {}
        self.canonicals = []
        self.alternates = {}
        self.links = []
        self.ids = set()
        self.h1 = 0
        self.schemas = []
        self.in_title = False
        self.in_schema = False
        self.buffer = ""
        self.language = ""
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.add(a["id"])
        if tag == "html":
            self.language = a.get("lang", "")
        if tag == "h1":
            self.h1 += 1
        if tag == "title":
            self.in_title = True
        if tag == "meta":
            self.meta[a.get("name", a.get("property", ""))] = a.get("content", "")
        if tag == "link":
            if a.get("rel") == "canonical":
                self.canonicals.append(a.get("href", ""))
            if a.get("rel") == "alternate":
                self.alternates[a.get("hreflang", "")] = a.get("href", "")
        if tag == "a" and "href" in a:
            self.links.append(a["href"])
        if tag == "script" and a.get("type") == "application/ld+json":
            self.in_schema = True
            self.buffer = ""

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        if self.in_schema:
            self.buffer += data

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag == "script" and self.in_schema:
            self.schemas.append(json.loads(self.buffer))
            self.in_schema = False


def local_file(url):
    path = unquote(urlsplit(url).path).lstrip("/")
    if ".." in Path(path).parts:
        raise ValueError("Path traversal")
    if not path or path.endswith("/"):
        path += "index.html"
    elif not Path(path).suffix:
        path += ".html"
    return ROOT / path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    errors, warnings = [], []
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9",
          "x": "http://www.w3.org/1999/xhtml"}
    sitemap = ET.parse(ROOT / "sitemap.xml")
    entries = sitemap.findall("s:url", ns)
    urls = [e.findtext("s:loc", namespaces=ns) for e in entries]
    if len(urls) != len(set(urls)):
        errors.append("Duplicate sitemap URLs")
    cache = {}

    def page(url):
        file = local_file(url)
        if file not in cache:
            cache[file] = Page(file.read_text(encoding="utf-8"))
        return cache[file]

    pages = {}
    for url in urls:
        try:
            pages[url] = page(url)
        except (OSError, ValueError) as exc:
            errors.append(f"{url}: {exc}")
    robots = RobotFileParser()
    robots.parse((ROOT / "robots.txt").read_text(encoding="utf-8").splitlines())
    schema_counts = Counter()
    graph = {}
    for url, p in pages.items():
        def require(condition, message):
            if not condition:
                errors.append(f"{url}: {message}")
        require(p.canonicals == [url], "canonical must match sitemap URL")
        require(p.h1 == 1, "expected one H1")
        require(bool(p.title.strip()) and bool(p.meta.get("description", "").strip()),
                "title and description required")
        require(not re.search(r"\b(noindex|nosnippet|none)\b", p.meta.get("robots", ""), re.I),
                "index/snippet restriction")
        require(p.language in ("en", "zh-CN"), "unexpected document language")
        for key in ("og:title", "og:description", "og:url", "twitter:title", "twitter:description"):
            require(bool(p.meta.get(key)), f"missing {key}")
        for lang in ("en", "zh-CN", "x-default"):
            alternate = p.alternates.get(lang)
            require(alternate in pages, f"missing sitemap alternate: {lang}")
            if alternate in pages:
                require(pages[alternate].alternates == p.alternates,
                        f"nonreciprocal language set: {lang}")
        require(p.alternates.get("en" if p.language == "en" else "zh-CN") == url,
                "language alternate must point to self")
        types = []
        for schema in p.schemas:
            for entity in schema.get("@graph", [schema]):
                t = entity.get("@type", [])
                types.extend([t] if isinstance(t, str) else t)
                if entity.get("@type") == "ItemList":
                    listed = entity.get("itemListElement", [])
                    for item in listed:
                        target = item.get("url")
                        require(target in pages, "ItemList target absent from sitemap")
                        require(any(urljoin(url, h).split("#")[0] == target for h in p.links),
                                "ItemList item has no visible HTML link")
        schema_counts.update(set(types))
        require("Organization" in types, "Organization schema missing")
        if urlsplit(url).path not in ("/", "/zh/"):
            require("BreadcrumbList" in types, "BreadcrumbList missing")
        if "/post-" in url:
            require("Article" in types, "Article schema missing")
        graph[url] = set()
        for href in p.links:
            target = urljoin(url, href)
            parsed = urlsplit(target)
            if parsed.scheme not in ("http", "https") or parsed.netloc != "belcomply.com":
                continue
            try:
                f = local_file(target)
                require(f.exists(), f"missing internal target: {href}")
                if parsed.fragment and f.exists() and f.suffix == ".html":
                    require(unquote(parsed.fragment) in page(target).ids,
                            f"missing target fragment: {href}")
            except (OSError, ValueError) as exc:
                errors.append(f"{url}: invalid target {href}: {exc}")
            clean = target.split("#")[0].split("?")[0]
            if clean in pages:
                graph[url].add(clean)
        for bot in ("Googlebot", "bingbot", "OAI-SearchBot", "PerplexityBot"):
            require(robots.can_fetch(bot, url), f"robots.txt blocks {bot}")
        en = p.language == "en"
        for label, value, low, high in (
            ("title", p.title, 30 if en else 15, 65 if en else 45),
            ("description", p.meta.get("description", ""), 100 if en else 40, 165 if en else 100),
        ):
            if not low <= len(value) <= high:
                warnings.append(f"{url}: {label} length {len(value)} (editorial review only)")
    for entry in entries:
        url = entry.findtext("s:loc", namespaces=ns)
        if url in pages:
            xml_alts = {a.get("hreflang"): a.get("href") for a in entry.findall("x:link", ns)}
            if xml_alts != pages[url].alternates:
                errors.append(f"{url}: sitemap/HTML language alternates differ")
    for label in ("title", "description"):
        groups = {}
        for url, p in pages.items():
            value = p.title if label == "title" else p.meta.get(label)
            groups.setdefault(value, []).append(url)
        for group in groups.values():
            if len(group) > 1:
                errors.append(f"Duplicate {label}: {group}")
    reachable = {}
    for language, start in (("en", BASE + "/"), ("zh-CN", BASE + "/zh/")):
        visited = {start}
        queue = deque([start])
        while queue:
            for target in graph.get(queue.popleft(), ()):
                if target not in visited and pages[target].language == language:
                    visited.add(target)
                    queue.append(target)
        missing = [u for u, p in pages.items() if p.language == language and u not in visited]
        reachable[language] = {"reachable": len(visited), "unreachable": missing}
        if missing:
            errors.append(f"Orphan pages in {language}: {missing}")
    # Catch a newly published self-canonical page omitted from sitemap.
    files = [ROOT / "index.html", ROOT / "epr-compliance-for-us-companies.html",
             *sorted((ROOT / "en").glob("*.html")), *sorted((ROOT / "zh").glob("*.html"))]
    for file in files:
        p = cache.get(file) or Page(file.read_text(encoding="utf-8"))
        if p.canonicals and "noindex" not in p.meta.get("robots", "").lower():
            canonical = p.canonicals[0]
            if canonical not in pages:
                errors.append(f"Canonical page absent from sitemap: {canonical}")
    report = {
        "checked_at_utc": datetime.now(timezone.utc).isoformat(),
        "source_commit": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
        "source_note": "Checks the working tree, including changes not yet committed; source_commit identifies the base HEAD.",
        "scope": "Local source validation only; not live HTTP or indexing/AI acceptance",
        "canonical_pages": len(urls), "errors": errors, "warnings": warnings,
        "language_reachability": reachable, "schema_page_counts": dict(schema_counts),
        "Product_policy": "Quoted compliance services use Service, per user approval; no fabricated Product offers.",
        "unproven": ["actual crawler access through CDN", "indexing", "organic top 3", "AI citation/recommendation"],
    }
    if args.output:
        output = args.output if args.output.is_absolute() else ROOT / args.output
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=True, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
