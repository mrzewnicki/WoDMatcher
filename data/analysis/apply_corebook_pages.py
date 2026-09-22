"""Apply Corebook page sources into V5_disciplines.json."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import fitz

sys.stdout.reconfigure(encoding="utf-8")

PDF = Path(r"R:\Podręczniki\Wampir\Vampire,_The_Masquerade_V5_Corebook_Extended.pdf")
DISC = Path(r"P:\VampireMatcher\data\V5_disciplines.json")
REPORT = Path(r"P:\VampireMatcher\data\analysis\corebook_page_match.json")

SKIP = {"General Rules", "Rituals", "_meta"}
BOOK_DISPLAY = "Corebook"
BOOK_ID = "Vampire,_The_Masquerade_V5_Corebook_Extended"

STARTS = {
    "Animalism": 244,
    "Auspex": 248,
    "Celerity": 252,
    "Dominate": 254,
    "Fortitude": 258,
    "Obfuscate": 260,
    "Potence": 263,
    "Presence": 266,
    "Protean": 269,
    "Blood Sorcery": 271,
    "Thin-Blood Alchemy": 282,
}


def normalize(s: str) -> str:
    s = s.lower().replace("\u2019", "'").replace("\u2018", "'")
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def chapter_end(discipline: str) -> int:
    start = STARTS[discipline]
    later = sorted(p for p in STARTS.values() if p > start)
    # include Thin-Blood end
    return (later[0] + 2) if later else 290


def extract_index_map(doc) -> dict[str, int]:
    index: dict[str, int] = {}
    for i in range(max(0, len(doc) - 40), len(doc)):
        lines = [ln.strip() for ln in doc[i].get_text().splitlines()]
        buf = ""
        for ln in lines:
            if not ln:
                continue
            candidate = f"{buf} {ln}".strip() if buf else ln
            m = re.search(r"^(.+?)\s+(\d{2,3})$", candidate)
            if m:
                name = m.group(1).strip(" .")
                page = int(m.group(2))
                if len(normalize(name)) >= 3 and page >= 100:
                    index[normalize(name)] = page
                buf = ""
            else:
                if re.match(r"^[A-Za-z]", ln) and not re.search(r"\d{2,3}$", ln):
                    buf = ln
                else:
                    buf = ""
    return index


def find_heading_page(doc, name: str, start: int, end: int) -> int | None:
    target = normalize(name)
    for i in range(len(doc)):
        label = doc[i].get_label() or ""
        lab = int(re.sub(r"[^0-9]", "", label) or 0)
        if lab and (lab < start - 1 or lab > end):
            continue
        lines = [ln.strip() for ln in doc[i].get_text().splitlines() if ln.strip()]
        for k, ln in enumerate(lines):
            if normalize(ln) != target:
                continue
            if len(ln) > 60:
                continue
            window = " ".join(lines[max(0, k - 3) : k + 5]).lower()
            # real power blocks almost always have Cost/Level/Duration nearby
            if any(
                x in window
                for x in ("level ", "cost:", "duration:", "amalgam", "dice pools")
            ):
                return lab
            # short standalone title line inside chapter
            if lab:
                return lab
    return None


def resolve_page(doc, index: dict[str, int], name: str, discipline: str) -> tuple[int | None, str]:
    start = STARTS[discipline]
    end = chapter_end(discipline)

    heading = find_heading_page(doc, name, start, end)
    key = normalize(name)
    idx_page = index.get(key)

    if idx_page is None:
        for ik, ip in index.items():
            if ik == key:
                idx_page = ip
                break
            # careful fuzzy: only if one contains the other with small length delta
            if (key in ik or ik in key) and abs(len(ik) - len(key)) <= 8:
                idx_page = ip
                break

    if heading and idx_page and heading != idx_page:
        # Prefer heading (more precise for multi-power index rounding)
        return heading, "heading-over-index"
    if heading:
        return heading, "heading"
    if idx_page:
        return idx_page, "index"
    return None, "missing"


def main() -> None:
    doc = fitz.open(PDF)
    index = extract_index_map(doc)
    disc = json.loads(DISC.read_text(encoding="utf-8"))

    results = []
    updated = 0
    missing = []

    for d, body in disc.items():
        if d in SKIP or not isinstance(body, dict) or "levels" not in body:
            continue
        for level, level_powers in body["levels"].items():
            for key, power in level_powers.items():
                name = power.get("name") or key
                page, method = resolve_page(doc, index, name, d)
                results.append(
                    {
                        "discipline": d,
                        "level": int(level),
                        "key": key,
                        "name": name,
                        "page": page,
                        "method": method,
                    }
                )
                if page is None:
                    missing.append(name)
                    continue

                sources = power.get("sources")
                if not isinstance(sources, list):
                    sources = []

                # upsert Corebook source
                found = False
                for src in sources:
                    if src.get("book") in (BOOK_DISPLAY, BOOK_ID, "Corebook"):
                        src["book"] = BOOK_DISPLAY
                        src["page"] = page
                        found = True
                        break
                if not found:
                    sources.insert(0, {"book": BOOK_DISPLAY, "page": page})
                power["sources"] = sources
                updated += 1

    DISC.write_text(
        json.dumps(disc, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    REPORT.write_text(
        json.dumps(
            {
                "updated": updated,
                "missing": missing,
                "results": results,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"updated={updated} missing={len(missing)}")
    for r in results:
        print(
            f"{r['discipline']:20} L{r['level']} p={r['page']!s:>4} [{r['method']}] {r['name']}"
        )
    if missing:
        print("MISSING:", missing)


if __name__ == "__main__":
    main()
