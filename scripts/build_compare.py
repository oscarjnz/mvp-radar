"""Genera web/public/data/compare.json y web/public/data/profiles.json.

compare.json: para cada votacion (año-liga) el ganador y sus rivales directos (los votados con mas WAR
que el ganador o, si no hay, los siguientes en la boleta) con estadisticas comparables, incluidos fWAR y wRC+
de la MLB Stats API.
profiles.json: biografia, reconocimientos y trayectoria en la votacion 2016-2025 de cada jugador que aparece
en una tarjeta de la web (ganadores, casos de 'debio ganar', casi y rivales).
"""
import json
import os
import urllib.request

from build_history import (OUT as HISTORY_OUT, RAW_HISTORY, TEAM_MAP, UA, YEARS, get, mlb_id, playoff_teams,
                           row_to_ballot, standings)
from common import RAW, ROOT, fnum, norm

WEB = os.path.join(ROOT, "web", "public", "data")
MLB = "https://statsapi.mlb.com/api/v1"


def cached(name, url):
    path = os.path.join(RAW, name)
    if not os.path.exists(path):
        try:
            data = get(url)
        except Exception:  # noqa: BLE001
            data = None
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(data, fh)
    return json.load(open(path, encoding="utf-8"))


def sab(pid, year, group):
    d = cached(f"sab_{pid}_{year}_{group}.json", f"{MLB}/people/{pid}/stats?stats=sabermetrics&group={group}&season={year}&gameType=R")
    try:
        return d["stats"][0]["splits"][0]["stat"]
    except Exception:  # noqa: BLE001
        return {}


def enrich(b, year):
    pid = b.get("mlbId") or mlb_id(b["name"])
    b["mlbId"] = pid
    if not pid:
        return b
    if b["role"] in ("hitter", "twoway"):
        s = sab(pid, year, "hitting")
        b["fwar_h"] = round(s["war"], 1) if s.get("war") is not None else None
        b["wrc"] = round(s["wRcPlus"]) if s.get("wRcPlus") is not None else None
        b["parts"] = {"bat": round(s.get("batting", 0), 1), "fld": round(s.get("fielding", 0), 1),
                      "bsr": round(s.get("baseRunning", 0), 1), "pos": round(s.get("positional", 0), 1)} if s else None
    if b["role"] in ("pitcher", "twoway"):
        s = sab(pid, year, "pitching")
        b["fwar_p"] = round(s["war"], 1) if s.get("war") is not None else None
        b["fip"] = round(s["fip"], 2) if s.get("fip") is not None else None
    fw = (b.get("fwar_h") or 0) + (b.get("fwar_p") or 0)
    b["fwar"] = round(fw, 1) if (b.get("fwar_h") is not None or b.get("fwar_p") is not None) else None
    return b


def main():
    raw = json.load(open(RAW_HISTORY, encoding="utf-8"))
    hist = json.load(open(HISTORY_OUT, encoding="utf-8"))
    compare = {}
    card_names = {}  # nombre -> mlbId, de todas las tarjetas
    all_rows = {}    # (año, liga) -> boleta completa

    for year in YEARS:
        st = standings(year)
        po = playoff_teams(year)
        for lg in ("AL", "NL"):
            ballots = [row_to_ballot(r, lg, year, st, po) for r in raw[str(year)][lg]]
            all_rows[(year, lg)] = ballots
            win = ballots[0]
            better = sorted([b for b in ballots[1:] if b["war"] is not None and b["war"] > win["war"]], key=lambda b: -b["war"])[:3]
            rivals = list(better)
            for b in ballots[1:]:
                if len(rivals) >= 2:
                    break
                if b not in rivals:
                    rivals.append(b)
            entry = {"year": year, "lg": lg, "winner": enrich(dict(win), year), "rivals": [enrich(dict(r), year) for r in rivals],
                     "betterCount": len(better)}
            compare[f"{year}-{lg}"] = entry
            for p in [entry["winner"]] + entry["rivals"]:
                if p.get("mlbId"):
                    card_names[p["name"]] = p["mlbId"]
    # tarjetas de 'debio ganar' y casi
    for sn in hist["snubs"] + hist.get("nearMisses", []):
        pid = sn.get("mlbId") or mlb_id(sn["name"])
        if pid:
            card_names[sn["name"]] = pid

    # perfiles
    profiles = {}
    for name, pid in card_names.items():
        bio = cached(f"bio_{pid}.json", f"{MLB}/people/{pid}?hydrate=currentTeam,draft")
        aw = cached(f"awards_{pid}.json", f"{MLB}/people/{pid}/awards")
        if not bio or not bio.get("people"):
            continue
        b = bio["people"][0]
        awards = {}
        for a in (aw or {}).get("awards", []):
            n = a.get("name") or ""
            keep = None
            for key, label in (("MVP", "MVP"), ("Cy Young", "Cy Young"), ("Rookie of the Year", "Novato del Año"),
                               ("Gold Glove", "Guante de Oro"), ("Silver Slugger", "Bate de Plata"), ("All-Star", "Juego de Estrellas"),
                               ("Hank Aaron", "Premio Hank Aaron")):
                if key in n and "MiLB" not in n and "Minor" not in n and "Post-Season" not in n and "Double-A" not in n and "Triple-A" not in n and "Organization" not in n and "Futures" not in n:
                    keep = label
                    break
            if keep:
                awards.setdefault(keep, set()).add(str(a.get("season")))
        seasons = []
        for (year, lg), ballots in all_rows.items():
            for r in ballots:
                if norm(r["name"]) == norm(name):
                    seasons.append({"year": year, "lg": lg, "rank": r["rank"], "share": r["share"], "first": r["first"], "pts": r["pts"],
                                    "war": r["war"], "team": r["team"], "w": r["w"], "l": r["l"], "playoffs": r["playoffs"], "role": r["role"],
                                    "bat": r["bat"], "pit": r["pit"], "won": r["rank"] == 1})
        seasons.sort(key=lambda s: s["year"])
        ct = b.get("currentTeam") or {}
        profiles[str(pid)] = {
            "id": pid, "name": b.get("fullName"), "number": b.get("primaryNumber"), "birth": b.get("birthDate"), "age": b.get("currentAge"),
            "city": b.get("birthCity"), "country": b.get("birthCountry"), "height": b.get("height"), "weight": b.get("weight"),
            "pos": (b.get("primaryPosition") or {}).get("abbreviation"), "bats": (b.get("batSide") or {}).get("code"),
            "throws": (b.get("pitchHand") or {}).get("code"), "debut": b.get("mlbDebutDate"), "teamName": ct.get("name"), "teamId": ct.get("id"),
            "active": b.get("active"),
            "awards": {k: sorted(v) for k, v in awards.items()}, "seasons": seasons,
            "links": {"mlb": f"https://www.mlb.com/player/{pid}", "savant": f"https://baseballsavant.mlb.com/savant-player/{pid}",
                      "bbref": f"https://www.baseball-reference.com/search/search.fcgi?search={(b.get('fullName') or name).replace(' ', '+')}"},
        }
    with open(os.path.join(WEB, "compare.json"), "w", encoding="utf-8") as fh:
        json.dump(compare, fh, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(WEB, "profiles.json"), "w", encoding="utf-8") as fh:
        json.dump(profiles, fh, ensure_ascii=False, separators=(",", ":"))
    print("compare", len(compare), "perfiles", len(profiles))
    missing = [n for n, p in card_names.items() if str(p) not in profiles]
    print("sin perfil", missing)


if __name__ == "__main__":
    main()
