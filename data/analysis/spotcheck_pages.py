"""Spot-check fuzzy/heading matches against PDF headings."""
from __future__ import annotations

import re
import sys

import fitz

sys.stdout.reconfigure(encoding="utf-8")

PDF = r"R:\Podręczniki\Wampir\Vampire,_The_Masquerade_V5_Corebook_Extended.pdf"
doc = fitz.open(PDF)

checks = [
    ("Quell the Beast", 246),
    ("Earth Meld", 270),
    ("Baal's Caress", 274),
    ("Rapid Reflexes", 253),
    ("Submerged Directive", 257),
    ("Unswayable Mind", 258),
    ("Awaken the Sleeper", 287),
    ("Compel", 256),
    ("Cloud Memory", 256),
    ("Scry the Soul", 249),
    ("Possession", 251),
    ("Awe", 267),
    ("Terminal Decree", 257),
]


def normalize_match(name: str, ln: str) -> bool:
    a = re.sub(r"[^a-z0-9]+", "", name.lower().replace("\u2019", "'"))
    b = re.sub(r"[^a-z0-9]+", "", ln.lower().replace("\u2019", "'"))
    return a == b or a in b or b in a


def page_for_label(label: int):
    for i in range(len(doc)):
        lab = doc[i].get_label()
        if lab == str(label):
            return i
    return None


for name, page in checks:
    idx = page_for_label(page)
    print(f"\n=== {name} @ printed {page} (pdf idx {idx}) ===")
    if idx is None:
        print("  PAGE NOT FOUND")
        continue
    # show nearby pages too
    for j in range(max(0, idx - 1), min(len(doc), idx + 2)):
        text = doc[j].get_text()
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        hits = []
        for k, ln in enumerate(lines):
            if re.search(re.escape(name.split()[0]), ln, re.I) and len(ln) < 50:
                if normalize_match(name, ln):
                    ctx = " | ".join(lines[max(0, k - 1) : k + 2])
                    hits.append(ctx[:180])
        lab = doc[j].get_label()
        if hits:
            print(f"  label {lab}:")
            for h in hits[:4]:
                print(f"    {h}")
        elif re.search(re.escape(name), text, re.I):
            print(f"  label {lab}: mentioned (not heading-like)")
