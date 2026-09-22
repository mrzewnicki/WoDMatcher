"""Validate matched Corebook pages for sanity."""
from __future__ import annotations

import json
import sys

sys.stdout.reconfigure(encoding="utf-8")

data = json.loads(
    open(
        r"P:\VampireMatcher\data\analysis\corebook_page_match.json",
        encoding="utf-8",
    ).read()
)

starts = {
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

issues = []
for disc, items in data["by_disc"].items():
    start = starts[disc]
    print(f"\n=== {disc} (chapter ~{start}) ===")
    prev = 0
    for it in items:
        flags = []
        if it["page"] is None:
            flags.append("NONE")
        elif it["page"] < start - 1:
            flags.append("BEFORE_CHAPTER")
            issues.append((disc, it["name"], it["page"], "before"))
        if it["page"] is not None and it["page"] < prev:
            flags.append("NON_MONOTONIC")
            issues.append((disc, it["name"], it["page"], "order"))
        flag = (" " + " ".join(flags)) if flags else ""
        print(f"  {it['page']!s:>4}  {it['name']}{flag}  (hits={it['hits']})")
        if it["page"] is not None:
            prev = it["page"]

print(f"\nISSUES: {len(issues)}")
for i in issues:
    print(i)
