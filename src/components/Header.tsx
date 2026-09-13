import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  FlagDE, FlagEN, IconApps, IconBlog, IconContact, IconFaith, IconGames,
} from './Icons'
import { useApp } from '../lib/state'
import type { Theme } from '../lib/theme'

const THEME_BUTTONS: { key: Theme; icon: string; de: string; en: string }[] = [
  { key: 'os', icon: '◐', de: 'System', en: 'System' },
  { key: 'light', icon: '☀', de: 'Hell', en: 'Light' },
  { key: 'dark', icon: '☾', de: 'Dunkel', en: 'Dark' },
]

export function Header() {
  const { t, lang, setLang, theme, setTheme, blessing } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  /* The two grid headings live on the home page. From anywhere else, go home
   * first and scroll once the section actually exists in the DOM. */
  const jump = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    const scroll = () => {
      const el = document.getElementById(id)
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' })
    }
    if (location.pathname !== '/') {
      navigate('/')
      requestAnimationFrame(() => requestAnimationFrame(scroll))
    } else {
      scroll()
    }
  }

  return (
    <header className="hdr">
      <Link to="/" className="hdr__brand">
        <img className="hdr__avatar" src="/avatar.webp" alt="" width={52} height={52} />
        <span className="hdr__names">
          <span className="hdr__word">
            schäfchens<em>.de</em>
          </span>
          <span className="hdr__blessing">
            {blessing.text}
            <span className="hdr__blessingEmoji">{blessing.emoji}</span>
          </span>
        </span>
      </Link>

      <nav className="hdr__nav">
        <a href="/#apps" onClick={jump('apps')}>
          <IconApps />
          {t.navApps}
        </a>
        <a href="/#games" onClick={jump('games')}>
          <IconGames />
          {t.navGames}
        </a>
        <Link to="/glaube">
          <IconFaith />
          {t.navFaith}
        </Link>
        <Link to="/kontakt">
          <IconContact />
          {t.navContact}
        </Link>
        <a href="https://blog.schaefchens.de" target="_blank" rel="noreferrer noopener">
          <IconBlog />
          {t.navBlog}
        </a>
      </nav>

      <div className="seg" role="group" aria-label={lang === 'de' ? 'Farbschema' : 'Colour scheme'}>
        {THEME_BUTTONS.map((b) => (
          <button
            key={b.key}
            type="button"
            aria-pressed={theme === b.key}
            title={lang === 'de' ? b.de : b.en}
            onClick={() => setTheme(b.key)}
          >
            <span aria-hidden="true">{b.icon}</span>
            <span className="sr-only">{lang === 'de' ? b.de : b.en}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="btn-ghost btn-lang"
        onClick={() => setLang(lang === 'de' ? 'en' : 'de')}
        lang={lang === 'de' ? 'en' : 'de'}
        title={lang === 'de' ? 'Switch to English' : 'Auf Deutsch umschalten'}
      >
        {lang === 'de' ? <FlagEN /> : <FlagDE />}
        {lang === 'de' ? 'EN' : 'DE'}
      </button>
    </header>
  )
}
