import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Brain, AlertOctagon, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function AnalyseIA() {
  const [analyse, setAnalyse] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [machineSelectionneeId, setMachineSelectionneeId] = useState<string | null>(null);

  const charger = async () => {
    try {
      const res = await api.get('/ia/analyse');
      setAnalyse(res.data);
    } catch (err) {
      console.error('Erreur analyse IA:', err);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
    const interval = setInterval(charger, 15000);
    return () => clearInterval(interval);
  }, []);

  const triees = useMemo(() => {
    if (!analyse?.analyses) return [];
    const ordre: Record<string, number> = { critique: 0, attention: 1, normal: 2 };
    return [...analyse.analyses].sort((a: any, b: any) => {
      const niveauA = a.diagnostic?.niveau || 'normal';
      const niveauB = b.diagnostic?.niveau || 'normal';
      return (ordre[niveauA] ?? 3) - (ordre[niveauB] ?? 3);
    });
  }, [analyse]);

  // Selection auto : premiere machine de la liste triee (la plus critique)
  useEffect(() => {
    if (triees.length > 0 && !machineSelectionneeId) {
      setMachineSelectionneeId(triees[0].machine_id);
    }
  }, [triees, machineSelectionneeId]);

  if (chargement) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Chargement de l'analyse...</div>;
  }

  if (!analyse || analyse.mode === 'degrade') {
    return (
      <div style={{ maxWidth: 1200 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Analyse IA</h1>
        <div style={{ marginTop: 24, padding: 24, background: '#F1F5F9', borderRadius: 12, textAlign: 'center', color: '#64748B' }}>
          Service IA non connecte. Verifiez que le micro-service Python est demarre sur le port 8000.
        </div>
      </div>
    );
  }

  const stats = {
    total: triees.length,
    normales: triees.filter((a: any) => a.diagnostic?.niveau === 'normal').length,
    attention: triees.filter((a: any) => a.diagnostic?.niveau === 'attention').length,
    critiques: triees.filter((a: any) => a.diagnostic?.niveau === 'critique').length,
  };

  const machineSelectionnee = triees.find((m: any) => m.machine_id === machineSelectionneeId) || triees[0];

  const getCouleurs = (niveau: string) => {
    if (niveau === 'critique') return { fond: '#FCEBEB', bordure: '#F09595', barre: '#E24B4A', titre: '#501313', texte: '#791F1F', label: 'CRITIQUE', sub: '#A32D2D' };
    if (niveau === 'attention') return { fond: '#FAEEDA', bordure: '#FAC775', barre: '#BA7517', titre: '#412402', texte: '#633806', label: 'ATTENTION', sub: '#854F0B' };
    return { fond: '#EAF3DE', bordure: '#C0DD97', barre: '#639922', titre: '#173404', texte: '#27500A', label: 'NORMAL', sub: '#3B6D11' };
  };

  const getIcone = (niveau: string) => {
    if (niveau === 'critique') return AlertOctagon;
    if (niveau === 'attention') return AlertTriangle;
    return CheckCircle;
  };

  const niveauSel = machineSelectionnee?.diagnostic?.niveau || 'normal';
  const couleursSel = getCouleurs(niveauSel);
  const IconeSel = getIcone(niveauSel);
  const distributionSel = machineSelectionnee?.prediction?.distribution || { normal: 0, attention: 0, critique: 0 };
  const confianceSel = Math.round((machineSelectionnee?.prediction?.confiance || 0) * 100);

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>Analyse IA</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Maintenance predictive du parc machines</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#EEEDFE', borderRadius: 20 }}>
          <Brain size={14} color="#534AB7" />
          <span style={{ fontSize: 11, color: '#3C3489', fontWeight: 600 }}>Analyse en temps reel</span>
        </div>
      </div>

      {/* Stats globales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Total machines</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>{stats.total}</div>
        </div>
        <div style={{ background: '#EAF3DE', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 10, color: '#3B6D11', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Normales</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#173404' }}>{stats.normales}</div>
        </div>
        <div style={{ background: '#FAEEDA', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 10, color: '#854F0B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Attention</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#412402' }}>{stats.attention}</div>
        </div>
        <div style={{ background: '#FCEBEB', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 10, color: '#791F1F', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Critiques</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#501313' }}>{stats.critiques}</div>
        </div>
      </div>

      {/* Vue maitre/detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 14, marginBottom: 20 }}>

        {/* Liste a gauche */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {triees.map((m: any) => {
            const niveau = m.diagnostic?.niveau || 'normal';
            const couleurs = getCouleurs(niveau);
            const estSelectionnee = m.machine_id === machineSelectionneeId;
            const cause = m.causes && m.causes.length > 0 ? m.causes[0].description : 'Tous capteurs nominaux';
            const causeCourte = cause.length > 45 ? cause.substring(0, 42) + '...' : cause;

            return (
              <div
                key={m.machine_id}
                onClick={() => setMachineSelectionneeId(m.machine_id)}
                style={{
                  background: couleurs.fond,
                  borderRadius: 10,
                  border: `0.5px solid ${couleurs.bordure}`,
                  borderLeft: `3px solid ${couleurs.barre}`,
                  padding: '11px 13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: estSelectionnee ? `0 0 0 2px ${couleurs.barre}40` : 'none',
                  transform: estSelectionnee ? 'translateX(2px)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: couleurs.titre }}>{m.machine_nom}</span>
                  <span style={{ padding: '1px 7px', background: couleurs.barre, color: '#fff', fontSize: 9, fontWeight: 600, borderRadius: 8, letterSpacing: 0.3 }}>
                    {couleurs.label}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: couleurs.texte }}>{causeCourte}</div>
              </div>
            );
          })}
        </div>

        {/* Detail a droite */}
        {machineSelectionnee && (
          <div style={{
            background: couleursSel.fond,
            borderRadius: 12,
            border: `0.5px solid ${couleursSel.bordure}`,
            borderLeft: `3px solid ${couleursSel.barre}`,
            padding: '18px 22px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: couleursSel.barre, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconeSel size={18} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: couleursSel.titre }}>{machineSelectionnee.machine_nom}</div>
                  <div style={{ fontSize: 13, color: couleursSel.texte, marginTop: 2 }}>{machineSelectionnee.diagnostic?.message}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: couleursSel.sub, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Confiance ML</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: couleursSel.titre }}>{confianceSel}%</div>
              </div>
            </div>

            {/* Distribution Random Forest */}
            <div style={{ background: '#fff', borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginBottom: 10 }}>Distribution du modele Random Forest</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { cle: 'normal', label: 'Normal', couleur: '#639922' },
                  { cle: 'attention', label: 'Attention', couleur: '#BA7517' },
                  { cle: 'critique', label: 'Critique', couleur: '#E24B4A' },
                ].map(d => {
                  const pct = Math.round((distributionSel[d.cle] || 0) * 100);
                  return (
                    <div key={d.cle} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: '#64748B', width: 70 }}>{d.label}</span>
                      <div style={{ flex: 1, height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: d.couleur, transition: 'width 0.3s' }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#0F172A', width: 36, textAlign: 'right' }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Causes detectees */}
            {niveauSel !== 'normal' && machineSelectionnee.causes && machineSelectionnee.causes.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginBottom: 8 }}>Causes detectees</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {machineSelectionnee.causes.map((c: any, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: '#0F172A', display: 'flex', gap: 8 }}>
                      <span style={{ color: couleursSel.barre, fontWeight: 700 }}>•</span>
                      <span>{c.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions recommandees */}
            {niveauSel !== 'normal' && machineSelectionnee.actions && machineSelectionnee.actions.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginBottom: 8 }}>Actions recommandees</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {machineSelectionnee.actions.map((a: string, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: '#0F172A', display: 'flex', gap: 8 }}>
                      <span style={{ color: couleursSel.barre, fontWeight: 700, minWidth: 14 }}>{i + 1}.</span>
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message si normal */}
            {niveauSel === 'normal' && (
              <div style={{ background: '#fff', borderRadius: 8, padding: '20px 14px', textAlign: 'center' }}>
                <CheckCircle size={32} color="#639922" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 13, color: '#173404', fontWeight: 500 }}>Aucune intervention requise</div>
                <div style={{ fontSize: 11, color: '#27500A', marginTop: 4 }}>Tous les capteurs sont dans les seuils nominaux</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Encart transparence */}
      <div style={{ padding: '14px 16px', background: '#F8FAFC', borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 10, border: '0.5px solid #E2E8F0' }}>
        <Info size={14} color="#64748B" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.6 }}>
          <b>Niveau de risque (Normal / Attention / Critique) et Confiance</b> sont predits par un modele Random Forest entraine sur 100 000 echantillons industriels.
          {' '}<b>Causes detectees et actions recommandees</b> sont generees dynamiquement a partir des ecarts mesures par rapport aux seuils configures pour chaque machine.
        </div>
      </div>
    </div>
  );
}