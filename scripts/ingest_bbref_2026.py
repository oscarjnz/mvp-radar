"""Ingiere las paginas 2026 de Baseball Reference (value batting/pitching, advanced batting)
guardadas por Firecrawl como rawHtml, y deja data/bbref_2026.json con WAR y metricas por jugador.
"""
import glob
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ingest_bbref_awards import TableGrabber, TOOL_RESULTS, RAW, ROOT  # noqa: E402

PAGES = {
    "value_batting": r"2026 Major League Baseball (Batting )?Value",
    "value_pitching": r"2026 Major League Baseball (Pitching )?Value",
    "advanced_batting": r"2026 Major League Baseball Advanced Batting",
}


def harvest():
    os.makedirs(RAW, exist_ok=True)
    for path in glob.glob(TOOL_RESULTS):
        try:
            with open(path, encoding="utf-8") as fh:
                data = json.load(fh)
        except Exception:
            continue
        html = data.get("rawHtml") if isinstance(data, dict) else None
        if not html:
            continue
        m = re.search(r"<title>([^<]*)</title>", html)
        title = m.group(1) if m else ""
        if "2026" not in title:
            continue
        ids = table_ids(html)
        slug = None
        if "players_advanced_batting" in ids:
            slug = "advanced_batting"
        elif "players_value_pitching" in ids:
            slug = "value_pitching"
        elif "players_value_batting" in ids:
            slug = "value_batting"
        if slug:
            dest = os.path.join(RAW, f"bbref_2026_{slug}.html")
            with open(dest, "w", encoding="utf-8") as out:
                out.write(html)
            print("guardado", slug, "<-", title)


def table_ids(html):
    return re.findall(r'<table[^>]*id="([^"]+)"', html)


def grab(html, table_id):
    g = TableGrabber(table_id)
    g.feed(html)
    return g.rows


def main():
    harvest()
    for f in sorted(glob.glob(os.path.join(RAW, "bbref_2026_*.html"))):
        html = open(f, encoding="utf-8").read()
        print(os.path.basename(f), len(html), table_ids(html))


if __name__ == "__main__":
    main()
