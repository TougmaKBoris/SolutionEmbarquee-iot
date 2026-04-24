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
      setMessageInfo(`Machine basculée en mode ${nouveauMode === 'auto' ? 'automatique' : 'manuel'}`);
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
      setMessageInfo("Arrêt d'urgence appliqué. Une alerte critique a été créée.");
      setTimeout(() => setMessageInfo(null), 5000);
    } catch (err: any) {
      setMessageInfo(err.response?.data?.message || "Erreur lors de l'arrêt d'urgence");
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
      setMessageInfo('Machine redémarrée avec succès');
      setTimeout(() => setMessageInfo(null), 3000);
    } catch (err: any) {
      setMessageInfo(err.response?.data?.message || 'Erreur lors du redémarrage');
      setTimeout(() => setMessageInfo(null), 4000);
    }
  };

  const allerVersAnalyseIA = () => {
    navigate('/analyse-ia');
  };

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Popup confirmation arrêt urgence */}
      {confirmerArret && machineSelectionnee && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', maxWidth: 460, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertOctagon size={22} color="#DC2626" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A' }}>Confirmer l'arrêt d'urgence ?</div>
                <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>
                  Tous les actionneurs de <b style={{ color: '#DC2626' }}>{machineSelectionnee.nom}</b> seront immédiatement désactivés et une alerte critique sera enregistrée.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmerArret(false)}
                style={{ padding: '9px 20px', borderRadius: 8, background: '#F1F5F9', color: '#475569', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={declencherArretUrgence}
                style={{ padding: '9px 20px', borderRadius: 8, background: '#DC2626', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                Confirmer l'arrêt
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: -0.5 }}>{role === 'operateur' ? 'Ma machine' : 'Tableau de bord'}</h1>
          <p style={{ fontSize: 14, color: '#475569', marginTop: 4 }}>Surveillance en temps réel des équipements</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {machineSelectionnee && etatMachine === 'en_marche' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px', borderRadius: 24, border: '1px solid #D1FAE5', background: '#ECFDF5' }}>
              <Activity size={18} color="#10B981" />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#059669' }}>Système actif</span>
            </div>
          )}
          {machineSelectionnee && etatMachine === 'arretee' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px', borderRadius: 24, border: '1px solid #FECACA', background: '#FEF2F2' }}>
              <AlertOctagon size={18} color="#DC2626" />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#DC2626' }}>Machine arrêtée</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, color: '#475569', fontWeight: 500, padding: '8px 16px', background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <Clock size={16} />
            <span>{now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            <span style={{ fontSize: 14, color: '#475569', marginLeft: 4 }}>{now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Barre sélecteur machines + mode + arrêt urgence (admin + responsable) */}
      {role !== 'operateur' && machines.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {machines.map((m: any) => (
            <button key={m._id} onClick={() => setMachineId(m._id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: m._id === machineId ? 'none' : '1px solid #E2E8F0', background: m._id === machineId ? '#2563EB' : '#fff', color: m._id === machineId ? '#fff' : '#475569', cursor: 'pointer', transition: 'all 0.2s', boxShadow: m._id === machineId ? '0 4px 12px rgba(37,99,235,0.2)' : '0 1px 2px rgba(0,0,0,0.05)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: (m.statut === 'en_ligne' && m.etat === 'en_marche') ? '#10B981' : '#EF4444' }} />
              {m.nom}
            </button>
          ))}

          <div style={{ flex: 1 }} />

          {/* Toggle mode auto/manuel */}
          {machineSelectionnee && peutChangerMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 3, background: '#F1F5F9', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <button
                onClick={() => changerMode('auto')}
                style={{ padding: '5px 14px', background: modeActuel === 'auto' ? '#4F46E5' : 'transparent', color: modeActuel === 'auto' ? '#fff' : '#475569', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>
                Auto
              </button>
              <button
                onClick={() => changerMode('manuel')}
                style={{ padding: '5px 14px', background: modeActuel === 'manuel' ? '#F59E0B' : 'transparent', color: modeActuel === 'manuel' ? '#fff' : '#475569', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>
                Manuel
              </button>
            </div>
          )}

          {/* Bouton arrêt d'urgence (admin + responsable) */}
          {machineSelectionnee && etatMachine === 'en_marche' && (
            <button onClick={() => setConfirmerArret(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 6px rgba(220,38,38,0.25)' }}>
              <AlertOctagon size={13} />
              Arrêt d'urgence
            </button>
          )}

          {/* Bouton redémarrage (admin + responsable) */}
          {machineSelectionnee && etatMachine === 'arretee' && peutChangerMode && (
            <button onClick={redemarrerMachine}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 6px rgba(16,185,129,0.25)' }}>
              <RotateCw size={13} />
              Redémarrer
            </button>
          )}
        </div>
      )}

      {/* Barre dédiée à l'opérateur : juste l'arrêt d'urgence */}
      {role === 'operateur' && machineSelectionnee && etatMachine === 'en_marche' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button onClick={() => setConfirmerArret(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}>
            <AlertOctagon size={16} />
            ARRÊT D'URGENCE
          </button>
        </div>
      )}

      {/* Opérateur - machine arrêtée */}
      {role === 'operateur' && machineSelectionnee && etatMachine === 'arretee' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <div style={{ padding: '7px 14px', background: '#F8FAFC', borderLeft: '4px solid #DC2626', borderRadius: '0 8px 8px 0', fontSize: 12, color: '#475569', fontWeight: 500 }}>
            Machine arrêtée — contactez le responsable maintenance
          </div>
        </div>
      )}

      {/* Carte opérateurs compacte (admin + responsable) */}
      {(role === 'admin' || role === 'responsable_maintenance') && machineSelectionnee && (
        <div style={{ padding: '8px 14px', background: '#fff', borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.04)', marginBottom: 10, border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Users size={12} color="#475569" />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {operateursMachine.length === 0 ? 'Aucun opérateur' : `${operateursMachine.length} op.`}
              </span>
            </div>
            {operateursMachine.map(a => {
              const nom = a.operateur_id?.nom || 'Opérateur';
              return (
                <div key={a._id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 8px 2px 3px', background: '#F8FAFC', borderRadius: 20, border: '1px solid #E2E8F0' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#0891B2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 600 }}>
                    {nom.substring(0, 2).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 11, color: '#334155', fontWeight: 500 }}>{nom}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: modeActuel === 'auto' ? '#4F46E5' : '#F59E0B' }} />
            <span style={{ fontSize: 10, color: '#475569', fontWeight: 600 }}>
              {modeActuel === 'auto' ? 'Auto' : 'Manuel'}
            </span>
          </div>
        </div>
      )}

      {/* BANDEAU IA — discret, conditionnel (uniquement attention/critique) */}
      {(role === 'admin' || role === 'responsable_maintenance') && analyseIAFiltree && (
        <div style={{ marginBottom: 12 }}>
          <PanneauIA analyse={analyseIAFiltree} onVoirDetails={allerVersAnalyseIA} />
        </div>
      )}


      {/* Cartes capteurs — pleine largeur, légèrement plus grandes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 18, marginBottom: 24 }}>
        {capteurs.map((c, i) => <CarteCapteur key={i} capteur={c} />)}
        {capteurs.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#475569', fontSize: 13, background: '#fff', borderRadius: 12, border: '2px dashed #E2E8F0' }}>
            En attente des données capteurs...
          </div>
        )}
      </div>

      {/* Ligne basse : Alertes + Actionneurs côte à côte */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Alertes */}
        <div style={{ flex: 2, background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E2E8F0', boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#0F172A' }}>
            <span>Alertes récentes</span>
            <span style={{ background: '#F1F5F9', color: '#475569', fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 10, minWidth: 20, textAlign: 'center' }}>{alertes.length}</span>
          </div>
          <CarteAlertes alertes={alertes} onResoudre={resoudre} onIgnorer={ignorer} onSupprimer={supprimer} limite={4} peutResoudre={peutResoudre} />
        </div>

        {/* Actionneurs */}
        <div style={{ flex: 1, minWidth: 280 }}>
          {machineId && <CarteActionneurs machineId={machineId} mode={modeActuel} etatMachine={etatMachine} />}
        </div>
      </div>
    </div>
  );
}
