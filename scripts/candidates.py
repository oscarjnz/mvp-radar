"""Definicion de candidatos MVP y Cy Young 2026. El orden es el ranking del analisis (no el de la encuesta de MLB.com).

role: 'hitter' | 'pitcher' | 'twoway'. 'twoway' usa tanto la tabla de bateo como la de pitcheo.
La burbuja son jugadores que se evaluaron y quedaron fuera del top 5, con razon escrita en build_site_data.py.
"""

TOP5 = {
    "AL": [
        ("Yordan Alvarez", "hitter"),
        ("Cam Schlittler", "pitcher"),
        ("Junior Caminero", "hitter"),
        ("Bobby Witt Jr.", "hitter"),
        ("Kevin McGonigle", "hitter"),
    ],
    "NL": [
        ("Pete Crow-Armstrong", "hitter"),
        ("Shohei Ohtani", "twoway"),
        ("Jacob Misiorowski", "pitcher"),
        ("Elly De La Cruz", "hitter"),
        ("Brice Turang", "hitter"),
    ],
}

BUBBLE = {
    "AL": [
        ("Ben Rice", "hitter"),
        ("Pete Alonso", "hitter"),
        ("Randy Arozarena", "hitter"),
        ("Dylan Cease", "pitcher"),
    ],
    "NL": [
        ("Cristopher Sánchez", "pitcher"),
        ("Chris Sale", "pitcher"),
        ("Fernando Tatis Jr.", "hitter"),
        ("Kyle Schwarber", "hitter"),
    ],
}


def all_candidates():
    for lg in ("AL", "NL"):
        for rank, (name, role) in enumerate(TOP5[lg], 1):
            yield lg, rank, name, role, True
        for rank, (name, role) in enumerate(BUBBLE[lg], 6):
            yield lg, rank, name, role, False


# ---------------------------------------------------------------------------
# Cy Young 2026. Todos son lanzadores. El orden es el del analisis (no el de la encuesta de MLB.com).
# La burbuja son los lanzadores que recibieron votos en la ultima encuesta de MLB.com y quedaron fuera del top 5.
# ---------------------------------------------------------------------------
CY_TOP5 = {
    "AL": ["Cam Schlittler", "Dylan Cease", "Parker Messick", "Drew Rasmussen", "Sonny Gray"],
    "NL": ["Jacob Misiorowski", "Cristopher Sánchez", "Chris Sale", "Jesús Luzardo", "Yoshinobu Yamamoto"],
}

CY_BUBBLE = {
    "AL": ["Reid Detmers", "Gavin Williams", "Nick Martinez", "Michael Wacha"],
    "NL": ["Zack Wheeler", "Chase Burns", "Eduardo Rodriguez", "Mason Miller"],
}

# Ultima encuesta de MLB.com (32 votantes, a dos semanas del cierre, 5-4-3-2-1). nombre -> (puesto, puntos, votos de 1er lugar)
CY_POLL = {
    "Cam Schlittler": (1, 160, 32), "Dylan Cease": (2, 126, 0), "Parker Messick": (3, 77, 0), "Drew Rasmussen": (4, 52, 0), "Sonny Gray": (5, 37, 0),
    "Jacob Misiorowski": (1, 160, 32), "Chris Sale": (2, 106, 0), "Cristopher Sánchez": (3, 99, 0), "Jesús Luzardo": (4, 52, 0), "Yoshinobu Yamamoto": (5, 43, 0),
}


def all_cy_candidates():
    for lg in ("AL", "NL"):
        for rank, name in enumerate(CY_TOP5[lg], 1):
            yield lg, rank, name, "pitcher", True
        for rank, name in enumerate(CY_BUBBLE[lg], 6):
            yield lg, rank, name, "pitcher", False


def all_people():
    """Union (liga, nombre, rol) de todos los premios, sin repetir el mismo jugador y rol."""
    seen = set()
    for lg, _rank, name, role, _top in list(all_candidates()) + list(all_cy_candidates()):
        if (name, role) in seen:
            continue
        seen.add((name, role))
        yield lg, name, role

