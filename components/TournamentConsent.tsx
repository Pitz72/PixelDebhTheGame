import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as soundService from '../services/soundService';
import { t, useLanguage } from '../services/i18n';
import { openPage } from '../services/platform';
import { PRIVACY_URL, enableTournament, proposedInitials } from '../services/tournament';

interface TournamentConsentProps {
  /** The player said yes: the switch is on. */
  onDone: () => void;
  /** The player went back without turning it on. */
  onCancel: () => void;
}

type RowId = 'age' | 'initials' | 'privacy' | 'confirm' | 'cancel';
const ROWS: RowId[] = ['age', 'initials', 'privacy', 'confirm', 'cancel'];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * What the player sees when they turn on «Take part in PixelDebh tournaments»: what the game sends and which games
 * count, the «I am at least 14» confirmation (off until they set it), the three letters (proposed: the last ones used in
 * the high scores), the link to the site's privacy notice, then TAKE PART or CANCEL.
 *
 * Keys: up and down move through the rows; on the initials, Enter starts changing them (up and down change the letter,
 * left and right move, Enter or Escape stop), and typing letters works at any moment. It listens on the capture phase
 * and swallows the keys it uses, like the options screen under it (which leaves the keys alone while this is open).
 */
const TournamentConsent: React.FC<TournamentConsentProps> = ({ onDone, onCancel }) => {
  useLanguage();
  const [age, setAge] = useState(false);
  const [letters, setLetters] = useState<string[]>(() => proposedInitials().split(''));
  const [cursor, setCursor] = useState(0);
  const [editing, setEditing] = useState(false);
  const [row, setRow] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const live = useRef({ age, letters, cursor, editing, row });
  live.current = { age, letters, cursor, editing, row };

  const changeLetter = useCallback((at: number, dir: number) => {
    soundService.playSound('collect');
    setLetters(ls => {
      const next = [...ls];
      next[at] = ALPHABET[(ALPHABET.indexOf(next[at]) + dir + ALPHABET.length) % ALPHABET.length];
      return next;
    });
  }, []);

  const typeLetter = useCallback((letter: string) => {
    soundService.playSound('collect');
    const at = live.current.cursor;
    setLetters(ls => ls.map((l, i) => (i === at ? letter : l)));
    setCursor(c => Math.min(2, c + 1));
  }, []);

  const confirm = useCallback(() => {
    const st = live.current;
    if (!st.age) {
      soundService.playSound('menuMove');
      setMessage(t('tournament.needAge'));
      setRow(0);
      return;
    }
    if (!enableTournament(st.letters.join(''))) return;
    soundService.playSound('start');
    onDone();
  }, [onDone]);

  const act = useCallback(
    (id: RowId) => {
      switch (id) {
        case 'age':
          soundService.playSound('menuMove');
          setAge(a => !a);
          break;
        case 'initials':
          soundService.playSound('menuMove');
          setEditing(e => !e);
          break;
        case 'privacy':
          void openPage(PRIVACY_URL);
          break;
        case 'confirm':
          confirm();
          break;
        case 'cancel':
          onCancel();
          break;
      }
    },
    [confirm, onCancel]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = live.current;
      const k = e.key.toLowerCase();
      const onInitials = ROWS[st.row] === 'initials';
      const letter = onInitials && /^[a-z]$/.test(k) && !e.ctrlKey && !e.altKey && !e.metaKey;
      const handled = ['escape', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'enter', ' ', 'backspace'];
      if (!letter && !handled.includes(k)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.repeat && (k === 'escape' || k === 'enter' || k === ' ')) return;
      setMessage(null);

      if (letter) return typeLetter(k.toUpperCase());

      if (st.editing) {
        if (k === 'escape' || k === 'enter' || k === ' ') setEditing(false);
        else if (k === 'arrowup') changeLetter(st.cursor, 1);
        else if (k === 'arrowdown') changeLetter(st.cursor, -1);
        else if (k === 'arrowleft' || k === 'backspace') setCursor(c => Math.max(0, c - 1));
        else if (k === 'arrowright') setCursor(c => Math.min(2, c + 1));
        return;
      }

      if (k === 'escape') return onCancel();
      if (k === 'arrowup' || k === 'arrowdown') {
        soundService.playSound('menuMove');
        setRow(r => (r + (k === 'arrowup' ? ROWS.length - 1 : 1)) % ROWS.length);
        return;
      }
      const id = ROWS[st.row];
      if (id === 'age' && (k === 'arrowleft' || k === 'arrowright')) return act('age');
      if (id === 'initials' && (k === 'arrowleft' || k === 'arrowright')) {
        soundService.playSound('menuMove');
        setCursor(c => Math.max(0, Math.min(2, c + (k === 'arrowleft' ? -1 : 1))));
        return;
      }
      if (k === 'enter' || k === ' ') act(id);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [act, changeLetter, onCancel, typeLetter]);

  const rowLabel: Record<RowId, string> = {
    age: t('tournament.age'),
    initials: t('tournament.initials'),
    privacy: t('tournament.privacy'),
    confirm: t('tournament.confirm'),
    cancel: t('tournament.cancel'),
  };
  const help: Partial<Record<RowId, string>> = {
    age: t('tournament.ageHelp'),
    initials: t('tournament.initialsHelp'),
    privacy: t('tournament.privacyHelp'),
  };

  return (
    <div className="absolute inset-0 z-80 flex items-center justify-center bg-[#050114]/95" onClick={e => e.stopPropagation()}>
      <div className="w-[1180px] rounded-3xl border-2 border-yellow-300/70 bg-[#0b0420] px-12 py-8 shadow-[0_0_45px_rgba(253,224,71,0.2)]">
        <h2 className="mb-5 text-center text-4xl font-black tracking-widest text-yellow-300" style={{ textShadow: '0 0 18px rgba(253,224,71,0.6)' }}>
          {t('tournament.title')}
        </h2>
        <div className="mb-5 space-y-2 text-lg leading-relaxed text-gray-200">
          <p>{t('tournament.text1')}</p>
          <p>{t('tournament.text2')}</p>
          <p className="text-cyan-200">{t('tournament.text3')}</p>
        </div>

        <div className="space-y-2">
          {ROWS.map((id, i) => {
            const active = row === i;
            return (
              <div
                key={id}
                onMouseEnter={() => !editing && setRow(i)}
                className={`flex items-center justify-between gap-6 rounded-xl border px-5 py-2 ${
                  active ? 'border-yellow-300 bg-white/10' : 'border-transparent bg-white/5'
                }`}
              >
                <span className={`whitespace-nowrap text-lg font-bold tracking-wider ${active ? 'text-yellow-300' : 'text-cyan-200'}`}>
                  {rowLabel[id]}
                </span>
                {id === 'age' && (
                  <button
                    onClick={() => { setRow(i); act('age'); }}
                    className={`rounded-lg border-2 px-6 py-0.5 text-lg font-black tracking-widest ${
                      age ? 'border-cyan-400 text-cyan-300' : 'border-pink-400 text-pink-300'
                    }`}
                  >
                    {age ? t('options.yes') : t('options.no')}
                  </button>
                )}
                {id === 'initials' && (
                  <div className="flex items-center gap-3">
                    {letters.map((l, at) => {
                      const here = active && cursor === at;
                      return (
                        <div key={at} className="flex flex-col items-center">
                          <button aria-label="▲" onClick={() => { setRow(i); setCursor(at); changeLetter(at, 1); }} className="text-xs leading-none text-cyan-300/80 hover:text-white">▲</button>
                          <button
                            onClick={() => { setRow(i); setCursor(at); }}
                            className={`my-0.5 flex h-12 w-11 items-center justify-center rounded-lg border-2 bg-slate-950 text-3xl font-black ${
                              here && editing
                                ? 'border-pink-400 text-pink-200 shadow-[0_0_14px_rgba(244,114,182,0.6)]'
                                : here
                                ? 'border-yellow-300 text-yellow-200'
                                : 'border-slate-600 text-white'
                            }`}
                          >
                            {l}
                          </button>
                          <button aria-label="▼" onClick={() => { setRow(i); setCursor(at); changeLetter(at, -1); }} className="text-xs leading-none text-cyan-300/80 hover:text-white">▼</button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {id === 'privacy' && (
                  <button onClick={() => { setRow(i); act('privacy'); }} className="rounded-lg border-2 border-cyan-400 px-5 py-0.5 text-base font-bold tracking-wider text-cyan-300">
                    pixeldebh.it/privacy ↗
                  </button>
                )}
                {(id === 'confirm' || id === 'cancel') && (
                  <button
                    onClick={() => { setRow(i); act(id); }}
                    className={`rounded-lg border-2 px-6 py-0.5 text-lg font-black tracking-widest ${
                      id === 'confirm' ? 'border-yellow-300 text-yellow-300' : 'border-white/30 text-gray-300'
                    }`}
                  >
                    ↵
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className={`mt-3 h-6 text-center text-sm font-bold tracking-wider ${message ? 'text-pink-300' : 'text-gray-400'}`}>
          {message ?? help[ROWS[row]] ?? ''}
        </p>
        <p className="mt-2 text-center text-sm text-gray-300">{editing ? t('tournament.hintEdit') : t('tournament.hint')}</p>
      </div>
    </div>
  );
};

export default TournamentConsent;
