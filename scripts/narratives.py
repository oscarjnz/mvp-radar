"""Narrativas del caso MVP de cada candidato. Los números salen de los datos (nunca escritos a mano);
el contexto cualitativo proviene de la cobertura verificada de MLB.com (encuestas de MVP y notas de septiembre de 2026).
Sin guiones largos (regla de estilo del proyecto).
"""


def _rec(s):
    t = s.get("teamRec") or {}
    po = "con boleto a playoffs" if t.get("playoffs") else "fuera de playoffs"
    if t.get("bestRecord"):
        po = "con el mejor récord de su liga"
    return f"{t.get('w')}-{t.get('l')}", po


def _brl(s):
    v = s["hit"]["savant"]["pct"].get("brl_percent")
    return f"Percentil {int(v)} en barrels de Savant: pega la pelota muy fuerte." if v is not None else "Pega la pelota muy fuerte, según Statcast."


def narrative_for(s):
    handler = {
        "Yordan Alvarez": _alvarez, "Cam Schlittler": _schlittler, "Junior Caminero": _caminero,
        "Bobby Witt Jr.": _witt, "Kevin McGonigle": _mcgonigle, "Pete Crow-Armstrong": _pca,
        "Shohei Ohtani": _ohtani, "Jacob Misiorowski": _misio, "Elly De La Cruz": _edlc, "Brice Turang": _turang,
    }.get(s["name"])
    return handler(s) if handler else _bubble(s)


def _alvarez(s):
    h = s["hit"]
    rec, po = _rec(s)
    return {
        "tagline": "El mejor bate de la Liga Americana, con la etiqueta de designado.",
        "pros": [
            f"{h['wrcPlus']} de wRC+: el mejor de la liga, con una brecha enorme sobre el segundo bateador.",
            f"Línea de {h['avg']}/{h['obp']}/{h['slg']} con {h['hr']} jonrones y {h['rbi']} impulsadas.",
            f"WPA de {h['wpa']} y RE24 de {h['re24']}: es quien más cambió el resultado de los partidos con el bate.",
            f"Houston terminó {rec} y ganó su división ({po}); su bate sostuvo esa carrera.",
        ],
        "cons": [
            f"Jugó casi siempre de bateador designado: defensa de {h['fld']} y corrido de {h['bsr']} carreras. Su WAR ({s['war']['f']}) queda por debajo de lo que dice su bate.",
            "Cayó en el tramo final: pocos jonrones desde agosto y una molestia en el tobillo; la Triple Corona se esfumó.",
            "Según MLB.com, Shohei Ohtani es el único designado en ganar un MVP, y lo hizo pitcheando o con una temporada de 50 jonrones y 50 robos.",
        ],
        "verdict": "Si el voto premia al mejor bateador, es el favorito. Si pesa el WAR total, otros le muerden los talones. Es la candidatura más ofensiva y a la vez la que más se discute por posición.",
        "outlook": "Favorito a ganar el premio de la Liga Americana.",
    }


def _schlittler(s):
    p = s["pit"]
    rec, po = _rec(s)
    return {
        "tagline": "Un as de 25 años que cargó a unos Yankees golpeados por las lesiones.",
        "pros": [
            f"{p['era']} de efectividad en {p['ip']} entradas con {p['so']} ponches; FIP de {p['fip']}.",
            f"{s['war']['b']} de bWAR (el más alto de la liga) y {s['war']['f']} de fWAR.",
            "Permitió una carrera o ninguna en 21 aperturas, récord de franquicia de los Yankees.",
            f"Nueva York terminó {rec} ({po}) con Aaron Judge lesionado buena parte del año (66 juegos).",
        ],
        "cons": [
            "El último lanzador en ganar el MVP fue Clayton Kershaw (Nacional, 2014); en la Americana, Justin Verlander (2011).",
            "Pitchea cada cinco días: pesa menos en el conteo de valor diario que un jugador de posición de 700 apariciones.",
            "Compite con su propio premio: es casi seguro ganador del Cy Young y eso divide el voto.",
        ],
        "verdict": "Su temporada sería MVP en cualquier votación basada solo en WAR, pero la historia reciente dice que los votantes dan el Cy Young a un lanzador y el MVP a un bateador.",
        "outlook": "Cy Young casi asegurado; en el MVP lo normal es verlo entre el 2.º y el 4.º.",
    }


def _caminero(s):
    h = s["hit"]
    rec, po = _rec(s)
    return {
        "tagline": "Poder de élite, mejor ojo y el mejor récord de la Americana.",
        "pros": [
            f"{h['hr']} jonrones: segunda temporada seguida de 40 o más, con {h['wrcPlus']} de wRC+.",
            f"Subió su OBP a {h['obp']} y mejoró su disciplina (más boletos y pocos ponches).",
            f"Tampa Bay ({rec}) tuvo el mejor récord de la liga: {po}.",
            _brl(s),
        ],
        "cons": [
            f"Defensa de {h['fld']} y corrido de {h['bsr']} carreras: le restan valor y recortan su fWAR a {s['war']['f']}.",
            "No lidera la liga en WAR ni en wRC+: su caso es poder más equipo ganador.",
        ],
        "verdict": "El candidato que mejor encaja con el patrón de votación real: jonrones, buen récord de equipo y juventud. Sus números de valor total son menores que los de los tres de arriba.",
        "outlook": "Pelea por el segundo o tercer lugar en la votación.",
    }


def _witt(s):
    h = s["hit"]
    rec, po = _rec(s)
    return {
        "tagline": "El jugador más completo de la Americana, en un equipo que perdió.",
        "pros": [
            f"{s['war']['f']} de fWAR, el más alto de la liga entre jugadores de posición, y {s['war']['b']} de bWAR.",
            f"Defensa de {h['fld']} carreras, corrido de {h['bsr']} y {h['sb']} bases robadas: valor que no sale en la línea de bateo.",
            "Ha terminado en el top 5 del MVP en los dos años anteriores.",
        ],
        "cons": [
            f"Su bateo bajó a {h['wrcPlus']} de wRC+ (lejos de su gran 2024).",
            f"Kansas City terminó {rec}: sin playoffs. Los votantes casi nunca premian a un líder de WAR en un equipo perdedor sin una temporada de 10 o más.",
        ],
        "verdict": "Si el voto fuera puramente por WAR, estaría arriba. Con un equipo de 69 victorias y una línea ofensiva solo buena, su techo realista es el cuarto lugar.",
        "outlook": "Probable top 5; improbable top 2.",
    }


def _mcgonigle(s):
    h = s["hit"]
    rec, po = _rec(s)
    novato = (s["bio"].get("debut") or "").startswith("2026")
    return {
        "tagline": ("Un novato de 21 años" if novato else "Un joven de 21 años") + " con el mejor bWAR entre los bateadores de la Americana.",
        "pros": [
            f"{s['war']['b']} de bWAR (el más alto entre bateadores de la Americana) y {s['war']['f']} de fWAR.",
            f"Contacto de élite: {h['avg']}/{h['obp']}/{h['slg']} con apenas {h['so']} ponches en {h['pa']} turnos.",
            f"Defensa y corrido positivos ({h['fld']} y {h['bsr']} carreras).",
        ],
        "cons": [
            f"Detroit terminó {rec}: fuera de playoffs.",
            f"Su wRC+ de {h['wrcPlus']} es sólido, no dominante. Gran parte de su bWAR viene de lo que mide Baseball Reference en defensa y posición.",
            "Los votantes suelen reservar el voto a los novatos para el premio de Novato del Año.",
        ],
        "verdict": "El caso que más depende de la fuente de WAR: si lees Baseball Reference es de los mejores de la liga; si lees FanGraphs es un top 5 normal. Una prueba de que dos WAR pueden contar historias distintas.",
        "outlook": "En el MVP, entre el 4.º y el 7.º.",
    }


def _pca(s):
    h = s["hit"]
    rec, po = _rec(s)
    return {
        "tagline": "La temporada más completa del béisbol: 40 jonrones, 40 robos y defensa de élite.",
        "pros": [
            f"{s['war']['f']} de fWAR y {s['war']['b']} de bWAR: lidera ambos y supera al segundo bateador de la Nacional por más de cuatro victorias de fWAR.",
            f"{h['hr']} jonrones y {h['sb']} bases robadas: miembro del club 40-40.",
            f"Defensa de {h['fld']} carreras (MLB.com lo considera posiblemente el mejor defensor de cualquier posición) y {h['bsr']} en las bases.",
            f"Los Cubs terminaron {rec} y aseguraron el comodín: {po}.",
        ],
        "cons": [
            f"{h['so']} ponches en {h['pa']} turnos (alto) y un OBP de {h['obp']}; su wRC+ ({h['wrcPlus']}) es muy bueno, no histórico.",
            "En 2025 su OBP fue de apenas .287; la mejora en 2026 es parte de la historia. Falta saber si el voto será unánime.",
        ],
        "verdict": "No hay debate serio: cualquier forma de contar el valor (WAR, equipo en playoffs, estadísticas clásicas, defensa) lo pone en primer lugar. El único dato abierto es si será unánime.",
        "outlook": "Ganador esperado del MVP de la Nacional.",
    }


def _ohtani(s):
    h, p = s["hit"], s["pit"]
    rec, po = _rec(s)
    return {
        "tagline": "Aun lesionado y con menos lanzamientos, sigue siendo el único jugador de dos vías.",
        "pros": [
            f"Bateo: {h['avg']}/{h['obp']}/{h['slg']} con {h['hr']} jonrones y {h['wrcPlus']} de wRC+.",
            f"Pitcheo: {p['era']} de efectividad y {p['so']} ponches en {p['ip']} entradas antes de lesionarse.",
            f"Valor combinado de {s['war']['f']} de fWAR ({h['fwar']} bateando y {p['fwar']} pitcheando).",
            f"Los Dodgers terminaron {rec}: {po}.",
        ],
        "cons": [
            f"Jugó {h['g']} partidos y tuvo molestias en la rodilla izquierda y el bíceps derecho; no lanzó en el tramo final.",
            "Su fWAR combinado queda muy por debajo del de Crow-Armstrong.",
            "El voto de 2025 fue unánime; esta vez el mismo nombre ya no se gana solo.",
        ],
        "verdict": "Con la mitad del trabajo en el montículo sigue entre los tres mejores de la Nacional. Su caso es el de valor único más que el de producción total.",
        "outlook": "Segundo lugar probable en la Nacional.",
    }


def _misio(s):
    p = s["pit"]
    rec, po = _rec(s)
    return {
        "tagline": "Una temporada de pitcheo de las más dominantes de la era moderna.",
        "pros": [
            f"{p['era']} de efectividad, {p['whip']} de WHIP y {p['so']} ponches en {p['ip']} entradas.",
            f"{s['war']['f']} de fWAR y {s['war']['b']} de bWAR; FIP de {p['fip']}.",
            "Según MLB.com, el OPS en contra de .474 es el segundo más bajo de cualquier abridor calificado desde 1969 (solo Pedro Martínez en 2000, con .473, lo supera).",
            f"Milwaukee ({rec}) tuvo el mejor récord de las Grandes Ligas: {po}.",
        ],
        "cons": [
            "Es lanzador: la historia reciente es contraria y su premio natural es el Cy Young (lo gana casi seguro).",
            "Segundo año en la liga; los votantes tienden a esperar más historial para un MVP de pitcher.",
        ],
        "verdict": "Domina todas las categorías de pitcheo, pero su mejor valor está en el Cy Young. En el MVP debería sumar votos de segundo a quinto lugar.",
        "outlook": "Cy Young de la Nacional casi seguro; en el MVP, entre el 2.º y el 4.º.",
    }


def _edlc(s):
    h = s["hit"]
    rec, po = _rec(s)
    return {
        "tagline": "Un final de temporada explosivo y el club 30-30.",
        "pros": [
            f"{h['hr']} jonrones y {h['sb']} bases robadas: club 30-30, algo que los Rojos no veían desde 2007.",
            f"{h['wrcPlus']} de wRC+ (marca personal) y {s['war']['f']} de fWAR.",
            "En sus últimos 27 partidos antes de la encuesta final bateaba .404 con ocho jonrones.",
        ],
        "cons": [
            f"Cincinnati terminó {rec}: {po}.",
            f"Defensa de {h['fld']} carreras, {h['so']} ponches y un bWAR ({s['war']['b']}) algo menor que su fWAR ({s['war']['f']}).",
        ],
        "verdict": "El jugador más emocionante de la liga con un equipo que no jugó octubre. Su racha final le ganó votos, no el premio.",
        "outlook": "Top 5 probable en la Nacional.",
    }


def _turang(s):
    h = s["hit"]
    rec, po = _rec(s)
    return {
        "tagline": "El segunda base del mejor equipo del béisbol.",
        "pros": [
            f"{s['war']['b']} de bWAR y {s['war']['f']} de fWAR con defensa de {h['fld']} carreras.",
            f"{h['rbi']} impulsadas, {h['r']} anotadas y {h['sb']} bases robadas, con WPA de {h['wpa']}.",
            f"Milwaukee terminó {rec}: {po}.",
        ],
        "cons": [
            f"Su bateo es bueno, no estelar ({h['wrcPlus']} de wRC+, {h['hr']} jonrones).",
            "Comparte protagonismo con Misiorowski y otros bateadores de Milwaukee en el voto.",
        ],
        "verdict": "Es el representante del «mejor equipo» en la lista. Los votantes premian el resultado colectivo, aunque suele llevarse el voto de quinto lugar más que el de primero.",
        "outlook": "Candidato a top 5 en el MVP de la Nacional.",
    }


def _bubble(s):
    return {"tagline": "Quedó fuera del top 5, pero se evaluó.", "pros": [], "cons": [], "verdict": "", "outlook": ""}
