import React, { useState, useEffect } from 'react';
import utiliserMachines from '../crochets/utiliserMachines';
import utiliserTailleEcran from '../crochets/utiliserTailleEcran';
import api from '../services/api';
import { Seuil } from '../types';
import { Save } from 'lucide-react';

const LABELS: Record<string, string> = { temperature: 'Température (°C)', courant: 'Courant (A)', vibration: 'Vibration (g)', pression: 'Pression (bar)' };
const COULEURS: Record<string, string> = { temperature: '#EF4444', courant: '#3B82F6', vibration: '#F59E0B', pression: '#10B981' };

export default function PageSeuils() {
  const { machines } = utiliserMachines();
  const isMobile = utiliserTailleEcran();
  const [machineId, setMachineId] = useState('');
  const [seuils, setSeuils] = useState<Seuil[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => { if (machines.length > 0 && !machineId) setMachineId(machines[0]._id); }, [machines]);
  useEffect(() => { if (machineId) api.get(`/seuils/${machineId}`).then(res => setSeuils(res.data)).catch(() => {}); }, [machineId]);

  const modifier = (i: number, champ: 'valeur_min' | 'valeur_max', val: string) => {
    const c = [...seuils]; c[i] = { ...c[i], [champ]: parseFloat(val) || 0 }; setSeuils(c);
  };

  const sauvegarder = async () => {
    try {
      for (const s of seuils) await api.put(`/seuils/${machineId}/${s.type_capteur}`, { valeur_min: s.valeur_min, valeur_max: s.valeur_max });
      setMessage('Seuils enregistres avec succes');
      setTimeout(() => setMessage(''), 3000);
    } catch { setMessage('Erreur lors de la sauvegarde'); }
  };

  return (
    <div style={{ maxWidth: 1200 }}>
      <div className="en-tete-page" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 22, fontWeight: 700 }}>Configuration des seuils</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Definir la plage de fonctionnement nominal par capteur</p>
        </div>
        <div className="en-tete-page-actions">
          <select value={machineId} onChange={e => setMachineId(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13 }}>
            {machines.map(m => <option key={m._id} value={m._id}>{m.nom}</option>)}
          </select>
        </div>
      </div>

  

      {message && (
        <div style={{ background: '#F0FDF4', color: '#16A34A', padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500, marginBottom: 16, border: '1px solid #BBF7D0' }}>{message}</div>
      )}

      <div className="grille-seuils">
        {seuils.map((s, i) => (
          <div key={s._id} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', borderTop: `3px solid ${COULEURS[s.type_capteur] || '#6366F1'}` }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, color: COULEURS[s.type_capteur] || '#0F172A' }}>{LABELS[s.type_capteur] || s.type_capteur}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#64748B', fontWeight: 500, marginBottom: 4 }}>Valeur minimale</label>
                <input type="number" step="0.1" value={s.valeur_min} onChange={e => modifier(i, 'valeur_min', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 13, background: '#F8FAFC' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#64748B', fontWeight: 500, marginBottom: 4 }}>Valeur maximale</label>
                <input type="number" step="0.1" value={s.valeur_max} onChange={e => modifier(i, 'valeur_max', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 13, background: '#F8FAFC' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={sauvegarder} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#4F46E5', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: 20 }}>
        <Save size={18} /> Enregistrer les seuils
      </button>
    </div>
  );
}