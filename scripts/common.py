"""Utilidades compartidas del pipeline de datos."""
import csv
import io
import json
import os
import re
import sys
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "data", "raw")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def jload(name):
    with open(os.path.join(RAW, name), encoding="utf-8") as fh:
        return json.load(fh)


def csv_rows(name):
    with open(os.path.join(RAW, name), encoding="utf-8-sig") as fh:
        return list(csv.DictReader(io.StringIO(fh.read())))


def norm(name):
    """Normaliza nombres entre fuentes: sin acentos, sin marcas * #, minusculas, sin sufijos."""
    s = unicodedata.normalize("NFKD", name or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[*#]", "", s)
    s = re.sub(r"[.’']", "", s)
    s = re.sub(r"\s+", " ", s).strip().lower()
    return s


def fnum(x, default=None):
    try:
        if x in (None, "", "-.--", "-"):
            return default
        return float(str(x).replace("%", ""))
    except ValueError:
        return default


def league_of(team_id, teams):
    return teams[team_id]["lg"]


def load_teams():
    teams = {}
    for t in jload("mlb_teams.json")["teams"]:
        teams[t["id"]] = {
            "id": t["id"],
            "abbr": t["abbreviation"],
            "name": t["teamName"],
            "full": t["name"],
            "lg": "AL" if t["league"]["id"] == 103 else "NL",
        }
    return teams


def load_standings(teams):
    out = {}
    for rec in jload("mlb_standings.json")["records"]:
        for tr in rec["teamRecords"]:
            tid = tr["team"]["id"]
            clinch = tr.get("clinchIndicator")
            out[tid] = {
                "w": tr["wins"],
                "l": tr["losses"],
                "pct": float(tr["winningPercentage"]),
                "divRank": int(tr["divisionRank"]),
                "lgRank": int(tr["leagueRank"]),
                "playoffs": clinch in ("z", "y", "w", "x"),
                "divWinner": clinch in ("z", "y"),
                "bestRecord": clinch == "z",
            }
    return out


def parse_bbref_value_batting_md():
    """Parsea la tabla markdown de 2026 value batting guardada por Firecrawl."""
    d = json.load(open(os.path.join(RAW, "bbref_2026_value_batting_md.json"), encoding="utf-8"))
    rows = []
    for line in d["markdown"].split("\n"):
        if not line.startswith("|") or "Rk" in line:
            continue
        line = re.sub(r"\]\([^)]*\)", "", line).replace("[", "")
        cells = [c.strip().replace("\\", "").replace("*", "").replace("_", "") for c in line.strip().strip("|").split("|")]
        if len(cells) < 20 or not cells[0].isdigit():
            continue
        # Rk Player Age Team Lg PA Rbat Rbaser Rdp Rfield Rpos RAA WAA Rrep RAR WAR ... oWAR dWAR
        rows.append({
            "name": cells[1].replace("#", ""),
            "age": cells[2], "team": cells[3], "lg": cells[4], "pa": fnum(cells[5]),
            "rbat": fnum(cells[6]), "rbaser": fnum(cells[7]), "rfield": fnum(cells[9]),
            "rpos": fnum(cells[10]), "war": fnum(cells[15]), "owar": fnum(cells[18]), "dwar": fnum(cells[19]),
        })
    return rows
