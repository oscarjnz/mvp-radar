"""Descarga biografia (perfil tipo mlb.com), splits por mes y game log 2026 de cada candidato
desde la MLB Stats API y los cachea en data/raw/profile_<id>.json.
"""
import json
import os
import sys
import time
import urllib.request

from candidates import all_candidates
from common import RAW

FORCE = "--force" in sys.argv
UA = {"User-Agent": "Mozilla/5.0 (baseball-lab personal research)"}
MLB = "https://statsapi.mlb.com/api/v1"


def get(url):
    last = None
    for i in range(3):
        try:
            return json.loads(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read())
        except Exception as exc:  # noqa: BLE001
            last = exc
            time.sleep(2 * (i + 1))
    raise RuntimeError(f"fallo {url}: {last}")


def main():
    with open(os.path.join(os.path.dirname(RAW), "pool_2026.json"), encoding="utf-8") as fh:
        pool = json.load(fh)
    ids = {}
    for lg in ("AL", "NL"):
        for kind in ("hitters", "pitchers"):
            for r in pool[lg][kind]:
                ids.setdefault((r["name"], "hitter" if kind == "hitters" else "pitcher"), r["id"])
    seen = set()
    for lg, rank, name, role, top in all_candidates():
        groups = []
        if role in ("hitter", "twoway"):
            groups.append(("hitter", "hitting"))
        if role in ("pitcher", "twoway"):
            groups.append(("pitcher", "pitching"))
        pid = ids[(name, groups[0][0])]
        if pid in seen:
            continue
        seen.add(pid)
        dest = os.path.join(RAW, f"profile_{pid}.json")
        if os.path.exists(dest) and not FORCE:
            continue
        out = {"id": pid, "name": name}
        out["bio"] = get(f"{MLB}/people/{pid}?hydrate=currentTeam,draft")["people"][0]
        out["awards"] = get(f"{MLB}/people/{pid}/awards")["awards"]
        for _kind, grp in groups:
            out[f"byMonth_{grp}"] = get(f"{MLB}/people/{pid}/stats?stats=byMonth&season=2026&group={grp}&gameType=R")["stats"][0]["splits"]
            out[f"gameLog_{grp}"] = get(f"{MLB}/people/{pid}/stats?stats=gameLog&season=2026&group={grp}&gameType=R")["stats"][0]["splits"]
        with open(dest, "w", encoding="utf-8") as fh:
            json.dump(out, fh, ensure_ascii=False)
        print("ok", name, pid)


if __name__ == "__main__":
    main()
