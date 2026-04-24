# CLAUDE.md — Solution Embarquée IoT (PFE ISET Mahdia)

## Architecture globale

```
backend-iot/    NestJS + MongoDB         port 3001
frontend-iot/   React 18 + TypeScript    port 3000
ia-service/     Python FastAPI           port 8000
```

## Lancer le projet

```bash
# Backend
cd backend-iot && npm run start:dev

# Frontend
cd frontend-iot && npm start

# IA
cd ia-service && uvicorn main:app --reload --port 8000
```

## Stack technique

- **Backend** : NestJS, Mongoose/MongoDB, JWT, Nodemailer, @nestjs/schedule, Socket.IO, MQTT
- **Frontend** : React 18, TypeScript, Axios, Recharts, Lucide-React, socket.io-client
- **IA** : FastAPI, scikit-learn (Random Forest), joblib
- **Auth** : JWT Bearer, 3 rôles : `admin`, `responsable_maintenance`, `operateur`
- **Temps réel** : Socket.IO (frontend ↔ backend) + MQTT (capteurs physiques → backend)

## Modules backend (`backend-iot/src/`)

| Module | Rôle |
|--------|------|
| `utilisateurs/` | CRUD users + login JWT |
| `machines/` | CRUD machines + protection seed |
| `capteurs/` | Simulation cron 10s (machines `source: simulation`) + live data + alertes |
| `actionneurs/` | Toggle ON/OFF actionneurs + publish MQTT pour machines réelles |
| `seuils/` | Seuils min/max par capteur par machine |
| `alertes/` | Détection bidirectionnelle + emails critiques |
| `ia/` | Proxy vers FastAPI + analyse tendances |
| `emails/` | Nodemailer/Gmail pour alertes critiques |
| `affectations/` | Lien opérateur ↔ machine |
| `common/initialisation/` | Seed machines A/B/C au démarrage |
| `temps-reel/` | Gateway Socket.IO — push temps réel vers le frontend |
| `mqtt/` | Client MQTT — collecte données capteurs physiques |

## Types de capteurs

| Type | Valeurs | Simulation |
|------|---------|-----------|
| `numerique` | Float [min, max] | Random dans plage ±10% |
| `binaire` | 0 ou 1 | 80% chance = 1 |
| `compteur` | Entier incrémental | +0 à +5 par tick, plafonné à max |

Les 4 types prédéfinis : `temperature`, `courant`, `vibration`, `pression`.
Les capteurs custom sont créés via la page Machines avec `capteursConfig[]`.

## Entités importantes

- `seuil.entity.ts` — `valeur_min`, `valeur_max`, `unite`, `type_donnee`
- `capteur-data.entity.ts` — `type: string` (pas d'enum)
- `actionneur.entity.ts` — `type: string` (pas d'enum)
- `machine-supprimee.schema.ts` — blacklist pour éviter recréation au restart

## Validation NestJS

`main.ts` active `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`.
Tout DTO avec des champs imbriqués doit utiliser `@ValidateNested` + `@Type(() => ClassDto)`.

## Analyse IA

- **Random Forest** : classifie `normal` / `pre_panne` / `panne_active`
- **Tendances** : régression linéaire sur 20 dernières valeurs → pente (unités/minute) → temps estimé avant seuil
- Alerte précoce si < 120 minutes avant franchissement du seuil max

## Protection des machines seed

`InitialisationService` vérifie `MachineSupprimee` avant de recréer Machine A/B/C.
`MachinesService.remove()` insère dans `MachineSupprimee` si suppression réussie.

## Frontend — pages clés

| Page | Chemin |
|------|--------|
| Dashboard | `pages/Dashboard.tsx` |
| Machines | `pages/Machines.tsx` — formulaire capteurs custom |
| Analyse IA | `pages/AnalyseIA.tsx` — prédiction + tendances |
| Historique | `pages/Historique.tsx` |
| Alertes | `pages/Alertes.tsx` |

## Variables d'environnement backend (`.env`)

```
MONGODB_URI=mongodb://localhost:27017/iot-industriel
JWT_SECRET=...
GMAIL_USER=...
GMAIL_APP_PASSWORD=...
ALERT_EMAIL_DEST=...
```

## Conventions

- Labels français partout (UI et logs)
- Pas de commentaires évidents dans le code
- `compteursEtat: Map<string, number>` en mémoire pour les capteurs compteur
- `liveData: Map<string, any[]>` pour les données temps réel, avec fallback DB si vide
