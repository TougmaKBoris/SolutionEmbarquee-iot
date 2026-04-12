# Solution Embarquée IoT — Backend NestJS

## Prérequis
- Node.js >= 18
- npm >= 9
- Un cluster MongoDB Atlas (ClusterIoT)

## Installation

```bash
cd backend-iot
npm install
```

## Configuration

Modifier le fichier `.env` avec vos identifiants MongoDB Atlas :

```
MONGODB_URI=mongodb+srv://VOTRE_USER:VOTRE_MDP@clusteriot.XXXXX.mongodb.net/solution-embarquee?retryWrites=true&w=majority
JWT_SECRET=solution_embarquee_secret_2026
PORT=3001
```

## Lancement

```bash
npm run start:dev
```

## Comptes de test (créés automatiquement au 1er lancement)

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@industriwatch.tn | admin123 | admin |
| karim@industriwatch.tn | maint123 | responsable_maintenance |
| sana@industriwatch.tn | op123 | operateur (Machine A) |
| mohamed@industriwatch.tn | op123 | operateur (non affecté) |

## Routes API

POST /api/auth/login

GET/POST /api/machines — GET/:id — PUT/:id — DELETE/:id
GET /api/capteurs/live — GET/live/:machineId — GET/historique/:machineId — GET/historique/:machineId/:type
GET /api/actionneurs/:machineId — POST/:machineId/commande
GET/POST /api/utilisateurs — DELETE/:id
GET/POST /api/affectations — DELETE/:id — GET/ma-machine
GET /api/alertes?machineId= — GET/non-resolues — PATCH/:id/resoudre
GET /api/seuils/:machineId — PUT/:machineId/:typeCapteur
GET /api/ia/analyse — GET/historique-pannes — GET/predictions
