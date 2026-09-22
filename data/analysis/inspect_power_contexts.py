"""Inspect PDF text around suspicious / all power matches."""
from __future__ import annotations

import json
import re
import sys

import fitz

sys.stdout.reconfigure(encoding="utf-8")

PDF = r"R:\Podręczniki\Wampir\Vampire,_The_Masquerade_V5_Corebook_Extended.pdf"
MATCH = r"P:\VampireMatcher\data\analysis\corebook_page_match.json"

doc = fitz.open(PDF)
data = json.loads(open(MATCH, encoding="utf-8").read())

# Focus on suspicious ones + sample of good ones
suspects = [
    "Terminal Decree",
    "Compel",
    "Possession",
    "Awe",
    "Majesty",
    "Dread Gaze",
    "Conceal",
    "Vanish",
    "Blink",
    "Rationalize",
    "Summon",
]


def contexts_for(name: str, max_pages: int = 8) -> None:
    print(f"\n######## {name} ########")
    count = 0
    for i in range(len(doc)):
        page = doc[i]
        text = page.get_text()
        if not re.search(re.escape(name), text, re.I):
            continue
        label = page.get_label()
        # show surrounding lines
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        for idx, ln in enumerate(lines):
            if re.search(re.escape(name), ln, re.I):
                start = max(0, idx - 2)
                end = min(len(lines), idx + 4)
                snippet = " || ".join(lines[start:end])
                print(f"  pdf={i+1} label={label}: {snippet[:220]}")
                count += 1
                if count >= max_pages:
                    return


for s in suspects:
    contexts_for(s)
