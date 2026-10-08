"""Definicion de candidatos MVP 2026. El orden es el ranking del analisis (no el de la encuesta de MLB.com).

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
