import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Alerte } from '../types';

export default function utiliserAlertes(machineId?: string) {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    try {
      const params = machineId ? `?machineId=${machineId}` : '';
      const res = await api.get(`/alertes/non-resolues${params}`);
      setAlertes(res.data);
    } catch (err) {
      console.error('Erreur alertes:', err);
    } finally {
      setChargement(false);
    }
  }, [machineId]);

  useEffect(() => {
    charger();
    const intervalle = setInterval(charger, 10000);
    return () => clearInterval(intervalle);
  }, [charger]);

  const resoudre = async (id: string) => {
    await api.patch(`/alertes/${id}/resoudre`);
    charger();
  };

  const ignorer = async (id: string) => {
    await api.patch(`/alertes/${id}/ignorer`);
    charger();
  };

  const supprimer = async (id: string) => {
    await api.delete(`/alertes/${id}`);
    charger();
  };

  return { alertes, chargement, resoudre, ignorer, supprimer, rafraichir: charger };
}