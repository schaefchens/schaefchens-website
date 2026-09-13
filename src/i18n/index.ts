import { de } from './de'
import { en } from './en'
import type { Strings } from './types'

export type { Strings, Section } from './types'
export type Lang = 'de' | 'en'

export const LANGS: Lang[] = ['de', 'en']
export const DEFAULT_LANG: Lang = 'de'

const dict: Record<Lang, Strings> = { de, en }

export const strings = (lang: Lang): Strings => dict[lang]

export const isLang = (v: unknown): v is Lang => v === 'de' || v === 'en'
