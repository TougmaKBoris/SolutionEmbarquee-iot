# DEPLOY-NOTES — Solution Embarquée IoT (PFE ISET Mahdia)
# Généré le 22/05/2026 — Hotspot TKB (192.168.137.1)

## IP du hotspot

| Réseau     | IP laptop (serveur) |
|------------|---------------------|
| Hotspot TKB | **192.168.137.1**  |
| SSID       | TKB                 |
| Mot de passe | 123456789         |

> L'IP 192.168.137.1 est fixe (standard Windows Mobile Hotspot). Elle ne change pas d'une session à l'autre.

---

## URLs pour la soutenance

| Service    | URL                                        | Accès           |
|------------|--------------------------------------------|-----------------|
| Frontend   | http://192.168.137.1:3000                  | Jury (navigateur) |
| Backend    | http://192.168.137.1:3001/api              | API REST        |
| Swagger    | http://192.168.137.1:3001/api/docs         | Démo technique  |
| IA         | http://192.168.137.1:8000                  | Interne backend |
| MQTT Broker | 192.168.137.1:1883 (sans http://)         | ESP32           |

---

## Comptes de test

| Email                | Mot de passe | Rôle                     |
|----------------------|-------------|--------------------------|
| admin@SE-iot.com     | admin123    | admin                    |
| resp@SE-iot.com      | resp123     | responsable_maintenance  |
| oper1@SE-iot.com     | oper123     | operateur (Sana)         |
| oper2@SE-iot.com     | oper123     | operateur (Mohamed)      |

---

## Procédure de démarrage le jour J

### 1. Vérifier le hotspot
- Ouvrir Paramètres Windows → Réseau → Point d'accès sans fil mobile → Activer
- Confirmer que l'IP est bien 192.168.137.1 : `ipconfig`

### 2. Démarrer les services
```powershell
# Si PM2 n'a pas chargé automatiquement les services au démarrage :
pm2 resurrect

# Vérifier l'état :
pm2 list
```

### 3. Démarrer Mosquitto (si pas automatique)
```powershell
# Vérifier si tourne :
netstat -ano | Select-String ":1883"

# Si absent, démarrer le service :
Start-Service mosquitto
# OU lancer manuellement :
& "C:\Program Files\mosquitto\mosquitto.exe" -c "C:\Program Files\mosquitto\mosquitto.conf"
```

### 4. Vérifier que tout répond
```powershell
# Backend
Invoke-RestMethod http://192.168.137.1:3001/api/auth/login -Method POST -ContentType "application/json" -Body '{"email":"admin@SE-iot.com","mot_de_passe":"admin123"}'

# IA
Invoke-RestMethod http://192.168.137.1:8000/health

# Frontend
Invoke-WebRequest http://192.168.137.1:3000 -UseBasicParsing
```

---

## ESP32 — Configuration MQTT

Dans le firmware Arduino, mettre :
```cpp
const char* mqtt_server = "192.168.137.1";
const int   mqtt_port   = 1883;
// Se connecter au Wi-Fi hotspot TKB / 123456789 AVANT de démarrer MQTT
```

---

## Commandes PM2 utiles

```powershell
pm2 list                          # État des services
pm2 logs se-iot-backend --lines 30  # Logs backend
pm2 logs se-iot-ia --lines 30       # Logs IA
pm2 logs se-iot-frontend --lines 30 # Logs frontend
pm2 restart all --update-env      # Redémarrer avec nouvelle config
pm2 save                          # Sauvegarder l'état
```

## En cas de problème

| Symptôme | Diagnostic | Solution |
|----------|-----------|---------|
| Service "errored" dans pm2 list | `pm2 logs <nom> --lines 50` | Corriger puis `pm2 restart <nom>` |
| Frontend inaccessible sur :3000 | Port bloqué ou serve crashed | `pm2 restart se-iot-frontend` |
| Backend 502 / timeout | NestJS crash ou MongoDB KO | `pm2 logs se-iot-backend` → vérifier MONGODB_URI |
| IA ne répond pas | uvicorn crash | `pm2 restart se-iot-ia` |
| ESP32 ne connecte pas MQTT | IP ou port wrong | Vérifier `mqtt_server` dans firmware + `netstat | Select-String 1883` |

---

## Vérification MQTT (optionnel — avec mosquitto_sub)

```powershell
# Écouter tous les topics MQTT depuis le laptop :
& "C:\Program Files\mosquitto\mosquitto_sub.exe" -h 192.168.137.1 -t "#" -v
```
