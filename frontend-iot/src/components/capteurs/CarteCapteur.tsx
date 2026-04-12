import React from 'react';
import { Thermometer, Zap, Activity, Gauge } from 'lucide-react';
import { CapteurLive } from '../../types';

interface Props { capteur: CapteurLive; }

const CONFIG: Record<string, { icone: any; couleur: string; fond: string; label: string }> = {
  temperature: { icone: Thermometer, couleur: '#EF4444', fond: '#FEF2F2', label: 'Température' },
  courant:     { icone: Zap,         couleur: '#3B82F6', fond: '#EFF6FF', label: 'Courant' },
  vibration:   { icone: Activity,    couleur: '#F59E0B', fond: '#FFFBEB', label: 'Vibration' },
  pression:    { icone: Gauge,       couleur: '#10B981', fond: '#ECFDF5', label: 'Pression' },
};

export default function CarteCapteur({ capteur }: Props) {
  const config = CONFIG[capteur.type] || CONFIG.temperature;
  const Icone = config.icone;

  return (
    <div style={{ background: config.fond, borderRadius: 12, padding: 18, transition: 'all 0.2s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: config.couleur, textTransform: 'uppercase', letterSpacing: 0.5 }}>{config.label}</span>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icone size={20} color={config.couleur} />
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', lineHeight: 1, marginBottom: 6 }}>
        {capteur.valeur}<span style={{ fontSize: 14, fontWeight: 500, color: '#64748B', marginLeft: 2 }}>{capteur.unite}</span>
      </div>
    </div>
  );
}
