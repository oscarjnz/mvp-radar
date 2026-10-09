"""Narrativas del caso Cy Young de cada candidato. Todo sale de los datos (pool de 2026 y ranking dentro de la liga),
nunca de cifras escritas a mano, para que el proceso pueda correr solo cuando el portal sea dinamico.
El unico dato externo es la ultima encuesta de MLB.com (candidates.CY_POLL), que se cita como tal.
Estilo del proyecto: sin guiones largos, casi sin dos puntos ni punto y coma, verbos variados.
"""
from candidates import CY_POLL

LEAGUE = {"AL": "Liga Americana", "NL": "Liga Nacional"}
QUALIFIED_IP = 162.0


def _om(n):
    return f"{n}.º"


def _of(n):
    return f"{n}.ª"


def league_context(pool, lg, name):
    """Puestos y lideres de la liga para un lanzador. Calificado = 162 entradas o mas (una por juego de su equipo)."""
    rows = pool[lg]["pitchers"]
    me = next(r for r in rows if r["name"] == name)
    qual = [r for r in rows if r["ip"] >= QUALIFIED_IP]

    def rank(key, rows_, reverse, getter=None):
        g = getter or (lambda r: r[key])
        vals = [g(r) for r in rows_ if g(r) is not None]
        v = g(me)
        if v is None or me not in rows_:
            return None
        return sorted(vals, reverse=reverse).index(v) + 1

    era = lambda r: float(r["era"])  # noqa: E731
    leader_era = min(qual, key=era) if qual else None
    leader_ip = max(rows, key=lambda r: r["ip"])
    leader_so = max(rows, key=lambda r: r["so"])
    return {
        "eraRank": rank("era", qual, False, era),
        "fipRank": rank("fip", qual, False),
        "soRank": rank("so", rows, True),
        "ipRank": rank("ip", rows, True),
        "winRank": rank("w", rows, True),
        "fwarRank": rank("fwar", rows, True),
        "bwarRank": rank("bwar", rows, True),
        "leaderEra": {"name": leader_era["name"], "era": leader_era["era"]} if leader_era else None,
        "leaderIp": {"name": leader_ip["name"], "ip": leader_ip["ip"]},
        "leaderSo": {"name": leader_so["name"], "so": leader_so["so"]},
    }


def _team_line(s):
    t = s.get("teamRec") or {}
    rec = f"{t.get('w')}-{t.get('l')}"
    if t.get("bestRecord") and t.get("divWinner"):
        return f"Su equipo terminó {rec}, el mejor récord de su liga, y ganó su división"
    if t.get("divWinner"):
        return f"Su equipo terminó {rec} y ganó su división"
    if t.get("playoffs"):
        return f"Su equipo terminó {rec} y clasificó a playoffs como comodín"
    return f"Su equipo terminó {rec} y quedó fuera de playoffs"


def _poll_line(name):
    if name not in CY_POLL:
        return None
    pos, pts, first = CY_POLL[name]
    base = f"En su última encuesta, a dos semanas del cierre de la temporada, el panel de MLB.com lo colocó {_om(pos)} con {pts} puntos"
    return base + (", con todos los votos de primer lugar." if first == 32 else ".")


def _top(n):
    """Forma natural del puesto: 1 es 'el más alto' y el resto 'el N.º más alto'."""
    return "el más alto" if n == 1 else f"el {_om(n)} más alto"


def best_argument(s, ctx):
    """El mejor argumento del candidato, tomado de su puesto dentro de la liga (None si no destaca)."""
    p = s["pit"]
    cands = []
    if ctx["eraRank"] is not None and ctx["eraRank"] <= 3:
        cands.append((ctx["eraRank"], f"su efectividad de {p['era']}, la {_of(ctx['eraRank'])} mejor de su liga entre los calificados"))
    if ctx["bwarRank"] is not None and ctx["bwarRank"] <= 3:
        cands.append((ctx["bwarRank"], f"su bWAR de {s['war']['b']}, {_top(ctx['bwarRank'])} de su liga"))
    if ctx["fwarRank"] is not None and ctx["fwarRank"] <= 3:
        cands.append((ctx["fwarRank"], f"su fWAR de {s['war']['f']}, {_top(ctx['fwarRank'])} de su liga"))
    if ctx["soRank"] is not None and ctx["soRank"] <= 3:
        txt = f"sus {p['so']} ponches, la mejor marca de su liga" if ctx["soRank"] == 1 else f"sus {p['so']} ponches, el {_om(ctx['soRank'])} total de su liga"
        cands.append((ctx["soRank"], txt))
    if ctx["ipRank"] is not None and ctx["ipRank"] <= 3 and int(p["gs"]) >= int(p["g"]) / 2:
        txt = f"sus {p['ip']} entradas, el mayor volumen de su liga" if ctx["ipRank"] == 1 else f"sus {p['ip']} entradas, el {_om(ctx['ipRank'])} mayor volumen de su liga"
        cands.append((ctx["ipRank"], txt))
    if ctx["winRank"] is not None and ctx["winRank"] <= 2:
        cands.append((ctx["winRank"] + 0.5, f"sus {p['w']} victorias, {'las más altas' if ctx['winRank'] == 1 else 'las segundas más altas'} de su liga"))
    if not cands:
        return None
    cands.sort(key=lambda t: t[0])
    return cands[0][1]


def cy_narrative(s, ctx, fifth=None, first=None):
    """s: resumen del candidato (con bloque pit). ctx: league_context. fifth: war del 5.º lugar de su liga. first: resumen del 1.º."""
    p = s["pit"]
    name, lg = s["name"], s["lg"]
    era, fip, ip = float(p["era"]), p["fip"], p["ip"]
    so, bb, w, l = p["so"], p["bb"], p["w"], p["l"]
    gs, g = int(p["gs"]), int(p["g"])
    starter = gs >= g / 2
    k9, bb9 = so * 9 / ip, bb * 9 / ip
    f, b = s["war"]["f"], s["war"]["b"]
    lgname = LEAGUE[lg]
    short_lg = lgname.replace("Liga ", "")
    er, sr, ipr = ctx["eraRank"], ctx["soRank"], ctx["ipRank"]
    br, fr = ctx["bwarRank"], ctx["fwarRank"]
    t = s.get("teamRec") or {}

    # ----- a favor -----
    pros = []
    if er == 1:
        pros.append(f"Tuvo la mejor efectividad de su liga entre los lanzadores calificados, {p['era']}, con un FIP de {fip}.")
    elif er is not None and er <= 5:
        extra = f", y su FIP de {fip} respalda esa cifra" if fip - era <= 0.4 else ""
        pros.append(f"Su efectividad de {p['era']} fue la {_of(er)} mejor de su liga entre los calificados{extra}.")
    else:
        pros.append(f"Terminó con {p['era']} de efectividad y {fip} de FIP en {ip} entradas.")
    if sr == 1:
        pros.append(f"Lideró su liga con {so} ponches, {k9:.1f} por nueve entradas, y regaló {bb} bases por bolas.")
    elif sr is not None and sr <= 3:
        pros.append(f"Ponchó a {so} bateadores, el {_om(sr)} total de su liga, {k9:.1f} por nueve entradas, y regaló {bb} bases por bolas.")
    else:
        pros.append(f"Ponchó a {so} bateadores, {k9:.1f} por nueve entradas, y regaló {bb} bases por bolas.")
    if starter:
        vol = ""
        if ipr == 1:
            vol = ", el mayor volumen de su liga"
        elif ipr is not None and ipr <= 3:
            vol = f", el {_om(ipr)} mayor volumen de su liga"
        pros.append(f"Lanzó {ip} entradas en {gs} aperturas{vol}.")
    else:
        pros.append(f"Lanzó {ip} entradas en {g} apariciones, casi todas como relevista.")
    val = f"Sumó {f} de fWAR y {b} de bWAR"
    if br is not None and br <= 3:
        val += f", y su bWAR es {_top(br)} de su liga"
    elif fr is not None and fr <= 3:
        val += f", y su fWAR es {_top(fr)} de su liga"
    pros.append(val + ".")
    if era - fip >= 0.4:
        pros.append(f"Su FIP de {fip} es mejor que su efectividad, así que sus resultados subyacentes fueron mejores que el marcador.")
    if t.get("playoffs"):
        pros.append(_team_line(s) + ".")

    # ----- en contra -----
    cons = []
    lead = ctx["leaderEra"]
    if er is not None and er > 1 and lead and lead["name"] != name:
        cons.append(f"Su efectividad de {p['era']} quedó por detrás de la {lead['era']} que logró {lead['name']}.")
    li = ctx["leaderIp"]
    if starter and ip < 0.9 * li["ip"] and li["name"] != name:
        cons.append(f"Lanzó {ip} entradas, {li['ip'] - ip:.0f} menos que {li['name']}, líder de su liga con {li['ip']}.")
    if fip - era >= 0.5:
        cons.append(f"Su FIP de {fip} es {fip - era:.2f} más alto que su efectividad, así que parte de su resultado dependió de la defensa y del contexto.")
    if abs(f - b) >= 1.5:
        cons.append(f"Las dos fuentes de WAR discrepan, con {f} de fWAR contra {b} de bWAR.")
    if bb9 >= 3.3 and starter:
        cons.append(f"Concedió {bb9:.1f} bases por bolas por nueve entradas, la parte más débil de su temporada.")
    if starter and w <= 11:
        cons.append(f"Su récord de {w}-{l} es modesto para un candidato al premio.")
    if not t.get("playoffs"):
        cons.append(_team_line(s) + ", aunque ese factor ha pesado poco en el voto del Cy Young.")

    # ----- lectura -----
    if er == 1 and sr is not None and sr <= 2:
        tagline = "Domina la efectividad y los ponches de su liga."
    elif er == 1:
        tagline = f"Tiene la mejor efectividad de la {short_lg}."
    elif sr == 1:
        tagline = f"Lidera la {short_lg} en ponches."
    elif ipr == 1 and starter:
        tagline = "El lanzador que más entradas trabajó en su liga."
    elif br == 1:
        tagline = f"El líder de bWAR de la {short_lg}."
    elif br is not None and br <= 3:
        tagline = f"El {_om(br)} en bWAR de la {short_lg}, con {b}."
    elif sr is not None and sr <= 3:
        tagline = f"Un brazo de ponches, {so} en la temporada."
    else:
        tagline = f"Un candidato con {f} de fWAR y {b} de bWAR."

    poll = _poll_line(name) or ""
    arg = best_argument(s, ctx)
    if not starter:
        arg = f"su FIP de {fip} y sus {k9:.1f} ponches por nueve entradas, aunque en solo {ip} entradas"
    if s["top5"]:
        if s["rank"] == 1:
            verdict = f"Reúne el mejor conjunto de números entre los lanzadores de su liga. {poll}"
            outlook = f"Favorito a ganar el Cy Young de la {lgname}."
        elif s["rank"] == 2:
            reasons = []
            if first:
                if s["war"]["b"] > first["war"]["b"]:
                    reasons.append(f"su bWAR de {s['war']['b']} supera al {first['war']['b']} del favorito")
                if s["pit"]["ip"] > first["pit"]["ip"]:
                    reasons.append(f"lanzó {s['pit']['ip']} entradas contra {first['pit']['ip']}")
                if s["pit"]["so"] > first["pit"]["so"]:
                    reasons.append(f"ponchó a {s['pit']['so']} contra {first['pit']['so']}")
            if reasons:
                verdict = f"Es el principal aspirante a quitarle el premio al favorito, porque {' y '.join(reasons)}. {poll}"
            else:
                verdict = f"Es el principal perseguidor del favorito, aunque no lo supera en bWAR, entradas ni ponches. {poll}"
            outlook = "Candidato a un lugar entre los dos primeros de la boleta."
        else:
            verdict = (f"Destaca por {arg}. {poll}" if arg else f"Aparece entre los cinco mejores de su liga por la suma de sus números. {poll}")
            outlook = "Candidato a un puesto de tercero a quinto en la boleta."
    else:
        ref = fifth or {}
        base = f"Quedó fuera del top 5 de su liga, con un WAR promedio de {s['war']['avg']} frente al {ref.get('avg')} del quinto lugar."
        verdict = f"{base} Destaca por {arg}. {poll}" if arg else f"{base} {poll}"
        outlook = "Entre los lanzadores a vigilar, aunque fuera del top 5."
    return {"tagline": tagline, "pros": pros, "cons": cons, "verdict": verdict.strip(), "outlook": outlook}
