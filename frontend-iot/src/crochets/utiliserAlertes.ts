import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { Alerte } from '../types';
import toast from 'react-hot-toast';

export default function utiliserAlertes(machineId?: string | null) {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    // null = machineId pas encore résolu, on attend
    if (machineId === null) return;
    try {
      const params = machineId ? `?machineId=${machineId}` : '';
      const res = await api.get(`/alertes/non-resolues${params}`);
      setAlertes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Erreur alertes:', err);
    } finally {
      setChargement(false);
    }
  }, [machineId]);

  useEffect(() => {
    charger();
  }, [charger]);

  // Socket.IO : ecouter les nouvelles alertes et les alertes resolues
  useEffect(() => {
    const socket = getSocket();

    const handleNouvelle = (alerte: Alerte) => {
      const alerteMachineId = typeof alerte.machine_id === 'object'
        ? alerte.machine_id?._id
        : alerte.machine_id;

      // Afficher une notification pop-up
      toast.error(`ALERTE : ${alerte.message}`, {
        duration: 5000,
        icon: '⚠️',
      });

      if (machineId === undefined || alerteMachineId === machineId) {
        setAlertes(prev => {
          const existe = prev.some(a => a._id === alerte._id);
          if (existe) return prev;
          return [alerte, ...prev];
        });
      }
    };

    const handleResolue = (alerte: Alerte) => {
      setAlertes(prev => prev.filter(a => a._id !== alerte._id));
    };

    socket.on('alerte:nouvelle', handleNouvelle);
    socket.on('alerte:resolue', handleResolue);

    return () => {
      socket.off('alerte:nouvelle', handleNouvelle);
      socket.off('alerte:resolue', handleResolue);
    };
  }, [machineId]);

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