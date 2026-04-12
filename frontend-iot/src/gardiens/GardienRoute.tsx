import React from 'react';
import { Navigate } from 'react-router-dom';
import { utiliserAuth } from '../contexte/ContexteAuthentification';

interface Props {
  children: React.ReactNode;
  rolesAutorises?: string[];
}

export default function GardienRoute({ children, rolesAutorises }: Props) {
  const { utilisateur, chargement } = utiliserAuth();

  if (chargement) return <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>;

  // Si pas connecté, rediriger vers la page de connexion
  if (!utilisateur) return <Navigate to="/connexion" replace />;

  // Si des rôles sont spécifiés, vérifier que l'utilisateur a le bon rôle
  if (rolesAutorises && !rolesAutorises.includes(utilisateur.role)) {
    return <Navigate to="/tableau-de-bord" replace />;
  }

  return <>{children}</>;
}
