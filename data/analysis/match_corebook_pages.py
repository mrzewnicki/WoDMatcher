"""Match Corebook discipline powers to printed page numbers."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import fitz

sys.stdout.reconfigure(encoding="utf-8")

PDF_PATH = Path(r"R:\Podręczniki\Wampir\Vampire,_The_Masquerade_V5_Corebook_Extended.pdf")
DISC_PATH = Path(r"P:\VampireMatcher\data\V5_disciplines.json")
OUT_PATH = Path(r"P:\VampireMatcher\data\analysis\corebook_page_match.json")

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

SKIP = {"General Rules", "Rituals", "_meta"}


def load_powers() -> list[dict]:
    disc = json.loads(DISC_PATH.read_text(encoding="utf-8"))
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
    return powers


def chapter_end(discipline: str) -> int:
    start = STARTS[discipline]
    later = sorted(p for p in STARTS.values() if p > start)
    return (later[0] if later else 290) + 3


def label_int(label: str) -> int | None:
    digits = re.sub(r"[^0-9]", "", label or "")
    return int(digits) if digits else None


def variants(name: str) -> list[str]:
    out = [
        name,
        name.replace("\u2019", "'"),
        name.replace("'", "\u2019"),
        name.replace("\u2018", "'"),
    ]
    # normalize curly apostrophe variants already covered
    seen: set[str] = set()
    uniq = []
    for v in out:
        if v not in seen:
            seen.add(v)
            uniq.append(v)
    return uniq


def main() -> None:
    doc = fitz.open(PDF_PATH)
    powers = load_powers()

    # Pre-extract text per page once
    pages_text: list[tuple[str, int | None, str]] = []
    for i in range(len(doc)):
        page = doc[i]
        label = page.get_label() or str(i + 1)
        pages_text.append((page.get_text(), label_int(label), label))

    results = []
    for p in powers:
        hits = []
        for i, (text, lab, label) in enumerate(pages_text):
            found = False
            for v in variants(p["name"]):
                if re.search(re.escape(v), text, re.IGNORECASE):
                    found = True
                    break
            if found:
                hits.append(
                    {
                        "pdf_index": i,
                        "pdf_page": i + 1,
                        "label": label,
                        "label_int": lab,
                    }
                )

        start = STARTS.get(p["discipline"], 240)
        end = chapter_end(p["discipline"]) if p["discipline"] in STARTS else 295

        in_window = [
            h
            for h in hits
            if h["label_int"] is not None and start - 1 <= h["label_int"] <= end
        ]

        chosen = None
        if in_window:
            in_window.sort(key=lambda h: h["label_int"] or 9999)
            chosen = in_window[0]
        else:
            body = [
                h
                for h in hits
                if h["label_int"] is not None and h["label_int"] >= 200
            ]
            if body:
                body.sort(key=lambda h: h["label_int"] or 9999)
                chosen = body[0]

        results.append(
            {
                **p,
                "page": chosen["label_int"] if chosen else None,
                "pdf_page": chosen["pdf_page"] if chosen else None,
                "hit_count": len(hits),
                "window_hits": len(in_window),
                "all_hits": [
                    {"label": h["label"], "pdf": h["pdf_page"]} for h in hits[:10]
                ],
            }
        )

    matched = [r for r in results if r["page"] is not None]
    missing = [r for r in results if r["page"] is None]

    by_disc: dict = {}
    for r in results:
        by_disc.setdefault(r["discipline"], []).append(
            {"name": r["name"], "page": r["page"], "hits": r["hit_count"]}
        )

    out = {
        "matched": len(matched),
        "missing": len(missing),
        "missing_list": missing,
        "results": results,
        "by_disc": by_disc,
    }
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"matched={len(matched)} missing={len(missing)}")
    print("MISSING:")
    for m in missing:
        print(f"  {m['discipline']} L{m['level']}: {m['name']} (hits={m['hit_count']})")


if __name__ == "__main__":
    main()
