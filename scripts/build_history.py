"""Construye web/public/data/history.json: los ultimos 10 MVP (2016-2025, AL y NL), su boleta completa,
contexto de equipo, veredicto frente a WAR, casos de 'debio ganar' y estadisticas agregadas
(que premian los votantes, que cambio entre 2016-2020 y 2021-2025).
Fuentes: Baseball Reference (votacion y WAR) y MLB Stats API (standings, ids de jugadores).
"""
import json
import os
import urllib.parse
import urllib.request

import numpy as np

from common import RAW, ROOT, fnum, jload, norm
from ingest_bbref_awards import OUT as RAW_HISTORY

MLB = "https://statsapi.mlb.com/api/v1"
UA = {"User-Agent": "Mozilla/5.0 (baseball-lab personal research)"}
YEARS = list(range(2016, 2026))
OUT = os.path.join(ROOT, "web", "public", "data", "history.json")

# BBRef -> abreviatura de la MLB Stats API
TEAM_MAP = {"KCR": "KC", "TBR": "TB", "SDP": "SD", "SFG": "SF", "CHW": "CWS", "WSN": "WSH", "ARI": "AZ", "OAK": "ATH"}

# Posicion del ganador (dato de contexto; la fuente de votos no la incluye)
WINNER_POS = {
    (2016, "AL"): "CF", (2016, "NL"): "3B", (2017, "AL"): "2B", (2017, "NL"): "RF",
    (2018, "AL"): "RF", (2018, "NL"): "LF", (2019, "AL"): "CF", (2019, "NL"): "CF",
    (2020, "AL"): "1B", (2020, "NL"): "1B", (2021, "AL"): "DH/P", (2021, "NL"): "RF",
    (2022, "AL"): "RF", (2022, "NL"): "1B", (2023, "AL"): "DH/P", (2023, "NL"): "RF",
    (2024, "AL"): "RF", (2024, "NL"): "DH", (2025, "AL"): "RF", (2025, "NL"): "DH/P",
}


def get(url):
    return json.loads(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read())


def standings(year):
    path = os.path.join(RAW, f"mlb_standings_{year}.json")
    if not os.path.exists(path):
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(get(f"{MLB}/standings?leagueId=103,104&season={year}&standingsTypes=regularSeason&hydrate=team"), fh)
    data = json.load(open(path, encoding="utf-8"))
    out = {}
    for rec in data["records"]:
        for tr in rec["teamRecords"]:
            t = tr["team"]
            out[t["abbreviation"]] = {
                "id": t["id"], "name": t.get("teamName") or t["name"], "w": tr["wins"], "l": tr["losses"],
                "divWinner": tr.get("clinchIndicator") in ("z", "y"),
                "playoffs": tr.get("clinchIndicator") in ("z", "y", "w", "x") or tr.get("wildCardRank") in ("1", "2", "3") and False,
                "divRank": int(tr["divisionRank"]),
            }
    return out


def playoff_teams(year):
    """Equipos de postemporada por abreviatura, via calendario de postemporada (mas fiable que clinch)."""
    path = os.path.join(RAW, f"mlb_postseason_{year}.json")
    if not os.path.exists(path):
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(get(f"{MLB}/schedule/postseason?season={year}"), fh)
    data = json.load(open(path, encoding="utf-8"))
    ids = set()
    for d in data.get("dates", []):
        for g in d["games"]:
            for side in ("home", "away"):
                ids.add(g["teams"][side]["team"]["id"])
    return ids


def mlb_id(name):
    path = os.path.join(RAW, "mlb_ids.json")
    cache = json.load(open(path, encoding="utf-8")) if os.path.exists(path) else {}
    if name in cache:
        return cache[name]
    try:
        res = get(f"{MLB}/people/search?names={urllib.parse.quote(name)}")["people"]
    except Exception:  # noqa: BLE001
        res = []
    pid = None
    for p in res:
        if norm(p["fullName"]) == norm(name):
            pid = p["id"]
            break
    if pid is None and res:
        pid = res[0]["id"]
    cache[name] = pid
    json.dump(cache, open(path, "w", encoding="utf-8"), ensure_ascii=False)
    return pid


def clean_name(n):
    return n.replace(" ", " ").strip()


def row_to_ballot(r, lg, year, st, po_ids):
    team = TEAM_MAP.get(r.get("team_ID"), r.get("team_ID"))
    tinfo = st.get(team) if r.get("team_ID") not in ("TOT", "2TM", "3TM") else None
    ip = fnum(r.get("IP"))
    pitcher = bool(ip and ip > 0)
    hitter = bool(fnum(r.get("AB")) and fnum(r.get("AB")) > (150 if pitcher else 20))
    return {
        "rank": int(r["rank"].replace("T", "")),
        "name": clean_name(r["player"]),
        "bbref": (r.get("player_href") or "").rsplit("/", 1)[-1].replace(".shtml", ""),
        "team": team,
        "teamId": tinfo["id"] if tinfo else None,
        "w": tinfo["w"] if tinfo else None,
        "l": tinfo["l"] if tinfo else None,
        "playoffs": (tinfo["id"] in po_ids) if tinfo else None,
        "divWinner": tinfo["divWinner"] if tinfo else None,
        "pts": fnum(r.get("points_won")),
        "first": fnum(r.get("votes_first")),
        "share": fnum(r.get("share")),
        "war": fnum(r.get("WAR")),
        "role": "twoway" if (pitcher and hitter) else ("pitcher" if pitcher else "hitter"),
        "bat": {"g": fnum(r.get("G")), "r": fnum(r.get("R")), "h": fnum(r.get("H")), "hr": fnum(r.get("HR")),
                "rbi": fnum(r.get("RBI")), "sb": fnum(r.get("SB")), "bb": fnum(r.get("BB")),
                "avg": r.get("batting_avg"), "obp": r.get("onbase_perc"), "slg": r.get("slugging_perc"),
                "ops": r.get("onbase_plus_slugging")} if hitter else None,
        "pit": {"w": fnum(r.get("W")), "l": fnum(r.get("L")), "era": r.get("earned_run_avg"), "whip": r.get("whip"),
                "ip": ip, "so": fnum(r.get("SO_p") or r.get("SO")), "sv": fnum(r.get("SV"))} if pitcher else None,
    }


def verdict(winner, leader, ballot):
    """Veredicto transparente basado solo en la brecha de WAR contra el mejor WAR de los votados."""
    gap = round(leader["war"] - winner["war"], 1)
    if gap <= 0.3:
        return "acertado", gap
    if gap <= 1.5:
        return "discutible", gap
    return "cuestionable", gap


def main():
    raw = json.load(open(RAW_HISTORY, encoding="utf-8"))
    seasons = []
    flat = []  # filas para regresion
    for year in YEARS:
        st = standings(year)
        po = playoff_teams(year)
        season = {"year": year}
        for lg in ("AL", "NL"):
            ballots = [row_to_ballot(r, lg, year, st, po) for r in raw[str(year)][lg]]
            winner = ballots[0]
            leader = max(ballots, key=lambda b: b["war"] if b["war"] is not None else -99)
            v, gap = verdict(winner, leader, ballots)
            season[lg] = {
                "winner": winner,
                "pos": WINNER_POS[(year, lg)],
                "warLeader": {"name": leader["name"], "war": leader["war"], "rank": leader["rank"], "role": leader["role"],
                                "team": leader["team"]},
                "warLeaderWon": leader["name"] == winner["name"] or (gap <= 0.0),
                "verdict": v,
                "warGap": gap,
                "unanimous": winner["first"] is not None and winner["share"] == 100,
                "top10": ballots[:10],
                "voted": len(ballots),
            }
            for b in ballots:
                if b["war"] is None:
                    continue
                flat.append((year, lg, b, winner))
        seasons.append(season)

    # ---------- agregados ----------
    winners = [(s["year"], lg, s[lg]) for s in seasons for lg in ("AL", "NL")]
    n = len(winners)

    def pct(k):
        return round(100 * k / n)

    playoffs_k = sum(1 for _y, _lg, d in winners if d["winner"]["playoffs"])
    war_leader_k = sum(1 for _y, _lg, d in winners if d["warGap"] <= 0.0)
    within_k = sum(1 for _y, _lg, d in winners if d["warGap"] <= 0.5)
    hit_k = sum(1 for _y, _lg, d in winners if d["winner"]["role"] == "hitter")
    two_k = sum(1 for _y, _lg, d in winners if d["winner"]["role"] == "twoway")
    pit_k = sum(1 for _y, _lg, d in winners if d["winner"]["role"] == "pitcher")
    unani = sum(1 for _y, _lg, d in winners if d["unanimous"])

    def block(sel):
        ws = [d["winner"] for y, _lg, d in winners if sel(y)]
        gaps = [d["warGap"] for y, _lg, d in winners if sel(y)]
        return {
            "n": len(ws),
            "avgWar": round(float(np.mean([w["war"] for w in ws])), 1),
            "playoffsPct": round(100 * np.mean([1 if w["playoffs"] else 0 for w in ws])),
            "avgHr": round(float(np.mean([w["bat"]["hr"] for w in ws if w["bat"]])), 1),
            "avgShare": round(float(np.mean([w["share"] for w in ws]))),
            "unanimous": sum(1 for y, _lg, d in winners if sel(y) and d["unanimous"]),
            "avgWarGap": round(float(np.mean(gaps)), 2),
            "warLeaderWon": sum(1 for g in gaps if g <= 0.0),
            "twoWay": sum(1 for w in ws if w["role"] == "twoway"),
        }

    early, late = block(lambda y: y <= 2020), block(lambda y: y >= 2021)

    # Regresion lineal: share ~ WAR_z + playoffs + pitcher + hr_leader proxy (hr/10) + winPct
    X, y_, labels = [], [], []
    for year, lg, b, winner in flat:
        if b["share"] is None or b["playoffs"] is None or b["w"] is None:
            continue
        war_pool = [bb["war"] for yy, ll, bb, _ in flat if yy == year and ll == lg and bb["war"] is not None]
        mu, sd = float(np.mean(war_pool)), float(np.std(war_pool)) or 1.0
        X.append([1.0, (b["war"] - mu) / sd, 1.0 if b["playoffs"] else 0.0,
                  ((b["bat"] or {}).get("hr") or 0) / 10.0, (b["w"] / max(1, b["w"] + b["l"]) - 0.5) * 10.0])
        y_.append(b["share"] / 100.0)
    Xa, ya = np.array(X), np.array(y_)
    beta, *_ = np.linalg.lstsq(Xa, ya, rcond=None)
    pred = Xa @ beta
    ss_res, ss_tot = float(np.sum((ya - pred) ** 2)), float(np.sum((ya - ya.mean()) ** 2))
    r2 = 1 - ss_res / ss_tot
    names = ["Constante", "WAR (z dentro de la liga y ano)", "Equipo en playoffs", "Jonrones (por cada 10)", "Pct. de victorias del equipo (por cada .100)"]
    coefs = [{"label": nm, "value": round(float(c), 3)} for nm, c in zip(names, beta)]

    # Mismo modelo por mitad de la decada
    halves = {}
    for tag, rng in (("2016-2020", range(2016, 2021)), ("2021-2025", range(2021, 2026))):
        Xs, ys = [], []
        for year, lg, b, winner in flat:
            if year not in rng or b["share"] is None or b["playoffs"] is None or b["w"] is None:
                continue
            pool = [bb["war"] for yy, ll, bb, _ in flat if yy == year and ll == lg and bb["war"] is not None]
            mu, sd = float(np.mean(pool)), float(np.std(pool)) or 1.0
            Xs.append([1.0, (b["war"] - mu) / sd, 1.0 if b["playoffs"] else 0.0,
                       ((b["bat"] or {}).get("hr") or 0) / 10.0, (b["w"] / max(1, b["w"] + b["l"]) - 0.5) * 10.0])
            ys.append(b["share"] / 100.0)
        bt, *_ = np.linalg.lstsq(np.array(Xs), np.array(ys), rcond=None)
        halves[tag] = [round(float(c), 3) for c in bt]

    # Correlacion de rangos WAR vs rango de voto por boleta (Spearman simple)
    def spearman(year, lg):
        rows = [b for yy, ll, b, _ in flat if yy == year and ll == lg and b["war"] is not None]
        war_rank = np.argsort(np.argsort([-r["war"] for r in rows]))
        vote_rank = np.array([r["rank"] for r in rows]) - 1
        return float(np.corrcoef(war_rank, vote_rank)[0, 1])
    corr = {str(yr): round((spearman(yr, "AL") + spearman(yr, "NL")) / 2, 2) for yr in YEARS}

    # Casos "debio ganar": jugadores votados con WAR >= WAR del ganador + 0.5 (o lider de WAR no ganador)
    snubs = []
    for year, lg, b, winner in flat:
        if b["name"] == winner["name"] or b["war"] is None:
            continue
        gap = round(b["war"] - winner["war"], 1)
        if gap >= 0.5:
            snubs.append({"year": year, "lg": lg, "name": b["name"], "team": b["team"], "role": b["role"], "voteRank": b["rank"],
                          "share": b["share"], "war": b["war"], "winner": winner["name"], "winnerWar": winner["war"],
                          "warGap": gap, "w": b["w"], "l": b["l"], "playoffs": b["playoffs"], "bat": b["bat"], "pit": b["pit"]})
    snubs.sort(key=lambda x: -x["warGap"])
    near = []
    for year, lg, b, winner in flat:
        if b["name"] == winner["name"] or b["war"] is None:
            continue
        gap = round(b["war"] - winner["war"], 1)
        if 0.2 <= gap < 0.5:
            near.append({"year": year, "lg": lg, "name": b["name"], "team": b["team"], "role": b["role"], "voteRank": b["rank"],
                         "share": b["share"], "war": b["war"], "winner": winner["name"], "winnerWar": winner["war"], "warGap": gap})
    near.sort(key=lambda x: -x["warGap"])

    closest = []
    for sn_ in seasons:
        for lg in ("AL", "NL"):
            d = sn_[lg]
            b2 = d["top10"][1]
            closest.append({"year": sn_["year"], "lg": lg, "winner": d["winner"]["name"], "second": b2["name"],
                            "ptsGap": round(d["winner"]["pts"] - b2["pts"], 1), "firstWinner": d["winner"]["first"],
                            "firstSecond": b2["first"], "warWinner": d["winner"]["war"], "warSecond": b2["war"],
                            "shareGap": round(d["winner"]["share"] - b2["share"], 1)})
    closest.sort(key=lambda x: x["ptsGap"])
    pitcher_leaders = []
    for sn_ in seasons:
        for lg in ("AL", "NL"):
            d = sn_[lg]
            ld = d["warLeader"]
            if ld["role"] == "pitcher":
                pitcher_leaders.append({"year": sn_["year"], "lg": lg, "name": ld["name"], "war": ld["war"],
                                        "voteRank": ld["rank"], "winner": d["winner"]["name"], "winnerWar": d["winner"]["war"]})

    # ids de MLB (para fotos) de ganadores y casos
    for s in seasons:
        for lg in ("AL", "NL"):
            s[lg]["winner"]["mlbId"] = mlb_id(s[lg]["winner"]["name"])
    for sn in snubs:
        sn["mlbId"] = mlb_id(sn["name"])

    out = {
        "generatedFrom": "Baseball Reference (Bill Deane, Award Voting) + MLB Stats API",
        "seasons": seasons,
        "snubs": snubs,
        "nearMisses": near,
        "closest": closest[:8],
        "pitcherWarLeaders": pitcher_leaders,
        "summary": {
            "n": n, "playoffsPct": pct(playoffs_k), "warLeaderWon": war_leader_k, "withinHalfWar": within_k,
            "hitters": hit_k, "pitchers": pit_k, "twoWay": two_k, "unanimous": unani,
            "early": early, "late": late,
            "regression": {"coefs": coefs, "r2": round(r2, 3), "n": int(len(ya)), "halves": halves},
            "rankCorrelation": corr,
        },
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False)
    print("escrito", OUT, os.path.getsize(OUT) // 1024, "KB")
    print("resumen:", json.dumps(out["summary"], ensure_ascii=False)[:1500])
    print("snubs:", len(snubs), [(s["year"], s["lg"], s["name"], s["warGap"], s["voteRank"]) for s in snubs[:12]])


if __name__ == "__main__":
    main()
