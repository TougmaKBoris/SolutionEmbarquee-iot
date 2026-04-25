import { useState, useEffect } from 'react';

export default function utiliserTailleEcran(seuil = 768) {
  const [estMobile, setEstMobile] = useState(window.innerWidth <= seuil);
  useEffect(() => {
    const handler = () => setEstMobile(window.innerWidth <= seuil);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [seuil]);
  return estMobile;
}
