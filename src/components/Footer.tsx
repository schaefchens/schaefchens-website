import { Link } from 'react-router-dom'
import { useApp } from '../lib/state'

export function Footer() {
  const { t } = useApp()
  return (
    <footer className="footer">
      <span className="footer__tag">schäfchens.de — {t.footTag}</span>
      <span className="footer__links">
        <a href="https://blog.schaefchens.de" target="_blank" rel="noreferrer noopener">
          blog.schaefchens.de
        </a>
        <a href="https://github.com/schaefchens" target="_blank" rel="noreferrer noopener">
          github.com/schaefchens
        </a>
        <Link to="/glaube">{t.navFaith}</Link>
        <Link to="/kontakt">{t.navContact}</Link>
        <Link to="/impressum">{t.imprint}</Link>
        <Link to="/datenschutz">{t.privacy}</Link>
      </span>
    </footer>
  )
}
