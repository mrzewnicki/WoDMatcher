"""Extract power page numbers from Corebook index + heading matches."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import fitz

sys.stdout.reconfigure(encoding="utf-8")

PDF = Path(r"R:\Podręczniki\Wampir\Vampire,_The_Masquerade_V5_Corebook_Extended.pdf")
DISC = Path(r"P:\VampireMatcher\data\V5_disciplines.json")
OUT = Path(r"P:\VampireMatcher\data\analysis\corebook_page_match.json")

SKIP = {"General Rules", "Rituals", "_meta"}
BOOK_ID = "Vampire,_The_Masquerade_V5_Corebook_Extended"


def load_powers():
    disc = json.loads(DISC.read_text(encoding="utf-8"))
    powers = []
    for d, body in disc.items():
        if d in SKIP or not isinstance(body, dict) or "levels" not in body:
            continue
        for level, level_powers in body["levels"].items():
            for key, p in level_powers.items():
                powers.append(
                    {
                        "discipline": d,
                        "level": int(level),
                        "key": key,
                        "name": p.get("name") or key,
                    }
                )
    return disc, powers


def normalize(s: str) -> str:
    s = s.lower().replace("\u2019", "'").replace("\u2018", "'")
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def extract_index_map(doc) -> dict[str, int]:
    """Parse trailing index pages for 'Name  123' entries."""
    index: dict[str, int] = {}
    # Index typically near end; scan last ~40 pages
    for i in range(max(0, len(doc) - 40), len(doc)):
        text = doc[i].get_text()
        # Patterns like "Terminal Decree  257" or "Drawing Out The\nBeast  247"
        # Also multi-column; join lines carefully.
        lines = [ln.strip() for ln in text.splitlines()]
        buf = ""
        for ln in lines:
            if not ln:
                continue
            # continuation of wrapped index entry (no page yet)
            candidate = f"{buf} {ln}".strip() if buf else ln
            m = re.search(r"^(.+?)\s+(\d{2,3})$", candidate)
            if m:
                name = m.group(1).strip(" .")
                page = int(m.group(2))
                # skip single letters / section headers
                if len(normalize(name)) >= 3 and page >= 100:
                    index[normalize(name)] = page
                buf = ""
            else:
                # maybe wrapped name without page on this line
                if re.match(r"^[A-Za-z]", ln) and not re.search(r"\d{2,3}$", ln):
                    buf = ln
                else:
                    buf = ""
    return index


def find_heading_page(doc, name: str, chapter_start: int, chapter_end: int) -> int | None:
    """Find page where power name appears as a standalone heading line."""
    variants = {
        normalize(name),
        name.lower(),
        name.lower().replace("'", "\u2019"),
        name.lower().replace("\u2019", "'"),
    }
    for i in range(len(doc)):
        page = doc[i]
        label = page.get_label() or ""
        lab = int(re.sub(r"[^0-9]", "", label) or 0)
        if lab and (lab < chapter_start - 1 or lab > chapter_end + 1):
            continue
        lines = [ln.strip() for ln in page.get_text().splitlines() if ln.strip()]
        for idx, ln in enumerate(lines):
            nln = normalize(ln)
            raw = ln.lower().replace("\u2019", "'")
            if nln in variants or raw in variants:
                # Prefer short heading-like lines
                if len(ln) > 60:
                    continue
                # Boost if nearby Level / Cost / Amalgam / Duration markers
                window = " ".join(lines[max(0, idx - 3) : idx + 5]).lower()
                score = 1
                if re.search(r"\blevel\s+[1-5]\b", window):
                    score += 3
                if "cost:" in window or "cost :" in window:
                    score += 2
                if "amalgam" in window:
                    score += 2
                if "duration:" in window:
                    score += 1
                if score >= 3:
                    return lab or None
                # even weak heading match inside chapter is useful
                if score >= 1 and lab:
                    return lab
    return None


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


def chapter_end(discipline: str) -> int:
    start = STARTS[discipline]
    later = sorted(p for p in STARTS.values() if p > start)
    return (later[0] - 1) if later else 290


def main():
    doc = fitz.open(PDF)
    disc, powers = load_powers()
    index = extract_index_map(doc)
    print(f"Index entries parsed: {len(index)}")

    results = []
    for p in powers:
        key = normalize(p["name"])
        page = index.get(key)
        method = "index" if page else None

        # try partial index keys (e.g. "drawing out the beast")
        if page is None:
            for ik, ip in index.items():
                if ik == key or ik.endswith(" " + key) or key.endswith(" " + ik):
                    if abs(len(ik) - len(key)) <= 10:
                        page = ip
                        method = "index-fuzzy"
                        break

        if page is None:
            start = STARTS[p["discipline"]]
            end = chapter_end(p["discipline"])
            page = find_heading_page(doc, p["name"], start, end)
            method = "heading" if page else None

        results.append({**p, "page": page, "method": method})

    matched = [r for r in results if r["page"]]
    missing = [r for r in results if not r["page"]]

    print(f"matched={len(matched)} missing={len(missing)}")
    for m in missing:
        print(f"  MISSING {m['discipline']} L{m['level']}: {m['name']}")

    by_disc = {}
    for r in results:
        by_disc.setdefault(r["discipline"], []).append(
            {"name": r["name"], "page": r["page"], "method": r["method"]}
        )
        print(
            f"{r['discipline']:20} L{r['level']} p={r['page']!s:>4} [{r['method']}] {r['name']}"
        )

    OUT.write_text(
        json.dumps(
            {
                "matched": len(matched),
                "missing": len(missing),
                "missing_list": missing,
                "results": results,
                "by_disc": by_disc,
                "index_sample_size": len(index),
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
