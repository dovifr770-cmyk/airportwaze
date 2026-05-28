// ── useRTL — RTL style utilities ──────────────────────────
import { useTranslation } from 'react-i18next';
import { I18nManager } from 'react-native';
import { RTL_LANGUAGES, type SupportedLanguage } from '../i18n';

export interface RTLUtils {
  /** True when the current language is RTL */
  isRTL: boolean;
  /** 'row-reverse' for RTL, 'row' for LTR */
  flexDir: 'row' | 'row-reverse';
  /** 'right' for RTL, 'left' for LTR */
  textAlign: 'right' | 'left';
  /** Use instead of marginLeft — respects direction */
  marginStart: (value: number) => { marginLeft?: number; marginRight?: number };
  /** Use instead of marginRight — respects direction */
  marginEnd:   (value: number) => { marginLeft?: number; marginRight?: number };
  /** Use instead of paddingLeft — respects direction */
  paddingStart: (value: number) => { paddingLeft?: number; paddingRight?: number };
  /** Use instead of paddingRight — respects direction */
  paddingEnd:   (value: number) => { paddingLeft?: number; paddingRight?: number };
  /** Flip icons horizontally for RTL (scale X = -1) */
  iconScale: { transform: [{ scaleX: number }] };
  /** Absolute-positioned left for LTR / right for RTL */
  absStart: (value: number) => { left?: number; right?: number };
  /** Absolute-positioned right for LTR / left for RTL */
  absEnd:   (value: number) => { left?: number; right?: number };
}

export function useRTL(): RTLUtils {
  const { i18n } = useTranslation();
  const isRTL = RTL_LANGUAGES.includes(i18n.language as SupportedLanguage);

  return {
    isRTL,
    flexDir:   isRTL ? 'row-reverse' : 'row',
    textAlign: isRTL ? 'right'       : 'left',

    marginStart: (v) => isRTL ? { marginRight: v } : { marginLeft:  v },
    marginEnd:   (v) => isRTL ? { marginLeft:  v } : { marginRight: v },
    paddingStart:(v) => isRTL ? { paddingRight: v }: { paddingLeft:  v },
    paddingEnd:  (v) => isRTL ? { paddingLeft:  v }: { paddingRight: v },

    iconScale:   { transform: [{ scaleX: isRTL ? -1 : 1 }] },

    absStart: (v) => isRTL ? { right: v } : { left:  v },
    absEnd:   (v) => isRTL ? { left:  v } : { right: v },
  };
}
