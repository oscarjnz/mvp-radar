"""Genera web/public/data/leaders.json: todas las categorias de bateo y pitcheo de 2026 para la tabla de lideres.
Lee los archivos que deja fetch_sources.py en data/raw. Las claves de estadistica son las mismas
que usa la MLB Stats API, asi la web puede comparar con temporadas anteriores consultando la API directamente.
Uso: python build_leaders.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "data", "raw")
OUT = os.path.join(ROOT, "web", "public", "data", "leaders.json")

HIT = ["gamesPlayed", "plateAppearances", "atBats", "runs", "hits", "doubles", "triples", "homeRuns", "rbi",
       "stolenBases", "caughtStealing", "baseOnBalls", "intentionalWalks", "strikeOuts", "hitByPitch", "sacFlies",
       "sacBunts", "groundIntoDoublePlay", "totalBases", "leftOnBase", "avg", "obp", "slg", "ops", "babip"]
HIT_SAB = {"wRcPlus": "wrcPlus", "woba": "woba", "war": "war"}
PIT = ["wins", "losses", "gamesPlayed", "gamesStarted", "completeGames", "shutouts", "saves", "holds", "blownSaves",
       "gamesFinished", "inningsPitched", "hits", "runs", "earnedRuns", "homeRuns", "baseOnBalls", "strikeOuts",
       "hitBatsmen", "wildPitches", "battersFaced", "era", "whip", "avg", "strikeoutsPer9Inn", "walksPer9Inn",
       "hitsPer9Inn", "homeRunsPer9", "strikeoutWalkRatio", "winPercentage", "groundOutsToAirouts", "strikePercentage"]
PIT_SAB = {"fip": "fip", "xfip": "xfip", "war": "war", "eraMinus": "eraMinus"}


def load(name):
    with open(os.path.join(RAW, name), encoding="utf-8") as fh:
        return json.load(fh)


def num(v):
    if v is None or v in ("", "-.--", ".---", "-"):
        return None
    try:
        f = float(v)
    except (TypeError, ValueError):
        return v
    return int(f) if f.is_integer() and "." not in str(v) else round(f, 3)


def build(group, keep, sab_map):
    season = load(f"mlb_{group}_season.json")["stats"][0]["splits"]
    sab = {s["player"]["id"]: s["stat"] for s in load(f"mlb_{group}_sabermetrics.json")["stats"][0]["splits"]}
    teams = {t["id"]: t["abbreviation"] for t in load("mlb_teams.json")["teams"]}
    leagues = {t["id"]: ("AL" if t.get("league", {}).get("id") == 103 else "NL") for t in load("mlb_teams.json")["teams"]}
    rows = []
    seen = set()
    for sp in season:
        pid = sp["player"]["id"]
        if pid in seen:
            continue  # jugadores con varios equipos: la primera fila es el total
        seen.add(pid)
        st = sp["stat"]
        tid = sp.get("team", {}).get("id")
        row = {"id": pid, "name": sp["player"]["fullName"], "team": teams.get(tid, "-"), "teamId": tid, "lg": leagues.get(tid, "")}
        pos = (sp.get("position") or {}).get("abbreviation")
        if pos:
            row["pos"] = pos
        for k in keep:
            v = num(st.get(k))
            if v is not None:
                row[k] = v
        for k, out in sab_map.items():
            v = num(sab.get(pid, {}).get(k))
            if v is not None:
                row[out] = v
        if group == "hitting" and "hits" in row:
            row["singles"] = row["hits"] - row.get("doubles", 0) - row.get("triples", 0) - row.get("homeRuns", 0)
        rows.append(row)
    return rows


def main():
    hit = build("hitting", HIT, HIT_SAB)
    pit = build("pitching", PIT, PIT_SAB)
    out = {"season": 2026, "asOf": "2026-09-27", "hitting": hit, "pitching": pit}
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(",", ":"))
    print("bateadores", len(hit), "lanzadores", len(pit), "bytes", os.path.getsize(OUT))


if __name__ == "__main__":
    main()
