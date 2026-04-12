import { useState, useEffect } from 'react';
import api from '../services/api';
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

  useEffect(() => { charger(); }, []);

  return { machines, chargement, rafraichir: charger };
}
