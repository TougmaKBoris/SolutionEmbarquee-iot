import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import BarreNavigation from './BarreNavigation';
import utiliserTailleEcran from '../../crochets/utiliserTailleEcran';
import { Menu } from 'lucide-react';

export default function Disposition() {
  const isMobile = utiliserTailleEcran();
  const [sidebarOuverte, setSidebarOuverte] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Bouton hamburger — mobile uniquement */}
      {isMobile && (
        <button
          className="btn-hamburger"
          onClick={() => setSidebarOuverte(true)}
          aria-label="Ouvrir le menu"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Overlay sombre quand sidebar ouverte sur mobile */}
      {isMobile && sidebarOuverte && (
        <div className="overlay-mobile" onClick={() => setSidebarOuverte(false)} />
      )}

      <BarreNavigation
        isMobile={isMobile}
        ouvert={sidebarOuverte}
        fermer={() => setSidebarOuverte(false)}
      />

      <main style={{
        flex: 1,
        marginLeft: isMobile ? 0 : 260,
        padding: isMobile ? '60px 16px 24px' : '24px 32px',
        minHeight: '100vh',
      }}>
        <Outlet />
      </main>
    </div>
  );
}
