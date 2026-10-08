"""Ingiere las paginas de votacion de premios de Baseball Reference guardadas por Firecrawl
y extrae las tablas de votacion MVP (AL y NL) a data/mvp_history_raw.json.

Las paginas se descargan con firecrawl_scrape (formato rawHtml); el resultado grande queda en
~/.claude/projects/<proyecto>/<sesion>/tool-results/*.txt. Este script busca esos archivos,
detecta el ano por el <title> y guarda el HTML en data/raw/bbref_awards_<ano>.html.
Tambien procesa los HTML ya guardados en data/raw si no hay archivos nuevos.
"""
import glob
import json
import os
import re
import sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "data", "raw")
OUT = os.path.join(ROOT, "data", "mvp_history_raw.json")
TOOL_RESULTS = os.path.expanduser(r"~/.claude/projects/C--Users-oscar/*/tool-results/mcp-firecrawl-firecrawl_scrape-*.txt")


def harvest():
    os.makedirs(RAW, exist_ok=True)
    found = {}
    for path in glob.glob(TOOL_RESULTS):
        try:
            with open(path, encoding="utf-8") as fh:
                data = json.load(fh)
        except Exception:
            continue
        html = data.get("rawHtml") if isinstance(data, dict) else None
        if not html:
            continue
        m = re.search(r"<title>\s*(\d{4}) Awards Voting", html)
        if not m:
            continue
        year = int(m.group(1))
        dest = os.path.join(RAW, f"bbref_awards_{year}.html")
        with open(dest, "w", encoding="utf-8") as out:
            out.write(html)
        found[year] = dest
    return found


class TableGrabber(HTMLParser):
    """Captura filas de una tabla por id usando los atributos data-stat de cada celda."""

    def __init__(self, table_id):
        super().__init__(convert_charrefs=True)
        self.table_id = table_id
        self.depth = 0
        self.in_table = False
        self.rows = []
        self.row = None
        self.cell_stat = None
        self.cell_text = []
        self.cell_href = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "table":
            if a.get("id") == self.table_id:
                self.in_table = True
                self.depth = 1
            elif self.in_table:
                self.depth += 1
        if not self.in_table:
            return
        if tag == "tr":
            self.row = {}
        elif tag in ("td", "th") and self.row is not None:
            self.cell_stat = a.get("data-stat")
            self.cell_text = []
            self.cell_href = None
        elif tag == "a" and self.cell_stat is not None and a.get("href"):
            self.cell_href = a["href"]

    def handle_endtag(self, tag):
        if not self.in_table:
            return
        if tag in ("td", "th") and self.row is not None and self.cell_stat:
            self.row[self.cell_stat] = "".join(self.cell_text).strip()
            if self.cell_href and self.cell_stat in ("player", "name_display"):
                self.row[self.cell_stat + "_href"] = self.cell_href
            self.cell_stat = None
        elif tag == "tr" and self.row is not None:
            if self.row.get("player") or self.row.get("name_display"):
                self.rows.append(self.row)
            self.row = None
        elif tag == "table":
            self.depth -= 1
            if self.depth == 0:
                self.in_table = False

    def handle_data(self, data):
        if self.in_table and self.cell_stat is not None:
            self.cell_text.append(data)


def uncomment(html):
    """BBRef esconde varias tablas dentro de comentarios HTML."""
    return re.sub(r"<!--(.*?)-->", lambda m: m.group(1), html, flags=re.S)


def parse_year(year):
    path = os.path.join(RAW, f"bbref_awards_{year}.html")
    with open(path, encoding="utf-8") as fh:
        raw = fh.read()
    out = {}
    for lg in ("AL", "NL"):
        rows = []
        # las tablas de votacion estan a la vista; solo si no aparecen se busca dentro de comentarios
        for html in (raw, uncomment(raw)):
            g = TableGrabber(f"{lg}_MVP_voting")
            g.feed(html)
            rows = [r for r in g.rows if r.get("player") not in (None, "Name")]
            if rows:
                break
        out[lg] = rows
    return out


def main():
    found = harvest()
    print("anos encontrados en tool-results:", sorted(found))
    years = sorted(
        int(re.search(r"(\d{4})", f).group(1))
        for f in os.listdir(RAW)
        if f.startswith("bbref_awards_")
    )
    result = {}
    for y in years:
        parsed = parse_year(y)
        result[str(y)] = parsed
        print(y, {lg: len(rows) for lg, rows in parsed.items()}, "top:", [r.get("player") or r.get("name_display") for lg in parsed for r in parsed[lg][:1]])
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(result, fh, ensure_ascii=False, indent=1)
    print("escrito", OUT)


if __name__ == "__main__":
    sys.exit(main())
