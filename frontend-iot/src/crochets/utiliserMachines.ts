import { useState, useEffect } from 'react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { Machine } from '../types';

export default function utiliserMachines() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [chargement, setChargement] = useState(true);

  const charger = async () => {
    try {
      const res = await api.get('/machines');
      setMachines(res.data);
    } catch (err) {
      console.error('Erreur machines:', err);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  // Socket.IO : ecouter les changements d'etat des machines
  useEffect(() => {
    const socket = getSocket();

    const handler = (data: { machine_id: string; mode?: string; etat?: string; statut?: 'en_ligne' | 'hors_ligne' }) => {
      setMachines(prev => prev.map(m => {
        if (m._id !== data.machine_id) return m;
        return {
          ...m,
          ...(data.mode !== undefined && { mode: data.mode }),
          ...(data.etat !== undefined && { etat: data.etat }),
          ...(data.statut !== undefined && { statut: data.statut }),
        };
      }));
    };

    socket.on('machine:etatChange', handler);

    return () => {
      socket.off('machine:etatChange', handler);
    };
  }, []);

  return { machines, chargement, rafraichir: charger };
}
