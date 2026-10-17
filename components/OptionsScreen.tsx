import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as soundService from '../services/soundService';
import { CONTROLS, RESERVED_KEYS, normaliseKey, type Control } from '../engine/input';
import { bindKey, clearKey, keyLabel, resetBindings, updateSettings, useSettings, SHAKE_LEVELS, type Settings } from '../services/settings';
import { LANGUAGES, setLanguage, t, useLanguage, type Language } from '../services/i18n';
import { toggleFullscreen } from '../services/platform';
import type { TextKey } from '../locales/it';

interface OptionsScreenProps {
  onClose: () => void;
}

type Tab = 'audio' | 'graphics' | 'controls' | 'game' | 'language' | 'access';
const TABS: Tab[] = ['audio', 'graphics', 'controls', 'game', 'language', 'access'];

interface RowBase {
  id: string;
  label: string;
  help?: string;
}
type Row =
  | (RowBase & { kind: 'slider'; value: number; set: (v: number) => void })
  | (RowBase & { kind: 'toggle'; value: boolean; set: (v: boolean) => void })
  | (RowBase & { kind: 'choice'; options: { value: string; label: string }[]; value: string; set: (v: string) => void })
  | (RowBase & { kind: 'action'; run: () => void })
  | (RowBase & { kind: 'key'; control: Control });

const STEP = 5;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const CONTROL_LABEL: Record<Control, TextKey> = {
  left: 'options.ctrl.left',
  right: 'options.ctrl.right',
  up: 'options.ctrl.up',
  down: 'options.ctrl.down',
  jump: 'options.ctrl.jump',
  capture: 'options.ctrl.capture',
  shoot: 'options.ctrl.shoot',
};
const LANGUAGE_NAME: Record<Language, string> = { it: 'Italiano', en: 'English' };

/** Keys that may be given to a control: letters and digits, arrows, Shift, Ctrl, Alt and a few more. */
const NAMED_KEYS = ['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'shift', 'control', 'alt', 'backspace', 'delete', 'home', 'end', 'pageup', 'pagedown', 'insert'];
export const bindableKey = (key: string): boolean => key.length === 1 || NAMED_KEYS.includes(key);

function rowsFor(tab: Tab, s: Settings, lang: Language, refresh: () => void): Row[] {
  switch (tab) {
    case 'audio':
      return [
        { kind: 'slider', id: 'master', label: t('options.audio.master'), value: Math.round(soundService.getVolume('master') * 100), set: v => { soundService.setVolume('master', v / 100); refresh(); } },
        { kind: 'slider', id: 'music', label: t('options.audio.music'), value: Math.round(soundService.getVolume('music') * 100), set: v => { soundService.setVolume('music', v / 100); refresh(); } },
        { kind: 'slider', id: 'sfx', label: t('options.audio.sfx'), value: Math.round(soundService.getVolume('sfx') * 100), set: v => { soundService.setVolume('sfx', v / 100); soundService.playSound('menuMove'); refresh(); } },
        { kind: 'toggle', id: 'mute', label: t('options.audio.mute'), value: soundService.isMuted(), set: v => { soundService.setMuted(v); refresh(); } },
      ];
    case 'graphics':
      return [
        {
          kind: 'choice',
          id: 'quality',
          label: t('options.gfx.quality'),
          value: s.quality,
          options: [
            { value: 'high', label: t('options.gfx.high') },
            { value: 'low', label: t('options.gfx.low') },
          ],
          set: v => updateSettings({ quality: v === 'low' ? 'low' : 'high' }),
        },
        { kind: 'toggle', id: 'autoQuality', label: t('options.gfx.auto'), help: t('options.gfx.autoHelp'), value: s.autoQuality, set: v => updateSettings({ autoQuality: v }) },
        { kind: 'action', id: 'fullscreen', label: t('options.gfx.fullscreen'), run: () => void toggleFullscreen() },
      ];
    case 'controls':
      return [
        ...CONTROLS.map(c => ({ kind: 'key' as const, id: `key-${c}`, label: t(CONTROL_LABEL[c]), control: c })),
        { kind: 'action', id: 'resetKeys', label: t('options.ctrl.reset'), run: () => { resetBindings(); refresh(); } },
      ];
    case 'game':
      return [
        {
          kind: 'choice',
          id: 'difficulty',
          label: t('options.game.difficulty'),
          help: t('options.game.help'),
          value: s.difficulty,
          options: [
            { value: 'easy', label: t('options.game.easy') },
            { value: 'normal', label: t('options.game.normal') },
            { value: 'hard', label: t('options.game.hard') },
          ],
          set: v => updateSettings({ difficulty: v === 'easy' ? 'easy' : v === 'hard' ? 'hard' : 'normal' }),
        },
      ];
    case 'language':
      return [
        {
          kind: 'choice',
          id: 'language',
          label: t('options.language.label'),
          value: lang,
          options: LANGUAGES.map(l => ({ value: l, label: LANGUAGE_NAME[l] })),
          set: v => setLanguage(v === 'en' ? 'en' : 'it'),
        },
      ];
    case 'access':
      return [
        {
          kind: 'choice',
          id: 'shake',
          label: t('options.access.shake'),
          value: String(s.shake),
          options: SHAKE_LEVELS.map(l => ({ value: String(l), label: t(`options.access.shake${l}` as TextKey) })),
          set: v => updateSettings({ shake: (SHAKE_LEVELS.find(l => String(l) === v) ?? 100) }),
        },
        { kind: 'toggle', id: 'flashes', label: t('options.access.flashes'), help: t('options.access.flashesHelp'), value: s.flashes, set: v => updateSettings({ flashes: v }) },
        { kind: 'toggle', id: 'hitStop', label: t('options.access.hitStop'), value: s.hitStop, set: v => updateSettings({ hitStop: v }) },
        { kind: 'toggle', id: 'reduceMotion', label: t('options.access.motion'), help: t('options.access.motionHelp'), value: s.reduceMotion, set: v => updateSettings({ reduceMotion: v }) },
      ];
  }
}

/**
 * The options, in tabs: audio, graphics, controls (keys, two per control), language and accessibility. Up and
 * down move through the rows (the first one is the row of tabs, left and right change tab), left and right
 * change a value, Enter acts, Escape closes. It listens on the capture phase and swallows the keys it uses, so
 * the screen underneath does not also react to them. The pad is turned into those keys elsewhere.
 */
const OptionsScreen: React.FC<OptionsScreenProps> = ({ onClose }) => {
  const settings = useSettings();
  const language = useLanguage();
  const [tab, setTab] = useState(0);
  const [row, setRow] = useState(0); // 0 = the row of tabs, 1.. = the rows of the tab
  const [slot, setSlot] = useState<0 | 1>(0);
  const [listening, setListening] = useState<{ control: Control; slot: 0 | 1 } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick(n => n + 1), []);

  const rows = rowsFor(TABS[tab], settings, language, refresh);

  const live = useRef({ tab, row, slot, listening, rows, settings });
  live.current = { tab, row, slot, listening, rows, settings };

  const go = useCallback((setter: () => void) => {
    soundService.playSound('menuMove');
    setter();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = live.current;
      const k = e.key.toLowerCase();

      // waiting for the key the player wants to give to a control
      if (st.listening) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (e.repeat) return;
        if (k === 'escape') {
          setListening(null);
          setMessage(null);
          return;
        }
        const key = normaliseKey(e);
        if (RESERVED_KEYS.includes(key) || !bindableKey(key)) {
          setMessage(t('options.ctrl.reserved'));
          return;
        }
        const next = bindKey(st.settings.bindings, st.listening.control, st.listening.slot, key);
        if (!next) {
          setMessage(t('options.ctrl.taken'));
          return;
        }
        updateSettings({ bindings: next });
        soundService.playSound('collect');
        setListening(null);
        setMessage(null);
        return;
      }

      const handled = ['escape', 'o', 'm', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'enter', ' ', 'backspace', 'delete'];
      if (!handled.includes(k)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.repeat && (k === 'escape' || k === 'o' || k === 'm' || k === 'enter' || k === ' ')) return;
      setMessage(null);

      if (k === 'escape' || k === 'o') return onClose();
      if (k === 'm') {
        soundService.toggleMuted();
        return refresh();
      }
      if (k === 'arrowup') return go(() => setRow(r => (r + st.rows.length) % (st.rows.length + 1)));
      if (k === 'arrowdown') return go(() => setRow(r => (r + 1) % (st.rows.length + 1)));

      // the row of tabs
      if (st.row === 0) {
        if (k === 'arrowleft') go(() => { setTab(i => (i + TABS.length - 1) % TABS.length); setSlot(0); });
        else if (k === 'arrowright') go(() => { setTab(i => (i + 1) % TABS.length); setSlot(0); });
        return;
      }

      const r = st.rows[st.row - 1];
      if (!r) return;
      const dir = k === 'arrowleft' ? -1 : k === 'arrowright' ? 1 : 0;
      switch (r.kind) {
        case 'slider':
          if (dir) r.set(clamp(r.value + dir * STEP, 0, 100));
          break;
        case 'toggle':
          if (dir || k === 'enter' || k === ' ') r.set(!r.value);
          break;
        case 'choice': {
          if (!dir && k !== 'enter' && k !== ' ') break;
          const at = Math.max(0, r.options.findIndex(o => o.value === r.value));
          const step = dir || 1;
          r.set(r.options[(at + step + r.options.length) % r.options.length].value);
          soundService.playSound('menuMove');
          break;
        }
        case 'action':
          if (k === 'enter' || k === ' ') r.run();
          break;
        case 'key': {
          if (dir) {
            setSlot(s => (s === 0 ? 1 : 0));
            soundService.playSound('menuMove');
          } else if (k === 'enter' || k === ' ') {
            setListening({ control: r.control, slot: st.slot });
          } else if (k === 'backspace' || k === 'delete') {
            updateSettings({ bindings: clearKey(st.settings.bindings, r.control, st.slot) });
          }
          break;
        }
      }
      refresh();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose, go, refresh]);

  const focusedRow = row > 0 ? rows[row - 1] : undefined;

  return (
    <div
      className="absolute inset-0 z-[70] flex items-center justify-center bg-[#050114] text-white"
      onClick={e => e.stopPropagation()}
    >
      <div className="w-[1180px] rounded-3xl border-2 border-cyan-400/60 bg-[#0b0420] px-10 py-8 shadow-[0_0_45px_rgba(0,229,255,0.25)]">
        <h2 className="mb-5 text-center text-5xl font-black tracking-widest text-cyan-300" style={{ textShadow: '0 0 20px #00e5ff' }}>
          {t('options.title')}
        </h2>

        {/* the row of tabs */}
        <div className={`mb-5 flex justify-center gap-3 rounded-2xl border-2 p-2 ${row === 0 ? 'border-yellow-300' : 'border-transparent'}`}>
          {TABS.map((id, i) => (
            <button
              key={id}
              onClick={() => { setTab(i); setRow(0); }}
              className={`rounded-xl px-5 py-2 text-lg font-black tracking-widest ${
                i === tab ? 'bg-cyan-400/25 text-yellow-300 border border-yellow-300/70' : 'border border-transparent text-cyan-200/80 hover:text-white'
              }`}
            >
              {t(`options.tab.${id}` as TextKey)}
            </button>
          ))}
        </div>

        <div className="space-y-2" style={{ minHeight: 400 }}>
          {rows.map((r, i) => {
            const active = row === i + 1;
            return (
              <div
                key={r.id}
                onMouseEnter={() => setRow(i + 1)}
                className={`flex items-center justify-between gap-6 rounded-xl border px-5 py-2.5 ${
                  active ? 'border-yellow-300 bg-white/10' : 'border-transparent bg-white/5'
                }`}
              >
                <span className={`w-[470px] whitespace-nowrap text-lg font-bold tracking-wider ${active ? 'text-yellow-300' : 'text-cyan-200'}`}>
                  {r.label}
                </span>
                {r.kind === 'slider' && (
                  <>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={STEP}
                      value={r.value}
                      onChange={e => r.set(Number(e.target.value))}
                      className="h-2 flex-1 cursor-pointer accent-cyan-400"
                      aria-label={r.label}
                    />
                    <span className="w-14 text-right font-mono text-lg">{r.value}%</span>
                  </>
                )}
                {r.kind === 'toggle' && (
                  <button
                    onClick={() => r.set(!r.value)}
                    className={`rounded-lg border-2 px-6 py-0.5 text-lg font-black tracking-widest ${
                      r.value ? 'border-cyan-400 text-cyan-300' : 'border-pink-400 text-pink-300'
                    }`}
                  >
                    {r.value ? t('options.yes') : t('options.no')}
                  </button>
                )}
                {r.kind === 'choice' && (
                  <div className="flex gap-2">
                    {r.options.map(o => (
                      <button
                        key={o.value}
                        onClick={() => r.set(o.value)}
                        className={`rounded-lg border-2 px-5 py-0.5 text-lg font-black tracking-widest ${
                          o.value === r.value ? 'border-yellow-300 bg-yellow-300/15 text-yellow-300' : 'border-white/20 text-gray-300 hover:text-white'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
                {r.kind === 'action' && (
                  <button onClick={r.run} className="rounded-lg border-2 border-cyan-400 px-6 py-0.5 text-lg font-black tracking-widest text-cyan-300">
                    ↵
                  </button>
                )}
                {r.kind === 'key' && (
                  <div className="flex gap-3">
                    {[0, 1].map(sl => {
                      const key = settings.bindings[r.control][sl];
                      const isListening = listening?.control === r.control && listening.slot === sl;
                      const isSlot = active && slot === sl;
                      return (
                        <button
                          key={sl}
                          onClick={() => { setRow(i + 1); setSlot(sl as 0 | 1); setListening({ control: r.control, slot: sl as 0 | 1 }); }}
                          className={`min-w-[130px] rounded-lg border-2 px-4 py-0.5 text-lg font-black tracking-widest ${
                            isListening
                              ? 'border-pink-400 bg-pink-500/20 text-pink-200 animate-pulse'
                              : isSlot
                              ? 'border-yellow-300 text-yellow-300'
                              : 'border-white/20 text-gray-200'
                          }`}
                        >
                          {isListening ? '...' : key ? keyLabel(key) : '—'}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {TABS[tab] === 'controls' && (
            <p className="px-2 pt-2 text-sm leading-relaxed text-gray-300">{t('options.ctrl.pad')}</p>
          )}
        </div>

        <p className={`mt-3 h-6 text-center text-sm font-bold tracking-wider ${message || listening ? 'text-pink-300' : 'text-gray-400'}`}>
          {listening ? message ?? t('options.ctrl.listening') : message ?? focusedRow?.help ?? (TABS[tab] === 'controls' ? t('options.ctrl.help') : '')}
        </p>
        <p className="mt-2 text-center text-sm text-gray-300">{t('options.hint')}</p>
      </div>
    </div>
  );
};

export default OptionsScreen;
