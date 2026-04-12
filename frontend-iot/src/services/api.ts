import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur : ajoute automatiquement le token JWT à chaque requête
api.interceptors.request.use((config) => {
  const jeton = localStorage.getItem('jeton');
  if (jeton) {
    config.headers.Authorization = `Bearer ${jeton}`;
  }
  return config;
});

// Intercepteur : redirige vers /connexion si le token est expiré (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jeton');
      localStorage.removeItem('utilisateur');
      window.location.href = '/connexion';
    }
    return Promise.reject(error);
  }
);

export default api;
