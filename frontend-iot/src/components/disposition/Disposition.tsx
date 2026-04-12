import React from 'react';
import { Outlet } from 'react-router-dom';
import BarreNavigation from './BarreNavigation';

export default function Disposition() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <BarreNavigation />
      <main style={{ flex: 1, marginLeft: 240, padding: '28px 32px', minHeight: '100vh', background: '#F8FAFC' }}>
        <Outlet />
      </main>
    </div>
  );
}
