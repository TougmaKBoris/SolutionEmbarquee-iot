# CLAUDE.md — Solution Embarquée IoT (PFE ISET Mahdia)

## Architecture globale

```
backend-iot/    NestJS 10 + MongoDB        port 3001
frontend-iot/   React 18 + TypeScript      port 3000
ia-iot/         Python FastAPI             port 8000
```

## Lancer le projet

```bash
# Backend
cd backend-iot && npm run start:dev

# Frontend
cd frontend-iot && npm start

# IA
cd ia-iot && uvicorn main:app --reload --port 8000
```

## Protocoles par couche

MQTT n'est **pas** utilisé à tous les niveaux — chaque couche a son protocole :

| Couche | Protocole | Justification |
|--------|-----------|---------------|
| Capteur physique (ESP32) → Broker → Backend | **MQTT** (port 1883) | Léger, adapté microcontrôleurs, faible bande passante |
| Backend → Frontend (données temps réel) | **Socket.IO** (WebSocket, port 3001) | Push bidirectionnel, rooms par machine |
| Frontend → Backend (API) | **HTTP/REST** (port 3001/api) | Requêtes CRUD classiques (login, machines, alertes…) |
| Backend → Service IA | **HTTP** (port 8000) | Appel ponctuel fetch vers FastAPI, pas besoin de temps réel |

```
ESP32  --MQTT-->  Broker  --MQTT-->  Backend NestJS  <--HTTP-->  Service IA Python
                                          |
                              Socket.IO / HTTP/REST
                                          |
                                   Frontend React
```

---

## Lancer les tests backend

```bash
cd backend-iot && npm test
# ou un seul fichier :
npx jest src/machines/machines.controller.spec.ts --no-coverage
```

---

## Stack technique

- **Backend** : NestJS 10, Mongoose 8, JWT + Passport, Nodemailer 8, @nestjs/schedule, Socket.IO, MQTT 5, Helmet, ThrottlerModule
- **Frontend** : React 18, TypeScript, Axios 1.6, Recharts 2.10, Lucide-React, socket.io-client 4.8, react-hot-toast
- **IA** : FastAPI, scikit-learn (Random Forest), joblib, numpy, pydantic
- **Auth** : JWT Bearer, 3 rôles : `admin`, `responsable_maintenance`, `operateur`
- **Temps réel** : Socket.IO (frontend ↔ backend) + MQTT (capteurs physiques → backend)
- **Sécurité** : Helmet, CORS, rate limiting (10 req/60s sur `/auth/login` uniquement), bcrypt 10 rounds, whitelist validation
- **Tests** : Jest 30 + ts-jest, config dans `package.json`

---

## Variables d'environnement backend (`.env`)

```
MONGODB_URI=mongodb://localhost:27017/iot-industriel
JWT_SECRET=<secret_aleatoire_64_chars>
PORT=3001
NODE_ENV=development          # mettre 'production' en prod (désactive Swagger)
CORS_ORIGIN=http://localhost:3000

IA_SERVICE_URL=http://localhost:8000

# Email
EMAIL_ENABLED=true
EMAIL_SENDER=kboristougma22@gmail.com
EMAIL_SENDER_PASSWORD=<app_password_gmail>
EMAIL_RECIPIENTS=dest@gmail.com
EMAIL_SENDER_NAME=Solution Embarquee IoT

# MQTT (optionnel — si absent, le service MQTT se désactive silencieusement)
MQTT_BROKER_URL=mqtt://broker.example.com:1883
```

## Variables d'environnement frontend (`.env` ou `.env.production`)

```
# Voir frontend-iot/.env.example
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SOCKET_URL=http://localhost:3001
```

---

## Configuration Jest / TypeScript (backend)

- `ts-jest` installé en devDependency
- Config Jest dans `backend-iot/package.json` → section `"jest"` avec transform ts-jest
- `tsconfig.json` : inclut les fichiers `*.spec.ts`, ajoute `"types": ["jest"]`
- `tsconfig.build.json` : étend tsconfig.json, exclut les spec (utilisé par `nest build`)
- `nest-cli.json` : `"tsConfigPath": "tsconfig.build.json"` pour que le build de prod ignore les tests

---

## Modules backend (`backend-iot/src/`)

| Module | Fichiers clés | Rôle |
|--------|--------------|------|
| `auth/` | `auth.service.ts`, `auth.controller.ts`, `strategies/jwt.strategy.ts` | Login → JWT. Payload : `{ sub, email, role, nom }` |
| `utilisateurs/` | `utilisateurs.service.ts`, `entities/utilisateur.entity.ts` | CRUD users, bcrypt, ne supprime pas les admins |
| `machines/` | `machines.service.ts`, `machines.controller.ts` | CRUD + seed A/B/C + changerMode + arretUrgence + redemarrer |
| `capteurs/` | `capteurs.service.ts`, `entities/capteur-data.entity.ts` | Simulation cron 10s + live data + vérification seuils + alertes |
| `actionneurs/` | `actionneurs.service.ts`, `entities/actionneur.entity.ts` | Toggle ON/OFF + publish MQTT pour machines réelles |
| `seuils/` | `seuils.service.ts`, `entities/seuil.entity.ts` | Seuils min/max + type_donnee par capteur par machine |
| `alertes/` | `alertes.service.ts`, `entities/alerte.entity.ts` | CRUD alertes + résolution + suppression auto des alertes résolues (>1h) |
| `emails/` | `emails.service.ts` | Nodemailer/Gmail — alertes critiques uniquement |
| `ia/` | `ia.service.ts` | Proxy FastAPI + analyse tendances régression linéaire |
| `affectations/` | `affectations.service.ts` | Lien opérateur ↔ machine |
| `evenements/` | `evenements.service.ts` | Journal d'activité (arrêt urgence, redémarrage, mode, alertes) |
| `temps-reel/` | `temps-reel.gateway.ts` | Gateway Socket.IO — push temps réel vers le frontend |
| `mqtt/` | `mqtt.service.ts` | Client MQTT — collecte capteurs physiques + vérification seuils |
| `common/initialisation/` | `initialisation.service.ts`, `machine-supprimee.schema.ts` | Seed machines A/B/C au démarrage + blacklist suppression |

---

## Entités / Schémas MongoDB

### Machine
```typescript
nom: string          // requis
code: string         // unique, auto-généré "M-XXXX" si absent
capteurs: string[]   // types de capteurs
actionneurs: string[]
statut: 'en_ligne' | 'hors_ligne'   // default: 'en_ligne'
mode: 'auto' | 'manuel'             // default: 'auto'
etat: 'en_marche' | 'arretee'       // default: 'en_marche'
source: 'simulation' | 'mqtt'       // default: 'simulation'
```

### CapteurData
```typescript
machine_id: ObjectId   // ref Machine
type: string           // pas d'enum — temperature, courant, vibration, pression, ou custom
valeur: number
unite: string
timestamp: Date
```

### Alerte
```typescript
machine_id: ObjectId
type_capteur: string
valeur: number
seuil_depasse: number
niveau: 'attention' | 'critique' | 'ignoree'
message: string
resolue: boolean        // default: false
resolue_le: Date
email_envoye: boolean   // default: false — jamais ré-envoyé sur la même alerte
```

### Seuil
```typescript
machine_id: ObjectId
type_capteur: string
valeur_min: number
valeur_max: number
unite: string
type_donnee: 'numerique' | 'binaire' | 'compteur'   // default: 'numerique'
```

### Actionneur
```typescript
machine_id: ObjectId
type: string           // pas d'enum
etat: boolean
derniere_commande: Date
```

### Utilisateur
```typescript
email: string          // unique
mot_de_passe: string   // bcrypt, jamais retourné
nom: string
role: 'admin' | 'responsable_maintenance' | 'operateur'
```

### Affectation
```typescript
operateur_id: ObjectId   // ref Utilisateur
machine_id: ObjectId     // ref Machine
```

### Evenement
```typescript
type: 'arret_urgence' | 'redemarrage' | 'changement_mode' | 'alerte_resolue' | 'commande_actionneur'
machine_id: ObjectId
machine_nom: string
utilisateur_id: string
utilisateur_nom: string
utilisateur_role: string
description: string
metadata: Record<string, any>
```

### MachineSupprimee
```typescript
nom: string   // blacklist — empêche la recréation des seeds A/B/C
```

---

## Logique capteurs et simulation

### Types de données capteur

| type_donnee | Comportement simulation |
|-------------|------------------------|
| `numerique` | Float aléatoire dans [min - 10%, max + 10%] |
| `binaire`   | 0 ou 1, 80% chance = 1 |
| `compteur`  | Entier incrémental +0 à +5/tick, plafonné à max. Clé mémoire : `${machineId}-${type}` (isolé par machine) |

### Types prédéfinis (seuils créés automatiquement à la création de machine)

| Type | Min | Max | Unité |
|------|-----|-----|-------|
| `temperature` | 70 | 88 | °C |
| `courant`     | 4.5 | 5.5 | A |
| `vibration`   | 0.8 | 1.1 | g |
| `pression`    | 4.0 | 5.0 | bar |

Les capteurs custom sont créés via `capteursConfig[]` dans le DTO de création de machine.

### Live data
`liveData: Map<string, any[]>` en mémoire dans `CapteursService`. Fallback sur DB si la map est vide (restart backend, nouvelle machine).

---

## Logique alertes et emails

### Détection bidirectionnelle
- `valeur < valeur_min` → alerte (sous seuil minimum)
- `valeur > valeur_max` → alerte (au-dessus seuil maximum)
- Valeur dans [min, max] → aucune alerte

### Niveau selon écart
- Écart ≤ 15% → `attention`
- Écart > 15% → `critique`

### Déduplication
`findOne({ machine_id, type_capteur, resolue: false })` — une seule alerte active par couple machine+capteur.

### Email
- Envoyé uniquement pour les alertes `critique`
- Envoyé à la création d'une nouvelle alerte critique
- Envoyé aussi en cas d'escalade `attention` → `critique` (si `email_envoye: false`)
- `email_envoye: true` sur la même alerte = plus d'email sur cette alerte
- **Au redémarrage de machine** : toutes les alertes non résolues passent à `resolue: true` → le système repart à zéro, le prochain dépassement peut renvoyer un email

### Suppression automatique
Cron chaque minute : supprime les alertes `resolue: true` de plus d'1h.

---

## MQTT

**Topics abonnés** :
- `capteurs/{machineId}/{typeCapteur}` → payload `{ "valeur": number, "unite": string }`
- `actionneurs/{machineId}/{typeActionneur}/status` → payload `{ "etat": boolean }`
- `machines/{machineCode}/etat/status` → payload `{ "etat": string }` (feedback ESP32)

**Topics publiés** :
- `actionneurs/{machineCode}/{typeActionneur}` → payload `{ "etat": boolean }`
- `machines/{machineCode}/etat` → payload `{ "etat": string }` (commande arrêt/marche)

**Reconnexion** : période 5s, timeout 10s, QoS 1.
**Si `MQTT_BROKER_URL` absent** : service MQTT désactivé silencieusement, simulation continue normalement.

---

## Socket.IO (temps-reel.gateway.ts)

### Client → Serveur
| Événement | Payload | Effet |
|-----------|---------|-------|
| `joinMachine` | `machineId: string` | Rejoint le room `machine:{id}` |
| `leaveMachine` | `machineId: string` | Quitte le room |

### Serveur → Client
| Événement | Payload |
|-----------|---------|
| `capteurs:update` | `{ machine_id, capteurs: [{ type, valeur, unite, timestamp, type_donnee }] }` |
| `actionneur:update` | `{ machine_id, type, etat }` |
| `alerte:nouvelle` | Document alerte complet |
| `alerte:resolue` | Document alerte complet |
| `machine:etatChange` | `{ machine_id, mode, etat, statut }` |

**Méthodes** : `emitToMachine(machineId, event, data)` / `emitToAll(event, data)`

---

## IA Service Python (`ia-iot/main.py`)

### Modèle
- Random Forest pré-entraîné (`random_forest_model.pkl`)
- Médians de référence (`medians.pkl`) — clés : `temperature`, `vibration`, `pressure`, `energy_consumption`
- Noms des features (`features_list.pkl`) — 10 features dans l'ordre exact ci-dessous

### Classes
| Classe | Label | Signification |
|--------|-------|---------------|
| 0 | `normal` | Fonctionnement nominal |
| 1 | `pre_panne` | Anomalie détectée, surveillance renforcée |
| 2 | `panne_active` | Panne active, intervention immédiate |

### 10 features du modèle (ordre strict dans le vecteur numpy)
`temperature`, `vibration`, `pressure`, `energy_consumption`, `ratio_temperature`, `ratio_vibration`, `ratio_pression`, `ratio_energie`, `downtime_risk`, `maintenance_required`

> Note : le backend envoie le champ `energie` (valeur du capteur `courant` mappé). Le modèle utilise `energy_consumption` dans les pkl mais reçoit `energie` via Pydantic.

### Endpoints
- `GET /health` → vérification état
- `POST /predict` → prédiction simple (retourne `ReponseAnalyse` à plat)
- `POST /analyse` → analyse complète (retourne structure imbriquée ci-dessous)

### Réponse `/analyse` (structure réelle retournée au backend)
```json
{
  "prediction": {
    "classe": 0,
    "label": "normal",
    "confiance": 0.95,
    "distribution": { "normal": 0.95, "attention": 0.03, "critique": 0.02 }
  },
  "diagnostic": {
    "niveau": "normal",
    "message": "Fonctionnement nominal."
  },
  "causes": [{ "capteur", "type", "valeur", "seuil_min", "seuil_max", "unite", "ecart_pct", "description" }],
  "actions": ["action 1", "action 2"],
  "valeurs": { "temperature", "courant", "vibration", "pression" }
}
```

Le backend (`ia.service.ts`) spread cette réponse avec `{ machine_id, machine_nom, ...prediction }`.
Le frontend accède à `analyse.diagnostic?.niveau` et `analyse.prediction?.distribution`.

### Tendances (backend `ia.service.ts`)
Régression linéaire sur les 20 dernières valeurs → pente (unités/minute) → temps estimé avant franchissement seuil. Alerte précoce si < 120 minutes.

---

## Frontend — routes et pages

| Route | Page | Rôles autorisés |
|-------|------|----------------|
| `/connexion` | Login | public |
| `/tableau-de-bord` | Dashboard | tous |
| `/machines` | Gestion machines | admin |
| `/utilisateurs` | Gestion utilisateurs | admin |
| `/affectations` | Affectations opérateurs | admin, responsable_maintenance |
| `/alertes` | Liste des alertes | tous |
| `/historique` | Journal d'événements | admin, responsable_maintenance |
| `/seuils` | Configuration seuils | admin |
| `/analyse-ia` | Analyse IA + tendances | admin, responsable_maintenance |

### Services frontend

| Fichier | Rôle |
|---------|------|
| `services/api.ts` | Axios — URL depuis `REACT_APP_API_URL` (fallback `localhost:3001/api`) + intercepteur JWT + redirect 401 |
| `services/socket.ts` | Socket.IO — URL depuis `REACT_APP_SOCKET_URL` (fallback `localhost:3001`) + re-join rooms après reconnexion |
| `contexte/ContexteAuthentification.tsx` | Auth context + localStorage, hook `utiliserAuth()` |

### Composants clés

| Composant | Chemin |
|-----------|--------|
| Dashboard | `pages/Dashboard.tsx` |
| Machines | `pages/Machines.tsx` — formulaire capteurs custom avec `capteursConfig[]` |
| Analyse IA | `pages/AnalyseIA.tsx` — prédiction + tendances toutes les 15s |
| Historique | `pages/Historique.tsx` |
| Alertes | `pages/Alertes.tsx` |
| Seuils | `pages/Seuils.tsx` |
| Utilisateurs | `pages/Utilisateurs.tsx` |
| Affectations | `pages/Affectations.tsx` |
| CarteCapteur | `components/capteurs/CarteCapteur.tsx` |
| CarteActionneurs | `components/actionneurs/CarteActionneurs.tsx` |
| PanneauIA | `components/ia/PanneauIA.tsx` |
| GraphiqueCapteur | `components/graphiques/GraphiqueCapteur.tsx` |
| BarreNavigation | `components/disposition/BarreNavigation.tsx` |
| Disposition | `components/disposition/Disposition.tsx` |

### Types TypeScript (`types/index.ts`)
`Utilisateur`, `Machine`, `CapteurData`, `CapteurLive`, `Actionneur`, `Alerte`, `Seuil`, `Affectation`, `AnalyseIA`

> Note : `Alerte.machine_id` et `Affectation.operateur_id/machine_id` sont typés `any` intentionnellement — MongoDB peut retourner un ObjectId string ou un objet populé selon le contexte.

---

## Validation NestJS

`main.ts` active `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`.
Tout DTO avec champs imbriqués doit utiliser `@ValidateNested` + `@Type(() => ClassDto)`.

---

## Protection des machines seed

`InitialisationService` vérifie `MachineSupprimee` avant de recréer Machine A/B/C.
`MachinesService.remove()` insère dans `MachineSupprimee` si la suppression réussit.
`MachinesService.redemarrer()` résout toutes les alertes non résolues de la machine (reset email).

**Comptes seed** (créés au démarrage si absents) :
| Email | Rôle |
|-------|------|
| `admin@SE-iot.com` | admin |
| `resp@SE-iot.com` | responsable_maintenance |
| `oper1@SE-iot.com` | operateur |
| `oper2@SE-iot.com` | operateur |

---

## Flux de données complet

```
Capteur physique (MQTT)  →  MqttService  →  CapteurData (DB)
Simulation (cron 10s)    →  CapteursService
         ↓
TempsReelGateway (Socket.IO)  →  Frontend (mise à jour temps réel)
         ↓
Vérification seuils  →  Alerte créée/mise à jour (DB)
         ↓ (si critique + nouvelle alerte ou escalade)
EmailsService  →  Gmail  →  Destinataire
```

---

## Déploiement en production

### Checklist
- [ ] `NODE_ENV=production` → Swagger désactivé automatiquement
- [ ] `CORS_ORIGIN=https://ton-domaine.tn` dans le `.env` backend
- [ ] `REACT_APP_API_URL` et `REACT_APP_SOCKET_URL` dans `frontend-iot/.env.production`
- [ ] `JWT_SECRET` : 64 caractères aléatoires minimum
- [ ] `.env` bien absent du dépôt git (vérifié dans `.gitignore`)
- [ ] `npm run build` dans `frontend-iot/` pour générer le dossier `build/`
- [ ] `npm run build && npm run start:prod` dans `backend-iot/`
- [ ] `uvicorn main:app --host 0.0.0.0 --port 8000` dans `ia-iot/`

### Build production
```bash
# Frontend (génère frontend-iot/build/)
cd frontend-iot && npm run build

# Backend
cd backend-iot && npm run build && npm run start:prod

# IA
cd ia-iot && uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## Collections MongoDB

| Collection | Description |
|------------|-------------|
| `machines` | Machines industrielles |
| `capteurdata` | Séries temporelles capteurs |
| `actionneurs` | Actionneurs par machine |
| `alertes` | Alertes avec suivi résolution et email |
| `seuils` | Seuils min/max par capteur par machine |
| `utilisateurs` | Comptes utilisateurs avec rôles |
| `affectations` | Liaison opérateur ↔ machine |
| `evenements` | Journal d'activité |
| `machinesupprimees` | Blacklist seeds supprimées |

---

## Conventions

- Labels français partout (UI, logs, messages d'erreur)
- Pas de commentaires évidents dans le code
- `compteursEtat: Map<string, number>` clé = `${machineId}-${type}` (isolé par machine, évite état partagé)
- `liveData: Map<string, any[]>` pour les données temps réel, avec fallback DB si vide
- Swagger disponible sur `http://localhost:3001/api/docs` (dev uniquement, désactivé en prod)
- Les mots de passe ne sont jamais retournés dans les réponses API
- Rate limiting (ThrottlerGuard) appliqué uniquement sur `POST /auth/login` — pas global
