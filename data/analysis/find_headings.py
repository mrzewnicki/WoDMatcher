"""Find exact heading pages for a few powers."""
from __future__ import annotations

import re
import sys

import fitz

sys.stdout.reconfigure(encoding="utf-8")

doc = fitz.open(r"R:\Podręczniki\Wampir\Vampire,_The_Masquerade_V5_Corebook_Extended.pdf")

names = [
    "Baal's Caress",
    "Baal’s Caress",
    "Scry the Soul",
    "Possession",
    "Quell the Beast",
]


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", s.lower().replace("\u2019", "'").replace("\u2018", "'"))


for name in names:
    target = norm(name)
    print(f"\n==== {name} ====")
    for i in range(len(doc)):
        lab = doc[i].get_label()
        try:
            li = int(re.sub(r"[^0-9]", "", lab or "") or 0)
        except ValueError:
            li = 0
        if li and not (240 <= li <= 295):
            continue
        lines = [ln.strip() for ln in doc[i].get_text().splitlines() if ln.strip()]
        for k, ln in enumerate(lines):
            if norm(ln) == target:
                ctx = " | ".join(lines[max(0, k - 2) : k + 3])
                print(f"  HEADING label={lab}: {ctx[:200]}")
