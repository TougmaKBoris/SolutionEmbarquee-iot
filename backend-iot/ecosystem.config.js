const BASE = 'C:\\Users\\BORIS\\Desktop\\Projet de Développement Industrielle';

module.exports = {
  apps: [
    {
      name: 'se-iot-backend',
      cwd: BASE + '\\backend-iot',
      script: 'dist/main.js',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        MQTT_BROKER_URL: 'mqtt://localhost:1883',
        CORS_ORIGIN: 'http://192.168.137.1:3000,http://localhost:3000',
      },
    },
    {
      name: 'se-iot-ia',
      cwd: BASE + '\\ia-iot',
      script: BASE + '\\ia-iot\\venv\\Scripts\\uvicorn.exe',
      args: 'main:app --host 0.0.0.0 --port 8000',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        PYTHONUTF8: '1',
      },
    },
    {
      name: 'se-iot-frontend',
      cwd: BASE + '\\frontend-iot',
      script: 'C:\\Users\\BORIS\\AppData\\Roaming\\npm\\node_modules\\serve\\build\\main.js',
      args: '-s build -l 3000 --no-clipboard',
      autorestart: true,
      watch: false,
      max_memory_restart: '128M',
    },
  ],
};
