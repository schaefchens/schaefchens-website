import { DEFAULT_LANG, isLang, type Lang } from '../i18n'

export const LANG_KEY = 'sch-lang'

/** Stored choice, else the browser's preference, else German. */
export function readLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_KEY)
    if (isLang(stored)) return stored
  } catch {
    /* storage blocked — fall through to the browser preference */
  }
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : DEFAULT_LANG
}

export function applyLang(lang: Lang): void {
  document.documentElement.lang = lang
  try {
    localStorage.setItem(LANG_KEY, lang)
  } catch {
    /* nothing to do */
  }
}
