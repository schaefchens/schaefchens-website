import { Link } from 'react-router-dom'
import { useApp } from '../lib/state'

/* Lifted off the home page, which had grown into a scroll of panels. The
 * licence is reference material: people come to it deliberately, from the
 * footer, rather than meeting it on the way to the catalogue. */
export function Licence() {
  const { t } = useApp()

  return (
    <main className="prose prose--wide">
      <Link className="detail__back" to="/">
        {t.back}
      </Link>
      <p className="kicker" style={{ marginTop: 22 }}>
        {t.licKicker}
      </p>
      <h1 style={{ marginTop: 0 }}>{t.licTitle}</h1>
      <p className="prose__lead">{t.licBody}</p>

      <ul className="ticks" style={{ marginTop: 34 }}>
        {t.licPoints.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>

      <div className="lic__actions">
        <a
          className="pill pill--accent"
          href="https://polyformproject.org/licenses/noncommercial/1.0.0/"
          target="_blank"
          rel="noreferrer noopener"
        >
          {t.licCta}
        </a>
        <a className="pill" href="https://github.com/schaefchens" target="_blank" rel="noreferrer noopener">
          github.com/schaefchens
        </a>
      </div>
    </main>
  )
}
