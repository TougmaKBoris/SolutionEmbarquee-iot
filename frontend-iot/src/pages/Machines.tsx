import React, { useState } from 'react';
import utiliserMachines from '../crochets/utiliserMachines';
import utiliserTailleEcran from '../crochets/utiliserTailleEcran';
import api from '../services/api';
import { Plus, Trash2, Wifi, WifiOff, Cpu, AlertCircle, Radio, X, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const CAPTEURS_DEFAUT = ['temperature', 'courant', 'vibration', 'pression'];
const ACTIONNEURS_DEFAUT = ['led_rouge', 'led_verte', 'buzzer', 'servomoteur'];
const LABELS: Record<string, string> = { temperature: 'Température', courant: 'Courant', vibration: 'Vibration', pression: 'Pression', led_rouge: 'LED Rouge', led_verte: 'LED Verte', buzzer: 'Buzzer', servomoteur: 'Servomoteur' };

interface CapteurCustom { type: string; unite: string; valeur_min: number; valeur_max: number; type_donnee: string; }

export default function Machines() {
  const { machines, rafraichir } = utiliserMachines();
  const [formulaire, setFormulaire] = useState(false);
  const [nom, setNom] = useState('');
  const [capteurs, setCapteurs] = useState<string[]>([]);
  const [actionneurs, setActionneurs] = useState<string[]>([]);
  const [capteursCustom, setCapteursCustom] = useState<CapteurCustom[]>([]);
  const [actionneurCustom, setActionneurCustom] = useState('');
  const [actionneurCustomListe, setActionneurCustomListe] = useState<string[]>([]);
  const [nvCapteur, setNvCapteur] = useState({ type: '', unite: '', valeur_min: '', valeur_max: '', type_donnee: 'numerique' });
  const [confirmerSuppression, setConfirmerSuppression] = useState<string | null>(null);
  const [source, setSource] = useState<'simulation' | 'mqtt'>('simulation');

  const toggle = (val: string, setter: Function) => setter((prev: string[]) => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);

  const ajouterCapteurCustom = () => {
    const { type, unite, valeur_min, valeur_max, type_donnee } = nvCapteur;
    if (!type.trim()) { toast.error('Donnez un nom au capteur.'); return; }
    if (CAPTEURS_DEFAUT.includes(type.toLowerCase())) { toast.error('Ce capteur existe déjà dans la liste standard.'); return; }
    const estBinaire = type_donnee === 'binaire';
    if (!estBinaire && (!valeur_min || !valeur_max)) { toast.error('Remplissez les valeurs min et max.'); return; }
    setCapteursCustom(prev => [...prev, {
      type: type.trim().toLowerCase(),
      unite: estBinaire ? '' : unite.trim(),
      valeur_min: estBinaire ? 0 : parseFloat(valeur_min),
      valeur_max: estBinaire ? 1 : parseFloat(valeur_max),
      type_donnee,
    }]);
    setNvCapteur({ type: '', unite: '', valeur_min: '', valeur_max: '', type_donnee: 'numerique' });
  };

  const ajouterActionneurCustom = () => {
    if (!actionneurCustom.trim()) return;
    if (ACTIONNEURS_DEFAUT.includes(actionneurCustom.toLowerCase())) { toast.error('Cet actionneur existe déjà dans la liste standard.'); return; }
    setActionneurCustomListe(prev => [...prev, actionneurCustom.trim().toLowerCase()]);
    setActionneurCustom('');
  };

  const creer = async () => {
    if (!nom.trim()) return;
    const tousLesCapteurs = [...capteurs, ...capteursCustom.map(c => c.type)];
    if (tousLesCapteurs.length === 0) {
      toast.error('Veuillez ajouter au moins un capteur.');
      return;
    }
    const tousLesActionneurs = [...actionneurs, ...actionneurCustomListe];
    try {
      await api.post('/machines', { nom, capteurs: tousLesCapteurs, actionneurs: tousLesActionneurs, capteursConfig: capteursCustom, source });
      toast.success('Machine créée avec succès !');
      setNom(''); setCapteurs([]); setActionneurs([]); setCapteursCustom([]); setActionneurCustomListe([]); setSource('simulation'); setFormulaire(false); rafraichir();
    } catch (err) {
      toast.error('Erreur lors de la création de la machine.');
    }
  };

  const supprimer = async () => {
    if (!confirmerSuppression) return;
    try {
      await api.delete(`/machines/${confirmerSuppression}`);
      toast.success('Machine supprimée.');
      setConfirmerSuppression(null);
      rafraichir();
    } catch (err) {
      toast.error('Erreur lors de la suppression.');
    }
  };

  const isMobile = utiliserTailleEcran();
  const nomMachineASupprimer = machines.find(m => m._id === confirmerSuppression)?.nom || 'cette machine';

  const nbEnLigne = machines.filter(m => m.statut === 'en_ligne').length;
  const nbHorsLigne = machines.filter(m => m.statut === 'hors_ligne').length;

  const CheckboxGrp = ({ titre, icone, items, selected, onToggle }: any) => (
    <div style={{ marginTop: 16 }}>
      <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 10 }}>{icone} {titre}</h4>
      <div className="grille-2col">
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

      <div className="en-tete-page">
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: '#0F172A', letterSpacing: -0.5 }}>Gestion des machines</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Configurer les machines industrielles du système</p>
        </div>
        <div className="en-tete-page-actions">
          <button onClick={() => setFormulaire(!formulaire)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#2563EB', color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
            <Plus size={18} /> Nouvelle machine
          </button>
        </div>
      </div>

      {/* Cartes compteurs machines */}
      <div className="grille-stats-3" style={{ marginBottom: 24 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px -1px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total machines</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#2563EB', marginTop: 6 }}>{machines.length}</div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: '10px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={22} color="#2563EB" />
            </div>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px -1px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>En ligne</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#10B981', marginTop: 6 }}>{nbEnLigne}</div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: '10px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wifi size={22} color="#10B981" />
            </div>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px -1px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Hors ligne</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#EF4444', marginTop: 6 }}>{nbHorsLigne}</div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: '10px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WifiOff size={22} color="#EF4444" />
            </div>
          </div>
        </div>
      </div>

      {formulaire && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Ajouter une machine</h3>
            <div style={{ marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 6, display: 'block' }}>Nom de la machine</label>
                <input placeholder="Ex: Machine de test" value={nom} onChange={e => setNom(e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>

            {/* Selecteur source */}
            <div style={{ marginTop: 20 }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}><Radio size={16} /> Source de données</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label onClick={() => setSource('simulation')}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderRadius: 8, border: '2px solid', borderColor: source === 'simulation' ? '#4F46E5' : '#E2E8F0', background: source === 'simulation' ? '#F1F5F9' : '#fff', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <input type="radio" checked={source === 'simulation'} readOnly style={{ accentColor: '#4F46E5' }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: source === 'simulation' ? '#4F46E5' : '#0F172A' }}>Simulation</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Données générées automatiquement</div>
                  </div>
                </label>
                <label onClick={() => setSource('mqtt')}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderRadius: 8, border: '2px solid', borderColor: source === 'mqtt' ? '#059669' : '#E2E8F0', background: source === 'mqtt' ? '#ecfdf5' : '#fff', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <input type="radio" checked={source === 'mqtt'} readOnly style={{ accentColor: '#059669' }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: source === 'mqtt' ? '#059669' : '#0F172A' }}>Capteurs réels (MQTT)</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Données reçues via broker MQTT</div>
                  </div>
                </label>
              </div>
            </div>

          <CheckboxGrp titre="Capteurs standard" icone={<Cpu size={16} />} items={CAPTEURS_DEFAUT} selected={capteurs} onToggle={(v: string) => toggle(v, setCapteurs)} />

          {/* Capteurs custom */}
          <div style={{ marginTop: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>+ Capteur personnalisé</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="grille-capteur-custom">
                <input placeholder="Nom (ex: presence, compteur_pieces)" value={nvCapteur.type} onChange={e => setNvCapteur(p => ({ ...p, type: e.target.value }))} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 13 }} />
                <select value={nvCapteur.type_donnee} onChange={e => setNvCapteur(p => ({ ...p, type_donnee: e.target.value }))}
                  style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 13, background: '#fff' }}>
                  <option value="numerique">Numérique (flottant)</option>
                  <option value="binaire">Binaire (0/1 — présence…)</option>
                  <option value="compteur">Compteur (entier)</option>
                </select>
              </div>
              {nvCapteur.type_donnee !== 'binaire' && (
                <div className="grille-valeurs-custom">
                  <input placeholder="Unité" value={nvCapteur.unite} onChange={e => setNvCapteur(p => ({ ...p, unite: e.target.value }))} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 13 }} />
                  <input type="number" placeholder="Min" value={nvCapteur.valeur_min} onChange={e => setNvCapteur(p => ({ ...p, valeur_min: e.target.value }))} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 13 }} />
                  <input type="number" placeholder="Max" value={nvCapteur.valeur_max} onChange={e => setNvCapteur(p => ({ ...p, valeur_max: e.target.value }))} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 13 }} />
                  <button onClick={ajouterCapteurCustom} style={{ padding: '8px 14px', background: '#4F46E5', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Ajouter</button>
                </div>
              )}
              {nvCapteur.type_donnee === 'binaire' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, padding: '7px 10px', background: '#F0FDF4', borderRadius: 6, fontSize: 12, color: '#16A34A' }}>Valeurs automatiques : 0 = absent, 1 = présent</div>
                  <button onClick={ajouterCapteurCustom} style={{ padding: '8px 14px', background: '#4F46E5', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Ajouter</button>
                </div>
              )}
            </div>
            {capteursCustom.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {capteursCustom.map(c => (
                  <span key={c.type} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: '#EEF2FF', color: '#4F46E5', borderRadius: 12, fontSize: 12, fontWeight: 500 }}>
                    {c.type} — {c.type_donnee === 'binaire' ? 'binaire' : c.type_donnee === 'compteur' ? `compteur (${c.valeur_min}–${c.valeur_max} ${c.unite})` : `${c.valeur_min}–${c.valeur_max} ${c.unite}`}
                    <button onClick={() => setCapteursCustom(p => p.filter(x => x.type !== c.type))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#4F46E5' }}><X size={11} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <CheckboxGrp titre="Actionneurs standard" icone={<Activity size={16} />} items={ACTIONNEURS_DEFAUT} selected={actionneurs} onToggle={(v: string) => toggle(v, setActionneurs)} />

          {/* Actionneurs custom */}
          <div style={{ marginTop: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>+ Actionneur personnalisé</h4>
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder="Nom (ex: ventilateur)" value={actionneurCustom} onChange={e => setActionneurCustom(e.target.value)} style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 13 }} />
              <button onClick={ajouterActionneurCustom} style={{ padding: '8px 14px', background: '#4F46E5', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Ajouter</button>
            </div>
            {actionneurCustomListe.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {actionneurCustomListe.map(a => (
                  <span key={a} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: '#F0FDF4', color: '#16A34A', borderRadius: 12, fontSize: 12, fontWeight: 500 }}>
                    {a}
                    <button onClick={() => setActionneurCustomListe(p => p.filter(x => x !== a))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#16A34A' }}><X size={11} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={creer} style={{ padding: '10px 20px', background: '#4F46E5', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Créer</button>
            <button onClick={() => setFormulaire(false)} style={{ padding: '10px 20px', background: '#F1F5F9', color: '#64748B', borderRadius: 8, fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer' }}>Annuler</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {machines.map(m => (
          <div key={m._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: m.statut === 'en_ligne' ? '#10B981' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                {m.statut === 'en_ligne' ? <Wifi size={20} /> : <WifiOff size={20} />}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{m.nom}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#4F46E5', background: '#F1F5F9', padding: '2px 8px', borderRadius: 4 }}>{m.code}</span>
                </div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{m.capteurs.map(c => LABELS[c] || c).join(', ')}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: m.statut === 'en_ligne' ? '#ECFDF5' : '#F1F5F9', color: m.statut === 'en_ligne' ? '#10B981' : '#64748B' }}>
                {m.statut === 'en_ligne' ? 'Connecté' : 'Déconnecté'}
              </span>
              <button onClick={() => setConfirmerSuppression(m._id)} title="Supprimer" style={{ padding: 8, borderRadius: 8, background: 'none', color: '#64748B', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}