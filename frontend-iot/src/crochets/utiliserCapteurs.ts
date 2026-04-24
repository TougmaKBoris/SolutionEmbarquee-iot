import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getSocket, rejoindreMachine, quitterMachine } from '../services/socket';
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
  }, [charger]);

  // Socket.IO : ecouter les mises a jour en temps reel
  useEffect(() => {
    if (!machineId) return;

    const socket = getSocket();
    rejoindreMachine(machineId);

    const handler = (data: { machine_id: string; capteurs: CapteurLive[] }) => {
      if (data.machine_id === machineId) {
        setCapteurs(data.capteurs);
        setChargement(false);
      }
    };

    socket.on('capteurs:update', handler);

    return () => {
      socket.off('capteurs:update', handler);
      quitterMachine(machineId);
    };
  }, [machineId]);

  return { capteurs, chargement, rafraichir: charger };
}
