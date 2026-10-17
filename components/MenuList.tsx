import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as soundService from '../services/soundService';

export interface MenuItem {
  id: string;
  label: string;
  disabled?: boolean;
}

interface MenuListProps {
  items: MenuItem[];
  onSelect: (id: string) => void;
  /** Escape (or the pad's B) is pressed. */
  onBack?: () => void;
  /** False while something else (an options screen above) has the keys. */
  active?: boolean;
  /** Which item starts with the focus (the first one that is not disabled by default). */
  initialId?: string;
  size?: 'md' | 'lg';
  width?: number;
}

/**
 * A vertical menu: up and down (or W and S) move the focus, Enter or Space choose, Escape goes back; the mouse
 * works too. The game's pad is turned into those same keys (services/gamepadService.ts).
 */
const MenuList: React.FC<MenuListProps> = ({ items, onSelect, onBack, active = true, initialId, size = 'md', width = 520 }) => {
  const start = (() => {
    const at = initialId ? items.findIndex(i => i.id === initialId && !i.disabled) : -1;
    return at >= 0 ? at : Math.max(0, items.findIndex(i => !i.disabled));
  })();
  const [focus, setFocusState] = useState(start);
  const focusRef = useRef(start);
  const setFocus = useCallback((i: number) => {
    focusRef.current = i;
    setFocusState(i);
  }, []);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const select = useRef(onSelect);
  select.current = onSelect;
  const back = useRef(onBack);
  back.current = onBack;

  const move = useCallback(
    (delta: number) => {
      const list = itemsRef.current;
      for (let step = 1; step <= list.length; step++) {
        const next = (((focusRef.current + delta * step) % list.length) + list.length) % list.length;
        if (!list[next].disabled) {
          if (next !== focusRef.current) soundService.playSound('menuMove');
          setFocus(next);
          return;
        }
      }
    },
    [setFocus]
  );

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') {
        e.preventDefault();
        e.stopImmediatePropagation();
        move(-1);
      } else if (k === 'arrowdown' || k === 's') {
        e.preventDefault();
        e.stopImmediatePropagation();
        move(1);
      } else if ((k === 'enter' || k === ' ') && !e.repeat) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const item = itemsRef.current[focusRef.current];
        if (item && !item.disabled) {
          soundService.initAudio();
          soundService.playSound('start');
          // after this key press has finished, so the screen that opens does not also see it
          window.setTimeout(() => select.current(item.id), 0);
        }
      } else if (k === 'escape' && back.current) {
        e.preventDefault();
        e.stopImmediatePropagation();
        back.current();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [active, move]);

  const big = size === 'lg';
  return (
    <div className="flex flex-col gap-2" style={{ width }} role="menu">
      {items.map((item, i) => {
        const focused = i === focus && active;
        return (
          <button
            key={item.id}
            role="menuitem"
            disabled={item.disabled}
            onMouseEnter={() => !item.disabled && setFocus(i)}
            onClick={e => {
              e.stopPropagation();
              if (item.disabled) return;
              soundService.initAudio();
              soundService.playSound('start');
              select.current(item.id);
            }}
            className={`rounded-xl border-2 px-6 ${big ? 'py-3 text-3xl' : 'py-2 text-2xl'} font-black tracking-[0.18em] transition-colors ${
              item.disabled
                ? 'border-white/10 text-gray-600 cursor-not-allowed'
                : focused
                ? 'border-yellow-300 bg-gradient-to-r from-orange-500/90 via-pink-600/90 to-purple-600/90 text-white shadow-[0_0_28px_rgba(255,145,0,0.55)]'
                : 'border-cyan-500/35 bg-[#0b0420]/80 text-cyan-200 hover:text-white'
            }`}
          >
            {focused ? '▶ ' : ''}
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default MenuList;
