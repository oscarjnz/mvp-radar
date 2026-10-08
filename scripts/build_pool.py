"""Cruza todas las fuentes de 2026 y deja data/pool_2026.json con el pool de candidatos MVP
(bateadores y pitchers de ambas ligas) con fWAR, bWAR, wRC+, WPA, RE24, Savant y contexto de equipo.
"""
import json
import os

from common import (ROOT, RAW, csv_rows, fnum, jload, load_standings, load_teams, norm,
                    parse_bbref_value_batting_md)
import ingest_bbref_2026 as bb

OUT = os.path.join(ROOT, "data", "pool_2026.json")


def by_id(splits):
    return {s["player"]["id"]: s for s in splits}


def main():
    teams = load_teams()
    stand = load_standings(teams)

    h_season = by_id(jload("mlb_hitting_season.json")["stats"][0]["splits"])
    h_sab = by_id(jload("mlb_hitting_sabermetrics.json")["stats"][0]["splits"])
    p_season = by_id(jload("mlb_pitching_season.json")["stats"][0]["splits"])
    p_sab = by_id(jload("mlb_pitching_sabermetrics.json")["stats"][0]["splits"])

    # Baseball Reference
    bwar_h = {}
    for r in parse_bbref_value_batting_md():
        bwar_h[(norm(r["name"]), r["lg"])] = r
    html = open(os.path.join(RAW, "bbref_2026_value_pitching.html"), encoding="utf-8").read()
    bwar_p = {}
    for r in bb.grab(html, "players_value_pitching"):
        if r.get("name_display") in (None, "Player"):
            continue
        bwar_p[(norm(r["name_display"]), r.get("comp_name_abbr"))] = r
    html = open(os.path.join(RAW, "bbref_2026_advanced_batting.html"), encoding="utf-8").read()
    adv = {}
    for r in bb.grab(html, "players_advanced_batting"):
        if r.get("name_display") in (None, "Player"):
            continue
        adv[(norm(r["name_display"]), r.get("comp_name_abbr"))] = r

    # Savant
    pct_b = {int(r["player_id"]): r for r in csv_rows("savant_pct_batter.csv")}
    pct_p = {int(r["player_id"]): r for r in csv_rows("savant_pct_pitcher.csv")}
    cus_b = {int(r["player_id"]): r for r in csv_rows("savant_custom_batter.csv")}
    cus_p = {int(r["player_id"]): r for r in csv_rows("savant_custom_pitcher.csv")}

    pool = {"AL": {"hitters": [], "pitchers": []}, "NL": {"hitters": [], "pitchers": []}}

    for pid, s in h_sab.items():
        tid = s["team"]["id"]
        if tid not in teams:
            continue
        lg = teams[tid]["lg"]
        sab = s["stat"]
        season = h_season.get(pid, {}).get("stat", {})
        pa = fnum(season.get("plateAppearances"), 0)
        if pa < 200:
            continue
        name = s["player"]["fullName"]
        bw = bwar_h.get((norm(name), lg)) or {}
        ad = adv.get((norm(name), lg)) or {}
        pool[lg]["hitters"].append({
            "id": pid, "name": name, "team": teams[tid]["abbr"], "teamId": tid, "lg": lg,
            "pos": s.get("position", {}).get("abbreviation"),
            "g": season.get("gamesPlayed"), "pa": pa, "avg": season.get("avg"), "obp": season.get("obp"),
            "slg": season.get("slg"), "ops": season.get("ops"), "hr": season.get("homeRuns"),
            "rbi": season.get("rbi"), "r": season.get("runs"), "h": season.get("hits"),
            "sb": season.get("stolenBases"), "bb": season.get("baseOnBalls"), "so": season.get("strikeOuts"),
            "fwar": round(sab.get("war", 0), 1), "wrcPlus": round(sab.get("wRcPlus", 0)),
            "woba": round(sab.get("woba", 0), 3), "bat": round(sab.get("batting", 0), 1),
            "fld": round(sab.get("fielding", 0), 1), "bsr": round(sab.get("baseRunning", 0), 1),
            "posAdj": round(sab.get("positional", 0), 1),
            "bwar": bw.get("war"), "owar": bw.get("owar"), "dwar": bw.get("dwar"),
            "wpa": fnum(ad.get("b_wpa_bat")), "re24": fnum(ad.get("b_baseout_runs")),
            "team_rec": stand.get(tid),
            "sv_pct": pct_b.get(pid), "sv": cus_b.get(pid),
        })

    for pid, s in p_sab.items():
        tid = s["team"]["id"]
        if tid not in teams:
            continue
        lg = teams[tid]["lg"]
        sab = s["stat"]
        season = p_season.get(pid, {}).get("stat", {})
        ip = fnum(season.get("inningsPitched"), 0)
        if ip < 60:
            continue
        name = s["player"]["fullName"]
        bw = bwar_p.get((norm(name), lg)) or {}
        pool[lg]["pitchers"].append({
            "id": pid, "name": name, "team": teams[tid]["abbr"], "teamId": tid, "lg": lg,
            "g": season.get("gamesPlayed"), "gs": season.get("gamesStarted"), "ip": ip,
            "era": season.get("era"), "whip": season.get("whip"), "w": season.get("wins"), "l": season.get("losses"),
            "so": season.get("strikeOuts"), "bb": season.get("baseOnBalls"), "hr": season.get("homeRuns"),
            "fip": round(sab.get("fip", 0), 2), "fwar": round(sab.get("war", 0), 1),
            "bwar": fnum(bw.get("p_war")), "ra9": fnum(bw.get("p_ra9")),
            "team_rec": stand.get(tid),
            "sv_pct": pct_p.get(pid), "sv": cus_p.get(pid),
        })

    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(pool, fh, ensure_ascii=False)
    print("escrito", OUT)
    # Resumen de los lideres para decidir el top 5
    def show(lg, kind, key, n):
        rows = sorted(pool[lg][kind], key=lambda r: -(r[key] if r[key] is not None else -99))[:n]
        for r in rows:
            tr = r["team_rec"] or {}
            if kind == "hitters":
                print(f"  {r['name'][:22]:22} {r['team']:3} fWAR{r['fwar']:5} bWAR{str(r['bwar']):>5} wRC+{r['wrcPlus']:4} OPS{r['ops']} HR{r['hr']:3} SB{r['sb']:3} Bat{r['bat']:6} Fld{r['fld']:6} BsR{r['bsr']:5} WPA{r['wpa']} RE24{r['re24']} {tr.get('w')}-{tr.get('l')}{'*' if tr.get('playoffs') else ''}")
            else:
                print(f"  {r['name'][:22]:22} {r['team']:3} fWAR{r['fwar']:5} bWAR{str(r['bwar']):>5} ERA{r['era']} FIP{r['fip']} IP{r['ip']} K{r['so']} {tr.get('w')}-{tr.get('l')}{'*' if tr.get('playoffs') else ''}")
    for lg in ("AL", "NL"):
        print(lg, "hitters by fWAR"); show(lg, "hitters", "fwar", 9)
        print(lg, "hitters by bWAR"); show(lg, "hitters", "bwar", 6)
        print(lg, "pitchers by fWAR"); show(lg, "pitchers", "fwar", 5)


if __name__ == "__main__":
    main()
