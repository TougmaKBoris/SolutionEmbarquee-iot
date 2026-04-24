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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#F1F5F9', border: '0.5px solid #CBD5E1', borderLeft: '3px solid #475569', borderRadius: '0 10px 10px 0' }}>
        <Brain size={18} color="#475569" />
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
  const accentColor = estCritique ? '#DC2626' : '#D97706';
  const iconeColor = estCritique ? '#DC2626' : '#D97706';
  const labelText = estCritique ? 'Critique' : 'Attention';

  const cause = machineAnalyse.causes && machineAnalyse.causes.length > 0
    ? machineAnalyse.causes[0].description
    : machineAnalyse.diagnostic.message;

  const Icone = estCritique ? AlertOctagon : AlertTriangle;

  return (
    <div style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', borderLeft: `4px solid ${accentColor}`, borderRadius: '0 8px 8px 0', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <Icone size={16} color={iconeColor} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>Analyse IA</span>
            <span style={{ padding: '1px 6px', background: accentColor, color: '#fff', fontSize: 10, fontWeight: 600, borderRadius: 8 }}>{labelText}</span>
          </div>
          <div style={{ fontSize: 12, color: '#0F172A', fontWeight: 500 }}>{cause}</div>
        </div>
      </div>
      {onVoirDetails && (
        <button onClick={onVoirDetails} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', background: '#fff', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Voir l'analyse <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
}