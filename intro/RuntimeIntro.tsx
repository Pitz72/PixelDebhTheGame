// ====================================================================
//  The Runtime Multimedia logo at the start of the game.
// --------------------------------------------------------------------
//  Adapted from "Il Relitto Silente" (loghi/Loghi.tsx), same author, with only the Runtime logo: a
//  TV that turns on, writes the mark and switches off like a CRT. One clock (requestAnimationFrame)
//  gives the logo its time; the sound (runtimeSound.ts) is scheduled all at once on the audio clock
//  and the picture starts with it.
//  It starts after half a second of black (`NERO_MS`), counted from when this component appears; the
//  first 0.58 s of the logo's own timeline are black too, so they are skipped (`SALTO`) to make the
//  black before the TV line really half a second.
//  Esc, Enter, Space or a click skip it. With "reduced motion" (the option, or the system asking for it) it is not shown.
//  It is drawn in units of the window (vw / vh), so it must sit outside the scaled 1920x1080 stage.
// ====================================================================
import React, { useCallback, useEffect, useRef } from 'react';
import LogoRuntime, { DURATA_RUNTIME, type Animabile } from './LogoRuntime';
import { SuonoRuntime } from './runtimeSound';
import * as soundService from '../services/soundService';
import { reduceMotion } from '../services/settings';

export const NERO_MS = 500;
const SALTO = 0.58;

interface RuntimeIntroProps {
  onDone: () => void;
}

const RuntimeIntro: React.FC<RuntimeIntroProps> = ({ onDone }) => {
  const logo = useRef<Animabile>(null);
  const fatto = useRef(false);
  const fine = useRef(onDone);
  fine.current = onDone;

  const chiudi = useCallback(() => {
    if (fatto.current) return;
    fatto.current = true;
    fine.current();
  }, []);

  useEffect(() => {
    if (reduceMotion()) {
      chiudi();
      return;
    }
    let vivo = true;
    let raf = 0;
    let suono: SuonoRuntime | null = null;
    const montato = performance.now();

    void (async () => {
      const quando = montato + NERO_MS;
      if (!soundService.isMuted()) suono = await SuonoRuntime.avvia(soundService.getVolume('master'), quando, SALTO);
      if (!vivo) {
        suono?.sfuma(0.05);
        return;
      }
      const inizio = suono?.inizioMs ?? Math.max(performance.now(), quando);
      const passo = (ora: number) => {
        const t = SALTO + (ora - inizio) / 1000;
        logo.current?.aggiorna(t);
        if (t >= DURATA_RUNTIME) {
          chiudi();
          return;
        }
        raf = requestAnimationFrame(passo);
      };
      raf = requestAnimationFrame(passo);
    })();

    const tasto = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        chiudi();
      }
    };
    window.addEventListener('keydown', tasto);
    return () => {
      vivo = false;
      cancelAnimationFrame(raf);
      suono?.sfuma();
      window.removeEventListener('keydown', tasto);
    };
  }, [chiudi]);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: '#000', cursor: 'none', overflow: 'hidden', userSelect: 'none' }}
      aria-label="Runtime Multimedia"
      onClick={chiudi}
    >
      <LogoRuntime ref={logo} />
    </div>
  );
};

export default RuntimeIntro;
