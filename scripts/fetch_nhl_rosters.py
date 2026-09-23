"""Récupère les alignements actuels des 32 équipes de la LNH, avec les statistiques LNH
de saison régulière des deux dernières saisons de chaque joueur.

À lancer sur ton ordinateur (l'API de la LNH n'est pas accessible depuis Claude Code) :
    pip install requests pandas
    python scripts/fetch_nhl_rosters.py
Puis téléverse alignement_complet_nhl.json et lance :
    node scripts/import-nhl-rosters.mjs alignement_complet_nhl.json
"""
import time
import pandas as pd
import requests

NHL_TEAMS = [
    "ANA", "BOS", "BUF", "CAR", "CBJ", "CGY", "CHI", "COL", "DAL", "DET", "EDM",
    "FLA", "LAK", "MIN", "MTL", "NJD", "NSH", "NYI", "NYR", "OTT", "PHI", "PIT",
    "SEA", "SJS", "STL", "TBL", "TOR", "UTA", "VAN", "VGK", "WPG", "WSH",
]
PAUSE = 0.35  # secondes entre les requêtes, pour respecter l'API
SEASONS_KEPT = 2  # nombre de saisons régulières LNH additionnées


def toi_minutes(value):
    """'18:34' -> 18.57 ; None -> None."""
    if not value or ":" not in str(value):
        return None
    m, s = str(value).split(":")[:2]
    return int(m) + int(s) / 60


def weighted(rows, key, weight="gamesPlayed", transform=lambda v: v):
    num = den = 0.0
    for r in rows:
        v = r.get(key)
        if v is None:
            continue
        v = transform(v)
        if v is None:
            continue
        w = r.get(weight) or 0
        num += v * w
        den += w
    return round(num / den, 4) if den else None


def recent_nhl_stats(player_id):
    """Somme des SEASONS_KEPT dernières saisons régulières LNH (gameTypeId 2)."""
    url = f"https://api-web.nhle.com/v1/player/{player_id}/landing"
    r = requests.get(url, timeout=20)
    if r.status_code != 200:
        return {}
    totals = [
        s for s in r.json().get("seasonTotals", [])
        if s.get("leagueAbbrev") == "NHL" and s.get("gameTypeId") == 2
    ]
    seasons = sorted({s.get("season") for s in totals}, reverse=True)[:SEASONS_KEPT]
    rows = [s for s in totals if s.get("season") in seasons]
    if not rows:
        return {"saisons_lnh": 0}

    def total(key):
        return sum((s.get(key) or 0) for s in rows)

    return {
        "saisons_lnh": len(seasons),
        "pj": total("gamesPlayed"),
        "buts": total("goals"),
        "passes": total("assists"),
        "points": total("points"),
        "plus_minus": total("plusMinus"),
        "pun": total("pim"),
        "tirs": total("shots"),
        "temps_glace_moy": weighted(rows, "avgToi", transform=toi_minutes),
        "mises_au_jeu_pct": weighted(rows, "faceoffWinningPctg"),
        # gardiens
        "victoires": total("wins"),
        "departs": total("gamesStarted"),
        "blanchissages": total("shutouts"),
        "moy_buts_contre": weighted(rows, "goalsAgainstAvg"),
        "pct_arrets": weighted(rows, "savePctg"),
    }


all_players = []
print("Récupération des alignements et statistiques de la LNH...")
for team_code in NHL_TEAMS:
    try:
        response = requests.get(f"https://api-web.nhle.com/v1/roster/{team_code}/current", timeout=20)
        if response.status_code != 200:
            print(f"-> Erreur {response.status_code} pour {team_code}")
            continue
        data = response.json()
        for category in ["forwards", "defensemen", "goalies"]:
            for player in data.get(category, []):
                info = {
                    "equipe": team_code,
                    "id_joueur": player.get("id"),
                    "prenom": (player.get("firstName") or {}).get("default"),
                    "nom": (player.get("lastName") or {}).get("default"),
                    "position": player.get("positionCode"),
                    "numero_maillot": player.get("sweaterNumber"),
                    "date_naissance": player.get("birthDate"),
                    "pays_naissance": player.get("birthCountry"),
                    "taille_pouces": player.get("heightInInches"),
                    "poids_livres": player.get("weightInPounds"),
                    "tire_la_main": player.get("shootsCatches"),
                    "categorie": category,
                }
                try:
                    info.update(recent_nhl_stats(info["id_joueur"]))
                except Exception as e:  # statistiques facultatives
                    print(f"   stats indisponibles pour {info['prenom']} {info['nom']} : {e}")
                time.sleep(PAUSE)
                all_players.append(info)
        print(f"-> {team_code} : ok")
    except Exception as e:
        print(f"-> Erreur technique pour {team_code} : {e}")
    time.sleep(PAUSE)

df = pd.DataFrame(all_players)
df.to_csv("alignement_complet_nhl.csv", index=False, encoding="utf-8-sig")
df.to_json("alignement_complet_nhl.json", orient="records", force_ascii=False, indent=2)
print(f"\nTerminé : {len(df)} joueurs -> alignement_complet_nhl.json / .csv")
