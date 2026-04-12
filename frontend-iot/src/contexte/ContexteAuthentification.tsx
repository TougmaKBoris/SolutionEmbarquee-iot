import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { Utilisateur } from '../types';

interface ContexteAuth {
  utilisateur: Utilisateur | null;
  jeton: string | null;
  connexion: (email: string, mot_de_passe: string) => Promise<void>;
  deconnexion: () => void;
  chargement: boolean;
}

const AuthContext = createContext<ContexteAuth>({} as ContexteAuth);

export function FournisseurAuth({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [jeton, setJeton] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);

  // Au chargement, vérifier si un token existe déjà
  useEffect(() => {
    const jetonSauvegarde = localStorage.getItem('jeton');
    const userSauvegarde = localStorage.getItem('utilisateur');
    if (jetonSauvegarde && userSauvegarde) {
      setJeton(jetonSauvegarde);
      setUtilisateur(JSON.parse(userSauvegarde));
    }
    setChargement(false);
  }, []);

  const connexion = async (email: string, mot_de_passe: string) => {
    const response = await api.post('/auth/login', { email, mot_de_passe });
    const { jeton: nouveauJeton, utilisateur: user } = response.data;
    localStorage.setItem('jeton', nouveauJeton);
    localStorage.setItem('utilisateur', JSON.stringify(user));
    setJeton(nouveauJeton);
    setUtilisateur(user);
  };

  const deconnexion = () => {
    localStorage.removeItem('jeton');
    localStorage.removeItem('utilisateur');
    setJeton(null);
    setUtilisateur(null);
  };

  return (
    <AuthContext.Provider value={{ utilisateur, jeton, connexion, deconnexion, chargement }}>
      {children}
    </AuthContext.Provider>
  );
}

export const utiliserAuth = () => useContext(AuthContext);
