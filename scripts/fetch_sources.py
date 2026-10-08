"""Descarga y cachea en data/raw las fuentes abiertas de 2026:
 - MLB Stats API: stats de temporada y sabermetria (hitting/pitching), equipos y standings.
 - Baseball Savant: percentile rankings (bateo y pitcheo) y leaderboard custom con xStats y velocidad.
Uso: python scripts/fetch_sources.py [--force]
"""
import json
import os
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "data", "raw")
SEASON = 2026
UA = {"User-Agent": "Mozilla/5.0 (baseball-lab personal research)"}
FORCE = "--force" in sys.argv


def http(url, retries=3, timeout=90):
    last = None
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=UA)
            return urllib.request.urlopen(req, timeout=timeout).read().decode("utf-8-sig", "replace")
        except Exception as exc:  # noqa: BLE001
            last = exc
            time.sleep(2 * (i + 1))
    raise RuntimeError(f"fallo {url}: {last}")


def cached(name, url):
    path = os.path.join(RAW, name)
    if os.path.exists(path) and not FORCE:
        return path
    os.makedirs(RAW, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(http(url))
    print("descargado", name)
    return path


MLB = "https://statsapi.mlb.com/api/v1"
SAV = "https://baseballsavant.mlb.com"


def mlb_stats(group, stats):
    return (
        f"{MLB}/stats?stats={stats}&group={group}&season={SEASON}&sportIds=1"
        f"&playerPool=all&limit=2000&gameType=R"
    )


def main():
    cached("mlb_teams.json", f"{MLB}/teams?sportId=1&season={SEASON}")
    cached("mlb_standings.json", f"{MLB}/standings?leagueId=103,104&season={SEASON}&standingsTypes=regularSeason&hydrate=team")
    for group in ("hitting", "pitching"):
        for stats in ("season", "sabermetrics"):
            cached(f"mlb_{group}_{stats}.json", mlb_stats(group, stats))
    # Savant: percentiles de todos los jugadores
    cached("savant_pct_batter.csv", f"{SAV}/leaderboard/percentile-rankings?type=batter&year={SEASON}&position=&team=&csv=true")
    cached("savant_pct_pitcher.csv", f"{SAV}/leaderboard/percentile-rankings?type=pitcher&year={SEASON}&position=&team=&csv=true")
    batter_sel = ",".join([
        "pa", "xba", "xslg", "xwoba", "xobp", "xiso", "exit_velocity_avg", "launch_angle_avg", "sweet_spot_percent",
        "barrel_batted_rate", "hard_hit_percent", "avg_best_speed", "avg_hyper_speed", "whiff_percent",
        "swing_percent", "oz_swing_percent", "k_percent", "bb_percent", "sprint_speed", "max_exit_velo",
    ])
    cached(
        "savant_custom_batter.csv",
        f"{SAV}/leaderboard/custom?year={SEASON}&type=batter&filter=&min=q&selections={batter_sel}"
        f"&chart=false&x=xwoba&y=xwoba&r=no&chartType=beeswarm&csv=true",
    )
    pitcher_sel = ",".join([
        "p_formatted_ip", "xera", "xwoba", "xba", "xslg", "exit_velocity_avg", "barrel_batted_rate",
        "hard_hit_percent", "whiff_percent", "k_percent", "bb_percent", "swing_percent", "oz_swing_percent",
    ])
    cached(
        "savant_custom_pitcher.csv",
        f"{SAV}/leaderboard/custom?year={SEASON}&type=pitcher&filter=&min=q&selections={pitcher_sel}"
        f"&chart=false&x=xwoba&y=xwoba&r=no&chartType=beeswarm&csv=true",
    )
    print("ok")


if __name__ == "__main__":
    main()
