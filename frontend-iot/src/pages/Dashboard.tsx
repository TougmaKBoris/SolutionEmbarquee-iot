import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { utiliserAuth } from '../contexte/ContexteAuthentification';
import utiliserMachines from '../crochets/utiliserMachines';
import utiliserCapteurs from '../crochets/utiliserCapteurs';
import utiliserAlertes from '../crochets/utiliserAlertes';
import CarteCapteur from '../components/capteurs/CarteCapteur';
import CarteActionneurs from '../components/actionneurs/CarteActionneurs';
import CarteAlertes from '../components/alertes/CarteAlertes';
import PanneauIA from '../components/ia/PanneauIA';
import api from '../services/api';
import { Activity, Clock, Users, AlertOctagon, RotateCw } from 'lucide-react';
import { Affectation } from '../types';

export default function Dashboard() {
  const { utilisateur } = utiliserAuth();
  const { machines } = utiliserMachines();
  const navigate = useNavigate();
  const [machineId, setMachineId] = useState<string | null>(null);
  const [analyseIA, setAnalyseIA] = useState<any>(null);
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  const [machinesEtat, setMachinesEtat] = useState<Record<string, { mode: string; etat: string }>>({});
  const [confirmerArret, setConfirmerArret] = useState(false);
  const [messageInfo, setMessageInfo] = useState<string | null>(null);
  const role = utilisateur?.role;

  const peutChangerMode = role === 'admin' || role === 'responsable_maintenance';
  const peutResoudre = role === 'admin' || role === 'responsable_maintenance';

  useEffect(() => {
    const map: Record<string, { mode: string; etat: string }> = {};
    machines.forEach((m: any) => {
      map[m._id] = { mode: m.mode || 'auto', etat: m.etat || 'en_marche' };
    });
    setMachinesEtat(map);
  }, [machines]);

  useEffect(() => {
    if (role === 'operateur') {
      api.get('/affectations/ma-machine')
        .then(res => setMachineId(res.data.machine_id?._id || res.data.machine_id))
        .catch(() => setMachineId(null));
    } else if (machines.length > 0 && !machineId) {
      setMachineId(machines[0]._id);
    }
  }, [role, machines]);

  useEffect(() => {
    if (role === 'admin' || role === 'responsable_maintenance') {
      api.get('/ia/analyse').then(res => setAnalyseIA(res.data)).catch(() => {});
      api.get('/affectations').then(res => setAffectations(res.data)).catch(() => {});
    }
  }, [role, machineId]);

  const { capteurs } = utiliserCapteurs(machineId);
  const { alertes, resoudre, ignorer, supprimer } = utiliserAlertes(machineId || undefined);
  const machineSelectionnee = machines.find((m: any) => m._id === machineId);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const etatActuel = machineId ? machinesEtat[machineId] : null;
  const modeActuel = etatActuel?.mode || 'auto';
  const etatMachine = etatActuel?.etat || 'en_marche';

  const operateursMachine = affectations.filter(a => {
    const mid = typeof a.machine_id === 'object' ? a.machine_id?._id : a.machine_id;
    return mid === machineId;
  });

  const analyseIAFiltree = (() => {
    if (!analyseIA || !machineId) return null;
    if (analyseIA.mode === 'degrade') return null;
    const analyses = analyseIA.analyses || [];
    const machineAnalyse = analyses.find((a: any) => a.machine_id === machineId);
    if (!machineAnalyse) return null;
    return { ...analyseIA, analyses: [machineAnalyse] };
  })();

  const changerMode = async (nouveauMode: string) => {
    if (!machineId || !peutChangerMode) return;
    try {
      await api.patch(`/machines/${machineId}/mode`, { mode: nouveauMode });
      setMachinesEtat(prev => ({
        ...prev,
        [machineId]: { ...prev[machineId], mode: nouveauMode },
      }));
      setMessageInfo(`Machine basculee en mode ${nouveauMode === 'auto' ? 'automatique' : 'manuel'}`);
      setTimeout(() => setMessageInfo(null), 3000);
    } catch (err: any) {
      setMessageInfo(err.response?.data?.message || 'Erreur lors du changement de mode');
      setTimeout(() => setMessageInfo(null), 4000);
    }
  };

  const declencherArretUrgence = async () => {
    if (!machineId) return;
    try {
      await api.post(`/machines/${machineId}/arret-urgence`);
      setMachinesEtat(prev => ({
        ...prev,
        [machineId]: { ...prev[machineId], etat: 'arretee' },
      }));
      setConfirmerArret(false);
      setMessageInfo("Arret d'urgence applique. Une alerte critique a ete creee.");
      setTimeout(() => setMessageInfo(null), 5000);
    } catch (err: any) {
      setMessageInfo(err.response?.data?.message || "Erreur lors de l'arret d'urgence");
      setConfirmerArret(false);
      setTimeout(() => setMessageInfo(null), 4000);
    }
  };

  const redemarrerMachine = async () => {
    if (!machineId || !peutChangerMode) return;
    try {
      await api.post(`/machines/${machineId}/redemarrer`);
      setMachinesEtat(prev => ({
        ...prev,
        [machineId]: { ...prev[machineId], etat: 'en_marche' },
      }));
      setMessageInfo('Machine redemarree avec succes');
      setTimeout(() => setMessageInfo(null), 3000);
    } catch (err: any) {
      setMessageInfo(err.response?.data?.message || 'Erreur lors du redemarrage');
      setTimeout(() => setMessageInfo(null), 4000);
    }
  };

  const allerVersAnalyseIA = () => {
    navigate('/analyse-ia');
  };

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Popup confirmation arret urgence */}
      {confirmerArret && machineSelectionnee && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', maxWidth: 460, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertOctagon size={22} color="#DC2626" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A' }}>Confirmer l'arret d'urgence ?</div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                  Tous les actionneurs de <b style={{ color: '#DC2626' }}>{machineSelectionnee.nom}</b> seront immediatement desactives et une alerte critique sera enregistree.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmerArret(false)}
                style={{ padding: '9px 20px', borderRadius: 8, background: '#F1F5F9', color: '#64748B', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={declencherArretUrgence}
                style={{ padding: '9px 20px', borderRadius: 8, background: '#DC2626', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                Confirmer l'arret
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast info */}
      {messageInfo && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#0F172A', color: '#fff', padding: '12px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 999, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          {messageInfo}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>{role === 'operateur' ? 'Ma machine' : 'Tableau de bord'}</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Surveillance en temps reel des equipements</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {machineSelectionnee && etatMachine === 'en_marche' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, border: '1px solid #D1FAE5', background: '#ECFDF5' }}>
              <Activity size={14} color="#10B981" />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#059669' }}>Systeme actif</span>
            </div>
          )}
          {machineSelectionnee && etatMachine === 'arretee' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, border: '1px solid #FECACA', background: '#FEF2F2' }}>
              <AlertOctagon size={14} color="#DC2626" />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#DC2626' }}>Machine arretee</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B' }}>
            <Clock size={14} />
            <span>{now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>{now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Barre selecteur machines + mode + arret urgence (admin + responsable) */}
      {role !== 'operateur' && machines.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {machines.map((m: any) => (
            <button key={m._id} onClick={() => setMachineId(m._id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: m._id === machineId ? 'none' : '1px solid #E2E8F0', background: m._id === machineId ? '#4F46E5' : '#fff', color: m._id === machineId ? '#fff' : '#64748B', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: m.statut === 'en_ligne' ? '#22C55E' : '#EF4444' }} />
              {m.nom}
            </button>
          ))}

          <div style={{ flex: 1 }} />

          {/* Toggle mode auto/manuel */}
          {machineSelectionnee && peutChangerMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 3, background: '#F1F5F9', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <button
                onClick={() => changerMode('auto')}
                style={{ padding: '5px 14px', background: modeActuel === 'auto' ? '#4F46E5' : 'transparent', color: modeActuel === 'auto' ? '#fff' : '#64748B', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>
                Auto
              </button>
              <button
                onClick={() => changerMode('manuel')}
                style={{ padding: '5px 14px', background: modeActuel === 'manuel' ? '#F59E0B' : 'transparent', color: modeActuel === 'manuel' ? '#fff' : '#64748B', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>
                Manuel
              </button>
            </div>
          )}

          {/* Bouton arret d'urgence (admin + responsable) */}
          {machineSelectionnee && etatMachine === 'en_marche' && (
            <button onClick={() => setConfirmerArret(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 6px rgba(220,38,38,0.25)' }}>
              <AlertOctagon size={13} />
              Arret d'urgence
            </button>
          )}

          {/* Bouton redemarrage (admin + responsable) */}
          {machineSelectionnee && etatMachine === 'arretee' && peutChangerMode && (
            <button onClick={redemarrerMachine}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 6px rgba(16,185,129,0.25)' }}>
              <RotateCw size={13} />
              Redemarrer
            </button>
          )}
        </div>
      )}

      {/* Barre dediee a l'operateur : juste l'arret d'urgence */}
      {role === 'operateur' && machineSelectionnee && etatMachine === 'en_marche' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button onClick={() => setConfirmerArret(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}>
            <AlertOctagon size={16} />
            ARRET D'URGENCE
          </button>
        </div>
      )}

      {/* Operateur - machine arretee */}
      {role === 'operateur' && machineSelectionnee && etatMachine === 'arretee' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <div style={{ padding: '8px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 12, color: '#991B1B', fontWeight: 500 }}>
            Machine arretee — contactez le responsable maintenance
          </div>
        </div>
      )}

      {/* Bandeau machine arretee */}
      {etatMachine === 'arretee' && machineSelectionnee && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, marginBottom: 16 }}>
          <AlertOctagon size={18} color="#DC2626" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#991B1B' }}>Machine actuellement arretee</div>
            <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 2 }}>
              Tous les actionneurs sont desactives. {peutChangerMode ? 'Cliquez sur "Redemarrer" pour reprendre le fonctionnement.' : 'Contactez le responsable maintenance pour redemarrer.'}
            </div>
          </div>
        </div>
      )}

      {/* BANDEAU IA — discret, conditionnel (uniquement attention/critique) */}
      {(role === 'admin' || role === 'responsable_maintenance') && analyseIAFiltree && (
        <div style={{ marginBottom: 16 }}>
          <PanneauIA analyse={analyseIAFiltree} onVoirDetails={allerVersAnalyseIA} />
        </div>
      )}

      {/* Carte operateurs compacte (admin + responsable) */}
      {(role === 'admin' || role === 'responsable_maintenance') && machineSelectionnee && (
        <div style={{ padding: '12px 16px', background: '#fff', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 16, border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={14} color="#64748B" />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {operateursMachine.length === 0 ? 'Aucun operateur' : `${operateursMachine.length} operateur${operateursMachine.length > 1 ? 's' : ''}`}
              </span>
            </div>
            {operateursMachine.map(a => {
              const nom = a.operateur_id?.nom || 'Operateur';
              return (
                <div key={a._id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px 4px 4px', background: '#F8FAFC', borderRadius: 20, border: '1px solid #E2E8F0' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0891B2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 600 }}>
                    {nom.substring(0, 2).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 12, color: '#0F172A', fontWeight: 500 }}>{nom}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: modeActuel === 'auto' ? '#EEF2FF' : '#FEF3C7', borderRadius: 12 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: modeActuel === 'auto' ? '#4F46E5' : '#F59E0B' }} />
            <span style={{ fontSize: 10, color: modeActuel === 'auto' ? '#3C3489' : '#92400E', fontWeight: 600 }}>
              Mode {modeActuel === 'auto' ? 'automatique' : 'manuel'}
            </span>
          </div>
        </div>
      )}

      {/* Cartes capteurs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
        {capteurs.map((c, i) => <CarteCapteur key={i} capteur={c} />)}
        {capteurs.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#64748B', fontSize: 14, background: '#fff', borderRadius: 12, border: '2px dashed #E2E8F0' }}>
            En attente des donnees capteurs... Les donnees arrivent toutes les 10 secondes.
          </div>
        )}
      </div>

      {/* Actionneurs + Alertes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {machineId && <CarteActionneurs machineId={machineId} mode={modeActuel} etatMachine={etatMachine} />}
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            <span>Alertes recentes</span>
            <span style={{ background: '#DC2626', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, minWidth: 20, textAlign: 'center' }}>{alertes.length}</span>
          </div>
          <CarteAlertes alertes={alertes} onResoudre={resoudre} onIgnorer={ignorer} onSupprimer={supprimer} limite={4} peutResoudre={peutResoudre} />
        </div>
      </div>
    </div>
  );
}