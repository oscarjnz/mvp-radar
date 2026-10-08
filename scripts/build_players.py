"""Construye web/public/data/candidates.json y web/public/data/players/<id>.json para el MVP 2026.

Entradas (en data/raw): pool_2026.json, profile_<id>.json, statcast_<id>_<bat|pit>.csv, savant_*.csv.
"""
import csv
import json
import math
import os
from collections import defaultdict

import numpy as np

from candidates import BUBBLE, TOP5, all_candidates
from common import RAW, ROOT, fnum, load_standings, load_teams
from narratives import narrative_for

WEB = os.path.join(ROOT, "web", "public", "data")
HOME_X, HOME_Y = 125.42, 199.02  # origen de home plate en coordenadas hc_x/hc_y de Statcast

SWING = {"swinging_strike", "swinging_strike_blocked", "foul", "foul_tip", "hit_into_play", "foul_bunt", "missed_bunt", "bunt_foul_tent"}
WHIFF = {"swinging_strike", "swinging_strike_blocked", "foul_tip", "missed_bunt"}
CALLED = {"called_strike"}
GROUPS = {"FF": "FB", "SI": "FB", "FC": "FB", "FA": "FB", "SL": "BR", "ST": "BR", "CU": "BR", "KC": "BR", "SV": "BR", "CS": "BR",
          "CH": "OS", "FS": "OS", "FO": "OS", "SC": "OS"}
RESULT = {"single": 1, "double": 2, "triple": 3, "home_run": 4}


def read_csv(path):
    with open(path, encoding="utf-8-sig") as fh:
        return list(csv.DictReader(fh))


def r(x, n=1):
    return None if x is None else round(x, n)


def wsum(rows):
    """wOBA y xwOBA por filas con woba_denom=1."""
    num = den = xnum = 0.0
    for z in rows:
        d = fnum(z.get("woba_denom"), 0)
        if not d:
            continue
        den += d
        w = fnum(z.get("woba_value"), 0) or 0.0
        num += w
        est = fnum(z.get("estimated_woba_using_speedangle"))
        xnum += est if est is not None else w
    if den == 0:
        return None, None, 0
    return num / den, xnum / den, int(den)


def hitter_detail(rows, profile):
    bbe = [z for z in rows if z["type"] == "X" and fnum(z.get("launch_speed")) is not None]
    evs = [fnum(z["launch_speed"]) for z in bbe]
    las = [fnum(z["launch_angle"]) for z in bbe if fnum(z.get("launch_angle")) is not None]
    out = {"kind": "hitter"}
    out["bbe"] = [
        [r(fnum(z["hc_x"]) - HOME_X) if fnum(z.get("hc_x")) is not None else None,
         r(HOME_Y - fnum(z["hc_y"])) if fnum(z.get("hc_y")) is not None else None,
         r(fnum(z["launch_speed"])), r(fnum(z["launch_angle"])), RESULT.get(z["events"], 0),
         r(fnum(z.get("estimated_woba_using_speedangle"), 0), 3), z["stand"]]
        for z in bbe
    ]
    bins = defaultdict(int)
    for e in evs:
        bins[int(e // 5) * 5] += 1
    out["evHist"] = [[b, bins[b]] for b in range(40, 125, 5)]
    out["ev"] = {
        "avg": r(float(np.mean(evs))), "max": r(max(evs)), "p90": r(float(np.percentile(evs, 90))),
        "hardHit": r(100 * sum(1 for e in evs if e >= 95) / len(evs)),
        "barrel": r(100 * sum(1 for z in bbe if z.get("launch_speed_angle") == "6") / len(bbe)),
        "sweetSpot": r(100 * sum(1 for a in las if 8 <= a <= 32) / max(1, len(las))), "avgLa": r(float(np.mean(las))), "n": len(bbe),
    }
    # zonas (1-9 dentro, 11-14 fuera)
    zones = {}
    for zn in list(range(1, 10)) + [11, 12, 13, 14]:
        zr = [z for z in rows if z.get("zone") == str(zn)]
        if not zr:
            continue
        sw = [z for z in zr if z["description"] in SWING]
        wh = [z for z in zr if z["description"] in WHIFF]
        w, xw, _n = wsum(zr)
        zones[str(zn)] = {"n": len(zr), "swing": r(100 * len(sw) / len(zr)), "whiff": r(100 * len(wh) / len(sw)) if sw else None,
                          "woba": r(w, 3), "xwoba": r(xw, 3)}
    out["zones"] = zones
    # disciplina
    inz = [z for z in rows if z.get("zone") and 1 <= int(z["zone"]) <= 9]
    ooz = [z for z in rows if z.get("zone") and int(z["zone"]) >= 11]
    sw_all = [z for z in rows if z["description"] in SWING]
    out["discipline"] = {
        "swing": r(100 * len(sw_all) / len(rows)),
        "chase": r(100 * sum(1 for z in ooz if z["description"] in SWING) / max(1, len(ooz))),
        "whiff": r(100 * sum(1 for z in sw_all if z["description"] in WHIFF) / max(1, len(sw_all))),
        "zoneContact": r(100 * sum(1 for z in inz if z["description"] in SWING and z["description"] not in WHIFF)
                         / max(1, sum(1 for z in inz if z["description"] in SWING))),
        "pitches": len(rows),
    }
    # por tipo de lanzamiento
    pg = {}
    for g in ("FB", "BR", "OS"):
        gr = [z for z in rows if GROUPS.get(z["pitch_type"]) == g]
        if not gr:
            continue
        sw = [z for z in gr if z["description"] in SWING]
        w, xw, n = wsum(gr)
        be = [fnum(z["launch_speed"]) for z in gr if z["type"] == "X" and fnum(z.get("launch_speed")) is not None]
        pg[g] = {"n": len(gr), "whiff": r(100 * sum(1 for z in sw if z["description"] in WHIFF) / max(1, len(sw))),
                 "woba": r(w, 3), "xwoba": r(xw, 3), "pa": n, "ev": r(float(np.mean(be))) if be else None}
    out["byPitch"] = pg
    # por mano del pitcher
    ph = {}
    for hand in ("L", "R"):
        hr_ = [z for z in rows if z["p_throws"] == hand]
        w, xw, n = wsum(hr_)
        ph[hand] = {"woba": r(w, 3), "xwoba": r(xw, 3), "pa": n}
    out["byHand"] = ph
    # bat tracking
    bs = [fnum(z["bat_speed"]) for z in rows if fnum(z.get("bat_speed")) is not None]
    sl = [fnum(z["swing_length"]) for z in rows if fnum(z.get("swing_length")) is not None]
    aa = [fnum(z["attack_angle"]) for z in rows if fnum(z.get("attack_angle")) is not None]
    out["batTracking"] = {
        "batSpeed": r(float(np.mean(bs))) if bs else None, "fastSwing": r(100 * sum(1 for b in bs if b >= 75) / len(bs)) if bs else None,
        "swingLength": r(float(np.mean(sl))) if sl else None, "attackAngle": r(float(np.mean(aa))) if aa else None, "n": len(bs),
    }
    # mensual y rolling desde la API
    out["monthly"] = [
        {"m": s["month"], "g": s["stat"].get("gamesPlayed"), "pa": s["stat"].get("plateAppearances"), "avg": s["stat"].get("avg"),
         "obp": s["stat"].get("obp"), "slg": s["stat"].get("slg"), "ops": s["stat"].get("ops"), "hr": s["stat"].get("homeRuns"),
         "sb": s["stat"].get("stolenBases")}
        for s in sorted(profile.get("byMonth_hitting", []), key=lambda z: int(z["month"]))
    ]
    out["rolling"] = rolling_ops(profile.get("gameLog_hitting", []))
    return out


def rolling_ops(logs, window=15):
    games = sorted(logs, key=lambda s: s["date"])
    series, cum_hr, cum_sb = [], 0, 0
    buf = []
    for i, g in enumerate(games, 1):
        st = g["stat"]
        buf.append(st)
        cum_hr += int(st.get("homeRuns", 0))
        cum_sb += int(st.get("stolenBases", 0))
        w = buf[-window:]
        ab = sum(int(x.get("atBats", 0)) for x in w)
        h = sum(int(x.get("hits", 0)) for x in w)
        bb = sum(int(x.get("baseOnBalls", 0)) for x in w)
        hbp = sum(int(x.get("hitByPitch", 0)) for x in w)
        sf = sum(int(x.get("sacFlies", 0)) for x in w)
        tb = sum(int(x.get("totalBases", 0)) for x in w)
        denom = ab + bb + hbp + sf
        obp = (h + bb + hbp) / denom if denom else 0
        slg = tb / ab if ab else 0
        series.append({"g": i, "date": g["date"], "ops": round(obp + slg, 3), "hr": cum_hr, "sb": cum_sb})
    return series


def outcome_of(z):
    """Codigo corto del resultado del lanzamiento: 0 bola, 1 strike cantado, 2 swing y fallo, 3 foul, 4 en juego, 5 pelotazo."""
    d = z.get("description") or ""
    if d in ("ball", "blocked_ball", "automatic_ball", "pitchout"):
        return 0
    if d in ("called_strike", "automatic_strike"):
        return 1
    if d in WHIFF:
        return 2
    if d in ("foul", "foul_bunt", "bunt_foul_tent"):
        return 3
    if d == "hit_into_play":
        return 4
    if d == "hit_by_pitch":
        return 5
    return 0


def pitcher_detail(rows, profile):
    out = {"kind": "pitcher"}
    total = len(rows)
    arsenal = []
    for pn in sorted({z["pitch_name"] for z in rows if z["pitch_name"]}, key=lambda n: -sum(1 for z in rows if z["pitch_name"] == n)):
        pr = [z for z in rows if z["pitch_name"] == pn]
        if len(pr) < total * 0.03:
            continue
        sw = [z for z in pr if z["description"] in SWING]
        two = [z for z in pr if z["strikes"] == "2"]
        k = [z for z in two if z["events"] in ("strikeout", "strikeout_double_play")]
        w, xw, _n = wsum(pr)
        velos = [fnum(z["release_speed"]) for z in pr if fnum(z.get("release_speed")) is not None]
        spin = [fnum(z["release_spin_rate"]) for z in pr if fnum(z.get("release_spin_rate")) is not None]
        px = [fnum(z["pfx_x"]) * 12 for z in pr if fnum(z.get("pfx_x")) is not None]
        pz = [fnum(z["pfx_z"]) * 12 for z in pr if fnum(z.get("pfx_z")) is not None]
        be = [fnum(z["launch_speed"]) for z in pr if z["type"] == "X" and fnum(z.get("launch_speed")) is not None]
        arsenal.append({
            "code": pr[0]["pitch_type"], "name": pn, "n": len(pr), "usage": r(100 * len(pr) / total),
            "velo": r(float(np.mean(velos))), "maxVelo": r(max(velos)), "spin": r(float(np.mean(spin)), 0) if spin else None,
            "hmov": r(float(np.mean(px))) if px else None, "vmov": r(float(np.mean(pz))) if pz else None,
            "whiff": r(100 * sum(1 for z in sw if z["description"] in WHIFF) / max(1, len(sw))),
            "csw": r(100 * sum(1 for z in pr if z["description"] in WHIFF | CALLED) / len(pr)),
            "putaway": r(100 * len(k) / max(1, len(two))),
            "woba": r(w, 3), "xwoba": r(xw, 3), "ev": r(float(np.mean(be))) if be else None,
            "zone": r(100 * sum(1 for z in pr if z.get("zone") and 1 <= int(z["zone"]) <= 9) / len(pr)),
        })
    out["arsenal"] = arsenal
    # nube de movimiento
    mov = []
    rng = np.random.default_rng(7)
    for a in arsenal:
        pr = [z for z in rows if z["pitch_name"] == a["name"] and fnum(z.get("pfx_x")) is not None and fnum(z.get("pfx_z")) is not None]
        idx = rng.choice(len(pr), size=min(70, len(pr)), replace=False)
        mov.extend([[a["code"], r(fnum(pr[i]["pfx_x"]) * 12), r(fnum(pr[i]["pfx_z"]) * 12)] for i in idx])
    out["movement"] = mov
    # ubicacion por tipo (primeros 5): [codigo, lateral, altura, velocidad, resultado, lado del bateador]
    loc = []
    for a in arsenal[:5]:
        pr = [z for z in rows if z["pitch_name"] == a["name"] and fnum(z.get("plate_x")) is not None and fnum(z.get("plate_z")) is not None]
        idx = rng.choice(len(pr), size=min(100, len(pr)), replace=False)
        loc.extend([[a["code"], r(fnum(pr[i]["plate_x"]), 2), r(fnum(pr[i]["plate_z"]), 2), r(fnum(pr[i].get("release_speed")), 1),
                     outcome_of(pr[i]), pr[i].get("stand") or ""] for i in idx])
    out["location"] = loc
    # estadisticas por zona y tipo de lanzamiento con TODOS los lanzamientos (no solo la muestra)
    zmap = {}
    for a in arsenal:
        for zn in list(range(1, 10)) + [11, 12, 13, 14]:
            zr = [z for z in rows if z["pitch_name"] == a["name"] and z.get("zone") == str(zn)]
            if not zr:
                continue
            sw = [z for z in zr if z["description"] in SWING]
            wh = [z for z in zr if z["description"] in WHIFF]
            ve = [fnum(z["release_speed"]) for z in zr if fnum(z.get("release_speed")) is not None]
            w, _xw, pa = wsum(zr)
            zmap.setdefault(str(zn), {})[a["code"]] = {
                "n": len(zr), "v": r(float(np.mean(ve))) if ve else None, "sw": len(sw), "wh": len(wh),
                "cs": sum(1 for z in zr if z["description"] in CALLED), "pa": pa, "woba": r(w, 3)}
    out["zoneMap"] = zmap
    # zona de strike promedio de los bateadores enfrentados (como la dibuja Savant)
    tops = [fnum(z.get("sz_top")) for z in rows if fnum(z.get("sz_top")) is not None]
    bots = [fnum(z.get("sz_bot")) for z in rows if fnum(z.get("sz_bot")) is not None]
    out["szTop"] = r(float(np.mean(tops)), 2) if tops else 3.5
    out["szBot"] = r(float(np.mean(bots)), 2) if bots else 1.5
    # tendencia de velocidad de la recta
    main = arsenal[0]["code"] if arsenal else None
    fb = [z for z in rows if z["pitch_type"] in ("FF", "SI") and fnum(z.get("release_speed")) is not None]
    by_date = defaultdict(list)
    for z in fb:
        by_date[z["game_date"]].append(fnum(z["release_speed"]))
    out["veloTrend"] = [{"date": d, "velo": r(float(np.mean(v)), 1), "n": len(v)} for d, v in sorted(by_date.items()) if len(v) >= 8]
    rel = [(fnum(z["release_pos_x"]), fnum(z["release_pos_z"]), fnum(z.get("release_extension")), fnum(z.get("arm_angle"))) for z in rows if fnum(z.get("release_pos_x")) is not None]
    out["release"] = {"x": r(float(np.mean([a for a, *_ in rel])), 2), "z": r(float(np.mean([b for _, b, *_ in rel])), 2),
                      "ext": r(float(np.mean([c for _, _, c, _d in rel if c is not None])), 1),
                      "arm": r(float(np.mean([d for *_x, d in rel if d is not None])), 1) if any(d is not None for *_x, d in rel) else None}
    # progreso del ERA acumulado
    games = sorted(profile.get("gameLog_pitching", []), key=lambda s: s["date"])
    cum_er = cum_ip = cum_k = 0.0
    series = []
    for g in games:
        st = g["stat"]
        ip = fnum(st.get("inningsPitched"), 0)
        ip_out = int(ip) * 3 + round((ip - int(ip)) * 10)
        cum_ip += ip_out
        cum_er += int(st.get("earnedRuns", 0))
        cum_k += int(st.get("strikeOuts", 0))
        if cum_ip >= 9:
            series.append({"g": len(series) + 1, "date": g["date"], "era": round(27 * cum_er / cum_ip, 2), "k": int(cum_k),
                           "ip": round(cum_ip / 3, 1), "gs": int(st.get("gamesStarted", 0))})
    out["eraTrend"] = series
    out["monthly"] = [
        {"m": s["month"], "g": s["stat"].get("gamesPlayed"), "ip": s["stat"].get("inningsPitched"), "era": s["stat"].get("era"),
         "whip": s["stat"].get("whip"), "so": s["stat"].get("strikeOuts"), "bb": s["stat"].get("baseOnBalls"), "avg": s["stat"].get("avg")}
        for s in sorted(profile.get("byMonth_pitching", []), key=lambda z: int(z["month"]))
    ]
    return out


MAJOR = ("AL MVP", "NL MVP", "AL Cy Young", "NL Cy Young", "AL All-Star", "NL All-Star", "AL Silver Slugger", "NL Silver Slugger",
         "Rawlings AL Gold Glove", "Rawlings NL Gold Glove", "Jackie Robinson AL Rookie of the Year", "Jackie Robinson NL Rookie of the Year",
         "Hank Aaron Award", "World Series Champion")


def major_awards(awards):
    names = {a.get("name") for a in awards if a.get("name") in MAJOR}
    return sorted(names)


def bio_block(profile, teams):
    b = profile["bio"]
    ct = b.get("currentTeam", {})
    return {
        "number": b.get("primaryNumber"), "birth": b.get("birthDate"), "age": b.get("currentAge"),
        "city": b.get("birthCity"), "country": b.get("birthCountry"), "height": b.get("height"), "weight": b.get("weight"),
        "pos": b.get("primaryPosition", {}).get("abbreviation"), "bats": b.get("batSide", {}).get("code"),
        "throws": b.get("pitchHand", {}).get("code"), "debut": b.get("mlbDebutDate"), "draft": b.get("draftYear"),
        "teamName": ct.get("name"), "awards": major_awards(profile.get("awards", [])),
    }


SAV_PCT_KEEP_B = ["xwoba", "xba", "xslg", "xobp", "brl_percent", "exit_velocity", "max_ev", "hard_hit_percent", "k_percent",
                  "bb_percent", "whiff_percent", "chase_percent", "sprint_speed", "oaa", "arm_strength", "bat_speed", "squared_up_rate"]


def savant_block(pid, pct_rows, cus_rows):
    p = pct_rows.get(pid) or {}
    c = cus_rows.get(pid) or {}
    pct = {k: fnum(v) for k, v in p.items() if k not in ("player_name", "player_id", "year") and fnum(v) is not None}
    raw = {k: fnum(v) for k, v in c.items() if k not in ("last_name, first_name", "player_id", "year", "player_name") and fnum(v) is not None}
    return {"pct": pct, "raw": raw}


def main():
    pool = json.load(open(os.path.join(ROOT, "data", "pool_2026.json"), encoding="utf-8"))
    teams = load_teams()
    pct_b = {int(z["player_id"]): z for z in read_csv(os.path.join(RAW, "savant_pct_batter.csv"))}
    pct_p = {int(z["player_id"]): z for z in read_csv(os.path.join(RAW, "savant_pct_pitcher.csv"))}
    cus_b = {int(z["player_id"]): z for z in read_csv(os.path.join(RAW, "savant_custom_batter.csv"))}
    cus_p = {int(z["player_id"]): z for z in read_csv(os.path.join(RAW, "savant_custom_pitcher.csv"))}

    index = {}
    for lg in ("AL", "NL"):
        for kind in ("hitters", "pitchers"):
            for row in pool[lg][kind]:
                index[(row["name"], "hitter" if kind == "hitters" else "pitcher")] = row

    os.makedirs(os.path.join(WEB, "players"), exist_ok=True)
    result = {"AL": {"top5": [], "bubble": []}, "NL": {"top5": [], "bubble": []}}
    for lg, rank, name, role, is_top in all_candidates():
        roles = ["hitter", "pitcher"] if role == "twoway" else [role]
        base = index[(name, roles[0])]
        pid = base["id"]
        tinfo = teams[base["teamId"]]
        profile = json.load(open(os.path.join(RAW, f"profile_{pid}.json"), encoding="utf-8"))
        summary = {
            "id": pid, "slug": name.lower().replace(" ", "-").replace(".", "").replace("é", "e").replace("á", "a").replace("í", "i"),
            "name": name, "lg": lg, "rank": rank, "role": role, "top5": is_top,
            "team": tinfo["abbr"], "teamId": tinfo["id"], "teamName": tinfo["full"], "teamRec": base["team_rec"],
            "bio": bio_block(profile, teams),
        }
        sums = {}
        for ro in roles:
            row = index[(name, ro)]
            tag = "hit" if ro == "hitter" else "pit"
            keep = {k: v for k, v in row.items() if k not in ("sv_pct", "sv", "team_rec")}
            sv = savant_block(pid, pct_b if ro == "hitter" else pct_p, cus_b if ro == "hitter" else cus_p)
            keep["savant"] = sv
            sums[tag] = keep
        summary.update(sums)
        fw = sum(s["fwar"] for s in sums.values())
        bw = sum((s["bwar"] or 0) for s in sums.values())
        summary["war"] = {"f": round(fw, 1), "b": round(bw, 1), "avg": round((fw + bw) / 2, 1)}
        summary["links"] = {
            "mlb": f"https://www.mlb.com/player/{pid}",
            "savant": f"https://baseballsavant.mlb.com/savant-player/{pid}",
            "bbref": f"https://www.baseball-reference.com/search/search.fcgi?search={name.replace(' ', '+')}",
            "fangraphs": f"https://www.fangraphs.com/search?q={name.replace(' ', '+')}",
        }
        summary["narrative"] = narrative_for(summary)
        result[lg]["top5" if is_top else "bubble"].append(summary)

        if True:
            detail = {"id": pid}
            if "hitter" in roles:
                detail["hitting"] = hitter_detail(read_csv(os.path.join(RAW, f"statcast_{pid}_bat.csv")), profile)
            if "pitcher" in roles:
                detail["pitching"] = pitcher_detail(read_csv(os.path.join(RAW, f"statcast_{pid}_pit.csv")), profile)
            with open(os.path.join(WEB, "players", f"{pid}.json"), "w", encoding="utf-8") as fh:
                json.dump(detail, fh, ensure_ascii=False, separators=(",", ":"))

    # metadatos de ligas y standings
    stand = load_standings(teams)
    payload = {
        "season": 2026, "asOf": "2026-09-27", "status": "La temporada regular terminó el 27 de septiembre. La postemporada sigue en curso y los premios de la BBWAA se anunciarán en noviembre.",
        "leagues": result,
        "teams": {str(t["id"]): {"abbr": t["abbr"], "name": t["full"], "lg": t["lg"], **stand.get(t["id"], {})} for t in teams.values()},
    }
    with open(os.path.join(WEB, "candidates.json"), "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, separators=(",", ":"))
    print("ok candidates.json", os.path.getsize(os.path.join(WEB, "candidates.json")) // 1024, "KB")
    for f in sorted(os.listdir(os.path.join(WEB, "players"))):
        print(" ", f, os.path.getsize(os.path.join(WEB, "players", f)) // 1024, "KB")


if __name__ == "__main__":
    main()
