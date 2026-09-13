/* Theme is one of three states, kept in localStorage under `sch-theme`.
 *
 * "os" is the absence of a data-theme attribute, which lets the CSS decide from
 * prefers-color-scheme. "light"/"dark" stamp the attribute and win over the OS.
 * index.html re-implements the read in a tiny inline script that runs before
 * first paint — without it the page flashes dark before React mounts. Keep the
 * two in step: the key and the attribute name are the contract between them. */

export type Theme = 'os' | 'light' | 'dark'

export const THEME_KEY = 'sch-theme'

export const isTheme = (v: unknown): v is Theme => v === 'os' || v === 'light' || v === 'dark'

export function readTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return isTheme(v) ? v : 'os'
  } catch {
    // Private browsing, or storage blocked entirely. Fall back to the OS.
    return 'os'
  }
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  if (theme === 'os') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // Not being able to remember the choice is survivable; applying it is not.
  }
}
