export interface Utilisateur {
  _id: string;
  id: string;
  email: string;
  nom: string;
  role: 'admin' | 'responsable_maintenance' | 'operateur';
}
export interface Machine {
  _id: string;
  nom: string;
  capteurs: string[];
  actionneurs: string[];
  statut: 'en_ligne' | 'hors_ligne';
  createdAt: string;
}

export interface CapteurData {
  _id: string;
  machine_id: string;
  type: 'temperature' | 'courant' | 'vibration' | 'pression';
  valeur: number;
  unite: string;
  timestamp: string;
}

export interface CapteurLive {
  type: string;
  valeur: number;
  unite: string;
  timestamp: string;
}

export interface Actionneur {
  _id: string;
  machine_id: string;
  type: 'led_rouge' | 'led_verte' | 'buzzer' | 'servomoteur';
  etat: boolean;
  derniere_commande: string | null;
}

export interface Alerte {
  _id: string;
  machine_id: any;
  type_capteur: string;
  valeur: number;
  seuil_depasse: number;
  niveau: 'attention' | 'critique';
  message: string;
  resolue: boolean;
  resolue_le: string | null;
  createdAt: string;
}

export interface Seuil {
  _id: string;
  machine_id: string;
  type_capteur: string;
  valeur_min: number;
  valeur_max: number;
}

export interface Affectation {
  _id: string;
  operateur_id: any;
  machine_id: any;
  createdAt: string;
}

export interface AnalyseIA {
  mode?: string;
  message?: string;
  machines?: any;
  prediction?: number;
  statut?: string;
  actions?: string[];
  priorite?: string;
  probabilites?: any;
  timestamp?: string;
}
