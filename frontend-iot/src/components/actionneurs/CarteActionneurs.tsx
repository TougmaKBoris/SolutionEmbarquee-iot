import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Actionneur } from '../../types';
import { Power, Lock } from 'lucide-react';

interface Props {
  machineId: string;
  mode?: string;
  etatMachine?: string;
}

const COULEURS: Record<string, string> = { led_rouge: '#EF4444', led_verte: '#22C55E', buzzer: '#F59E0B', servomoteur: '#6366F1' };
const LABELS: Record<string, string> = { led_rouge: 'LED rouge', led_verte: 'LED verte', buzzer: 'Buzzer', servomoteur: 'Servomoteur' };

export default function CarteActionneurs({ machineId, mode = 'auto', etatMachine = 'en_marche' }: Props) {
  const [actionneurs, setActionneurs] = useState<Actionneur[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);

  const desactive = mode === 'auto' || etatMachine === 'arretee';

  const charger = async () => {
    try {
      const res = await api.get(`/actionneurs/${machineId}`);
      setActionneurs(res.data);
    } catch (err) {
      console.error('Erreur actionneurs:', err);
    }
  };

  useEffect(() => { charger(); }, [machineId]);

  const toggle = async (type: string, etatActuel: boolean) => {
    if (desactive) return;
    try {
      await api.post(`/actionneurs/${machineId}/commande`, { type, etat: !etatActuel });
      setErreur(null);
      charger();
    } catch (err: any) {
      setErreur(err.response?.data?.message || 'Erreur de commande');
      setTimeout(() => setErreur(null), 4000);
    }
  };

  const messageEtat = etatMachine === 'arretee'
    ? 'Machine arretee — redemarrez-la pour reprendre les commandes'
    : mode === 'auto'
      ? 'Mode automatique — les actionneurs sont geres par le systeme'
      : null;

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: '#0F172A' }}>
          <Power size={18} /> Actionneurs
        </div>
        {desactive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: etatMachine === 'arretee' ? '#FEF2F2' : '#EEF2FF', borderRadius: 12 }}>
            <Lock size={11} color={etatMachine === 'arretee' ? '#DC2626' : '#4F46E5'} />
            <span style={{ fontSize: 10, fontWeight: 600, color: etatMachine === 'arretee' ? '#DC2626' : '#4F46E5' }}>
              {etatMachine === 'arretee' ? 'Verrouille' : 'Auto'}
            </span>
          </div>
        )}
      </div>

      <div style={{ opacity: desactive ? 0.55 : 1, transition: 'opacity 0.2s' }}>
        {actionneurs.map((a, i) => (
          <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < actionneurs.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: COULEURS[a.type] || '#999' }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{LABELS[a.type] || a.type}</span>
            </div>
            <button
              onClick={() => toggle(a.type, a.etat)}
              disabled={desactive}
              style={{
                width: 40,
                height: 22,
                borderRadius: 11,
                background: a.etat ? '#4F46E5' : '#E2E8F0',
                position: 'relative',
                border: 'none',
                cursor: desactive ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: a.etat ? 20 : 2, transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />
            </button>
          </div>
        ))}
      </div>

      {messageEtat && (
        <div style={{ marginTop: 12, padding: '8px 12px', background: '#FAF5FF', borderRadius: 8, fontSize: 11, color: '#6B21A8', fontStyle: 'italic' }}>
          {messageEtat}
        </div>
      )}

      {erreur && (
        <div style={{ marginTop: 10, padding: '8px 12px', background: '#FEF2F2', borderRadius: 8, fontSize: 12, color: '#DC2626' }}>
          {erreur}
        </div>
      )}
    </div>
  );
}