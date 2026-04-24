import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Utilisateur } from '../types';
import { Plus, Trash2, Shield, Wrench, User, Users, AlertCircle } from 'lucide-react';

const ICONES: Record<string, any> = { admin: Shield, responsable_maintenance: Wrench, operateur: User };
const COULEURS: Record<string, string> = { admin: '#4F46E5', responsable_maintenance: '#7C3AED', operateur: '#0891B2' };

export default function PageUtilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [formulaire, setFormulaire] = useState(false);
  const [email, setEmail] = useState(''); const [mdp, setMdp] = useState(''); const [nom, setNom] = useState(''); const [role, setRole] = useState('operateur');
  const [confirmerSuppression, setConfirmerSuppression] = useState<string | null>(null);

  const charger = async () => { const res = await api.get('/utilisateurs'); setUtilisateurs(res.data); };
  useEffect(() => { charger(); }, []);

  const creer = async () => {
    if (!email || !mdp || !nom) return;
    await api.post('/utilisateurs', { email, mot_de_passe: mdp, nom, role });
    setEmail(''); setMdp(''); setNom(''); setFormulaire(false); charger();
  };

  const supprimer = async () => {
    if (!confirmerSuppression) return;
    try { await api.delete(`/utilisateurs/${confirmerSuppression}`); setConfirmerSuppression(null); charger(); }
    catch (err: any) { setConfirmerSuppression(null); alert(err.response?.data?.message || 'Erreur'); }
  };

  const utilisateurASupprimer = utilisateurs.find(u => u._id === confirmerSuppression);

  const nbAdmin = utilisateurs.filter(u => u.role === 'admin').length;
  const nbResp = utilisateurs.filter(u => u.role === 'responsable_maintenance').length;
  const nbOper = utilisateurs.filter(u => u.role === 'operateur').length;

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
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A' }}>Supprimer cet utilisateur ?</div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                  L'utilisateur <b style={{ color: '#DC2626' }}>{utilisateurASupprimer?.nom || ''}</b> ({utilisateurASupprimer?.email}) sera supprimé définitivement ainsi que ses affectations associées.
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
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Gestion des utilisateurs</h1>
          <p style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>Créer et gérer les comptes du système</p>
        </div>
        <button onClick={() => setFormulaire(!formulaire)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#4F46E5', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          <Plus size={18} /> Nouvel utilisateur
        </button>
      </div>

      {/* Cartes compteurs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', borderLeft: '4px solid #4F46E5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>Administrateurs</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#4F46E5', marginTop: 4 }}>{nbAdmin}</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} color="#4F46E5" />
            </div>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', borderLeft: '4px solid #7C3AED' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>Resp. maintenance</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#7C3AED', marginTop: 4 }}>{nbResp}</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wrench size={20} color="#7C3AED" />
            </div>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', borderLeft: '4px solid #0891B2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>Opérateurs</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#0891B2', marginTop: 4 }}>{nbOper}</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ECFEFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} color="#0891B2" />
            </div>
          </div>
        </div>
      </div>

      {formulaire && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '2px solid #EEF2FF' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Créer un utilisateur</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <input placeholder="Nom complet" value={nom} onChange={e => setNom(e.target.value)} />
            <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <input placeholder="Mot de passe" type="password" value={mdp} onChange={e => setMdp(e.target.value)} />
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="operateur">Opérateur</option>
              <option value="responsable_maintenance">Responsable maintenance</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={creer} style={{ padding: '10px 20px', background: '#4F46E5', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Créer</button>
            <button onClick={() => setFormulaire(false)} style={{ padding: '10px 20px', background: '#F1F5F9', color: '#64748B', borderRadius: 8, fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer' }}>Annuler</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {utilisateurs.map(u => {
          const Ic = ICONES[u.role] || User;
          const couleur = COULEURS[u.role] || '#666';
          return (
            <div key={u._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: couleur, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 600, flexShrink: 0 }}>
                  {u.nom.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{u.nom}</div>
                  <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{u.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: couleur + '15', color: couleur, textTransform: 'capitalize' }}>
                  <Ic size={13} /> {u.role.replace('_', ' ')}
                </span>
                {u.role !== 'admin' && (
                  <button onClick={() => setConfirmerSuppression(u._id)} title="Supprimer" style={{ padding: 8, borderRadius: 8, background: 'none', color: '#64748B', border: 'none', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}