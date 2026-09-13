import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react'
import { strings, type Lang, type Strings } from '../i18n'
import { applyLang, readLang } from './lang'
import { applyTheme, readTheme, type Theme } from './theme'

interface AppState {
  lang: Lang
  setLang: (l: Lang) => void
  theme: Theme
  setTheme: (t: Theme) => void
  t: Strings
  /** Chosen once per page load, like the mockup did. */
  blessing: Blessing
}

export interface Blessing {
  text: string
  emoji: string
}

const Ctx = createContext<AppState | null>(null)

/* Praying hands for the blessing proper; a dove for the two greetings of peace.
 * The dove carries U+FE0F so it renders as emoji rather than a monochrome
 * dingbat — without it, several platforms fall back to the text glyph. */
const HANDS = '\u{1F64F}'
const DOVE = '\u{1F54A}\u{FE0F}'

const BLESSINGS: Record<Lang, Blessing[]> = {
  de: [
    { text: 'Gott segne dich', emoji: HANDS },
    { text: 'Shalom Shalom', emoji: DOVE },
    { text: 'Gnade und Friede mit dir', emoji: DOVE },
  ],
  en: [
    { text: 'God bless you', emoji: HANDS },
    { text: 'Shalom Shalom', emoji: DOVE },
    { text: 'Grace and peace to you', emoji: DOVE },
  ],
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang)
  const [theme, setThemeState] = useState<Theme>(readTheme)
  // Index rather than the string itself, so switching language keeps the same
  // blessing rather than re-rolling it mid-visit.
  const [blessingIndex] = useState(() => Math.floor(Math.random() * 3))

  const setLang = useCallback((l: Lang) => {
    applyLang(l)
    setLangState(l)
  }, [])

  const setTheme = useCallback((t: Theme) => {
    applyTheme(t)
    setThemeState(t)
  }, [])

  const value = useMemo<AppState>(() => {
    const pool = BLESSINGS[lang]
    return {
      lang,
      setLang,
      theme,
      setTheme,
      t: strings(lang),
      blessing: pool[blessingIndex % pool.length] ?? pool[0]!,
    }
  }, [lang, theme, setLang, setTheme, blessingIndex])

  return <Ctx value={value}>{children}</Ctx>
}

export function useApp(): AppState {
  const v = use(Ctx)
  if (!v) throw new Error('useApp must be used inside <AppStateProvider>')
  return v
}
