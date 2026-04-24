import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Alerte } from '../../types';

interface Props {
  alertes: Alerte[];
  onResoudre?: (id: string) => void;
  onIgnorer?: (id: string) => void;
  onSupprimer?: (id: string) => void;
  limite?: number;
  peutResoudre?: boolean;
}

const tempsEcoule = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  return `Il y a ${Math.floor(minutes / 60)}h`;
};

export default function CarteAlertes({ alertes, onResoudre, onIgnorer, onSupprimer, limite = 5, peutResoudre = true }: Props) {
  const [confirmer, setConfirmer] = useState<string | null>(null);

  if (alertes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 30, color: '#475569' }}>
        <CheckCircle size={32} color="#16A34A" style={{ marginBottom: 8 }} />
        <p style={{ fontSize: 14 }}>Aucune alerte active</p>
      </div>
    );
  }

  return (
    <>
      {/* Popup de confirmation suppression */}
      {confirmer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={20} color="#DC2626" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A' }}>Supprimer cette alerte ?</div>
                <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>Cette action est irréversible.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmer(null)}
                style={{ padding: '9px 20px', borderRadius: 8, background: '#F1F5F9', color: '#475569', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={() => { if (onSupprimer) onSupprimer(confirmer); setConfirmer(null); }}
                style={{ padding: '9px 20px', borderRadius: 8, background: '#DC2626', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {alertes.slice(0, limite).map(a => {
          const critique = a.niveau === 'critique';
          return (
            <div key={a._id} style={{ padding: '10px 14px', borderRadius: '0 8px 8px 0', background: '#fff', borderLeft: `4px solid ${critique ? '#DC2626' : '#D97706'}`, borderTop: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    {critique ? <AlertCircle size={14} color="#DC2626" /> : <AlertTriangle size={14} color="#D97706" />}
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{a.message}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', fontWeight: 500, marginLeft: 20 }}>{a.machine_id?.nom || 'Machine'} — {tempsEcoule(a.createdAt)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 8, background: critique ? '#DC2626' : '#D97706', color: '#fff', fontWeight: 600 }}>{a.niveau}</span>
                  {peutResoudre && (
                    <>
                      {onResoudre && (
                        <button onClick={() => onResoudre(a._id)} title="Résoudre"
                          style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', cursor: 'pointer', fontWeight: 600 }}>
                          Résoudre
                        </button>
                      )}
                      {onIgnorer && (
                        <button onClick={() => onIgnorer(a._id)} title="Ignorer"
                          style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#475569', cursor: 'pointer', fontWeight: 600 }}>
                          Ignorer
                        </button>
                      )}
                    </>
                  )}
                  {onSupprimer && (
                    <button onClick={() => setConfirmer(a._id)} title="Supprimer"
                      style={{ padding: '3px', borderRadius: 6, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}