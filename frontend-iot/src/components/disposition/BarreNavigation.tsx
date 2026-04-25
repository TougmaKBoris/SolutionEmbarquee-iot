import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { utiliserAuth } from '../../contexte/ContexteAuthentification';
import { LayoutDashboard, Settings, Users, Link2, Bell, Clock, SlidersHorizontal, BrainCircuit, LogOut, X } from 'lucide-react';

const s = {
  sidebar: { width: 260, height: '100vh', background: '#fff', borderRight: '1px solid #E2E8F0', display: 'flex' as const, flexDirection: 'column' as const, position: 'fixed' as const, left: 0, top: 0, zIndex: 100, overflowY: 'auto' as const },
  logo: { display: 'flex', alignItems: 'center', gap: 12, padding: '20px', borderBottom: '1px solid #E2E8F0' },
  logoIcon: { width: 34, height: 34, background: '#2563EB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff', flexShrink: 0 },
  logoTitre: { fontSize: 14, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 },
  logoSous: { fontSize: 11, color: '#334155', marginTop: 2 },
  liens: { flex: 1, padding: '12px', overflowY: 'auto' as const },
  section: { fontSize: 10, fontWeight: 700, color: '#334155', letterSpacing: 1, padding: '16px 12px 8px', textTransform: 'uppercase' as const },
  lien: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 8, color: '#334155', fontSize: 13, fontWeight: 500, transition: 'all 0.2s', marginBottom: 2 },
  lienActif: { background: '#2563EB', color: '#fff', fontWeight: 600 },
  user: { display: 'flex', alignItems: 'center', gap: 10, padding: '16px', borderTop: '1px solid #E2E8F0', marginTop: 'auto', background: '#F8FAFC' },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 },
  btnDeco: { background: 'none', border: 'none', color: '#EF4444', padding: 6, borderRadius: 6, cursor: 'pointer', transition: 'background 0.2s' },
  btnFermer: { background: 'none', border: 'none', color: '#64748B', padding: 4, borderRadius: 6, cursor: 'pointer', marginLeft: 'auto', display: 'flex', alignItems: 'center' },
};

interface Props {
  isMobile: boolean;
  ouvert: boolean;
  fermer: () => void;
}

export default function BarreNavigation({ isMobile, ouvert, fermer }: Props) {
  const { utilisateur, deconnexion } = utiliserAuth();
  const navigate = useNavigate();
  const role = utilisateur?.role;
  const initiales = utilisateur?.nom?.substring(0, 2).toUpperCase() || 'SE';

  const handleDeco = () => { deconnexion(); navigate('/connexion'); };

  const lien = (to: string, label: string, Icone: any) => (
    <NavLink
      to={to}
      onClick={fermer}
      style={({ isActive }) => ({ ...s.lien, ...(isActive ? s.lienActif : {}) })}
    >
      <Icone size={20} /> <span>{label}</span>
    </NavLink>
  );

  const sidebarStyle = {
    ...s.sidebar,
    transform: isMobile && !ouvert ? 'translateX(-260px)' : 'translateX(0)',
    transition: 'transform 0.25s ease',
  };

  return (
    <nav style={sidebarStyle}>
      <div style={s.logo}>
        <div style={s.logoIcon}>SE</div>
        <div style={{ flex: 1 }}>
          <div style={s.logoTitre}>Solution Embarquée</div>
          <div style={s.logoSous}>Plateforme IoT Industrielle</div>
        </div>
        {isMobile && (
          <button style={s.btnFermer} onClick={fermer} aria-label="Fermer">
            <X size={18} />
          </button>
        )}
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
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{utilisateur?.nom}</div>
          <div style={{ fontSize: 11, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{utilisateur?.email}</div>
        </div>
        <button style={s.btnDeco} onClick={handleDeco} title="Déconnexion"><LogOut size={16} /></button>
      </div>
    </nav>
  );
}
