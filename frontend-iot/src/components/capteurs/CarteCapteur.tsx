import React from 'react';
import { Thermometer, Zap, Activity, Gauge } from 'lucide-react';
import { CapteurLive } from '../../types';

interface Props { capteur: CapteurLive; }

const CONFIG: Record<string, { icone: any; couleur: string; fond: string; label: string }> = {
  temperature: { icone: Thermometer, couleur: '#EF4444', fond: '#FEF2F2', label: 'Température' },
  courant:     { icone: Zap,         couleur: '#2563EB', fond: '#EFF6FF', label: 'Courant' },
  vibration:   { icone: Activity,    couleur: '#F59E0B', fond: '#FFFBEB', label: 'Vibration' },
  pression:    { icone: Gauge,       couleur: '#10B981', fond: '#ECFDF5', label: 'Pression' },
};

export default function CarteCapteur({ capteur }: Props) {
  const config = CONFIG[capteur.type] || CONFIG.temperature;
  const Icone = config.icone;

  return (
    <div style={{ background: config.fond, borderRadius: 12, padding: '16px 20px', transition: 'all 0.2s', border: '1px solid #F8FAFC' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: config.couleur, textTransform: 'uppercase', letterSpacing: 0.5 }}>{config.label}</span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icone size={18} color={config.couleur} />
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: config.couleur, lineHeight: 1, marginBottom: 4, marginTop: 4 }}>
        {capteur.valeur}<span style={{ fontSize: 12, fontWeight: 600, color: config.couleur, opacity: 0.8, marginLeft: 4 }}>{capteur.unite}</span>
      </div>
    </div>
  );
}
