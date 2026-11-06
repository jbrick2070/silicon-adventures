"""Check that every exact-input hint in game/hints.js was an input of the
winning run recorded in campaign-trace.tsv. Run: python archive/es/check_hints.py"""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[2]


def main():
    trace = {line.split("\t")[1].strip().lower()
             for line in (ROOT / "archive/es/campaign-trace.tsv").read_text(encoding="utf-8").splitlines()[1:]
             if line.count("\t") >= 2 and line.split("\t")[0] == "turn"}
    js = (ROOT / "game/hints.js").read_text(encoding="utf-8")
    tiers = re.findall(r"\[((?:'[^']*'(?:,\s*)?)+)\]\]", js)
    missing = []
    total = 0
    for tier in tiers:
        for word in re.findall(r"'([^']*)'", tier):
            total += 1
            if word.lower() not in trace and not word.startswith('click '):
                missing.append(word)
    if missing:
        raise SystemExit(f"{len(missing)} hint inputs never appear in the winning run: {missing}")
    print(f"All {total} exact-input hints across {len(tiers)} milestones appear in campaign-trace.tsv.")


if __name__ == "__main__":
    main()
