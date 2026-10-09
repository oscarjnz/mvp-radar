"""Construye web/public/data/history_cy.json: los ultimos 10 Cy Young (2016-2025, AL y NL), su boleta completa,
contexto de equipo, valoracion frente a WAR, casos de 'debio ganar' y estadisticas agregadas.

Misma forma que history.json (MVP) para reutilizar los componentes de la web. Todo sale de los datos:
no hay textos escritos a mano, de modo que el proceso pueda correr solo cuando el portal sea dinamico.
Fuentes: Baseball Reference (votacion y WAR) y MLB Stats API (standings, ids).
"""
import json
import os

import numpy as np

from build_history import (RAW, ROOT, YEARS, mlb_id, playoff_teams, row_to_ballot, standings)
from ingest_bbref_awards import CYA_OUT

OUT = os.path.join(ROOT, "web", "public", "data", "history_cy.json")
VERSION = "cy-1"


def era_of(b):
    try:
        return float(b["pit"]["era"])
    except (TypeError, ValueError, KeyError):
        return None


def verdict(gap):
    if gap <= 0.3:
        return "acertado"
    if gap <= 1.5:
        return "discutible"
    return "cuestionable"


def rank_of(value, values, reverse=False):
    """Puesto (1 = mejor) de value dentro de values. reverse=True si menor es mejor."""
    vals = sorted([v for v in values if v is not None], reverse=not reverse)
    return vals.index(value) + 1 if value in vals else None


def main():
    raw = json.load(open(CYA_OUT, encoding="utf-8"))
    seasons, flat = [], []
    for year in YEARS:
        st = standings(year)
        po = playoff_teams(year)
        season = {"year": year}
        for lg in ("AL", "NL"):
            ballots = [row_to_ballot(r, lg, year, st, po) for r in raw[str(year)][lg]]
            winner = ballots[0]
            leader = max(ballots, key=lambda b: b["war"] if b["war"] is not None else -99)
            gap = round(leader["war"] - winner["war"], 1)
            eras = [era_of(b) for b in ballots]
            wins = [(b["pit"] or {}).get("w") for b in ballots]
            ks = [(b["pit"] or {}).get("so") for b in ballots]
            ips = [(b["pit"] or {}).get("ip") for b in ballots]
            season[lg] = {
                "winner": winner,
                "pos": "P",
                "warLeader": {"name": leader["name"], "war": leader["war"], "rank": leader["rank"], "role": leader["role"], "team": leader["team"]},
                "warLeaderWon": leader["name"] == winner["name"] or gap <= 0.0,
                "verdict": verdict(gap),
                "warGap": gap,
                "unanimous": winner["first"] is not None and winner["share"] == 100,
                "top10": ballots[:10],
                "voted": len(ballots),
                # el ganador frente al resto de los votados
                "winnerRanks": {
                    "era": rank_of(era_of(winner), eras, reverse=True),
                    "wins": rank_of((winner["pit"] or {}).get("w"), wins),
                    "so": rank_of((winner["pit"] or {}).get("so"), ks),
                    "ip": rank_of((winner["pit"] or {}).get("ip"), ips),
                    "war": rank_of(winner["war"], [b["war"] for b in ballots]),
                },
            }
            for b in ballots:
                if b["war"] is not None:
                    flat.append((year, lg, b, winner))
        seasons.append(season)

    winners = [(s["year"], lg, s[lg]) for s in seasons for lg in ("AL", "NL")]
    n = len(winners)

    def pit(w, k):
        return (w["pit"] or {}).get(k)

    def block(sel):
        ws = [(y, lg, d) for y, lg, d in winners if sel(y)]
        wb = [d["winner"] for _y, _lg, d in ws]
        return {
            "n": len(ws),
            "avgWar": round(float(np.mean([w["war"] for w in wb])), 1),
            "avgEra": round(float(np.mean([era_of(w) for w in wb])), 2),
            "avgWins": round(float(np.mean([pit(w, "w") for w in wb])), 1),
            "avgIp": round(float(np.mean([pit(w, "ip") for w in wb])), 1),
            "avgK": round(float(np.mean([pit(w, "so") for w in wb])), 0),
            "avgShare": round(float(np.mean([w["share"] for w in wb]))),
            "playoffsPct": round(100 * float(np.mean([1 if w["playoffs"] else 0 for w in wb]))),
            "unanimous": sum(1 for _y, _lg, d in ws if d["unanimous"]),
            "avgWarGap": round(float(np.mean([d["warGap"] for _y, _lg, d in ws])), 2),
            "warLeaderWon": sum(1 for _y, _lg, d in ws if d["warGap"] <= 0.0),
            "eraLeaderWon": sum(1 for _y, _lg, d in ws if d["winnerRanks"]["era"] == 1),
            "winsLeaderWon": sum(1 for _y, _lg, d in ws if d["winnerRanks"]["wins"] == 1),
            "minWins": int(min(pit(w, "w") for w in wb)),
        }

    early, short, late = block(lambda y: y <= 2019), block(lambda y: y == 2020), block(lambda y: y >= 2021)

    def games(b):
        g = (b["w"] or 0) + (b["l"] or 0)
        return g if g else 162

    # Regresion: share ~ WAR_z + efectividad_z (mejor es positivo) + victorias/5 (2020 ajustado a 162 juegos) + playoffs
    def design(rows):
        X, y_ = [], []
        for year, lg, b, _w in rows:
            if b["share"] is None or b["playoffs"] is None or b["w"] is None or era_of(b) is None:
                continue
            pool = [bb for yy, ll, bb, _ in flat if yy == year and ll == lg and bb["war"] is not None and era_of(bb) is not None]
            wm, ws = float(np.mean([bb["war"] for bb in pool])), float(np.std([bb["war"] for bb in pool])) or 1.0
            em, es = float(np.mean([era_of(bb) for bb in pool])), float(np.std([era_of(bb) for bb in pool])) or 1.0
            wins = (pit(b, "w") or 0) * 162.0 / games(b)
            X.append([1.0, (b["war"] - wm) / ws, (em - era_of(b)) / es, wins / 5.0, 1.0 if b["playoffs"] else 0.0])
            y_.append(b["share"] / 100.0)
        return np.array(X), np.array(y_)

    Xa, ya = design(flat)
    beta, *_ = np.linalg.lstsq(Xa, ya, rcond=None)
    pred = Xa @ beta
    r2 = 1 - float(np.sum((ya - pred) ** 2)) / float(np.sum((ya - ya.mean()) ** 2))
    names = ["Constante", "WAR (por desviación estándar dentro de cada liga y año)", "Efectividad (por desviación estándar a favor)",
             "Victorias (por cada 5)", "Equipo en playoffs"]
    coefs = [{"label": nm, "value": round(float(c), 3)} for nm, c in zip(names, beta)]
    halves = {}
    for tag, rng in (("2016-2019", range(2016, 2020)), ("2021-2025", range(2021, 2026))):
        Xs, ys = design([t for t in flat if t[0] in rng])
        bt, *_ = np.linalg.lstsq(Xs, ys, rcond=None)
        halves[tag] = [round(float(c), 3) for c in bt]

    def spearman(year, lg):
        rows = [b for yy, ll, b, _ in flat if yy == year and ll == lg and b["war"] is not None]
        war_rank = np.argsort(np.argsort([-r["war"] for r in rows]))
        vote_rank = np.array([r["rank"] for r in rows]) - 1
        return float(np.corrcoef(war_rank, vote_rank)[0, 1])
    corr = {str(yr): round((spearman(yr, "AL") + spearman(yr, "NL")) / 2, 2) for yr in YEARS}

    # Casos "debio ganar" y "casi"
    snubs, near = [], []
    for year, lg, b, winner in flat:
        if b["name"] == winner["name"]:
            continue
        gap = round(b["war"] - winner["war"], 1)
        row = {"year": year, "lg": lg, "name": b["name"], "team": b["team"], "role": b["role"], "voteRank": b["rank"], "share": b["share"],
               "war": b["war"], "winner": winner["name"], "winnerWar": winner["war"], "warGap": gap, "w": b["w"], "l": b["l"],
               "playoffs": b["playoffs"], "bat": b["bat"], "pit": b["pit"], "winnerPit": winner["pit"]}
        if gap >= 0.5:
            snubs.append(row)
        elif 0.2 <= gap < 0.5:
            near.append({k: row[k] for k in ("year", "lg", "name", "team", "role", "voteRank", "share", "war", "winner", "winnerWar", "warGap")})
    snubs.sort(key=lambda x: -x["warGap"])
    near.sort(key=lambda x: -x["warGap"])

    closest = []
    for sn_ in seasons:
        for lg in ("AL", "NL"):
            d = sn_[lg]
            b2 = d["top10"][1]
            closest.append({"year": sn_["year"], "lg": lg, "winner": d["winner"]["name"], "second": b2["name"],
                            "ptsGap": round(d["winner"]["pts"] - b2["pts"], 1), "firstWinner": d["winner"]["first"], "firstSecond": b2["first"],
                            "warWinner": d["winner"]["war"], "warSecond": b2["war"], "shareGap": round(d["winner"]["share"] - b2["share"], 1)})
    closest.sort(key=lambda x: x["ptsGap"])

    for s in seasons:
        for lg in ("AL", "NL"):
            s[lg]["winner"]["mlbId"] = mlb_id(s[lg]["winner"]["name"])
    for sn in snubs:
        sn["mlbId"] = mlb_id(sn["name"])

    out = {
        "version": VERSION,
        "award": "CYA",
        "generatedFrom": "Baseball Reference (Bill Deane, Award Voting) + MLB Stats API",
        "seasons": seasons, "snubs": snubs, "nearMisses": near, "closest": closest[:8],
        "summary": {
            "n": n,
            "playoffsPct": round(100 * sum(1 for _y, _lg, d in winners if d["winner"]["playoffs"]) / n),
            "warLeaderWon": sum(1 for _y, _lg, d in winners if d["warGap"] <= 0.0),
            "withinHalfWar": sum(1 for _y, _lg, d in winners if d["warGap"] <= 0.5),
            "eraLeaderWon": sum(1 for _y, _lg, d in winners if d["winnerRanks"]["era"] == 1),
            "winsLeaderWon": sum(1 for _y, _lg, d in winners if d["winnerRanks"]["wins"] == 1),
            "unanimous": sum(1 for _y, _lg, d in winners if d["unanimous"]),
            "early": early, "short": short, "late": late,
            "regression": {"coefs": coefs, "r2": round(r2, 3), "n": int(len(ya)), "halves": halves},
            "rankCorrelation": corr,
        },
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False)
    print("escrito", OUT, os.path.getsize(OUT) // 1024, "KB")
    print(json.dumps(out["summary"], ensure_ascii=False)[:2200])
    print("snubs", len(snubs), [(s["year"], s["lg"], s["name"], s["warGap"], s["voteRank"]) for s in snubs[:14]])


if __name__ == "__main__":
    main()
