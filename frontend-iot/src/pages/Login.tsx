import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { utiliserAuth } from '../contexte/ContexteAuthentification';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const [voirMdp, setVoirMdp] = useState(false);
  const { connexion } = utiliserAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    setChargement(true);
    try { await connexion(email, motDePasse); navigate('/tableau-de-bord'); }
    catch (err: any) { setErreur(err.response?.data?.message || 'Email ou mot de passe incorrect'); }
    finally { setChargement(false); }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Panneau gauche */}
      <div style={{ width: '45%', background: 'linear-gradient(135deg, #4F46E5 0%, #312E81 100%)', padding: '60px 50px', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -70, left: -40, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', top: '45%', right: '15%', width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 50 }}>
            <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.15)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 700 }}>SE</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Solution Embarquée</div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)' }}>Plateforme IoT Industrielle</div>
            </div>
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: '#fff', margin: '0 0 20px', lineHeight: 1.3 }}>Supervision intelligente de vos équipements industriels</h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, margin: 0 }}>Surveillez vos machines en temps réel, gérez les alertes et optimisez le pilotage de vos actionneurs depuis une interface centralisée.</p>
        </div>
      </div>

      {/* Panneau droit */}
      <div style={{ flex: 1, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <div style={{ maxWidth: 420, width: '100%' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>Connexion</h2>
          <p style={{ fontSize: 16, color: '#94A3B8', margin: '0 0 36px' }}>Accédez à votre espace de supervision</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {erreur && (
              <div style={{ padding: '14px 18px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 15, fontWeight: 500 }}>{erreur}</div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 16, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Adresse email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@SE-iot.com" required
                  style={{ width: '100%', padding: '14px 16px 14px 46px', borderRadius: 12, border: '1.5px solid #E2E8F0', fontSize: 16, background: '#F8FAFC', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 16, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <Lock size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
                <input type={voirMdp ? 'text' : 'password'} value={motDePasse} onChange={e => setMotDePasse(e.target.value)} placeholder="••••••••" required
                  style={{ width: '100%', padding: '14px 46px 14px 46px', borderRadius: 12, border: '1.5px solid #E2E8F0', fontSize: 16, background: '#F8FAFC', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setVoirMdp(!voirMdp)}
                  style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}>
                  {voirMdp ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={chargement}
              style={{ width: '100%', padding: 16, borderRadius: 12, background: '#4F46E5', color: '#fff', fontSize: 17, fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: 10, opacity: chargement ? 0.7 : 1, transition: 'all 0.2s' }}>
              {chargement ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#94A3B8', marginTop: 32 }}>Surveillance en temps réel des équipements industriels</p>
        </div>
      </div>
    </div>
  );
}