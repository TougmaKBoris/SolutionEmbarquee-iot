import React, { useState, useEffect } from 'react';
import api from '../services/api';
import utiliserMachines from '../crochets/utiliserMachines';
import { Affectation, Utilisateur } from '../types';
import { Link2, Plus, Trash2, AlertCircle, XCircle } from 'lucide-react';
import { utiliserAuth } from '../contexte/ContexteAuthentification';

export default function PageAffectations() {
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  const [operateurs, setOperateurs] = useState<Utilisateur[]>([]);
  const { machines } = utiliserMachines();
  const [formulaire, setFormulaire] = useState(false);
  const [operateurId, setOperateurId] = useState('');
  const [machineId, setMachineId] = useState('');
  const [confirmerSuppression, setConfirmerSuppression] = useState<string | null>(null);
  const [messageErreur, setMessageErreur] = useState<string | null>(null);

  const { utilisateur } = utiliserAuth();
  const estAdmin = utilisateur?.role === 'admin';

  const charger = async () => {
    try {
      const affRes = await api.get('/affectations');
      setAffectations(affRes.data);

      if (estAdmin) {
        const usersRes = await api.get('/utilisateurs');
        setOperateurs(usersRes.data.filter((u: Utilisateur) => u.role === 'operateur'));
      }
    } catch (err) {
      console.error('Erreur chargement affectations:', err);
    }
  };

  useEffect(() => { charger(); }, []);

  const creer = async () => {
    if (!operateurId || !machineId) return;
    try {
      await api.post('/affectations', { operateur_id: operateurId, machine_id: machineId });
      setFormulaire(false);
      setOperateurId('');
      setMachineId('');
      charger();
    } catch (err: any) {
      setMessageErreur(err.response?.data?.message || "Une erreur s'est produite lors de l'affectation");
    }
  };

  const supprimer = async () => {
    if (!confirmerSuppression) return;
    await api.delete(`/affectations/${confirmerSuppression}`);
    setConfirmerSuppression(null);
    charger();
  };

  const affectationASupprimer = affectations.find(a => a._id === confirmerSuppression);

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Popup erreur stylé */}
      {messageErreur && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', maxWidth: 420, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <XCircle size={20} color="#DC2626" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A' }}>Affectation impossible</div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{messageErreur}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setMessageErreur(null)}
                style={{ padding: '9px 20px', borderRadius: 8, background: '#4F46E5', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                Compris
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup confirmation suppression - admin seulement */}
      {estAdmin && confirmerSuppression && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', maxWidth: 420, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={20} color="#DC2626" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A' }}>Supprimer cette affectation ?</div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                  L'affectation de <b style={{ color: '#DC2626' }}>{affectationASupprimer?.operateur_id?.nom || 'Opérateur'}</b> à la machine <b style={{ color: '#4F46E5' }}>{affectationASupprimer?.machine_id?.nom || 'Machine'}</b> sera supprimée.
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Affectations</h1>
          <p style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>
            {estAdmin ? 'Lier les opérateurs à leurs machines' : 'Liste des opérateurs et leurs machines affectées'}
          </p>
        </div>
        {estAdmin && (
          <button onClick={() => setFormulaire(!formulaire)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#4F46E5', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            <Plus size={18} /> Affecter
          </button>
        )}
      </div>

      {estAdmin && formulaire && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '2px solid #EEF2FF' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Nouvelle affectation</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <select value={operateurId} onChange={e => setOperateurId(e.target.value)}>
              <option value="">Sélectionner un opérateur</option>
              {operateurs.map(o => (
                <option key={o._id} value={o._id}>{o.nom} ({o.email})</option>
              ))}
            </select>
            <select value={machineId} onChange={e => setMachineId(e.target.value)}>
              <option value="">Sélectionner une machine</option>
              {machines.map(m => (
                <option key={m._id} value={m._id}>{m.nom}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={creer} style={{ padding: '10px 20px', background: '#4F46E5', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              Affecter
            </button>
            <button onClick={() => setFormulaire(false)} style={{ padding: '10px 20px', background: '#F1F5F9', color: '#64748B', borderRadius: 8, fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {affectations.map(a => (
          <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: '#0891B2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 600 }}>
                {(a.operateur_id?.nom || '??').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{a.operateur_id?.nom || 'Opérateur'}</div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{a.operateur_id?.email}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748B' }}>
                <Link2 size={16} />
                <span style={{ fontSize: 13, fontWeight: 600, padding: '4px 12px', background: '#EEF2FF', color: '#4F46E5', borderRadius: 6 }}>
                  {a.machine_id?.nom || 'Machine'}
                </span>
              </div>
              {estAdmin && (
                <button onClick={() => setConfirmerSuppression(a._id)} style={{ padding: 8, borderRadius: 8, background: 'none', color: '#64748B', border: 'none', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
        {affectations.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748B', fontSize: 14, background: '#fff', borderRadius: 12, border: '2px dashed #E2E8F0' }}>
            Aucune affectation configurée
          </div>
        )}
      </div>
    </div>
  );
}