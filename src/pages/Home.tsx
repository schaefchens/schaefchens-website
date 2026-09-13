import { Link } from 'react-router-dom'
import { AppCard, SoonCard } from '../components/AppCard'
import { byKind } from '../content/catalogue'
import { useApp } from '../lib/state'

/* Four real entries means two per grid, which looks thin. Set this to false
 * once there are three or more of a kind and the padding tile can go. */
const SHOW_COMING_SOON = true

export function Home() {
  const { t } = useApp()
  const apps = byKind('app')
  const games = byKind('game')

  return (
    <main>
      <section className="hero">
        <p className="kicker">{t.kicker}</p>
        <h1>{t.heroTitle}</h1>
        <p>{t.heroSub}</p>
        <div className="chips">
          <span className="chip chip--accent">{t.chipFree}</span>
          <span className="chip">{t.chipPlatforms}</span>
        </div>
      </section>

      <div className="wrap" style={{ paddingBottom: 96 }}>
        <div className="section" id="apps">
          <div className="section__head">
            <h2>{t.appsTitle}</h2>
            <span>{t.appsNote}</span>
          </div>
          <div className="grid">
            {apps.map((e) => (
              <AppCard key={e.id} entry={e} />
            ))}
            {SHOW_COMING_SOON && <SoonCard kind="app" />}
          </div>
        </div>

        <div className="section" id="games">
          <div className="section__head">
            <h2>{t.gamesTitle}</h2>
            <span>{t.gamesNote}</span>
          </div>
          <div className="grid">
            {games.map((e) => (
              <AppCard key={e.id} entry={e} />
            ))}
            {SHOW_COMING_SOON && <SoonCard kind="game" />}
          </div>
        </div>

        <div className="panel panel--split" id="about">
          <div className="about__portrait">
            <img src="/avatar.webp" alt="" width={216} height={216} />
            <ul className="ticks">
              {t.aboutFacts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="kicker">{t.aboutKicker}</p>
            <h2>{t.aboutTitle}</h2>
            <p>{t.aboutBody}</p>
            <p>{t.aboutBody2}</p>
          </div>
        </div>

        <div className="panel panel--split" id="lizenz">
          <div>
            <p className="kicker">{t.licKicker}</p>
            <h2>{t.licTitle}</h2>
            <p>{t.licBody}</p>
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
          </div>
          <ul className="ticks">
            {t.licPoints.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>

        <div className="faith-teaser" id="glaube">
          <p className="kicker">{t.faithKicker}</p>
          <h2>{t.faithTitle}</h2>
          <p>{t.faithBody}</p>
          <div className="cta-row">
            <Link className="btn-solid" to="/glaube">
              {t.faithCta}
            </Link>
            <a className="btn-outline" href="https://blog.schaefchens.de" target="_blank" rel="noreferrer noopener">
              {t.blogCta}
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
