# CLAUDE.md — Solution Embarquée IoT (PFE ISET Mahdia)

## Architecture globale

```
backend-iot/    NestJS 10 + MongoDB        port 3001
frontend-iot/   React 18 + TypeScript      port 3000
ia-service/     Python FastAPI             port 8000
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

- **Backend** : NestJS 10, Mongoose 8, JWT + Passport, Nodemailer 8, @nestjs/schedule, Socket.IO, MQTT 5, Helmet, ThrottlerModule
- **Frontend** : React 18, TypeScript, Axios 1.6, Recharts 2.10, Lucide-React, socket.io-client 4.8, react-hot-toast
- **IA** : FastAPI, scikit-learn (Random Forest), joblib, numpy, pydantic
- **Auth** : JWT Bearer, 3 rôles : `admin`, `responsable_maintenance`, `operateur`
- **Temps réel** : Socket.IO (frontend ↔ backend) + MQTT (capteurs physiques → backend)
- **Sécurité** : Helmet, CORS, rate limiting (10 req/60s), bcrypt 10 rounds, whitelist validation

---

## Variables d'environnement backend (`.env`)

```
MONGODB_URI=mongodb://localhost:27017/iot-industriel
JWT_SECRET=...
PORT=3001
CORS_ORIGIN=http://localhost:3000
IA_SERVICE_URL=http://localhost:8000

# Email
EMAIL_ENABLED=true
EMAIL_SENDER=kboristougma22@gmail.com
EMAIL_SENDER_PASSWORD=...
EMAIL_RECIPIENTS=dest@gmail.com
EMAIL_SENDER_NAME=Solution Embarquee IoT

# MQTT (optionnel, machines physiques)
MQTT_BROKER_URL=mqtt://broker.example.com:1883
```

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
| `compteur`  | Entier incrémental +0 à +5/tick, plafonné à max. État en mémoire : `compteursEtat: Map<string, number>` |

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

**Topics publiés** :
- `actionneurs/{machineCode}/{typeActionneur}` → payload `{ "etat": boolean }`

**Reconnexion** : période 5s, timeout 10s, QoS 1.

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

## IA Service Python (`ia-service/main.py`)

### Modèle
- Random Forest pré-entraîné (`random_forest_model.pkl`)
- Médians de référence (`medians.pkl`), noms des features (`features_list.pkl`)

### Classes
| Classe | Label | Signification |
|--------|-------|---------------|
| 0 | `normal` | Fonctionnement nominal |
| 1 | `pre_panne` | Anomalie détectée, surveillance renforcée |
| 2 | `panne_active` | Panne active, intervention immédiate |

### 10 features du modèle
`temperature`, `vibration`, `pression`, `energie`, `ratio_temp`, `ratio_vib`, `ratio_pres`, `ratio_ener`, `downtime_risk`, `maintenance_required`

### Endpoints
- `GET /health` → vérification état
- `POST /predict` → prédiction simple
- `POST /analyse` → analyse complète avec causes + actions dynamiques

### Réponse `/analyse`
```json
{
  "classe": 0|1|2,
  "label": "normal|pre_panne|panne_active",
  "confiance": 0.0-1.0,
  "distribution": { "normal": %, "attention": %, "critique": % },
  "niveau": "normal|attention|critique",
  "message": "texte",
  "causes": [{ "capteur", "type", "valeur", "seuil_min", "seuil_max", "unite", "ecart_pct", "description" }],
  "actions": ["action 1", "action 2"],
  "valeurs": { "temperature", "courant", "vibration", "pression" }
}
```

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
| `services/api.ts` | Axios base URL `http://localhost:3001/api` + intercepteur JWT + redirect 401 |
| `services/socket.ts` | Socket.IO client, re-join rooms après reconnexion |
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

---

## Validation NestJS

`main.ts` active `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`.
Tout DTO avec champs imbriqués doit utiliser `@ValidateNested` + `@Type(() => ClassDto)`.

---

## Protection des machines seed

`InitialisationService` vérifie `MachineSupprimee` avant de recréer Machine A/B/C.
`MachinesService.remove()` insère dans `MachineSupprimee` si la suppression réussit.
`MachinesService.redemarrer()` résout toutes les alertes non résolues de la machine (reset email).

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
- `compteursEtat: Map<string, number>` en mémoire pour les capteurs compteur
- `liveData: Map<string, any[]>` pour les données temps réel, avec fallback DB si vide
- Swagger disponible sur `http://localhost:3001/api/docs`
- Les mots de passe ne sont jamais retournés dans les réponses API
