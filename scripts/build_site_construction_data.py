#!/usr/bin/env python3
"""Build construction materials + tools metadata for all sites."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
from datetime import date
from pathlib import Path
from typing import Any
from urllib.parse import urlencode

from reconstruction_sites import SITES

WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"
WIKIDATA_API = "https://www.wikidata.org/w/api.php"
USER_AGENT = "education-craft/1.0 (historical-sites-data-builder)"

STOPWORDS = {
    "ancient",
    "the",
    "of",
    "at",
    "and",
    "in",
    "city",
    "temple",
    "capital",
    "mausoleum",
    "churches",
}

TITLE_OVERRIDES: dict[str, str] = {
    "hanging-gardens-of-babylon": "Hanging Gardens of Babylon",
    "statue-of-zeus-at-olympia": "Statue of Zeus at Olympia",
    "temple-of-artemis-at-ephesus": "Temple of Artemis",
    "mausoleum-at-halicarnassus": "Mausoleum at Halicarnassus",
    "colossus-of-rhodes": "Colossus of Rhodes",
    "lighthouse-of-alexandria": "Lighthouse of Alexandria",
    "roman-colosseum": "Colosseum",
    "pantheon-rome": "Pantheon, Rome",
    "acropolis-of-athens": "Acropolis of Athens",
    "palace-of-knossos": "Knossos",
    "theatre-of-epidaurus": "Ancient Theatre of Epidaurus",
    "pergamon-acropolis": "Pergamon",
    "memphis-ancient-egypt": "Memphis, Egypt",
    "aksum-obelisks": "Obelisk of Axum",
    "lalibela-churches": "Lalibela",
    "angkor-thom": "Angkor Thom",
    "ayutthaya": "Ayutthaya Kingdom",
    "cusco-inca-capital": "Cusco",
    "copan": "Copán",
    "mesa-verde-cliff-palace": "Cliff Palace",
}

METHOD_RULES: list[tuple[str, str, list[str]]] = [
    (
        "rock_cut",
        "Rock-cut architecture",
        ["rock-cut", "rock cut", "hewn", "carved into", "cut into the rock"],
    ),
    (
        "ashlar",
        "Ashlar or finely dressed masonry",
        ["ashlar", "finely cut stone", "dressed stone"],
    ),
    (
        "dry_stone",
        "Dry-stone masonry",
        ["dry stone", "without mortar", "cyclopean"],
    ),
    (
        "mudbrick",
        "Mudbrick/adobe construction",
        ["mudbrick", "mud-brick", "adobe", "sun-dried brick"],
    ),
    (
        "fired_brick",
        "Fired-brick masonry",
        ["fired brick", "baked brick", "brick masonry", "kiln-fired brick"],
    ),
    (
        "earthworks",
        "Large earthen earthworks",
        ["henge", "ditch", "mound", "earthen", "earthwork", "embankment"],
    ),
    (
        "timber",
        "Timber framing or timber structures",
        ["timber", "wooden", "wood", "postholes", "post-hole"],
    ),
    (
        "concrete",
        "Lime mortar / concrete construction",
        ["roman concrete", "concrete", "pozzolana", "lime mortar"],
    ),
    (
        "terracotta",
        "Terracotta or fired-clay production",
        ["terracotta", "fired clay", "clay figures", "ceramic"],
    ),
]

MATERIAL_HINTS: list[tuple[str, list[str]]] = [
    ("Limestone", ["limestone"]),
    ("Sandstone", ["sandstone"]),
    ("Granite", ["granite"]),
    ("Marble", ["marble"]),
    ("Basalt", ["basalt"]),
    ("Tuff", ["tuff", "volcanic tuff"]),
    ("Travertine", ["travertine"]),
    ("Slate", ["slate"]),
    ("Mudbrick", ["mudbrick", "mud-brick"]),
    ("Adobe", ["adobe"]),
    ("Fired brick", ["fired brick", "baked brick", "brick"]),
    ("Timber", ["timber", "wood"]),
    ("Earth", ["earth", "earthen"]),
    ("Rammed earth", ["rammed earth"]),
    ("Clay", ["clay"]),
    ("Bronze", ["bronze"]),
]

METHOD_TOOLS: dict[str, list[str]] = {
    "rock_cut": ["Metal chisels", "Hammerstones/mallets", "Picks"],
    "ashlar": ["Stone hammers", "Chisels", "Plumb lines and set squares"],
    "dry_stone": ["Hammerstones", "Pry bars/levers", "Stone dressing tools"],
    "mudbrick": ["Mudbrick moulds", "Trowels", "Plastering tools"],
    "fired_brick": ["Brick moulds", "Kilns", "Trowels"],
    "earthworks": ["Antler/wood picks", "Wooden shovels", "Carrying baskets"],
    "timber": ["Axes/adzes", "Saws", "Boring tools/augers"],
    "concrete": ["Mixing tools", "Trowels", "Wooden centering/formwork"],
    "terracotta": ["Clay moulds", "Modeling/carving tools", "Kilns"],
}

GENERIC_HEAVY_STONE_TOOLS = ["Rope systems", "Wooden sledges/rollers", "Levering poles"]


def curl_json(url: str, params: dict[str, str]) -> dict[str, Any]:
    query = urlencode(params)
    last_error = "unknown error"
    for _attempt in range(2):
        cmd = [
            "curl",
            "-L",
            "--fail",
            "--silent",
            "--show-error",
            "--connect-timeout",
            "10",
            "--max-time",
            "18",
            "-A",
            USER_AGENT,
            f"{url}?{query}",
        ]
        result = subprocess.run(cmd, capture_output=True, check=False)
        if result.returncode == 0:
            return json.loads(result.stdout.decode("utf-8"))
        last_error = result.stderr.decode("utf-8", errors="replace").strip()
    raise RuntimeError(f"curl failed: {last_error}")


def site_tokens(name: str) -> list[str]:
    cleaned = re.sub(r"\([^)]*\)", "", name.lower())
    parts = re.findall(r"[a-z0-9]+", cleaned)
    return [token for token in parts if len(token) >= 3 and token not in STOPWORDS]


def score_title(query_tokens: list[str], title: str, snippet: str) -> int:
    blob = f"{title} {snippet}".lower()
    overlap = sum(1 for token in query_tokens if token in blob)
    prefix_bonus = 3 if title.lower().startswith(query_tokens[0]) else 0
    return overlap * 3 + prefix_bonus


def find_wikipedia_page(site_slug: str, site_name: str) -> tuple[str, str]:
    override = TITLE_OVERRIDES.get(site_slug)
    if override:
        return override, ""

    tokens = site_tokens(site_name)
    queries = [site_name, f"{site_name} archaeological site"]
    best_title = ""
    best_snippet = ""
    best_score = -1
    for query in queries:
        data = curl_json(
            WIKIPEDIA_API,
            {
                "action": "query",
                "format": "json",
                "list": "search",
                "srsearch": query,
                "srlimit": "5",
                "utf8": "1",
            },
        )
        for item in data.get("query", {}).get("search", []):
            title = str(item.get("title") or "")
            snippet = str(item.get("snippet") or "")
            score = score_title(tokens, title, snippet)
            if score > best_score:
                best_score = score
                best_title = title
                best_snippet = snippet
    if not best_title:
        return site_name, ""
    return best_title, best_snippet


def get_page_info(title: str) -> dict[str, Any]:
    data = curl_json(
        WIKIPEDIA_API,
        {
            "action": "query",
            "format": "json",
            "prop": "pageprops|extracts|info",
            "ppprop": "wikibase_item",
            "inprop": "url",
            "explaintext": "1",
            "exchars": "8000",
            "redirects": "1",
            "titles": title,
        },
    )
    pages = data.get("query", {}).get("pages", {})
    if not pages:
        return {}
    return next(iter(pages.values()))


def get_wikidata_entity(qid: str) -> dict[str, Any]:
    data = curl_json(
        WIKIDATA_API,
        {
            "action": "wbgetentities",
            "format": "json",
            "ids": qid,
            "props": "claims|labels",
            "languages": "en",
        },
    )
    return data.get("entities", {}).get(qid, {})


def get_entity_labels(entity_ids: list[str]) -> dict[str, str]:
    if not entity_ids:
        return {}
    data = curl_json(
        WIKIDATA_API,
        {
            "action": "wbgetentities",
            "format": "json",
            "ids": "|".join(entity_ids),
            "props": "labels",
            "languages": "en",
        },
    )
    labels: dict[str, str] = {}
    for qid, entity in data.get("entities", {}).items():
        labels[qid] = (
            entity.get("labels", {}).get("en", {}).get("value")
            or entity.get("labels", {}).get("mul", {}).get("value")
            or qid
        )
    return labels


def extract_material_ids(entity: dict[str, Any]) -> list[str]:
    material_ids: list[str] = []
    for claim in entity.get("claims", {}).get("P186", []):
        mainsnak = claim.get("mainsnak", {})
        datavalue = mainsnak.get("datavalue", {})
        value = datavalue.get("value", {})
        qid = value.get("id") if isinstance(value, dict) else None
        if isinstance(qid, str):
            material_ids.append(qid)
    # preserve order + uniqueness
    seen: set[str] = set()
    ordered = []
    for item in material_ids:
        if item in seen:
            continue
        seen.add(item)
        ordered.append(item)
    return ordered


def infer_materials_from_text(text: str) -> list[str]:
    lowered = text.lower()
    results: list[str] = []
    for label, needles in MATERIAL_HINTS:
        if any(needle in lowered for needle in needles):
            results.append(label)
    if "stone" in lowered and not any("stone" in value.lower() for value in results):
        results.append("Stone")
    return results


def infer_methods(text: str) -> list[tuple[str, str]]:
    lowered = text.lower()
    found: list[tuple[str, str]] = []
    for key, label, needles in METHOD_RULES:
        if any(needle in lowered for needle in needles):
            found.append((key, label))
    return found


def infer_tools(methods: list[tuple[str, str]], materials: list[str], title: str, text: str) -> tuple[list[str], bool]:
    tools: list[str] = []
    for key, _label in methods:
        tools.extend(METHOD_TOOLS.get(key, []))

    lowered = text.lower()
    material_blob = " ".join(materials).lower()
    heavy_stone = (
        "pyramid" in title.lower()
        or "megalith" in lowered
        or "colossus" in title.lower()
        or "stone" in material_blob
    )
    if heavy_stone:
        tools.extend(GENERIC_HEAVY_STONE_TOOLS)

    if "terracotta" in material_blob and "Kilns" not in tools:
        tools.append("Kilns")
    if ("adobe" in material_blob or "mudbrick" in material_blob) and "Mudbrick moulds" not in tools:
        tools.append("Mudbrick moulds")

    # De-duplicate, preserve order
    deduped: list[str] = []
    seen: set[str] = set()
    for tool in tools:
        norm = tool.lower()
        if norm in seen:
            continue
        seen.add(norm)
        deduped.append(tool)

    inferred = True
    return deduped[:8], inferred


def fallback_materials_from_methods(methods: list[tuple[str, str]]) -> list[str]:
    inferred: list[str] = []
    for key, _label in methods:
        if key in {"rock_cut", "ashlar", "dry_stone"}:
            inferred.append("Stone")
        if key in {"mudbrick"}:
            inferred.extend(["Mudbrick", "Clay"])
        if key in {"fired_brick", "terracotta"}:
            inferred.extend(["Fired brick", "Clay"])
        if key in {"earthworks"}:
            inferred.append("Earth")
        if key in {"timber"}:
            inferred.append("Timber")
        if key in {"concrete"}:
            inferred.extend(["Stone", "Lime mortar"])
    deduped: list[str] = []
    seen: set[str] = set()
    for item in inferred:
        norm = item.lower()
        if norm in seen:
            continue
        seen.add(norm)
        deduped.append(item)
    return deduped


def fallback_materials_from_site(site_name: str, region: str, title: str, text: str) -> list[str]:
    blob = f"{site_name} {title} {text}".lower()
    region_l = region.lower()
    inferred: list[str] = []

    if any(token in blob for token in ["pyramid", "temple", "forum", "colosseum", "acropolis", "mausoleum", "theatre"]):
        inferred.append("Stone")
    if any(token in blob for token in ["henge", "mound", "earthwork", "ditch"]):
        inferred.extend(["Earth", "Timber"])
    if any(token in blob for token in ["adobe", "chan chan"]):
        inferred.extend(["Adobe", "Clay"])
    if any(token in blob for token in ["terracotta"]):
        inferred.extend(["Terracotta", "Clay"])
    if any(token in blob for token in ["wall", "roman"]):
        inferred.extend(["Stone", "Fired brick", "Lime mortar"])
    if "egypt" in region_l:
        inferred.extend(["Limestone", "Sandstone"])
    if region_l in {"mexico", "guatemala", "honduras"}:
        inferred.append("Limestone")
    if region_l == "peru":
        inferred.extend(["Stone", "Adobe"])
    if region_l in {"pakistan", "iraq"}:
        inferred.extend(["Mudbrick", "Fired brick"])

    deduped: list[str] = []
    seen: set[str] = set()
    for item in inferred:
        norm = item.lower()
        if norm in seen:
            continue
        seen.add(norm)
        deduped.append(item)
    return deduped


def fallback_methods_from_materials(materials: list[str]) -> list[tuple[str, str]]:
    blob = " ".join(materials).lower()
    methods: list[tuple[str, str]] = []
    if any(token in blob for token in ["stone", "limestone", "sandstone", "granite", "marble", "basalt", "tuff"]):
        methods.append(("stone_default", "Stone masonry and block dressing"))
    if any(token in blob for token in ["earth", "rammed earth"]):
        methods.append(("earthworks_default", "Large earthen earthworks"))
    if any(token in blob for token in ["mudbrick", "adobe"]):
        methods.append(("mudbrick", "Mudbrick/adobe construction"))
    if any(token in blob for token in ["fired brick", "terracotta", "clay"]):
        methods.append(("fired_brick", "Fired-brick masonry"))
    if any(token in blob for token in ["timber", "wood"]):
        methods.append(("timber", "Timber framing or timber structures"))
    return methods


def build_profile(site_slug: str, site_name: str, region: str) -> dict[str, Any]:
    title, search_snippet = find_wikipedia_page(site_slug, site_name)
    page = get_page_info(title)
    wiki_title = str(page.get("title") or title)
    wiki_url = str(page.get("fullurl") or f"https://en.wikipedia.org/wiki/{wiki_title.replace(' ', '_')}")
    extract = str(page.get("extract") or "")
    qid = str(page.get("pageprops", {}).get("wikibase_item") or "")

    materials: list[str] = []
    wikidata_url: str | None = None

    if qid:
        entity = get_wikidata_entity(qid)
        material_ids = extract_material_ids(entity)
        labels = get_entity_labels(material_ids)
        materials = [labels.get(item, item) for item in material_ids]
        wikidata_url = f"https://www.wikidata.org/wiki/{qid}"

    if not materials:
        materials = infer_materials_from_text(extract)

    methods = infer_methods(extract)
    if not materials:
        materials = fallback_materials_from_methods(methods)
    if not materials:
        materials = fallback_materials_from_site(site_name, region, wiki_title, extract)
    if not materials:
        materials = ["Stone", "Timber", "Earth"]
    if not methods:
        methods = fallback_methods_from_materials(materials)
    if not methods:
        methods = [("default", "Masonry and earthwork construction")]

    tool_list, inferred = infer_tools(methods, materials, wiki_title, extract)

    if not methods and materials:
        methods = [("materials_only", "Construction approach inferred from listed materials")]

    if not tool_list:
        tool_list = ["Manual stone/earth shaping tools", "Rope and lever systems"]
        inferred = True

    method_labels = [label for _key, label in methods]
    sources = [
        {
            "title": f"Wikipedia: {wiki_title}",
            "url": wiki_url,
            "type": "wikipedia",
        }
    ]
    if wikidata_url:
        sources.append(
            {
                "title": f"Wikidata: {qid}",
                "url": wikidata_url,
                "type": "wikidata",
            }
        )

    return {
        "slug": site_slug,
        "siteName": site_name,
        "wikipediaTitle": wiki_title,
        "wikidataId": qid or None,
        "materials": materials,
        "constructionMethods": method_labels,
        "constructionTools": tool_list,
        "toolsInferred": inferred,
        "sources": sources,
        "notes": (
            "Tools are inferred from the site's documented materials and construction method terms. "
            "Treat them as classroom-level likely toolkits."
        ),
        "searchSnippet": re.sub(r"<[^>]+>", " ", search_snippet).strip(),
        "lastUpdated": date.today().isoformat(),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        default="src/lib/data/site-construction.json",
        help="Output JSON file path",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    profiles: list[dict[str, Any]] = []
    for idx, site in enumerate(SITES, start=1):
        print(f"[{idx:02d}/{len(SITES)}] {site.name}", flush=True)
        try:
            profiles.append(build_profile(site.slug, site.name, site.region))
        except Exception as exc:  # noqa: BLE001
            print(f"  ! failed: {exc}")
            wiki_search_url = (
                "https://en.wikipedia.org/w/index.php?search="
                + re.sub(r"\s+", "+", site.name.strip())
            )
            profiles.append(
                {
                    "slug": site.slug,
                    "siteName": site.name,
                    "wikipediaTitle": site.name,
                    "wikidataId": None,
                    "materials": [],
                    "constructionMethods": [],
                    "constructionTools": ["Manual stone/earth shaping tools", "Rope and lever systems"],
                    "toolsInferred": True,
                    "sources": [
                        {
                            "title": f"Wikipedia search: {site.name}",
                            "url": wiki_search_url,
                            "type": "wikipedia-search",
                        }
                    ],
                    "notes": "Automatic collection failed for this site; profile needs manual review.",
                    "searchSnippet": "",
                    "lastUpdated": date.today().isoformat(),
                }
            )

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(profiles, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {output_path} ({len(profiles)} sites)")


if __name__ == "__main__":
    main()
