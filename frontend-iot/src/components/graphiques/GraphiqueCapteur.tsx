import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CapteurData } from '../../types';

interface Props { donnees: CapteurData[]; type: string; couleur?: string; }

const COULEURS: Record<string, string> = { temperature: '#EF4444', courant: '#3B82F6', vibration: '#F59E0B', pression: '#10B981' };

export default function GraphiqueCapteur({ donnees, type, couleur }: Props) {
  const color = couleur || COULEURS[type] || '#6366F1';
  const data = [...donnees].reverse().map(d => ({
    temps: new Date(d.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    valeur: d.valeur,
  }));

  if (data.length === 0) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', fontSize: 12 }}>Aucune donnée</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis dataKey="temps" tick={{ fontSize: 9, fill: '#94A3B8' }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} />
        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }} />
        <Line type="monotone" dataKey="valeur" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 3, fill: color }} />
      </LineChart>
    </ResponsiveContainer>
  );
}