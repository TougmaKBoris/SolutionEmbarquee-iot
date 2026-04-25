import React, { useState, useEffect } from 'react';
import utiliserAlertes from '../crochets/utiliserAlertes';
import utiliserMachines from '../crochets/utiliserMachines';
import { utiliserAuth } from '../contexte/ContexteAuthentification';
import CarteAlertes from '../components/alertes/CarteAlertes';
import api from '../services/api';
import utiliserTailleEcran from '../crochets/utiliserTailleEcran';

export default function PageAlertes() {
  const { utilisateur } = utiliserAuth();
  const { machines } = utiliserMachines();
  const role = utilisateur?.role;
  const [filtreMachine, setFiltreMachine] = useState<string>('');
  const [machineOperateur, setMachineOperateur] = useState<string>('');
  const [confirmPurge, setConfirmPurge] = useState(false);

  useEffect(() => {
    if (role === 'operateur') {
      api.get('/affectations/ma-machine')
        .then(res => {
          const mid = res.data.machine_id?._id || res.data.machine_id;
          setMachineOperateur(mid);
          setFiltreMachine(mid);
        })
        .catch(() => {});
    }
  }, [role]);

  // Pour l'opérateur : null = pas encore chargé (on attend), ID = filtré, '' = pas de machine (pas d'alertes)
  // Pour admin/responsable : undefined = toutes les alertes, ID = filtré par machine
  const machineIdFiltre = role === 'operateur'
    ? (machineOperateur || null)
    : (filtreMachine || undefined);
  const { alertes, resoudre, ignorer, supprimer, rafraichir } = utiliserAlertes(machineIdFiltre);

  const isMobile = utiliserTailleEcran();
  const peutResoudre = role === 'admin' || role === 'responsable_maintenance';

  const purgerTout = async () => {
    await api.delete('/alertes/purge');
    setConfirmPurge(false);
    rafraichir();
  };

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Popup suppression de toutes les alertes */}
      {confirmPurge && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', maxWidth: 420, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Supprimer toutes les alertes ?</div>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 20 }}>
              Cela supprimera définitivement les <b style={{ color: '#DC2626' }}>{alertes.length}</b> alertes non résolues. Cette action est irréversible.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmPurge(false)}
                style={{ padding: '10px 20px', borderRadius: 8, background: '#F1F5F9', color: '#64748B', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={purgerTout}
                style={{ padding: '10px 20px', borderRadius: 8, background: '#DC2626', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                Supprimer tout
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="en-tete-page">
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700 }}>Alertes{role === 'operateur' ? ' — Ma machine' : ''}</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{alertes.length} alerte(s) non résolue(s)</p>
        </div>
        <div className="en-tete-page-actions">
          {role !== 'operateur' && (
            <select value={filtreMachine} onChange={e => setFiltreMachine(e.target.value)}>
              <option value="">Toutes les machines</option>
              {machines.map(m => <option key={m._id} value={m._id}>{m.nom}</option>)}
            </select>
          )}
          {peutResoudre && alertes.length > 0 && (
            <button onClick={() => setConfirmPurge(true)}
              style={{ padding: '10px 16px', background: '#DC2626', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              Supprimer toutes les alertes
            </button>
          )}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <CarteAlertes
          alertes={alertes}
          onResoudre={resoudre}
          onIgnorer={ignorer}
          onSupprimer={supprimer}
          limite={50}
          peutResoudre={peutResoudre}
        />
      </div>
    </div>
  );
}