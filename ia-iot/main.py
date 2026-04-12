# ========================================
# MICRO-SERVICE IA — Solution Embarquée
# FastAPI — Port 8000
# Version 2 — Recommandations dynamiques
# ========================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List
import joblib
import numpy as np
import os

app = FastAPI(
    title="Solution Embarquée — Service IA",
    description="Micro-service de prédiction de pannes industrielles avec recommandations dynamiques",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model = joblib.load(os.path.join(BASE_DIR, "random_forest_model.pkl"))
medians = joblib.load(os.path.join(BASE_DIR, "medians.pkl"))
features_list = joblib.load(os.path.join(BASE_DIR, "features_list.pkl"))

print(f"✅ Modèle chargé — {len(features_list)} features")
print(f"📏 Médianes : {medians}")

# ========================================
# CLASSES ET LABELS
# ========================================

CLASSES = {
    0: "normal",
    1: "pre_panne",
    2: "panne_active"
}

LABELS_NIVEAU = {
    "normal": {
        "niveau": "normal",
        "message": "Fonctionnement nominal. Tous les capteurs dans les seuils.",
    },
    "pre_panne": {
        "niveau": "attention",
        "message": "Anomalie détectée. Surveillance renforcée recommandée.",
    },
    "panne_active": {
        "niveau": "critique",
        "message": "Panne active détectée. Intervention immédiate requise.",
    }
}

# ========================================
# GÉNÉRATEUR DE RECOMMANDATIONS DYNAMIQUES
# ========================================

def generer_causes_dynamiques(valeurs: dict, seuils: dict) -> List[dict]:
    """
    Analyse chaque capteur et génère les causes détectées avec les vraies valeurs.
    Retourne une liste de causes structurées.
    """
    causes = []

    capteurs_config = [
        ("temperature", "Température", "°C", "temperature"),
        ("courant", "Courant", "A", "courant"),
        ("vibration", "Vibration", "g", "vibration"),
        ("pression", "Pression", "bar", "pression"),
    ]

    for cle_valeur, label, unite, cle_seuil in capteurs_config:
        valeur = valeurs.get(cle_valeur, 0)
        seuil = seuils.get(cle_seuil)

        if not seuil:
            continue

        seuil_min = seuil.get("min", 0)
        seuil_max = seuil.get("max", 0)

        if valeur > seuil_max:
            ecart = ((valeur - seuil_max) / seuil_max) * 100
            causes.append({
                "capteur": label,
                "type": "depassement_haut",
                "valeur": valeur,
                "seuil_min": seuil_min,
                "seuil_max": seuil_max,
                "unite": unite,
                "ecart_pct": round(ecart, 1),
                "description": f"{label} élevée : {valeur:.1f} {unite} (seuil max {seuil_max:.1f} {unite}) — dépassement {ecart:.0f}%"
            })
        elif valeur < seuil_min and valeur > 0:
            ecart = ((seuil_min - valeur) / seuil_min) * 100
            causes.append({
                "capteur": label,
                "type": "sous_seuil",
                "valeur": valeur,
                "seuil_min": seuil_min,
                "seuil_max": seuil_max,
                "unite": unite,
                "ecart_pct": round(ecart, 1),
                "description": f"{label} sous le seuil : {valeur:.1f} {unite} (seuil min {seuil_min:.1f} {unite}) — manque {ecart:.0f}%"
            })
        elif valeur >= seuil_max * 0.95:
            causes.append({
                "capteur": label,
                "type": "proche_max",
                "valeur": valeur,
                "seuil_min": seuil_min,
                "seuil_max": seuil_max,
                "unite": unite,
                "ecart_pct": 0,
                "description": f"{label} : {valeur:.1f} {unite} approche le seuil maximum ({seuil_max:.1f} {unite})"
            })

    return causes


def generer_actions_dynamiques(niveau: str, causes: List[dict]) -> List[str]:
    """
    Génère des actions recommandées basées sur le niveau et les causes détectées.
    """
    actions = []

    actions_par_capteur = {
        "Température": {
            "depassement_haut": "Vérifier le système de refroidissement (ventilateur, circuit de liquide)",
            "sous_seuil": "Vérifier le système de chauffage et les sondes de température",
            "proche_max": "Surveiller l'évolution de la température et préparer le refroidissement"
        },
        "Courant": {
            "depassement_haut": "Inspecter le moteur et les connexions électriques (surcharge possible)",
            "sous_seuil": "Vérifier l'alimentation électrique et la continuité du circuit",
            "proche_max": "Surveiller la consommation, possible surcharge en cours"
        },
        "Vibration": {
            "depassement_haut": "Inspecter immédiatement les roulements, fixations et arbres rotatifs",
            "sous_seuil": "Vérifier que la machine est bien en fonctionnement",
            "proche_max": "Planifier une vérification mécanique rapide"
        },
        "Pression": {
            "depassement_haut": "Vérifier les joints, vannes et soupape de sécurité du circuit pneumatique",
            "sous_seuil": "Inspecter le circuit pneumatique : fuites possibles ou pompe défaillante",
            "proche_max": "Surveiller la pression et préparer une décharge si nécessaire"
        }
    }

    for cause in causes:
        capteur = cause["capteur"]
        type_anomalie = cause["type"]
        if capteur in actions_par_capteur and type_anomalie in actions_par_capteur[capteur]:
            actions.append(actions_par_capteur[capteur][type_anomalie])

    if niveau == "critique":
        actions.append("Arrêter la machine immédiatement (bouton arrêt d'urgence)")
        actions.append("Notifier le responsable maintenance pour intervention urgente")
    elif niveau == "attention":
        actions.append("Planifier une inspection préventive dans les 48h")
        actions.append("Surveiller l'évolution des capteurs en temps réel")

    seen = set()
    actions_uniques = []
    for a in actions:
        if a not in seen:
            seen.add(a)
            actions_uniques.append(a)

    return actions_uniques


# ========================================
# MODÈLES PYDANTIC
# ========================================

class SeuilCapteur(BaseModel):
    min: float
    max: float


class DonneesCapteurs(BaseModel):
    temperature: float
    vibration: float
    pression: float
    energie: float
    downtime_risk: Optional[float] = 0.0
    maintenance_required: Optional[int] = 0
    seuils: Optional[Dict[str, SeuilCapteur]] = None


class ReponseAnalyse(BaseModel):
    classe: int
    label: str
    confiance: float
    distribution: Dict[str, float]
    niveau: str
    message: str
    causes: list
    actions: list
    valeurs: dict


# ========================================
# ROUTES
# ========================================

@app.get("/")
def accueil():
    return {
        "service": "Solution Embarquée — IA",
        "version": "2.0.0",
        "status": "actif",
        "modele": "Random Forest"
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict", response_model=ReponseAnalyse)
def predire(donnees: DonneesCapteurs):
    """
    Prédit l'état de la machine et génère causes + actions dynamiques.
    """
    ratio_temp = donnees.temperature / medians['temperature']
    ratio_vib = donnees.vibration / medians['vibration']
    ratio_pres = donnees.pression / medians['pressure']
    ratio_ener = donnees.energie / medians['energy_consumption']

    X = np.array([[
        donnees.temperature,
        donnees.vibration,
        donnees.pression,
        donnees.energie,
        ratio_temp,
        ratio_vib,
        ratio_pres,
        ratio_ener,
        donnees.downtime_risk,
        donnees.maintenance_required
    ]])

    classe = int(model.predict(X)[0])
    probas = model.predict_proba(X)[0]
    confiance = float(max(probas))
    label = CLASSES[classe]

    distribution = {
        "normal": round(float(probas[0]), 4),
        "attention": round(float(probas[1]), 4),
        "critique": round(float(probas[2]), 4),
    }

    info_niveau = LABELS_NIVEAU[label]

    valeurs = {
        "temperature": donnees.temperature,
        "courant": donnees.energie,
        "vibration": donnees.vibration,
        "pression": donnees.pression,
    }

    if donnees.seuils:
        seuils_dict = {
            "temperature": {"min": donnees.seuils.get("temperature").min if donnees.seuils.get("temperature") else 70, "max": donnees.seuils.get("temperature").max if donnees.seuils.get("temperature") else 88},
            "courant": {"min": donnees.seuils.get("courant").min if donnees.seuils.get("courant") else 4.5, "max": donnees.seuils.get("courant").max if donnees.seuils.get("courant") else 5.5},
            "vibration": {"min": donnees.seuils.get("vibration").min if donnees.seuils.get("vibration") else 0.8, "max": donnees.seuils.get("vibration").max if donnees.seuils.get("vibration") else 1.1},
            "pression": {"min": donnees.seuils.get("pression").min if donnees.seuils.get("pression") else 4.0, "max": donnees.seuils.get("pression").max if donnees.seuils.get("pression") else 5.0},
        }
    else:
        seuils_dict = {
            "temperature": {"min": 70, "max": 88},
            "courant": {"min": 4.5, "max": 5.5},
            "vibration": {"min": 0.8, "max": 1.1},
            "pression": {"min": 4.0, "max": 5.0},
        }

    causes = generer_causes_dynamiques(valeurs, seuils_dict)
    actions = generer_actions_dynamiques(info_niveau["niveau"], causes)

    return ReponseAnalyse(
        classe=classe,
        label=label,
        confiance=round(confiance, 4),
        distribution=distribution,
        niveau=info_niveau["niveau"],
        message=info_niveau["message"],
        causes=causes,
        actions=actions,
        valeurs=valeurs,
    )


@app.post("/analyse")
def analyse_complete(donnees: DonneesCapteurs):
    prediction = predire(donnees)
    return {
        "prediction": {
            "classe": prediction.classe,
            "label": prediction.label,
            "confiance": prediction.confiance,
            "distribution": prediction.distribution,
        },
        "diagnostic": {
            "niveau": prediction.niveau,
            "message": prediction.message,
        },
        "causes": prediction.causes,
        "actions": prediction.actions,
        "valeurs": prediction.valeurs,
    }


if __name__ == "__main__":
    import uvicorn
    print("🚀 Démarrage du service IA sur le port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)