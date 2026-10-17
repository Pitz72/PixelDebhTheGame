import { TROPHY_NUMBER, type TrophyDef, type TrophyTier } from '../trophies';
import { getLanguage, t } from './i18n';
import type { TextKey } from '../locales/it';

/** The name of a trophy in the current language. */
export const trophyName = (def: Pick<TrophyDef, 'id'>): string => t(`trophy.${def.id}.name` as TextKey);

/** What a trophy asks for, in the current language (the number in it is the one the condition uses). */
export function trophyDescription(def: Pick<TrophyDef, 'id'>): string {
  const n = TROPHY_NUMBER[def.id];
  const shown = n === undefined ? '' : def.id === 'high-score' ? n.toLocaleString(getLanguage() === 'it' ? 'it-IT' : 'en-US') : String(n);
  return t(`trophy.${def.id}.desc` as TextKey, { n: shown });
}

export const tierLabel = (tier: TrophyTier): string => t(`trophy.tier.${tier}` as TextKey);
