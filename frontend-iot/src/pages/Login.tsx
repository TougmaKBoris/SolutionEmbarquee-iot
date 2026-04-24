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
        {/* Cercles décoratifs */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -50, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', top: '42%', right: '18%', width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div className="anim-fade-in-up" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 50 }}>
            <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.15)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 700 }}>
              SE
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Solution Embarquée</div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)' }}>Plateforme IoT Industrielle</div>
            </div>
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: '#fff', margin: '0 0 20px', lineHeight: 1.3 }}>
            Supervision intelligente de vos équipements industriels
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, margin: 0 }}>
            Surveillez vos machines en temps réel, gérez les alertes et optimisez le pilotage de vos actionneurs depuis une interface centralisée.
          </p>
        </div>
      </div>

      {/* Panneau droit */}
      <div style={{ flex: 1, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <div className="anim-fade-in-up" style={{ maxWidth: 420, width: '100%', animationDelay: '0.1s' }}>
          <h2 style={{ fontSize: 30, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>Connexion</h2>
          <p style={{ fontSize: 15, color: '#94A3B8', margin: '0 0 36px' }}>Accédez à votre espace de supervision</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {erreur && (
              <div className="anim-fade-in" style={{ padding: '14px 18px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 14, fontWeight: 500 }}>
                {erreur}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Adresse email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="admin@SE-iot.com" required
                  style={{ width: '100%', padding: '13px 16px 13px 46px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 15, background: '#F8FAFC', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
                <input
                  type={voirMdp ? 'text' : 'password'} value={motDePasse}
                  onChange={e => setMotDePasse(e.target.value)}
                  placeholder="••••••••" required
                  style={{ width: '100%', padding: '13px 46px 13px 46px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 15, background: '#F8FAFC', boxSizing: 'border-box' }}
                />
                <button
                  type="button" onClick={() => setVoirMdp(!voirMdp)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4, display: 'flex' }}>
                  {voirMdp ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={chargement}
              style={{ width: '100%', padding: '14px 16px', borderRadius: 10, background: chargement ? '#6366F1' : '#4F46E5', color: '#fff', fontSize: 15, fontWeight: 600, border: 'none', cursor: chargement ? 'not-allowed' : 'pointer', marginTop: 8, transition: 'background 0.2s, transform 0.1s', transform: 'scale(1)' }}
              onMouseEnter={e => { if (!chargement) e.currentTarget.style.background = '#4338CA'; }}
              onMouseLeave={e => { e.currentTarget.style.background = chargement ? '#6366F1' : '#4F46E5'; }}
            >
              {chargement ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#CBD5E1', marginTop: 32 }}>
            Surveillance en temps réel des équipements industriels
          </p>
        </div>
      </div>
    </div>
  );
}
