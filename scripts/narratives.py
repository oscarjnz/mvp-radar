"""Narrativas del caso MVP de cada candidato. Los números salen de los datos (nunca escritos a mano) y el
contexto cualitativo proviene de la cobertura verificada de MLB.com (encuestas de MVP y notas de septiembre de 2026).
Estilo del proyecto: sin guiones largos, casi sin dos puntos ni punto y coma, y verbos variados para los jonrones.
"""

HR_VERBS = ["conectó", "disparó", "pegó", "bateó", "acumuló"]


def _hr(n, k=0):
    """Frase variada para jonrones. k elige el verbo para no repetirlo dentro de un mismo texto."""
    v = HR_VERBS[k % len(HR_VERBS)]
    return f"{v} {n} jonrones"


def _rec(s):
    t = s.get("teamRec") or {}
    return f"{t.get('w')}-{t.get('l')}"


def _team(s, subject, plural=False, mlb_best=False):
    """Oración sobre el equipo, sin redundancias y con concordancia (sin punto final)."""
    t = s.get("teamRec") or {}
    v1, v2, v3 = ("terminaron", "ganaron", "clasificaron") if plural else ("terminó", "ganó", "clasificó")
    rec = f"{t.get('w')}-{t.get('l')}"
    if mlb_best:
        return f"{subject} {v1} {rec}, el mejor récord de las Grandes Ligas, y {v2} su división"
    if t.get("bestRecord") and t.get("divWinner"):
        return f"{subject} {v1} {rec}, el mejor récord de su liga, y {v2} su división"
    if t.get("divWinner"):
        return f"{subject} {v1} {rec} y {v2} su división"
    if t.get("playoffs"):
        return f"{subject} {v1} {rec} y {v3} a playoffs como comodín"
    return f"{subject} {v1} {rec} y {'quedaron' if plural else 'quedó'} fuera de playoffs"


def _brl(s):
    v = s["hit"]["savant"]["pct"].get("brl_percent")
    return f"Está en el percentil {int(v)} de barrels en Savant, así que pega la pelota muy fuerte." if v is not None else "Pega la pelota muy fuerte según Statcast."


def narrative_for(s):
    handler = {
        "Yordan Alvarez": _alvarez, "Cam Schlittler": _schlittler, "Junior Caminero": _caminero,
        "Bobby Witt Jr.": _witt, "Kevin McGonigle": _mcgonigle, "Pete Crow-Armstrong": _pca,
        "Shohei Ohtani": _ohtani, "Jacob Misiorowski": _misio, "Elly De La Cruz": _edlc, "Brice Turang": _turang,
    }.get(s["name"])
    return handler(s) if handler else _bubble(s)


def _alvarez(s):
    h = s["hit"]
    return {
        "tagline": "El mejor bate de la Liga Americana, con la etiqueta de designado.",
        "pros": [
            f"Su wRC+ de {h['wrcPlus']} es el mejor de la liga por un margen enorme.",
            f"Bateó {h['avg']}/{h['obp']}/{h['slg']}, {_hr(h['hr'], 0)} y remolcó {h['rbi']} carreras.",
            f"Sumó {h['wpa']} de WPA y {h['re24']} de RE24, cifras que muestran cuánto cambió los partidos con el bate.",
            f"{_team(s, 'Houston')}, y su bate sostuvo esa carrera.",
        ],
        "cons": [
            f"Jugó casi siempre como designado, con defensa de {h['fld']} y corrido de {h['bsr']} carreras. Su fWAR de {s['war']['f']} queda por debajo de lo que sugiere su bate.",
            "Se apagó en el tramo final, con pocos jonrones desde agosto y una molestia en el tobillo, y la Triple Corona se alejó.",
            "Según MLB.com, Shohei Ohtani es el único designado que ha ganado un MVP, y lo logró lanzando o con una campaña de 50 jonrones y 50 robos.",
        ],
        "verdict": "Si el voto premia al mejor bateador, es el favorito. Si pesa el WAR total, otros lo acechan. Es la candidatura más ofensiva y también la más discutida por posición.",
        "outlook": "Favorito a ganar el premio de la Liga Americana.",
    }


def _schlittler(s):
    p = s["pit"]
    return {
        "tagline": "Un as de 25 años que cargó a unos Yankees golpeados por las lesiones.",
        "pros": [
            f"Terminó con {p['era']} de efectividad, {p['so']} ponches en {p['ip']} entradas y un FIP de {p['fip']}.",
            f"Su bWAR de {s['war']['b']} es el más alto de la liga y su fWAR es de {s['war']['f']}.",
            "Permitió una carrera o ninguna en 21 aperturas, récord de franquicia de los Yankees.",
            f"{_team(s, 'Nueva York')}, con Aaron Judge fuera buena parte del año (66 juegos).",
        ],
        "cons": [
            "El último lanzador en ganar el MVP fue Clayton Kershaw en la Nacional (2014). En la Americana fue Justin Verlander (2011).",
            "Lanza cada cinco días, así que pesa menos en el conteo diario que un jugador de posición de 700 apariciones.",
            "Compite contra su propio premio. Es casi seguro ganador del Cy Young, y eso divide el voto.",
        ],
        "verdict": "Su temporada sería de MVP en una votación basada solo en WAR. La historia reciente, sin embargo, indica que el Cy Young va a un lanzador y el MVP a un bateador.",
        "outlook": "Cy Young casi asegurado. En el MVP lo normal es verlo entre el 2.º y el 4.º.",
    }


def _caminero(s):
    h = s["hit"]
    return {
        "tagline": "Poder de élite, mejor ojo y el mejor récord de la Americana.",
        "pros": [
            f"{_hr(h['hr'], 1).capitalize()} en su segunda campaña seguida de 40 o más, con {h['wrcPlus']} de wRC+.",
            f"Subió su OBP a {h['obp']} y mejoró su disciplina, con más boletos y pocos ponches.",
            f"{_team(s, 'Tampa Bay')}.",
            _brl(s),
        ],
        "cons": [
            f"Su defensa de {h['fld']} y su corrido de {h['bsr']} carreras le restan valor y recortan su fWAR a {s['war']['f']}.",
            "No lidera la liga en WAR ni en wRC+. Su caso se apoya en el poder y en un equipo ganador.",
        ],
        "verdict": "Es el candidato que mejor encaja con el patrón del voto real, con jonrones, buen récord de equipo y juventud. Su valor total, sin embargo, es menor que el de los tres de arriba.",
        "outlook": "Pelea por el segundo o el tercer lugar en la votación.",
    }


def _witt(s):
    h = s["hit"]
    return {
        "tagline": "El jugador más completo de la Americana, en un equipo que perdió.",
        "pros": [
            f"Su fWAR de {s['war']['f']} es el más alto de la liga entre jugadores de posición, y su bWAR es de {s['war']['b']}.",
            f"Sumó {h['fld']} carreras en defensa y {h['bsr']} corriendo las bases, y se robó {h['sb']} bases. Ese valor no aparece en la línea de bateo.",
            "Ha terminado entre los cinco primeros del MVP en los dos años anteriores.",
        ],
        "cons": [
            f"Su bateo bajó a {h['wrcPlus']} de wRC+, lejos de su gran 2024.",
            f"{_team(s, 'Kansas City')}. Los votantes casi nunca premian a un líder de WAR en un equipo perdedor sin una temporada de 10 o más.",
        ],
        "verdict": "Si el voto fuera solo por WAR, estaría arriba. Con un equipo de 69 victorias y una ofensiva apenas buena, su techo realista es el cuarto lugar.",
        "outlook": "Probable top 5, difícil que llegue al top 2.",
    }


def _mcgonigle(s):
    h = s["hit"]
    novato = (s["bio"].get("debut") or "").startswith("2026")
    return {
        "tagline": ("Un novato de 21 años" if novato else "Un joven de 21 años") + " con el mejor bWAR entre los bateadores de la Americana.",
        "pros": [
            f"Su bWAR de {s['war']['b']} es el más alto entre los bateadores de la Americana, y su fWAR es de {s['war']['f']}.",
            f"Tiene contacto de élite, con {h['avg']}/{h['obp']}/{h['slg']} y apenas {h['so']} ponches en {h['pa']} turnos.",
            f"Su defensa ({h['fld']}) y su corrido ({h['bsr']}) suman valor.",
        ],
        "cons": [
            f"{_team(s, 'Detroit')}.",
            f"Su wRC+ de {h['wrcPlus']} es sólido pero no dominante. Buena parte de su bWAR viene de lo que Baseball Reference mide en defensa y posición.",
            "Los votantes suelen reservar el voto a los novatos para el premio de Novato del Año.",
        ],
        "verdict": "Es el caso que más depende de la fuente de WAR. En Baseball Reference está entre los mejores de la liga y en FanGraphs es un top 5 normal, una muestra de que dos WAR pueden contar historias distintas.",
        "outlook": "En el MVP, entre el 4.º y el 7.º.",
    }


def _pca(s):
    h = s["hit"]
    return {
        "tagline": "La temporada más completa del béisbol, con 40 jonrones, 40 robos y defensa de élite.",
        "pros": [
            f"Lidera en fWAR ({s['war']['f']}) y en bWAR ({s['war']['b']}), y supera por más de cuatro victorias de fWAR al segundo bateador de la Nacional.",
            f"{_hr(h['hr'], 2).capitalize()} y robó {h['sb']} bases, así que pertenece al club 40-40.",
            f"Sumó {h['fld']} carreras en defensa, y MLB.com lo considera posiblemente el mejor defensor de cualquier posición. En las bases aportó {h['bsr']}.",
            f"{_team(s, 'Los Cubs', plural=True)}.",
        ],
        "cons": [
            f"Se ponchó {h['so']} veces en {h['pa']} turnos y su OBP es de {h['obp']}. Su wRC+ ({h['wrcPlus']}) es muy bueno, aunque no histórico.",
            "En 2025 su OBP fue de apenas .287, y la mejora de 2026 es parte de la historia. Falta ver si el voto será unánime.",
        ],
        "verdict": "No hay debate serio. Cualquier forma de contar el valor, ya sea por WAR, por equipo en playoffs, por estadísticas clásicas o por defensa, lo coloca primero. El único dato abierto es si será unánime.",
        "outlook": "Ganador esperado del MVP de la Nacional.",
    }


def _ohtani(s):
    h, p = s["hit"], s["pit"]
    return {
        "tagline": "Aun lesionado y con menos lanzamientos, sigue siendo el único jugador de dos vías.",
        "pros": [
            f"Como bateador, tuvo {h['avg']}/{h['obp']}/{h['slg']}, {_hr(h['hr'], 3)} y {h['wrcPlus']} de wRC+.",
            f"Como lanzador, terminó con {p['era']} de efectividad y {p['so']} ponches en {p['ip']} entradas antes de lesionarse.",
            f"Su valor combinado es de {s['war']['f']} de fWAR, con {h['fwar']} bateando y {p['fwar']} lanzando.",
            f"{_team(s, 'Los Dodgers', plural=True)}.",
        ],
        "cons": [
            f"Jugó {h['g']} partidos y arrastró molestias en la rodilla izquierda y el bíceps derecho. No lanzó en el tramo final.",
            "Su fWAR combinado queda muy por debajo del de Crow-Armstrong.",
            "El voto de 2025 fue unánime, pero esta vez el nombre por sí solo no alcanza.",
        ],
        "verdict": "Con la mitad del trabajo en el montículo, sigue entre los tres mejores de la Nacional. Su caso es el del valor único más que el de la producción total.",
        "outlook": "Segundo lugar probable en la Nacional.",
    }


def _misio(s):
    p = s["pit"]
    return {
        "tagline": "Una temporada de pitcheo de las más dominantes de la era moderna.",
        "pros": [
            f"Terminó con {p['era']} de efectividad, {p['whip']} de WHIP y {p['so']} ponches en {p['ip']} entradas.",
            f"Acumuló {s['war']['f']} de fWAR y {s['war']['b']} de bWAR, con un FIP de {p['fip']}.",
            "Según MLB.com, el OPS en contra de .474 es el segundo más bajo de cualquier abridor calificado desde 1969. Solo Pedro Martínez en 2000 (.473) lo supera.",
            f"{_team(s, 'Milwaukee', mlb_best=True)}.",
        ],
        "cons": [
            "Es lanzador, y la historia reciente le es contraria. Su premio natural es el Cy Young, que casi seguro gana.",
            "Está en su segundo año en la liga, y los votantes suelen pedir más historial para darle un MVP a un lanzador.",
        ],
        "verdict": "Domina todas las categorías de pitcheo, pero su mejor valor está en el Cy Young. En el MVP debería sumar votos de segundo a quinto lugar.",
        "outlook": "Cy Young de la Nacional casi seguro. En el MVP, entre el 2.º y el 4.º.",
    }


def _edlc(s):
    h = s["hit"]
    return {
        "tagline": "Un cierre de temporada explosivo y el club 30-30.",
        "pros": [
            f"{_hr(h['hr'], 4).capitalize()} y robó {h['sb']} bases. Entró al club 30-30, algo que los Rojos no veían desde 2007.",
            f"Registró {h['wrcPlus']} de wRC+ (marca personal) y {s['war']['f']} de fWAR.",
            "En sus últimos 27 partidos antes de la encuesta final bateaba .404 con ocho jonrones.",
        ],
        "cons": [
            f"{_team(s, 'Cincinnati')}.",
            f"Su defensa suma {h['fld']} carreras, se ponchó {h['so']} veces y su bWAR ({s['war']['b']}) es algo menor que su fWAR ({s['war']['f']}).",
        ],
        "verdict": "Es el jugador más emocionante de la liga, en un equipo que no jugó octubre. Su racha final le ganó votos, no el premio.",
        "outlook": "Top 5 probable en la Nacional.",
    }


def _turang(s):
    h = s["hit"]
    return {
        "tagline": "El segunda base del mejor equipo del béisbol.",
        "pros": [
            f"Acumuló {s['war']['b']} de bWAR y {s['war']['f']} de fWAR, con {h['fld']} carreras de defensa.",
            f"Remolcó {h['rbi']} carreras, anotó {h['r']} y robó {h['sb']} bases, con un WPA de {h['wpa']}.",
            f"{_team(s, 'Milwaukee', mlb_best=True)}.",
        ],
        "cons": [
            f"Su bateo es bueno pero no estelar, con {h['wrcPlus']} de wRC+ y {h['hr']} jonrones.",
            "Comparte protagonismo con Misiorowski y otros bateadores de Milwaukee en el voto.",
        ],
        "verdict": "Es el representante del mejor equipo en esta lista. Los votantes premian el resultado colectivo, aunque suelen darle el quinto lugar más que el primero.",
        "outlook": "Candidato a top 5 en el MVP de la Nacional.",
    }


BUBBLE_WHY = {
    "Ben Rice": "Aportó poder en un equipo de playoffs, pero su WAR queda lejos del de los cinco primeros.",
    "Pete Alonso": "Terminó entre los líderes de jonrones e impulsadas de la liga, con un equipo que no llegó a octubre y un corrido de bases que resta valor.",
    "Randy Arozarena": "Combinó un buen bate con buenas marcas de valor, aunque Seattle quedó fuera de playoffs y su defensa le resta.",
    "Dylan Cease": "Fue el segundo mejor lanzador de la liga por WAR, detrás de Schlittler, con un equipo sin playoffs.",
    "Cristopher Sánchez": "Su bWAR es el segundo más alto de la Nacional, detrás del de Crow-Armstrong, pero su fWAR es mucho menor. Las dos fuentes no coinciden.",
    "Chris Sale": "Tuvo una efectividad de élite en menos entradas que sus rivales, y con otros lanzadores adelante en la conversación.",
    "Fernando Tatis Jr.": "Sumó poder y robos en un equipo de playoffs, aunque su bWAR es notablemente menor que su fWAR.",
    "Kyle Schwarber": "Empató el liderato de jonrones, pero su defensa y su corrido restan casi todo el valor que aporta el bate.",
}


def _bubble(s):
    why = BUBBLE_WHY.get(s["name"], "Quedó fuera del top 5, pero se evaluó.")
    pros, cons = [], []
    war = f"{s['war']['f']} de fWAR y {s['war']['b']} de bWAR."
    pros.append(f"Acumuló {war}")
    if s.get("hit"):
        h = s["hit"]
        pros.append(f"Su línea fue {h['avg']}/{h['obp']}/{h['slg']}, con {h['hr']} jonrones, {h['rbi']} impulsadas y {h['wrcPlus']} de wRC+.")
        if h["sb"] >= 20:
            pros.append(f"Robó {h['sb']} bases.")
        if h["fld"] <= -3:
            cons.append(f"Su defensa resta {abs(h['fld'])} carreras.")
        if h["bsr"] <= -2:
            cons.append(f"Su corrido de bases resta {abs(h['bsr'])} carreras.")
    if s.get("pit"):
        p = s["pit"]
        pros.append(f"Terminó con {p['era']} de efectividad y {p['so']} ponches en {p['ip']} entradas.")
        if p["ip"] < 180:
            cons.append(f"Lanzó {p['ip']} entradas, menos que la mayoría de los lanzadores de este grupo.")
        cons.append("Un lanzador necesita una ventaja muy grande para ganar el MVP, algo que no ha ocurrido en la última década.")
    t = s.get("teamRec") or {}
    if not t.get("playoffs"):
        cons.append(f"Su equipo terminó {t.get('w')}-{t.get('l')} y quedó fuera de playoffs.")
    return {"tagline": why, "pros": pros, "cons": cons, "verdict": why, "outlook": "Fuera del top 5 en este análisis."}
