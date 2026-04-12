import React from 'react';
import { Brain, AlertTriangle, AlertOctagon, ArrowRight } from 'lucide-react';

interface Props {
  analyse: any;
  onVoirDetails?: () => void;
}

export default function PanneauIA({ analyse, onVoirDetails }: Props) {
  if (!analyse) return null;

  if (analyse.mode === 'degrade') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#F1F5F9', border: '0.5px solid #CBD5E1', borderLeft: '3px solid #64748B', borderRadius: '0 10px 10px 0' }}>
        <Brain size={18} color="#64748B" />
        <div style={{ fontSize: 12, color: '#475569' }}>Service IA non connecte — mode degrade actif</div>
      </div>
    );
  }

  const analyses = analyse.analyses || [];
  if (analyses.length === 0) return null;

  const machineAnalyse = analyses[0];
  if (!machineAnalyse || !machineAnalyse.diagnostic) return null;

  const niveau = machineAnalyse.diagnostic.niveau;

  if (niveau === 'normal') return null;

  const estCritique = niveau === 'critique';
  const couleurs = estCritique
    ? { fond: '#FCEBEB', bordure: '#F09595', barre: '#E24B4A', fondIcone: '#E24B4A', titre: '#791F1F', texte: '#A32D2D', label: 'Critique' }
    : { fond: '#FAEEDA', bordure: '#FAC775', barre: '#BA7517', fondIcone: '#BA7517', titre: '#412402', texte: '#854F0B', label: 'Attention' };

  const cause = machineAnalyse.causes && machineAnalyse.causes.length > 0
    ? machineAnalyse.causes[0].description
    : machineAnalyse.diagnostic.message;

  const Icone = estCritique ? AlertOctagon : AlertTriangle;

  return (
    <div style={{ background: couleurs.fond, border: `0.5px solid ${couleurs.bordure}`, borderLeft: `3px solid ${couleurs.barre}`, borderRadius: '0 10px 10px 0', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: couleurs.fondIcone, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icone size={16} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: couleurs.texte, textTransform: 'uppercase', letterSpacing: 0.5 }}>Analyse IA</span>
            <span style={{ padding: '2px 8px', background: couleurs.barre, color: '#fff', fontSize: 10, fontWeight: 600, borderRadius: 10 }}>{couleurs.label}</span>
          </div>
          <div style={{ fontSize: 12, color: couleurs.titre }}>{cause}</div>
        </div>
      </div>
      {onVoirDetails && (
        <button onClick={onVoirDetails} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: '#fff', color: couleurs.texte, border: `0.5px solid ${couleurs.barre}`, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Voir l'analyse <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
}