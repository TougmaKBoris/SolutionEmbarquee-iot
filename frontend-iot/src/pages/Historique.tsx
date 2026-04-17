import React, { useState, useEffect } from 'react';
import utiliserMachines from '../crochets/utiliserMachines';
import api from '../services/api';
import { CapteurData } from '../types';
import { Download, Activity, AlertOctagon, RotateCw, Settings, CheckCircle, Power } from 'lucide-react';

const COULEURS: Record<string, string> = { temperature: '#E24B4A', courant: '#378ADD', vibration: '#EF9F27', pression: '#639922' };
const LABELS: Record<string, string> = { temperature: 'Température', courant: 'Courant', vibration: 'Vibration', pression: 'Pression' };
const UNITES: Record<string, string> = { temperature: '°C', courant: 'A', vibration: 'g', pression: 'bar' };

export default function PageHistorique() {
  const { machines } = utiliserMachines();
  const [machineId, setMachineId] = useState('');
  const [periode, setPeriode] = useState('24h');
  const [donneesParType, setDonneesParType] = useState<Record<string, CapteurData[]>>({});
  const [evenements, setEvenements] = useState<any[]>([]);
  const [seuilsParType, setSeuilsParType] = useState<Record<string, [number, number]>>({});

  const machineSelectionnee = machines.find(m => m._id === machineId);
  const capteursMachine = machineSelectionnee?.capteurs || [];

  useEffect(() => { if (machines.length > 0 && !machineId) setMachineId(machines[0]._id); }, [machines]);

  useEffect(() => {
    if (!machineId) return;
    api.get(`/seuils?machine_id=${machineId}`)
      .then(res => {
        const map: Record<string, [number, number]> = {};
        for (const s of res.data) {
          map[s.type_capteur] = [s.valeur_min, s.valeur_max];
        }
        setSeuilsParType(map);
      })
      .catch(() => setSeuilsParType({}));
  }, [machineId]);

  useEffect(() => {
    if (!machineId || capteursMachine.length === 0) return;
    const charger = async () => {
      const resultats: Record<string, CapteurData[]> = {};
      for (const type of capteursMachine) {
        try {
          const res = await api.get(`/capteurs/historique/${machineId}/${type}`);
          resultats[type] = res.data;
        } catch { resultats[type] = []; }
      }
      setDonneesParType(resultats);
    };
    charger();
  }, [machineId, capteursMachine.join(',')]);

  useEffect(() => {
    if (!machineId) return;
    api.get(`/evenements?machine_id=${machineId}&periode=${periode}`)
      .then(res => setEvenements(res.data))
      .catch(() => setEvenements([]));
  }, [machineId, periode]);

  const stats = (donnees: CapteurData[]) => {
    if (donnees.length === 0) return { moy: 0, max: 0, min: 0 };
    const vals = donnees.map(d => d.valeur);
    return {
      moy: vals.reduce((s, v) => s + v, 0) / vals.length,
      max: Math.max(...vals),
      min: Math.min(...vals),
    };
  };

  const exporterCSV = () => {
    const lignes: string[] = ['Heure;Capteur;Valeur;Unite;Statut'];
    for (const type of capteursMachine) {
      const donnees = donneesParType[type] || [];
      for (const d of donnees) {
        const seuil = seuilsParType[type];
        let statut = 'normal';
        if (seuil) {
          if (d.valeur >= seuil[1]) statut = 'critique';
          else if (d.valeur >= seuil[0]) statut = 'attention';
        }
        const heure = new Date(d.timestamp).toLocaleString('fr-FR');
        lignes.push(`${heure};${LABELS[type]};${d.valeur};${UNITES[type]};${statut}`);
      }
    }
    const csv = lignes.join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historique_${machineSelectionnee?.nom || 'machine'}_${periode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getEvenementConfig = (type: string) => {
    const configs: Record<string, { fond: string; icone: any; couleur: string; label: string }> = {
      arret_urgence: { fond: '#FCEBEB', icone: AlertOctagon, couleur: '#E24B4A', label: 'Arret urgence' },
      redemarrage: { fond: '#EAF3DE', icone: RotateCw, couleur: '#639922', label: 'Redemarrage' },
      changement_mode: { fond: '#EEEDFE', icone: Settings, couleur: '#534AB7', label: 'Changement mode' },
      alerte_resolue: { fond: '#EAF3DE', icone: CheckCircle, couleur: '#639922', label: 'Alerte resolue' },
      commande_actionneur: { fond: '#FAEEDA', icone: Power, couleur: '#BA7517', label: 'Commande' },
    };
    return configs[type] || { fond: '#F1F5F9', icone: Activity, couleur: '#64748B', label: type };
  };

  const formatHeure = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "a l'instant";
    if (diffMin < 60) return `il y a ${diffMin} min`;
    if (diffMin < 1440) return `il y a ${Math.floor(diffMin / 60)}h`;
    return d.toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>Historique</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Evolution des capteurs et journal des evenements</p>
        </div>
        <button onClick={exporterCSV}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fff', color: '#0F172A', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
          <Download size={14} />
          Exporter CSV
        </button>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Machine</span>
          <select value={machineId} onChange={e => setMachineId(e.target.value)}
            style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff' }}>
            {machines.map(m => <option key={m._id} value={m._id}>{m.nom}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 3, background: '#F1F5F9', borderRadius: 8, border: '1px solid #E2E8F0' }}>
          {['1h', '24h', '7j', '30j'].map(p => (
            <button key={p} onClick={() => setPeriode(p)}
              style={{ padding: '5px 14px', background: periode === p ? '#4F46E5' : 'transparent', color: periode === p ? '#fff' : '#64748B', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 4 cards capteurs avec graphiques en barres */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {capteursMachine.map(type => {
          const donnees = (donneesParType[type] || []).slice(0, 18);
          const s = stats(donneesParType[type] || []);
          const couleur = COULEURS[type] || '#64748B';
          const seuil = seuilsParType[type];
          const valeurMax = donnees.length > 0 ? Math.max(...donnees.map(d => d.valeur), seuil ? seuil[1] * 1.1 : 100) : 100;

          return (
            <div key={type} style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F5F9', padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: couleur }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{LABELS[type] || type}</span>
                </div>
                {seuil && <span style={{ fontSize: 10, color: '#94A3B8' }}>seuil {seuil[0]} - {seuil[1]} {UNITES[type]}</span>}
              </div>

              {/* Graphique en barres - couleurs adoucies */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80, marginBottom: 14, padding: '0 2px' }}>
                {donnees.length === 0 && (
                  <div style={{ flex: 1, textAlign: 'center', alignSelf: 'center', fontSize: 11, color: '#94A3B8' }}>Aucune donnee</div>
                )}
                {donnees.slice().reverse().map((d, i) => {
                  const hauteurPct = Math.min(100, (d.valeur / valeurMax) * 100);
                  const estCritique = seuil && d.valeur >= seuil[1];
                  const estAttention = seuil && d.valeur >= seuil[0] && d.valeur < seuil[1];
                  let opacity = 0.5;
                  if (estAttention) opacity = 0.8;
                  if (estCritique) opacity = 1.0;
                  return (
                    <div key={i}
                      style={{ flex: 1, height: `${hauteurPct}%`, background: couleur, opacity, borderRadius: '3px 3px 0 0', minHeight: 4, transition: 'all 0.2s' }}
                      title={`${d.valeur} ${UNITES[type]}`}
                    />
                  );
                })}
              </div>

              {/* Stats Min/Moy/Max */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
                <div>
                  <div style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Min</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#16A34A' }}>{s.min.toFixed(1)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Moy</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{s.moy.toFixed(1)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Max</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#DC2626' }}>{s.max.toFixed(1)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {capteursMachine.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748B', background: '#fff', borderRadius: 12, border: '2px dashed #E2E8F0', marginBottom: 20 }}>
          Aucun capteur configure pour cette machine
        </div>
      )}

      {/* Journal des evenements */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Journal des evenements</div>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>{evenements.length} evenement{evenements.length > 1 ? 's' : ''}</span>
        </div>

        {evenements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: '#94A3B8', fontSize: 12 }}>
            Aucun evenement enregistre pour cette periode
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {evenements.map((e, i) => {
              const config = getEvenementConfig(e.type);
              const Icone = config.icone;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#fff', border: '1px solid #F1F5F9', borderRadius: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: config.fond, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icone size={14} color={config.couleur} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: '#0F172A', fontWeight: 500 }}>{e.description}</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                      par <b>{e.utilisateur_nom}</b> ({e.utilisateur_role}) — {e.machine_nom}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap' }}>{formatHeure(e.createdAt)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}