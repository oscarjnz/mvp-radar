"""Descarga datos pitch a pitch de Baseball Savant (statcast_search CSV) de la temporada regular 2026
para los candidatos del top 5 y los guarda en data/raw/statcast_<id>_<bat|pit>.csv.
Uso: python scripts/fetch_statcast.py [--force]
"""
import json
import os
import sys
import time
import urllib.request

from candidates import TOP5
from common import RAW

FORCE = "--force" in sys.argv
UA = {"User-Agent": "Mozilla/5.0 (baseball-lab personal research)"}

URL = (
    "https://baseballsavant.mlb.com/statcast_search/csv?all=true&hfPT=&hfAB=&hfGT=R%7C&hfPR=&hfZ=&hfStadium=&hfBBL="
    "&hfNewZones=&hfPull=&hfC=&hfSea=2026%7C&hfSit=&player_type={kind}&hfOuts=&hfOpponent=&pitcher_throws="
    "&batter_stands=&hfSA=&game_date_gt=&game_date_lt=&hfMo=&hfTeam=&home_road=&hfRO=&position=&hfInfield="
    "&hfOutfield=&hfInn=&hfBBT=&{lookup}%5B%5D={pid}&hfFlag=&metric_1=&group_by=name&min_pitches=0&min_results=0"
    "&min_pas=0&sort_col=pitches&player_event_sort=api_p_release_speed&sort_order=desc&type=details"
)


def player_ids():
    ids = {}
    with open(os.path.join(os.path.dirname(RAW), "pool_2026.json"), encoding="utf-8") as fh:
        pool = json.load(fh)
    for lg in ("AL", "NL"):
        for kind in ("hitters", "pitchers"):
            for r in pool[lg][kind]:
                ids.setdefault((r["name"], "hitter" if kind == "hitters" else "pitcher"), r["id"])
    return ids


def fetch(pid, kind):
    suffix = "bat" if kind == "batter" else "pit"
    dest = os.path.join(RAW, f"statcast_{pid}_{suffix}.csv")
    if os.path.exists(dest) and not FORCE:
        return dest
    lookup = "batters_lookup" if kind == "batter" else "pitchers_lookup"
    url = URL.format(kind=kind, lookup=lookup, pid=pid)
    last = None
    for i in range(3):
        try:
            data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=180).read()
            with open(dest, "wb") as fh:
                fh.write(data)
            n = data.count(b"\n") - 1
            print(f"ok {os.path.basename(dest)} {n} filas")
            return dest
        except Exception as exc:  # noqa: BLE001
            last = exc
            time.sleep(3 * (i + 1))
    print("FALLO", pid, kind, last)
    return None


def main():
    ids = player_ids()
    for lg in ("AL", "NL"):
        for name, role in TOP5[lg]:
            if role in ("hitter", "twoway"):
                pid = ids[(name, "hitter")]
                fetch(pid, "batter")
            if role in ("pitcher", "twoway"):
                pid = ids[(name, "pitcher")]
                fetch(pid, "pitcher")


if __name__ == "__main__":
    main()
