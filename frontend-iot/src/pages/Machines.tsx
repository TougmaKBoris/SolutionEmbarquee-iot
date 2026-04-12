import React, { useState } from 'react';
import utiliserMachines from '../crochets/utiliserMachines';
import api from '../services/api';
import { Plus, Trash2, Wifi, WifiOff, Cpu, Activity, AlertCircle } from 'lucide-react';

const CAPTEURS = ['temperature', 'courant', 'vibration', 'pression'];
const ACTIONNEURS_DISPO = ['led_rouge', 'led_verte', 'buzzer', 'servomoteur'];
const LABELS: Record<string, string> = { temperature: 'Température', courant: 'Courant', vibration: 'Vibration', pression: 'Pression', led_rouge: 'LED Rouge', led_verte: 'LED Verte', buzzer: 'Buzzer', servomoteur: 'Servomoteur' };

export default function Machines() {
  const { machines, rafraichir } = utiliserMachines();
  const [formulaire, setFormulaire] = useState(false);
  const [nom, setNom] = useState('');
  const [capteurs, setCapteurs] = useState<string[]>([]);
  const [actionneurs, setActionneurs] = useState<string[]>([]);
  const [confirmerSuppression, setConfirmerSuppression] = useState<string | null>(null);

  const toggle = (val: string, setter: Function) => setter((prev: string[]) => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);

  const creer = async () => {
    if (!nom.trim()) return;
    if (capteurs.length === 0) return alert('Sélectionnez au moins un capteur.');
    await api.post('/machines', { nom, capteurs, actionneurs });
    setNom(''); setCapteurs([]); setActionneurs([]); setFormulaire(false); rafraichir();
  };

  const supprimer = async () => {
    if (!confirmerSuppression) return;
    await api.delete(`/machines/${confirmerSuppression}`);
    setConfirmerSuppression(null);
    rafraichir();
  };

  const nomMachineASupprimer = machines.find(m => m._id === confirmerSuppression)?.nom || 'cette machine';

  const nbEnLigne = machines.filter(m => m.statut === 'en_ligne').length;
  const nbHorsLigne = machines.filter(m => m.statut === 'hors_ligne').length;

  const CheckboxGrp = ({ titre, icone, items, selected, onToggle }: any) => (
    <div style={{ marginTop: 16 }}>
      <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 10 }}>{icone} {titre}</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {items.map((item: string) => (
          <label key={item} onClick={() => onToggle(item)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: `1px solid ${selected.includes(item) ? '#4F46E5' : '#E2E8F0'}`, background: selected.includes(item) ? 'rgba(79,70,229,0.08)' : '#fff', cursor: 'pointer', fontSize: 14, color: selected.includes(item) ? '#4F46E5' : '#64748B', transition: 'all 0.2s', fontWeight: selected.includes(item) ? 500 : 400 }}>
            <input type="checkbox" checked={selected.includes(item)} readOnly style={{ accentColor: '#4F46E5', width: 16, height: 16 }} />
            {LABELS[item]}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Popup confirmation suppression */}
      {confirmerSuppression && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', maxWidth: 420, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={20} color="#DC2626" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A' }}>Supprimer cette machine ?</div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                  La machine <b style={{ color: '#DC2626' }}>{nomMachineASupprimer}</b> sera supprimée définitivement avec tous ses capteurs, actionneurs et données associées.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmerSuppression(null)}
                style={{ padding: '9px 20px', borderRadius: 8, background: '#F1F5F9', color: '#64748B', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={supprimer}
                style={{ padding: '9px 20px', borderRadius: 8, background: '#DC2626', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Gestion des machines</h1>
          <p style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>Configurer les machines industrielles du système</p>
        </div>
        <button onClick={() => setFormulaire(!formulaire)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#4F46E5', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          <Plus size={18} /> Nouvelle machine
        </button>
      </div>

      {/* Cartes compteurs machines */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', borderLeft: '4px solid #4F46E5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>Total machines</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#4F46E5', marginTop: 4 }}>{machines.length}</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={20} color="#4F46E5" />
            </div>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', borderLeft: '4px solid #16A34A' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>En ligne</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#16A34A', marginTop: 4 }}>{nbEnLigne}</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wifi size={20} color="#16A34A" />
            </div>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', borderLeft: '4px solid #DC2626' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>Hors ligne</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#DC2626', marginTop: 4 }}>{nbHorsLigne}</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WifiOff size={20} color="#DC2626" />
            </div>
          </div>
        </div>
      </div>

      {formulaire && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '2px solid #EEF2FF' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Ajouter une machine</h3>
          <input placeholder="Nom de la machine" value={nom} onChange={e => setNom(e.target.value)} />
          <CheckboxGrp titre="Capteurs" icone={<Cpu size={16} />} items={CAPTEURS} selected={capteurs} onToggle={(v: string) => toggle(v, setCapteurs)} />
          <CheckboxGrp titre="Actionneurs" icone={<Activity size={16} />} items={ACTIONNEURS_DISPO} selected={actionneurs} onToggle={(v: string) => toggle(v, setActionneurs)} />
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={creer} style={{ padding: '10px 20px', background: '#4F46E5', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Créer</button>
            <button onClick={() => setFormulaire(false)} style={{ padding: '10px 20px', background: '#F1F5F9', color: '#64748B', borderRadius: 8, fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer' }}>Annuler</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {machines.map(m => (
          <div key={m._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: m.statut === 'en_ligne' ? '#16A34A' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                {m.statut === 'en_ligne' ? <Wifi size={20} /> : <WifiOff size={20} />}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{m.nom}</div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{m.capteurs.map(c => LABELS[c] || c).join(', ')}</div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Activity size={12} /> {m.actionneurs.length > 0 ? m.actionneurs.map(a => LABELS[a] || a).join(', ') : 'Aucun actionneur'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: m.statut === 'en_ligne' ? '#F0FDF4' : '#F1F5F9', color: m.statut === 'en_ligne' ? '#16A34A' : '#94A3B8' }}>
                {m.statut === 'en_ligne' ? 'En ligne' : 'Hors ligne'}
              </span>
              <button onClick={() => setConfirmerSuppression(m._id)} title="Supprimer" style={{ padding: 8, borderRadius: 8, background: 'none', color: '#64748B', border: 'none', cursor: 'pointer' }}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}