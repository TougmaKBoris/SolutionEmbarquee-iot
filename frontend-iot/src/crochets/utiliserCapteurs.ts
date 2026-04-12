import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { CapteurLive } from '../types';

export default function utiliserCapteurs(machineId: string | null) {
  const [capteurs, setCapteurs] = useState<CapteurLive[]>([]);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    if (!machineId) return;
    try {
      const res = await api.get(`/capteurs/live/${machineId}`);
      setCapteurs(res.data.capteurs || []);
    } catch (err) {
      console.error('Erreur capteurs live:', err);
    } finally {
      setChargement(false);
    }
  }, [machineId]);

  useEffect(() => {
    charger();
    const intervalle = setInterval(charger, 5000); // Rafraîchir toutes les 5 secondes
    return () => clearInterval(intervalle);
  }, [charger]);

  return { capteurs, chargement, rafraichir: charger };
}
