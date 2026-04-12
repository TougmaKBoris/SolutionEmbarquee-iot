import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FournisseurAuth } from './contexte/ContexteAuthentification';
import GardienRoute from './gardiens/GardienRoute';
import Disposition from './components/disposition/Disposition';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Machines from './pages/Machines';
import Utilisateurs from './pages/Utilisateurs';
import Affectations from './pages/Affectations';
import Alertes from './pages/Alertes';
import Historique from './pages/Historique';
import Seuils from './pages/Seuils';
import AnalyseIA from './pages/AnalyseIA';

export default function App() {
  return (
    <BrowserRouter>
      <FournisseurAuth>
        <Routes>
          <Route path="/connexion" element={<Login />} />
          <Route element={<GardienRoute><Disposition /></GardienRoute>}>
            <Route path="/tableau-de-bord" element={<Dashboard />} />
            <Route path="/machines" element={<GardienRoute rolesAutorises={['admin']}><Machines /></GardienRoute>} />
            <Route path="/utilisateurs" element={<GardienRoute rolesAutorises={['admin']}><Utilisateurs /></GardienRoute>} />
            <Route path="/affectations" element={<GardienRoute rolesAutorises={['admin', 'responsable_maintenance']}><Affectations /></GardienRoute>} />
            <Route path="/alertes" element={<Alertes />} />
            <Route path="/historique" element={<GardienRoute rolesAutorises={['admin', 'responsable_maintenance']}><Historique /></GardienRoute>} />
            <Route path="/seuils" element={<GardienRoute rolesAutorises={['admin']}><Seuils /></GardienRoute>} />
            <Route path="/analyse-ia" element={<GardienRoute rolesAutorises={['admin', 'responsable_maintenance']}><AnalyseIA /></GardienRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/connexion" replace />} />
        </Routes>
      </FournisseurAuth>
    </BrowserRouter>
  );
}
