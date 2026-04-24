import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Brain, AlertOctagon, AlertTriangle, CheckCircle, Info, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';

function Sparkline({ valeurs, seuilMax, seuilMin, couleur }: { valeurs: number[], seuilMax: number, seuilMin: number, couleur: string }) {
  if (valeurs.length < 2) return null;
  const W = 120, H = 36;
  const min = Math.min(...valeurs, seuilMin) * 0.97;
  const max = Math.max(...valeurs, seuilMax) * 1.03;
  const scaleY = (v: number) => H - ((v - min) / (max - min)) * H;
  const scaleX = (i: number) => (i / (valeurs.length - 1)) * W;
  const pts = valeurs.map((v, i) => `${scaleX(i)},${scaleY(v)}`).join(' ');
  const yMax = scaleY(seuilMax);
  const yMin = scaleY(seuilMin);
  return (
    <svg width={W} height={H} style={{ overflow: 'visible' }}>
      {seuilMax <= max && <line x1={0} y1={yMax} x2={W} y2={yMax} stroke="#E24B4A" strokeWidth={1} strokeDasharray="3,2" opacity={0.7} />}
      {seuilMin >= min && <line x1={0} y1={yMin} x2={W} y2={yMin} stroke="#3B82F6" strokeWidth={1} strokeDasharray="3,2" opacity={0.7} />}
      <polyline points={pts} fill="none" stroke={couleur} strokeWidth={2} strokeLinejoin="round" />
      <circle cx={scaleX(valeurs.length - 1)} cy={scaleY(valeurs[valeurs.length - 1])} r={3} fill={couleur} />
    </svg>
  );
}

export default function AnalyseIA() {
  const [analyse, setAnalyse] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [machineSelectionneeId, setMachineSelectionneeId] = useState<string | null>(null);
  const [tendances, setTendances] = useState<any>(null);

  const charger = async () => {
    try {
      const res = await api.get('/ia/analyse');
      setAnalyse(res.data);
    } catch (err) {
      console.error('Erreur analyse IA:', err);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
    const interval = setInterval(charger, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!machineSelectionneeId) return;
    setTendances(null);
    api.get(`/ia/tendances/${machineSelectionneeId}`)
      .then(res => setTendances(res.data))
      .catch(() => setTendances(null));
  }, [machineSelectionneeId]);

  const triees = useMemo(() => {
    if (!analyse?.analyses) return [];
    const ordre: Record<string, number> = { critique: 0, attention: 1, normal: 2 };
    return [...analyse.analyses].sort((a: any, b: any) => {
      const niveauA = a.diagnostic?.niveau || 'normal';
      const niveauB = b.diagnostic?.niveau || 'normal';
      return (ordre[niveauA] ?? 3) - (ordre[niveauB] ?? 3);
    });
  }, [analyse]);

  // Selection auto : premiere machine de la liste triee (la plus critique)
  useEffect(() => {
    if (triees.length > 0 && !machineSelectionneeId) {
      setMachineSelectionneeId(triees[0].machine_id);
    }
  }, [triees, machineSelectionneeId]);

  if (chargement) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Chargement de l'analyse...</div>;
  }

  if (!analyse || analyse.mode === 'degrade') {
    return (
      <div style={{ maxWidth: 1200 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Analyse IA</h1>
        <div style={{ marginTop: 24, padding: 24, background: '#F1F5F9', borderRadius: 12, textAlign: 'center', color: '#64748B' }}>
          Service IA non connecte. Verifiez que le micro-service Python est demarre sur le port 8000.
        </div>
      </div>
    );
  }

  const stats = {
    total: triees.length,
    normales: triees.filter((a: any) => a.diagnostic?.niveau === 'normal').length,
    attention: triees.filter((a: any) => a.diagnostic?.niveau === 'attention').length,
    critiques: triees.filter((a: any) => a.diagnostic?.niveau === 'critique').length,
  };

  const machineSelectionnee = triees.find((m: any) => m.machine_id === machineSelectionneeId) || triees[0];

  const getCouleurs = (niveau: string) => {
    if (niveau === 'critique') return { fond: '#FCEBEB', bordure: '#F09595', barre: '#E24B4A', titre: '#501313', texte: '#791F1F', label: 'PANNE ACTIVE', sub: '#A32D2D' };
    if (niveau === 'attention') return { fond: '#FAEEDA', bordure: '#FAC775', barre: '#BA7517', titre: '#412402', texte: '#633806', label: 'PANNE PREDITE', sub: '#854F0B' };
    return { fond: '#EAF3DE', bordure: '#C0DD97', barre: '#639922', titre: '#173404', texte: '#27500A', label: 'NORMAL', sub: '#3B6D11' };
  };

  const getIcone = (niveau: string) => {
    if (niveau === 'critique') return AlertOctagon;
    if (niveau === 'attention') return AlertTriangle;
    return CheckCircle;
  };

  const niveauSel = machineSelectionnee?.diagnostic?.niveau || 'normal';
  const couleursSel = getCouleurs(niveauSel);
  const IconeSel = getIcone(niveauSel);
  const distributionSel = machineSelectionnee?.prediction?.distribution || { normal: 0, attention: 0, critique: 0 };
  const confianceSel = Math.round((machineSelectionnee?.prediction?.confiance || 0) * 100);

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>Analyse IA</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Maintenance predictive du parc machines</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#EEEDFE', borderRadius: 20 }}>
          <Brain size={14} color="#534AB7" />
          <span style={{ fontSize: 11, color: '#3C3489', fontWeight: 600 }}>Maintenance predictive — Random Forest</span>
        </div>
      </div>

      {/* Stats globales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Total machines</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>{stats.total}</div>
        </div>
        <div style={{ background: '#EAF3DE', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 10, color: '#3B6D11', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Normales</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#173404' }}>{stats.normales}</div>
        </div>
        <div style={{ background: '#FAEEDA', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 10, color: '#854F0B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Pannes predites</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#412402' }}>{stats.attention}</div>
        </div>
        <div style={{ background: '#FCEBEB', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 10, color: '#791F1F', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Critiques</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#501313' }}>{stats.critiques}</div>
        </div>
      </div>

      {/* Vue maitre/detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 14, marginBottom: 20 }}>

        {/* Liste a gauche */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {triees.map((m: any) => {
            const niveau = m.diagnostic?.niveau || 'normal';
            const couleurs = getCouleurs(niveau);
            const estSelectionnee = m.machine_id === machineSelectionneeId;
            const cause = m.causes && m.causes.length > 0 ? m.causes[0].description : 'Tous capteurs nominaux';
            const causeCourte = cause.length > 45 ? cause.substring(0, 42) + '...' : cause;

            return (
              <div
                key={m.machine_id}
                onClick={() => setMachineSelectionneeId(m.machine_id)}
                style={{
                  background: couleurs.fond,
                  borderRadius: 10,
                  border: `0.5px solid ${couleurs.bordure}`,
                  borderLeft: `3px solid ${couleurs.barre}`,
                  padding: '11px 13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: estSelectionnee ? `0 0 0 2px ${couleurs.barre}40` : 'none',
                  transform: estSelectionnee ? 'translateX(2px)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: couleurs.titre }}>{m.machine_nom}</span>
                  <span style={{ padding: '1px 7px', background: couleurs.barre, color: '#fff', fontSize: 9, fontWeight: 600, borderRadius: 8, letterSpacing: 0.3 }}>
                    {couleurs.label}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: couleurs.texte }}>{causeCourte}</div>
              </div>
            );
          })}
        </div>

        {/* Detail a droite */}
        {machineSelectionnee && (
          <div style={{
            background: couleursSel.fond,
            borderRadius: 12,
            border: `0.5px solid ${couleursSel.bordure}`,
            borderLeft: `3px solid ${couleursSel.barre}`,
            padding: '18px 22px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: couleursSel.barre, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconeSel size={18} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: couleursSel.titre }}>{machineSelectionnee.machine_nom}</div>
                  <div style={{ fontSize: 13, color: couleursSel.texte, marginTop: 2 }}>{machineSelectionnee.diagnostic?.message}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: couleursSel.sub, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Confiance prediction</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: couleursSel.titre }}>{confianceSel}%</div>
              </div>
            </div>

            {/* Bandeau prédiction */}
            {niveauSel === 'attention' && (
              <div style={{ background: '#FFF3CD', border: '0.5px solid #FAC775', borderRadius: 8, padding: '10px 14px', marginBottom: 10, fontSize: 12, color: '#412402' }}>
                <b>Prediction :</b> Le modele predit une panne imminente avec <b>{confianceSel}% de confiance</b>. Intervenir avant que l'etat devienne critique.
              </div>
            )}
            {niveauSel === 'critique' && (
              <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 8, padding: '10px 14px', marginBottom: 10, fontSize: 12, color: '#501313' }}>
                <b>Prediction :</b> Le modele detecte une panne active avec <b>{confianceSel}% de confiance</b>. Intervention immediate requise.
              </div>
            )}

            {/* Distribution Random Forest */}
            <div style={{ background: '#fff', borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginBottom: 10 }}>Probabilites predites par le modele Random Forest</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { cle: 'normal', label: 'Normal', couleur: '#639922' },
                  { cle: 'attention', label: 'Attention', couleur: '#BA7517' },
                  { cle: 'critique', label: 'Critique', couleur: '#E24B4A' },
                ].map(d => {
                  const pct = Math.round((distributionSel[d.cle] || 0) * 100);
                  return (
                    <div key={d.cle} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: '#64748B', width: 70 }}>{d.label}</span>
                      <div style={{ flex: 1, height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: d.couleur, transition: 'width 0.3s' }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#0F172A', width: 36, textAlign: 'right' }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Causes detectees */}
            {niveauSel !== 'normal' && machineSelectionnee.causes && machineSelectionnee.causes.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginBottom: 8 }}>Causes detectees</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {machineSelectionnee.causes.map((c: any, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: '#0F172A', display: 'flex', gap: 8 }}>
                      <span style={{ color: couleursSel.barre, fontWeight: 700 }}>•</span>
                      <span>{c.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions recommandees */}
            {niveauSel !== 'normal' && machineSelectionnee.actions && machineSelectionnee.actions.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginBottom: 8 }}>Actions recommandees</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {machineSelectionnee.actions.map((a: string, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: '#0F172A', display: 'flex', gap: 8 }}>
                      <span style={{ color: couleursSel.barre, fontWeight: 700, minWidth: 14 }}>{i + 1}.</span>
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message si normal */}
            {niveauSel === 'normal' && (
              <div style={{ background: '#fff', borderRadius: 8, padding: '20px 14px', textAlign: 'center' }}>
                <CheckCircle size={32} color="#639922" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 13, color: '#173404', fontWeight: 500 }}>Aucune intervention requise</div>
                <div style={{ fontSize: 11, color: '#27500A', marginTop: 4 }}>Tous les capteurs sont dans les seuils nominaux</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section tendances prédictives */}
      {tendances && tendances.tendances && tendances.tendances.length > 0 && (() => {
        const nomsCapteurs: Record<string, string> = {
          temperature: 'Température',
          courant: 'Courant',
          vibration: 'Vibration',
          pression: 'Pression',
        };

        const formatTemps = (min: number) => {
          const h = Math.floor(min / 60);
          const m = min % 60;
          return h > 0 ? `${h}h${m > 0 ? m + 'min' : ''}` : `${m}min`;
        };

        const enDegradation = tendances.tendances.filter((t: any) => t.alertePrecoce);

        return (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>Analyse de tendance — Dégradation progressive</div>

            {/* Résumé prédictif */}
            {enDegradation.length > 0 && (
              <div style={{ background: '#FFF3CD', border: '1px solid #FFC107', borderRadius: 10, padding: '12px 16px', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <AlertTriangle size={14} color="#B45309" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>
                    {enDegradation.length} capteur{enDegradation.length > 1 ? 's' : ''} en dégradation — intervention préventive recommandée
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {enDegradation.map((t: any) => {
                    const nom = nomsCapteurs[t.capteur] || t.capteur;
                    const direction = t.direction === 'hausse' ? 'monte' : 'descend';
                    const seuil = t.typeDepassement === 'max' ? `seuil max ${t.seuilMax}${t.unite}` : `seuil min ${t.seuilMin}${t.unite}`;
                    const temps = formatTemps(t.tempsAvantSeuilMinutes);
                    return (
                      <div key={t.capteur} style={{ fontSize: 12, color: '#78350F', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{ color: '#B45309', fontWeight: 700, flexShrink: 0 }}>▶</span>
                        <span>
                          <b>{nom}</b> {direction} progressivement ({t.direction === 'hausse' ? '+' : '-'}{Math.abs(t.penteParMinute).toFixed(2)} {t.unite}/min) — actuellement <b>{t.valeurActuelle.toFixed(1)} {t.unite}</b>, {seuil} atteint dans <b>~{temps}</b>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cartes par capteur */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {tendances.tendances.map((t: any) => {
                const alertePrecoce = t.alertePrecoce;
                const fondCarte = alertePrecoce ? '#FFF8E1' : '#F8FAFC';
                const bordureCarte = alertePrecoce ? '#FFC107' : '#E2E8F0';
                const valeurs = t.valeurs.map((v: any) => v.valeur);
                const IconeTendance = t.direction === 'hausse' ? TrendingUp : t.direction === 'baisse' ? TrendingDown : Minus;
                const couleurTendance = t.direction === 'hausse' ? '#E24B4A' : t.direction === 'baisse' ? '#3B82F6' : '#64748B';
                const couleurSparkline = alertePrecoce ? '#E24B4A' : '#534AB7';
                const nom = nomsCapteurs[t.capteur] || t.capteur;

                const distanceSeuil = t.typeDepassement === 'max'
                  ? Math.round(((t.seuilMax - t.valeurActuelle) / (t.seuilMax - t.seuilMin)) * 100)
                  : Math.round(((t.valeurActuelle - t.seuilMin) / (t.seuilMax - t.seuilMin)) * 100);
                const pctVersMax = Math.round(((t.valeurActuelle - t.seuilMin) / (t.seuilMax - t.seuilMin)) * 100);

                return (
                  <div key={t.capteur} style={{ background: fondCarte, border: `0.5px solid ${bordureCarte}`, borderLeft: `3px solid ${alertePrecoce ? '#FFC107' : '#E2E8F0'}`, borderRadius: 10, padding: '12px 14px' }}>
                    {/* En-tête */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{nom}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <IconeTendance size={11} color={couleurTendance} />
                          <span style={{ fontSize: 10, color: couleurTendance, fontWeight: 600 }}>
                            {t.direction === 'stable' ? 'Stable' : t.direction === 'hausse' ? 'En hausse' : 'En baisse'} ({t.direction === 'hausse' ? '+' : t.direction === 'baisse' ? '-' : ''}{Math.abs(t.penteParMinute).toFixed(2)} {t.unite}/min)
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: alertePrecoce ? '#92400E' : '#0F172A' }}>
                          {t.valeurActuelle.toFixed(1)}<span style={{ fontSize: 11, fontWeight: 400, color: '#64748B' }}> {t.unite}</span>
                        </div>
                        <div style={{ fontSize: 10, color: '#64748B' }}>
                          [{t.seuilMin} — {t.seuilMax}] {t.unite}
                        </div>
                      </div>
                    </div>

                    {/* Barre de progression vers le seuil */}
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#94A3B8', marginBottom: 2 }}>
                        <span>min {t.seuilMin}{t.unite}</span>
                        <span>{pctVersMax}% vers max</span>
                        <span>max {t.seuilMax}{t.unite}</span>
                      </div>
                      <div style={{ height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(100, Math.max(0, pctVersMax))}%`,
                          height: '100%',
                          background: pctVersMax > 85 ? '#E24B4A' : pctVersMax > 70 ? '#FFC107' : '#639922',
                          borderRadius: 3,
                          transition: 'width 0.3s',
                        }} />
                      </div>
                    </div>

                    {/* Sparkline */}
                    <Sparkline valeurs={valeurs} seuilMax={t.seuilMax} seuilMin={t.seuilMin} couleur={couleurSparkline} />

                    {/* Alerte précoce détaillée */}
                    {alertePrecoce && t.tempsAvantSeuilMinutes !== null && (
                      <div style={{ marginTop: 8, padding: '7px 10px', background: '#FEF3C7', border: '0.5px solid #F59E0B', borderRadius: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                          <Clock size={11} color="#B45309" style={{ flexShrink: 0, marginTop: 1 }} />
                          <div style={{ fontSize: 11, color: '#78350F', lineHeight: 1.5 }}>
                            <b>Alerte prédictive :</b> La {nom.toLowerCase()} {t.direction === 'hausse' ? 'monte' : 'descend'} vers le seuil {t.typeDepassement === 'max' ? 'maximum' : 'minimum'} ({t.typeDepassement === 'max' ? t.seuilMax : t.seuilMin} {t.unite}).
                            {' '}À ce rythme, le seuil sera dépassé dans <b>~{formatTemps(t.tempsAvantSeuilMinutes)}</b>.
                            {' '}Il reste <b>{t.typeDepassement === 'max' ? (t.seuilMax - t.valeurActuelle).toFixed(1) : (t.valeurActuelle - t.seuilMin).toFixed(1)} {t.unite}</b> avant le dépassement.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Encart transparence */}
      <div style={{ padding: '14px 16px', background: '#F8FAFC', borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 10, border: '0.5px solid #E2E8F0' }}>
        <Info size={14} color="#64748B" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.6 }}>
          <b>Analyse predictive Random Forest</b> — predit l'etat futur (Normal / Panne predite / Panne active) a partir des capteurs.
          {' '}<b>Analyse de tendance</b> — regression lineaire sur les 20 dernieres mesures pour calculer la vitesse de degradation et estimer le temps avant depassement de seuil.
          {' '}<b>"Panne predite"</b> = le modele anticipe une panne avant qu'elle survienne. L'alerte precoce se declenche si le seuil sera atteint dans moins de 2h.
        </div>
      </div>
    </div>
  );
}