import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { utiliserAuth } from '../../contexte/ContexteAuthentification';
import { LayoutDashboard, Settings, Users, Link2, Bell, Clock, SlidersHorizontal, BrainCircuit, LogOut } from 'lucide-react';

const s = {
  sidebar: { width: 240, height: '100vh', background: '#fff', borderRight: '1px solid #F1F5F9', display: 'flex' as const, flexDirection: 'column' as const, position: 'fixed' as const, left: 0, top: 0, zIndex: 100, overflowY: 'auto' as const },
  logo: { display: 'flex', alignItems: 'center', gap: 12, padding: '24px 20px 20px', borderBottom: '1px solid #F1F5F9' },
  logoIcon: { width: 38, height: 38, background: '#4F46E5', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#fff', flexShrink: 0 },
  logoTitre: { fontSize: 15, fontWeight: 600, color: '#0F172A', lineHeight: 1.2 },
  logoSous: { fontSize: 11, color: '#94A3B8' },
  liens: { flex: 1, padding: '8px 12px', overflowY: 'auto' as const },
  section: { fontSize: 10, fontWeight: 600, color: '#94A3B8', letterSpacing: 1, padding: '20px 12px 8px', textTransform: 'uppercase' as const },
  lien: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, color: '#64748B', fontSize: 14, fontWeight: 500, transition: 'all 0.2s', marginBottom: 2 },
  lienActif: { background: '#4F46E5', color: '#fff' },
  user: { display: 'flex', alignItems: 'center', gap: 10, padding: 16, borderTop: '1px solid #F1F5F9', marginTop: 'auto' },
  avatar: { width: 34, height: 34, borderRadius: '50%', background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#fff', flexShrink: 0 },
  btnDeco: { background: 'none', border: 'none', color: '#94A3B8', padding: 6, borderRadius: 6, cursor: 'pointer' },
};

export default function BarreNavigation() {
  const { utilisateur, deconnexion } = utiliserAuth();
  const navigate = useNavigate();
  const role = utilisateur?.role;
  const initiales = utilisateur?.nom?.substring(0, 2).toUpperCase() || 'SE';

  const handleDeco = () => { deconnexion(); navigate('/connexion'); };

  const lien = (to: string, label: string, Icone: any) => (
    <NavLink to={to} style={({ isActive }) => ({ ...s.lien, ...(isActive ? s.lienActif : {}) })}>
      <Icone size={20} /> <span>{label}</span>
    </NavLink>
  );

  return (
    <nav style={s.sidebar}>
      <div style={s.logo}>
        <div style={s.logoIcon}>SE</div>
        <div>
          <div style={s.logoTitre}>Solution Embarquée</div>
          <div style={s.logoSous}>Plateforme IoT Industrielle</div>
        </div>
      </div>

      <div style={s.liens}>
        <div style={s.section}>MENU PRINCIPAL</div>
        {lien('/tableau-de-bord', role === 'operateur' ? 'Ma machine' : 'Tableau de bord', LayoutDashboard)}
        {role === 'admin' && lien('/machines', 'Machines', Settings)}

        {(role === 'admin' || role === 'responsable_maintenance') && (
          <div style={s.section}>GESTION</div>
        )}
        {role === 'admin' && lien('/utilisateurs', 'Utilisateurs', Users)}
        {(role === 'admin' || role === 'responsable_maintenance') && lien('/affectations', 'Affectations', Link2)}

        <div style={s.section}>SURVEILLANCE</div>
        {lien('/alertes', 'Alertes', Bell)}
        {(role === 'admin' || role === 'responsable_maintenance') && lien('/historique', 'Historique', Clock)}
        {role === 'admin' && lien('/seuils', 'Seuils', SlidersHorizontal)}

        {(role === 'admin' || role === 'responsable_maintenance') && (<>
          <div style={s.section}>INTELLIGENCE</div>
          {lien('/analyse-ia', 'Analyse IA', BrainCircuit)}
        </>)}
      </div>

      <div style={s.user}>
        <div style={s.avatar}>{initiales}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{utilisateur?.nom}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{utilisateur?.email}</div>
        </div>
        <button style={s.btnDeco} onClick={handleDeco} title="Déconnexion"><LogOut size={18} /></button>
      </div>
    </nav>
  );
}