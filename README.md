<div align="center">

# 🏭 Solution Embarquée IoT

### Plateforme de supervision et de commande d'actionneurs industriels

Maintenance prédictive intelligente · Audit trail temps réel · Contrôle multi-rôles

[![Statut](https://img.shields.io/badge/Statut-En%20développement-blue)]()
[![Licence](https://img.shields.io/badge/Licence-Académique-green)]()
[![PFE](https://img.shields.io/badge/PFE-ISET%20Mahdia%202026-orange)]()

[Fonctionnalités](#-fonctionnalités-principales) •
[Architecture](#-architecture-technique) •
[Installation](#-installation-et-démarrage) •
[Captures](#-captures-décran) •
[Contexte](#-contexte-académique)

</div>

---

## 📖 Présentation

**Solution Embarquée** est une plateforme full-stack de supervision industrielle développée dans le cadre d'un Projet de Fin d'Études. Elle permet de surveiller en temps réel un parc de machines industrielles, de détecter automatiquement les anomalies grâce à un modèle de Machine Learning, et de commander à distance les actionneurs (moteurs, LED, buzzer, servomoteurs).

Le système est conçu pour fonctionner selon deux modes opérationnels :
- **Mode automatique** : l'ESP32 contrôle les actionneurs selon les seuils capteurs
- **Mode manuel** : les opérateurs reprennent le contrôle depuis l'interface web

Un **module de maintenance prédictive** basé sur un modèle **Random Forest** (95.91% d'accuracy) analyse en continu l'état des machines et recommande des actions correctives avant que les pannes ne surviennent.

---

## ✨ Fonctionnalités principales

### 🎛️ Supervision temps réel
- Tableau de bord interactif avec données capteurs toutes les 10 secondes
- Visualisation de 4 types de capteurs : température, courant, vibration, pression
- Carte d'opérateurs affectés par machine
- Indicateurs visuels d'état (en marche / arrêtée / hors ligne)

### 🤖 Intelligence artificielle — Maintenance prédictive
- Modèle **Random Forest** entraîné sur 100 000 échantillons industriels
- Classification en 3 niveaux : Normal / Attention / Critique
- **Distribution probabiliste** complète des 3 classes affichée (transparence du modèle)
- **Approche hybride ML + règles métier** : le ML détecte le niveau, les règles génèrent des recommandations contextuelles avec valeurs réelles et pourcentages d'écart
- Mode dégradé automatique si le service IA est indisponible

### 🔒 Sécurité et contrôle d'accès
- Authentification **JWT** avec secret en variable d'environnement
- **3 rôles** distincts : administrateur, responsable maintenance, opérateur
- Permissions granulaires via `JwtGuard` et `RolesGuard`
- Mot de passe chiffré avec bcrypt

### ⚠️ Gestion des alertes (détection bidirectionnelle)
- Détection automatique des anomalies : valeur sous le minimum OU au-dessus du maximum
- Calcul du niveau de gravité basé sur l'ampleur de l'écart par rapport au seuil
- Seuils configurables par machine et par capteur
- Résolution manuelle avec traçabilité utilisateur

### 🛑 Mode Auto/Manuel + Arrêt d'urgence (ISO 13850)
- Basculement automatique/manuel réservé à l'administration et au responsable maintenance
- **Arrêt d'urgence accessible à tous les rôles** (conformité ISO 13850)
- Redémarrage réservé au responsable maintenance (vérification avant reprise)
- Désactivation forcée de tous les actionneurs lors d'un arrêt d'urgence
- Création automatique d'une alerte critique traçant l'opérateur responsable

### 📋 Audit trail — Entité Événements (ISO 13374)
- Enregistrement de toutes les actions humaines sur le système
- 5 types d'événements : arrêt d'urgence, redémarrage, changement de mode, alerte résolue, commande actionneur
- Timeline complète avec utilisateur, rôle, machine et horodatage
- Filtrage par machine et par période (1h, 24h, 7j, 30j)

### 📊 Historique et analyse
- Visualisation graphique des 18 dernières lectures par capteur
- Statistiques Min / Moyenne / Max colorées
- Export CSV complet pour audits externes
- Journal des événements intégré

---

## 🏗️ Architecture technique

Le projet suit une architecture **microservices à 3 niveaux** déployée autour d'une base de données cloud centralisée.

### Composants du système

| Composant | Technologie | Port | Rôle |
|---|---|---|---|
| **Frontend** | React 18 + TypeScript | 3000 | Interface utilisateur web |
| **Backend API** | NestJS 10 + TypeScript | 3001 | Logique métier, authentification, proxy IA |
| **Service IA** | FastAPI + scikit-learn | 8000 | Prédiction Random Forest (95.91%) |
| **Base de données** | MongoDB Atlas | Cloud | Persistance des données |

### Schéma d'architecture

```mermaid
graph TB
    A[Frontend React - Port 3000] -->|HTTP/JSON| B[Backend NestJS - Port 3001]
    B -->|HTTP/JSON| C[Service IA Python - Port 8000]
    B -->|Mongoose ODM| D[(MongoDB Atlas)]
    C -->|Predictions| B
    C -->|joblib| E[Random Forest - 95.91 pourcent accuracy]

    style A fill:#61DAFB,stroke:#000,color:#000
    style B fill:#E0234E,stroke:#000,color:#fff
    style C fill:#009688,stroke:#000,color:#fff
    style D fill:#47A248,stroke:#000,color:#fff
    style E fill:#F7931E,stroke:#000,color:#000
```

### Flux de données
1. Le **backend** collecte les données capteurs (actuellement simulées, ESP32 en Phase 2)
2. Les données sont stockées dans **MongoDB Atlas**
3. Le **service IA** est interrogé toutes les 15 secondes pour analyser l'état du parc
4. Le **frontend** affiche les résultats en temps réel et permet le contrôle

---

## 🛠️ Stack technique

### Frontend
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)
![CRA](https://img.shields.io/badge/Create%20React%20App-blue)
![Lucide](https://img.shields.io/badge/Lucide-Icons-F56565)

- **React 18** avec TypeScript pour la robustesse du typage
- **Create React App** comme environnement de développement
- **Styles inline** pour un contrôle total du rendu
- **Lucide React** pour les icônes
- **Axios** pour les appels API

### Backend
![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?logo=jsonwebtokens)
![Mongoose](https://img.shields.io/badge/Mongoose-ODM-880000)

- **NestJS 10** — architecture modulaire avec injection de dépendances
- **Mongoose** comme ORM pour MongoDB
- **Passport JWT** pour l'authentification
- **Class-validator** pour la validation des DTOs
- **@nestjs/schedule** pour les tâches cron (simulation et nettoyage)

### Service IA
![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-RF-F7931E?logo=scikit-learn&logoColor=white)

- **FastAPI** — framework Python asynchrone ultra-rapide
- **scikit-learn** pour le modèle Random Forest
- **NumPy** + **Pandas** pour la manipulation de données
- **joblib** pour la sérialisation du modèle

### Base de données
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)

- **MongoDB Atlas** — base cloud managée
- 9 collections : utilisateurs, machines, actionneurs, capteurdatas, seuils, alertes, affectations, evenements

---

## 📁 Structure du projet

```
Projet de Developpement Industrielle/
│
├── backend-iot/                    # API NestJS
│   ├── src/
│   │   ├── actionneurs/            # Gestion des actionneurs
│   │   ├── affectations/           # Affectation operateurs-machines
│   │   ├── alertes/                # Gestion des alertes
│   │   ├── auth/                   # Authentification JWT
│   │   ├── capteurs/               # Capteurs + simulation
│   │   ├── common/                 # Guards, decorateurs, init
│   │   ├── evenements/             # Audit trail (ISO 13374)
│   │   ├── ia/                     # Proxy vers le service Python
│   │   ├── machines/               # Gestion des machines
│   │   ├── seuils/                 # Configuration des seuils
│   │   └── utilisateurs/           # Gestion des utilisateurs
│   ├── .env.example                # Template variables d'environnement
│   └── package.json
│
├── frontend-iot/                   # Interface React
│   ├── src/
│   │   ├── components/             # Composants reutilisables
│   │   ├── contexte/               # Context API (authentification)
│   │   ├── crochets/               # Hooks personnalises
│   │   ├── gardiens/               # Route guards
│   │   ├── pages/                  # Pages principales
│   │   ├── services/               # Client API
│   │   └── types/                  # Types TypeScript
│   └── package.json
│
├── ia-iot/                         # Microservice IA Python
│   ├── main.py                     # FastAPI + endpoints
│   ├── random_forest_model.pkl     # Modele entraine (64 MB)
│   ├── medians.pkl                 # Medianes pour normalisation
│   ├── features_list.pkl           # Liste des features
│   └── requirements.txt
│
├── .gitignore
└── README.md
```

---

## 🚀 Installation et démarrage

### Prérequis
- **Node.js** 18+ et npm
- **Python** 3.11+
- **MongoDB Atlas** (compte gratuit sur [mongodb.com](https://www.mongodb.com/atlas))
- **Git**

### 1. Cloner le repository

```bash
git clone https://github.com/TougmaKBoris/SolutionEmbarquee-iot.git
cd SolutionEmbarquee-iot
```

### 2. Configurer le backend NestJS

```bash
cd backend-iot
npm install
```

Créer un fichier `.env` à la racine de `backend-iot/` en vous basant sur `.env.example` :

```env
MONGODB_URI=mongodb+srv://VOTRE_USER:VOTRE_PASSWORD@cluster.mongodb.net/solutionEmbarquee
JWT_SECRET=votre_secret_jwt_long_et_aleatoire
IA_SERVICE_URL=http://localhost:8000
PORT=3001
```

Démarrer le backend :

```bash
npm run start:dev
```

Le backend sera accessible sur `http://localhost:3001/api`

### 3. Configurer le service IA Python

Dans un nouveau terminal :

```bash
cd ia-iot
pip install -r requirements.txt
python main.py
```

Le service IA sera accessible sur `http://localhost:8000`

### 4. Configurer le frontend React

Dans un nouveau terminal :

```bash
cd frontend-iot
npm install
npm start
```

Le frontend sera accessible sur `http://localhost:3000`

### 5. Comptes de démonstration

Le backend initialise automatiquement des comptes de test au premier démarrage :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | `admin@SE-iot.com` | `admin123` |
| Responsable Maintenance | `resp@SE-iot.com` | `resp123` |
| Opérateur | `oper1@SE-iot.com` | `oper123` |

---

## 📸 Captures d'écran

> 📁 Les captures sont disponibles dans le dossier [`docs/screenshots/`](docs/screenshots/)

### Tableau de bord
Vue principale avec capteurs en temps réel, actionneurs commandables et alertes récentes.

### Analyse IA — Maintenance prédictive
Vue maître/détail affichant pour chaque machine :
- Niveau de risque prédit (Normal / Attention / Critique)
- Distribution Random Forest complète des 3 classes
- Causes détectées avec valeurs réelles et pourcentages d'écart
- Actions recommandées dynamiques

### Historique des capteurs
- Graphiques en barres adoucis (opacité variable selon le statut)
- Statistiques Min / Moyenne / Max
- Journal des événements avec filtrage par période
- Export CSV

### Configuration des seuils
Interface de paramétrage des plages de fonctionnement nominal par capteur et par machine.

### Gestion des alertes
Liste des alertes actives avec résolution traçable, niveau de gravité et indication du seuil franchi.

---

## 🔬 Module IA — Détails techniques

### Entraînement du modèle

Le modèle Random Forest a été entraîné sur le dataset **Smart Manufacturing IoT-Cloud** de Kaggle (100 000 échantillons industriels) via Google Colab.

**Caractéristiques du modèle :**
- **Algorithme** : Random Forest Classifier
- **Nombre d'arbres** : 300
- **Profondeur maximale** : 25
- **Équilibrage des classes** : `balanced`
- **Accuracy** : **95.91%** sur le set de test (80/20)

**Features utilisées (10 au total) :**
- 4 valeurs brutes : température, vibration, pression, courant
- 4 ratios normalisés : valeur / médiane du dataset
- `downtime_risk` : risque d'arrêt calculé
- `maintenance_required` : maintenance nécessaire (binaire)

### Approche machine-agnostique

Les features utilisent des **ratios normalisés** (valeur / médiane) plutôt que des valeurs brutes, ce qui permet à un **seul modèle** de gérer toutes les machines du parc, peu importe leurs caractéristiques individuelles.

### Transparence de la confiance

Le système affiche la **distribution probabiliste complète** retournée par `predict_proba()`, c'est-à-dire la proportion des 300 arbres votant pour chaque classe. Cette transparence permet à l'utilisateur de comprendre si le modèle est confiant ou s'il hésite entre deux classes.

### Approche hybride ML + règles métier

Inspirée des systèmes industriels professionnels (Siemens MindSphere, GE Predix, IBM Maximo) :
- Le **ML** détermine le niveau de risque global
- Un **moteur de règles métier** génère les causes détectées et les actions recommandées en se basant sur les écarts réels entre valeurs mesurées et seuils configurés

---

## 🎓 Contexte académique

Ce projet est réalisé dans le cadre du **Projet de Fin d'Études (PFE)** du Master Co-Construit en Développement des Services IoT — Informatique.

| Information | Détail |
|---|---|
| **Établissement** | ISET Mahdia |
| **Formation** | Master Co-Construit en Développement des Services IoT — Informatique |
| **Année académique** | 2025-2026 |
| **Encadrant** | Mr Mounir Abida |
| **Soutenance prévue** | Fin Juin 2026 |
| **Intitulé du PFE** | Conception et prototypage d'une solution embarquée IoT pour la commande d'actionneurs industriels |

---

## 🗺️ Roadmap

### Phase 1 — Développement logiciel ✅
- [x] Backend NestJS complet
- [x] Frontend React avec toutes les pages
- [x] Microservice IA Python
- [x] Mode Auto/Manuel + Arrêt d'urgence (ISO 13850)
- [x] Audit trail des événements (ISO 13374)
- [x] Recommandations dynamiques ML + règles métier
- [x] Historique avec graphiques et journal

### Phase 2 — Hardware ESP32 🔜
- [ ] Firmware ESP32 avec lecture des vrais capteurs
- [ ] DHT22 (température)
- [ ] ACS712 (courant)
- [ ] SW-420 (vibration)
- [ ] FSR402 (pression)
- [ ] Commande physique : LED rouge, LED verte, buzzer, servomoteur
- [ ] Communication Wi-Fi avec le backend
- [ ] Synchronisation mode auto/manuel avec l'ESP32

### Phase 3 — Améliorations futures
- [ ] Notifications par email pour les alertes critiques
- [ ] Déploiement en ligne (Vercel + Railway)
- [ ] Application mobile companion
- [ ] Support multi-langues (FR/EN/AR)

---

## 📜 Licence

Ce projet est développé dans un cadre académique. Tous les droits sont réservés à l'auteur et à l'ISET Mahdia.

---

## 👤 Auteur

**Konwend-Sida Boris Tougma**

- 📧 Email : kboristougma7@gmail.com
- 🔗 GitHub : [@TougmaKBoris](https://github.com/TougmaKBoris)

---

<div align="center">

**Projet réalisé avec ❤️ à l'ISET Mahdia — 2026**

[⬆ Retour en haut](#-solution-embarquée-iot)

</div>
